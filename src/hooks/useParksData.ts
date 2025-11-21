import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { lazyLoadParksSlice } from '@/store';
import { useToast } from '@/hooks/useToast';
import { HOME_PAGE_CONSTANTS } from '@/constants/homePage';

// Lazy load parks slice - load immediately when hook is called
let parksSliceLoadPromise: Promise<void> | null = null;
const ensureParksSliceLoaded = () => {
  if (!parksSliceLoadPromise) {
    parksSliceLoadPromise = lazyLoadParksSlice();
  }
  return parksSliceLoadPromise;
};

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

    // Ensure slice is loaded before using selectors
    useEffect(() => {
        ensureParksSliceLoaded();
    }, []);

    // Use selectors with fallback for initial state (before slice loads)
    const parks = useAppSelector((state) => (state as any).parks?.parks ?? EMPTY_ARRAY);
    const isLoading = useAppSelector((state) => (state as any).parks?.isLoading ?? true);
    const deletedSpotIdsArray = useAppSelector((state) => (state as any).parks?.deletedSpotIds ?? EMPTY_ARRAY);
    const deletingSpotIdsArray = useAppSelector((state) => (state as any).parks?.deletingSpotIds ?? EMPTY_ARRAY);
    const lastUpdatedString = useAppSelector((state) => (state as any).parks?.lastUpdated ?? DEFAULT_LAST_UPDATED);

    // Convert arrays to Sets for API compatibility
    const deletedSpotIds = new Set<string>(deletedSpotIdsArray);
    const deletingSpotIds = new Set<string>(deletingSpotIdsArray);
    const lastUpdated = new Date(lastUpdatedString);

    const handleFetchParks = useCallback(async () => {
        await ensureParksSliceLoaded();
        const { fetchParks } = await import('@/store/slices/parksSlice');
        await dispatch(fetchParks());
    }, [dispatch]);

    const handleRefreshParks = useCallback(async () => {
        await ensureParksSliceLoaded();
        const { refreshParks } = await import('@/store/slices/parksSlice');
        const result = await dispatch(refreshParks());
        if (refreshParks.fulfilled.match(result)) {
            showToast('Data refreshed in background', 'info');
        }
    }, [dispatch, showToast]);

    const handleSpotDelete = useCallback(async (spotId: string) => {
        await ensureParksSliceLoaded();
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
    }, [dispatch, showToast]);

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

    // Fetch parks when component mounts
    useEffect(() => {
        handleFetchParks();
    }, [handleFetchParks]);

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
