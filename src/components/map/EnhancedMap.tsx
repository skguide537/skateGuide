'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef } from 'react';
import { Map } from 'leaflet';
import { Box, IconButton, Tooltip, Chip, Rating, Typography, Button } from '@mui/material';
import { Layers } from '@mui/icons-material';
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



        {/* Regular Markers */}
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
