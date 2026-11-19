'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { logger } from '@/lib/logger';
import dynamic from 'next/dynamic';

// Loading component for the map
const MapLoading = () => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100dvh',
    gap: 3,
    p: 4,
    backgroundColor: 'var(--color-surface-elevated)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-md)',
    background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)',
    margin: 0,
    overflow: 'hidden'
  }} id="map-loading-container">
    <CircularProgress size={48} sx={{ color: 'var(--color-accent-green)' }} />
    <Typography variant="h6" sx={{ color: 'var(--color-text-primary)', fontWeight: 600 }} id="map-loading-text">
      Loading Interactive Map...
    </Typography>
  </Box>
);

const EnhancedMap = dynamic(() => import('@/components/map/EnhancedMap'), {
  ssr: false,
  loading: MapLoading,
});

const subscribeToGeolocation = () => () => undefined;
const getGeolocationSupport = () => typeof navigator !== 'undefined' && 'geolocation' in navigator;
const getServerGeolocationSupport = () => true;

export default function MapPage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const geolocationSupported = useSyncExternalStore(
    subscribeToGeolocation,
    getGeolocationSupport,
    getServerGeolocationSupport
  );

  useEffect(() => {
    if (geolocationSupported) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          setError('Unable to retrieve your location');
          logger.error('Error getting location', error, 'MapPage');
        }
      );
    }
  }, [geolocationSupported]);

  const visibleError = error ?? (geolocationSupported ? null : 'Geolocation is not supported by your browser');

  if (visibleError) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100dvh',
        p: 4,
        backgroundColor: 'var(--color-surface-elevated)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
        background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)',
        margin: 0,
        overflow: 'hidden'
      }} id="map-error-container">
        <Typography variant="h6" sx={{ color: 'var(--color-error)', fontWeight: 600 }} id="map-error-text">{visibleError}</Typography>
      </Box>
    );
  }

  if (!userLocation) {
    return <MapLoading />;
  }

  return (
    <Box sx={{ 
      height: '100dvh',
      width: '100%',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }} id="map-container" className="map-page">
      <EnhancedMap userLocation={userLocation} />
    </Box>
  );
}
