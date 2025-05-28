'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef } from 'react';
import { Map } from 'leaflet';
import { Box } from '@mui/material';

const icon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

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
}

export default function MapComponent({ userLocation }: MapProps) {
  const [spots, setSpots] = useState<Skatepark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<Map | null>(null);

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

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, [userLocation]);

  return (
    <Box
      mt={4}
      mx="auto"
      width="80%"
      height="60vh"
      borderRadius={2}
      boxShadow={3}
      overflow="hidden"
      maxWidth={1200}
    >
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
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <Marker position={userLocation} icon={icon}>
            <Popup>Your location</Popup>
          </Marker>
        )}

        {spots.map((spot) => (
          <Marker
            key={spot._id}
            position={[spot.location.coordinates[1], spot.location.coordinates[0]]}
            icon={icon}
          >
            <Popup>
              <strong>{spot.title}</strong>
              <br />
              {spot.description}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}
