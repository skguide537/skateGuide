'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
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
import { useCache } from '@/context/ToastContext';


interface Skatepark {
    _id: string;
    title: string;
    description: string;
    tags: string[];
    photoNames: string[];
    location: { coordinates: [number, number] };
    isPark: boolean;
    size: string;
    level: string;
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
    const [parks, setParks] = useState<Skatepark[]>([]);
    const [allParks, setAllParks] = useState<Skatepark[]>([]); 
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 4; // Adjust as needed
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
    const [prefetchedPages, setPrefetchedPages] = useState<Set<number>>(new Set());
    const [backgroundDataLoaded, setBackgroundDataLoaded] = useState(false);
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

    // Subscribe to cache invalidation events to refresh data when spots are added/deleted
    const refreshParks = useCallback(async () => {
      const fetchParks = async () => {
        try {

          // Refresh current page data
          const res = await fetch(`/api/skateparks?page=${page}&limit=${limit}`);
          if (!res.ok) throw new Error('Failed to fetch parks');
          const data = await res.json();

          // Add robust null checks to prevent crashes
          const parksData = Array.isArray(data?.parks) ? data.parks : [];
          const totalPagesData = data?.totalPages || 1;
          
          // Only update if we got valid data, otherwise keep existing data
          if (parksData.length > 0) {
            setParks(parksData);
            setTotalPages(totalPagesData);
          }
          
          // Also refresh all parks for distance calculations
          const allRes = await fetch(`/api/skateparks?limit=1000`);
          if (allRes.ok) {
            const allData = await allRes.json();
            const allParksData = Array.isArray(allData?.parks) ? allData.parks : [];
            
            // Only update if we got valid data, otherwise keep existing data
            if (allParksData.length > 0) {
              setAllParks(allParksData);
            }
          }
          
          // Clear any deleted spot IDs since we're refreshing
          setDeletedSpotIds(new Set());
          
          // Update last updated timestamp
          setLastUpdated(new Date());

        } catch (err) {
          console.error('Error refreshing parks:', err);
          // Don't clear existing data on error - keep what we have
        }
      };

      fetchParks();
    }, [page, limit]); // Include page and limit dependencies for accurate data

    useCache('skateparks', refreshParks);

    // Background refresh - periodically update data based on user preference
    useEffect(() => {
        const refreshInterval = getUserRefreshInterval();
        const interval = setInterval(() => {
            // Only refresh if user is actively viewing the page
            if (document.visibilityState === 'visible') {
                refreshParks();
                // Show a subtle toast to indicate background refresh
                showToast('Data refreshed in background', 'info', 2000);
            }
        }, refreshInterval);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshParks, showToast]);



    const fetchParks = useCallback(async (pageNumber: number = 1, isBackground: boolean = false) => {
        try {
            if (!isBackground) {
                setIsLoading(true);
            }
            
            const res = await fetch(`/api/skateparks?page=${pageNumber}&limit=${limit}`);
            const { data = [], totalCount = 0 } = await res.json();

            if (!isBackground) {
                // Regular page load - update current page
                setParks(Array.isArray(data) ? data : []);
                setPage(pageNumber);
                setTotalPages(Math.ceil(totalCount / limit));
            } else {
                // Background prefetch - just cache the data
                setPrefetchedPages(prev => new Set([...prev, pageNumber]));
            }
        } catch (err) {
            console.error(`Failed to fetch parks page ${pageNumber}:`, err);
            if (!isBackground) {
                setParks([]);
                setTotalPages(1);
            }
        } finally {
            if (!isBackground) {
                setIsLoading(false);
            }
        }
    }, [limit]);

    // Fetch all parks in background for instant pagination
    const fetchAllParksBackground = useCallback(async () => {
        try {
            const res = await fetch(`/api/skateparks?limit=1000`);
            if (res.ok) {
                const data = await res.json();
                // Handle both array and object responses
                const parksData = Array.isArray(data) ? data : (data.parks || data.data || []);
                setAllParks(parksData);
                setBackgroundDataLoaded(true);
            }
        } catch (error) {
            // Silent background fetch - don't show errors to user
        }
    }, []);



