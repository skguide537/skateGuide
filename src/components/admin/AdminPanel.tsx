'use client';

import { useMemo, useState, useEffect, SyntheticEvent } from 'react';
import { Box, Container, Tab, Tabs, Typography, Divider, Stack } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import TimelineIcon from '@mui/icons-material/Timeline';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import GroupIcon from '@mui/icons-material/Group';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';

const TAB_CONFIG = [
  { label: 'Pending Approvals', icon: <PlaylistAddCheckIcon fontSize="small" />, key: 'approvals' },
  { label: 'Activity Feed', icon: <TimelineIcon fontSize="small" />, key: 'activity' },
  { label: 'Statistics', icon: <EqualizerIcon fontSize="small" />, key: 'stats' },
  { label: 'Users', icon: <GroupIcon fontSize="small" />, key: 'users' },
  { label: 'Monitoring', icon: <ReportProblemIcon fontSize="small" />, key: 'monitoring' },
] as const;

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState(0);
  const { user, isLoading } = useUser();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') {
      showToast('Admin access required', 'error');
      router.replace('/');
    }

    if (!isLoading && !user) {
      showToast('Please sign in as an admin to continue', 'info');
      router.replace('/login');
    }
  }, [user, isLoading, router, showToast]);

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const ActiveSection = useMemo(() => {
    const tabKey = TAB_CONFIG[activeTab]?.key;
    switch (tabKey) {
      case 'approvals':
        return <Placeholder message="Pending approvals will appear here." />;
      case 'activity':
        return <Placeholder message="Activity feed coming soon." />;
      case 'stats':
        return <Placeholder message="Statistics dashboard under construction." />;
      case 'users':
        return <Placeholder message="User management panel loading soon." />;
      case 'monitoring':
        return <Placeholder message="Monitoring logs will be displayed here." />;
      default:
        return null;
    }
  }, [activeTab]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Admin Panel
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Moderate content, review activity, and keep SkateGuide healthy.
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{
          mb: 4,
          '& .MuiTab-root': {
            textTransform: 'none',
            alignItems: 'center',
            gap: 1,
            fontWeight: 600,
          },
        }}
      >
        {TAB_CONFIG.map((tab) => (
          <Tab key={tab.key} icon={tab.icon} iconPosition="start" label={tab.label} />
        ))}
      </Tabs>

      <Box>{ActiveSection}</Box>
    </Container>
  );
}

function Placeholder({ message }: { message: string }) {
  return (
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
        {message}
      </Typography>
    </Box>
  );
}


