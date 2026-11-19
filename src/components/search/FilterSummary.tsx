'use client';

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { SEARCH_FILTER_STYLES } from '@/constants/searchFilters';

interface FilterSummaryProps {
    filteredCount: number;
    totalCount: number;
}

export default function FilterSummary({ filteredCount, totalCount }: FilterSummaryProps) {
    return (
        <Box sx={{ 
            textAlign: 'center', 
            mb: 1.5, 
            p: 1.5, 
            backgroundColor: 'var(--color-surface)', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
        }}>
            <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 0.5 }}>
                Showing {filteredCount} of {totalCount} spots
            </Typography>
            
            {filteredCount < totalCount && (
                <Chip
                    label={`${totalCount - filteredCount} spots filtered out`}
                    size="small"
                    sx={{
                        backgroundColor: 'var(--color-accent-blue)',
                        color: 'white',
                        fontSize: '0.75rem',
                    }}
                />
            )}
        </Box>
    );
}