    const prefetchNextPages = useCallback(async () => {
        if (page >= totalPages) return;
        
        const nextPage = page + 1;
        const startIndex = (nextPage - 1) * limit;
        
        try {
            const res = await fetch(`/api/skateparks?page=${nextPage}&limit=${limit}`);
            if (res.ok) {
                const data = await res.json();
                // Store in background data for instant pagination
                setAllParks(prev => {
                    const newParks = [...(prev || [])];
                    data.parks.forEach((park: any, index: number) => {
                        newParks[startIndex + index] = park;
                    });
                    return newParks;
                });
            }
        } catch (error) {
            // Silent prefetch - don't show errors to user
        }
    }, [page, totalPages, limit]);

    // Get current page parks from background data or fallback to paginated data
    const getCurrentPageParks = useCallback((pageNum: number) => {
        if (backgroundDataLoaded && allParks && allParks.length > 0) {
            // Use background data for instant pagination
            const startIndex = (pageNum - 1) * limit;
            const endIndex = startIndex + limit;
            const result = allParks.slice(startIndex, endIndex);
            return Array.isArray(result) ? result : [];
        }
        // Fallback to current paginated data
        return Array.isArray(parks) ? parks : [];
    }, [backgroundDataLoaded, allParks, parks, limit]);

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
            const deletedSpot = parks.find(park => park._id === spotId) || allParks.find(park => park._id === spotId);
            const spotTitle = deletedSpot?.title || 'Spot';
            
            // Show success toast
            showToast(`"${spotTitle}" deleted successfully!`, 'success');
            
            // Remove from local state FIRST
            setParks(prev => prev.filter(park => park._id !== spotId));
            setAllParks(prev => prev.filter(park => park._id !== spotId));
            
            // Handle pagination edge case: if current page is empty, go to previous page
            const currentPageParks = getCurrentPageParks(page);
            if (currentPageParks && currentPageParks.length === 1 && page > 1) {
                setPage(page - 1);
            }
            
