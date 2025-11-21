'use client';

import { useState, useMemo } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  CircularProgress,
  Pagination,
  Stack,
  Typography,
  Chip,
  Grid,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import RefreshIcon from '@mui/icons-material/Refresh';
import PendingIcon from '@mui/icons-material/Pending';
import { useAdminPendingParks } from '@/hooks/admin';
import { formatJoinedDate } from '@/utils/timeUtils';
import Link from 'next/link';

export function PendingApprovalsSection() {
  const [page, setPage] = useState(1);
  const { data, pagination, isLoading, error, approve, refetch, setOptions } = useAdminPendingParks({
    page: 1,
    limit: 6,
  });

  const totalPages = useMemo(() => {
    if (!pagination) return 1;
    return Math.max(1, Math.ceil(pagination.total / pagination.limit));
  }, [pagination]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    setOptions(opts => ({ ...opts, page: value }));
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={1} alignItems="center">
          <PendingIcon color="primary" />
          <Typography variant="h5" fontWeight={600}>
            Pending Approvals
          </Typography>
          {pagination && (
            <Chip
              label={`${pagination.total} pending`}
              color="warning"
              size="small"
              sx={{ fontWeight: 600, textTransform: 'capitalize' }}
            />
          )}
        </Stack>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          variant="outlined"
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Stack>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && error && (
        <Box sx={{ border: (theme: Theme) => `1px dashed ${theme.palette.error.main}`, borderRadius: 2, p: 4, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {!isLoading && !error && data.length === 0 && (
        <Box
          sx={{
            borderRadius: 2,
            border: (theme: Theme) => `1px dashed ${theme.palette.divider}`,
            p: 4,
            textAlign: 'center',
            backgroundColor: (theme: Theme) => theme.palette.background.paper,
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No pending parks. Everything is up to date! 🎉
          </Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {data.map(park => (
          <Grid key={park._id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
            <Card
              elevation={3}
              sx={{
                maxWidth: 300,
                mx: 'auto',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: (theme: Theme) => theme.shadows[6],
                },
              }}
            >
              {park.thumbnail ? (
                <CardMedia component="img" height="160" image={park.thumbnail} alt={park.title} />
              ) : (
                <Box
                  sx={{
                    height: 160,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: (theme: Theme) => theme.palette.background.default,
                    color: (theme: Theme) => theme.palette.text.secondary,
                    typography: 'subtitle2',
                    fontWeight: 600,
                  }}
                >
                  No thumbnail
                </Box>
              )}

              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {park.title}
                </Typography>
                <Stack spacing={1.5} sx={{ color: 'text.secondary', fontSize: 14 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
                      Created by
                    </Typography>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Avatar src={park.creator?.photoUrl} alt={park.creator?.name || 'Unknown user'} sx={{ width: 32, height: 32 }} />
                      <Typography variant="subtitle2" color="text.primary">
                        {park.creator ? (
                          <Link href={`/profile/${park.creator.id}`} style={{ textDecoration: 'none' }}>
                            {park.creator.name}
                          </Link>
                        ) : (
                          'Unknown contributor'
                        )}
                      </Typography>
                    </Stack>
                  </Stack>
                  <span>Submitted: {formatJoinedDate(park.createdAt)}</span>
                  <span>
                    Link:{' '}
                    <Link
                      href={park.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-accent-blue)', fontWeight: 600 }}
                    >
                      View park
                    </Link>
                  </span>
                </Stack>
              </CardContent>

              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={() => approve(park._id)}
                >
                  Approve
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
          <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
        </Box>
      )}
    </Stack>
  );
}


