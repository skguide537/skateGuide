import { useEffect, useRef } from 'react';
import { useToast } from './useToast';

// Custom hook for cache management
export const useCache = (cacheKey: string, refreshCallback: () => void) => {
  const { subscribeToCache } = useToast();
  const callbackRef = useRef(refreshCallback);
  
  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = refreshCallback;
  }, [refreshCallback]);
  
  useEffect(() => {
    const unsubscribe = subscribeToCache(cacheKey, () => callbackRef.current());
    return unsubscribe;
  }, [cacheKey, subscribeToCache]);
};

