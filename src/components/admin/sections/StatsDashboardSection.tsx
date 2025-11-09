'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import InsightsIcon from '@mui/icons-material/Insights';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ParkIcon from '@mui/icons-material/Park';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useAdminStatsOverview } from '@/hooks/admin';
import { userClient } from '@/services/userClient';
import { GeoapifyService } from '@/services/geoapify.service';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { ssr: false });

export function StatsDashboardSection() {
  const { stats, isLoading, error } = useAdminStatsOverview();
  const [contributorProfiles, setContributorProfiles] = useState<Map<string, { name: string; photoUrl?: string }>>(new Map());
  const [geoLabels, setGeoLabels] = useState<Map<string, string>>(new Map());
  const [geoMenuAnchorEl, setGeoMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [openGeoMenuKey, setOpenGeoMenuKey] = useState<string | null>(null);

  const topContributors = useMemo(() => stats?.parks.topContributors.slice(0, 8) ?? [], [stats]);
  const geoRows = useMemo(() => stats?.parks.geo ?? [], [stats]);

  const displayGeoRows = useMemo(() => {
    if (geoRows.length === 0) {
      return [];
    }
    const aggregated = new Map<
      string,
      {
        label: string;
        count: number;
        parks: { parkId: string; title?: string }[];
        parkIds: Set<string>;
      }
    >();
    for (const row of geoRows) {
      const key = `${row.latBin},${row.lonBin}`;
      const label = geoLabels.get(key) ?? formatLatLon(row.latBin, row.lonBin);
      const rowParks = row.parks ?? [];
      const existing = aggregated.get(label);
      if (existing) {
        existing.count += row.count;
        for (const park of rowParks) {
          if (!existing.parkIds.has(park.parkId)) {
            existing.parkIds.add(park.parkId);
            existing.parks.push({ parkId: park.parkId, title: park.title });
          }
        }
      } else {
        aggregated.set(label, {
          label,
          count: row.count,
          parks: rowParks.map(park => ({ parkId: park.parkId, title: park.title })),
          parkIds: new Set(rowParks.map(park => park.parkId)),
        });
      }
    }
    return Array.from(aggregated.values())
      .map(({ parkIds, parks, ...rest }) => ({
        ...rest,
        parks: parks.sort((a, b) => (a.title || '').localeCompare(b.title || '')),
      }))
      .sort((a, b) => b.count - a.count);
  }, [geoRows, geoLabels]);

  useEffect(() => {
    if (topContributors.length === 0) {
      setContributorProfiles(new Map());
      return;
    }

    let cancelled = false;
    (async () => {
      const profiles = await Promise.all(
        topContributors.map(async contributor => {
          try {
            const profile = await userClient.getProfile(contributor.userId);
            return { id: contributor.userId, name: profile.name, photoUrl: profile.photoUrl };
          } catch {
            return { id: contributor.userId, name: contributor.name ?? contributor.userId };
          }
        })
      );
      if (!cancelled) {
        setContributorProfiles(new Map(profiles.filter(Boolean).map(profile => [profile.id, { name: profile.name, photoUrl: profile.photoUrl }])));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [topContributors]);

  useEffect(() => {
    if (geoRows.length === 0) {
      setGeoLabels(new Map());
      return;
    }

    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        geoRows.map(async row => {
          const key = `${row.latBin},${row.lonBin}`;
          try {
            const label = await GeoapifyService.reverseGeocode(row.latBin, row.lonBin);
            return { key, label };
          } catch {
            return { key, label: formatLatLon(row.latBin, row.lonBin) };
          }
        })
      );
      if (!cancelled) {
        setGeoLabels(new Map(entries.map(entry => [entry.key, entry.label])));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [geoRows]);

  const handleOpenGeoMenu = (event: React.MouseEvent<HTMLElement>, key: string) => {
    setGeoMenuAnchorEl(event.currentTarget);
    setOpenGeoMenuKey(key);
  };

  const handleCloseGeoMenu = () => {
    setGeoMenuAnchorEl(null);
    setOpenGeoMenuKey(null);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !stats) {
    return (
      <Box sx={{ border: theme => `1px dashed ${theme.palette.error.main}`, borderRadius: 2, p: 4, textAlign: 'center' }}>
        <Typography color="error">{error || 'Failed to load statistics'}</Typography>
      </Box>
    );
  }

  const userLineData = {
    labels: stats.users.newUsersByDay.map(bucket => bucket.date),
    datasets: [
      {
        label: 'New users',
        data: stats.users.newUsersByDay.map(bucket => bucket.count),
        borderColor: '#2ecc71',
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const parkTypeData = {
    labels: stats.parks.byType.map(bucket => bucket.type),
    datasets: [
      {
        label: 'Parks by type',
        data: stats.parks.byType.map(bucket => bucket.count),
        backgroundColor: ['#3498db', '#2ecc71', '#e67e22', '#9b59b6'],
      },
    ],
  };

  const parkSizeData = {
    labels: stats.parks.bySize.map(bucket => bucket.size),
    datasets: [
      {
        data: stats.parks.bySize.map(bucket => bucket.count),
        backgroundColor: ['#1abc9c', '#2ecc71', '#3498db', '#9b59b6'],
        borderWidth: 0,
      },
    ],
  };

  const parkLevelData = {
    labels: stats.parks.byLevel.map(bucket => bucket.level),
    datasets: [
      {
        label: 'Parks by skill level',
        data: stats.parks.byLevel.map(bucket => bucket.count),
        backgroundColor: ['#f1c40f', '#e67e22', '#16a085', '#8e44ad'],
      },
    ],
  };

  return (
    <Stack spacing={4}>
      <Stack direction="row" spacing={2} alignItems="center">
        <InsightsIcon color="primary" />
        <Typography variant="h5" fontWeight={600}>
          Site Insights
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Total users"
            value={stats.users.totals.totalUsers}
            subtitle={`${stats.users.totals.adminCount} admins`}
            icon={<PeopleAltIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Approved parks"
            value={stats.parks.totals.approved}
            icon={<ParkIcon color="success" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Pending submissions"
            value={stats.parks.totals.pending}
            subtitle="Awaiting review"
            icon={<PendingActionsIcon color="warning" />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              New users (last {stats.users.newUsersByDay.length} days)
            </Typography>
            <Box sx={{ height: 260 }}>
              <Line
                data={userLineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: { ticks: { maxRotation: 45, minRotation: 45 } },
                    y: { beginAtZero: true },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Parks by size
            </Typography>
            <Box sx={{ height: 260 }}>
              <Doughnut
                data={parkSizeData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Parks by type
            </Typography>
            <Box sx={{ height: 240 }}>
              <Bar
                data={parkTypeData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Skill level distribution
            </Typography>
            <Box sx={{ height: 240 }}>
              <Bar
                data={parkLevelData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: { legend: { display: false } },
                  scales: { x: { beginAtZero: true } },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Top contributors
            </Typography>
            {topContributors.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No contributor data available yet.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {topContributors.map((contributor, index) => {
                  const profile = contributorProfiles.get(contributor.userId);
                  return (
                    <Stack
                      key={contributor.userId}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: theme => theme.palette.action.hover,
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar src={profile?.photoUrl} alt={profile?.name || contributor.name || contributor.userId} />
                        <Stack spacing={0.2}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            #{index + 1}{' '}
                            <NextLink href={`/profile/${contributor.userId}`} style={{ textDecoration: 'none' }}>
                              {profile?.name || contributor.name || contributor.userId}
                            </NextLink>
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {contributor.count} park{contributor.count === 1 ? '' : 's'}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Geo distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {displayGeoRows.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No geo data available yet.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Approximate location</TableCell>
                    <TableCell align="right">Parks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayGeoRows.map(row => (
                    <TableRow key={row.label}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {row.label}
                        </Typography>
                        {row.parks.length === 1 ? (
                          <NextLink href={`/parks/${row.parks[0].parkId}`} style={{ textDecoration: 'none' }}>
                            <Typography variant="caption" color="primary">
                              View park: {row.parks[0].title || 'Untitled park'}
                            </Typography>
                          </NextLink>
                        ) : (
                          row.parks.length > 1 && (
                            <>
                              <Button
                                size="small"
                                color="primary"
                                endIcon={<ArrowDropDownIcon fontSize="small" />}
                                onClick={event => handleOpenGeoMenu(event, row.label)}
                                sx={{ mt: 0.5, textTransform: 'none' }}
                              >
                                View {row.parks.length} parks
                              </Button>
                              <Menu
                                anchorEl={geoMenuAnchorEl}
                                open={openGeoMenuKey === row.label}
                                onClose={handleCloseGeoMenu}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                              >
                                {row.parks.map(park => (
                                  <MenuItem
                                    key={park.parkId}
                                    component={NextLink}
                                    href={`/parks/${park.parkId}`}
                                    onClick={handleCloseGeoMenu}
                                  >
                                    {park.title || 'Untitled park'}
                                  </MenuItem>
                                ))}
                              </Menu>
                            </>
                          )
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {row.count}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}

function SummaryCard({ title, value, subtitle, icon }: { title: string; value: number; subtitle?: string; icon: JSX.Element }) {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2,
        p: 2,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: theme => theme.palette.action.hover,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <CardContent sx={{ p: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" fontWeight={700}>
          {value.toLocaleString()}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function formatLatLon(lat: number, lon: number) {
  const latLabel = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lonLabel = `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
  return `${latLabel}, ${lonLabel}`;
}



