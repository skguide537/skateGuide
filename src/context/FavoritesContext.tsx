'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';

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
      const res = await fetch('/api/favorites', { headers: { 'x-user-id': user._id } });
      if (!res.ok) throw new Error('Failed to fetch favorites');
      const data = await res.json();
      setFavorites(Array.isArray(data?.favorites) ? data.favorites : []);
    } catch (err) {
      console.error('Favorites fetch failed:', err);
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
      const params = new URLSearchParams();
      params.set('counts', 'true');
      params.set('spotIds', idsToFetch.join(','));
      const res = await fetch(`/api/favorites?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch favorite counts');
      const data = await res.json(); // { counts: Record<spotId, number> }
      setCounts((prev) => ({ ...prev, ...(data?.counts || {}) }));
    } catch (err) {
      console.error('Favorites counts fetch failed:', err);
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
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user._id },
        body: JSON.stringify({ spotId })
      });
      if (!res.ok) throw new Error('Failed to update favorites');
      const data = await res.json(); // { action, favorites, count }

      setFavorites(Array.isArray(data?.favorites) ? data.favorites : []);
      setCounts((prev) => ({ ...prev, [spotId]: typeof data?.count === 'number' ? data.count : (prev[spotId] ?? 0) }));

      if (data.action === 'added') showToast('Added to favorites!', 'success');
      else showToast('Removed from favorites', 'info');

      return data.action as 'added' | 'removed';
    } catch (err) {
      console.error('Toggle favorite failed:', err);
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
  }), [favorites, counts, isLoading, fetchFavorites, ensureCounts, getFavoritesCount, isFavorited, toggleFavorite]);

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


