import { useState, useCallback, useMemo } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { ParksFilterService, FilterState, FilteredSkatepark } from '@/services/parksFilter.service';
import { SkateparkBasic } from '@/types/skatepark';

export function useParksFiltering(parks: SkateparkBasic[], userCoords: { lat: number; lng: number } | null, deletedSpotIds: Set<string>, deletingSpotIds: Set<string>) {
    const { favorites } = useFavorites();

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'park' | 'street'>('all');
    const [sizeFilter, setSizeFilter] = useState<string[]>([]);
    const [levelFilter, setLevelFilter] = useState<string[]>([]);
    const [tagFilter, setTagFilter] = useState<string[]>([]);
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const [distanceFilterEnabled, setDistanceFilterEnabled] = useState(false);
    const [distanceFilter, setDistanceFilter] = useState<number>(10);
    const [ratingFilterEnabled, setRatingFilterEnabled] = useState<boolean>(false);
    const [ratingFilter, setRatingFilter] = useState<number[]>([0, 5]);
    const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'recent'>('distance');

    // Stabilize state setter functions to prevent infinite loops
    const handleSearchChange = useCallback((term: string) => setSearchTerm(term), []);
    const handleTypeFilterChange = useCallback((type: 'all' | 'park' | 'street') => setTypeFilter(type), []);
    const handleSizeFilterChange = useCallback((sizes: string[]) => setSizeFilter(sizes), []);
    const handleLevelFilterChange = useCallback((levels: string[]) => setLevelFilter(levels), []);
    const handleTagFilterChange = useCallback((tags: string[]) => setTagFilter(tags), []);
    const handleShowOnlyFavoritesChange = useCallback((show: boolean) => setShowOnlyFavorites(show), []);
    const handleDistanceFilterEnabledChange = useCallback((enabled: boolean) => setDistanceFilterEnabled(enabled), []);
    const handleDistanceFilterChange = useCallback((distance: number) => setDistanceFilter(distance), []);
    const handleRatingFilterEnabledChange = useCallback((enabled: boolean) => setRatingFilterEnabled(enabled), []);
    const handleRatingFilterChange = useCallback((rating: number[]) => setRatingFilter(rating), []);
    const handleSortByChange = useCallback((sort: 'distance' | 'rating' | 'recent') => setSortBy(sort), []);

    // Create filter state object for the service
    const filterState: FilterState = useMemo(() => ({
        searchTerm,
        typeFilter,
        sizeFilter,
        levelFilter,
        tagFilter,
        showOnlyFavorites,
        distanceFilterEnabled,
        distanceFilter,
        ratingFilterEnabled,
        ratingFilter,
        sortBy,
    }), [
        searchTerm,
        typeFilter,
        sizeFilter,
        levelFilter,
        tagFilter,
        showOnlyFavorites,
        distanceFilterEnabled,
        distanceFilter,
        ratingFilterEnabled,
        ratingFilter,
        sortBy,
    ]);

    // Memoize parks with distance calculation and filtering to prevent unnecessary re-renders
    const parksWithDistance = useMemo(() => {
        return ParksFilterService.filterAndSortParks(
            parks,
            filterState,
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
        handleDistanceFilterEnabledChange,
        handleDistanceFilterChange,
        handleRatingFilterEnabledChange,
        handleRatingFilterChange,
        handleSortByChange,
        
        // Computed values
        parksWithDistance,
    };
}
