import { useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { showToast as showToastAction, hideToast } from '@/store/slices/toastSlice';
import { invalidateCache as invalidateCacheAction } from '@/store/slices/cacheSlice';
import { createCacheSubscription } from '@/store/slices/cacheSlice';
import type { AlertColor } from '@mui/material';

export function useToast() {
  const dispatch = useAppDispatch();

  const handleShowToast = useCallback((message: string, severity: AlertColor = 'info') => {
    dispatch(showToastAction({ message, severity }));
  }, [dispatch]);

  const handleInvalidateCache = useCallback((cacheKey: string) => {
    dispatch(invalidateCacheAction(cacheKey));
  }, [dispatch]);

  const handleSubscribeToCache = useCallback((cacheKey: string, callback: () => void) => {
    // Use Redux listener middleware for subscriptions
    const unsubscribe = createCacheSubscription(
      cacheKey,
      callback,
      dispatch
    );
    return unsubscribe;
  }, [dispatch]);

  return {
    showToast: handleShowToast,
    invalidateCache: handleInvalidateCache,
    subscribeToCache: handleSubscribeToCache,
  };
}

