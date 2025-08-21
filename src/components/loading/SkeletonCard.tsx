import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

export default function SkeletonCard() {
    return (
        <Card
            sx={{
                width: 345,
                height: 420,
                boxShadow: 'var(--shadow-md)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
            }}
        >
            {/* Image Skeleton */}
            <Box sx={{ 
                position: 'relative', 
                height: 200, 
                backgroundColor: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)'
            }}>
                <Skeleton 
                    variant="rectangular" 
                    width="100%" 
                    height="100%"
                    sx={{ 
                        backgroundColor: 'var(--color-border)',
                        borderRadius: 0
                    }}
                />
                
                {/* Type Badge Skeleton */}
                <Skeleton
                    variant="rectangular"
                    width={60}
                    height={24}
                    sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-border)',
                    }}
                />
                
                {/* Distance Badge Skeleton */}
                <Skeleton
                    variant="rectangular"
                    width={70}
                    height={24}
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-border)',
                    }}
                />
            </Box>

            {/* Content Skeleton */}
            <CardContent sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column',
                p: 3,
                '&:last-child': { pb: 3 }
            }}>
                {/* Title and Rating Row */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    mb: 2
                }}>
                    <Skeleton 
                        variant="text" 
                        width="70%" 
                        height={28}
                        sx={{ 
                            backgroundColor: 'var(--color-border)',
                            borderRadius: 'var(--radius-sm)'
                        }}
                    />
                    
                    {/* Rating Skeleton */}
                    <Skeleton
                        variant="rectangular"
                        width={50}
                        height={24}
                        sx={{
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--color-border)',
                        }}
                    />
                </Box>

                {/* Description Skeleton */}
                <Box sx={{ mb: 3 }}>
                    <Skeleton 
                        variant="text" 
                        width="100%" 
                        height={20}
                        sx={{ 
                            backgroundColor: 'var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            mb: 1
                        }}
                    />
                    <Skeleton 
                        variant="text" 
                        width="80%" 
                        height={20}
                        sx={{ 
                            backgroundColor: 'var(--color-border)',
                            borderRadius: 'var(--radius-sm)'
                        }}
                    />
                </Box>

                {/* Tags Skeleton */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Skeleton
                            variant="rectangular"
                            width={60}
                            height={24}
                            sx={{
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--color-border)',
                            }}
                        />
                        <Skeleton
                            variant="rectangular"
                            width={50}
                            height={24}
                            sx={{
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--color-border)',
                            }}
                        />
                        <Skeleton
                            variant="rectangular"
                            width={70}
                            height={24}
                            sx={{
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--color-border)',
                            }}
                        />
                    </Box>
                </Box>

                {/* Bottom Row Skeleton */}
                <Box sx={{ 
                    mt: 'auto',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                }}>
                    {/* Size and Level Skeleton */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Skeleton
                            variant="rectangular"
                            width={50}
                            height={24}
                            sx={{
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--color-border)',
                            }}
                        />
                        <Skeleton
                            variant="rectangular"
                            width={70}
                            height={24}
                            sx={{
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--color-border)',
                            }}
                        />
                    </Box>

                    {/* Favorite Button Skeleton */}
                    <Skeleton
                        variant="circular"
                        width={32}
                        height={32}
                        sx={{
                            backgroundColor: 'var(--color-border)',
                        }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}
