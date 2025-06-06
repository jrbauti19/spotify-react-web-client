import axios from '../axios';
import type { Pagination } from '../interfaces/api';
import { Device } from '../interfaces/devices';
import type { PlayHistoryObject } from '../interfaces/player';

/**
 * @description Get information about the user's current playback state, including track or episode, progress, and active device.
 */
const fetchPlaybackState = async () => {
  const response = await axios.get('/me/player');
  return response.data;
};

/**
 * @description Verify if a specific device is active
 * @param deviceId The device ID to verify
 * @param retries Number of retry attempts
 */
const verifyDeviceActive = async (
  deviceId: string,
  retries = 5,
): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      const deviceData = await getAvailableDevices();
      const activeDevice = deviceData.devices.find(
        (d: Device) => d.is_active && d.id === deviceId,
      );

      if (activeDevice) {
        console.log('Device verified as active:', deviceId);
        return true;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error verifying device:', error);
    }
  }

  return false;
};

/**
 * @description Enhanced transfer playback with verification
 * @param deviceId The ID of the device this command is targeting. If not supplied, the user's currently active device is the target.
 */
const transferPlayback = async (deviceId: string) => {
  try {
    // Transfer playback
    await axios.put('/me/player', { device_ids: [deviceId], play: false });

    console.log('Transfer request completed for device:', deviceId);

    // Wait a bit for the transfer to complete
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Verify the device is actually active
    const isActive = await verifyDeviceActive(deviceId);

    if (!isActive) {
      throw new Error('Device transfer completed but device is not active');
    }

    return true;
  } catch (error) {
    console.error('Transfer playback error:', error);
    throw error;
  }
};

/**
 * @description Get information about a user's available Spotify Connect devices. Some device models are not supported and will not be listed in the API response.
 */
const getAvailableDevices = async () => {
  const response = await axios.get<{ devices: Device[] }>('/me/player/devices');
  return response.data;
};

/**
 * @description Enhanced start playback with device verification
 * @param body Playback configuration
 */
const startPlayback = async (
  body: {
    context_uri?: string;
    uris?: string[];
    offset?: { position: number };
  } = {},
) => {
  try {
    // First, check if we have an active device
    const deviceData = await getAvailableDevices();
    const activeDevice = deviceData.devices.find((d: Device) => d.is_active);

    if (!activeDevice) {
      throw new Error(
        'No active device found. Please ensure Spotify is running and connected.',
      );
    }

    console.log('Active device found:', activeDevice.name, activeDevice.id);

    // Make the play request
    await axios.put('/me/player/play', body);

    console.log('Playback started successfully');
  } catch (error: any) {
    console.error('Start playback failed:', error);

    // Handle specific Spotify API errors
    if (error.response?.data?.error?.reason === 'NO_ACTIVE_DEVICE') {
      throw new Error(
        'No active device found. Please open Spotify on a device or refresh the page.',
      );
    } else if (error.response?.data?.error?.reason === 'PREMIUM_REQUIRED') {
      throw new Error('Spotify Premium is required for playback control.');
    } else if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }

    throw error;
  }
};

/**
 * @description Enhanced pause playback with device verification
 */
const pausePlayback = async () => {
  try {
    // Check for active device first
    const deviceData = await getAvailableDevices();
    const activeDevice = deviceData.devices.find((d: Device) => d.is_active);

    if (!activeDevice) {
      throw new Error('No active device found');
    }

    await axios.put('/me/player/pause');
    console.log('Playback paused successfully');
  } catch (error: any) {
    console.error('Pause playback failed:', error);

    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }

    throw error;
  }
};

/**
 * @description Enhanced next track with device verification
 */
const nextTrack = async () => {
  try {
    // Check for active device first
    const deviceData = await getAvailableDevices();
    const activeDevice = deviceData.devices.find((d: Device) => d.is_active);

    if (!activeDevice) {
      throw new Error('No active device found');
    }

    await axios.post('/me/player/next');
    console.log('Skipped to next track successfully');
  } catch (error: any) {
    console.error('Next track failed:', error);

    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }

    throw error;
  }
};

/**
 * @description Enhanced previous track with device verification
 */
const previousTrack = async () => {
  try {
    // Check for active device first
    const deviceData = await getAvailableDevices();
    const activeDevice = deviceData.devices.find((d: Device) => d.is_active);

    if (!activeDevice) {
      throw new Error('No active device found');
    }

    await axios.post('/me/player/previous');
    console.log('Skipped to previous track successfully');
  } catch (error: any) {
    console.error('Previous track failed:', error);

    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }

    throw error;
  }
};

