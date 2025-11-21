import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authClient } from '@/services/authClient';
import { logger } from '@/lib/logger';

export interface User {
  _id: string;
  email: string;
  name?: string;
  photoUrl?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
};

// Async thunk to restore session on app load
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const userData = await authClient.getCurrentUser();
      return userData;
    } catch (err) {
      logger.error('Failed to restore session', err, 'authSlice');
      return rejectWithValue(null);
    }
  }
);

// Async thunk for logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authClient.logout();
      return null;
    } catch (err) {
      logger.error('Logout failed', err, 'authSlice');
      // Still clear user even if logout API call fails
      return null;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // restoreSession
      .addCase(restoreSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.isLoading = false;
      })
      // logout
      .addCase(logout.pending, (state) => {
        // Keep isLoading false during logout
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(logout.rejected, (state) => {
        // Still clear user even if API call failed
        state.user = null;
      });
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;