            // Update total pages
            setTotalPages(prev => Math.max(1, prev - 1));
            
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
    }, [page, getCurrentPageParks, showToast, parks, allParks, invalidateCache]);

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
                        fetchParks(page, false);
                        fetchAllParksBackground();
                    }, 1000);
                }
            }
        };
        checkForNewSpots();
        const timer = setTimeout(checkForNewSpots, 2000);
        return () => clearTimeout(timer);
    }, [fetchParks, fetchAllParksBackground, page]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            err => console.error(err),
            { enableHighAccuracy: true }
        );
    }, []);

    // Reset to page 1 when component mounts or when pathname changes
    useEffect(() => {
        // Only reset to page 1 when actually navigating to a different route
        // Don't reset when just the component re-renders
        if (pathname !== '/') {
            setPage(1);
            // Reset background data when coming back to home
            if (allParks.length > 0) {
                setBackgroundDataLoaded(false);
                setAllParks([]);
            }
        }
    }, [pathname, allParks.length]); // Include allParks.length dependency

    // Handle URL changes (e.g., when logo is clicked)
    useEffect(() => {
        const handleRouteChange = () => {
            setPage(1);
            if (allParks && allParks.length > 0) {
                setBackgroundDataLoaded(false);
                setAllParks([]);
            }
        };

        // Listen for route changes
        window.addEventListener('popstate', handleRouteChange);
        
        return () => {
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, [allParks]); // Include allParks dependency

    // Listen for navbar logo click when on home page
    useEffect(() => {
        const handleLogoClick = () => {
            setPage(1);
            // Reset background data when logo is clicked
            if (allParks && allParks.length > 0) {
                setBackgroundDataLoaded(false);
                setAllParks([]);
            }
        };

        // Listen for custom event from navbar
        window.addEventListener('resetToPageOne', handleLogoClick);
        
        return () => {
            window.removeEventListener('resetToPageOne', handleLogoClick);
        };
    }, [allParks]); // Include allParks dependency

    // Fetch parks when user coordinates are available
    useEffect(() => {
        // Always fetch first page immediately for fast initial load
        fetchParks(page);
    }, [page, fetchParks]);

    // Start background loading of all parks after initial load
    useEffect(() => {
        if (!isLoading && userCoords && !backgroundDataLoaded) {
            // Start background loading after a short delay
            const timer = setTimeout(() => {
                fetchAllParksBackground();
            }, 500); // Shorter delay for faster background loading

            return () => clearTimeout(timer);
        }
    }, [isLoading, userCoords, backgroundDataLoaded, fetchAllParksBackground]);

    // Memoize parks with distance calculation and filtering to prevent unnecessary re-renders
    const parksWithDistance = useMemo(() => {
        if (!userCoords) return [];
        
        const currentParks = getCurrentPageParks(page);
        // Add robust null checks to prevent crashes
        if (!Array.isArray(currentParks) || !currentParks || currentParks.length === 0) return [];
        
        let filtered = currentParks
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
                if (levelFilter.length > 0 && !levelFilter.includes(park.level)) return false;

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

        return filtered;
    }, [
        getCurrentPageParks, 
        page, 
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
        sortBy
    ]);

    // Update total pages when background data is loaded
    useEffect(() => {
        if (backgroundDataLoaded && allParks.length > 0) {
            const newTotalPages = Math.ceil(allParks.length / limit);
            setTotalPages(newTotalPages);
        }
    }, [backgroundDataLoaded, allParks.length, limit]);

    return (
        <Container maxWidth="lg" sx={{ mt: 6 }}>
            {/* Hero Section */}
            <Box 
                textAlign="center" 
                mb={8}
                sx={{
                    p: 6,
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
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
                    🛹 WELCOME TO SKATEGUIDE
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
                        {Array.from({ length: limit }).map((_, index) => (
                            <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
                                <SkeletonCard />
                            </Grid>
                        ))}
                    </Grid>
                </>
            ) : (
                <>
                    {/* Top: Page info and quick navigation */}
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mb: 4,
                        p: 3,
                        backgroundColor: 'var(--color-surface-elevated)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-md)',
                        background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body1" color="var(--color-text-secondary)" sx={{ fontWeight: 500 }}>
                                 Page {page} of {totalPages} • {allParks.length} total spots • {parksWithDistance.length} filtered
                             </Typography>
                            
                            {/* Back to First button when not on page 1 */}
                            {page > 1 && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setPage(1)}
                                    sx={{
                                        textTransform: 'none',
                                        fontSize: '0.75rem',
                                        py: 0.5,
                                        px: 1.5,
                                        borderColor: 'var(--color-accent-blue)',
                                        color: 'var(--color-accent-blue)',
                                        borderRadius: 'var(--radius-md)',
                                        transition: 'all var(--transition-fast)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(52, 152, 219, 0.1)',
                                            borderColor: 'var(--color-accent-blue)',
                                            transform: 'translateY(-1px)',
                                        }
                                    }}
                                >
                                    Back to First
                                </Button>
                            )}
                        </Box>
                        
                        {/* Quick page jump for power users */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                Jump to:
                            </Typography>
                            <TextField
                                size="small"
                                type="number"
                                value={page}
                                onChange={(e) => {
                                    const newPage = parseInt(e.target.value);
                                    if (newPage >= 1 && newPage <= totalPages) {
                                        setPage(newPage);
                                    }
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const target = e.target as HTMLInputElement;
                                        const newPage = parseInt(target.value);
                                        if (newPage >= 1 && newPage <= totalPages) {
                                            setPage(newPage);
                                        }
                                    }
                                }}
                                sx={{
                                    width: 70,
                                    '& .MuiOutlinedInput-root': {
                                        fontSize: '0.875rem',
                                        height: 32,
                                        '& input': {
                                            padding: '6px 8px',
                                            textAlign: 'center'
                                        }
                                    }
                                }}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                of {totalPages}
                            </Typography>
                        </Box>
                    </Box>

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
                        totalCount={allParks.length}
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

                    <Grid container spacing={4} id="skatepark-cards-container">
                        {/* Show actual skatepark cards */}
                        {parksWithDistance.map((park) => (
                            <Grid item xs={12} sm={6} md={4} key={park._id}>
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
                                    level={park.level}
                                    avgRating={park.avgRating}
                                    externalLinks={park.externalLinks || []}
                                    isDeleting={park.isDeleting}
                                    onDelete={handleSpotDelete}
                                />
                            </Grid>
                        ))}
                    </Grid>

                    {/* Bottom: Enhanced pagination controls */}
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        mt: 8, 
                        mb: 4,
                        p: 4,
                        backgroundColor: 'var(--color-surface-elevated)',
                        borderRadius: 'var(--radius-xl)',
                        boxShadow: 'var(--shadow-lg)',
                        border: '1px solid var(--color-border)',
                        background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: 'linear-gradient(90deg, var(--color-accent-green) 0%, var(--color-accent-blue) 50%, var(--color-accent-rust) 100%)',
                        }
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            {/* Enhanced Pagination */}
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(_, newPage) => setPage(newPage)}
                                color="primary"
                                size="large"
                                showFirstButton
                                showLastButton
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        color: 'var(--color-text-primary)',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'var(--color-surface)',
                                        fontWeight: 500,
                                        '&:hover': {
                                            backgroundColor: 'var(--color-accent-blue)',
                                            color: 'var(--color-surface-elevated)',
                                            borderColor: 'var(--color-accent-blue)',
                                        },
                                        '&.Mui-selected': {
                                            backgroundColor: 'var(--color-accent-blue)',
                                            color: 'var(--color-surface-elevated)',
                                            borderColor: 'var(--color-accent-blue)',
                                            '&:hover': {
                                                backgroundColor: 'var(--color-accent-blue)',
                                            }
                                        }
                                    },
                                    '& .MuiPaginationItem-ellipsis': {
                                        color: 'var(--color-text-secondary)',
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                    }
                                }}
                            />
                            
                            {/* Quick Page Input */}
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                gap: 1,
                                ml: 2,
                                    p: 1.5,
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)'
                            }}>
                                <Typography variant="body2" color="var(--color-text-primary)" sx={{ fontWeight: 500 }}>
                                    Go to:
                                </Typography>
                                <TextField
                                    type="number"
                                    value={page}
                                    onChange={(e) => {
                                        const newPage = parseInt(e.target.value);
                                        if (newPage >= 1 && newPage <= totalPages) {
                                            setPage(newPage);
                                        }
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const target = e.target as HTMLInputElement;
                                            const newPage = parseInt(target.value);
                                            if (newPage >= 1 && newPage <= totalPages) {
                                                setPage(newPage);
                                            }
                                        }
                                    }}
                                    sx={{
                                        width: 70,
                                        '& .MuiOutlinedInput-root': {
                                            fontSize: '0.875rem',
                                            height: 32,
                                            backgroundColor: 'var(--color-background)',
                                            '& input': {
                                                padding: '6px 8px',
                                                textAlign: 'center'
                                            },
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'var(--color-border)',
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'var(--color-accent-blue)',
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'var(--color-accent-blue)',
                                            }
                                        }
                                    }}
                                />
                                <Typography variant="body2" color="var(--color-text-secondary)" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                    of {totalPages}
                                    </Typography>
                                </Box>
                        </Box>
                    </Box>
                </>
            )}
        </Container>
    );
}
