import { logger } from '@/lib/logger';
import {
  AdminPendingParksResponse,
  AdminActivityResponse,
  AdminStatsOverviewResponse,
  AdminUsersResponse,
  AdminLogResponse,
  ActivityType,
} from '@/types/admin';

class AdminClient {
  private baseUrl = '/api/admin';

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `Failed request: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      logger.error('AdminClient request failed', error, 'AdminClient');
      throw error;
    }
  }

  async getPendingParks(params: { page?: number; limit?: number } = {}): Promise<AdminPendingParksResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));

    return this.request<AdminPendingParksResponse>(`/parks/pending?${searchParams.toString()}`);
  }

  async approvePark(id: string): Promise<{ success: boolean; alreadyApproved: boolean }> {
    return this.request<{ success: boolean; alreadyApproved: boolean }>(`/parks/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ approve: true }),
    });
  }

  async getActivities(params: { limit?: number; cursor?: string; type?: ActivityType } = {}): Promise<AdminActivityResponse> {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.cursor) searchParams.set('cursor', params.cursor);
    if (params.type) searchParams.set('type', params.type);

    return this.request<AdminActivityResponse>(`/activity?${searchParams.toString()}`);
  }

  async getStatsOverview(params: { newUsersDays?: number; topContributorsLimit?: number } = {}): Promise<AdminStatsOverviewResponse> {
    const searchParams = new URLSearchParams();
    if (params.newUsersDays) searchParams.set('newUsersDays', String(params.newUsersDays));
    if (params.topContributorsLimit) searchParams.set('topContributorsLimit', String(params.topContributorsLimit));

    return this.request<AdminStatsOverviewResponse>(`/stats/overview?${searchParams.toString()}`);
  }

  async getUsers(params: { query?: string; role?: string; page?: number; limit?: number } = {}): Promise<AdminUsersResponse> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.set('query', params.query);
    if (params.role) searchParams.set('role', params.role);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));

    return this.request<AdminUsersResponse>(`/users?${searchParams.toString()}`);
  }

  async updateUserRole(id: string, role: 'admin' | 'user'): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getMonitoringLogs(
    category: 'auth_failure' | 'api_error' | 'rate_limit',
    params: { from?: string; to?: string; page?: number; limit?: number } = {}
  ): Promise<AdminLogResponse> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));

    return this.request<AdminLogResponse>(`/monitoring/${category === 'auth_failure' ? 'auth-failures' : category === 'api_error' ? 'api-errors' : 'rate-limit'}?${searchParams.toString()}`);
  }
}

export const adminClient = new AdminClient();


