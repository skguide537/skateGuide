import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTheme, toggleTheme, initializeTheme } from '@/store/slices/themeSlice';
import { useEffect } from 'react';
import type { Theme } from '@/store/slices/themeSlice';

export function useTheme() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme.theme);
  const isInitialized = useAppSelector((state) => state.theme.isInitialized);

  // Initialize theme on mount (only once)
  useEffect(() => {
    if (!isInitialized) {
      dispatch(initializeTheme());
    }
  }, [dispatch, isInitialized]);

  const handleSetTheme = (newTheme: Theme) => {
    dispatch(setTheme(newTheme));
  };

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  return {
    theme,
    toggleTheme: handleToggleTheme,
    setTheme: handleSetTheme,
  };
}

