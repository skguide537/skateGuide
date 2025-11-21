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

  return <Provider store={store}>{children}</Provider>;
}

