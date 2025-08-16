import React from 'react';
import { Card, CardContent, Box, Skeleton } from '@mui/material';

export default function SkeletonCard() {
    return (
        <Card
            sx={{
                width: 345,
                height: 420,
                borderRadius: 2,
                backgroundColor: '#A7A9AC',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'shimmer 2.5s infinite',
                    zIndex: 1
                }
            }}
        >
            {/* Image skeleton with rounded corners */}
            <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={200}
                    sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px 8px 0 0',
                        animation: 'pulse 2s ease-in-out infinite'
                    }}
                />
            </Box>

            <CardContent sx={{ position: 'relative', zIndex: 2, p: 2 }}>
                {/* Title skeleton */}
                <Skeleton
                    variant="text"
                    width="80%"
                    height={28}
                    sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        animation: 'pulse 2s ease-in-out infinite 0.1s'
                    }}
                />

                {/* Rating skeleton */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Skeleton
                        variant="rectangular"
                        width={80}
                        height={20}
                        sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: 1,
                            animation: 'pulse 2s ease-in-out infinite 0.2s'
                        }}
                    />
                    <Skeleton
                        variant="text"
                        width={40}
                        height={16}
                        sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            animation: 'pulse 2s ease-in-out infinite 0.3s'
                        }}
                    />
                </Box>

                {/* Tags skeleton */}
                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton
                            key={i}
                            variant="rectangular"
                            width={60}
                            height={24}
                            sx={{
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: 1,
                                animation: `pulse 2s ease-in-out infinite ${0.4 + i * 0.1}s`
                            }}
                        />
                    ))}
                </Box>

                {/* Distance skeleton */}
                <Skeleton
                    variant="text"
                    width="60%"
                    height={20}
                    sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        animation: 'pulse 2s ease-in-out infinite 0.7s'
                    }}
                />

                {/* Bottom spacing for consistent height */}
                <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Skeleton
                        variant="rectangular"
                        width="100%"
                        height={32}
                        sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: 1,
                            animation: 'pulse 2s ease-in-out infinite 0.8s'
                        }}
                    />
                </Box>
            </CardContent>

            <style jsx>{`
                @keyframes shimmer {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
            `}</style>
        </Card>
    );
}
