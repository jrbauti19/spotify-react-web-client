/* eslint-disable react-hooks/exhaustive-deps */
import { FC, memo, useCallback, useEffect, useRef } from 'react';
import { playerService } from '../../services/player';
import { spotifyActions } from '../../store/slices/spotify';
import { useAppDispatch } from '../../store/store';

export interface WebPlaybackProps {
  onPlayerError: (message: string) => void;
  onPlayerRequestAccessToken: () => Promise<string>;
  onPlayerLoading: () => void;
  onPlayerWaitingForDevice: (data: any) => void;
  onPlayerDeviceSelected: () => void;
  playerName: string;
  playerInitialVolume: number;
  playerRefreshRateMs?: number;
  playerAutoConnect?: boolean;
  children?: any;
}

const WebPlayback: FC<WebPlaybackProps> = memo((props) => {
  const dispatch = useAppDispatch();

  const { playerName, playerInitialVolume } = props;
  const { playerRefreshRateMs, playerAutoConnect, children } = props;
  const { onPlayerWaitingForDevice, onPlayerDeviceSelected } = props;
  const { onPlayerError, onPlayerLoading, onPlayerRequestAccessToken } = props;

  const webPlaybackInstance = useRef<Spotify.Player | null>(null);
  const statePollingInterval = useRef<NodeJS.Timeout | null>(null);
  const deviceSelectedInterval = useRef<NodeJS.Timeout | null>(null);

  const handleState = async (state: any | null) => {
    if (state) {
      dispatch(spotifyActions.setState({ state }));
    } else {
      clearStatePolling();
      await waitForDeviceToBeSelected();
    }
  };

  const waitForSpotify = useCallback(() => {
    return new Promise<void>((resolve) => {
      if ('Spotify' in window) {
        resolve();
      } else {
        // @ts-ignore
        window.onSpotifyWebPlaybackSDKReady = () => {
          resolve();
        };
      }
    });
  }, []);

  const waitForDeviceToBeSelected = () => {
    return new Promise((resolve) => {
      deviceSelectedInterval.current = setInterval(() => {
        if (webPlaybackInstance.current) {
          webPlaybackInstance.current.getCurrentState().then((state) => {
            if (state !== null) {
              startStatePolling();
              clearInterval(deviceSelectedInterval.current!);
              resolve(state);
            }
          });
        }
      });
    });
  };

  const startStatePolling = useCallback(() => {
    statePollingInterval.current = setInterval(async () => {
      const state = await webPlaybackInstance.current!.getCurrentState();
      await handleState(state);
    }, playerRefreshRateMs || 1000);
  }, [playerRefreshRateMs]);

  const clearStatePolling = useCallback(() => {
    if (statePollingInterval.current)
      clearInterval(statePollingInterval.current);
  }, []);

  // NEW: Verify device is active after transfer
  const verifyDeviceActive = async (
    deviceId: string,
    retries = 5,
  ): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      try {
        const token = await onPlayerRequestAccessToken();
        const response = await fetch(
          'https://api.spotify.com/v1/me/player/devices',
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const deviceData = await response.json();
          const activeDevice = deviceData.devices.find(
            (d: any) => d.is_active && d.id === deviceId,
          );

          if (activeDevice) {
            console.log('Device verified as active:', deviceId);
            return true;
          }
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error verifying device:', error);
      }
    }

    return false;
  };

  const setupWebPlaybackEvents = useCallback(async () => {
    let { Player } = window.Spotify;
    webPlaybackInstance.current = new Player({
      name: playerName,
      enableMediaSession: true,
      volume: playerInitialVolume,
      getOAuthToken: async (callback) => {
        const userAccessToken = await onPlayerRequestAccessToken();
        callback(userAccessToken);
      },
    });

    webPlaybackInstance.current.on('initialization_error', (e) => {
      console.log('initialization_error', e);
      onPlayerError(e.message);
    });

    webPlaybackInstance.current.on('authentication_error', (e) => {
      console.log('authentication_error', e);
      onPlayerError(e.message);
    });

    webPlaybackInstance.current.on('account_error', (e) => {
      console.log('account_error', e);
      onPlayerError(e.message);
    });

    webPlaybackInstance.current.on('playback_error', (e) => {
      console.log('playback_error', e);
      onPlayerError(e.message);
    });

    webPlaybackInstance.current.on('player_state_changed', async (state) => {
      console.log('Player state changed:', state);
      await handleState(state);
    });

    // UPDATED: Enhanced ready event handler with proper device verification
    webPlaybackInstance.current.on('ready', async (data) => {
      console.log('Player ready with device ID:', data.device_id);

      dispatch(spotifyActions.setDeviceId({ deviceId: data.device_id }));
      dispatch(spotifyActions.setDeviceReady({ ready: false })); // Set to false initially

      try {
        // Transfer playback to this device
        console.log('Transferring playback to device:', data.device_id);
        await playerService.transferPlayback(data.device_id);

        // Verify the device is actually active
        const isActive = await verifyDeviceActive(data.device_id);

        if (isActive) {
          dispatch(
            spotifyActions.setActiveDevice({ activeDevice: data.device_id }),
          );
          dispatch(spotifyActions.setDeviceReady({ ready: true }));
          console.log(
            'Device successfully activated and verified:',
            data.device_id,
          );
        } else {
          console.warn('Device transfer completed but device is not active');
          onPlayerError(
            'Failed to activate playback device. Please try refreshing.',
          );
        }
      } catch (error) {
        console.error('Failed to transfer playback:', error);
        onPlayerError('Failed to setup playback device. Please try again.');
      }
    });

    // Handle device disconnection
    webPlaybackInstance.current.on('not_ready', ({ device_id }) => {
      console.log('Device has gone offline', device_id);
      dispatch(spotifyActions.setDeviceReady({ ready: false }));
      dispatch(spotifyActions.setActiveDevice({ activeDevice: null }));
    });

    if (playerAutoConnect) {
      webPlaybackInstance.current.connect();
      dispatch(
        spotifyActions.setPlayer({ player: webPlaybackInstance.current }),
      );
    }
  }, [
    playerName,
    playerInitialVolume,
    playerAutoConnect,
    onPlayerRequestAccessToken,
    onPlayerError,
    handleState,
    dispatch,
    verifyDeviceActive,
  ]);

  const setupWaitingForDevice = useCallback(() => {
    return new Promise((resolve) => {
      webPlaybackInstance.current!.on('ready', (data) => {
        resolve(data);
      });
    });
  }, []);

  useEffect(() => {
    const initializePlayer = async () => {
      onPlayerLoading();
      await waitForSpotify();
      await setupWebPlaybackEvents();
      const device_data = await setupWaitingForDevice();
      onPlayerWaitingForDevice(device_data);
      await waitForDeviceToBeSelected();
      onPlayerDeviceSelected();
    };

    initializePlayer();

    return () => {
      clearStatePolling();
      if (deviceSelectedInterval.current)
        clearInterval(deviceSelectedInterval.current);
      webPlaybackInstance.current?.disconnect();
    };
  }, []);

  return <>{children}</>;
});

export default WebPlayback;
