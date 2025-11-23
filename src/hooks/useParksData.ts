import { useCallback, useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { lazyLoadParksSlice, store } from '@/store';
import { useToast } from '@/hooks/useToast';
import { HOME_PAGE_CONSTANTS } from '@/constants/homePage';

// Stable fallback values to prevent unnecessary re-renders
const EMPTY_ARRAY: string[] = [];
const DEFAULT_LAST_UPDATED = new Date().toISOString();

export function useParksData(): {
    parks: import('@/types/skatepark').BaseSkatepark[];
    isLoading: boolean;
    deletedSpotIds: Set<string>;
    deletingSpotIds: Set<string>;
    lastUpdated: Date;
    fetchParks: () => Promise<void>;
    refreshParks: () => Promise<void>;
    handleSpotDelete: (spotId: string) => Promise<void>;
} {
    const dispatch = useAppDispatch();
    const { showToast } = useToast();

    // Check if slice is already loaded (from store) - use ref to avoid infinite loops
    const sliceExistsRef = useRef(false);
    const [sliceLoaded, setSliceLoaded] = useState(false);

    // Check if slice exists in store and subscribe to changes
    useEffect(() => {
        const checkSlice = () => {
            try {
                const state = store.getState();
                const exists = (state as any).parks !== undefined;
                if (exists && !sliceExistsRef.current) {
                    sliceExistsRef.current = true;
                    setSliceLoaded(true);
                    return true;
                }
            } catch (error) {
                // Store might not be ready yet, ignore
                console.warn('Error checking parks slice:', error);
            }
            return false;
        };

        // Check immediately
        if (checkSlice()) return;

        // Subscribe to store changes to detect when slice is loaded
        let unsubscribe: (() => void) | null = null;
        try {
            unsubscribe = store.subscribe(() => {
                if (checkSlice() && unsubscribe) {
                    unsubscribe();
                    unsubscribe = null;
                }
            });
        } catch (error) {
            console.warn('Error subscribing to store:', error);
        }

        // Also try to load if it doesn't exist (fallback for non-home pages)
        if (!sliceLoaded) {
            lazyLoadParksSlice().catch((error) => {
                console.warn('Error loading parks slice:', error);
            }).then(() => {
                if (checkSlice() && unsubscribe) {
                    unsubscribe();
                    unsubscribe = null;
                }
            });
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [sliceLoaded]);

    // Use selectors with fallback for initial state (before slice loads)
    const parks = useAppSelector((state) => (state as any).parks?.parks ?? EMPTY_ARRAY);
    const parksIsLoading = useAppSelector((state) => (state as any).parks?.isLoading ?? true);
    const deletedSpotIdsArray = useAppSelector((state) => (state as any).parks?.deletedSpotIds ?? EMPTY_ARRAY);
    const deletingSpotIdsArray = useAppSelector((state) => (state as any).parks?.deletingSpotIds ?? EMPTY_ARRAY);
    const lastUpdatedString = useAppSelector((state) => (state as any).parks?.lastUpdated ?? DEFAULT_LAST_UPDATED);

    // Only show loading if slice is loaded AND parks are actually loading
    // If slice isn't loaded yet, we're still in initial state
    const isLoading = sliceLoaded ? parksIsLoading : true;

    // Convert arrays to Sets for API compatibility
    const deletedSpotIds = new Set<string>(deletedSpotIdsArray);
    const deletingSpotIds = new Set<string>(deletingSpotIdsArray);
    const lastUpdated = new Date(lastUpdatedString);

    const handleFetchParks = useCallback(async () => {
        if (!sliceLoaded) {
            await lazyLoadParksSlice();
            setSliceLoaded(true);
        }
        const { fetchParks } = await import('@/store/slices/parksSlice');
        await dispatch(fetchParks());
    }, [dispatch, sliceLoaded]);

    const handleRefreshParks = useCallback(async () => {
        if (!sliceLoaded) {
            await lazyLoadParksSlice();
            setSliceLoaded(true);
        }
        const { refreshParks } = await import('@/store/slices/parksSlice');
        const result = await dispatch(refreshParks());
        if (refreshParks.fulfilled.match(result)) {
            showToast('Data refreshed in background', 'info');
        }
    }, [dispatch, showToast, sliceLoaded]);

    const handleSpotDelete = useCallback(async (spotId: string) => {
        if (!sliceLoaded) {
            await lazyLoadParksSlice();
            setSliceLoaded(true);
        }
        const { deleteSpot } = await import('@/store/slices/parksSlice');
        const result = await dispatch(deleteSpot(spotId));
        if (deleteSpot.fulfilled.match(result)) {
            const spotTitle = result.payload.spotTitle;
            showToast(`"${spotTitle}" deleted successfully!`, 'success');
        } else if (deleteSpot.rejected.match(result)) {
            const payload = result.payload as { error?: string } | undefined;
            const error = payload?.error || 'Unknown error';
            showToast(`Failed to delete spot: ${error}`, 'error');
        }
    }, [dispatch, showToast, sliceLoaded]);

    // Check for newly added spots when component mounts (only once)
    useEffect(() => {
        const checkForNewSpots = () => {
            const spotJustAdded = localStorage.getItem(HOME_PAGE_CONSTANTS.LOCAL_STORAGE_KEYS.SPOT_JUST_ADDED);
            const spotAddedAt = localStorage.getItem(HOME_PAGE_CONSTANTS.LOCAL_STORAGE_KEYS.SPOT_ADDED_AT);
            
            if (spotJustAdded === 'true' && spotAddedAt) {
                const timeSinceAdded = Date.now() - parseInt(spotAddedAt);
                if (timeSinceAdded < HOME_PAGE_CONSTANTS.TIMEOUTS.NEW_SPOT_THRESHOLD) {
                    localStorage.removeItem(HOME_PAGE_CONSTANTS.LOCAL_STORAGE_KEYS.SPOT_JUST_ADDED);
                    localStorage.removeItem(HOME_PAGE_CONSTANTS.LOCAL_STORAGE_KEYS.SPOT_ADDED_AT);
                    setTimeout(() => {
                        handleFetchParks();
                    }, HOME_PAGE_CONSTANTS.TIMEOUTS.NEW_SPOT_REFRESH);
                }
            }
        };
        checkForNewSpots();
        const timer = setTimeout(checkForNewSpots, HOME_PAGE_CONSTANTS.TIMEOUTS.NEW_SPOT_CHECK);
        return () => clearTimeout(timer);
    }, [handleFetchParks]);

    // Background refresh - periodically update data based on user preference
    useEffect(() => {
        const getUserRefreshInterval = () => {
            const saved = localStorage.getItem(HOME_PAGE_CONSTANTS.LOCAL_STORAGE_KEYS.REFRESH_INTERVAL);
            if (saved) {
                const interval = parseInt(saved);
                return interval > 0 ? interval * 60 * 1000 : HOME_PAGE_CONSTANTS.BACKGROUND_REFRESH_INTERVAL;
            }
            return HOME_PAGE_CONSTANTS.BACKGROUND_REFRESH_INTERVAL;
        };

        const refreshInterval = getUserRefreshInterval();
        const interval = setInterval(() => {
            // Only refresh if user is actively viewing the page
            if (document.visibilityState === 'visible') {
                handleRefreshParks();
            }
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [handleRefreshParks]);

    // Fetch parks when component mounts and slice is loaded
    useEffect(() => {
        if (sliceLoaded) {
            handleFetchParks();
        }
    }, [handleFetchParks, sliceLoaded]);

    return {
        parks,
        isLoading,
        deletedSpotIds,
        deletingSpotIds,
        lastUpdated,
        fetchParks: handleFetchParks,
        refreshParks: handleRefreshParks,
        handleSpotDelete,
    };
}
