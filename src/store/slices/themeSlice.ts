import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  isInitialized: boolean;
}

// Initialize theme from localStorage if available, otherwise detect system preference
const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('skateGuide-theme') as Theme;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  return 'light';
};

const initialState: ThemeState = {
  theme: getInitialTheme(),
  isInitialized: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      // Sync to localStorage
      if (typeof window !== 'undefined' && state.isInitialized) {
        localStorage.setItem('skateGuide-theme', action.payload);
        document.body.setAttribute('data-theme', action.payload);
      }
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      // Sync to localStorage
      if (typeof window !== 'undefined' && state.isInitialized) {
        localStorage.setItem('skateGuide-theme', state.theme);
        document.body.setAttribute('data-theme', state.theme);
      }
    },
    initializeTheme: (state) => {
      if (!state.isInitialized) {
        state.isInitialized = true;
        // Apply theme to body after initialization to prevent hydration mismatch
        if (typeof window !== 'undefined') {
          document.body.setAttribute('data-theme', state.theme);
          localStorage.setItem('skateGuide-theme', state.theme);
        }
      }
    },
  },
});

export const { setTheme, toggleTheme, initializeTheme } = themeSlice.actions;
export default themeSlice.reducer;