/**
 * @description Seeks to the given position in the user's currently playing track. This API only works for users who have Spotify Premium. The order of execution is not guaranteed when you use this API with other Player API endpoints.
 */
const seekToPosition = async (position_ms: number) => {
  try {
    // Check for active device first
    const deviceData = await getAvailableDevices();
    const activeDevice = deviceData.devices.find((d: Device) => d.is_active);

    if (!activeDevice) {
      throw new Error('No active device found');
    }

    await axios.put('/me/player/seek', {}, { params: { position_ms } });
  } catch (error: any) {
    console.error('Seek to position failed:', error);

    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }

    throw error;
  }
};

/**
 * @description Set the repeat mode for the user's playback. This API only works for users who have Spotify Premium. The order of execution is not guaranteed when you use this API with other Player API endpoints.
 * @param state track, context, or off. track will repeat the current track. context will repeat the current context. off will turn repeat off.
 */
const setRepeatMode = async (state: 'track' | 'context' | 'off') => {
  try {
    // Check for active device first
    const deviceData = await getAvailableDevices();
    const activeDevice = deviceData.devices.find((d: Device) => d.is_active);

    if (!activeDevice) {
      throw new Error('No active device found');
    }

    await axios.put('/me/player/repeat', {}, { params: { state } });
  } catch (error: any) {
    console.error('Set repeat mode failed:', error);

    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }

    throw error;
  }
};

/**
 * @description Set the volume for the user's current playback device. This API only works for users who have Spotify Premium. The order of execution is not guaranteed when you use this API with other Player API endpoints.
 * @param volume_percent The volume to set. Must be a value from 0 to 100 inclusive.
 */
const setVolume = async (volume_percent: number) => {
  try {
    // Check for active device first
    const deviceData = await getAvailableDevices();
    const activeDevice = deviceData.devices.find((d: Device) => d.is_active);

    if (!activeDevice) {
      throw new Error('No active device found');
    }

    await axios.put('/me/player/volume', {}, { params: { volume_percent } });
  } catch (error: any) {
    console.error('Set volume failed:', error);

    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }

    throw error;
  }
};

/**
 * @description Toggle shuffle on or off for user's playback. This API only works for users who have Spotify Premium. The order of execution is not guaranteed when you use this API with other Player API endpoints.
 */
const toggleShuffle = async (state: boolean) => {
  try {
    // Check for active device first
    const deviceData = await getAvailableDevices();
    const activeDevice = deviceData.devices.find((d: Device) => d.is_active);

    if (!activeDevice) {
      throw new Error('No active device found');
    }

    await axios.put('/me/player/shuffle', {}, { params: { state } });
  } catch (error: any) {
    console.error('Toggle shuffle failed:', error);

    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }

    throw error;
  }
};

/**
 * @description Add an item to the end of the user's current playback queue. This API only works for users who have Spotify Premium. The order of execution is not guaranteed when you use this API with other Player API endpoints.
 */
const addToQueue = async (uri: string) => {
  try {
    // Check for active device first
    const deviceData = await getAvailableDevices();
    const activeDevice = deviceData.devices.find((d: Device) => d.is_active);

    if (!activeDevice) {
      throw new Error('No active device found');
    }

    await axios.post('/me/player/queue', {}, { params: { uri } });
  } catch (error: any) {
    console.error('Add to queue failed:', error);

    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }

    throw error;
  }
};

/**
 * @description Get tracks from the current user's recently played tracks. Note: Currently doesn't support podcast episodes.
 */
const getRecentlyPlayed = async (params: {
  limit?: number;
  after?: number;
  before?: number;
}) => {
  const response = await axios.get<Pagination<PlayHistoryObject>>(
    '/me/player/recently-played',
    {
      params,
    },
  );
  return response.data;
};

export const playerService = {
  addToQueue,
  fetchPlaybackState,
  transferPlayback,
  startPlayback,
  pausePlayback,
  nextTrack,
  previousTrack,
  setRepeatMode,
  setVolume,
  toggleShuffle,
  seekToPosition,
  getRecentlyPlayed,
  getAvailableDevices,
  verifyDeviceActive, // NEW: Export the verification function
};
