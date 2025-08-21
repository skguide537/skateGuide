'use client';

import React, { useState, useMemo } from 'react';
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
    const [showFilters, setShowFilters] = useState(false);
    const { user } = useUser();

    // Get unique values for filter options
    const allSizes = ['Small', 'Medium', 'Large'];
    const allLevels = ['Beginner', 'Intermediate', 'Expert'];
    const uniqueTags = ['Ramp', 'Rail', 'Stairs', 'Gap', 'Bowl', 'Halfpipe', 'Street', 'Park'];

    const handleClearFilters = () => {
        onTypeFilterChange('all');
        onSizeFilterChange([]);
        onLevelFilterChange([]);
        onTagFilterChange([]);
        onDistanceFilterEnabledChange(false);
        onDistanceFilterChange(10);
        onRatingFilterChange([0, 5]);
        onShowOnlyFavoritesChange(false);
        onSortByChange('default');
    };

    const hasActiveFilters = 
        typeFilter !== 'all' ||
        sizeFilter.length > 0 ||
        levelFilter.length > 0 ||
        tagFilter.length > 0 ||
        distanceFilterEnabled ||
        ratingFilter[0] !== 0 ||
        ratingFilter[1] !== 5 ||
        showOnlyFavorites ||
        sortBy !== 'default';

    return (
        <Box sx={{ 
            mb: 4, 
            p: 3, 
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(167, 169, 172, 0.2)'
        }}>
            {/* Search Bar - Always Visible */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Search spots, tags, locations..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: '#A7A9AC' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#A7A9AC',
                                }
                            },
                            '&.Mui-focused': {
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#A7A9AC',
                                }
                            }
                        }
                    }}
                />
            </Box>

            {/* Sort Options - Always Visible */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#2F2F2F', fontWeight: 500 }}>
                    <Sort sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.2em' }} />
                    Sort by:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControlLabel
                        control={
                            <input
                                type="radio"
                                name="sortBy"
                                value="default"
                                checked={sortBy === 'default'}
                                onChange={(e) => onSortByChange(e.target.value as any)}
                                style={{ margin: 0 }}
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{ color: '#2F2F2F', display: 'flex', alignItems: 'center' }}>
                                <Sort sx={{ mr: 0.5, fontSize: '1em' }} />
                                Default
                            </Typography>
                        }
                        sx={{ 
                            margin: 0,
                            '& .MuiFormControlLabel-label': { ml: 1 }
                        }}
                    />
                    <FormControlLabel
                        control={
                            <input
                                type="radio"
                                name="sortBy"
                                value="distance"
                                checked={sortBy === 'distance'}
                                onChange={(e) => onSortByChange(e.target.value as any)}
                                style={{ margin: 0 }}
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{ color: '#2F2F2F', display: 'flex', alignItems: 'center' }}>
                                <LocationOn sx={{ mr: 0.5, fontSize: '1em' }} />
                                Distance
                            </Typography>
                        }
                        sx={{ 
                            margin: 0,
                            '& .MuiFormControlLabel-label': { ml: 1 }
                        }}
                    />
                    <FormControlLabel
                        control={
                            <input
                                type="radio"
                                name="sortBy"
                                value="rating"
                                checked={sortBy === 'rating'}
                                onChange={(e) => onSortByChange(e.target.value as any)}
                                style={{ margin: 0 }}
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{ color: '#2F2F2F', display: 'flex', alignItems: 'center' }}>
                                <Star sx={{ mr: 0.5, fontSize: '1em' }} />
                                Top Rated
                            </Typography>
                        }
                        sx={{ 
                            margin: 0,
                            '& .MuiFormControlLabel-label': { ml: 1 }
                        }}
                    />
                    <FormControlLabel
                        control={
                            <input
                                type="radio"
                                name="sortBy"
                                value="recent"
                                checked={sortBy === 'recent'}
                                onChange={(e) => onSortByChange(e.target.value as any)}
                                style={{ margin: 0 }}
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{ color: '#2F2F2F', display: 'flex', alignItems: 'center' }}>
                                <Schedule sx={{ mr: 0.5, fontSize: '1em' }} />
                                Recently Added
                            </Typography>
                        }
                        sx={{ 
                            margin: 0,
                            '& .MuiFormControlLabel-label': { ml: 1 }
                        }}
                    />
                </Box>
            </Box>

            {/* Filter Toggle Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Button
                    startIcon={<FilterList />}
                    endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outlined"
                    sx={{
                        borderColor: '#A7A9AC',
                        color: '#2F2F2F',
                        '&:hover': {
                            borderColor: '#8A8A8A',
                            backgroundColor: 'rgba(167, 169, 172, 0.1)'
                        }
                    }}
                >
                    Filters ({filteredCount} of {totalCount} spots)
                </Button>

                {hasActiveFilters && (
                    <Button
                        onClick={handleClearFilters}
                        variant="text"
                        size="small"
                        sx={{ color: '#A7A9AC' }}
                    >
                        Clear All
                    </Button>
                )}
            </Box>

            {/* Collapsible Filters */}
            <Collapse in={showFilters}>
                <Box sx={{ 
                    pt: 2, 
                    borderTop: '1px solid rgba(167, 169, 172, 0.3)',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                    gap: 3
                }}>
                    {/* Type Filter */}
                    <FormControl fullWidth>
                        <InputLabel sx={{ color: '#2F2F2F' }} shrink>Type</InputLabel>
                        <Select
                            value={typeFilter}
                            label="Type"
                            onChange={(e) => onTypeFilterChange(e.target.value as any)}
                        >
                            <MenuItem value="all">All Types</MenuItem>
                            <MenuItem value="park">Parks</MenuItem>
                            <MenuItem value="street">Street Spots</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Size Filter */}
                    <FormControl fullWidth>
                        <InputLabel sx={{ color: '#2F2F2F' }} shrink>Size</InputLabel>
                        <Select
                            multiple
                            value={sizeFilter}
                            label="Size"
                            displayEmpty
                            onChange={(e) => onSizeFilterChange(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.length === 0 ? (
                                        <Typography variant="body2" sx={{ color: '#2F2F2F' }}>All Sizes</Typography>
                                    ) : (
                                        selected.map((value) => (
                                            <Chip key={value} label={value} size="small" />
                                        ))
                                    )}
                                </Box>
                            )}
                        >
                            {allSizes.map(size => (
                                <MenuItem key={size} value={size}>{size}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Level Filter */}
                    <FormControl fullWidth>
                        <InputLabel sx={{ color: '#2F2F2F' }} shrink>Level</InputLabel>
                        <Select
                            multiple
                            value={levelFilter}
                            label="Level"
                            displayEmpty
                            onChange={(e) => onLevelFilterChange(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.length === 0 ? (
                                        <Typography variant="body2" sx={{ color: '#2F2F2F' }}>All Levels</Typography>
                                    ) : (
                                        selected.map((value) => (
                                            <Chip key={value} label={value} size="small" />
                                        ))
                                    )}
                                </Box>
                            )}
                        >
                            {allLevels.map(level => (
                                <MenuItem key={level} value={level}>{level}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Tag Filter */}
                    <FormControl fullWidth>
                        <InputLabel sx={{ color: '#2F2F2F' }} shrink>Tags</InputLabel>
                        <Select
                            multiple
                            value={tagFilter}
                            label="Tags"
                            displayEmpty
                            onChange={(e) => onTagFilterChange(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.length === 0 ? (
                                        <Typography variant="body2" sx={{ color: '#2F2F2F' }}>All Tags</Typography>
                                    ) : (
                                        selected.map((value) => (
                                            <Chip key={value} label={value} size="small" />
                                        ))
                                    )}
                                </Box>
                            )}
                        >
                            {uniqueTags.map(tag => (
                                <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Favorites Toggle */}
                    {user && (
                        <FormControl fullWidth>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={showOnlyFavorites}
                                        onChange={(e) => onShowOnlyFavoritesChange(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#2F2F2F' }}>
                                        {showOnlyFavorites ? <Favorite color="error" /> : <FavoriteBorder />}
                                        Show only favorites
                                    </Box>
                                }
                            />
                        </FormControl>
                    )}

                    {/* Distance Filter */}
                    {userLocation && (
                        <FormControl fullWidth>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={distanceFilterEnabled}
                                        onChange={(e) => onDistanceFilterEnabledChange(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label={<Box sx={{ color: '#2F2F2F' }}>Filter by distance</Box>}
                            />
                            {distanceFilterEnabled && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography gutterBottom variant="body2">
                                        Distance: {distanceFilter}km
                                    </Typography>
                                    <Slider
                                        value={distanceFilter}
                                        onChange={(_, newValue) => onDistanceFilterChange(newValue as number)}
                                        min={1}
                                        max={50}
                                        valueLabelDisplay="auto"
                                        valueLabelFormat={(value) => `${value}km`}
                                        sx={{
                                            color: '#A7A9AC',
                                            '& .MuiSlider-thumb': {
                                                backgroundColor: '#A7A9AC',
                                            }
                                        }}
                                    />
                                </Box>
                            )}
                        </FormControl>
                    )}

                    {/* Rating Filter */}
                    <FormControl fullWidth>
                        <Typography gutterBottom variant="body2" sx={{ color: '#2F2F2F' }}>
                            Rating: {ratingFilter[0]} - {ratingFilter[1]} stars
                        </Typography>
                        <Slider
                            value={ratingFilter}
                            onChange={(_, newValue) => onRatingFilterChange(newValue as number[])}
                            min={0}
                            max={5}
                            step={0.5}
                            valueLabelDisplay="auto"
                            sx={{
                                color: '#A7A9AC',
                                '& .MuiSlider-thumb': {
                                    backgroundColor: '#A7A9AC',
                                }
                            }}
                        />
                    </FormControl>
                </Box>
            </Collapse>
        </Box>
    );
}
