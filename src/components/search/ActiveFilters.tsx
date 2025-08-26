'use client';

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { SEARCH_FILTER_STYLES } from '@/constants/searchFilters';

interface ActiveFiltersProps {
    hasActiveFilters: boolean;
    filterSummary: string;
    onClearAllFilters: () => void;
}

export default function ActiveFilters({ hasActiveFilters, filterSummary, onClearAllFilters }: ActiveFiltersProps) {
    if (!hasActiveFilters) return null;

    return (
        <Box sx={{ mb: 3, p: 2, backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                    Active Filters:
                </Typography>
                <Chip
                    label={filterSummary}
                    onDelete={onClearAllFilters}
                    sx={{
                        backgroundColor: 'var(--color-accent-green)',
                        color: 'white',
                        '& .MuiChip-deleteIcon': {
                            color: 'white',
                        },
                    }}
                />
            </Box>
        </Box>
    );
}
