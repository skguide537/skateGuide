'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { logger } from '@/lib/logger';
import { favoritesClient } from '@/services/favoritesClient';

type FavoritesCounts = Record<string, number>;

interface FavoritesContextType {
  favorites: string[];
  counts: FavoritesCounts;
  isLoading: boolean;
  fetchFavorites: () => Promise<void>;
  ensureCounts: (spotIds: string[]) => Promise<void>;
  getFavoritesCount: (spotId: string) => number;
  isFavorited: (spotId: string) => boolean;
  toggleFavorite: (spotId: string) => Promise<'added' | 'removed' | null>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { showToast } = useToast();

  const [favorites, setFavorites] = useState<string[]>([]);
  const [counts, setCounts] = useState<FavoritesCounts>({});
  const [isLoading, setIsLoading] = useState(false);
  const inProgressRef = useRef<Set<string>>(new Set());

  const fetchFavorites = useCallback(async () => {
    if (!user?._id) {
      setFavorites([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await favoritesClient.getFavorites(user._id);
      setFavorites(Array.isArray(data) ? data : []);
    } catch (err) {
      logger.error('Favorites fetch failed', err, 'FavoritesContext');
    } finally {
      setIsLoading(false);
    }
  }, [user?._id]);

  const ensureCounts = useCallback(async (spotIds: string[]) => {
    const idsToFetch = spotIds.filter((id) => counts[id] === undefined);
    if (idsToFetch.length === 0) return;
    
    // Prevent duplicate calls for the same IDs
    const key = idsToFetch.sort().join(',');
    if (inProgressRef.current.has(key)) return;
    
    inProgressRef.current.add(key);
    
    try {
      const data = await favoritesClient.getFavoriteCounts(idsToFetch);
      setCounts((prev) => ({ ...prev, ...data }));
    } catch (err) {
      logger.error('Favorites counts fetch failed', err, 'FavoritesContext');
    } finally {
      inProgressRef.current.delete(key);
    }
  }, [counts]);

  const getFavoritesCount = useCallback((spotId: string) => {
    return counts[spotId] ?? 0;
  }, [counts]);

  const isFavorited = useCallback((spotId: string) => {
    return favorites.includes(spotId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (spotId: string) => {
    if (!user?._id) {
      showToast('Please log in to save favorites', 'warning');
      return null;
    }

    try {
      const action = await favoritesClient.toggleFavorite(spotId, user._id);
      
      // Update local state optimistically
      setFavorites(prev => 
        action === 'added' 
          ? [...prev, spotId]
          : prev.filter(id => id !== spotId)
      );
      setCounts(prev => ({ 
        ...prev, 
        [spotId]: action === 'added' 
          ? (prev[spotId] ?? 0) + 1 
          : Math.max(0, (prev[spotId] ?? 1) - 1)
      }));

      if (action === 'added') showToast('Added to favorites!', 'success');
      else showToast('Removed from favorites', 'info');

      return action;
    } catch (err) {
      logger.error('Toggle favorite failed', err, 'FavoritesContext');
      showToast('Failed to update favorites', 'error');
      // Best-effort refresh
      await fetchFavorites();
      return null;
    }
  }, [user?._id, showToast, fetchFavorites]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]); 

  const value = useMemo(() => ({
    favorites,
    counts,
    isLoading,
    fetchFavorites,
    ensureCounts,
    getFavoritesCount,
    isFavorited,
    toggleFavorite,
  }), [favorites, counts, isLoading, ensureCounts, getFavoritesCount, isFavorited, toggleFavorite]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext(): FavoritesContextType {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavoritesContext must be used within FavoritesProvider');
  return ctx;
}


