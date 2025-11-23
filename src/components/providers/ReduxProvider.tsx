'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import { restoreSession } from '@/store/slices/authSlice';
import { ReactNode, useEffect, useRef } from 'react';

interface ReduxProviderProps {
  children: ReactNode;
}

// Track if session restoration has been initiated globally
let sessionRestoreInitiated = false;

export default function ReduxProvider({ children }: ReduxProviderProps) {
  const hasDispatchedRef = useRef(false);

  // Restore session once on app load
  useEffect(() => {
    // Prevent multiple dispatches even if component remounts
    if (!hasDispatchedRef.current && !sessionRestoreInitiated) {
      hasDispatchedRef.current = true;
      sessionRestoreInitiated = true;
      store.dispatch(restoreSession());
    }
  }, []);

  // Add data attribute for test readiness detection (reactive)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Mark Redux as ready when essential slices are loaded
    const checkReady = () => {
      try {
        const state = store.getState();
        const essentialReady = ['auth', 'theme', 'toast', 'cache'].every(slice => 
          state && (state as any)[slice] !== undefined
        );
        
        if (essentialReady) {
          document.body.setAttribute('data-redux-ready', 'true');
          return true;
        }
      } catch (error) {
        // Store might not be ready yet
      }
      return false;
    };

    // Check immediately
    if (checkReady()) return;

    // Subscribe to store changes and check on every state update
    const unsubscribe = store.subscribe(() => {
      if (checkReady()) {
        unsubscribe();
      }
    });

    // Also check periodically as fallback
    const interval = setInterval(() => {
      if (checkReady()) {
        clearInterval(interval);
        unsubscribe();
      }
    }, 100);

    // Cleanup
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  return <Provider store={store}>{children}</Provider>;
}

