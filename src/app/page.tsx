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
            err => console.error(err),
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
        handleRatingFilterChange,
        handleSortByChange,
        parksWithDistance,
    } = useParksFiltering(parks, userCoords, deletedSpotIds, deletingSpotIds);

    // Use custom hooks for virtual grid
    const gridColumns = useResponsiveGrid();
    const { parentRef, virtualizer } = useVirtualGrid(parksWithDistance, gridColumns);

    return (
        <Container maxWidth="lg" sx={{ mt: 6 }}>
            {/* Hero Section */}
            <HeroSection
                showHero={showHero}
                onHideHero={handleHideHero}
                onShowHero={handleShowHero}
            />

            {/* Loading or Content */}
            {!userCoords || isLoading ? (
                <LoadingSection userCoords={userCoords} />
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
                        distanceFilterEnabled={distanceFilterEnabled}
                        onDistanceFilterEnabledChange={handleDistanceFilterEnabledChange}
                        distanceFilter={distanceFilter}
                        onDistanceFilterChange={handleDistanceFilterChange}
                        ratingFilter={ratingFilter}
                        onRatingFilterChange={handleRatingFilterChange}
                        sortBy={sortBy}
                        onSortByChange={handleSortByChange}
                        filteredCount={parksWithDistance.length}
                        totalCount={parks.length}
                        userLocation={userCoords}
                    />

                    {/* Status Indicators */}
                    <StatusIndicators
                        lastUpdated={lastUpdated}
                        parksWithDistance={parksWithDistance}
                        parks={parks}
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
