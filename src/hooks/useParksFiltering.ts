import { useFavorites } from '@/hooks/useFavorites';
import { FilterState, ParksFilterService } from '@/services/parksFilter.service';
import { BaseSkatepark } from '@/types/skatepark';
import { useCallback, useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { lazyLoadFiltersSlice } from '@/store';

// Lazy load filters slice - load immediately when hook is called
let filtersSliceLoadPromise: Promise<void> | null = null;
const ensureFiltersSliceLoaded = () => {
  if (!filtersSliceLoadPromise) {
    filtersSliceLoadPromise = lazyLoadFiltersSlice();
  }
  return filtersSliceLoadPromise;
};

// Stable fallback values to prevent unnecessary re-renders
const EMPTY_STRING_ARRAY: string[] = [];
const EMPTY_TAG_ARRAY: import('@/types/enums').Tag[] = [];
const DEFAULT_RATING_FILTER: number[] = [0, 5];

// Stable fallback filter state to prevent unnecessary re-renders
const DEFAULT_FILTER_STATE = {
    searchTerm: '',
    typeFilter: 'all' as const,
    sizeFilter: EMPTY_STRING_ARRAY,
    levelFilter: EMPTY_STRING_ARRAY,
    tagFilter: EMPTY_TAG_ARRAY,
    showOnlyFavorites: false,
    showOnlyApproved: false,
    distanceFilterEnabled: false,
    distanceFilter: 50,
    ratingFilterEnabled: false,
    ratingFilter: DEFAULT_RATING_FILTER,
    sortBy: 'rating' as const,
} as const;

export function useParksFiltering(parks: BaseSkatepark[], userCoords: { lat: number; lng: number } | null, deletedSpotIds: Set<string>, deletingSpotIds: Set<string>) {
    const dispatch = useAppDispatch();
    const { favorites } = useFavorites();

    // Ensure slice is loaded before using selectors
    useEffect(() => {
        ensureFiltersSliceLoaded();
    }, []);

    // Get filter state from Redux with fallback
    const filterState = useAppSelector((state) => (state as any).filters ?? DEFAULT_FILTER_STATE);
    const {
        searchTerm,
        typeFilter,
        sizeFilter,
        levelFilter,
        tagFilter,
        showOnlyFavorites,
        showOnlyApproved,
        distanceFilterEnabled,
        distanceFilter,
        ratingFilterEnabled,
        ratingFilter,
        sortBy,
    } = filterState;

    // Stabilize state setter functions - slice is already loaded in useEffect
    const handleSearchChange = useCallback((term: string) => {
        import('@/store/slices/filtersSlice').then(({ setSearchTerm }) => {
            dispatch(setSearchTerm(term));
        });
    }, [dispatch]);
    
    const handleTypeFilterChange = useCallback((type: 'all' | 'park' | 'street') => {
        import('@/store/slices/filtersSlice').then(({ setTypeFilter }) => {
            dispatch(setTypeFilter(type));
        });
    }, [dispatch]);
    
    const handleSizeFilterChange = useCallback((sizes: string[]) => {
        import('@/store/slices/filtersSlice').then(({ setSizeFilter }) => {
            dispatch(setSizeFilter(sizes));
        });
    }, [dispatch]);
    
    const handleLevelFilterChange = useCallback((levels: string[]) => {
        import('@/store/slices/filtersSlice').then(({ setLevelFilter }) => {
            dispatch(setLevelFilter(levels));
        });
    }, [dispatch]);
    
    const handleTagFilterChange = useCallback((tags: import('@/types/enums').Tag[]) => {
        import('@/store/slices/filtersSlice').then(({ setTagFilter }) => {
            dispatch(setTagFilter(tags));
        });
    }, [dispatch]);
    
    const handleShowOnlyFavoritesChange = useCallback((show: boolean) => {
        import('@/store/slices/filtersSlice').then(({ setShowOnlyFavorites }) => {
            dispatch(setShowOnlyFavorites(show));
        });
    }, [dispatch]);
    
    const handleShowOnlyApprovedChange = useCallback((show: boolean) => {
        import('@/store/slices/filtersSlice').then(({ setShowOnlyApproved }) => {
            dispatch(setShowOnlyApproved(show));
        });
    }, [dispatch]);
    
    const handleDistanceFilterEnabledChange = useCallback((enabled: boolean) => {
        import('@/store/slices/filtersSlice').then(({ setDistanceFilterEnabled }) => {
            dispatch(setDistanceFilterEnabled(enabled));
        });
    }, [dispatch]);
    
    const handleDistanceFilterChange = useCallback((distance: number) => {
        import('@/store/slices/filtersSlice').then(({ setDistanceFilter }) => {
            dispatch(setDistanceFilter(distance));
        });
    }, [dispatch]);
    
    const handleRatingFilterEnabledChange = useCallback((enabled: boolean) => {
        import('@/store/slices/filtersSlice').then(({ setRatingFilterEnabled }) => {
            dispatch(setRatingFilterEnabled(enabled));
        });
    }, [dispatch]);
    
    const handleRatingFilterChange = useCallback((rating: number[]) => {
        import('@/store/slices/filtersSlice').then(({ setRatingFilter }) => {
            dispatch(setRatingFilter(rating));
        });
    }, [dispatch]);
    
    const handleSortByChange = useCallback((sort: 'distance' | 'rating' | 'recent') => {
        import('@/store/slices/filtersSlice').then(({ setSortBy }) => {
            dispatch(setSortBy(sort));
        });
    }, [dispatch]);

    // Memoize parks with distance calculation and filtering to prevent unnecessary re-renders
    const parksWithDistance = useMemo(() => {
        return ParksFilterService.filterAndSortParks(
            parks,
            filterState as FilterState,
            userCoords,
            favorites,
            deletedSpotIds,
            deletingSpotIds
        );
    }, [
        parks,
        filterState,
        userCoords,
        favorites,
        deletedSpotIds,
        deletingSpotIds,
    ]);

    return {
        // Filter state
        searchTerm,
        typeFilter,
        sizeFilter,
        levelFilter,
        tagFilter,
        showOnlyFavorites,
        showOnlyApproved,
        distanceFilterEnabled,
        distanceFilter,
        ratingFilterEnabled,
        ratingFilter,
        sortBy,
        
        // Handlers
        handleSearchChange,
        handleTypeFilterChange,
        handleSizeFilterChange,
        handleLevelFilterChange,
        handleTagFilterChange,
        handleShowOnlyFavoritesChange,
        handleShowOnlyApprovedChange,
        handleDistanceFilterEnabledChange,
        handleDistanceFilterChange,
        handleRatingFilterEnabledChange,
        handleRatingFilterChange,
        handleSortByChange,
        
        // Computed values
        parksWithDistance,
    };
}
