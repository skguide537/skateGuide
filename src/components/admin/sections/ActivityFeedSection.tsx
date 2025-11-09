'use client';

import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import LoopIcon from '@mui/icons-material/Loop';
import TimelineIcon from '@mui/icons-material/Timeline';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CommentIcon from '@mui/icons-material/Comment';
import PeopleIcon from '@mui/icons-material/People';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAdminActivityFeed } from '@/hooks/admin';
import { ActivityType } from '@/types/admin';
import { formatRelativeTime } from '@/utils/timeUtils';
import Link from 'next/link';

const TYPE_LABELS: Record<ActivityType, string> = {
  PARK_CREATED: 'Park created',
  PARK_APPROVED: 'Park approved',
  COMMENT_ADDED: 'Comment added',
  USER_ROLE_CHANGED: 'User role changed',
  USER_DELETED: 'User deleted',
};

const TYPE_COLORS: Record<ActivityType, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  PARK_CREATED: 'info',
  PARK_APPROVED: 'success',
  COMMENT_ADDED: 'secondary',
  USER_ROLE_CHANGED: 'primary',
  USER_DELETED: 'error',
};

const TYPE_ICON: Record<ActivityType, JSX.Element> = {
  PARK_CREATED: <TimelineIcon color="info" />,
  PARK_APPROVED: <DoneAllIcon color="success" />,
  COMMENT_ADDED: <CommentIcon color="secondary" />,
  USER_ROLE_CHANGED: <PeopleIcon color="primary" />,
  USER_DELETED: <DeleteIcon color="error" />,
};

export function ActivityFeedSection() {
  const [activityFilter, setActivityFilter] = useState<ActivityType | 'all'>('all');
  const { activities, isLoading, isLoadingMore, hasMore, loadMore, refetch, setOptions } = useAdminActivityFeed({
    limit: 20,
    type: 'all',
  });

  const handleFilterChange = (value: ActivityType | 'all') => {
    setActivityFilter(value);
    setOptions(opts => ({ ...opts, type: value }));
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={1} alignItems="center">
          <HistoryIcon color="primary" />
          <Typography variant="h5" fontWeight={600}>
            Recent Activity
          </Typography>
          <Chip label={`${activities.length} events`} size="small" color="primary" variant="outlined" />
        </Stack>
        <Stack direction="row" spacing={2}>
          <Select
            size="small"
            value={activityFilter}
            onChange={event => handleFilterChange(event.target.value as ActivityType | 'all')}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All activity</MenuItem>
            {(Object.keys(TYPE_LABELS) as ActivityType[]).map(type => (
              <MenuItem key={type} value={type}>
                {TYPE_LABELS[type]}
              </MenuItem>
            ))}
          </Select>
          <Button variant="outlined" startIcon={<LoopIcon />} onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : activities.length === 0 ? (
        <Box
          sx={{
            borderRadius: 2,
            border: theme => `1px dashed ${theme.palette.divider}`,
            p: 4,
            textAlign: 'center',
            backgroundColor: theme => theme.palette.background.paper,
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No activity yet. Approved parks and moderation actions will appear here.
          </Typography>
        </Box>
      ) : (
        <List
          sx={{
            borderRadius: 2,
            border: theme => `1px solid ${theme.palette.divider}`,
            backgroundColor: theme => theme.palette.background.paper,
          }}
        >
          {activities.map(activity => (
            <Box key={activity._id}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme => theme.palette.action.hover,
                    }}
                  >
                    {TYPE_ICON[activity.type]}
                  </Box>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography component="span" variant="subtitle1" fontWeight={600}>
                        {TYPE_LABELS[activity.type]}
                      </Typography>
                      <Chip
                        size="small"
                        label={activity.targetType}
                        sx={{ textTransform: 'uppercase', fontWeight: 600 }}
                        color={TYPE_COLORS[activity.type]}
                        variant="outlined"
                      />
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={0.5}>
                      {activity.description && (
                        <Typography component="span" variant="body2" color="text.primary">
                          {activity.description}
                        </Typography>
                      )}
                      {activity.target && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          {activity.target.photoUrl && (
                            <Avatar src={activity.target.photoUrl} alt={activity.target.label} sx={{ width: 28, height: 28 }} />
                          )}
                          <Typography component="span" variant="body2" color="text.secondary">
                            {activity.target.link ? (
                              <Link href={activity.target.link} style={{ fontWeight: 600 }}>
                                {activity.target.label}
                              </Link>
                            ) : (
                              activity.target.label
                            )}
                          </Typography>
                        </Stack>
                      )}
                      {activity.actor && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          {activity.actor.photoUrl && (
                            <Avatar src={activity.actor.photoUrl} alt={activity.actor.name} sx={{ width: 24, height: 24 }} />
                          )}
                          <Typography component="span" variant="caption" color="text.secondary">
                            by{' '}
                            <Link href={`/profile/${activity.actor.id}`} style={{ fontWeight: 600 }}>
                              {activity.actor.name}
                            </Link>
                          </Typography>
                        </Stack>
                      )}
                      <Typography component="span" variant="caption" color="text.disabled">
                        {formatRelativeTime(activity.createdAt)}
                      </Typography>
                    </Stack>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </Box>
          ))}
        </List>
      )}

      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button variant="outlined" onClick={loadMore} disabled={isLoadingMore} startIcon={<TimelineIcon />}>
            {isLoadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </Box>
      )}
    </Stack>
  );
}


