'use client';

import React from 'react';
import { IconButton, Tooltip, Box, Typography } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useFavorites } from '@/hooks/useFavorites';

interface FavoriteButtonProps {
    spotId: string;
    favoritesCount?: number;
    size?: 'small' | 'medium' | 'large';
    showCount?: boolean;
    variant?: 'icon' | 'button';
    sx?: any;
}

export default function FavoriteButton({ 
    spotId, 
    favoritesCount = 0, 
    size = 'medium',
    showCount = true,
    variant = 'icon',
    sx = {}
}: FavoriteButtonProps) {
    const { isFavorited, toggleFavorite, getFavoritesCount, ensureCounts } = useFavorites();
    const isFavoritedByUser = isFavorited(spotId);
    const computedCount = showCount ? getFavoritesCount(spotId) : undefined;

    React.useEffect(() => {
        if (showCount && spotId) {
            const timer = setTimeout(() => {
                ensureCounts([spotId]);
            }, 100); // Small delay to prevent rapid successive calls
            
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spotId]); // Remove ensureCounts from dependencies to prevent infinite loops

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await toggleFavorite(spotId);
    };

    const iconSize = size === 'small' ? 20 : size === 'large' ? 28 : 24;

    if (variant === 'button') {
        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    cursor: 'pointer',
                    ...sx
                }}
                onClick={handleClick}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {isFavoritedByUser ? (
                        <Favorite color="error" sx={{ fontSize: iconSize }} />
                    ) : (
                        <FavoriteBorder sx={{ fontSize: iconSize, color: '#A7A9AC' }} />
                    )}
                </Box>
                {showCount && (
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: isFavoritedByUser ? '#d32f2f' : '#A7A9AC',
                            fontWeight: isFavoritedByUser ? 600 : 400
                        }}
                    >
                        {typeof computedCount === 'number' ? computedCount : favoritesCount}
                    </Typography>
                )}
            </Box>
        );
    }

    return (
        <Tooltip title={isFavoritedByUser ? 'Remove from favorites' : 'Add to favorites'}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                    onClick={handleClick}
                    size={size}
                    sx={{
                        color: isFavoritedByUser ? '#d32f2f' : '#A7A9AC',
                        '&:hover': {
                            backgroundColor: isFavoritedByUser 
                                ? 'rgba(211, 47, 47, 0.1)' 
                                : 'rgba(167, 169, 172, 0.1)',
                            transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease',
                        ...sx
                    }}
                >
                    {isFavoritedByUser ? (
                        <Favorite sx={{ fontSize: iconSize }} />
                    ) : (
                        <FavoriteBorder sx={{ fontSize: iconSize }} />
                    )}
                </IconButton>
                {showCount && (
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            color: isFavoritedByUser ? '#d32f2f' : '#A7A9AC',
                            fontWeight: isFavoritedByUser ? 600 : 400,
                            fontSize: '0.75rem',
                            minWidth: '16px',
                            textAlign: 'center'
                        }}
                    >
                        {typeof computedCount === 'number' ? computedCount : favoritesCount}
                    </Typography>
                )}
            </Box>
        </Tooltip>
    );
}
