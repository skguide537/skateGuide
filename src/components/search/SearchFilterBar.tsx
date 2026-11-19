'use client';

import React from 'react';
import { Box, Typography, Collapse } from '@mui/material';
import { useUser } from '@/context/UserContext';
import { useSearchFilterBar } from '@/hooks/useSearchFilterBar';
import { SEARCH_FILTER_STYLES, SEARCH_FILTER_CONSTANTS } from '@/constants/searchFilters';
import { Tag } from '@/types/enums';

// Import extracted components
import KeywordFilter from './filters/KeywordFilter';
import SortControl from './filters/SortControl';
import FilterSelect from './filters/FilterSelect';
import DistanceFilter from './filters/DistanceFilter';
import RatingFilter from './filters/RatingFilter';
import FavoritesFilter from './filters/FavoritesFilter';
import ApprovedFilter from './filters/ApprovedFilter';
import ActiveFilters from './ActiveFilters';
import FilterActions from './FilterActions';

interface SearchFilterBarProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    typeFilter: 'all' | 'park' | 'street';
    onTypeFilterChange: (type: 'all' | 'park' | 'street') => void;
    sizeFilter: string[];
    onSizeFilterChange: (sizes: string[]) => void;
    levelFilter: string[];
    onLevelFilterChange: (levels: string[]) => void;
    tagFilter: Tag[];
    onTagFilterChange: (tags: Tag[]) => void;
    showOnlyFavorites: boolean;
    onShowOnlyFavoritesChange: (show: boolean) => void;
    showOnlyApproved: boolean;
    onShowOnlyApprovedChange: (show: boolean) => void;
    distanceFilterEnabled: boolean;
    onDistanceFilterEnabledChange: (enabled: boolean) => void;
    distanceFilter: number;
    onDistanceFilterChange: (distance: number) => void;
    ratingFilterEnabled: boolean;
    onRatingFilterEnabledChange: (enabled: boolean) => void;
    ratingFilter: number[];
    onRatingFilterChange: (rating: number[]) => void;
    sortBy: 'distance' | 'rating' | 'recent';
    onSortByChange: (sort: 'distance' | 'rating' | 'recent') => void;
    userLocation: { lat: number; lng: number } | null;
}

