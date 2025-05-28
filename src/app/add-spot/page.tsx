'use client';

import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef } from 'react';
import { Map } from 'leaflet';
import { Box } from '@mui/material';
import { useToast } from '@/context/ToastContext';
import SkateparkModal from '@/components/modals/SkateparkModal';

const icon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
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
  photoName: string[];
  isPark: boolean;
  size: string;
  level: string;
  tags: string[];
  externalLinks?: {
    url: string;
    sentBy: { id: string; name: string };
    sentAt: string;
  }[];
}

export default function MapComponent({ userLocation }: MapProps) {
  const [spots, setSpots] = useState<Skatepark[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Skatepark | null>(null);
  const mapRef = useRef<Map | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const res = await fetch('/api/skateparks');
        if (!res.ok) throw new Error('Failed to fetch skateparks');
        const data = await res.json();
        setSpots(data);
      } catch (err: any) {
        showToast(err.message || 'Unable to load skateparks', 'error');
      }
    };

    fetchSpots();
  }, [showToast]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, [userLocation]);

  return (
    <Box mt={4} mx="auto" width="80%" height="60vh" borderRadius={2} boxShadow={3} overflow="hidden" maxWidth={1200}>
      <MapContainer
        center={userLocation || [32.073, 34.789]}
        zoom={13}
        scrollWheelZoom
        zoomControl
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        whenReady={() => {
          if (mapRef.current) mapRef.current.invalidateSize();
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && <Marker position={userLocation} icon={icon} />}

        {spots.map((spot) => (
          <Marker
            key={spot._id}
            position={[spot.location.coordinates[1], spot.location.coordinates[0]]}
            icon={icon}
            eventHandlers={{
              click: () => setSelectedSpot(spot)
            }}
          />
        ))}
      </MapContainer>

      {selectedSpot && (
        <SkateparkModal
          open
          onClose={() => setSelectedSpot(null)}
          _id={selectedSpot._id}
          title={selectedSpot.title}
          description={selectedSpot.description}
          photoNames={selectedSpot.photoName}
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
