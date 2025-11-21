'use client';

import React from 'react';
import { IconButton, Tooltip, Box, Typography } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useFavorites } from '@/hooks/useFavorites';
import { useUser } from '@/hooks/useUser';

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
    const { isFavorited, toggleFavorite, getFavoritesCount, ensureCounts, favoritesLoaded } = useFavorites();
    const { user } = useUser();
    const isFavoritedByUser = isFavorited(spotId);
    const computedCount = showCount ? getFavoritesCount(spotId) : undefined;
    const isLoggedIn = Boolean(user?._id);
    const aria = !isLoggedIn ? 'Log in to add to favorites' : (isFavoritedByUser ? 'Remove from favorites' : 'Add to favorites');
    
    // minimal render

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
        if (!favoritesLoaded) return; // Avoid toggling before favorites are loaded
        await toggleFavorite(spotId);
    };

    const iconSize = size === 'small' ? 20 : size === 'large' ? 28 : 24;

    if (!favoritesLoaded) {
        // Neutral, disabled state while favorites are loading to avoid flicker
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.6, pointerEvents: 'none', ...sx }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FavoriteBorder sx={{ fontSize: iconSize, color: '#A7A9AC' }} />
                </Box>
                {showCount && (
                    <Typography 
                        variant="body2"
                        data-testid="favorite-count"
                        sx={{ color: '#A7A9AC' }}
                    >
                        {typeof computedCount === 'number' ? computedCount : favoritesCount}
                    </Typography>
                )}
            </Box>
        );
    }

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
                role="button"
                aria-label={aria}
                data-testid="favorite-toggle"
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
                        data-testid="favorite-count"
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
        <Tooltip title={aria}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>
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
                        aria-label={aria}
                        data-testid="favorite-toggle"
                        disabled={!isLoggedIn}
                    >
                        {isFavoritedByUser ? (
                            <Favorite sx={{ fontSize: iconSize }} />
                        ) : (
                            <FavoriteBorder sx={{ fontSize: iconSize }} />
                        )}
                    </IconButton>
                </span>
                {showCount && (
                    <Typography 
                        variant="caption"
                        data-testid="favorite-count"
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
