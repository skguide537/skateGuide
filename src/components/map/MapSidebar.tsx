// Map sidebar component for EnhancedMap
import {
    Box,
    IconButton,
    Typography,
    Button,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Collapse,
    Switch,
    FormControlLabel,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Divider
} from '@mui/material';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import {
    Search,
    FilterList,
    Close as CloseIcon,
    ExpandMore,
    ExpandLess
} from '@mui/icons-material';
import { MapFilterOptions } from '@/services/mapFilter.service';
import { SkateparkBasic } from '@/types/skatepark';
import { Size, Tag } from '@/types/enums';

interface MapSidebarProps {
    isMobile: boolean;
    sidebarOpen: boolean;
    showFilters: boolean;
    filters: MapFilterOptions;
    hasActiveFilters: boolean;
    filterSummary: string[];
    resultsSummary: string;
    filteredSpots: SkateparkBasic[];
    allSizes: string[];
    allLevels: string[];
    uniqueTags: string[];
    isLoading: boolean;
    onClose: () => void;
    onToggleFilters: () => void;
    onUpdateSearchTerm: (term: string) => void;
    onUpdateTypeFilter: (type: 'all' | 'park' | 'street') => void;
    onUpdateSizeFilter: (sizes: string[]) => void;
    onUpdateLevelFilter: (levels: string[]) => void;
    onUpdateTagFilter: (tags: Tag[]) => void;
    onUpdateDistanceFilterEnabled: (enabled: boolean) => void;
    onUpdateDistanceFilter: (distance: number) => void;
    onUpdateRatingFilter: (rating: number[]) => void;
    onClearAllFilters: () => void;
    onSpotClick: (spot: SkateparkBasic) => void;
}

