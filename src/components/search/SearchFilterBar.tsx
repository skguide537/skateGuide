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
            p: 2.5, 
            backgroundColor: 'var(--color-surface-elevated)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
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
            {/* Search Bar */}
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2, 
                color: 'var(--color-text-primary)', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              🔍 Search & Discover
            </Typography>
            
            <TextField
              fullWidth
              placeholder="Search spots, tags, locations..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  transition: 'all var(--transition-fast)',
                  '&:hover': {
                    borderColor: 'var(--color-accent-blue)',
                    backgroundColor: 'var(--color-surface-elevated)',
                  },
                  '&.Mui-focused': {
                    borderColor: 'var(--color-accent-blue)',
                    boxShadow: '0 0 0 2px rgba(93, 173, 226, 0.2)',
                  }
                }
              }}
              InputProps={{
                startAdornment: <Search sx={{ color: 'var(--color-accent-blue)', mr: 1 }} />,
              }}
            />

            {/* Sort Options */}
            <Typography 
              variant="subtitle1" 
              sx={{ 
                mb: 1.5, 
                color: 'var(--color-text-primary)', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              ☰ Sort by:
            </Typography>
            
            <Box sx={{ 
              mb: 2,
              display: 'flex', 
              gap: 2, 
              flexWrap: 'wrap',
              p: 1.5,
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)'
            }}>
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
                  <Typography variant="body2" sx={{ color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                    <Sort sx={{ mr: 0.5, fontSize: '1em', color: 'var(--color-accent-green)' }} />
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
                  <Typography variant="body2" sx={{ color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                    <LocationOn sx={{ mr: 0.5, fontSize: '1em', color: 'var(--color-accent-blue)' }} />
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
                  <Typography variant="body2" sx={{ color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                    <Star sx={{ mr: 0.5, fontSize: '1em', color: 'var(--color-accent-rust)' }} />
                    Rating
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
                  <Typography variant="body2" sx={{ color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                    <Schedule sx={{ mr: 0.5, fontSize: '1em', color: 'var(--color-accent-green)' }} />
                    Recent
                  </Typography>
                }
                sx={{ 
                  margin: 0,
                  '& .MuiFormControlLabel-label': { ml: 1 }
                }}
              />
            </Box>

            {/* Filter Toggle Button */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Button
                variant="contained"
                onClick={() => setShowFilters(!showFilters)}
                sx={{
                  backgroundColor: 'var(--color-accent-blue)',
                  color: 'var(--color-surface-elevated)',
                  fontWeight: 'bold',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'all var(--transition-fast)',
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  '&:hover': {
                    backgroundColor: 'var(--color-accent-blue)',
                    transform: 'translateY(-2px)',
                    boxShadow: 'var(--shadow-lg)',
                  }
                }}
                startIcon={<FilterList />}
                endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </Box>

            {/* Collapsible Filters */}
            <Collapse in={showFilters}>
                <Box sx={{ 
                    pt: 3, 
                    borderTop: '2px solid var(--color-border)',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                    gap: 3
                }}>
                    {/* Favorites Toggle */}
                    {user && (
                        <FormControl fullWidth>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={showOnlyFavorites}
                                        onChange={(e) => onShowOnlyFavoritesChange(e.target.checked)}
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: 'var(--color-accent-green)',
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: 'var(--color-accent-green)',
                                            },
                                        }}
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'var(--color-text-primary)', fontWeight: 500 }}>
                                        {showOnlyFavorites ? <Favorite sx={{ color: 'var(--color-accent-rust)' }} /> : <FavoriteBorder sx={{ color: 'var(--color-accent-rust)' }} />}
                                        Show only favorites
                                    </Box>
                                }
                            />
                        </FormControl>
                    )}

                    {/* Distance Filter */}
                    {userLocation && (
                        <FormControl fullWidth>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ color: 'var(--color-text-primary)', fontWeight: 600, mb: 1 }}>
                                    <LocationOn sx={{ mr: 1, color: 'var(--color-accent-blue)' }} />
                                    Distance (km): {distanceFilter}
                                </Typography>
                                <FormControlLabel
                                    control={
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
                                    }
                                    label="Enable distance filter"
                                    sx={{ color: 'var(--color-text-secondary)' }}
                                />
                            </Box>
                            {distanceFilterEnabled && (
                                <Slider
                                    value={distanceFilter}
                                    onChange={(_, value) => onDistanceFilterChange(value as number)}
                                    min={1}
                                    max={50}
                                    step={1}
                                    sx={{
                                        '& .MuiSlider-thumb': {
                                            backgroundColor: 'var(--color-accent-blue)',
                                        },
                                        '& .MuiSlider-track': {
                                            backgroundColor: 'var(--color-accent-blue)',
                                        },
                                        '& .MuiSlider-rail': {
                                            backgroundColor: 'var(--color-border)',
                                        },
                                    }}
                                />
                            )}
                        </FormControl>
                    )}

                    {/* Rating Filter */}
                    <FormControl fullWidth>
                        <Typography variant="subtitle2" sx={{ color: 'var(--color-text-primary)', fontWeight: 600, mb: 2 }}>
                            <Star sx={{ mr: 1, color: 'var(--color-accent-rust)' }} />
                            Rating Range: {ratingFilter[0]} - {ratingFilter[1]}
                        </Typography>
                        <Slider
                            value={ratingFilter}
                            onChange={(_, value) => onRatingFilterChange(value as number[])}
                            min={0}
                            max={5}
                            step={0.5}
                            sx={{
                                '& .MuiSlider-thumb': {
                                    backgroundColor: 'var(--color-accent-rust)',
                                },
                                '& .MuiSlider-track': {
                                    backgroundColor: 'var(--color-accent-rust)',
                                },
                                '& .MuiSlider-rail': {
                                    backgroundColor: 'var(--color-border)',
                                },
                            }}
                        />
                    </FormControl>

                    {/* Type Filter */}
                    <FormControl fullWidth>
                        <InputLabel sx={{ color: 'var(--color-text-primary)', fontWeight: 500 }} shrink>Type</InputLabel>
                        <Select
                            value={typeFilter}
                            label="Type"
                            onChange={(e) => onTypeFilterChange(e.target.value as any)}
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
                            }}
                        >
                            <MenuItem value="all">All Types</MenuItem>
                            <MenuItem value="park">Parks</MenuItem>
                            <MenuItem value="street">Street Spots</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Size Filter */}
                    <FormControl fullWidth>
                        <InputLabel sx={{ color: 'var(--color-text-primary)', fontWeight: 500 }} shrink>Size</InputLabel>
                        <Select
                            multiple
                            value={sizeFilter}
                            label="Size"
                            onChange={(e) => onSizeFilterChange(e.target.value as string[])}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip 
                                            key={value} 
                                            label={value} 
                                            size="small"
                                            sx={{
                                                backgroundColor: 'var(--color-accent-green)',
                                                color: 'var(--color-surface-elevated)',
                                                fontWeight: 500,
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-border)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-accent-green)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-accent-green)',
                                },
                            }}
                        >
                            {allSizes.map((size) => (
                                <MenuItem key={size} value={size}>
                                    {size}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Level Filter */}
                    <FormControl fullWidth>
                        <InputLabel sx={{ color: 'var(--color-text-primary)', fontWeight: 500 }} shrink>Level</InputLabel>
                        <Select
                            multiple
                            value={levelFilter}
                            label="Level"
                            onChange={(e) => onLevelFilterChange(e.target.value as string[])}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip 
                                            key={value} 
                                            label={value} 
                                            size="small"
                                            sx={{
                                                backgroundColor: 'var(--color-accent-rust)',
                                                color: 'var(--color-surface-elevated)',
                                                fontWeight: 500,
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-border)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-accent-rust)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'var(--color-accent-rust)',
                                },
                            }}
                        >
                            {allLevels.map((level) => (
                                <MenuItem key={level} value={level}>
                                    {level}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Tag Filter */}
                    <FormControl fullWidth>
                        <InputLabel sx={{ color: 'var(--color-text-primary)', fontWeight: 500 }} shrink>Tags</InputLabel>
                        <Select
                            multiple
                            value={tagFilter}
                            label="Tags"
                            onChange={(e) => onTagFilterChange(e.target.value as string[])}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip 
                                            key={value} 
                                            label={value} 
                                            size="small"
                                            sx={{
                                                backgroundColor: 'var(--color-accent-blue)',
                                                color: 'var(--color-surface-elevated)',
                                                fontWeight: 500,
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}
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
                            }}
                        >
                            {uniqueTags.map((tag) => (
                                <MenuItem key={tag} value={tag}>
                                    {tag}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Collapse>

            {/* Results Summary and Clear Filters */}
            <Box sx={{ 
                mt: 4, 
                pt: 3, 
                borderTop: '2px solid var(--color-border)',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Typography variant="body2" color="var(--color-text-secondary)">
                    Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> spots
                </Typography>
                
                {hasActiveFilters && (
                    <Button
                        onClick={handleClearFilters}
                        variant="outlined"
                        sx={{
                            color: 'var(--color-accent-rust)',
                            borderColor: 'var(--color-accent-rust)',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 500,
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: 'rgba(230, 126, 34, 0.1)',
                                borderColor: 'var(--color-accent-rust)',
                                transform: 'translateY(-1px)',
                            }
                        }}
                    >
                        Clear All Filters
                    </Button>
                )}
            </Box>
        </Box>
    );
}
