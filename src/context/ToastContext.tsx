'use client';

import { Alert, AlertColor, Slide, SlideProps, Snackbar } from '@mui/material';
import React, { createContext, ReactNode, useContext, useState, useEffect, useCallback } from 'react';

interface ToastContextType {
  showToast: (message: string, severity?: AlertColor) => void;
  invalidateCache: (cacheKey: string) => void;
  subscribeToCache: (cacheKey: string, callback: () => void) => () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Custom hook for cache management
export const useCache = (cacheKey: string, refreshCallback: () => void) => {
  const { subscribeToCache } = useToast();
  
  useEffect(() => {
    const unsubscribe = subscribeToCache(cacheKey, refreshCallback);
    return unsubscribe;
  }, [cacheKey, subscribeToCache]); // Remove refreshCallback from dependencies to prevent loops
};

const SlideTransition = React.forwardRef(function Transition(
  props: SlideProps,
  ref: React.Ref<unknown>,
) {
  return <Slide direction="right" ref={ref} {...props} />;
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');
  const [cacheSubscribers, setCacheSubscribers] = useState<Map<string, Set<() => void>>>(new Map());

  const showToast = useCallback((msg: string, sev: AlertColor = 'info') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  const invalidateCache = useCallback((cacheKey: string) => {
    const subscribers = cacheSubscribers.get(cacheKey);
    if (subscribers) {
      subscribers.forEach(callback => callback());
    }
  }, [cacheSubscribers]);

  const subscribeToCache = useCallback((cacheKey: string, callback: () => void) => {
    console.log(`🔔 ToastContext: Subscribing to cache: ${cacheKey}`);
    setCacheSubscribers(prev => {
      const newMap = new Map(prev);
      if (!newMap.has(cacheKey)) {
        newMap.set(cacheKey, new Set());
      }
      const subscribers = newMap.get(cacheKey)!;
      if (!subscribers.has(callback)) {
        subscribers.add(callback);
      }
      return newMap;
    });

    // Return unsubscribe function
    return () => {
      console.log(`🔕 ToastContext: Unsubscribing from cache: ${cacheKey}`);
      setCacheSubscribers(prev => {
        const newMap = new Map(prev);
        const subscribers = newMap.get(cacheKey);
        if (subscribers) {
          subscribers.delete(callback);
          if (subscribers.size === 0) {
            newMap.delete(cacheKey);
          }
        }
        return newMap;
      });
    };
  }, []);

  const handleClose = () => setOpen(false);

  return (
    <ToastContext.Provider value={{ showToast, invalidateCache, subscribeToCache }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        TransitionComponent={SlideTransition}
      >
        <Alert onClose={handleClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
