'use client';

import React from 'react';
import {
    Box,
    TextField,
    Button,
    Collapse,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Typography,
    Switch,
    FormControlLabel,
    Slider,
    InputAdornment,
    IconButton,
    Tooltip,
    Divider
} from '@mui/material';
import {
    Search,
    FilterList,
    ExpandLess,
    ExpandMore,
    Favorite,
    FavoriteBorder,
    Sort,
    LocationOn,
    Star,
    Schedule
} from '@mui/icons-material';
import { useUser } from '@/context/UserContext';
import { useSearchFilterBar } from '@/hooks/useSearchFilterBar';

interface SearchFilterBarProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    typeFilter: 'all' | 'park' | 'street';
    onTypeFilterChange: (type: 'all' | 'park' | 'street') => void;
    sizeFilter: string[];
    onSizeFilterChange: (sizes: string[]) => void;
    levelFilter: string[];
    onLevelFilterChange: (levels: string[]) => void;
    tagFilter: string[];
    onTagFilterChange: (tags: string[]) => void;
    showOnlyFavorites: boolean;
    onShowOnlyFavoritesChange: (show: boolean) => void;
    distanceFilterEnabled: boolean;
    onDistanceFilterEnabledChange: (enabled: boolean) => void;
    distanceFilter: number;
    onDistanceFilterChange: (distance: number) => void;
    ratingFilter: number[];
    onRatingFilterChange: (rating: number[]) => void;
    sortBy: 'default' | 'distance' | 'rating' | 'recent';
    onSortByChange: (sort: 'default' | 'distance' | 'rating' | 'recent') => void;
    filteredCount: number;
    totalCount: number;
    userLocation: { lat: number; lng: number } | null;
}

