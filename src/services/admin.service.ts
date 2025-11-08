import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { ActivityModel, ActivityType } from '@/models/activity.model';
import { AdminLogModel, AdminLogCategory, AdminLogDocument } from '@/models/admin-log.model';
import { SkateparkModel } from '@/models/skatepark.model';
import User from '@/models/User';
import { userService } from './user.service';
import { cache, cacheKeys } from '@/lib/cache';
import { recordActivity } from './activity-log.service';

export interface RecordAdminLogParams {
  category: AdminLogCategory;
  message: string;
  context?: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface CursorPaginationParams {
  limit?: number;
  cursor?: string;
  type?: ActivityType;
}

export interface PendingParkResponse {
  data: Array<{
    _id: string;
    title: string;
    thumbnail?: string;
    createdBy: string | mongoose.Types.ObjectId;
    createdAt: Date;
    link: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApproveParkResult {
  updated: boolean;
  alreadyApproved: boolean;
}

export interface StatsOverviewOptions {
  newUsersDays?: number;
  topContributorsLimit?: number;
}

export type MonitoringCategory = AdminLogCategory;

export interface MonitoringQuery extends PaginationParams {
  from?: Date;
  to?: Date;
}

const BAD_REQUEST_PREFIX = 'BAD_REQUEST:';
const NOT_FOUND_PREFIX = 'NOT_FOUND:';

function createBadRequest(message: string) {
  return new Error(`${BAD_REQUEST_PREFIX}${message}`);
}

function createNotFound(message: string) {
  return new Error(`${NOT_FOUND_PREFIX}${message}`);
}

export async function recordAdminLog(params: RecordAdminLogParams): Promise<AdminLogDocument> {
  await connectToDatabase();
  return AdminLogModel.create(params);
}

export async function getPendingParks({ page = 1, limit = 20 }: PaginationParams = {}): Promise<PendingParkResponse> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  await connectToDatabase();

  type PendingParkLean = {
    _id: mongoose.Types.ObjectId;
    title: string;
    photoNames?: string[];
    createdBy: mongoose.Types.ObjectId | string;
    createdAt: Date;
  };

  const [total, parks] = await Promise.all([
    SkateparkModel.countDocuments({ isApproved: false }),
    SkateparkModel.find({ isApproved: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .select('_id title photoNames createdBy createdAt')
      .lean<PendingParkLean[]>(),
  ]);

  return {
    data: parks.map((park: PendingParkLean) => ({
      _id: park._id.toString(),
      title: park.title,
      thumbnail: park.photoNames?.[0],
      createdBy: park.createdBy,
      createdAt: park.createdAt,
      link: `/parks/${park._id.toString()}`,
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
    },
  };
}

export async function approvePark({
  parkId,
  adminId,
  approve = true,
}: {
  parkId: string;
  adminId: string;
  approve?: boolean;
}): Promise<ApproveParkResult> {
  await connectToDatabase();

  const park = await SkateparkModel.findById(parkId);
  if (!park) {
    throw createNotFound('Skatepark not found');
  }

  const alreadyApproved = !!park.isApproved;

  if (approve && !alreadyApproved) {
    park.isApproved = true;
    await park.save();
    cache.delete(cacheKeys.allSkateparks());
    cache.delete(cacheKeys.totalCount());
    const stats = cache.getStats();
    stats.keys.forEach((key) => {
      if (key.includes('skateparks:paginated') || key.includes('skateparks:recent') || key.includes('skateparks:toprated')) {
        cache.delete(key);
      }
    });
    await recordActivity({
      type: ActivityType.PARK_APPROVED,
      actorUserId: adminId,
      targetType: 'park',
      targetId: parkId,
      metadata: { title: park.title },
    });
    return { updated: true, alreadyApproved: false };
  }

  return { updated: false, alreadyApproved };
}

export async function getActivities({
  cursor,
  limit = 20,
  type,
}: CursorPaginationParams) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  await connectToDatabase();

  const filters: Record<string, unknown> = {};
  if (type) {
    filters.type = type;
  }
  if (cursor) {
    filters._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }

  const activities = await ActivityModel.find(filters)
    .sort({ _id: -1 })
    .limit(safeLimit + 1)
    .lean();

  const hasMore = activities.length > safeLimit;
  const sliced = hasMore ? activities.slice(0, safeLimit) : activities;

  return {
    data: sliced.map((activity) => ({
      ...activity,
      _id: activity._id.toString(),
      actorUserId: activity.actorUserId?.toString(),
      targetId: activity.targetId?.toString(),
    })),
    nextCursor: hasMore ? sliced[sliced.length - 1]._id : null,
  };
}

export async function getStatsOverview({
  newUsersDays = 30,
  topContributorsLimit = 5,
}: StatsOverviewOptions = {}) {
  await connectToDatabase();

  const upperLimit = Math.min(Math.max(topContributorsLimit, 1), 20);
  const days = Math.min(Math.max(newUsersDays, 1), 60);
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  const usersCollection = mongoose.connection.collection('users');
  const parksCollection = mongoose.connection.collection('skateparks');

  const [userTotals, newUsersByDay, parkTotals, parkByType, parkBySize, parkByLevel, topContributors, geoBuckets] =
    await Promise.all([
      usersCollection
        .aggregate([
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 },
              adminCount: {
                $sum: {
                  $cond: [{ $eq: ['$role', 'admin'] }, 1, 0],
                },
              },
            },
          },
        ])
        .toArray(),
      usersCollection
        .aggregate([
          { $match: { createdAt: { $gte: sinceDate } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
      parksCollection
        .aggregate([
          {
            $group: {
              _id: null,
              approved: {
                $sum: {
                  $cond: [{ $eq: ['$isApproved', true] }, 1, 0],
                },
              },
              pending: {
                $sum: {
                  $cond: [{ $eq: ['$isApproved', false] }, 1, 0],
                },
              },
              total: { $sum: 1 },
            },
          },
        ])
        .toArray(),
      parksCollection
        .aggregate([
          {
            $group: {
              _id: {
                $cond: [{ $eq: ['$isPark', true] }, 'park', 'street'],
              },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),
      parksCollection
        .aggregate([
          {
            $group: {
              _id: '$size',
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),
      parksCollection
        .aggregate([
          { $unwind: '$levels' },
          {
            $group: {
              _id: '$levels',
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),
      parksCollection
        .aggregate([
          {
            $group: {
              _id: '$createdBy',
              count: { $sum: 1 },
            },
          },
          { $match: { _id: { $ne: null } } },
          { $sort: { count: -1 } },
          { $limit: upperLimit },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: '$user' },
          {
            $project: {
              userId: { $toString: '$user._id' },
              name: '$user.name',
              count: 1,
            },
          },
        ])
        .toArray(),
      parksCollection
        .aggregate([
          {
            $project: {
              lat: { $arrayElemAt: ['$location.coordinates', 1] },
              lon: { $arrayElemAt: ['$location.coordinates', 0] },
            },
          },
          {
            $project: {
              latIndex: { $floor: { $divide: ['$lat', 0.25] } },
              lonIndex: { $floor: { $divide: ['$lon', 0.25] } },
            },
          },
          {
            $project: {
              latBin: { $multiply: ['$latIndex', 0.25] },
              lonBin: { $multiply: ['$lonIndex', 0.25] },
            },
          },
          {
            $group: {
              _id: { latBin: '$latBin', lonBin: '$lonBin' },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.latBin': 1, '_id.lonBin': 1 } },
        ])
        .toArray(),
    ]);

  const totals = userTotals[0] || { totalUsers: 0, adminCount: 0 };
  const parkSummary = parkTotals[0] || { approved: 0, pending: 0, total: 0 };

  return {
    users: {
      totals: {
        totalUsers: totals.totalUsers,
        adminCount: totals.adminCount,
        activeCount: totals.totalUsers, // Placeholder until isActive tracking is introduced
      },
      newUsersByDay: newUsersByDay.map((bucket) => ({
        date: bucket._id,
        count: bucket.count,
      })),
    },
    parks: {
      totals: parkSummary,
      byType: parkByType.map((bucket) => ({
        type: bucket._id,
        count: bucket.count,
      })),
      bySize: parkBySize.map((bucket) => ({
        size: bucket._id || 'Unknown',
        count: bucket.count,
      })),
      byLevel: parkByLevel.map((bucket) => ({
        level: bucket._id || 'Unknown',
        count: bucket.count,
      })),
      topContributors,
      geo: geoBuckets.map((bucket) => ({
        latBin: bucket._id.latBin,
        lonBin: bucket._id.lonBin,
        count: bucket.count,
      })),
    },
  };
}

export async function searchUsers({
  query,
  role,
  page = 1,
  limit = 20,
}: {
  query?: string;
  role?: string;
  page?: number;
  limit?: number;
}) {
  await connectToDatabase();
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const filters: Record<string, unknown> = {};

  if (query) {
    const regex = new RegExp(query, 'i');
    filters.$or = [{ name: regex }, { email: regex }];
  }

  if (role) {
    filters.role = role;
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filters),
    User.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .select('_id name email role createdAt'),
  ]);

  return {
    data: users.map((user) => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
    },
  };
}

export async function updateUserRole({
  targetUserId,
  newRole,
  actorId,
}: {
  targetUserId: string;
  newRole: 'admin' | 'user';
  actorId: string;
}) {
  await connectToDatabase();

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw createNotFound('User not found');
  }

  if (targetUser._id.toString() === actorId) {
    throw createBadRequest('Admins cannot change their own role');
  }

  if (targetUser.role === 'admin' && newRole !== 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      throw createBadRequest('Cannot demote the last admin');
    }
  }

  targetUser.role = newRole;
  await targetUser.save();

  await recordActivity({
    type: ActivityType.USER_ROLE_CHANGED,
    actorUserId: actorId,
    targetType: 'user',
    targetId: targetUserId,
    metadata: { role: newRole },
  });

  return {
    _id: targetUser._id.toString(),
    name: targetUser.name,
    email: targetUser.email,
    role: targetUser.role,
  };
}

export async function deleteUserAsAdmin({
  targetUserId,
  actorId,
}: {
  targetUserId: string;
  actorId: string;
}) {
  await connectToDatabase();

  if (targetUserId === actorId) {
    throw createBadRequest('Admins cannot delete themselves');
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw createNotFound('User not found');
  }

  if (targetUser.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      throw createBadRequest('Cannot delete the last admin');
    }
  }

  await userService.deleteUserAccount(targetUserId);

  await recordActivity({
    type: ActivityType.USER_DELETED,
    actorUserId: actorId,
    targetType: 'user',
    targetId: targetUserId,
  });

  return { success: true };
}

type DateRangeFilter = {
  $gte?: Date;
  $lte?: Date;
};

export async function getMonitoringLogs(
  category: MonitoringCategory,
  { from, to, page = 1, limit = 20 }: MonitoringQuery = {}
) {
  await connectToDatabase();
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const filters: { category: MonitoringCategory; createdAt?: DateRangeFilter } = { category };
  if (from || to) {
    filters.createdAt = {};
    if (from) {
      filters.createdAt.$gte = from;
    }
    if (to) {
      filters.createdAt.$lte = to;
    }
  }

  const [total, logs] = await Promise.all([
    AdminLogModel.countDocuments(filters),
    AdminLogModel.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
  ]);

  return {
    data: logs.map((log) => ({
      ...log,
      _id: log._id.toString(),
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
    },
  };
}


