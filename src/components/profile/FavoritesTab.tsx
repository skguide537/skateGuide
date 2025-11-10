'use client';

import { Box, Typography, Grid } from '@mui/material';
import SkateparkCard from '../skateparkCard/SkateparkCard';
import { useFavoritesContext } from '@/context/FavoritesContext';
import { useEffect, useState } from 'react';
import { skateparkClient } from '@/services/skateparkClient';

interface FavoritesTabProps {
  userId: string;
  isOwner: boolean;
}

export default function FavoritesTab({ userId, isOwner }: FavoritesTabProps) {
  const { favorites } = useFavoritesContext();
  const [favoriteSpots, setFavoriteSpots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFavoriteSpots = async () => {
      if (!isOwner || favorites.length === 0) {
        setFavoriteSpots([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Fetch only favorite skateparks by their IDs
        const favoriteSpots = await skateparkClient.getSkateparksByIds(favorites);
        setFavoriteSpots(favoriteSpots);
      } catch (error) {
        console.error('Failed to load favorite spots:', error);
        setFavoriteSpots([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavoriteSpots();
  }, [favorites, isOwner]);

  if (!isOwner) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Favorites are private. You can only view your own favorites.
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Loading favorites...
        </Typography>
      </Box>
    );
  }

  if (favoriteSpots.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No favorites yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        My Favorites ({favoriteSpots.length})
      </Typography>
      
      <Grid container spacing={3}>
        {favoriteSpots.map((spot) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={spot._id}>
            <SkateparkCard
              _id={spot._id}
              title={spot.title}
              description={spot.description || ''}
              tags={spot.tags || []}
              photoNames={spot.photoNames || []}
              distanceKm={0}
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