export default function SearchFilterBar({
    searchTerm,
    onSearchChange,
    typeFilter,
    onTypeFilterChange,
    sizeFilter,
    onSizeFilterChange,
    levelFilter,
    onLevelFilterChange,
    tagFilter,
    onTagFilterChange,
    showOnlyFavorites,
    onShowOnlyFavoritesChange,
    distanceFilterEnabled,
    onDistanceFilterEnabledChange,
    distanceFilter,
    onDistanceFilterChange,
    ratingFilter,
    onRatingFilterChange,
    sortBy,
    onSortByChange,
    filteredCount,
    totalCount,
    userLocation
}: SearchFilterBarProps) {
    const { user } = useUser();

    const {
        state,
        allSizes,
        allLevels,
        uniqueTags,
        hasActiveFilters,
        filterSummary,
        sortOptions,
        updateSearchTerm,
        updateTypeFilter,
        updateSizeFilter,
        updateLevelFilter,
        updateTagFilter,
        updateShowOnlyFavorites,
        updateDistanceFilterEnabled,
        updateDistanceFilter,
        updateRatingFilter,
        updateSortBy,
        toggleFilters,
        clearAllFilters
    } = useSearchFilterBar();

    // Initialize hook state with props on mount
    React.useEffect(() => {
        updateSearchTerm(searchTerm);
        updateTypeFilter(typeFilter);
        updateSizeFilter(sizeFilter);
        updateLevelFilter(levelFilter);
        updateTagFilter(tagFilter);
        updateShowOnlyFavorites(showOnlyFavorites);
        updateDistanceFilterEnabled(distanceFilterEnabled);
        updateDistanceFilter(distanceFilter);
        updateRatingFilter(ratingFilter);
        updateSortBy(sortBy);
    }, [
        searchTerm, typeFilter, sizeFilter, levelFilter, tagFilter, 
        showOnlyFavorites, distanceFilterEnabled, distanceFilter, 
        ratingFilter, sortBy, updateSearchTerm, updateTypeFilter, 
        updateSizeFilter, updateLevelFilter, updateTagFilter, 
        updateShowOnlyFavorites, updateDistanceFilterEnabled, 
        updateDistanceFilter, updateRatingFilter, updateSortBy
    ]);

    // Sync hook state changes back to parent
    React.useEffect(() => {
        onSearchChange(state.searchTerm);
        onTypeFilterChange(state.typeFilter);
        onSizeFilterChange(state.sizeFilter);
        onLevelFilterChange(state.levelFilter);
        onTagFilterChange(state.tagFilter);
        onShowOnlyFavoritesChange(state.showOnlyFavorites);
        onDistanceFilterEnabledChange(state.distanceFilterEnabled);
        onDistanceFilterChange(state.distanceFilter);
        onRatingFilterChange(state.ratingFilter);
        onSortByChange(state.sortBy);
    }, [
        state.searchTerm, state.typeFilter, state.sizeFilter, state.levelFilter, 
        state.tagFilter, state.showOnlyFavorites, state.distanceFilterEnabled,
        state.distanceFilter, state.ratingFilter, state.sortBy,
        onSearchChange, onTypeFilterChange, onSizeFilterChange, onLevelFilterChange,
        onTagFilterChange, onShowOnlyFavoritesChange, onDistanceFilterEnabledChange,
        onDistanceFilterChange, onRatingFilterChange, onSortByChange
    ]);

    const handleClearFilters = () => {
        clearAllFilters();
    };

    return (
        <Box sx={{ 
            p: 3, 
            backgroundColor: 'var(--color-surface-elevated)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-border)',
            background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, var(--color-accent-green) 0%, var(--color-accent-blue) 50%, var(--color-accent-rust) 100%)',
            }
        }}>
            {/* Header */}
                    <Typography 
                variant="h5" 
                        sx={{ 
                    mb: 3, 
                            color: 'var(--color-text-primary)', 
                    fontWeight: 700,
                    textAlign: 'center',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
            >
                🔍 Search & Filter Skate Spots
                    </Typography>
                    
            {/* Search Bar and Sort Options */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                        <TextField
                        placeholder="Search spots, tags, locations..."
                        value={state.searchTerm}
                        onChange={(e) => updateSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: 'var(--color-accent-blue)' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ 
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 'var(--radius-lg)',
                                backgroundColor: 'var(--color-surface)',
                                border: '2px solid var(--color-border)',
                                transition: 'all var(--transition-fast)',
                                '&:hover': {
                                    borderColor: 'var(--color-accent-blue)',
                                    backgroundColor: 'var(--color-surface-elevated)',
                                },
                                '&.Mui-focused': {
                                    borderColor: 'var(--color-accent-blue)',
                                    boxShadow: '0 0 0 3px rgba(93, 173, 226, 0.2)',
                                }
                            },
                            '& .MuiInputBase-input': {
                                color: 'var(--color-text-primary)',
                                '&::placeholder': {
                                    color: 'var(--color-text-secondary)',
                                    opacity: 1
                                }
                            }
                        }}
                    />
                
                {/* Sort Options */}
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel sx={{ color: 'var(--color-text-secondary)' }}>Sort By</InputLabel>
                    <Select
                        value={state.sortBy}
                        onChange={(e) => updateSortBy(e.target.value as 'default' | 'distance' | 'rating' | 'recent')}
                        sx={{ 
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--color-border)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--color-accent-blue)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--color-accent-blue)',
                            },
                            '& .MuiSelect-select': {
                                color: 'var(--color-text-primary)'
                            }
                        }}
                    >
                                                <MenuItem value="default" sx={{ color: 'var(--color-text-primary)' }}>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Sort sx={{ fontSize: 20 }} />
                                Default
                            </Box>
                        </MenuItem>
                        <MenuItem value="distance" sx={{ color: 'var(--color-text-primary)' }}>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOn sx={{ fontSize: 20 }} />
                                Distance
                            </Box>
                        </MenuItem>
                        <MenuItem value="rating" sx={{ color: 'var(--color-text-primary)' }}>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Star sx={{ fontSize: 20 }} />
                                Rating
                            </Box>
                        </MenuItem>
                        <MenuItem value="recent" sx={{ color: 'var(--color-text-primary)' }}>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Schedule sx={{ fontSize: 20 }} />
                                Recent
                            </Box>
                        </MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Filter Toggle */}
                <Button
                startIcon={<FilterList />}
                endIcon={state.showFilters ? <ExpandLess /> : <ExpandMore />}
                onClick={toggleFilters}
                variant="contained"
                fullWidth
                    sx={{
                    backgroundColor: 'var(--color-accent-rust)',
                    color: 'var(--color-surface-elevated)',
                    fontWeight: 'bold',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)',
                        transition: 'all var(--transition-fast)',
                        textTransform: 'none',
                    mb: 3,
                        '&:hover': {
                        backgroundColor: 'var(--color-accent-rust)',
                        transform: 'translateY(-2px)',
                        boxShadow: 'var(--shadow-lg)',
                    }
                }}
            >
                {state.showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>

            {/* Collapsible Filters */}
            <Collapse in={state.showFilters}>
                <Box sx={{ pt: 3, borderTop: '1px solid var(--color-border)' }}>
                    {/* Type Filter */}
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel sx={{ color: 'var(--color-text-secondary)' }}>Type</InputLabel>
                        <Select
                            value={state.typeFilter}
                            onChange={(e) => updateTypeFilter(e.target.value as 'all' | 'park' | 'street')}
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-border)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-accent-blue)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-accent-blue)',
                                },
                                '& .MuiSelect-select': {
                                    color: 'var(--color-text-primary)'
                                }
                            }}
                        >
                            <MenuItem value="all" sx={{ color: 'var(--color-text-primary)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FilterList sx={{ fontSize: 20 }} />
                                    All Types
                                </Box>
                            </MenuItem>
                            <MenuItem value="park" sx={{ color: 'var(--color-text-primary)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LocationOn sx={{ fontSize: 20 }} />
                                    Parks Only
                                </Box>
                            </MenuItem>
                            <MenuItem value="street" sx={{ color: 'var(--color-text-primary)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LocationOn sx={{ fontSize: 20 }} />
                                    Street Only
                                </Box>
                            </MenuItem>
                        </Select>
                    </FormControl>

                    {/* Size Filter */}
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel sx={{ color: 'var(--color-text-secondary)' }}>Size</InputLabel>
                        <Select
                            multiple
                            value={state.sizeFilter}
                            onChange={(e) => updateSizeFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-border)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-accent-blue)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-accent-blue)',
                                },
                                '& .MuiSelect-select': {
                                    color: 'var(--color-text-primary)'
                                }
                            }}
                        >
                                                        {allSizes.map((size) => (
                                <MenuItem key={size} value={size} sx={{ color: 'var(--color-text-primary)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ 
                                            width: 16, 
                                            height: 16, 
                                            borderRadius: '50%', 
                                            backgroundColor: 'var(--color-accent-blue)',
                                            display: 'inline-block'
                                        }} />
                                        {size}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Level Filter */}
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel sx={{ color: 'var(--color-text-secondary)' }}>Level</InputLabel>
                        <Select
                            multiple
                            value={state.levelFilter}
                            onChange={(e) => updateLevelFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-border)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-accent-blue)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-accent-blue)',
                                },
                                '& .MuiSelect-select': {
                                    color: 'var(--color-text-primary)'
                                }
                            }}
                        >
                                                        {allLevels.map((level) => (
                                <MenuItem key={level} value={level} sx={{ color: 'var(--color-text-primary)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Star sx={{ 
                                            fontSize: 20, 
                                            color: 'var(--color-accent-blue)' 
                                        }} />
                                        {level}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Tag Filter */}
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel sx={{ color: 'var(--color-text-secondary)' }}>Tags</InputLabel>
                        <Select
                            multiple
                            value={state.tagFilter}
                            onChange={(e) => updateTagFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-border)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-accent-blue)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-accent-blue)',
                                },
                                '& .MuiSelect-select': {
                                    color: 'var(--color-text-primary)'
                                }
                            }}
                        >
                                                        {uniqueTags.map((tag) => (
                                <MenuItem key={tag} value={tag} sx={{ color: 'var(--color-text-primary)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ 
                                            width: 8, 
                                            height: 8, 
                                            borderRadius: '50%', 
                                            backgroundColor: 'var(--color-accent-blue)',
                                            display: 'inline-block'
                                        }} />
                                        {tag}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Favorites Filter */}
                    {user && (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={state.showOnlyFavorites}
                                    onChange={(e) => updateShowOnlyFavorites(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {state.showOnlyFavorites ? (
                                        <Favorite sx={{ color: 'var(--color-accent-rust)', fontSize: 20 }} />
                                    ) : (
                                        <FavoriteBorder sx={{ color: 'var(--color-text-secondary)', fontSize: 20 }} />
                                    )}
                                    Show Only Favorites
                                </Box>
                            }
                            sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
                        />
                    )}

                    {/* Distance Filter */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={state.distanceFilterEnabled}
                                onChange={(e) => updateDistanceFilterEnabled(e.target.checked)}
                                color="primary"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOn sx={{ color: 'var(--color-accent-blue)', fontSize: 20 }} />
                                Distance Filter
                            </Box>
                        }
                        sx={{ mb: 2 }}
                    />
                    
                    {state.distanceFilterEnabled && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 1 }}>
                                Within {state.distanceFilter}km
                            </Typography>
                            <Slider
                                value={state.distanceFilter}
                                onChange={(_, value) => updateDistanceFilter(value as number)}
                                min={1}
                                max={50}
                                step={1}
                                valueLabelDisplay="auto"
                                sx={{
                                    color: 'var(--color-accent-blue)',
                                    '& .MuiSlider-thumb': {
                                        backgroundColor: 'var(--color-accent-blue)',
                                    }
                                }}
                            />
                </Box>
                    )}

                    {/* Rating Filter */}
                    <Box sx={{ mb: 3 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Star sx={{ color: 'var(--color-accent-blue)', fontSize: 20 }} />
                            <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                                Rating: {state.ratingFilter[0]} - {state.ratingFilter[1]} stars
                            </Typography>
                        </Box>
                        <Slider
                            value={state.ratingFilter}
                            onChange={(_, value) => updateRatingFilter(value as number[])}
                            min={0}
                            max={5}
                            step={0.5}
                            valueLabelDisplay="auto"
                            sx={{
                                color: 'var(--color-accent-blue)',
                                '& .MuiSlider-thumb': {
                                    backgroundColor: 'var(--color-accent-blue)',
                                }
                            }}
                        />
                    </Box>



                    {/* Clear Filters Button */}
                {hasActiveFilters && (
                    <Button
                            variant="outlined"
                        onClick={handleClearFilters}
                            fullWidth
                        sx={{
                                borderColor: 'var(--color-accent-rust)',
                            color: 'var(--color-accent-rust)',
                            '&:hover': {
                                borderColor: 'var(--color-accent-rust)',
                                    backgroundColor: 'rgba(255, 87, 34, 0.1)',
                            }
                        }}
                    >
                        Clear All Filters
                    </Button>
                )}
                </Box>
            </Collapse>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 2 }}>
                        Active Filters:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {filterSummary.map((filter, index) => (
                            <Chip
                                key={index}
                                label={filter}
                                size="small"
                                variant="outlined"
                                sx={{
                                    borderColor: 'var(--color-accent-blue)',
                                    color: 'var(--color-accent-blue)',
                                    fontSize: '0.75rem'
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Results Summary */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                    Showing {filteredCount} of {totalCount} spots
                </Typography>
            </Box>
        </Box>
    );
}
