'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_CHANGE_EVENT = 'skateGuide:storage-change';

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(STORAGE_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(STORAGE_CHANGE_EVENT, onStoreChange);
  };
}

function readStoredBoolean(key: string): string | null {
  return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
}

export function parseStoredBoolean(value: string | null, fallback: boolean): boolean {
  if (value === null) return fallback;
  return value === 'true';
}

export function useStoredBoolean(key: string, fallback: boolean): [boolean, (value: boolean) => void] {
  const getSnapshot = useCallback(() => readStoredBoolean(key), [key]);
  const storedValue = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const setValue = useCallback((value: boolean) => {
    window.localStorage.setItem(key, String(value));
    window.dispatchEvent(new Event(STORAGE_CHANGE_EVENT));
  }, [key]);

  return [parseStoredBoolean(storedValue, fallback), setValue];
}
