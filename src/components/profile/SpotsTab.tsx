'use client';

import { Box, Typography, Grid } from '@mui/material';
import SkateparkCard from '../skateparkCard/SkateparkCard';

interface SpotsTabProps {
  spots: any[];
  isLoading: boolean;
}

export default function SpotsTab({ spots, isLoading }: SpotsTabProps) {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Loading spots...
        </Typography>
      </Box>
    );
  }

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
        Spots Added ({spots.length})
      </Typography>
      
      <Grid container spacing={3}>
        {spots.map((spot) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={spot._id}>
            <SkateparkCard
              _id={spot._id}
              title={spot.title}
              description={spot.description || ''}
              tags={spot.tags || []}
              photoNames={spot.photoNames || []}
              distanceKm={0} // We don't need distance on profile page
              coordinates={{
                lat: spot.location.coordinates[1],
                lng: spot.location.coordinates[0]
              }}
              isPark={spot.isPark}
              size={spot.size}
              levels={spot.levels}
              avgRating={spot.avgRating || 0}
              externalLinks={spot.externalLinks}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}