export default function MapSidebar({
    isMobile,
    sidebarOpen,
    showFilters,
    filters,
    hasActiveFilters,
    filterSummary,
    resultsSummary,
    filteredSpots,
    allSizes,
    allLevels,
    uniqueTags,
    isLoading,
    onClose,
    onToggleFilters,
    onUpdateSearchTerm,
    onUpdateTypeFilter,
    onUpdateSizeFilter,
    onUpdateLevelFilter,
    onUpdateTagFilter,
    onUpdateDistanceFilterEnabled,
    onUpdateDistanceFilter,
    onUpdateRatingFilter,
    onClearAllFilters,
    onSpotClick
}: MapSidebarProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    // Virtual scrolling setup
    const virtualizer = useVirtualizer({
        count: filteredSpots?.length || 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 120, // Estimated height of each spot item
        overscan: 5, // Number of items to render outside the visible area
    });

    if (!sidebarOpen) return null;

    return (
        <Box sx={{
            width: isMobile ? '100vw' : 380,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--color-surface)',
            borderRight: '1px solid var(--color-border)',
            zIndex: 1000
        }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'var(--color-text-primary)' }}>
                        Skate Spots
                    </Typography>
                    {isMobile && (
                        <IconButton onClick={onClose}>
                            <CloseIcon />
                        </IconButton>
                    )}
                </Box>

                {/* Search and Filter Section */}
                <Box sx={{
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
                        value={filters.searchTerm}
                        onChange={(e) => onUpdateSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: 'var(--color-accent-blue)' }} />
                                </InputAdornment>
                            ),
                        }}
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
                            },
                            '& .MuiInputBase-input::placeholder': {
                                color: 'var(--color-text-secondary)',
                                opacity: 1,
                            }
                        }}
                    />

                    {/* Filter Toggle */}
                    <Button
                        startIcon={<FilterList />}
                        endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
                        onClick={onToggleFilters}
                        variant="contained"
                        fullWidth
                        sx={{
                            backgroundColor: 'var(--color-accent-rust)',
                            color: 'var(--color-surface-elevated)',
                            fontWeight: 'bold',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-md)',
                            transition: 'all var(--transition-fast)',
                            textTransform: 'none',
                            mb: 2,
                            '&:hover': {
                                backgroundColor: 'var(--color-accent-rust)',
                                transform: 'translateY(-1px)',
                                boxShadow: 'var(--shadow-lg)',
                            }
                        }}
                    >
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>

                    {/* Collapsible Filters */}
                    <Collapse in={showFilters}>
                        <Box sx={{ pt: 2, borderTop: '1px solid var(--color-border)' }}>
                            {/* Type Filter */}
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel sx={{ color: 'var(--color-text-secondary)' }}>Type</InputLabel>
                                <Select
                                    value={filters.typeFilter}
                                    onChange={(e) => onUpdateTypeFilter(e.target.value as 'all' | 'park' | 'street')}
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
                                            color: 'var(--color-text-primary)',
                                        }
                                    }}
                                >
                                    <MenuItem value="all">All Types</MenuItem>
                                    <MenuItem value="park">Parks Only</MenuItem>
                                    <MenuItem value="street">Street Only</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Size Filter */}
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel sx={{ color: 'var(--color-text-secondary)' }}>Size</InputLabel>
                                <Select
                                    multiple
                                    value={filters.sizeFilter}
                                    onChange={(e) => onUpdateSizeFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
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
                                            color: 'var(--color-text-primary)',
                                        }
                                    }}
                                >
                                    {Object.values(Size).map((size) => (
                                        <MenuItem key={size} value={size}>
                                            {size}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Level Filter */}
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel sx={{ color: 'var(--color-text-secondary)' }}>Level</InputLabel>
                                <Select
                                    multiple
                                    value={filters.levelFilter}
                                    onChange={(e) => onUpdateLevelFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
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
                                            color: 'var(--color-text-primary)',
                                        }
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
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel sx={{ color: 'var(--color-text-secondary)' }}>Tags</InputLabel>
                                <Select
                                    multiple
                                    value={filters.tagFilter}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (typeof value === 'string') {
                                            onUpdateTagFilter(value.split(',') as Tag[]);
                                        } else {
                                            onUpdateTagFilter(value as Tag[]);
                                        }
                                    }}
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
                                            color: 'var(--color-text-primary)',
                                        }
                                    }}
                                >
                                    {uniqueTags.map((tag) => (
                                        <MenuItem key={tag} value={tag}>
                                            {tag}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Distance Filter */}
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={filters.distanceFilterEnabled}
                                        onChange={(e) => onUpdateDistanceFilterEnabled(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="Distance Filter"
                                sx={{ mb: 1 }}
                            />

                            {filters.distanceFilterEnabled && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 1 }}>
                                        Within {filters.distanceFilter}km
                                    </Typography>
                                    <Slider
                                        value={filters.distanceFilter}
                                        onChange={(_, value) => onUpdateDistanceFilter(value as number)}
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
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 1 }}>
                                    Rating: {filters.ratingFilter[0]} - {filters.ratingFilter[1]} stars
                                </Typography>
                                <Slider
                                    value={filters.ratingFilter}
                                    onChange={(_, value) => onUpdateRatingFilter(value as number[])}
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
                                    onClick={onClearAllFilters}
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
                </Box>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 1 }}>
                            Active Filters:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
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
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                        {resultsSummary}
                    </Typography>
                </Box>

                {/* Loading State */}
                {isLoading && (
                    <Box sx={{ mt: 2, textAlign: 'center', p: 3 }}>
                        <Typography variant="body1" sx={{ color: 'var(--color-text-secondary)' }}>
                            Loading spots...
                        </Typography>
                    </Box>
                )}



                {/* Spots List */}
                {filteredSpots && filteredSpots.length > 0 && (
                    <Box sx={{ mt: 2, flex: 1 }}>
                        <Typography variant="h6" sx={{ color: 'var(--color-text-primary)', mb: 2, fontWeight: 600 }}>
                            Spots
                        </Typography>

                        {/* Virtual Scrolling Container */}
                        <Box
                            ref={parentRef}
                            sx={{
                                height: '300px',
                                overflow: 'auto',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--color-surface)',
                            }}
                        >
                            <div
                                style={{
                                    height: `${virtualizer.getTotalSize()}px`,
                                    width: '100%',
                                    position: 'relative',
                                }}
                            >
                                {virtualizer.getVirtualItems().map((virtualRow) => {
                                    const spot = filteredSpots[virtualRow.index];
                                    if (!spot) return null;

                                    return (
                                        <div
                                            key={spot._id}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                        >
                                            <Box sx={{ p: 1 }}>
                                                <ListItem disablePadding>
                                                    <ListItemButton
                                                        onClick={() => onSpotClick(spot)}
                                                        sx={{
                                                            borderRadius: 'var(--radius-md)',
                                                            '&:hover': {
                                                                backgroundColor: 'var(--color-surface-elevated)',
                                                            }
                                                        }}
                                                    >
                                                        <ListItemText
                                                            primary={spot.title}
                                                            primaryTypographyProps={{
                                                                variant: 'body1',
                                                                sx: { fontWeight: 600, color: 'var(--color-text-primary)' }
                                                            }}
                                                            secondary={
                                                                <>
                                                                    <Box component="span" sx={{ display: 'block', color: 'var(--color-text-secondary)', mb: 0.5 }}>
                                                                        {spot.isPark ? '🏟️ Park' : '🛹 Street Spot'}
                                                                    </Box>
                                                                    {spot.size && (
                                                                        <Box component="span" sx={{ display: 'block', color: 'var(--color-text-secondary)', mb: 0.5 }}>
                                                                            Size: {spot.size}
                                                                        </Box>
                                                                    )}
                                                                    {spot.levels && spot.levels.length > 0 && (
                                                                        <Box component="span" sx={{ display: 'block', color: 'var(--color-text-secondary)', mb: 0.5 }}>
                                                                            Levels: {spot.levels.join(', ')}
                                                                        </Box>
                                                                    )}
                                                                    {spot.avgRating && (
                                                                        <Box component="span" sx={{ display: 'block', color: 'var(--color-text-secondary)' }}>
                                                                            ⭐ {spot.avgRating.toFixed(1)} stars
                                                                        </Box>
                                                                    )}
                                                                </>
                                                            }
                                                        />
                                                    </ListItemButton>
                                                </ListItem>
                                                {virtualRow.index < filteredSpots.length - 1 && <Divider />}
                                            </Box>
                                        </div>
                                    );
                                })}
                            </div>
                        </Box>
                    </Box>
                )}

                {/* No Results Message */}
                {filteredSpots && filteredSpots.length === 0 && !isLoading && (
                    <Box sx={{ mt: 2, textAlign: 'center', p: 3 }}>
                        <Typography variant="body1" sx={{ color: 'var(--color-text-secondary)' }}>
                            No spots found matching your filters.
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={onClearAllFilters}
                            sx={{ mt: 2 }}
                        >
                            Clear Filters
                        </Button>
                    </Box>
                )}

                {/* Virtual Scrolling Status */}
                {filteredSpots && filteredSpots.length > 0 && (
                    <Box sx={{
                        textAlign: 'center',
                        mt: 2,
                        p: 2,
                        backgroundColor: 'var(--color-surface-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.75rem'
                    }}>
                        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                            🚀 Virtual scrolling enabled • Smooth performance with {filteredSpots.length} spots
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
