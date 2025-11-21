import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Tag } from '@/types/enums';

export interface FilterState {
  searchTerm: string;
  typeFilter: 'all' | 'park' | 'street';
  sizeFilter: string[];
  levelFilter: string[];
  tagFilter: Tag[];
  showOnlyFavorites: boolean;
  showOnlyApproved: boolean;
  distanceFilterEnabled: boolean;
  distanceFilter: number;
  ratingFilterEnabled: boolean;
  ratingFilter: number[];
  sortBy: 'distance' | 'rating' | 'recent';
}

const initialState: FilterState = {
  searchTerm: '',
  typeFilter: 'all',
  sizeFilter: [],
  levelFilter: [],
  tagFilter: [],
  showOnlyFavorites: false,
  showOnlyApproved: false,
  distanceFilterEnabled: false,
  distanceFilter: 10,
  ratingFilterEnabled: false,
  ratingFilter: [0, 5],
  sortBy: 'distance',
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setTypeFilter: (state, action: PayloadAction<'all' | 'park' | 'street'>) => {
      state.typeFilter = action.payload;
    },
    setSizeFilter: (state, action: PayloadAction<string[]>) => {
      state.sizeFilter = action.payload;
    },
    setLevelFilter: (state, action: PayloadAction<string[]>) => {
      state.levelFilter = action.payload;
    },
    setTagFilter: (state, action: PayloadAction<Tag[]>) => {
      state.tagFilter = action.payload;
    },
    setShowOnlyFavorites: (state, action: PayloadAction<boolean>) => {
      state.showOnlyFavorites = action.payload;
    },
    setShowOnlyApproved: (state, action: PayloadAction<boolean>) => {
      state.showOnlyApproved = action.payload;
    },
    setDistanceFilterEnabled: (state, action: PayloadAction<boolean>) => {
      state.distanceFilterEnabled = action.payload;
    },
    setDistanceFilter: (state, action: PayloadAction<number>) => {
      state.distanceFilter = action.payload;
    },
    setRatingFilterEnabled: (state, action: PayloadAction<boolean>) => {
      state.ratingFilterEnabled = action.payload;
    },
    setRatingFilter: (state, action: PayloadAction<number[]>) => {
      state.ratingFilter = action.payload;
    },
    setSortBy: (state, action: PayloadAction<'distance' | 'rating' | 'recent'>) => {
      state.sortBy = action.payload;
    },
    resetFilters: () => initialState,
  },
});

export const {
  setSearchTerm,
  setTypeFilter,
  setSizeFilter,
  setLevelFilter,
  setTagFilter,
  setShowOnlyFavorites,
  setShowOnlyApproved,
  setDistanceFilterEnabled,
  setDistanceFilter,
  setRatingFilterEnabled,
  setRatingFilter,
  setSortBy,
  resetFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;

