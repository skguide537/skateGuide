import { Card, CardContent, Box, Skeleton } from '@mui/material';
import { memo } from 'react';

const SkeletonCard = memo(function SkeletonCard() {
    return (
        <Card
            sx={{
                width: 345,
                height: 420,
                boxShadow: 5,
                borderRadius: 2,
                backgroundColor: '#A7A9AC',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Image skeleton */}
            <Skeleton 
                variant="rectangular" 
                width="100%" 
                height={200} 
                sx={{ borderRadius: '8px 8px 0 0' }}
            />
            
            <CardContent sx={{ flexGrow: 1, p: 2 }}>
                {/* Title skeleton */}
                <Skeleton variant="text" width="80%" height={28} sx={{ mb: 1 }} />
                
                {/* Rating skeleton */}
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Skeleton variant="rectangular" width={100} height={20} />
                    <Skeleton variant="text" width={40} height={20} />
                </Box>
                
                {/* Tags skeleton */}
                <Box display="flex" gap={1} mb={1}>
                    <Skeleton variant="rounded" width={60} height={24} />
                    <Skeleton variant="rounded" width={50} height={24} />
                    <Skeleton variant="rounded" width={70} height={24} />
                </Box>
                
                {/* Distance skeleton */}
                <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
                
                {/* Buttons skeleton */}
                <Box display="flex" gap={1}>
                    <Skeleton variant="rounded" width={120} height={32} />
                    <Skeleton variant="rounded" width={80} height={32} />
                </Box>
            </CardContent>
        </Card>
    );
});

export default SkeletonCard;
