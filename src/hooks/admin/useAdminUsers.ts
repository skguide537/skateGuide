'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminClient } from '@/services/adminClient';
import { userClient } from '@/services/userClient';
import { AdminUserSummary, AdminUsersResponse } from '@/types/admin';
import { useToast } from '@/context/ToastContext';

interface UseAdminUsersOptions {
  query?: string;
  role?: 'admin' | 'user' | '';
  page?: number;
  limit?: number;
}

export function useAdminUsers(initialOptions: UseAdminUsersOptions = { page: 1, limit: 20 }) {
  const [data, setData] = useState<AdminUserSummary[]>([]);
  const [pagination, setPagination] = useState<AdminUsersResponse['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState(initialOptions);
  const { showToast } = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminClient.getUsers({
        query: options.query,
        role: options.role || undefined,
        page: options.page,
        limit: options.limit,
      });

      const profiles = await Promise.all(
        response.data.map(async user => {
          try {
            const profile = await userClient.getProfile(user._id);
            return { id: user._id, photoUrl: profile.photoUrl, name: profile.name };
          } catch {
            return null;
          }
        })
      );
      const profileMap = new Map(profiles.filter(Boolean).map(profile => [profile!.id, profile!]));

      setData(
        response.data.map(user => ({
          ...user,
          name: profileMap.get(user._id)?.name || user.name,
          photoUrl: profileMap.get(user._id)?.photoUrl,
        }))
      );
      setPagination(response.pagination);
    } catch (err: any) {
      const message = err?.message || 'Failed to load users';
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [options, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const promote = useCallback(
    async (userId: string) => {
      try {
        await adminClient.updateUserRole(userId, 'admin');
        setData(current =>
          current.map(user => (user._id === userId ? { ...user, role: 'admin' } : user))
        );
        showToast('User promoted to admin', 'success');
      } catch (err: any) {
        const message = err?.message || 'Failed to promote user';
        showToast(message, 'error');
        throw err;
      }
    },
    [showToast]
  );

  const demote = useCallback(
    async (userId: string) => {
      try {
        await adminClient.updateUserRole(userId, 'user');
        setData(current =>
          current.map(user => (user._id === userId ? { ...user, role: 'user' } : user))
        );
        showToast('User demoted to standard user', 'success');
      } catch (err: any) {
        const message = err?.message || 'Failed to change user role';
        showToast(message, 'error');
        throw err;
      }
    },
    [showToast]
  );

  const remove = useCallback(
    async (userId: string) => {
      try {
        await adminClient.deleteUser(userId);
        setData(current => current.filter(user => user._id !== userId));
        showToast('User deleted', 'success');
      } catch (err: any) {
        const message = err?.message || 'Failed to delete user';
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
    users: data,
    pagination,
    isLoading,
    error,
    hasMore,
    refetch: fetchUsers,
    setOptions,
    promote,
    demote,
    remove,
  };
}


