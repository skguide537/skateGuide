'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import SkeletonCard from '@/components/loading/SkeletonCard';

const SKELETON_COUNT = 6;

export default function LoadingSection() {
    return (
        <>
            <Box sx={{ 
                textAlign: 'center', 
                mb: 4,
                p: 3,
                backgroundColor: 'var(--color-surface-elevated)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-lg)',
                background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)'
            }}>
                <Box
                    sx={{
                        width: { xs: '60%', md: '40%' },
                        height: 24,
                        mx: 'auto',
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.05) 100%)',
                    }}
                />
            </Box>
            
            <Grid container spacing={4}>
                {/* Show skeleton cards while loading */}
                {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`skeleton-${index}`}>
                        <SkeletonCard />
                    </Grid>
                ))}
            </Grid>
        </>
    );
}
