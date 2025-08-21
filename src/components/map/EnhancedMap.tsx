'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Map } from 'leaflet';
import { useCache } from '@/context/ToastContext';
import { 
  Box, 
  IconButton, 
  Tooltip, 
  Chip, 
  Rating, 
  Typography, 
  Button,
  Drawer,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Card,
  CardContent,
  CardMedia,
  List,
  ListItem,
  Divider,
  useMediaQuery,
  useTheme,
  Collapse,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Layers, 
  Search, 
  FilterList, 
  Menu as MenuIcon, 
  Close as CloseIcon,
  MyLocation,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import SkateparkModal from '../modals/SkateparkModal';

// Custom icons for different spot types
const createCustomIcon = (isPark: boolean, size: string, level: string) => {
  const baseSize = [30, 30];
  const iconColor = isPark ? '#4CAF50' : '#FF9800'; // Green for parks, Orange for street
  
  // Create a custom SVG icon
  const svgIcon = `
    <svg width="${baseSize[0]}" height="${baseSize[1]}" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="12" fill="${iconColor}" stroke="white" stroke-width="2"/>
      <text x="15" y="18" text-anchor="middle" fill="white" font-size="10" font-weight="bold">
        ${isPark ? 'P' : 'S'}
      </text>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker-icon',
    iconSize: [baseSize[0], baseSize[1]],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

const myLocationIcon = L.icon({
  iconUrl: '/marker-my-location.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowUrl: '/marker-shadow.png',
  shadowSize: [41, 41],
});

// Map style definitions
const mapStyles = {
  street: {
    name: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
  },
  terrain: {
    name: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>'
  },
  dark: {
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
};

interface MapProps {
  userLocation: [number, number] | null;
}

interface Skatepark {
  _id: string;
  title: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  photoNames: string[]; // Changed from photoName to photoNames
  isPark: boolean;
  size: string;
  level: string;
  tags: string[];
  avgRating: number;
  externalLinks?: {
    url: string;
    sentBy: { id: string; name: string };
    sentAt: string;
  }[];
}

// Component to handle map style changes
function MapStyleController({ currentStyle, onStyleChange }: { 
  currentStyle: string; 
  onStyleChange: (style: string) => void 
}) {
  const map = useMap();
  
  useEffect(() => {
    // Force map refresh when style changes
    map.invalidateSize();
  }, [currentStyle, map]);

  return null;
}

// Rich popup content component
function RichPopup({ spot, onViewDetails }: { 
  spot: Skatepark; 
  onViewDetails: (spot: Skatepark) => void 
}) {
  return (
    <div style={{ minWidth: '250px', maxWidth: '300px' }}>
      <Typography variant="h6" gutterBottom>
        {spot.title}
      </Typography>
      
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Chip 
          label={spot.isPark ? 'Park' : 'Street'} 
          color={spot.isPark ? 'success' : 'warning'} 
          size="small" 
        />
        <Chip label={spot.size} size="small" />
        <Chip label={spot.level} size="small" />
      </Box>
      
      {spot.avgRating > 0 && (
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Rating value={spot.avgRating} readOnly size="small" />
          <Typography variant="body2" color="text.secondary">
            ({spot.avgRating.toFixed(1)})
          </Typography>
        </Box>
      )}
      
      {spot.tags.length > 0 && (
        <Box mb={1}>
          {spot.tags.slice(0, 3).map((tag, index) => (
            <Chip key={index} label={tag} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
          ))}
        </Box>
      )}
      
      <Typography variant="body2" color="text.secondary" mb={2}>
        {spot.description?.substring(0, 100)}
        {spot.description && spot.description.length > 100 && '...'}
      </Typography>
      
      <Button 
        variant="contained" 
        size="small" 
        fullWidth
        onClick={() => onViewDetails(spot)}
      >
        View Details
      </Button>
    </div>
  );
}

export default function EnhancedMap({ userLocation }: MapProps) {
  const [spots, setSpots] = useState<Skatepark[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Skatepark | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMapStyle, setCurrentMapStyle] = useState('street');

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter state
  const [typeFilter, setTypeFilter] = useState<'all' | 'park' | 'street'>('all');
  const [sizeFilter, setSizeFilter] = useState<string[]>([]);
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [distanceFilterEnabled, setDistanceFilterEnabled] = useState(false);
  const [distanceFilter, setDistanceFilter] = useState<number>(10); // km
  const [ratingFilter, setRatingFilter] = useState<number[]>([0, 5]);

  const mapRef = useRef<Map | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Fetch spots data
  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const response = await fetch('/api/skateparks');
        if (!response.ok) throw new Error('Failed to fetch skateparks');
        const data = await response.json();
        setSpots(data);
      } catch (err) {
        setError('Unable to load skateparks');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpots();
  }, []);

  // Subscribe to cache invalidation events to refresh data when spots are deleted
  useCache('skateparks', useCallback(() => {
    const fetchSpots = async () => {
      try {
        const response = await fetch('/api/skateparks');
        if (!response.ok) throw new Error('Failed to fetch skateparks');
        const data = await response.json();
        setSpots(data);
      } catch (err) {
        console.error('Error refreshing spots:', err);
      }
    };

    fetchSpots();
  }, []));

  // Force map refresh when user location changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, [userLocation]);

  const handleStyleChange = (style: string) => {
    setCurrentMapStyle(style);
  };

  const handleViewDetails = (spot: Skatepark) => {
    setSelectedSpot(spot);
  };

  const handleSpotClick = (spot: Skatepark) => {
    // Fly to the spot location
    if (mapRef.current) {
      const [lng, lat] = spot.location.coordinates;
      mapRef.current.flyTo([lat, lng], 16, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
    
    // Don't open modal - let the popup handle it
    setSelectedSpot(null);
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter spots based on search and filter criteria
  const filteredSpots = useMemo(() => {
    return spots.filter(spot => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          spot.title.toLowerCase().includes(searchLower) ||
          spot.description.toLowerCase().includes(searchLower) ||
          spot.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'park' && !spot.isPark) return false;
        if (typeFilter === 'street' && spot.isPark) return false;
      }

      // Size filter
      if (sizeFilter.length > 0 && !sizeFilter.includes(spot.size)) return false;

      // Level filter
      if (levelFilter.length > 0 && !levelFilter.includes(spot.level)) return false;

      // Distance filter
      if (distanceFilterEnabled && userLocation) {
        const distance = calculateDistance(
          userLocation[0], userLocation[1],
          spot.location.coordinates[1], spot.location.coordinates[0]
        );
        if (distance > distanceFilter) return false;
      }

      // Rating filter
      if (spot.avgRating < ratingFilter[0] || spot.avgRating > ratingFilter[1]) return false;

      return true;
    });
  }, [spots, searchTerm, typeFilter, sizeFilter, levelFilter, distanceFilterEnabled, distanceFilter, ratingFilter, userLocation]);

  // Get unique values for filter options
  const allSizes = ['Small', 'Medium', 'Large']; // All possible sizes
  const allLevels = ['Beginner', 'Intermediate', 'Expert']; // All possible levels
  const uniqueTags = Array.from(new Set(spots.flatMap(spot => spot.tags))).filter(Boolean);

  if (isLoading) {
    return <div>Loading map...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Sidebar component
  const sidebarContent = (
    <Box sx={{ width: isMobile ? '100vw' : 380, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: 'var(--color-text-primary)' }}>
            Skate Spots
          </Typography>
          {isMobile && (
            <IconButton onClick={() => setSidebarOpen(false)}>
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              }
            }}
          />
          
          {/* Filter Toggle */}
          <Button
            startIcon={<FilterList />}
            endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
            onClick={() => setShowFilters(!showFilters)}
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
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'all' | 'park' | 'street')}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--color-border)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--color-accent-blue)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--color-accent-blue)',
                    }
                  }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="park">Parks Only</MenuItem>
                  <MenuItem value="street">Street Spots Only</MenuItem>
                </Select>
              </FormControl>
              
              {/* Size Filter */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: 'var(--color-text-secondary)' }}>Size</InputLabel>
                <Select
                  multiple
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--color-border)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--color-accent-blue)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--color-accent-blue)',
                    }
                  }}
                >
                  {allSizes.map((size) => (
                    <MenuItem key={size} value={size}>{size}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Level Filter */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: 'var(--color-text-secondary)' }}>Level</InputLabel>
                <Select
                  multiple
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--color-border)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--color-accent-blue)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--color-accent-blue)',
                    }
                  }}
                >
                  {allLevels.map((level) => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Distance Filter */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={distanceFilterEnabled}
                      onChange={(e) => setDistanceFilterEnabled(e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: 'var(--color-accent-green)',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: 'var(--color-accent-green)',
                        }
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: 'var(--color-text-primary)' }}>
                      Distance Filter ({distanceFilter}km)
                    </Typography>
                  }
                />
                {distanceFilterEnabled && (
                  <Slider
                    value={distanceFilter}
                    onChange={(_, value) => setDistanceFilter(value as number)}
                    min={1}
                    max={50}
                    step={1}
                    marks={[
                      { value: 1, label: '1km' },
                      { value: 25, label: '25km' },
                      { value: 50, label: '50km' }
                    ]}
                    sx={{
                      color: 'var(--color-accent-green)',
                      '& .MuiSlider-mark': {
                        backgroundColor: 'var(--color-border)',
                      },
                      '& .MuiSlider-markLabel': {
                        color: 'var(--color-text-secondary)',
                      }
                    }}
                  />
                )}
              </FormControl>
              
              {/* Rating Filter */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Typography sx={{ color: 'var(--color-text-primary)', mb: 1 }}>
                  Rating Range: {ratingFilter[0]} - {ratingFilter[1]}
                </Typography>
                <Slider
                  value={ratingFilter}
                  onChange={(_, value) => setRatingFilter(value as number[])}
                  min={0}
                  max={5}
                  step={0.5}
                  sx={{
                    color: 'var(--color-accent-rust)',
                    '& .MuiSlider-mark': {
                      backgroundColor: 'var(--color-border)',
                    },
                    '& .MuiSlider-markLabel': {
                      color: 'var(--color-text-secondary)',
                    }
                  }}
                />
              </FormControl>
            </Box>
          </Collapse>
        </Box>
        
        {/* Results Summary */}
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
            Showing {filteredSpots.length} of {spots.length} spots
          </Typography>
        </Box>
        
        {/* Spots List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <List>
            {filteredSpots.map((spot, index) => (
              <Box key={spot._id}>
                <ListItem 
                  onClick={() => handleViewDetails(spot)}
                  sx={{ 
                    p: 2,
                    '&:hover': {
                      backgroundColor: 'var(--color-surface-elevated)',
                    }
                  }}
                >
                  <Card sx={{ width: '100%', backgroundColor: 'var(--color-surface)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'var(--color-text-primary)' }}>
                          {spot.title}
                        </Typography>
                        <Chip 
                          label={spot.isPark ? 'Park' : 'Street'} 
                          size="small" 
                          color={spot.isPark ? 'success' : 'warning'}
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                      <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                        <Chip 
                          label={spot.size} 
                          size="small" 
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                        <Chip 
                          label={spot.level} 
                          size="small" 
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                      {spot.avgRating > 0 && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Rating value={spot.avgRating} readOnly size="small" />
                          <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)' }}>
                            ({spot.avgRating.toFixed(1)})
                          </Typography>
                        </Box>
                      )}
                      {userLocation && (
                        <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)' }}>
                          {calculateDistance(
                            userLocation[0], userLocation[1],
                            spot.location.coordinates[1], spot.location.coordinates[0]
                          ).toFixed(1)}km away
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </ListItem>
                {index < filteredSpots.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && !sidebarOpen && (
        <IconButton
          onClick={() => setSidebarOpen(true)}
          sx={{
            position: 'fixed',
            top: 100,
            left: 16,
            zIndex: 1300,
            bgcolor: 'white',
            boxShadow: 2,
            '&:hover': { bgcolor: 'grey.100' }
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100vw' : 380,
            top: isMobile ? 0 : 80, // Account for navbar
            height: isMobile ? '100vh' : 'calc(100vh - 80px)',
            zIndex: isMobile ? 1300 : 1200,
          },
        }}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Main Content */}
      <Box
        sx={{
          ml: !isMobile && sidebarOpen ? '380px' : 0,
          transition: 'margin-left 0.3s',
          position: 'relative',
        }}
      >
        <Box
          mt={4}
          mx="auto"
          width={!isMobile && sidebarOpen ? "calc(100% - 2rem)" : "80%"}
          height="70vh"
          borderRadius={2}
          boxShadow={3}
          overflow="hidden"
          maxWidth={!isMobile && sidebarOpen ? "none" : 1200}
          position="relative"
        >
        {/* Map Controls */}
        <Box
          position="absolute"
          top={10}
          right={10}
          zIndex={1000}
          bgcolor="white"
          borderRadius={1}
          boxShadow={2}
          p={1}
        >
                  <Box display="flex" flexDirection="column" gap={1}>
          {/* Sidebar Toggle (Desktop only) */}
          {!isMobile && (
            <Tooltip title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}>
              <IconButton
                size="small"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                sx={{ 
                  bgcolor: 'white',
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                <MenuIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Map Style Controls */}
          {Object.entries(mapStyles).map(([key, style]) => (
            <Tooltip key={key} title={`Switch to ${style.name} view`}>
              <IconButton
                size="small"
                onClick={() => handleStyleChange(key)}
                color={currentMapStyle === key ? 'primary' : 'default'}
                sx={{ 
                  bgcolor: currentMapStyle === key ? 'primary.light' : 'transparent',
                  '&:hover': { bgcolor: 'primary.light' }
                }}
              >
                <Layers fontSize="small" />
              </IconButton>
            </Tooltip>
          ))}
        </Box>
        </Box>

        <MapContainer
          center={userLocation || [32.073, 34.789]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
          zoomControl
          whenReady={() => {
            if (mapRef.current) {
              mapRef.current.invalidateSize();
            }
          }}
          ref={mapRef}
        >
          <MapStyleController 
            currentStyle={currentMapStyle} 
            onStyleChange={handleStyleChange} 
          />

          {/* Dynamic Tile Layer */}
          <TileLayer
            attribution={mapStyles[currentMapStyle as keyof typeof mapStyles].attribution}
            url={mapStyles[currentMapStyle as keyof typeof mapStyles].url}
          />

          {/* User Location Marker */}
          {userLocation && (
            <Marker position={userLocation} icon={myLocationIcon}>
              <Popup>Your location</Popup>
            </Marker>
          )}

          {/* Regular Markers - Only show filtered spots */}
          {filteredSpots.map((spot) => (
            <Marker
              key={spot._id}
              position={[spot.location.coordinates[1], spot.location.coordinates[0]]}
              icon={createCustomIcon(spot.isPark, spot.size, spot.level)}
            >
              <Popup>
                <RichPopup spot={spot} onViewDetails={handleViewDetails} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        </Box>
      </Box>

      {/* Skatepark Modal - Rendered outside map container */}
      {selectedSpot && (
        <SkateparkModal
          open={!!selectedSpot}
          onClose={() => setSelectedSpot(null)}
          _id={selectedSpot._id}
          title={selectedSpot.title}
          description={selectedSpot.description}
          photoNames={selectedSpot.photoNames || []}
          isPark={selectedSpot.isPark}
          size={selectedSpot.size}
          level={selectedSpot.level}
          tags={selectedSpot.tags}
          coordinates={{
            lat: selectedSpot.location.coordinates[1],
            lng: selectedSpot.location.coordinates[0]
          }}
          externalLinks={selectedSpot.externalLinks}
        />
      )}
    </>
  );
}
