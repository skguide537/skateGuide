'use client';

import { useEffect, useRef } from 'react';
import Container from '@mui/material/Container';
import SearchFilterBar from '@/components/search/SearchFilterBar';
import HeroSection from '@/components/home/HeroSection';
import LoadingSection from '@/components/home/LoadingSection';
import VirtualGrid from '@/components/home/VirtualGrid';
import { useParksData } from '@/hooks/useParksData';
import { useParksFiltering } from '@/hooks/useParksFiltering';
import { useResponsiveGrid, useVirtualGrid } from '@/hooks/useVirtualGrid';
import { HOME_PAGE_CONSTANTS } from '@/constants/homePage';
import { useGeolocationContext } from '@/context/GeolocationContext';
import { useToast } from '@/context/ToastContext';
import { useStoredBoolean } from '@/hooks/useStoredBoolean';

export default function HomePage() {
    // Hero visibility state
    const [showHero, setShowHero] = useStoredBoolean(HOME_PAGE_CONSTANTS.LOCAL_STORAGE_KEYS.SHOW_HERO, true);
    const { showToast } = useToast();

    const handleHideHero = () => setShowHero(false);
    const handleShowHero = () => setShowHero(true);

    const { status: geoStatus, coords: userCoords, isLoading: isGeoLoading } = useGeolocationContext();
    const prevGeoStatusRef = useRef<typeof geoStatus>('loading');

    // Show toast when location is denied/blocked (only when status changes to fallback)
    useEffect(() => {
        if (geoStatus === 'fallback' && prevGeoStatusRef.current !== 'fallback') {
            showToast('We couldn\'t access your location. Showing popular parks instead.', 'info');
        }
        prevGeoStatusRef.current = geoStatus;
    }, [geoStatus, showToast]);

    // Use custom hooks for data management
    const {
        parks,
        isLoading,
        deletedSpotIds, 
        deletingSpotIds,
        lastUpdated,
        handleSpotDelete,
    } = useParksData();

    // Use custom hooks for filtering
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
        parksWithDistance,
    } = useParksFiltering(parks, userCoords, deletedSpotIds, deletingSpotIds);

    const forcedSortRef = useRef<'rating' | null>(null);

    useEffect(() => {
        if (geoStatus === 'fallback') {
            if (sortBy === 'distance') {
                handleSortByChange('rating');
                forcedSortRef.current = 'rating';
            }

            if (distanceFilterEnabled) {
                handleDistanceFilterEnabledChange(false);
            }
        }

        if (geoStatus === 'success' && forcedSortRef.current === 'rating' && sortBy === 'rating') {
            handleSortByChange('distance');
            forcedSortRef.current = null;
        }
    }, [
        geoStatus,
        sortBy,
        handleSortByChange,
        distanceFilterEnabled,
        handleDistanceFilterEnabledChange,
    ]);

    // Use custom hooks for virtual grid
    const gridColumns = useResponsiveGrid();
    const { parentRef, virtualizer } = useVirtualGrid(parksWithDistance, gridColumns);

    const shouldShowSkeleton = isGeoLoading || isLoading;

    return (
        <Container maxWidth="lg" sx={{ mt: 6, pb: 4}}>
            {/* Hero Section */}
            <HeroSection
                showHero={showHero}
                onHideHero={handleHideHero}
                onShowHero={handleShowHero}
            />

            {/* Loading or Content */}
            {shouldShowSkeleton ? (
                <LoadingSection />
            ) : (
                <>
                    {/* Search and Filter Bar */}
                     <SearchFilterBar
                         searchTerm={searchTerm}
                         onSearchChange={handleSearchChange}
                         typeFilter={typeFilter}
                         onTypeFilterChange={handleTypeFilterChange}
                         sizeFilter={sizeFilter}
                         onSizeFilterChange={handleSizeFilterChange}
                         levelFilter={levelFilter}
                         onLevelFilterChange={handleLevelFilterChange}
                         tagFilter={tagFilter}
                         onTagFilterChange={handleTagFilterChange}
                         showOnlyFavorites={showOnlyFavorites}
                         onShowOnlyFavoritesChange={handleShowOnlyFavoritesChange}
                         showOnlyApproved={showOnlyApproved}
                         onShowOnlyApprovedChange={handleShowOnlyApprovedChange}
                         distanceFilterEnabled={distanceFilterEnabled}
                         onDistanceFilterEnabledChange={handleDistanceFilterEnabledChange}
                         distanceFilter={distanceFilter}
                         onDistanceFilterChange={handleDistanceFilterChange}
                         ratingFilterEnabled={ratingFilterEnabled}
                         onRatingFilterEnabledChange={handleRatingFilterEnabledChange}
                         ratingFilter={ratingFilter}
                         onRatingFilterChange={handleRatingFilterChange}
                         sortBy={sortBy}
                         onSortByChange={handleSortByChange}
                         userLocation={geoStatus === 'success' ? userCoords : null}
                     />

                    {/* Virtual Scrolling Grid */}
                    <VirtualGrid
                        parentRef={parentRef}
                        virtualizer={virtualizer}
                        parksWithDistance={parksWithDistance}
                        gridColumns={gridColumns}
                                                 onDelete={handleSpotDelete}
                                             />
                </>
            )}
        </Container>
    );
}
