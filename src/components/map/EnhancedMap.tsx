'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef, useMemo } from 'react';
import { Map } from 'leaflet';
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
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter spots based on search and filters
  const filteredSpots = useMemo(() => {
    let filtered = spots.filter(spot => {
      // Search filter - expanded to include more location-based search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          spot.title.toLowerCase().includes(searchLower) ||
          spot.description.toLowerCase().includes(searchLower) ||
          spot.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          // Add location-based search (you might need to add address fields to your Skatepark model)
          (spot.title + ' ' + spot.description).toLowerCase().includes(searchLower);
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

      // Tag filter
      if (tagFilter.length > 0) {
        const hasMatchingTag = tagFilter.some(tag => spot.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Distance filter (only if enabled and user location is available)
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

    // Sort by distance if user location is available (shortest to longest)
    if (userLocation) {
      filtered = filtered.sort((a, b) => {
        const distanceA = calculateDistance(
          userLocation[0], userLocation[1],
          a.location.coordinates[1], a.location.coordinates[0]
        );
        const distanceB = calculateDistance(
          userLocation[0], userLocation[1],
          b.location.coordinates[1], b.location.coordinates[0]
        );
        return distanceA - distanceB;
      });
    }

    return filtered;
  }, [spots, searchTerm, typeFilter, sizeFilter, levelFilter, tagFilter, distanceFilterEnabled, distanceFilter, ratingFilter, userLocation]);

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
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: '#f8f9fa' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Skate Spots
          </Typography>
          {isMobile && (
            <IconButton onClick={() => setSidebarOpen(false)}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search spots, tags, locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        {/* Filter Toggle */}
        <Button
          startIcon={<FilterList />}
          endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
          onClick={() => setShowFilters(!showFilters)}
          variant="outlined"
          fullWidth
        >
          Filters ({filteredSpots.length} spots)
        </Button>
      </Box>

      {/* Filters */}
      <Collapse in={showFilters}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: '#f8f9fa' }}>
          {/* Type Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value as any)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="park">Parks</MenuItem>
              <MenuItem value="street">Street Spots</MenuItem>
            </Select>
          </FormControl>

          {/* Size Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Size</InputLabel>
            <Select
              multiple
              value={sizeFilter}
              label="Size"
              displayEmpty
              onChange={(e) => setSizeFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
            >
              {allSizes.map(size => (
                <MenuItem key={size} value={size}>{size}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Level Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Level</InputLabel>
            <Select
              multiple
              value={levelFilter}
              label="Level"
              displayEmpty
              onChange={(e) => setLevelFilter(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
            >
              {allLevels.map(level => (
                <MenuItem key={level} value={level}>{level}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Distance Filter */}
          {userLocation && (
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={distanceFilterEnabled}
                    onChange={(e) => setDistanceFilterEnabled(e.target.checked)}
                  />
                }
                label="Filter by distance"
              />
              {distanceFilterEnabled && (
                <Box sx={{ mt: 1 }}>
                  <Typography gutterBottom>Distance: {distanceFilter}km</Typography>
                  <Slider
                    value={distanceFilter}
                    onChange={(_, newValue) => setDistanceFilter(newValue as number)}
                    min={1}
                    max={50}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}km`}
                  />
                </Box>
              )}
            </Box>
          )}

          {/* Rating Filter */}
          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>Rating: {ratingFilter[0]} - {ratingFilter[1]} stars</Typography>
            <Slider
              value={ratingFilter}
              onChange={(_, newValue) => setRatingFilter(newValue as number[])}
              min={0}
              max={5}
              step={0.5}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}★`}
            />
          </Box>
        </Box>
      </Collapse>

      {/* Results */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Typography variant="subtitle2" sx={{ p: 2, color: 'text.secondary' }}>
          {filteredSpots.length} spots found
        </Typography>
        
        <List sx={{ p: 0 }}>
          {filteredSpots.map((spot, index) => (
            <Box key={spot._id}>
              <ListItem sx={{ p: 0 }}>
                <Card 
                  sx={{ 
                    width: '100%', 
                    cursor: 'pointer',
                    '&:hover': { elevation: 4 }
                  }}
                  onClick={() => handleSpotClick(spot)}
                >
                  <Box sx={{ display: 'flex' }}>
                    <CardMedia
                      component="img"
                      sx={{ width: 120, height: 80 }}
                      image={spot.photoNames && spot.photoNames[0] 
                        ? (spot.photoNames[0].startsWith('http') ? spot.photoNames[0] : `/${spot.photoNames[0]}`)
                        : "https://res.cloudinary.com/dcncqacrd/image/upload/v1747566727/skateparks/default-skatepark.png"
                      }
                      alt={spot.title}
                    />
                    <CardContent sx={{ flex: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="subtitle2" fontWeight="bold" noWrap>
                        {spot.title}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                        <Chip 
                          label={spot.isPark ? 'Park' : 'Street'} 
                          size="small"
                          color={spot.isPark ? 'success' : 'warning'}
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
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
                          <Typography variant="caption" color="text.secondary">
                            ({spot.avgRating.toFixed(1)})
                          </Typography>
                        </Box>
                      )}
                      {userLocation && (
                        <Typography variant="caption" color="text.secondary">
                          {calculateDistance(
                            userLocation[0], userLocation[1],
                            spot.location.coordinates[1], spot.location.coordinates[0]
                          ).toFixed(1)}km away
                        </Typography>
                      )}
                      
                      {/* Admin Delete Button */}
                      {/* Removed admin delete button */}
                    </CardContent>
                  </Box>
                </Card>
              </ListItem>
              {index < filteredSpots.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
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
