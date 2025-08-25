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
  ratingFilter: number[];
  sortBy: 'default' | 'distance' | 'rating' | 'recent';
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
    ratingFilter: [0, 5],
    sortBy: 'default',
    showFilters: false
  });

  // Get unique values for filter options
  const allSizes = ['Small', 'Medium', 'Large'];
  const allLevels = ['All Levels', 'Beginner', 'Intermediate', 'Expert'];
  const uniqueTags = ['Ramp', 'Rail', 'Stairs', 'Gap', 'Bowl', 'Halfpipe', 'Street', 'Park'];

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return state.searchTerm.trim().length > 0 ||
           state.typeFilter !== 'all' ||
           state.sizeFilter.length > 0 ||
           state.levelFilter.length > 0 ||
           state.tagFilter.length > 0 ||
           state.showOnlyFavorites ||
           state.distanceFilterEnabled ||
           state.ratingFilter[0] !== 0 ||
           state.ratingFilter[1] !== 5 ||
           state.sortBy !== 'default';
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
    if (state.sizeFilter.length > 0) {
      activeFilters.push(`${state.sizeFilter.length} size(s)`);
    }
    if (state.levelFilter.length > 0) {
      if (state.levelFilter.includes('All Levels')) {
        activeFilters.push('All Levels');
      } else {
        activeFilters.push(`${state.levelFilter.length} level(s)`);
      }
    }
    if (state.tagFilter.length > 0) {
      activeFilters.push(`${state.tagFilter.length} tag(s)`);
    }
    if (state.showOnlyFavorites) {
      activeFilters.push('Favorites only');
    }
    if (state.distanceFilterEnabled) {
      activeFilters.push(`Within ${state.distanceFilter}km`);
    }
    if (state.ratingFilter[0] > 0 || state.ratingFilter[1] < 5) {
      const min = state.ratingFilter[0];
      const max = state.ratingFilter[1];
      if (min === max) {
        activeFilters.push(`${min}+ stars`);
      } else {
        activeFilters.push(`${min}-${max} stars`);
      }
    }
    if (state.sortBy !== 'default') {
      const sortLabels = {
        distance: 'By distance',
        rating: 'By rating',
        recent: 'By recent'
      };
      activeFilters.push(sortLabels[state.sortBy]);
    }
    
    return activeFilters;
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
    // Handle mutual exclusivity: "All Levels" cannot be selected with other levels
    if (levelFilter.includes('All Levels')) {
      // If "All Levels" is selected, clear other selections
      updateFilter('levelFilter', ['All Levels']);
    } else if (levelFilter.length > 0) {
      // If specific levels are selected, ensure "All Levels" is not included
      const filteredLevels = levelFilter.filter(level => level !== 'All Levels');
      updateFilter('levelFilter', filteredLevels);
    } else {
      // No levels selected
      updateFilter('levelFilter', levelFilter);
    }
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

  const updateSortBy = useCallback((sortBy: 'default' | 'distance' | 'rating' | 'recent') => {
    updateFilter('sortBy', sortBy);
  }, [updateFilter]);

  const toggleFilters = useCallback(() => {
    setState(prev => ({ ...prev, showFilters: !prev.showFilters }));
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
      ratingFilter: [0, 5],
      sortBy: 'default',
      showFilters: state.showFilters // Keep filter visibility state
    });
  }, [state.showFilters]);

  // Get current filter state for external use
  const getCurrentFilters = useCallback(() => {
    // Handle "All Levels" - if selected, don't filter by specific levels
    const effectiveLevelFilter = state.levelFilter.includes('All Levels') ? [] : state.levelFilter;
    
    return {
      searchQuery: state.searchTerm,
      levelFilter: effectiveLevelFilter,
      sizeFilter: state.sizeFilter,
      tagFilter: state.tagFilter,
      isParkFilter: state.typeFilter === 'all' ? null : state.typeFilter === 'park'
    };
  }, [state]);

  // Get sort options
  const sortOptions = [
    { value: 'default', label: 'Default', icon: null },
    { value: 'distance', label: 'Distance', icon: 'LocationOn' },
    { value: 'rating', label: 'Rating', icon: 'Star' },
    { value: 'recent', label: 'Recent', icon: 'Schedule' }
  ];

  return {
    // State
    state,
    
    // Computed values
    allSizes,
    allLevels,
    uniqueTags,
    hasActiveFilters,
    filterSummary,
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
    updateSortBy,
    toggleFilters,
    clearAllFilters,
    
    // Utilities
    getCurrentFilters
  };
};
