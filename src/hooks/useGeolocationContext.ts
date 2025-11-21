import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { lazyLoadGeolocationSlice } from '@/store';
import { useEffect, useCallback } from 'react';

// Lazy load geolocation slice - load immediately when hook is called
let geolocationSliceLoadPromise: Promise<void> | null = null;
const ensureGeolocationSliceLoaded = () => {
  if (!geolocationSliceLoadPromise) {
    geolocationSliceLoadPromise = lazyLoadGeolocationSlice();
  }
  return geolocationSliceLoadPromise;
};

export function useGeolocationContext() {
  const dispatch = useAppDispatch();
  
  // Ensure slice is loaded before using selectors
  useEffect(() => {
    ensureGeolocationSliceLoaded();
  }, []);

  // Use selectors with fallback for initial state
  const status = useAppSelector((state) => (state as any).geolocation?.status ?? 'loading');
  const coords = useAppSelector((state) => (state as any).geolocation?.coords ?? null);
  const failureReason = useAppSelector((state) => (state as any).geolocation?.failureReason);
  const isLoading = status === 'loading';

  // Request geolocation on mount
  useEffect(() => {
    ensureGeolocationSliceLoaded().then(() => {
      import('@/store/slices/geolocationSlice').then(({ requestGeolocation }) => {
        dispatch(requestGeolocation());
      });
    });
  }, [dispatch]);

  const retry = useCallback(() => {
    ensureGeolocationSliceLoaded().then(() => {
      import('@/store/slices/geolocationSlice').then(({ retryGeolocation }) => {
        dispatch(retryGeolocation());
      });
    });
  }, [dispatch]);

  return {
    status,
    coords,
    failureReason,
    retry,
    isLoading,
  };
}

