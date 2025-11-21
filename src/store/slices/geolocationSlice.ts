import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HOME_PAGE_CONSTANTS } from '@/constants/homePage';
import { logger } from '@/lib/logger';

export type GeolocationStatus = 'loading' | 'success' | 'fallback';
export type GeolocationFailureReason = 'timeout' | 'denied' | 'unavailable';

interface GeolocationState {
  status: GeolocationStatus;
  coords: { lat: number; lng: number } | null;
  failureReason?: GeolocationFailureReason;
}

const initialState: GeolocationState = {
  status: 'loading',
  coords: null,
};

// Track request IDs to handle timeouts correctly
let requestIdCounter = 0;
const activeRequests = new Map<number, { timeoutId: number }>();

// Async thunk to request geolocation
export const requestGeolocation = createAsyncThunk(
  'geolocation/requestGeolocation',
  async (_, { rejectWithValue }) => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      logger.warn('Geolocation unavailable in this environment', 'geolocationSlice');
      return rejectWithValue({
        status: 'fallback' as GeolocationStatus,
        coords: null,
        failureReason: 'unavailable' as GeolocationFailureReason,
      });
    }

    const currentRequestId = ++requestIdCounter;

    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      const timeoutMs = HOME_PAGE_CONSTANTS.TIMEOUTS.GEOLOCATION;

      const timeoutId = window.setTimeout(() => {
        activeRequests.delete(currentRequestId);
        logger.warn('Geolocation timed out after %dms', timeoutMs, 'geolocationSlice');
        reject({
          status: 'fallback' as GeolocationStatus,
          coords: null,
          failureReason: 'timeout' as GeolocationFailureReason,
        });
      }, timeoutMs);

      activeRequests.set(currentRequestId, { timeoutId });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const request = activeRequests.get(currentRequestId);
          if (request) {
            window.clearTimeout(request.timeoutId);
            activeRequests.delete(currentRequestId);
          }

          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          const request = activeRequests.get(currentRequestId);
          if (request) {
            window.clearTimeout(request.timeoutId);
            activeRequests.delete(currentRequestId);
          }

          const failureReason: GeolocationFailureReason =
            error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable';

          logger.warn('Geolocation error', { code: error.code, message: error.message }, 'geolocationSlice');

          reject({
            status: 'fallback' as GeolocationStatus,
            coords: null,
            failureReason,
          });
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: timeoutMs,
        }
      );
    });
  }
);

const geolocationSlice = createSlice({
  name: 'geolocation',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<GeolocationStatus>) => {
      state.status = action.payload;
    },
    setCoords: (state, action: PayloadAction<{ lat: number; lng: number } | null>) => {
      state.coords = action.payload;
    },
    setFailureReason: (state, action: PayloadAction<GeolocationFailureReason | undefined>) => {
      state.failureReason = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // requestGeolocation
      .addCase(requestGeolocation.pending, (state) => {
        state.status = 'loading';
        state.coords = null;
      })
      .addCase(requestGeolocation.fulfilled, (state, action) => {
        state.status = 'success';
        state.coords = action.payload;
        state.failureReason = undefined;
      })
      .addCase(requestGeolocation.rejected, (state, action) => {
        const payload = action.payload as { status: GeolocationStatus; coords: null; failureReason: GeolocationFailureReason } | undefined;
        if (payload) {
          state.status = payload.status;
          state.coords = payload.coords;
          state.failureReason = payload.failureReason;
        } else {
          // Fallback if payload is undefined (shouldn't happen, but safety check)
          state.status = 'fallback';
          state.coords = null;
          state.failureReason = 'unavailable';
        }
      });
  },
});

export const { setStatus, setCoords, setFailureReason } = geolocationSlice.actions;

// Thunk for retry (just calls requestGeolocation again)
export const retryGeolocation = requestGeolocation;

export default geolocationSlice.reducer;

