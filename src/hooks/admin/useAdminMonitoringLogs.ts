'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminClient } from '@/services/adminClient';
import { AdminLogEntry, AdminLogResponse, AdminMonitoringCategory } from '@/types/admin';
import { useToast } from '@/context/ToastContext';

interface MonitoringOptions {
  category: AdminMonitoringCategory;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export function useAdminMonitoringLogs(initialOptions: MonitoringOptions) {
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [pagination, setPagination] = useState<AdminLogResponse['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState(initialOptions);
  const { showToast } = useToast();

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminClient.getMonitoringLogs(options.category, {
        from: options.from,
        to: options.to,
        page: options.page,
        limit: options.limit,
      });
      setLogs(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      const message = err?.message || 'Failed to load monitoring logs';
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [options, showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const hasMore = useMemo(() => {
    if (!pagination) return false;
    return pagination.page * pagination.limit < pagination.total;
  }, [pagination]);

  return {
    logs,
    pagination,
    isLoading,
    error,
    hasMore,
    refetch: fetchLogs,
    setOptions,
  };
}


