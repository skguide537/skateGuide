'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import SkateparkCard from '@/components/skateparkCard/LightSkateparkCard';
import SkeletonCard from '@/components/loading/SkeletonCard';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';


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
    const router = useRouter();
    const pathname = usePathname();
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
        if (backgroundDataLoaded && allParks.length > 0) {
            // Use background data for instant pagination
            const startIndex = (pageNum - 1) * limit;
            const endIndex = startIndex + limit;
            return allParks.slice(startIndex, endIndex);
        }
        // Fallback to current paginated data
        return parks;
    }, [backgroundDataLoaded, allParks, parks, limit]);


    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            err => console.error(err),
            { enableHighAccuracy: true }
        );
    }, []);

    // Reset to page 1 when component mounts or when pathname changes
    useEffect(() => {
        setPage(1);
        // Reset background data when coming back to home
        if (allParks.length > 0) {
            setBackgroundDataLoaded(false);
            setAllParks([]);
        }
    }, [pathname]); // Only depend on pathname, not allParks.length

    // Handle URL changes (e.g., when logo is clicked)
    useEffect(() => {
        const handleRouteChange = () => {
            setPage(1);
            if (allParks.length > 0) {
                setBackgroundDataLoaded(false);
                setAllParks([]);
            }
        };

        // Listen for route changes
        window.addEventListener('popstate', handleRouteChange);
        
        return () => {
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, []); // Remove allParks.length dependency

    // Listen for navbar logo click when on home page
    useEffect(() => {
        const handleLogoClick = () => {
            setPage(1);
            // Reset background data when logo is clicked
            if (allParks.length > 0) {
                setBackgroundDataLoaded(false);
                setAllParks([]);
            }
        };

        // Listen for custom event from navbar
        window.addEventListener('resetToPageOne', handleLogoClick);
        
        return () => {
            window.removeEventListener('resetToPageOne', handleLogoClick);
        };
    }, [allParks.length]);

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

    // Memoize parks with distance calculation to prevent unnecessary re-renders
    const parksWithDistance = useMemo(() => {
        if (!userCoords) return [];
        
        const currentParks = getCurrentPageParks(page);
        if (!Array.isArray(currentParks)) return [];
        
        return currentParks.map((park) => {
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
            };
        });
    }, [getCurrentPageParks, page, userCoords]);

    // Update total pages when background data is loaded
    useEffect(() => {
        if (backgroundDataLoaded && allParks.length > 0) {
            const newTotalPages = Math.ceil(allParks.length / limit);
            setTotalPages(newTotalPages);
        }
    }, [backgroundDataLoaded, allParks.length, limit]);

    return (
        <Container maxWidth="lg" sx={{ mt: 6 }}>
            <Box textAlign="center" mb={6}>
                <Typography variant="h2" fontWeight="bold" color="#2F2F2F" gutterBottom id="home-welcome-heading">
                    Welcome to SkateGuide
                </Typography>
                <Typography variant="h6" sx={{ mb: 4, color: '#6E7763' }} id="home-subtitle">
                    Discover, rate, and share skateparks around the city — from wooden ramps to metallic rails.
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => router.push('/map')}
                    id="home-explore-map-btn"
                    sx={{
                        backgroundColor: '#A7A9AC',
                        color: '#fff',
                        fontWeight: 'bold',
                        '&:hover': { backgroundColor: '#8A8A8A' }
                    }}
                >
                    Explore the Map
                </Button>
            </Box>

            {!userCoords ? (
                <Box display="flex" justifyContent="center" mt={4}>
                    <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress size={40} sx={{ color: '#A7A9AC', mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                            Getting your location...
                        </Typography>
                    </Box>
                </Box>
            ) : isLoading ? (
                <>
                    {/* Loading header with progress info */}
                    <Box sx={{ 
                        textAlign: 'center', 
                        mb: 4,
                        p: 3,
                        backgroundColor: 'rgba(167, 169, 172, 0.1)',
                        borderRadius: 2,
                        border: '1px solid rgba(167, 169, 172, 0.3)'
                    }}>
                        <CircularProgress size={32} sx={{ color: '#A7A9AC', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                            Loading Skateparks
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Finding the best spots near you...
                        </Typography>
                    </Box>
                    
                    <Grid container spacing={4}>
                        {/* Show skeleton cards while loading */}
                        {Array.from({ length: limit }).map((_, index) => (
                            <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`} {...({} as any)}>
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
                        mb: 3,
                        p: 2,
                        backgroundColor: 'rgba(167, 169, 172, 0.1)',
                        borderRadius: 2,
                        border: '1px solid rgba(167, 169, 172, 0.3)'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Page {page} of {totalPages} • {parksWithDistance.length} spots
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
                                        borderColor: '#A7A9AC',
                                        color: '#A7A9AC',
                                        '&:hover': {
                                            borderColor: '#8A8A8A',
                                            backgroundColor: 'rgba(167, 169, 172, 0.1)',
                                            transform: 'translateY(-1px)'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    ← Back to First
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

                    <Grid container spacing={4} id="skatepark-cards-container">
                        {/* Show actual skatepark cards */}
                        {parksWithDistance.map((park) => (
                            <Grid item xs={12} sm={6} md={4} key={park._id} {...({} as any)}>
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
                                />
                            </Grid>
                        ))}
                    </Grid>

                    {/* Bottom: Enhanced pagination controls */}
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        mt: 6, 
                        mb: 4,
                        p: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        border: '1px solid rgba(167, 169, 172, 0.2)'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            {/* Enhanced Pagination */}
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(_, value) => {
                                    if (backgroundDataLoaded) {
                                        // console.log(`⚡ Instant page ${value} from background data`);
                                    } else {
                                        // console.log(`🔄 Loading page ${value} from server`);
                                    }
                                    setPage(value);
                                }}
                                color="primary"
                                size="large"
                                showFirstButton
                                showLastButton
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        minWidth: 44,
                                        height: 44,
                                        borderRadius: 2,
                                        border: '1px solid rgba(167, 169, 172, 0.3)',
                                        color: '#2F2F2F',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            backgroundColor: 'rgba(167, 169, 172, 0.1)',
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                        },
                                        '&.Mui-selected': {
                                            backgroundColor: '#A7A9AC',
                                            color: '#fff',
                                            borderColor: '#A7A9AC',
                                            boxShadow: '0 4px 12px rgba(167, 169, 172, 0.4)',
                                            '&:hover': {
                                                backgroundColor: '#8A8A8A',
                                                transform: 'translateY(-1px)',
                                            }
                                        }
                                    }
                                }}
                            />
                            
                            {/* Background loading indicator with enhanced styling */}
                            {isBackgroundLoading && (
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1.5,
                                    p: 1.5,
                                    backgroundColor: 'rgba(167, 169, 172, 0.1)',
                                    borderRadius: 2,
                                    border: '1px solid rgba(167, 169, 172, 0.2)'
                                }}>
                                    <CircularProgress size={20} sx={{ color: '#A7A9AC' }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        Preloading pages...
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </>
            )}
        </Container>
    );
}
