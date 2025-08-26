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
}

export default function DistanceFilter({ 
    distanceFilterEnabled, 
    onDistanceFilterEnabledChange, 
    distanceFilter, 
    onDistanceFilterChange 
}: DistanceFilterProps) {
    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocationOn sx={{ color: 'var(--color-accent-blue)' }} />
                <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                    Distance Filter
                </Typography>
                <Switch
                    checked={distanceFilterEnabled}
                    onChange={(e) => onDistanceFilterEnabledChange(e.target.checked)}
                    sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                            color: 'var(--color-accent-blue)',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: 'var(--color-accent-blue)',
                        },
                    }}
                />
            </Box>
            
            {distanceFilterEnabled && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Box sx={{ width: 200 }}>
                        <Slider
                            value={distanceFilter}
                            onChange={(_, value) => onDistanceFilterChange(value as number)}
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
                    <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', minWidth: 'fit-content' }}>
                        Max Distance: {distanceFilter}km
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
