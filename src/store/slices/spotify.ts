import {
  createAsyncThunk,
  createSelector,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';
import type { RootState } from '../store';

// Services
import { Device } from '../../interfaces/devices';
import { playerService } from '../../services/player';
import { userService } from '../../services/users';

const initialState: {
  liked: boolean;
  deviceId: string | null;
  activeDevice: string | null;
  activeDeviceType: Device['type'];
  deviceReady: boolean; // NEW: Track when device is ready for playback
  state: Spotify.PlaybackState | null;
  player: Spotify.Player | null;
  devices: Device[];
} = {
  state: null,
  deviceId: null,
  activeDevice: null,
  deviceReady: false, // NEW: Initially false
  liked: false,
  player: null,
  devices: [],
  activeDeviceType: 'Computer',
};

export const setState = createAsyncThunk<
  Spotify.PlaybackState | null,
  { state: Spotify.PlaybackState | null }
>(
  'spotify/setState',
  async ({ state: spotifyState }, { getState, dispatch }) => {
    if (!spotifyState) return null;
    const state = getState() as RootState;
    const currentSong = spotifyState?.track_window.current_track;

    if (
      currentSong?.id !== state.spotify.state?.track_window.current_track.id
    ) {
      const playing = !spotifyState.paused;
      const song = spotifyState.track_window.current_track;
      document.title =
        song && playing
          ? `${song.name} • ${song.artists[0].name}`
          : 'Spotify Web Player';
      if (currentSong) dispatch(fetchLikedSong(currentSong.id!));
    }
    return spotifyState;
  },
);

export const fetchLikedSong = createAsyncThunk<boolean, string>(
  'spotify/fetchLikedSong',
  async (id) => {
    const liked = await userService.checkSavedTracks([id!]);
    return liked.data[0];
  },
);

export const fetchDevices = createAsyncThunk<Device[]>(
  'spotify/fetchDevices',
  async () => {
    const response = await playerService.getAvailableDevices();
    return response.devices;
  },
);

// NEW: Async thunk to verify and transfer playback
export const transferAndVerifyPlayback = createAsyncThunk<
  boolean,
  { deviceId: string },
  { state: RootState }
>('spotify/transferAndVerifyPlayback', async ({ deviceId }, { dispatch }) => {
  try {
    // Transfer playback (this now includes verification in your updated playerService)
    await playerService.transferPlayback(deviceId);

    // Set device as ready
    dispatch(spotifyActions.setDeviceReady({ ready: true }));
    dispatch(spotifyActions.setActiveDevice({ activeDevice: deviceId }));

    return true;
  } catch (error) {
    console.error('Transfer and verify failed:', error);
    dispatch(spotifyActions.setDeviceReady({ ready: false }));
    throw error;
  }
});

const spotifySlice = createSlice({
  name: 'spotify',
  initialState,
  reducers: {
    setLiked(state, action: PayloadAction<{ liked: boolean }>) {
      state.liked = action.payload.liked;
    },
    setDeviceId(state, action: PayloadAction<{ deviceId: string | null }>) {
      state.deviceId = action.payload.deviceId;
    },
    setPlayer(state, action: PayloadAction<{ player: Spotify.Player | null }>) {
      state.player = action.payload.player;
    },
    setActiveDevice(
      state,
      action: PayloadAction<{
        activeDevice: string | null;
        type?: Device['type'];
      }>,
    ) {
      state.activeDevice = action.payload.activeDevice;
      state.activeDeviceType = action.payload.type || 'Computer';
    },
    // NEW: Set device ready state
    setDeviceReady(state, action: PayloadAction<{ ready: boolean }>) {
      state.deviceReady = action.payload.ready;
    },
    // NEW: Clear all device-related state (useful for logout/errors)
    clearDeviceState(state) {
      state.player = null;
      state.deviceId = null;
      state.activeDevice = null;
      state.deviceReady = false;
      state.state = null;
      state.devices = [];
    },
    // NEW: Reset device ready state (useful when connection is lost)
    resetDeviceReady(state) {
      state.deviceReady = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setState.fulfilled, (state, action) => {
      state.state = action.payload;
    });
    builder.addCase(fetchLikedSong.fulfilled, (state, action) => {
      state.liked = action.payload;
    });
    builder.addCase(fetchDevices.fulfilled, (state, action) => {
      state.devices = action.payload;
    });
    // NEW: Handle transfer and verify playback
    builder.addCase(transferAndVerifyPlayback.pending, (state) => {
      state.deviceReady = false;
    });
    builder.addCase(transferAndVerifyPlayback.fulfilled, (state) => {
      state.deviceReady = true;
    });
    builder.addCase(transferAndVerifyPlayback.rejected, (state) => {
      state.deviceReady = false;
    });
  },
});

export const getCurrentDevice = createSelector(
  [(state: RootState) => state.spotify.devices],
  (devices) => {
    return devices.find((device) => device.is_active);
  },
);

export const isActiveOnOtherDevice = createSelector(
  [
    (state: RootState) => state.spotify.deviceId,
    (state: RootState) => state.spotify.activeDevice,
  ],
  (deviceId, activeDeviceId) => {
    return deviceId && activeDeviceId && deviceId !== activeDeviceId;
  },
);

export const getOtherDevices = createSelector(
  [(state: RootState) => state.spotify.devices],
  (devices) => {
    return devices.filter((device) => !device.is_active);
  },
);

// NEW: Selector to check if device is ready for playback
export const isDeviceReady = createSelector(
  [
    (state: RootState) => state.spotify.deviceReady,
    (state: RootState) => state.spotify.activeDevice,
  ],
  (deviceReady, activeDevice) => {
    return deviceReady && !!activeDevice;
  },
);

// NEW: Selector to get device connection status
export const getDeviceStatus = createSelector(
  [
    (state: RootState) => state.spotify.deviceReady,
    (state: RootState) => state.spotify.deviceId,
    (state: RootState) => state.spotify.activeDevice,
  ],
  (deviceReady, deviceId, activeDevice) => {
    if (!deviceId) return 'disconnected';
    if (!activeDevice) return 'connecting';
    if (!deviceReady) return 'transferring';
    return 'ready';
  },
);

export const spotifyActions = {
  ...spotifySlice.actions,
  setState,
  fetchDevices,
  transferAndVerifyPlayback, // NEW: Export the new async thunk
};

export default spotifySlice.reducer;
