import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { lazyLoadFavoritesSlice, store } from '@/store';
import { useUser } from './useUser';
import { useToast } from './useToast';
import { useCallback, useEffect, useState, useRef } from 'react';

// No need for separate loading - page.tsx pre-loads this slice

// Stable fallback values to prevent unnecessary re-renders
const EMPTY_FAVORITES_ARRAY: string[] = [];
const EMPTY_COUNTS_OBJECT: Record<string, number> = {};

export const useFavorites = () => {
    const dispatch = useAppDispatch();
    const { user } = useUser();
    const { showToast } = useToast();

    // Check if slice is already loaded (from store) - use ref to avoid infinite loops
    const sliceExistsRef = useRef(false);
    const [sliceLoaded, setSliceLoaded] = useState(false);

    // Check if slice exists in store and subscribe to changes
    useEffect(() => {
        const checkSlice = () => {
            try {
                const state = store.getState();
                const exists = (state as any).favorites !== undefined;
                if (exists && !sliceExistsRef.current) {
                    sliceExistsRef.current = true;
                    setSliceLoaded(true);
                    return true;
                }
            } catch (error) {
                // Store might not be ready yet, ignore
                console.warn('Error checking favorites slice:', error);
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
            lazyLoadFavoritesSlice().catch((error) => {
                console.warn('Error loading favorites slice:', error);
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
    
    // Use selectors with fallback for initial state
    const favorites = useAppSelector((state) => (state as any).favorites?.favorites ?? EMPTY_FAVORITES_ARRAY);
    const counts = useAppSelector((state) => (state as any).favorites?.counts ?? EMPTY_COUNTS_OBJECT);
    const isLoading = useAppSelector((state) => (state as any).favorites?.isLoading ?? false);
    const favoritesLoaded = useAppSelector((state) => (state as any).favorites?.favoritesLoaded ?? false);

    // Fetch favorites when user logs in and slice is loaded
    useEffect(() => {
        if (user?._id && sliceLoaded) {
            import('@/store/slices/favoritesSlice').then(({ fetchFavorites }) => {
                dispatch(fetchFavorites(user._id));
            });
        }
    }, [dispatch, user?._id, sliceLoaded]);

    const handleFetchFavorites = useCallback(async () => {
        if (user?._id) {
            if (!sliceLoaded) {
                await lazyLoadFavoritesSlice();
                setSliceLoaded(true);
            }
            const { fetchFavorites } = await import('@/store/slices/favoritesSlice');
            await dispatch(fetchFavorites(user._id));
        }
    }, [dispatch, user?._id, sliceLoaded]);

    const handleEnsureCounts = useCallback(async (spotIds: string[]) => {
        if (!sliceLoaded) {
            await lazyLoadFavoritesSlice();
            setSliceLoaded(true);
        }
        const { ensureCounts } = await import('@/store/slices/favoritesSlice');
        await dispatch(ensureCounts(spotIds));
    }, [dispatch, sliceLoaded]);

    const getFavoritesCount = useCallback((spotId: string) => {
        return counts[spotId] ?? 0;
    }, [counts]);

    const isFavorited = useCallback((spotId: string) => {
        return favorites.includes(spotId);
    }, [favorites]);

    const handleToggleFavorite = useCallback(async (spotId: string) => {
        if (!user?._id) {
            showToast('Please log in to save favorites', 'warning');
            return null;
        }

        if (!sliceLoaded) {
            await lazyLoadFavoritesSlice();
            setSliceLoaded(true);
        }
        const { toggleFavorite } = await import('@/store/slices/favoritesSlice');
        const result = await dispatch(toggleFavorite({ spotId, userId: user._id }));
        
        if (toggleFavorite.fulfilled.match(result)) {
            const action = result.payload.action;
            if (action === 'added') {
                showToast('Added to favorites!', 'success');
            } else {
                showToast('Removed from favorites', 'info');
            }
            return action;
        } else {
            showToast('Failed to update favorites', 'error');
            // Best-effort refresh
            await handleFetchFavorites();
            return null;
        }
    }, [user?._id, showToast, dispatch, handleFetchFavorites, sliceLoaded]);

    return {
        favorites,
        counts,
        isLoading,
        favoritesLoaded,
        fetchFavorites: handleFetchFavorites,
        ensureCounts: handleEnsureCounts,
        getFavoritesCount,
        isFavorited,
        toggleFavorite: handleToggleFavorite,
    };
};
