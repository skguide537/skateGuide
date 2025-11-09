'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminClient } from '@/services/adminClient';
import { userClient } from '@/services/userClient';
import { skateparkClient } from '@/services/skateparkClient';
import { AdminActivity, ActivityType } from '@/types/admin';
import { useToast } from '@/context/ToastContext';

interface UseAdminActivityOptions {
  limit?: number;
  type?: ActivityType | 'all';
}

export function useAdminActivityFeed(initialOptions: UseAdminActivityOptions = { limit: 20, type: 'all' }) {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState(initialOptions);
  const { showToast } = useToast();

  const fetchActivities = useCallback(
    async (cursor?: string, append = false) => {
      setError(null);
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await adminClient.getActivities({
          limit: options.limit,
          cursor,
          type: options.type && options.type !== 'all' ? options.type : undefined,
        });

        const actorIds = new Set<string>();
        const parkIds = new Set<string>();
        const userIds = new Set<string>();

        response.data.forEach(activity => {
          if (activity.actorUserId) actorIds.add(activity.actorUserId);
          if (activity.targetType === 'park') parkIds.add(activity.targetId);
          if (activity.targetType === 'user') userIds.add(activity.targetId);
          if (activity.targetType === 'comment' && activity.metadata && typeof activity.metadata === 'object') {
            const parkId = (activity.metadata as Record<string, unknown>).skateparkId;
            if (typeof parkId === 'string') {
              parkIds.add(parkId);
            }
          }
        });

        const [actorProfiles, parkSummaries, userProfiles] = await Promise.all([
          Promise.all(
            Array.from(actorIds).map(async id => {
              try {
                const profile = await userClient.getProfile(id);
                return { id, name: profile.name, photoUrl: profile.photoUrl };
              } catch {
                return null;
              }
            })
          ),
          parkIds.size ? skateparkClient.getSkateparksByIds(Array.from(parkIds)) : Promise.resolve([]),
          Promise.all(
            Array.from(userIds).map(async id => {
              try {
                const profile = await userClient.getProfile(id);
                return { id, name: profile.name, photoUrl: profile.photoUrl };
              } catch {
                return null;
              }
            })
          ),
        ]);

        const actorMap = new Map(actorProfiles.filter(Boolean).map(profile => [profile!.id, profile!]));
        const parkMap = new Map(parkSummaries.map(park => [park._id, park]));
        const userMap = new Map(userProfiles.filter(Boolean).map(profile => [profile!.id, profile!]));

        const enrichedActivities = response.data.map(activity => {
          const enriched: AdminActivity = { ...activity };
          if (activity.actorUserId && actorMap.has(activity.actorUserId)) {
            enriched.actor = actorMap.get(activity.actorUserId);
          } else if (activity.targetType === 'comment') {
            const metaParkId = typeof activity.metadata?.skateparkId === 'string' ? (activity.metadata!.skateparkId as string) : undefined;
            if (metaParkId && parkMap.has(metaParkId)) {
              const park = parkMap.get(metaParkId)!;
              enriched.target = {
                id: metaParkId,
                label: park.title,
                link: `/parks/${park._id}`,
                photoUrl: park.photoNames?.[0],
              };
            }
          }

          if (activity.targetType === 'park' && parkMap.has(activity.targetId)) {
            const park = parkMap.get(activity.targetId)!;
            enriched.target = {
              id: park._id,
              label: park.title,
              link: `/parks/${park._id}`,
              photoUrl: park.photoNames?.[0],
            };
          }

          if (activity.targetType === 'user' && userMap.has(activity.targetId)) {
            const profile = userMap.get(activity.targetId)!;
            enriched.target = {
              id: profile.id,
              label: profile.name,
              link: `/profile/${profile.id}`,
              photoUrl: profile.photoUrl,
            };
          }

          enriched.description = buildActivityDescription(enriched);
          return enriched;
        });

        setNextCursor(response.nextCursor);
        setActivities(prev => (append ? [...prev, ...enrichedActivities] : enrichedActivities));
      } catch (err: any) {
        const message = err?.message || 'Failed to load activity feed';
        setError(message);
        showToast(message, 'error');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [options, showToast]
  );

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const loadMore = useCallback(() => {
    if (nextCursor) {
      fetchActivities(nextCursor, true);
    }
  }, [fetchActivities, nextCursor]);

  const hasMore = useMemo(() => Boolean(nextCursor), [nextCursor]);

  return {
    activities,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refetch: () => fetchActivities(),
    setOptions,
  };
}

function buildActivityDescription(activity: AdminActivity): string {
  switch (activity.type) {
    case 'PARK_CREATED':
      return `New park submitted${activity.target?.label ? `: ${activity.target.label}` : ''}`;
    case 'PARK_APPROVED':
      return `Park approved${activity.target?.label ? `: ${activity.target.label}` : activity.metadata?.title ? `: ${activity.metadata.title}` : ''}`;
    case 'COMMENT_ADDED':
      {
        const body = typeof activity.metadata?.body === 'string' ? activity.metadata.body : '';
        const snippet = body ? `"${body.slice(0, 80)}${body.length > 80 ? '…' : ''}"` : '';
        return `New comment posted${snippet ? ` ${snippet}` : ''}${activity.target?.label ? ` on ${activity.target.label}` : ''}`;
      }
    case 'USER_ROLE_CHANGED':
      return `Role changed to ${activity.metadata?.role ?? 'new role'}${activity.target?.label ? ` for ${activity.target.label}` : ''}`;
    case 'USER_DELETED':
      return `User account deleted${activity.target?.label ? `: ${activity.target.label}` : ''}`;
    default:
      return '';
  }
}



