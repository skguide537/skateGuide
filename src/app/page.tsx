'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SkateparkCard from '@/components/skateparkCard/SkateparkCard';
import SkeletonCard from '@/components/loading/SkeletonCard';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';


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
    const [parks, setParks] = useState<Skatepark[]>([]);
    const [allParks, setAllParks] = useState<Skatepark[]>([]); // Store all parks for background loading
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
                console.log(`✅ Prefetched page ${pageNumber} (${data.length} parks)`);
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
        if (backgroundDataLoaded) return;
        
        setIsBackgroundLoading(true);
        console.log(`🔄 Loading all parks in background for instant pagination...`);
        
        try {
            // Fetch all parks without pagination
            const res = await fetch('/api/skateparks');
            const allParksData = await res.json();
            
            if (Array.isArray(allParksData)) {
                setAllParks(allParksData);
                setBackgroundDataLoaded(true);
                console.log(`✅ Background loaded ${allParksData.length} parks for instant pagination!`);
            }
        } catch (error) {
            console.warn('Failed to load all parks in background:', error);
        } finally {
            setIsBackgroundLoading(false);
        }
    }, [backgroundDataLoaded]);

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
                <Typography variant="h2" fontWeight="bold" color="#2F2F2F" gutterBottom>
                    Welcome to SkateGuide
                </Typography>
                <Typography variant="h6" sx={{ mb: 4, color: '#6E7763' }}>
                    Discover, rate, and share skateparks around the city — from wooden ramps to metallic rails.
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => router.push('/map')}
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
                    <CircularProgress />
                </Box>
            ) : isLoading ? (
                <Grid container spacing={4}>
                    {/* Show skeleton cards while loading */}
                    {Array.from({ length: limit }).map((_, index) => (
                        <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
                            <SkeletonCard />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <>
                    <Grid container spacing={4}>
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
                                    externalLinks={park.externalLinks}
                                />
                            </Grid>
                        ))}
                    </Grid>


                    <Box display="flex" justifyContent="center" alignItems="center" mt={4} gap={2}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, value) => {
                                if (backgroundDataLoaded) {
                                    console.log(`⚡ Instant page ${value} from background data`);
                                } else {
                                    console.log(`🔄 Loading page ${value} from server`);
                                }
                                setPage(value);
                            }}
                            color="primary"
                        />
                        
                        {/* Background loading indicator */}
                        {isBackgroundLoading && (
                            <Box display="flex" alignItems="center" gap={1}>
                                <CircularProgress size={16} />
                                <Typography variant="caption" color="text.secondary">
                                    Preloading pages...
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </>
            )}
        </Container>
    );
}
