import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { favoritesClient } from '@/services/favoritesClient';
import { logger } from '@/lib/logger';

interface FavoritesState {
  favorites: string[];
  counts: Record<string, number>;
  isLoading: boolean;
  favoritesLoaded: boolean;
}

const initialState: FavoritesState = {
  favorites: [],
  counts: {},
  isLoading: false,
  favoritesLoaded: false,
};

// Track in-progress requests to prevent duplicates
const inProgressRequests = new Set<string>();

// Async thunk to fetch favorites
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (userId: string, { rejectWithValue }) => {
    try {
      const data = await favoritesClient.getFavorites(userId);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      logger.error('Favorites fetch failed', err, 'favoritesSlice');
      return rejectWithValue([]);
    }
  }
);

// Async thunk to ensure counts for spot IDs
export const ensureCounts = createAsyncThunk(
  'favorites/ensureCounts',
  async (spotIds: string[], { getState, rejectWithValue }) => {
    const state = getState() as { favorites: FavoritesState };
    const idsToFetch = spotIds.filter((id) => state.favorites.counts[id] === undefined);
    
    if (idsToFetch.length === 0) {
      return {};
    }
    
    // Prevent duplicate calls for the same IDs
    const key = idsToFetch.sort().join(',');
    if (inProgressRequests.has(key)) {
      return rejectWithValue({});
    }
    
    inProgressRequests.add(key);
    
    try {
      const data = await favoritesClient.getFavoriteCounts(idsToFetch);
      return data || {};
    } catch (err) {
      logger.error('Favorites counts fetch failed', err, 'favoritesSlice');
      return rejectWithValue({});
    } finally {
      inProgressRequests.delete(key);
    }
  }
);

// Async thunk to toggle favorite
export const toggleFavorite = createAsyncThunk(
  'favorites/toggleFavorite',
  async ({ spotId, userId }: { spotId: string; userId: string }, { rejectWithValue, getState }) => {
    try {
      const action = await favoritesClient.toggleFavorite(spotId, userId);
      
      // Get current counts for optimistic update
      const state = getState() as { favorites: FavoritesState };
      const currentCount = state.favorites.counts[spotId] ?? 0;
      
      return {
        spotId,
        action,
        newCount: action === 'added' ? currentCount + 1 : Math.max(0, currentCount - 1),
      };
    } catch (err) {
      logger.error('Toggle favorite failed', err, 'favoritesSlice');
      return rejectWithValue({ spotId, error: 'Failed to update favorites' });
    }
  }
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    setFavoritesLoaded: (state, action: PayloadAction<boolean>) => {
      state.favoritesLoaded = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchFavorites
      .addCase(fetchFavorites.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.favorites = action.payload;
        state.favoritesLoaded = true;
        state.isLoading = false;
      })
      .addCase(fetchFavorites.rejected, (state) => {
        state.favoritesLoaded = false;
        state.isLoading = false;
      })
      // ensureCounts
      .addCase(ensureCounts.fulfilled, (state, action) => {
        state.counts = { ...state.counts, ...action.payload };
      })
      // toggleFavorite
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const { spotId, action: favoriteAction, newCount } = action.payload;
        
        // Update favorites list
        if (favoriteAction === 'added') {
          if (!state.favorites.includes(spotId)) {
            state.favorites.push(spotId);
          }
        } else {
          state.favorites = state.favorites.filter(id => id !== spotId);
        }
        
        // Update count optimistically
        state.counts[spotId] = newCount;
      })
      .addCase(toggleFavorite.rejected, (state) => {
        // On error, we might want to refetch favorites
        // For now, just log the error
      });
  },
});

export const { setFavoritesLoaded } = favoritesSlice.actions;
export default favoritesSlice.reducer;

