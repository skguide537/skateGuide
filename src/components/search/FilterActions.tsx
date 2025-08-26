'use client';

import React from 'react';
import { Box, Button, Collapse } from '@mui/material';
import { FilterList, ExpandLess, ExpandMore } from '@mui/icons-material';

interface FilterActionsProps {
    filtersExpanded: boolean;
    onToggleFilters: () => void;
    onClearAllFilters: () => void;
}

export default function FilterActions({ filtersExpanded, onToggleFilters, onClearAllFilters }: FilterActionsProps) {
    return (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
            <Button
                variant="outlined"
                onClick={onToggleFilters}
                startIcon={filtersExpanded ? <ExpandLess /> : <ExpandMore />}
                sx={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                    '&:hover': {
                        borderColor: 'var(--color-accent-blue)',
                        backgroundColor: 'var(--color-surface-elevated)',
                    },
                }}
            >
                {filtersExpanded ? 'Hide Filters' : 'Show Filters'}
            </Button>
            
            <Button
                variant="outlined"
                onClick={onClearAllFilters}
                startIcon={<FilterList />}
                sx={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                    '&:hover': {
                        borderColor: 'var(--color-accent-rust)',
                        backgroundColor: 'var(--color-surface-elevated)',
                    },
                }}
            >
                Clear All
            </Button>
        </Box>
    );
}
