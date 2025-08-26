'use client';

import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { Search } from '@mui/icons-material';
import { SEARCH_FILTER_STYLES } from '@/constants/searchFilters';

interface KeywordFilterProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
}

export default function KeywordFilter({ searchTerm, onSearchChange }: KeywordFilterProps) {
    return (
        <TextField
            placeholder="Search spots, tags, locations..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <Search sx={{ color: 'var(--color-accent-blue)' }} />
                    </InputAdornment>
                ),
            }}
            sx={SEARCH_FILTER_STYLES.searchBar}
        />
    );
}
