import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { skateparkClient } from '@/services/skateparkClient';
import { authClient } from '@/services/authClient';
import { logger } from '@/lib/logger';
import { HOME_PAGE_CONSTANTS } from '@/constants/homePage';
import { BaseSkatepark } from '@/types/skatepark';
import { invalidateCache } from './cacheSlice';

interface ParksState {
  parks: BaseSkatepark[];
  isLoading: boolean;
  deletedSpotIds: string[]; // Store as array, convert to Set when needed
  deletingSpotIds: string[]; // Store as array, convert to Set when needed
  lastUpdated: string; // ISO string for Date serialization
}

const initialState: ParksState = {
  parks: [],
  isLoading: true,
  deletedSpotIds: [],
  deletingSpotIds: [],
  lastUpdated: new Date().toISOString(),
};

// Async thunk to fetch parks
export const fetchParks = createAsyncThunk(
  'parks/fetchParks',
  async (_, { rejectWithValue }) => {
    try {
      const data = await skateparkClient.getAllSkateparks(1000);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      logger.error('Failed to fetch parks', err, 'parksSlice');
      return rejectWithValue([]);
    }
  }
);

// Async thunk to refresh parks
export const refreshParks = createAsyncThunk(
  'parks/refreshParks',
  async (_, { rejectWithValue, getState }) => {
    try {
      const data = await skateparkClient.getAllSkateparks(1000);
      const parksData = Array.isArray(data) ? data : [];
      
      // Only return data if we got valid data, otherwise keep existing
      if (parksData.length > 0) {
        return parksData;
      }
      
      // Return existing parks if refresh got no data
      const state = getState() as { parks: ParksState };
      return state.parks.parks;
    } catch (err) {
      logger.error('Error refreshing parks', err, 'parksSlice');
      // Return existing parks on error
      const state = getState() as { parks: ParksState };
      return rejectWithValue(state.parks.parks);
    }
  }
);

// Async thunk to delete a spot
export const deleteSpot = createAsyncThunk(
  'parks/deleteSpot',
  async (spotId: string, { rejectWithValue, getState, dispatch }) => {
    try {
      // Get user ID from auth client
      const user = await authClient.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Delete operation timed out')), HOME_PAGE_CONSTANTS.TIMEOUTS.DELETE_OPERATION);
      });
      
      // Delete from backend with timeout
      const deletePromise = skateparkClient.deleteSkatepark(spotId, user._id);
      await Promise.race([deletePromise, timeoutPromise]);
      
      // Get spot title for better toast message
      const state = getState() as { parks: ParksState };
      const deletedSpot = state.parks.parks.find(park => park._id === spotId);
      const spotTitle = deletedSpot?.title || 'Spot';
      
      // Invalidate caches after a delay
      setTimeout(() => {
        dispatch(invalidateCache('skateparks'));
        dispatch(invalidateCache('spots'));
        dispatch(invalidateCache('map-markers'));
      }, HOME_PAGE_CONSTANTS.TIMEOUTS.CACHE_INVALIDATION);
      
      return { spotId, spotTitle };
    } catch (error: unknown) {
      logger.error('Delete failed', error, 'parksSlice');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return rejectWithValue({ spotId, error: errorMessage });
    }
  }
);

const parksSlice = createSlice({
  name: 'parks',
  initialState,
  reducers: {
    clearDeletedSpots: (state) => {
      state.deletedSpotIds = [];
    },
    removePark: (state, action: PayloadAction<string>) => {
      state.parks = state.parks.filter(park => park._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchParks
      .addCase(fetchParks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchParks.fulfilled, (state, action) => {
        state.parks = action.payload;
        state.isLoading = false;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchParks.rejected, (state) => {
        state.parks = [];
        state.isLoading = false;
      })
      // refreshParks
      .addCase(refreshParks.fulfilled, (state, action) => {
        state.parks = action.payload;
        state.deletedSpotIds = []; // Clear deleted spots on refresh
        state.lastUpdated = new Date().toISOString();
      })
      // deleteSpot
      .addCase(deleteSpot.pending, (state, action) => {
        const spotId = action.meta.arg;
        if (!state.deletingSpotIds.includes(spotId)) {
          state.deletingSpotIds.push(spotId);
        }
      })
      .addCase(deleteSpot.fulfilled, (state, action) => {
        const { spotId } = action.payload;
        // Remove from deleting
        state.deletingSpotIds = state.deletingSpotIds.filter(id => id !== spotId);
        // Add to deleted
        if (!state.deletedSpotIds.includes(spotId)) {
          state.deletedSpotIds.push(spotId);
        }
        // Remove from parks
        state.parks = state.parks.filter(park => park._id !== spotId);
      })
      .addCase(deleteSpot.rejected, (state, action) => {
        const spotId = action.meta.arg;
        // Remove from deleting
        state.deletingSpotIds = state.deletingSpotIds.filter(id => id !== spotId);
      });
  },
});

export const { clearDeletedSpots, removePark } = parksSlice.actions;
export default parksSlice.reducer;

