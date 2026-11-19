'use client';

import { useCallback, useEffect, useState, type SetStateAction } from 'react';
import { adminClient } from '@/services/adminClient';
import { AdminStatsOverviewResponse } from '@/types/admin';
import { useToast } from '@/context/ToastContext';

interface StatsOptions {
  newUsersDays?: number;
  topContributorsLimit?: number;
}

export function useAdminStatsOverview(initialOptions: StatsOptions = { newUsersDays: 30, topContributorsLimit: 5 }) {
  const [stats, setStats] = useState<AdminStatsOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState(initialOptions);
  const { showToast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      const response = await adminClient.getStatsOverview(options);
      setStats(response);
    } catch (err: any) {
      const message = err?.message || 'Failed to load stats overview';
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [options, showToast]);

  const updateOptions = useCallback((update: SetStateAction<StatsOptions>) => {
    setIsLoading(true);
    setError(null);
    setOptions(update);
  }, []);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    return fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    void (async () => {
      await fetchStats();
    })();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch,
    setOptions: updateOptions,
  };
}


