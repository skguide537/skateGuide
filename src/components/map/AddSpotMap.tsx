'use client';

import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import { Box, ToggleButton, ToggleButtonGroup, Typography, Fab, Tooltip } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import SatelliteIcon from '@mui/icons-material/Satellite';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { logger } from '@/utils/logger';

// 🎯 Custom hook to recenter map when coords change
function RecenterMap({ coords }: { coords: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView([coords.lat, coords.lng], 16); // zoom in close
    }
  }, [coords, map]);
  return null;
}

// 📍 Component to allow clicking on the map to select a location
export function LocationPicker({ onSelect }: { onSelect: (coords: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    }
  });
  return null;
}

// 🎯 Component to center map on user's current location
function CenterOnLocation() {
  const map = useMap();
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const centerOnMyLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const location = { lat, lng };
          
          setMyLocation(location);
          map.setView([lat, lng], 16);
        },
        (err) => {
          logger.error('Error getting location', err as unknown as Error, { component: 'AddSpotMap' });
        }
      );
    }
  };

  return (
    <>
      {/* Current location marker */}
      {myLocation && (
        <Marker 
          position={[myLocation.lat, myLocation.lng]}
          icon={L.divIcon({
            className: 'my-location-marker',
            html: `
              <div style="
                width: 20px; 
                height: 20px; 
                background: #2196F3; 
                border: 3px solid #fff; 
                border-radius: 50%; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                position: relative;
              ">
                <div style="
                  width: 8px; 
                  height: 8px; 
                  background: #fff; 
                  border-radius: 50%; 
                  position: absolute; 
                  top: 50%; 
                  left: 50%; 
                  transform: translate(-50%, -50%);
                "></div>
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })}
        />
      )}
      
      {/* Centering button */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <Tooltip title="Center on my location" placement="left">
          <Fab
            size="medium"
            color="primary"
            onClick={centerOnMyLocation}
            sx={{
              backgroundColor: '#A7A9AC',
              '&:hover': {
                backgroundColor: '#8A8A8A',
              },
              boxShadow: 3,
            }}
          >
            <MyLocationIcon />
          </Fab>
        </Tooltip>
      </Box>
    </>
  );
}

// 🗺️ Map Style Controller Component
function MapStyleController({ onStyleChange }: { onStyleChange: (style: string) => void }) {
  const [mapStyle, setMapStyle] = useState('street');

  const handleStyleChange = (event: React.MouseEvent<HTMLElement>, newStyle: string | null) => {
    if (newStyle !== null) {
      setMapStyle(newStyle);
      onStyleChange(newStyle);
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 2,
        padding: 1,
        boxShadow: 2,
      }}
    >
      <ToggleButtonGroup
        value={mapStyle}
        exclusive
        onChange={handleStyleChange}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            px: 2,
            py: 1,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#2F2F2F',
            border: '1px solid #A7A9AC',
            '&.Mui-selected': {
              backgroundColor: '#A7A9AC',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#8A8A8A',
              },
            },
            '&:hover': {
              backgroundColor: 'rgba(167, 169, 172, 0.1)',
            },
          },
        }}
      >
        <ToggleButton value="street">
          <MapIcon sx={{ fontSize: 16, mr: 0.5 }} />
          Street
        </ToggleButton>
        <ToggleButton value="satellite">
          <SatelliteIcon sx={{ fontSize: 16, mr: 0.5 }} />
          Satellite
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}

export default function AddSpotMap({
  coords,
  setCoords,
  onMapClick
}: {
  coords: { lat: number; lng: number } | null;
  setCoords: (coords: { lat: number; lng: number }) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}) {
  const [currentMapStyle, setCurrentMapStyle] = useState('street');

  useEffect(() => {
    // Customize default Leaflet icon
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: '/marker-icon.png',
      shadowUrl: '/marker-shadow.png'
    });
  }, []);

  const handleMapStyleChange = (style: string) => {
    setCurrentMapStyle(style);
  };

  const getTileLayerUrl = () => {
    switch (currentMapStyle) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'street':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getTileLayerAttribution = () => {
    switch (currentMapStyle) {
      case 'satellite':
        return '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
      case 'street':
      default:
        return '&copy; OpenStreetMap contributors';
    }
  };

  return (
    <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer center={[32.073, 34.789]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution={getTileLayerAttribution()}
          url={getTileLayerUrl()}
        />

        <RecenterMap coords={coords} />

        <LocationPicker onSelect={onMapClick || setCoords} />

        {coords && <Marker position={[coords.lat, coords.lng]} />}
        
        {/* Center on location button - must be inside MapContainer to use useMap */}
        <CenterOnLocation />
      </MapContainer>
      
      <MapStyleController onStyleChange={handleMapStyleChange} />
    </Box>
  );
}
