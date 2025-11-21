import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { lazyLoadFavoritesSlice } from '@/store';
import { useUser } from './useUser';
import { useToast } from './useToast';
import { useCallback, useEffect } from 'react';

// Lazy load favorites slice - load immediately when hook is called
let favoritesSliceLoadPromise: Promise<void> | null = null;
const ensureFavoritesSliceLoaded = () => {
  if (!favoritesSliceLoadPromise) {
    favoritesSliceLoadPromise = lazyLoadFavoritesSlice();
  }
  return favoritesSliceLoadPromise;
};

// Stable fallback values to prevent unnecessary re-renders
const EMPTY_FAVORITES_ARRAY: string[] = [];
const EMPTY_COUNTS_OBJECT: Record<string, number> = {};

export const useFavorites = () => {
    const dispatch = useAppDispatch();
    const { user } = useUser();
    const { showToast } = useToast();

    // Ensure slice is loaded before using selectors
    useEffect(() => {
        ensureFavoritesSliceLoaded();
    }, []);
    
    // Use selectors with fallback for initial state
    const favorites = useAppSelector((state) => (state as any).favorites?.favorites ?? EMPTY_FAVORITES_ARRAY);
    const counts = useAppSelector((state) => (state as any).favorites?.counts ?? EMPTY_COUNTS_OBJECT);
    const isLoading = useAppSelector((state) => (state as any).favorites?.isLoading ?? false);
    const favoritesLoaded = useAppSelector((state) => (state as any).favorites?.favoritesLoaded ?? false);

    // Fetch favorites when user logs in
    useEffect(() => {
        if (user?._id) {
            ensureFavoritesSliceLoaded().then(() => {
                import('@/store/slices/favoritesSlice').then(({ fetchFavorites }) => {
                    dispatch(fetchFavorites(user._id));
                });
            });
        }
    }, [dispatch, user?._id]);

    const handleFetchFavorites = useCallback(async () => {
        if (user?._id) {
            await ensureFavoritesSliceLoaded();
            const { fetchFavorites } = await import('@/store/slices/favoritesSlice');
            await dispatch(fetchFavorites(user._id));
        }
    }, [dispatch, user?._id]);

    const handleEnsureCounts = useCallback(async (spotIds: string[]) => {
        await ensureFavoritesSliceLoaded();
        const { ensureCounts } = await import('@/store/slices/favoritesSlice');
        await dispatch(ensureCounts(spotIds));
    }, [dispatch]);

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

        await ensureFavoritesSliceLoaded();
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
    }, [user?._id, showToast, dispatch, handleFetchFavorites]);

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
