'use client';

import { Box, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import SkateparkModal from '../modals/SkateparkModal';

// Dynamically import UserSpotsMap with SSR disabled to avoid Leaflet SSR issues
const UserSpotsMap = dynamic(
  () => import('./UserSpotsMap'),
  { ssr: false }
);

interface OverviewTabProps {
  profile: any;
  spots: any[];
}

export default function OverviewTab({ profile, spots }: OverviewTabProps) {
  const [selectedSpot, setSelectedSpot] = useState<any | null>(null);

  const handleMarkerClick = (spot: any) => {
    setSelectedSpot(spot);
  };

  const handleCloseModal = () => {
    setSelectedSpot(null);
  };

  if (spots.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No spots added yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Spot Locations ({spots.length})
      </Typography>
      
      <UserSpotsMap spots={spots} onMarkerClick={handleMarkerClick} />

      {selectedSpot && (
        <SkateparkModal
          _id={selectedSpot._id}
          open={!!selectedSpot}
          onClose={handleCloseModal}
          title={selectedSpot.title}
          description={selectedSpot.description || ''}
          photoNames={selectedSpot.photoNames || []}
          isPark={selectedSpot.isPark}
          size={selectedSpot.size}
          levels={selectedSpot.levels || []}
          tags={selectedSpot.tags || []}
          coordinates={{
            lat: selectedSpot.location.coordinates[1],
            lng: selectedSpot.location.coordinates[0]
          }}
          externalLinks={selectedSpot.externalLinks}
          distanceKm={selectedSpot.distanceKm || 0}
        />
      )}
    </Box>
  );
}
