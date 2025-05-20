'use client';

import SkateparkCard from '@/components/skateparkCard/SkateparkCard';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';


interface Skatepark {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  photoNames: string[];
  location: {
    coordinates: [number, number];
  };
  isPark: boolean;
  size: string;
  level: string;
}

function getDistanceKm(userLat: number, userLng: number, parkLat: number, parkLng: number): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(parkLat - userLat);
  const dLng = toRad(parkLng - userLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(userLat)) * Math.cos(toRad(parkLat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function HomePage() {
  const router = useRouter();
  const [parks, setParks] = useState<Skatepark[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 4; // Adjust as needed
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchParks = async (pageNumber: number = 1) => {
    setIsLoading(true);
    const res = await fetch(`/api/skateparks?page=${pageNumber}&limit=${limit}`);
    const data = await res.json();
    setParks(data);
    setPage(pageNumber);
    setIsLoading(false);

    // Temporary static total until you support total count in API
    setTotalPages(3);
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => console.error(err),
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    fetchParks(page);
  }, [page]);

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" fontWeight="bold" color="#2F2F2F" gutterBottom>
          Welcome to SkateGuide
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, color: '#6E7763' }}>
          Discover, rate, and share skateparks around the city — from wooden ramps to metallic rails.
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push('/map')}
          sx={{
            backgroundColor: '#A7A9AC',
            color: '#fff',
            fontWeight: 'bold',
            '&:hover': { backgroundColor: '#8A8A8A' }
          }}
        >
          Explore the Map
        </Button>
      </Box>

      {!userCoords || isLoading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={4}>
            {parks.map((park) => {
              const parkCoords = {
                lat: park.location.coordinates[1],
                lng: park.location.coordinates[0],
              };
              const distanceKm = getDistanceKm(
                userCoords.lat,
                userCoords.lng,
                parkCoords.lat,
                parkCoords.lng
              );

              return (
                <Grid item xs={12} sm={6} md={4} key={park._id} {...({} as any)}>
                  <SkateparkCard
                    title={park.title}
                    description={park.description}
                    tags={park.tags}
                    photoNames={park.photoNames}
                    distanceKm={distanceKm}
                    coordinates={parkCoords}
                    isPark={park.isPark}
                    size={park.size}
                    level={park.level}
                  />
                </Grid>
              );
            })}
          </Grid>

          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </>
      )}
    </Container>
  );
}
