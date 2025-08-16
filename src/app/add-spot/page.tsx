'use client';

import { Suspense, lazy, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import Loading from '@/components/loading/Loading';
import dynamic from 'next/dynamic';

// Lazy load heavy components with no SSR to avoid window reference issues
const AddSpotForm = dynamic(() => import('@/components/forms/AddSpotForm'), { ssr: false });
const AddSpotMap = dynamic(() => import('@/components/map/AddSpotMap'), { ssr: false });

// Loading component for the page
const AddSpotLoading = () => (
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
      Loading Add Spot Form...
    </Typography>
  </Box>
);

export default function AddSpotPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleMapClick = (newCoords: { lat: number; lng: number }) => {
    setCoords(newCoords);
  };

  return (
    <Box sx={{ 
      maxWidth: 'lg', 
      mx: 'auto', 
      p: 3,
      mt: 6
    }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ 
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#2F2F2F',
        mb: 4
      }}>
        Add New Spot
      </Typography>
      
      <Suspense fallback={<AddSpotLoading />}>
        <AddSpotForm coords={coords} setCoords={setCoords} />
      </Suspense>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2, color: '#6E7763' }}>
          Select Location
        </Typography>
        <Suspense fallback={<Loading />}>
          <AddSpotMap 
            coords={coords} 
            setCoords={setCoords} 
            onMapClick={handleMapClick}
          />
        </Suspense>
      </Box>
    </Box>
  );
}
