import { useState, useEffect, useCallback } from 'react';
import { userClient } from '@/services/userClient';
import { logger } from '@/lib/logger';

export interface ProfileData {
  profile: any | null;
  spots: any[];
  comments: any[];
  stats: any | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for managing user profile data
 * Fetches profile, spots, comments, and stats for a given user
 */
export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<any | null>(null);
  const [spots, setSpots] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch profile first
      const profileData = await userClient.getProfile(userId);
      setProfile(profileData);

      // Fetch other data in parallel, handle missing data gracefully
      const [spotsData, commentsData, statsData] = await Promise.allSettled([
        userClient.getSpots(userId, 1, 20),
        userClient.getComments(userId, 5),
        userClient.getStats(userId),
      ]);

      // Handle spots
      if (spotsData.status === 'fulfilled') {
        setSpots(spotsData.value.data || []);
      } else {
        logger.warn('Failed to fetch spots', spotsData.reason, 'useProfile');
        setSpots([]);
      }

      // Handle comments
      if (commentsData.status === 'fulfilled') {
        setComments(commentsData.value.comments || []);
      } else {
        logger.warn('Failed to fetch comments', commentsData.reason, 'useProfile');
        setComments([]);
      }

      // Handle stats
      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      } else {
        logger.warn('Failed to fetch stats', statsData.reason, 'useProfile');
        setStats(null);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      logger.error('Error loading profile', err, 'useProfile');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    spots,
    comments,
    stats,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}

