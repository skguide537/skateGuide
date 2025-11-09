'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Pagination,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useAdminMonitoringLogs } from '@/hooks/admin';
import { AdminMonitoringCategory } from '@/types/admin';
import { formatRelativeTime } from '@/utils/timeUtils';
import { userClient } from '@/services/userClient';
import Link from 'next/link';
import Avatar from '@mui/material/Avatar';

const CATEGORIES: { value: AdminMonitoringCategory; label: string }[] = [
  { value: 'auth_failure', label: 'Auth Failures' },
  { value: 'api_error', label: 'API Errors' },
  { value: 'rate_limit', label: 'Rate Limit' },
];

export function MonitoringSection() {
  const [activeCategory, setActiveCategory] = useState<AdminMonitoringCategory>('auth_failure');
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { logs, pagination, isLoading, error, setOptions, refetch } = useAdminMonitoringLogs({
    category: 'auth_failure',
    page: 1,
    limit: 20,
  });
  const [userDetails, setUserDetails] = useState<Map<string, { name: string; photoUrl?: string }>>(new Map());

  useEffect(() => {
    setOptions(current => ({
      ...current,
      category: activeCategory,
      page,
      from: from || undefined,
      to: to || undefined,
    }));
  }, [activeCategory, page, from, to, setOptions]);

  const totalPages = useMemo(() => {
    if (!pagination) return 1;
    return Math.max(1, Math.ceil(pagination.total / pagination.limit));
  }, [pagination]);

  useEffect(() => {
    const ids = new Set<string>();
    logs.forEach(log => {
      const details = log.details as Record<string, unknown> | undefined;
      if (details && typeof details === 'object') {
        ['userId', 'actorUserId'].forEach(key => {
          const value = details[key];
          if (typeof value === 'string') ids.add(value);
        });
      }
    });

    if (ids.size === 0) {
      setUserDetails(new Map());
      return;
    }

    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        Array.from(ids).map(async id => {
          try {
            const profile = await userClient.getProfile(id);
            return { id, name: profile.name, photoUrl: profile.photoUrl };
          } catch {
            return null;
          }
        })
      );
      if (!cancelled) {
        setUserDetails(new Map(entries.filter(Boolean).map(profile => [profile!.id, { name: profile!.name, photoUrl: profile!.photoUrl }])));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [logs]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} alignItems="center">
        <WarningAmberIcon color="warning" />
        <Typography variant="h5" fontWeight={600}>
          Monitoring & Alerts
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Review blocked or failing admin API calls. Use this log to spot misuse, unexpected client errors, or rate-limit spikes.
      </Typography>

      <Tabs
        value={activeCategory}
        onChange={(_event, value) => {
          setActiveCategory(value);
          setPage(1);
        }}
        variant="scrollable"
        allowScrollButtonsMobile
      >
        {CATEGORIES.map(category => (
          <Tab key={category.value} value={category.value} label={category.label} />
        ))}
      </Tabs>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <TextField
            label="From"
            type="date"
            size="small"
            value={from}
            onChange={event => {
              setFrom(event.target.value);
              setPage(1);
            }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={to}
            onChange={event => {
              setTo(event.target.value);
              setPage(1);
            }}
            InputLabelProps={{ shrink: true }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined" onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </Button>
        </Stack>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ border: theme => `1px dashed ${theme.palette.error.main}`, borderRadius: 2, p: 4, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : logs.length === 0 ? (
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
            No logs found for this range.
          </Typography>
        </Box>
      ) : (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Context</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map(log => (
                <TableRow key={log._id} hover>
                  <TableCell width={180}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2">{formatRelativeTime(log.createdAt)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.createdAt).toLocaleString()}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={1}>
                      <Typography variant="body2" fontWeight={600}>
                        {formatLogMessage(log.message).summary}
                      </Typography>
                      {formatLogMessage(log.message).detail && (
                        <Typography variant="body2" color="text.secondary">
                          {formatLogMessage(log.message).detail}
                        </Typography>
                      )}
                      <Chip
                        label={log.category.replace('_', ' ')}
                        size="small"
                        color={
                          log.category === 'auth_failure'
                            ? 'warning'
                            : log.category === 'api_error'
                            ? 'error'
                            : 'info'
                        }
                      />
                    </Stack>
                  </TableCell>
                  <TableCell width={220}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        {log.context || '—'}
                      </Typography>
                      {log.context && typeof navigator !== 'undefined' && 'clipboard' in navigator && (
                        <IconButton
                          size="small"
                          onClick={() => (navigator as Navigator & { clipboard: Clipboard }).clipboard.writeText(log.context!)}
                          aria-label="Copy context"
                        >
                          <ContentCopyIcon fontSize="inherit" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {renderDetails(log.details, userDetails)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
          <Pagination count={totalPages} page={page} onChange={(_e, value) => setPage(value)} color="primary" />
        </Box>
      )}
    </Stack>
  );
}

function formatLogMessage(message: string): { summary: string; detail?: string } {
  if (!message) {
    return { summary: 'Unknown event' };
  }
  const [summary, ...rest] = message.split(':');
  if (rest.length === 0) {
    return { summary: message };
  }
  const detail = rest.join(':').trim();
  return {
    summary: detail || summary.trim(),
    detail: detail ? summary.trim() : undefined,
  };
}

function renderDetails(details: Record<string, unknown> | undefined, userDetails: Map<string, { name: string; photoUrl?: string }>) {
  if (!details || typeof details !== 'object' || Object.keys(details).length === 0) {
    return <Typography variant="body2" color="text.secondary">—</Typography>;
  }

  return (
    <Stack spacing={1}>
      {Object.entries(details).map(([key, value]) => {
        if (key === 'userId' && typeof value === 'string') {
          const profile = userDetails.get(value);
          if (profile) {
            return (
              <Stack key={key} direction="row" spacing={1} alignItems="center">
                <Avatar src={profile.photoUrl} alt={profile.name} sx={{ width: 24, height: 24 }} />
                <Link href={`/profile/${value}`} style={{ textDecoration: 'none' }}>
                  {profile.name}
                </Link>
              </Stack>
            );
          }
        }

        return (
          <Chip
            key={key}
            label={`${key}: ${String(value)}`}
            size="small"
            sx={{ alignSelf: 'flex-start' }}
          />
        );
      })}
    </Stack>
  );
}



