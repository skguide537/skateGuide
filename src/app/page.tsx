'use client';

import { useEffect, useState } from 'react';
import Container from '@mui/material/Container';
import SearchFilterBar from '@/components/search/SearchFilterBar';
import HeroSection from '@/components/home/HeroSection';
import LoadingSection from '@/components/home/LoadingSection';
import VirtualGrid from '@/components/home/VirtualGrid';
import StatusIndicators from '@/components/home/StatusIndicators';
import { useParksData } from '@/hooks/useParksData';
import { useParksFiltering } from '@/hooks/useParksFiltering';
import { useResponsiveGrid, useVirtualGrid } from '@/hooks/useVirtualGrid';
import { HOME_PAGE_CONSTANTS } from '@/constants/homePage';
import { logger } from '@/utils/logger';
import { Button, Box, Typography, Alert } from '@mui/material';
import { ErrorHandler } from '@/utils/errorHandler';
import { ErrorCode, ErrorSeverity } from '@/types/enums';
import { AppError } from '@/types/error-models';
import { ErrorModal } from '@/components/ui/ErrorModal';
import { ErrorState } from '@/components/ui/ErrorState';

export default function HomePage() {
    // Get user's location
     const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
    
    // Hero visibility state
    const [showHero, setShowHero] = useState(true);

         // Load hero visibility preference from localStorage after component mounts
         useEffect(() => {
        const saved = localStorage.getItem(HOME_PAGE_CONSTANTS.LOCAL_STORAGE_KEYS.SHOW_HERO);
             if (saved !== null) {
                 setShowHero(JSON.parse(saved));
             }
         }, []);

         // Function to hide hero and save preference
         const handleHideHero = () => {
             setShowHero(false);
        localStorage.setItem(HOME_PAGE_CONSTANTS.LOCAL_STORAGE_KEYS.SHOW_HERO, 'false');
         };

         // Function to show hero and save preference
         const handleShowHero = () => {
             setShowHero(true);
        localStorage.setItem(HOME_PAGE_CONSTANTS.LOCAL_STORAGE_KEYS.SHOW_HERO, 'true');
    };

    // Get user coordinates
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            err => logger.error('Geolocation error', err as unknown as Error, { component: 'HomePage' }),
            { enableHighAccuracy: true }
        );
    }, []);

    // Use custom hooks for data management
    const {
        parks,
        isLoading,
        deletedSpotIds, 
        deletingSpotIds,
        lastUpdated,
        handleSpotDelete,
        error, // Add error state
        clearError, // Add clear error function
    } = useParksData();

    // Use custom hooks for filtering
    const {
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
        parksWithDistance,
    } = useParksFiltering(parks, userCoords, deletedSpotIds, deletingSpotIds);

    // Use custom hooks for virtual grid
    const gridColumns = useResponsiveGrid();
    const { parentRef, virtualizer } = useVirtualGrid(parksWithDistance, gridColumns);

    // Test error states for demonstration
    const [modalError, setModalError] = useState<AppError | null>(null);
    const [inlineError, setInlineError] = useState<AppError | null>(null);

 

    // Close functions
    const closeModalError = () => setModalError(null);
    const closeInlineError = () => setInlineError(null);

    return (
        <Container maxWidth="xl" sx={{ py: 2 }}>
            {/* Hero Section */}
            {showHero && (
                <HeroSection 
                    showHero={showHero}
                    onHideHero={handleHideHero}
                    onShowHero={handleShowHero}
                />
            )}

            {/* Error State - Show when data loading fails */}
            {error && !isLoading && (
                <ErrorState
                    error={error}
                    onRetry={clearError}
                    className="home-error-state"
                    showDetails={true}
                />
            )}

            {/* Search & Filter Bar */}
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
                filteredCount={parksWithDistance?.length || 0}
                totalCount={parks?.length || 0}
                userLocation={userCoords}
            />

            {/* Main Content */}
            {isLoading ? (
                <LoadingSection userCoords={userCoords} />
            ) : error ? (
                // Don't show content when there's an error - ErrorState is shown above
                null
            ) : (
                <>
                    {/* Status Indicators */}
                    <StatusIndicators
                        totalSpots={parks.length}
                        filteredSpots={parksWithDistance.length}
                        lastUpdated={lastUpdated}
                        onRefresh={clearError} // Use clearError as refresh function
                    />

                    {/* Virtual Grid */}
                    <VirtualGrid
                        parentRef={parentRef}
                        virtualizer={virtualizer}
                        parks={parksWithDistance}
                        onSpotDelete={handleSpotDelete}
                        deletingSpotIds={deletingSpotIds}
                        gridColumns={gridColumns}
                    />
                </>
            )}

            {/* Test Error Handling System */}
            

            {/* Error Modal */}
            <ErrorModal
                error={modalError}
                open={!!modalError}
                onClose={() => setModalError(null)}
                onRetry={() => setModalError(null)}
                title="System Error"
            />

            {/* Inline Error State */}
            {inlineError && (
                <ErrorState
                    error={inlineError}
                    onRetry={() => setInlineError(null)}
                    className="test-error-state"
                    showDetails={true}
                />
            )}
        </Container>
    );
}
