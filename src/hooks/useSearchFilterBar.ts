// Custom hook for SearchFilterBar state and logic
import { useState, useMemo, useCallback } from 'react';
import { SearchFilterService, FilterOptions } from '@/services/searchFilter.service';

export interface SearchFilterBarState {
  searchTerm: string;
  typeFilter: 'all' | 'park' | 'street';
  sizeFilter: string[];
  levelFilter: string[];
  tagFilter: string[];
  showOnlyFavorites: boolean;
  distanceFilterEnabled: boolean;
  distanceFilter: number;
  ratingFilterEnabled: boolean;
  ratingFilter: number[];
  sortBy: 'distance' | 'rating' | 'recent';
  showFilters: boolean;
}

export const useSearchFilterBar = (
  initialFilters: Partial<FilterOptions> = {},
  userLocation: { lat: number; lng: number } | null = null
) => {
  // Initialize state with defaults
  const [state, setState] = useState<SearchFilterBarState>({
    searchTerm: initialFilters.searchQuery || '',
    typeFilter: 'all',
    sizeFilter: initialFilters.sizeFilter || [],
    levelFilter: initialFilters.levelFilter || [],
    tagFilter: initialFilters.tagFilter || [],
    showOnlyFavorites: false,
    distanceFilterEnabled: false,
    distanceFilter: 10, // km
    ratingFilterEnabled: false,
    ratingFilter: [0, 5],
    sortBy: 'distance',
    showFilters: false // Start with filters hidden by default
  });

  // Note: Filter options are now passed as props from constants

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return state.searchTerm.trim().length > 0 ||
           state.typeFilter !== 'all' ||
           (state.sizeFilter.length > 0 && !state.sizeFilter.includes('All Sizes')) ||
           (state.levelFilter.length > 0 && !state.levelFilter.includes('All Levels')) ||
           state.tagFilter.length > 0 ||
           state.showOnlyFavorites ||
           state.distanceFilterEnabled ||
           (state.ratingFilterEnabled && (state.ratingFilter[0] !== 0 || state.ratingFilter[1] !== 5)) ||
           state.sortBy !== 'distance';
  }, [state]);

  // Get filter summary for display
  const filterSummary = useMemo(() => {
    const activeFilters: string[] = [];
    
    if (state.searchTerm.trim()) {
      activeFilters.push(`"${state.searchTerm}"`);
    }
    if (state.typeFilter !== 'all') {
      activeFilters.push(state.typeFilter === 'park' ? 'Parks only' : 'Street only');
    }
    if (state.sizeFilter.length > 0 && !state.sizeFilter.includes('All Sizes')) {
      activeFilters.push(`Size: ${state.sizeFilter[0]}`);
    }
    if (state.levelFilter.length > 0 && !state.levelFilter.includes('All Levels')) {
      activeFilters.push(`Level: ${state.levelFilter[0]}`);
    }
    if (state.tagFilter.length > 0) {
      activeFilters.push(`Tag: ${state.tagFilter[0]}`);
    }
    if (state.showOnlyFavorites) {
      activeFilters.push('Favorites only');
    }
    if (state.distanceFilterEnabled) {
      activeFilters.push(`Within ${state.distanceFilter}km`);
    }
    if (state.ratingFilterEnabled && (state.ratingFilter[0] > 0 || state.ratingFilter[1] < 5)) {
      const min = state.ratingFilter[0];
      const max = state.ratingFilter[1];
      if (min === max) {
        activeFilters.push(`${min}+ stars`);
      } else {
        activeFilters.push(`${min}-${max} stars`);
      }
    }
    if (state.sortBy !== 'distance') {
      const sortLabels = {
        rating: 'By rating',
        recent: 'By recent'
      };
      activeFilters.push(sortLabels[state.sortBy]);
    }
    
    return activeFilters.join(', ');
  }, [state]);

  // Update individual filter
  const updateFilter = useCallback(<T extends keyof SearchFilterBarState>(
    key: T,
    value: SearchFilterBarState[T]
  ) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  // Specific filter update functions
  const updateSearchTerm = useCallback((searchTerm: string) => {
    updateFilter('searchTerm', searchTerm);
  }, [updateFilter]);

  const updateTypeFilter = useCallback((typeFilter: 'all' | 'park' | 'street') => {
    updateFilter('typeFilter', typeFilter);
  }, [updateFilter]);

  const updateSizeFilter = useCallback((sizeFilter: string[]) => {
    updateFilter('sizeFilter', sizeFilter);
  }, [updateFilter]);

  const updateLevelFilter = useCallback((levelFilter: string[]) => {
    updateFilter('levelFilter', levelFilter);
  }, [updateFilter]);

  const updateTagFilter = useCallback((tagFilter: string[]) => {
    updateFilter('tagFilter', tagFilter);
  }, [updateFilter]);

  const updateShowOnlyFavorites = useCallback((showOnlyFavorites: boolean) => {
    updateFilter('showOnlyFavorites', showOnlyFavorites);
  }, [updateFilter]);

  const updateDistanceFilterEnabled = useCallback((enabled: boolean) => {
    updateFilter('distanceFilterEnabled', enabled);
  }, [updateFilter]);

  const updateDistanceFilter = useCallback((distance: number) => {
    updateFilter('distanceFilter', distance);
  }, [updateFilter]);

  const updateRatingFilter = useCallback((rating: number[]) => {
    updateFilter('ratingFilter', rating);
  }, [updateFilter]);

  const updateRatingFilterEnabled = useCallback((enabled: boolean) => {
    updateFilter('ratingFilterEnabled', enabled);
  }, [updateFilter]);

  const updateSortBy = useCallback((sortBy: 'distance' | 'rating' | 'recent') => {
    updateFilter('sortBy', sortBy);
  }, [updateFilter]);

  const toggleFilters = useCallback(() => {
    setState(prev => {
      const newShowFilters = !prev.showFilters;
      return { ...prev, showFilters: newShowFilters };
    });
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setState({
      searchTerm: '',
      typeFilter: 'all',
      sizeFilter: [],
      levelFilter: [],
      tagFilter: [],
      showOnlyFavorites: false,
      distanceFilterEnabled: false,
      distanceFilter: 10,
      ratingFilterEnabled: false,
      ratingFilter: [0, 5],
      sortBy: 'distance',
      showFilters: state.showFilters // Keep filter visibility state
    });
  }, [state.showFilters]);

  // Get current filter state for external use
  const getCurrentFilters = useCallback(() => {
    return {
      searchQuery: state.searchTerm,
      levelFilter: state.levelFilter,
      sizeFilter: state.sizeFilter,
      tagFilter: state.tagFilter,
      isParkFilter: state.typeFilter === 'all' ? null : state.typeFilter === 'park'
    };
  }, [state]);

  // Get sort options
  const sortOptions = [
    { value: 'distance', label: 'Distance', icon: 'LocationOn' },
    { value: 'rating', label: 'Rating', icon: 'Star' },
    { value: 'recent', label: 'Recently Added', icon: 'Schedule' }
  ];

  return {
    // State
    state,
    
    // Computed values
    hasActiveFilters,
    filterSummary,
    filtersExpanded: state.showFilters, // Alias for component compatibility
    sortOptions,
    
    // Actions
    updateSearchTerm,
    updateTypeFilter,
    updateSizeFilter,
    updateLevelFilter,
    updateTagFilter,
    updateShowOnlyFavorites,
    updateDistanceFilterEnabled,
    updateDistanceFilter,
    updateRatingFilter,
    updateRatingFilterEnabled,
    updateSortBy,
    toggleFilters,
    clearAllFilters,
    
    // Utilities
    getCurrentFilters
  };
};
