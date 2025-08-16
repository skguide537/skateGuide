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
    gap: 3
  }}>
    <CircularProgress size={48} sx={{ color: '#A7A9AC' }} />
    <Typography variant="h6" color="text.secondary">
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
        color: 'error.main'
      }}>
        <Typography variant="h6">{error}</Typography>
      </Box>
    );
  }

  if (!userLocation) {
    return <MapLoading />;
  }

  return (
    <Box sx={{ height: '100vh', width: '100%' }}>
      <Suspense fallback={<MapLoading />}>
        <EnhancedMap userLocation={userLocation} />
      </Suspense>
    </Box>
  );
}
