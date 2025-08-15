'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { MarkerClusterGroup } from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Map } from 'leaflet';
import { Box, IconButton, Tooltip, Chip, Rating, Typography, Button, Collapse } from '@mui/material';
import { Layers, MyLocation, Info, ExpandMore, ExpandLess } from '@mui/icons-material';
import SkateparkModal from '../modals/SkateparkModal';
import { weatherService, WeatherData, SkatingConditions } from '../../services/weather.service';

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
    iconSize: baseSize,
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
  photoName: string[];
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
  const [showDistanceCircles, setShowDistanceCircles] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [skatingConditions, setSkatingConditions] = useState<SkatingConditions | null>(null);
  const [showWeatherDetails, setShowWeatherDetails] = useState(false);
  const mapRef = useRef<Map | null>(null);

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

  // Fetch weather data when user location changes
  useEffect(() => {
    if (userLocation) {
      fetchWeatherData(userLocation);
    }
  }, [userLocation]);

  // Force map refresh when user location changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, [userLocation]);

  // Fetch weather data using the weather service
  const fetchWeatherData = async (location: [number, number]) => {
    try {
      const weather = await weatherService.getWeatherData(location[0], location[1]);
      setWeatherData(weather);
      
      // Get skating recommendations
      const conditions = weatherService.getSkatingRecommendations(weather);
      setSkatingConditions(conditions);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter spots by distance
  const getNearbySpots = (radius: number) => {
    if (!userLocation) return [];
    return spots.filter(spot => {
      const distance = calculateDistance(
        userLocation[0], userLocation[1],
        spot.location.coordinates[1], spot.location.coordinates[0]
      );
      return distance <= radius;
    });
  };

  const handleStyleChange = (style: string) => {
    setCurrentMapStyle(style);
  };

  const handleViewDetails = (spot: Skatepark) => {
    setSelectedSpot(spot);
  };

  if (isLoading) {
    return <div>Loading map...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Box
      mt={4}
      mx="auto"
      width="80%"
      height="70vh"
      borderRadius={2}
      boxShadow={3}
      overflow="hidden"
      maxWidth={1200}
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
          
          {/* Distance Circles Toggle */}
          {userLocation && (
            <Tooltip title={showDistanceCircles ? 'Hide distance circles' : 'Show distance circles'}>
              <IconButton
                size="small"
                onClick={() => setShowDistanceCircles(!showDistanceCircles)}
                color={showDistanceCircles ? 'primary' : 'default'}
                sx={{ 
                  bgcolor: showDistanceCircles ? 'primary.light' : 'transparent',
                  '&:hover': { bgcolor: 'primary.light' }
                }}
              >
                <MyLocation fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Enhanced Weather Info */}
      {weatherData && (
        <Box
          position="absolute"
          top={10}
          left={10}
          zIndex={1000}
          bgcolor="white"
          borderRadius={1}
          boxShadow={2}
          p={2}
          minWidth="280px"
          maxWidth="320px"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" fontWeight="bold">
              Skating Conditions
            </Typography>
            <IconButton
              size="small"
              onClick={() => setShowWeatherDetails(!showWeatherDetails)}
            >
              {showWeatherDetails ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Typography variant="h6" color="primary">
              {weatherData.temperature}°C
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {weatherData.condition}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="body2">Skating Score:</Typography>
            <Rating value={weatherData.skatingScore} readOnly size="small" max={10} />
            <Typography variant="body2" color="text.secondary">
              ({weatherData.skatingScore}/10)
            </Typography>
          </Box>
          
          <Collapse in={showWeatherDetails}>
            <Box mt={1} pt={1} borderTop="1px solid #eee">
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">Wind:</Typography>
                <Typography variant="body2">{weatherData.windSpeed} km/h</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">Humidity:</Typography>
                <Typography variant="body2">{weatherData.humidity}%</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">UV Index:</Typography>
                <Typography variant="body2">{weatherData.uvIndex}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Precipitation:</Typography>
                <Typography variant="body2">{weatherData.precipitation}%</Typography>
              </Box>
              
              {skatingConditions && (
                <Box mt={1}>
                  <Typography 
                    variant="body2" 
                    color={skatingConditions.isGoodForSkating ? 'success.main' : 'warning.main'}
                    fontWeight="bold"
                  >
                    {skatingConditions.reason}
                  </Typography>
                  {skatingConditions.recommendations.slice(0, 2).map((rec, index) => (
                    <Typography key={index} variant="caption" color="text.secondary" display="block">
                      • {rec}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </Collapse>
        </Box>
      )}

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

        {/* Distance Circles */}
        {userLocation && showDistanceCircles && (
          <>
            <Circle
              center={userLocation}
              radius={1000}
              pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
            >
              <Popup>1km radius</Popup>
            </Circle>
            <Circle
              center={userLocation}
              radius={3000}
              pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.1 }}
            >
              <Popup>3km radius</Popup>
            </Circle>
            <Circle
              center={userLocation}
              radius={5000}
              pathOptions={{ color: 'orange', fillColor: 'orange', fillOpacity: 0.1 }}
            >
              <Popup>5km radius</Popup>
            </Circle>
          </>
        )}

        {/* Clustered Markers */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
        >
          {spots.map((spot) => (
            <Marker
              key={spot._id}
              position={[spot.location.coordinates[1], spot.location.coordinates[0]]}
              icon={createCustomIcon(spot.isPark, spot.size, spot.level)}
              eventHandlers={{
                click: () => handleViewDetails(spot),
              }}
            >
              <Popup>
                <RichPopup spot={spot} onViewDetails={handleViewDetails} />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Skatepark Modal */}
      {selectedSpot && (
        <SkateparkModal
          open={!!selectedSpot}
          onClose={() => setSelectedSpot(null)}
          _id={selectedSpot._id}
          title={selectedSpot.title}
          description={selectedSpot.description}
          photoNames={selectedSpot.photoName || []}
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
    </Box>
  );
}
