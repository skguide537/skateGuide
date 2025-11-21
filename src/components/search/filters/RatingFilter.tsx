'use client';

import React from 'react';
import { Box, Typography, Slider, Switch } from '@mui/material';
import { Star } from '@mui/icons-material';
import { SEARCH_FILTER_CONSTANTS } from '@/constants/searchFilters';

interface RatingFilterProps {
    ratingFilter: number[];
    onRatingFilterChange: (rating: number[]) => void;
    ratingFilterEnabled: boolean;
    onRatingFilterEnabledChange: (enabled: boolean) => void;
}

export default function RatingFilter({ 
    ratingFilter, 
    onRatingFilterChange, 
    ratingFilterEnabled, 
    onRatingFilterEnabledChange 
}: RatingFilterProps) {
    return (
        <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Star sx={{ color: 'var(--color-accent-rust)' }} />
                <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                    Rating Filter
                </Typography>
                <Switch
                    checked={ratingFilterEnabled}
                    onChange={(e) => onRatingFilterEnabledChange(e.target.checked)}
                    sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                            color: 'var(--color-accent-rust)',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: 'var(--color-accent-rust)',
                        },
                    }}
                />
                {ratingFilterEnabled && (
                    <>
                        <Box sx={{ flex: 1, minWidth: 200, maxWidth: 300, ml: 2, display: 'flex', alignItems: 'center' }}>
                            <Slider
                                value={ratingFilter}
                                onChange={(_: Event, value: number | number[]) => onRatingFilterChange(value as number[])}
                                min={SEARCH_FILTER_CONSTANTS.RATING_RANGE.min}
                                max={SEARCH_FILTER_CONSTANTS.RATING_RANGE.max}
                                step={SEARCH_FILTER_CONSTANTS.RATING_RANGE.step}
                                marks={SEARCH_FILTER_CONSTANTS.RATING_RANGE.marks}
                                valueLabelDisplay="auto"
                                sx={{
                                    color: 'var(--color-accent-rust)',
                                    '& .MuiSlider-thumb': {
                                        backgroundColor: 'var(--color-accent-rust)',
                                        width: 20,
                                        height: 20,
                                    },
                                    '& .MuiSlider-track': {
                                        backgroundColor: 'var(--color-accent-rust)',
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
                            {ratingFilter[0]} - {ratingFilter[1]}
                        </Typography>
                    </>
                )}
            </Box>
        </Box>
    );
}
