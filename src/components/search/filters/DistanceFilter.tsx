'use client';

import React from 'react';
import { Box, Typography, Switch, Slider } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import { SEARCH_FILTER_CONSTANTS, SEARCH_FILTER_STYLES } from '@/constants/searchFilters';

interface DistanceFilterProps {
    distanceFilterEnabled: boolean;
    onDistanceFilterEnabledChange: (enabled: boolean) => void;
    distanceFilter: number;
    onDistanceFilterChange: (distance: number) => void;
    disabled?: boolean;
}

export default function DistanceFilter({ 
    distanceFilterEnabled, 
    onDistanceFilterEnabledChange, 
    distanceFilter, 
    onDistanceFilterChange,
    disabled = false,
}: DistanceFilterProps) {
    const handleToggle = (enabled: boolean) => {
        if (disabled) return;
        onDistanceFilterEnabledChange(enabled);
    };

    const handleDistanceChange = (value: number) => {
        if (disabled) return;
        onDistanceFilterChange(value);
    };

    return (
        <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <LocationOn sx={{ color: 'var(--color-accent-blue)' }} />
                <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                    Distance Filter
                </Typography>
                <Switch
                    checked={distanceFilterEnabled}
                    onChange={(e) => handleToggle(e.target.checked)}
                    disabled={disabled}
                    sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                            color: 'var(--color-accent-blue)',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: 'var(--color-accent-blue)',
                        },
                    }}
                />
                {distanceFilterEnabled && !disabled && (
                    <>
                        <Box sx={{ flex: 1, minWidth: 200, maxWidth: 300, ml: 2, display: 'flex', alignItems: 'center' }}>
                            <Slider
                                value={distanceFilter}
                                onChange={(_, value) => handleDistanceChange(value as number)}
                                min={SEARCH_FILTER_CONSTANTS.DISTANCE_RANGE.min}
                                max={SEARCH_FILTER_CONSTANTS.DISTANCE_RANGE.max}
                                step={SEARCH_FILTER_CONSTANTS.DISTANCE_RANGE.step}
                                marks={SEARCH_FILTER_CONSTANTS.DISTANCE_RANGE.marks}
                                sx={{
                                    color: 'var(--color-accent-blue)',
                                    '& .MuiSlider-thumb': {
                                        backgroundColor: 'var(--color-accent-blue)',
                                        width: 20,
                                        height: 20,
                                    },
                                    '& .MuiSlider-track': {
                                        backgroundColor: 'var(--color-accent-blue)',
                                        height: 6,
                                    },
                                    '& .MuiSlider-rail': {
                                        height: 6,
                                        backgroundColor: 'var(--color-border)',
                                    },
                                }}
                            />
                        </Box>
                        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', minWidth: 'fit-content', ml: 1 }}>
                            {distanceFilter}km
                        </Typography>
                    </>
                )}
                {disabled && (
                    <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)', ml: 1 }}>
                        Enable location services to filter by distance.
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
