'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import SkateparkCard from '@/components/skateparkCard/LightSkateparkCard';
import SkeletonCard from '@/components/loading/SkeletonCard';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import Box from '@mui/material/Box';
import SearchFilterBar from '@/components/search/SearchFilterBar';
import { useFavorites } from '@/hooks/useFavorites';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { useMediaQuery, useTheme as useMuiTheme, IconButton } from '@mui/material';
import { useCache } from '@/context/ToastContext';
import CloseIcon from '@mui/icons-material/Close';
import { useVirtualizer } from '@tanstack/react-virtual';


interface Skatepark {
    _id: string;
    title: string;
    description: string;
    tags: string[];
    photoNames: string[];
    location: { coordinates: [number, number] };
    isPark: boolean;
    size: string;
    levels: string[];
    avgRating: number;
    externalLinks?: {
        url: string;
        sentBy: { id: string; name: string };
        sentAt: string;
    }[];
}

function getDistanceKm(userLat: number, userLng: number, parkLat: number, parkLng: number): number {
    const R = 6371;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(parkLat - userLat);
    const dLng = toRad(parkLng - userLng);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(userLat)) * Math.cos(toRad(parkLat)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function HomePage() {
    // Configuration constants
    const BACKGROUND_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Get user's preferred refresh interval from localStorage (default: 5 minutes)
    const getUserRefreshInterval = () => {
        const saved = localStorage.getItem('skateGuide_refreshInterval');
        if (saved) {
            const interval = parseInt(saved);
            return interval > 0 ? interval * 60 * 1000 : BACKGROUND_REFRESH_INTERVAL;
        }
        return BACKGROUND_REFRESH_INTERVAL;
    };
    const router = useRouter();
    const pathname = usePathname();
    const { showToast, invalidateCache } = useToast();
    const { favorites } = useFavorites();
    const { theme } = useTheme();

    // Responsive breakpoints for grid layout
    const muiTheme = useMuiTheme();
    const isXs = useMediaQuery(muiTheme.breakpoints.only('xs')); // Mobile
    const isSm = useMediaQuery(muiTheme.breakpoints.only('sm')); // Small tablet
    const isMd = useMediaQuery(muiTheme.breakpoints.only('md')); // Medium tablet
    const isLg = useMediaQuery(muiTheme.breakpoints.up('lg'));  // Desktop and up

    // Grid columns calculation for virtual scrolling
    const gridColumns = useMemo(() => {
        if (isXs) return 2;  // Mobile: 2 columns
        if (isSm) return 2;  // Small tablet: 2 columns
        if (isMd) return 3;  // Medium tablet: 3 columns
        if (isLg) return 3;  // Desktop: 3 columns
        return 2; // Default fallback
    }, [isXs, isSm, isMd, isLg]);

         const [parks, setParks] = useState<Skatepark[]>([]);
     const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
     const [isLoading, setIsLoading] = useState(true);
     const [deletedSpotIds, setDeletedSpotIds] = useState<Set<string>>(new Set());
     const [deletingSpotIds, setDeletingSpotIds] = useState<Set<string>>(new Set());

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'park' | 'street'>('all');
    const [sizeFilter, setSizeFilter] = useState<string[]>([]);
    const [levelFilter, setLevelFilter] = useState<string[]>([]);
    const [tagFilter, setTagFilter] = useState<string[]>([]);
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const [distanceFilterEnabled, setDistanceFilterEnabled] = useState(false);
    const [distanceFilter, setDistanceFilter] = useState<number>(10);
    const [ratingFilter, setRatingFilter] = useState<number[]>([0, 5]);
    const [sortBy, setSortBy] = useState<'default' | 'distance' | 'rating' | 'recent'>('default');
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
         const [showHero, setShowHero] = useState(true);

          // Subscribe to cache invalidation events to refresh data when spots are added/deleted
     const refreshParks = useCallback(async () => {
       try {
         // Refresh all parks data for virtual scrolling
         const res = await fetch(`/api/skateparks?limit=1000`);
         if (!res.ok) throw new Error('Failed to fetch parks');
         const data = await res.json();

         // Add robust null checks to prevent crashes
         const parksData = Array.isArray(data?.parks) ? data.parks : [];
         
         // Only update if we got valid data, otherwise keep existing data
         if (parksData.length > 0) {
           setParks(parksData);
         }
         
         // Clear any deleted spot IDs since we're refreshing
         setDeletedSpotIds(new Set());
         
         // Update last updated timestamp
         setLastUpdated(new Date());

       } catch (err) {
         console.error('Error refreshing parks:', err);
         // Don't clear existing data on error - keep what we have
       }
     }, []);

    useCache('skateparks', refreshParks);

    // Background refresh - periodically update data based on user preference
    useEffect(() => {
        const refreshInterval = getUserRefreshInterval();
        const interval = setInterval(() => {
            // Only refresh if user is actively viewing the page
            if (document.visibilityState === 'visible') {
                refreshParks();
                // Show a subtle toast to indicate background refresh
                showToast('Data refreshed in background', 'info');
            }
        }, refreshInterval);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshParks, showToast]);



         const fetchParks = useCallback(async () => {
         try {
             setIsLoading(true);
             
             const res = await fetch(`/api/skateparks?limit=1000`);
             const { data = [] } = await res.json();

             // Update parks data for virtual scrolling
             setParks(Array.isArray(data) ? data : []);
         } catch (err) {
             console.error('Failed to fetch parks:', err);
             setParks([]);
         } finally {
             setIsLoading(false);
         }
     }, []);



    

    // Handle spot deletion with optimistic updates
    const handleSpotDelete = useCallback(async (spotId: string) => {
        // Optimistically mark as deleting
        setDeletingSpotIds(prev => new Set([...prev, spotId]));
        
        // Create a timeout promise - increased to 10 seconds
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Delete operation timed out')), 10000);
        });
        
        try {
            // Get user ID from localStorage or context (you'll need to implement this)
            const userResponse = await fetch('/api/auth/me');
            if (!userResponse.ok) {
                throw new Error('User not authenticated');
            }
            const userData = await userResponse.json();
            
            // Delete from backend with timeout
            const deletePromise = fetch(`/api/skateparks/${spotId}`, {
                method: 'DELETE',
                headers: {
                    'x-user-id': userData._id || '',
                },
            });
            
            const response = await Promise.race([deletePromise, timeoutPromise]) as Response;
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to delete spot`);
            }

            // Success - mark as deleted and remove from state
            setDeletedSpotIds(prev => new Set([...prev, spotId]));
            setDeletingSpotIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(spotId);
                return newSet;
            });
            
                         // Get spot title for better toast message
             const deletedSpot = parks.find(park => park._id === spotId);
             const spotTitle = deletedSpot?.title || 'Spot';
             
             // Show success toast
             showToast(`"${spotTitle}" deleted successfully!`, 'success');
             
             // Remove from local state FIRST
             setParks(prev => prev.filter(park => park._id !== spotId));
            
            // Handle deletion - no pagination needed with virtual scrolling
            // Just remove from the list and let virtual scrolling handle the rest
            
            // Invalidate caches AFTER state updates are complete to prevent race conditions
            setTimeout(() => {
                invalidateCache('skateparks');
                invalidateCache('spots');
                invalidateCache('map-markers');
            }, 500); // Increased delay to ensure database transaction is committed
            
        } catch (error: any) {
            console.error('Delete failed:', error);
            
            // Remove from deleting state
            setDeletingSpotIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(spotId);
                return newSet;
            });
            
            // Show error to user (we'll add toast later)
            showToast(`Failed to delete spot: ${error.message}`, 'error');
        }
    }, [showToast, parks, invalidateCache]);

    // Check for newly added spots when component mounts (only once)
    useEffect(() => {
        const checkForNewSpots = () => {
            const spotJustAdded = localStorage.getItem('spotJustAdded');
            const spotAddedAt = localStorage.getItem('spotAddedAt');
            
            if (spotJustAdded === 'true' && spotAddedAt) {
                const timeSinceAdded = Date.now() - parseInt(spotAddedAt);
                if (timeSinceAdded < 10000) {
                    localStorage.removeItem('spotJustAdded');
                    localStorage.removeItem('spotAddedAt');
                     setTimeout(() => {
                         fetchParks();
                     }, 1000);
                }
            }
        };
        checkForNewSpots();
        const timer = setTimeout(checkForNewSpots, 2000);
        return () => clearTimeout(timer);
    }, [fetchParks]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            err => console.error(err),
            { enableHighAccuracy: true }
        );
    }, []);



    // Fetch parks when user coordinates are available
    useEffect(() => {
        // Always fetch parks immediately for virtual scrolling
        fetchParks();
    }, [fetchParks]);



    // Memoize parks with distance calculation and filtering to prevent unnecessary re-renders
    const parksWithDistance = useMemo(() => {
        if (!userCoords) return [];
        
        // For virtual scrolling, we always use parks data
        const sourceParks = parks;
        
        // Add robust null checks to prevent crashes
        if (!Array.isArray(sourceParks) || !sourceParks || sourceParks.length === 0) return [];
        
        let filtered = sourceParks
            .filter(park => park && park._id && !deletedSpotIds.has(park._id)) // Filter out deleted spots and null parks
            .filter(park => {
                if (!park) return false;

                // Search filter
                if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    const matchesSearch = 
                        park.title.toLowerCase().includes(searchLower) ||
                        park.description.toLowerCase().includes(searchLower) ||
                        park.tags.some(tag => tag.toLowerCase().includes(searchLower));
                    if (!matchesSearch) return false;
                }

                // Type filter
                if (typeFilter !== 'all') {
                    if (typeFilter === 'park' && !park.isPark) return false;
                    if (typeFilter === 'street' && park.isPark) return false;
                }

                // Size filter
                if (sizeFilter.length > 0 && !sizeFilter.includes(park.size)) return false;

                // Level filter
                if (levelFilter.length > 0 && (!park.levels || !park.levels.some(level => level !== null && level !== undefined && levelFilter.includes(level)))) return false;

                // Tag filter
                if (tagFilter.length > 0) {
                    const hasMatchingTag = tagFilter.some(tag => park.tags.includes(tag));
                    if (!hasMatchingTag) return false;
                }

                // Distance filter
                if (distanceFilterEnabled) {
                    const distance = getDistanceKm(
                        userCoords.lat,
                        userCoords.lng,
                        park.location.coordinates[1],
                        park.location.coordinates[0]
                    );
                    if (distance > distanceFilter) return false;
                }

                // Rating filter
                if (park.avgRating < ratingFilter[0] || park.avgRating > ratingFilter[1]) return false;

                // Favorites filter (only if user is logged in and filter is enabled)
                if (showOnlyFavorites) {
                    if (!favorites.includes(park._id)) return false;
                }

                return true;
            })
            .map((park) => {
                if (!park || !park.location || !park.location.coordinates) return null;
                
                const parkCoords = {
                    lat: park.location.coordinates[1],
                    lng: park.location.coordinates[0],
                };
                const distanceKm = getDistanceKm(
                    userCoords.lat,
                    userCoords.lng,
                    parkCoords.lat,
                    parkCoords.lng
                );

                return {
                    ...park,
                    coordinates: parkCoords,
                    distanceKm,
                    isDeleting: deletingSpotIds.has(park._id), // Track deletion state
                };
            })
            .filter(Boolean); // Remove any null entries

        // Apply sorting based on sortBy selection
        if (sortBy === 'distance' || (distanceFilterEnabled && sortBy === 'default')) {
            // Sort by distance (closest first)
            filtered = filtered.sort((a, b) => {
                if (!a || !b) return 0;
                return a.distanceKm - b.distanceKm;
            });
        } else if (sortBy === 'rating') {
            // Sort by rating (highest first)
            filtered = filtered.sort((a, b) => {
                if (!a || !b) return 0;
                return b.avgRating - a.avgRating;
            });
        } else if (sortBy === 'recent') {
            // Sort by recently added (newest first) - using _id as proxy for creation time
            filtered = filtered.sort((a, b) => {
                if (!a || !b) return 0;
                // MongoDB ObjectIds contain timestamp, so we can sort by them
                return b._id.localeCompare(a._id);
            });
        }
        // For 'default' without distance filter, maintain original order

                 // No pagination needed with virtual scrolling - return all filtered results

        return filtered;
              }, [
         userCoords, 
         deletedSpotIds, 
         deletingSpotIds,
         searchTerm,
         typeFilter,
         sizeFilter,
         levelFilter,
         tagFilter,
         showOnlyFavorites,
         favorites,
         distanceFilterEnabled,
         distanceFilter,
         ratingFilter,
         sortBy,
                   parks
     ]);

     // Virtual scrolling setup
     const parentRef = useRef<HTMLDivElement>(null);
     const virtualizer = useVirtualizer({
         count: Math.ceil(parksWithDistance.length / gridColumns), // Count rows, not individual items
         getScrollElement: () => parentRef.current,
         estimateSize: () => 440, // 420px card height + 20px spacing between rows
         overscan: 3, // Number of rows to render outside the viewport
     });

     // No pagination needed with virtual scrolling

    return (
        <Container maxWidth="lg" sx={{ mt: 6 }}>
            {/* Hero Section */}
            {showHero && (
                <Box 
                    textAlign="center" 
                    mb={8}
                    sx={{
                        p: 6,
                        background: theme === 'dark' 
                            ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)'
                            : 'linear-gradient(135deg, rgba(52, 152, 219, 0.3) 0%, rgba(46, 204, 113, 0.3) 100%)',
                        borderRadius: 'var(--radius-xl)',
                        boxShadow: 'var(--shadow-xl)',
                        border: '1px solid var(--color-border)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                            opacity: 0.1,
                        },
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: theme === 'dark'
                                ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%)'
                                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                            pointerEvents: 'none',
                        }
                    }}
                >
                    {/* Close Button */}
                    <IconButton
                        onClick={() => setShowHero(false)}
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            zIndex: 10,
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                <Typography 
                    variant="h1" 
                    fontWeight="800" 
                    color="var(--color-accent-green)" 
                    gutterBottom 
                    id="home-welcome-heading"
                    sx={{
                        textShadow: theme === 'dark' 
                            ? '0 4px 8px rgba(0, 0, 0, 0.7), 0 2px 4px rgba(0, 0, 0, 0.5)'
                            : '0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)',
                        mb: 3,
                        fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                        filter: theme === 'dark' 
                            ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))'
                            : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                    WELCOME TO SKATEGUIDE 🛹
                </Typography>
                <Typography 
                    variant="h5" 
                    sx={{ 
                        mb: 5, 
                        color: 'var(--color-accent-green)',
                        fontWeight: 600,
                        textShadow: theme === 'dark'
                            ? '0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.6)'
                            : '0 1px 2px rgba(0, 0, 0, 0.2)',
                        maxWidth: '600px',
                        mx: 'auto',
                        filter: theme === 'dark'
                            ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.9))'
                            : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
                        position: 'relative',
                        zIndex: 2
                    }} 
                    id="home-subtitle"
                >
                    Discover, rate, and share skateparks around the city — from wooden ramps to metallic rails.
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => router.push('/map')}
                    id="home-explore-map-btn"
                    sx={{
                        backgroundColor: 'var(--color-accent-rust)',
                        color: 'var(--color-surface-elevated)',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        px: 5,
                        py: 2,
                        borderRadius: 'var(--radius-lg)',
                        border: '3px solid var(--color-accent-rust)',
                        boxShadow: 'var(--shadow-lg)',
                        transition: 'all var(--transition-fast)',
                        textTransform: 'none',
                        position: 'relative',
                        zIndex: 2,
                        '&:hover': { 
                            backgroundColor: 'var(--color-accent-rust)',
                            transform: 'translateY(-3px)',
                            boxShadow: 'var(--shadow-xl)',
                        }
                    }}
                >
                    Explore the Map
                </Button>
                </Box>
            )}

            {!userCoords ? (
                <Box display="flex" justifyContent="center" mt={4}>
                    <Box sx={{ 
                        textAlign: 'center',
                        p: 4,
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <CircularProgress size={40} sx={{ color: 'var(--color-accent-blue)', mb: 2 }} />
                        <Typography variant="body1" color="var(--color-text-secondary)" fontWeight={500}>
                            Getting your location...
                        </Typography>
                    </Box>
                </Box>
            ) : isLoading ? (
                <>
                    {/* Loading header with progress info */}
                    <Box sx={{ 
                        textAlign: 'center', 
                        mb: 6,
                        p: 4,
                        backgroundColor: 'var(--color-surface-elevated)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-lg)',
                        background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)'
                    }}>
                        <CircularProgress size={40} sx={{ color: 'var(--color-accent-green)', mb: 3 }} />
                        <Typography variant="h5" color="var(--color-text-primary)" sx={{ mb: 2, fontWeight: 600 }}>
                            Loading Skateparks
                        </Typography>
                        <Typography variant="body1" color="var(--color-text-secondary)" fontWeight={500}>
                            Finding the best spots near you...
                        </Typography>
                    </Box>
                    
                                         <Grid container spacing={4}>
                         {/* Show skeleton cards while loading */}
                         {Array.from({ length: 6 }).map((_, index) => (
                             <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`skeleton-${index}`}>
                                 <SkeletonCard />
                             </Grid>
                         ))}
                     </Grid>
                </>
            ) : (
                <>
                                                              {/* Search and Filter Bar */}
                     <SearchFilterBar
                         searchTerm={searchTerm}
                         onSearchChange={setSearchTerm}
                         typeFilter={typeFilter}
                         onTypeFilterChange={setTypeFilter}
                         sizeFilter={sizeFilter}
                         onSizeFilterChange={setSizeFilter}
                         levelFilter={levelFilter}
                         onLevelFilterChange={setLevelFilter}
                         tagFilter={tagFilter}
                         onTagFilterChange={setTagFilter}
                         showOnlyFavorites={showOnlyFavorites}
                         onShowOnlyFavoritesChange={setShowOnlyFavorites}
                         distanceFilterEnabled={distanceFilterEnabled}
                         onDistanceFilterEnabledChange={setDistanceFilterEnabled}
                         distanceFilter={distanceFilter}
                         onDistanceFilterChange={setDistanceFilter}
                         ratingFilter={ratingFilter}
                         onRatingFilterChange={setRatingFilter}
                         sortBy={sortBy}
                         onSortByChange={setSortBy}
                         filteredCount={parksWithDistance.length}
                         totalCount={parks.length}
                         userLocation={userCoords}
                     />

                    

                    {/* Last Updated Indicator */}
                    <Box sx={{ 
                        textAlign: 'center', 
                        mb: 4,
                        p: 2,
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-sm)',
                        background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-elevated) 100%)'
                    }}>
                        <Typography variant="body2" color="var(--color-text-secondary)" fontWeight={500}>
                            🔄 Last updated: {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                    </Box>

                                         {/* Virtual Scrolling Container */}
                     <Box
                         ref={parentRef}
                         sx={{
                             height: '600px',
                             overflow: 'auto',
                             border: '1px solid var(--color-border)',
                             borderRadius: 'var(--radius-lg)',
                             backgroundColor: 'var(--color-surface)',
                             p: 2,
                         }}
                     >
                         <div
                             style={{
                                 height: `${virtualizer.getTotalSize()}px`,
                                 width: '100%',
                                 position: 'relative',
                             }}
                         >
                             {virtualizer.getVirtualItems().map((virtualRow) => {
                                 const rowIndex = virtualRow.index;
                                 const startIndex = rowIndex * gridColumns;
                                 
                                 // Render all cards in this row
                                 return Array.from({ length: gridColumns }, (_, colIndex) => {
                                     const parkIndex = startIndex + colIndex;
                                     const park = parksWithDistance[parkIndex];
                                     
                                     if (!park) return null;
                                     
                                     return (
                                         <div
                                             key={`${rowIndex}-${colIndex}`}
                                             style={{
                                                 position: 'absolute',
                                                 top: `${rowIndex * 440}px`, // 420px card height + 20px spacing
                                                 left: `${colIndex * (100 / gridColumns)}%`,
                                                 width: `${100 / gridColumns}%`,
                                                 height: '420px',
                                                 padding: '10px',
                                                 boxSizing: 'border-box',
                                             }}
                                         >
                                             <SkateparkCard
                                                 _id={park._id}
                                                 title={park.title}
                                                 description={park.description}
                                                 tags={park.tags}
                                                 photoNames={park.photoNames}
                                                 distanceKm={park.distanceKm}
                                                 coordinates={park.coordinates}
                                                 isPark={park.isPark}
                                                 size={park.size}
                                                 levels={park.levels ? park.levels.filter(level => level !== null && level !== undefined) : []}
                                                 avgRating={park.avgRating}
                                                 externalLinks={park.externalLinks || []}
                                                 isDeleting={park.isDeleting}
                                                 onDelete={handleSpotDelete}
                                             />
                                         </div>
                                     );
                                 });
                             })}
                         </div>
                     </Box>

                                         {/* Virtual Scrolling Status */}
                     <Box sx={{ 
                         textAlign: 'center', 
                         mt: 4, 
                         mb: 4,
                         p: 3,
                         backgroundColor: 'var(--color-surface)',
                         borderRadius: 'var(--radius-lg)',
                         border: '1px solid var(--color-border)',
                         boxShadow: 'var(--shadow-sm)',
                         background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-elevated) 100%)'
                     }}>
                         <Typography variant="body2" color="var(--color-text-secondary)" fontWeight={500}>
                             🚀 Virtual scrolling enabled • Smooth performance with {parksWithDistance.length} spots
                         </Typography>
                     </Box>
                </>
            )}
        </Container>
    );
}
