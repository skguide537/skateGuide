'use client';

import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { Sort, LocationOn, Star, Schedule } from '@mui/icons-material';
import { SEARCH_FILTER_CONSTANTS, SEARCH_FILTER_STYLES } from '@/constants/searchFilters';

interface SortControlProps {
    sortBy: 'distance' | 'rating' | 'recent';
    onSortByChange: (sort: 'distance' | 'rating' | 'recent') => void;
}

const sortIcons = {
    default: Sort,
    distance: LocationOn,
    rating: Star,
    recent: Schedule,
};

export default function SortControl({ sortBy, onSortByChange }: SortControlProps) {
    return (
        <FormControl sx={SEARCH_FILTER_STYLES.sortControl}>
            <InputLabel sx={{ color: 'var(--color-text-secondary)' }}>Sort By</InputLabel>
            <Select
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value as 'distance' | 'rating' | 'recent')}
                sx={SEARCH_FILTER_STYLES.sortControl}
            >
                {SEARCH_FILTER_CONSTANTS.SORT_OPTIONS.map((option) => {
                    const IconComponent = sortIcons[option.value as keyof typeof sortIcons];
                    return (
                        <MenuItem 
                            key={option.value} 
                            value={option.value} 
                            sx={{ color: 'var(--color-text-primary)' }}
                        >
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconComponent sx={{ fontSize: 20 }} />
                                {option.label}
                            </Box>
                        </MenuItem>
                    );
                })}
            </Select>
        </FormControl>
    );
}
