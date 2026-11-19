'use client';

import { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';

interface ProfileTabsProps {
  isOwner: boolean;
  isAdmin?: boolean;
  isProfileAdmin?: boolean; // Is the profile being viewed an admin?
  activeTab: number;
  onTabChange: (newValue: number) => void;
}

export default function ProfileTabs({ isOwner, isAdmin, isProfileAdmin, activeTab, onTabChange }: ProfileTabsProps) {
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    // Map the visible tab index to the original tab value
    const originalTabs = [
      { label: 'Overview', value: 0, visible: true },
      { label: 'Spots', value: 1, visible: true },
      { label: 'Favorites', value: 2, visible: isOwner },
      { label: 'Comments', value: 3, visible: true },
      { label: 'Settings', value: 4, visible: isOwner || (isAdmin && !isProfileAdmin) },
    ];
    const visibleTabs = originalTabs.filter(tab => tab.visible);
    const selectedTab = visibleTabs[newValue];
    onTabChange(selectedTab ? selectedTab.value : newValue);
  };

  // Tab definitions - Settings hidden when admin views another admin
  const tabs = [
    { label: 'Overview', value: 0, visible: true },
    { label: 'Spots', value: 1, visible: true },
    { label: 'Favorites', value: 2, visible: isOwner }, // Only show to owner
    { label: 'Comments', value: 3, visible: true },
    { label: 'Settings', value: 4, visible: isOwner || (isAdmin && !isProfileAdmin) }, // Owner or admin viewing non-admin
  ];

  // Filter visible tabs
  const visibleTabs = tabs.filter(tab => tab.visible);

  // Find the index of the activeTab in the visible tabs array
  const activeVisibleIndex = visibleTabs.findIndex(tab => tab.value === activeTab);

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs 
        value={activeVisibleIndex >= 0 ? activeVisibleIndex : 0} 
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTabs-indicator': {
            backgroundColor: 'var(--color-accent-blue)',
          },
          '& .MuiTab-root': {
            color: 'var(--color-text-secondary)',
            textTransform: 'none',
            fontWeight: 500,
            '&.Mui-selected': {
              color: 'var(--color-accent-blue)',
            },
          },
        }}
      >
        {visibleTabs.map((tab) => (
          <Tab key={tab.value} label={tab.label} />
        ))}
      </Tabs>
    </Box>
  );
}

