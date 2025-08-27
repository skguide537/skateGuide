import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/context/ToastContext';
import { HOME_PAGE_CONSTANTS } from '@/constants/homePage';
import { skateparkClient, authClient } from '@/services/skateparkClient';

export interface Skatepark {
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

export function useParksData() {
    const [parks, setParks] = useState<Skatepark[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletedSpotIds, setDeletedSpotIds] = useState<Set<string>>(new Set());
    const [deletingSpotIds, setDeletingSpotIds] = useState<Set<string>>(new Set());
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    
    const { showToast, invalidateCache } = useToast();
    
    // Refs to avoid stale closures
    const parksRef = useRef(parks);
    const showToastRef = useRef(showToast);
    const invalidateCacheRef = useRef(invalidateCache);
    
    // Update refs when values change
    useEffect(() => {
        parksRef.current = parks;
    }, [parks]);
    
    useEffect(() => {
        showToastRef.current = showToast;
    }, [showToast]);
    
    useEffect(() => {
        invalidateCacheRef.current = invalidateCache;
    }, [invalidateCache]);

    const fetchParks = useCallback(async () => {
        try {
            setIsLoading(true);
            
            const data = await skateparkClient.getWithLimit(1000);

            // Update parks data for virtual scrolling
            setParks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch parks:', err);
            setParks([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshParks = useCallback(async () => {
        try {
            // Refresh all parks data for virtual scrolling
            const data = await skateparkClient.getWithLimit(1000);

            // Add robust null checks to prevent crashes
            const parksData = Array.isArray(data) ? data : [];
            
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

    const handleSpotDelete = useCallback(async (spotId: string) => {
        // Optimistically mark as deleting
        setDeletingSpotIds(prev => new Set([...prev, spotId]));
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Delete operation timed out')), HOME_PAGE_CONSTANTS.TIMEOUTS.DELETE_OPERATION);
        });
        
        try {
            // Get user ID from localStorage or context
            const userData = await authClient.getCurrentUser();
            
            // Delete from backend with timeout
            const deletePromise = skateparkClient.delete(spotId, userData._id || '');
            
            await Promise.race([deletePromise, timeoutPromise]);

            // Success - mark as deleted and remove from state
            setDeletedSpotIds(prev => new Set([...prev, spotId]));
            setDeletingSpotIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(spotId);
                return newSet;
            });
            
            // Get spot title for better toast message
            const deletedSpot = parksRef.current.find(park => park._id === spotId);
            const spotTitle = deletedSpot?.title || 'Spot';
            
            // Show success toast
            showToastRef.current(`"${spotTitle}" deleted successfully!`, 'success');
            
            // Remove from local state FIRST
            setParks(prev => prev.filter(park => park._id !== spotId));
            
            // Invalidate caches AFTER state updates are complete to prevent race conditions
            setTimeout(() => {
                invalidateCacheRef.current('skateparks');
                invalidateCacheRef.current('spots');
                invalidateCacheRef.current('map-markers');
            }, HOME_PAGE_CONSTANTS.TIMEOUTS.CACHE_INVALIDATION);
            
        } catch (error: any) {
            console.error('Delete failed:', error);
            
            // Remove from deleting state
            setDeletingSpotIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(spotId);
                return newSet;
            });
            
            // Show error to user
            showToastRef.current(`Failed to delete spot: ${error.message}`, 'error');
        }
    }, []);

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
                        fetchParks();
                    }, HOME_PAGE_CONSTANTS.TIMEOUTS.NEW_SPOT_REFRESH);
                }
            }
        };
        checkForNewSpots();
        const timer = setTimeout(checkForNewSpots, HOME_PAGE_CONSTANTS.TIMEOUTS.NEW_SPOT_CHECK);
        return () => clearTimeout(timer);
    }, [fetchParks]);

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
                refreshParks();
                // Show a subtle toast to indicate background refresh
                showToast('Data refreshed in background', 'info');
            }
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [refreshParks, showToast]);

    // Fetch parks when component mounts
    useEffect(() => {
        fetchParks();
    }, [fetchParks]);

    return {
        parks,
        isLoading,
        deletedSpotIds,
        deletingSpotIds,
        lastUpdated,
        fetchParks,
        refreshParks,
        handleSpotDelete,
    };
}
