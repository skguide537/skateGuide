'use client';

import { Suspense, lazy, useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

// Lazy load the heavy map component
const EnhancedMap = lazy(() => import('@/components/map/EnhancedMap'));

// Loading component for the map
const MapLoading = () => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '60vh',
    gap: 3,
    p: 4,
    backgroundColor: 'var(--color-surface-elevated)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-md)',
    background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)',
    mx: 2,
    my: 2
  }} id="map-loading-container">
    <CircularProgress size={48} sx={{ color: 'var(--color-accent-green)' }} />
    <Typography variant="h6" sx={{ color: 'var(--color-text-primary)', fontWeight: 600 }} id="map-loading-text">
      Loading Interactive Map...
    </Typography>
  </Box>
);

export default function MapPage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          setError('Unable to retrieve your location');
          console.error('Error getting location:', error);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  }, []);

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        p: 4,
        backgroundColor: 'var(--color-surface-elevated)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
        background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)',
        mx: 2,
        my: 2
      }} id="map-error-container">
        <Typography variant="h6" sx={{ color: 'var(--color-error)', fontWeight: 600 }} id="map-error-text">{error}</Typography>
      </Box>
    );
  }

  if (!userLocation) {
    return <MapLoading />;
  }

  return (
    <Box sx={{ height: '100vh', width: '100%' }} id="map-container">
      <Suspense fallback={<MapLoading />}>
        <EnhancedMap userLocation={userLocation} />
      </Suspense>
    </Box>
  );
}
