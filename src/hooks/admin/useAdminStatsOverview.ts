'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminClient } from '@/services/adminClient';
import { AdminStatsOverviewResponse } from '@/types/admin';
import { useToast } from '@/hooks/useToast';

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
    setIsLoading(true);
    setError(null);
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

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
    setOptions,
  };
}


