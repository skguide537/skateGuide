'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import SkeletonCard from '@/components/loading/SkeletonCard';

interface LoadingSectionProps {
    userCoords: { lat: number; lng: number } | null;
}

export default function LoadingSection({ userCoords }: LoadingSectionProps) {
    if (!userCoords) {
        return (
            <Box display="flex" justifyContent="center" mt={4}>
                <Box sx={{ 
                    textAlign: 'center',
                    p: 4,
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <CircularProgress size={40} sx={{ color: 'var(--color-accent-blue)', mb: 2 }} />
                    <Typography variant="body1" color="var(--color-text-secondary)" fontWeight={500}>
                        Getting your location...
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <>
            {/* Loading header with progress info */}
            <Box sx={{ 
                textAlign: 'center', 
                mb: 6,
                p: 4,
                backgroundColor: 'var(--color-surface-elevated)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-lg)',
                background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)'
            }}>
                <CircularProgress size={40} sx={{ color: 'var(--color-accent-green)', mb: 3 }} />
                <Typography variant="h5" color="var(--color-text-primary)" sx={{ mb: 2, fontWeight: 600 }}>
                    Loading Skateparks
                </Typography>
                <Typography variant="body1" color="var(--color-text-secondary)" fontWeight={500}>
                    Finding the best spots near you...
                </Typography>
            </Box>
            
            <Grid container spacing={4}>
                {/* Show skeleton cards while loading */}
                {Array.from({ length: 6 }).map((_, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`skeleton-${index}`}>
                        <SkeletonCard />
                    </Grid>
                ))}
            </Grid>
        </>
    );
}