export default function SearchFilterBar({
    searchTerm,
    onSearchChange,
    typeFilter,
    onTypeFilterChange,
    sizeFilter,
    onSizeFilterChange,
    levelFilter,
    onLevelFilterChange,
    tagFilter,
    onTagFilterChange,
    showOnlyFavorites,
    onShowOnlyFavoritesChange,
    showOnlyApproved,
    onShowOnlyApprovedChange,
    distanceFilterEnabled,
    onDistanceFilterEnabledChange,
    distanceFilter,
    onDistanceFilterChange,
    ratingFilterEnabled,
    onRatingFilterEnabledChange,
    ratingFilter,
    onRatingFilterChange,
    sortBy,
    onSortByChange,
    userLocation
}: SearchFilterBarProps) {
    const { user } = useUser();

    const {
        state,
        hasActiveFilters,
        filterSummary,
        filtersExpanded,
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
        clearAllFilters
    } = useSearchFilterBar();

    // Debug logging removed for cleaner console

    // Initialize hook state with props on mount
    React.useEffect(() => {
        updateSearchTerm(searchTerm);
        updateTypeFilter(typeFilter);
        updateSizeFilter(sizeFilter);
        updateLevelFilter(levelFilter);
        updateTagFilter(tagFilter);
        updateShowOnlyFavorites(showOnlyFavorites);
        updateDistanceFilterEnabled(distanceFilterEnabled);
        updateDistanceFilter(distanceFilter);
        updateRatingFilterEnabled(ratingFilterEnabled);
        updateRatingFilter(ratingFilter);
        updateSortBy(sortBy);
    }, [
        searchTerm, typeFilter, sizeFilter, levelFilter, tagFilter,
        showOnlyFavorites, distanceFilterEnabled, distanceFilter,
        ratingFilterEnabled, ratingFilter, sortBy,
        updateSearchTerm, updateTypeFilter, updateSizeFilter, updateLevelFilter,
        updateTagFilter, updateShowOnlyFavorites, updateDistanceFilterEnabled,
        updateDistanceFilter, updateRatingFilterEnabled, updateRatingFilter,
        updateSortBy
    ]);

    // Create wrapper functions that update both internal state and parent state
    const handleSearchChange = (value: string) => {
        updateSearchTerm(value);
        onSearchChange(value);
    };

    const handleTypeFilterChange = (value: 'all' | 'park' | 'street') => {
        updateTypeFilter(value);
        onTypeFilterChange(value);
    };

    const handleSizeFilterChange = (value: string[]) => {
        updateSizeFilter(value);
        onSizeFilterChange(value);
    };

    const handleLevelFilterChange = (value: string[]) => {
        updateLevelFilter(value);
        onLevelFilterChange(value);
    };

    const handleTagFilterChange = (value: string[]) => {
        updateTagFilter(value);
        onTagFilterChange(value as Tag[]);
    };

    const handleShowOnlyFavoritesChange = (value: boolean) => {
        updateShowOnlyFavorites(value);
        onShowOnlyFavoritesChange(value);
    };

    const handleShowOnlyApprovedChange = (value: boolean) => {
        onShowOnlyApprovedChange(value);
    };

    const handleDistanceFilterEnabledChange = (value: boolean) => {
        updateDistanceFilterEnabled(value);
        onDistanceFilterEnabledChange(value);
    };

    const handleDistanceFilterChange = (value: number) => {
        updateDistanceFilter(value);
        onDistanceFilterChange(value);
    };

    const handleRatingFilterEnabledChange = (value: boolean) => {
        updateRatingFilterEnabled(value);
        onRatingFilterEnabledChange(value);
    };

    const handleRatingFilterChange = (value: number[]) => {
        updateRatingFilter(value);
        onRatingFilterChange(value);
    };

    const handleSortByChange = (value: 'distance' | 'rating' | 'recent') => {
        updateSortBy(value);
        onSortByChange(value);
    };

    const handleClearFilters = () => {
        clearAllFilters();
        // Also call parent callbacks to sync the cleared state
        onSearchChange('');
        onTypeFilterChange('all');
        onSizeFilterChange([]);
        onLevelFilterChange([]);
        onTagFilterChange([]);
        onShowOnlyFavoritesChange(false);
        onDistanceFilterEnabledChange(false);
        onDistanceFilterChange(10);
        onRatingFilterEnabledChange(false);
        onRatingFilterChange([0, 5]);
        onSortByChange('distance');
    };

    return (
        <Box sx={SEARCH_FILTER_STYLES.container} data-testid="search-filter-bar">
            {/* Header */}
            <Typography variant="h6" sx={SEARCH_FILTER_STYLES.header}>
                🔍 Search & Filter Skate Spots
            </Typography>
                    
            {/* Search Bar and Sort Options */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <KeywordFilter
                    searchTerm={state.searchTerm}
                    onSearchChange={handleSearchChange}
                />
                
                <SortControl
                    sortBy={state.sortBy}
                    onSortByChange={handleSortByChange}
                />
            </Box>

            {/* Active Filters Display */}
            <ActiveFilters
                hasActiveFilters={hasActiveFilters}
                filterSummary={filterSummary}
                onClearAllFilters={handleClearFilters}
            />

            {/* Filter Actions */}
            <FilterActions
                filtersExpanded={filtersExpanded}
                onToggleFilters={toggleFilters}
                onClearAllFilters={handleClearFilters}
            />

            {/* Collapsible Filter Sections */}
            <Collapse in={filtersExpanded} timeout="auto">
                <Box sx={{ ...SEARCH_FILTER_STYLES.filterSection, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Line 1: Size | Skill Level | Tag | Type */}
                    <Box sx={SEARCH_FILTER_STYLES.filterRow}>
                        <FilterSelect
                            label="Size"
                            value={state.sizeFilter}
                            onChange={handleSizeFilterChange}
                            options={SEARCH_FILTER_CONSTANTS.SIZE_OPTIONS.map(size => ({ value: size, label: size }))}
                            selectionMode="single"
                            placeholder="Select Size"
                            sx={{ flex: 1, minWidth: 0, maxWidth: 200 }}
                        />
                        <FilterSelect
                            label="Skill Level"
                            value={state.levelFilter}
                            onChange={handleLevelFilterChange}
                            options={SEARCH_FILTER_CONSTANTS.LEVEL_OPTIONS.map(level => ({ value: level, label: level }))}
                            selectionMode="exclusive"
                            placeholder="Select Skill Level"
                            sx={{ flex: 1, minWidth: 0, maxWidth: 200 }}
                        />
                        <FilterSelect
                            label="Tag"
                            value={state.tagFilter}
                            onChange={handleTagFilterChange}
                            options={SEARCH_FILTER_CONSTANTS.TAG_OPTIONS.map(tag => ({ value: tag, label: tag }))}
                            selectionMode="multiple"
                            placeholder="Select Tags"
                            sx={{ flex: 1, minWidth: 0, maxWidth: 200 }}
                        />
                        <FilterSelect
                            label="Type"
                            value={state.typeFilter === 'all' ? [] : [state.typeFilter]}
                            onChange={(values) => {
                                const newType = values.length === 0 ? 'all' : values[0] as 'park' | 'street';
                                handleTypeFilterChange(newType);
                            }}
                            options={[
                                { value: 'park', label: 'Park' },
                                { value: 'street', label: 'Street' }
                            ]}
                            selectionMode="single"
                            placeholder="Select Type"
                            sx={{ flex: 1, minWidth: 0, maxWidth: 200 }}
                        />
                    </Box>

                    {/* Line 2: Show Favorites | Show Approved */}
                    <Box sx={SEARCH_FILTER_STYLES.filterRow}>
                        <FavoritesFilter
                            showOnlyFavorites={state.showOnlyFavorites}
                            onShowOnlyFavoritesChange={handleShowOnlyFavoritesChange}
                            user={user}
                        />
                        <ApprovedFilter
                            showOnlyApproved={showOnlyApproved}
                            onShowOnlyApprovedChange={handleShowOnlyApprovedChange}
                        />
                    </Box>

                     {/* Line 3: Rating Filter | Distance Filter */}
                     <Box sx={SEARCH_FILTER_STYLES.filterRow}>
                         <RatingFilter
                             ratingFilterEnabled={state.ratingFilterEnabled}
                             onRatingFilterEnabledChange={handleRatingFilterEnabledChange}
                             ratingFilter={state.ratingFilter}
                             onRatingFilterChange={handleRatingFilterChange}
                         />
                         <DistanceFilter
                             distanceFilterEnabled={state.distanceFilterEnabled}
                             onDistanceFilterEnabledChange={handleDistanceFilterEnabledChange}
                             distanceFilter={state.distanceFilter}
                            onDistanceFilterChange={handleDistanceFilterChange}
                            disabled={!userLocation}
                         />
                     </Box>
                </Box>
            </Collapse>
        </Box>
    );
}
