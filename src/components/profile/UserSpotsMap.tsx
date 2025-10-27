'use client';

import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box } from '@mui/material';

// Fix default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

interface UserSpotsMapProps {
  spots: any[];
  onMarkerClick?: (spot: any) => void;
}

export default function UserSpotsMap({ spots, onMarkerClick }: UserSpotsMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Fit bounds when spots change
  useEffect(() => {
    if (mapRef.current && spots.length > 0) {
      const latLngs = spots.map(spot => 
        L.latLng(spot.location.coordinates[1], spot.location.coordinates[0])
      );
      const bounds = L.latLngBounds(latLngs);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [spots]);

  // Handler for when the map is ready - get the map instance
  const handleMapReady = (e: any) => {
    mapRef.current = e.target;
  };

  // Initial center: use first spot if available, otherwise default
  const initialCenter: L.LatLngExpression = spots.length > 0 
    ? [spots[0].location.coordinates[1], spots[0].location.coordinates[0]]
    : [32.0853, 34.7818]; // Default to Tel Aviv area
  const initialZoom = spots.length > 0 ? 13 : 11;

  return (
    <Box sx={{ height: 400, width: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        whenReady={handleMapReady as any}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {spots.map((spot) => (
          <Marker key={spot._id} position={[spot.location.coordinates[1], spot.location.coordinates[0]]}>
            <Popup>
              <Box sx={{ cursor: 'pointer' }} onClick={() => onMarkerClick?.(spot)}>
                {spot.title}
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}


