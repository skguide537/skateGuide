'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminClient } from '@/services/adminClient';
import { userClient } from '@/services/userClient';
import { AdminPendingPark, AdminPendingParksResponse } from '@/types/admin';
import { useToast } from '@/context/ToastContext';

interface UseAdminPendingParksOptions {
  page?: number;
  limit?: number;
}

export function useAdminPendingParks(initialOptions: UseAdminPendingParksOptions = {}) {
  const [data, setData] = useState<AdminPendingPark[]>([]);
  const [pagination, setPagination] = useState<AdminPendingParksResponse['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<UseAdminPendingParksOptions>(initialOptions);
  const { showToast } = useToast();

  const fetchPendingParks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminClient.getPendingParks(options);

      const uniqueCreatorIds = Array.from(new Set(response.data.map(park => park.createdBy).filter(Boolean)));
      const creatorMap = new Map<string, { id: string; name: string; photoUrl?: string }>();

      await Promise.all(
        uniqueCreatorIds.map(async creatorId => {
          try {
            const profile = await userClient.getProfile(creatorId);
            creatorMap.set(creatorId, {
              id: profile._id,
              name: profile.name,
              photoUrl: profile.photoUrl,
            });
          } catch {
            // ignore missing profile
          }
        })
      );

      setData(
        response.data.map(park => ({
          ...park,
          creator: creatorMap.get(park.createdBy),
        }))
      );
      setPagination(response.pagination);
    } catch (err: any) {
      const message = err?.message || 'Failed to load pending parks';
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [options, showToast]);

  useEffect(() => {
    fetchPendingParks();
  }, [fetchPendingParks]);

  const approve = useCallback(
    async (parkId: string) => {
      try {
        const result = await adminClient.approvePark(parkId);
        setData(current => current.filter(park => park._id !== parkId));
        showToast(result.alreadyApproved ? 'Park already approved' : 'Park approved successfully', 'success');
        return result;
      } catch (err: any) {
        const message = err?.message || 'Failed to approve park';
        showToast(message, 'error');
        throw err;
      }
    },
    [showToast]
  );

  const hasMore = useMemo(() => {
    if (!pagination) return false;
    return pagination.page * pagination.limit < pagination.total;
  }, [pagination]);

  return {
    data,
    pagination,
    isLoading,
    error,
    hasMore,
    refetch: fetchPendingParks,
    approve,
    setOptions,
  };
}


