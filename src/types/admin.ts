export interface AdminPendingPark {
  _id: string;
  title: string;
  thumbnail?: string;
  createdBy: string;
  createdAt: string;
  link: string;
  creator?: {
    id: string;
    name: string;
    photoUrl?: string;
  };
}

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
}

export interface AdminPendingParksResponse {
  data: AdminPendingPark[];
  pagination: AdminPagination;
}

export type ActivityType =
  | 'PARK_CREATED'
  | 'PARK_APPROVED'
  | 'COMMENT_ADDED'
  | 'USER_ROLE_CHANGED'
  | 'USER_DELETED';

export interface AdminActivity {
  _id: string;
  type: ActivityType;
  actorUserId?: string;
  targetType: 'park' | 'comment' | 'user';
  targetId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    photoUrl?: string;
  };
  target?: {
    id: string;
    label: string;
    link?: string;
    photoUrl?: string;
  };
  description?: string;
}

export interface AdminActivityResponse {
  data: AdminActivity[];
  nextCursor: string | null;
}

export interface AdminStatsOverviewResponse {
  users: {
    totals: {
      totalUsers: number;
      adminCount: number;
      activeCount: number;
    };
    newUsersByDay: Array<{ date: string; count: number }>;
  };
  parks: {
    totals: {
      approved: number;
      pending: number;
      total: number;
    };
    byType: Array<{ type: string; count: number }>;
    bySize: Array<{ size: string; count: number }>;
    byLevel: Array<{ level: string; count: number }>;
    topContributors: Array<{ userId: string; name: string; count: number }>;
    geo: Array<{
      latBin: number;
      lonBin: number;
      count: number;
      parks: Array<{ parkId: string; title?: string; slug?: string }>;
    }>;
  };
}

export interface AdminUserSummary {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  photoUrl?: string;
}

export interface AdminUsersResponse {
  data: AdminUserSummary[];
  pagination: AdminPagination;
}

export type AdminMonitoringCategory = 'auth_failure' | 'api_error' | 'rate_limit';

export interface AdminLogEntry {
  _id: string;
  category: AdminMonitoringCategory;
  message: string;
  context?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface AdminLogResponse {
  data: AdminLogEntry[];
  pagination: AdminPagination;
}


