'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';

interface FavoritesFilterProps {
    showOnlyFavorites: boolean;
    onShowOnlyFavoritesChange: (show: boolean) => void;
    user: any;
}

export default function FavoritesFilter({ showOnlyFavorites, onShowOnlyFavoritesChange, user }: FavoritesFilterProps) {
    if (!user) return null;

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                cursor: 'pointer',
                p: 1,
                borderRadius: 1,
                '&:hover': {
                    backgroundColor: 'var(--color-surface-elevated)',
                }
            }}
            onClick={() => onShowOnlyFavoritesChange(!showOnlyFavorites)}
        >
            {showOnlyFavorites ? (
                <Favorite sx={{ color: 'red' }} />
            ) : (
                <FavoriteBorder sx={{ color: 'var(--color-text-secondary)' }} />
            )}
            <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                Show Only Favorites
            </Typography>
        </Box>
    );
}
