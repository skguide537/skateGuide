import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createListenerMiddleware } from '@reduxjs/toolkit';
import type { AppDispatch } from '../index';

// Cache invalidation slice - tracks cache keys that need invalidation
// Uses a counter to trigger re-renders when cache is invalidated
interface CacheState {
  invalidationCounter: Record<string, number>;
}

const initialState: CacheState = {
  invalidationCounter: {},
};

const cacheSlice = createSlice({
  name: 'cache',
  initialState,
  reducers: {
    invalidateCache: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      state.invalidationCounter[key] = (state.invalidationCounter[key] || 0) + 1;
    },
  },
});

export const { invalidateCache } = cacheSlice.actions;
export default cacheSlice.reducer;

// Create listener middleware for cache subscriptions
export const cacheListenerMiddleware = createListenerMiddleware();

// Store callbacks outside Redux state (functions can't be serialized)
const cacheCallbacks = new Map<string, Set<() => void>>();

// Helper to subscribe to cache invalidation
export const createCacheSubscription = (
  cacheKey: string,
  callback: () => void,
  dispatch: AppDispatch
) => {
  // Add callback to our external map
  if (!cacheCallbacks.has(cacheKey)) {
    cacheCallbacks.set(cacheKey, new Set());
  }
  cacheCallbacks.get(cacheKey)!.add(callback);

  // Set up listener to call callbacks when cache is invalidated
  const unsubscribe = cacheListenerMiddleware.startListening({
    actionCreator: invalidateCache,
    effect: (action) => {
      if (action.payload === cacheKey) {
        const callbacks = cacheCallbacks.get(cacheKey);
        if (callbacks) {
          callbacks.forEach(cb => cb());
        }
      }
    },
  });

  // Return unsubscribe function
  return () => {
    const callbacks = cacheCallbacks.get(cacheKey);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        cacheCallbacks.delete(cacheKey);
      }
    }
    unsubscribe();
  };
};

