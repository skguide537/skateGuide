'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Map } from 'leaflet';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useCache } from '@/context/ToastContext';
import { skateparkClient } from '@/services/skateparkClient';
import SkateparkModal from '../modals/SkateparkModal';


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

const myLocationIcon = L.icon({
  iconUrl: '/marker-my-location.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowUrl: '/marker-shadow.png',
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
    photoNames: string[];
    isPark: boolean;
    size: string;
    levels: string[];
    tags: string[];
    avgRating: number;
    externalLinks?: {
        url: string;
        sentBy: { id: string; name: string };
        sentAt: string;
    }[];
}

export default function MapComponent({ userLocation }: MapProps) {
    const [spots, setSpots] = useState<Skatepark[]>([]);
    const [selectedSpot, setSelectedSpot] = useState<Skatepark | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mapRef = useRef<Map | null>(null);

    // Calculate distance between two coordinates using Haversine formula
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };


    useEffect(() => {
        const fetchSpots = async () => {
            try {
                const data = await skateparkClient.getAllSkateparks();
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

    // Subscribe to cache invalidation events to refresh data when spots are added/deleted
    // Remove useCache call - it's causing infinite loops
    // useCache('skateparks', useCallback(() => {
    //     const fetchSpots = async () => {
    //         try {
    //             const response = await fetch('/api/skateparks');
    //             if (!response.ok) throw new Error('Failed to fetch skateparks');
    //             const data = await response.json();
    //             setSpots(data);
    //         } catch (err) {
    //             console.error('Error refreshing spots:', err);
    //         }
    //     };

    //     fetchSpots();
    // }, []));

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
                    <Marker position={userLocation} icon={myLocationIcon}>
                        <Popup>Your location</Popup>
                    </Marker>
                )}

                {spots.map((spot) => (
                    <Marker
                        key={spot._id}
                        position={[spot.location.coordinates[1], spot.location.coordinates[0]]}
                        icon={icon}
                        eventHandlers={{
                            click: () => setSelectedSpot(spot),
                        }}
                    >
                        <Popup>
                            <strong>{spot.title}</strong>
                            <br />
                            {spot.description}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
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
                    levels={selectedSpot.levels ? selectedSpot.levels.filter(level => level !== null && level !== undefined) : []}
                    tags={selectedSpot.tags}
                    coordinates={{
                        lat: selectedSpot.location.coordinates[1],
                        lng: selectedSpot.location.coordinates[0]
                    }}
                    externalLinks={selectedSpot.externalLinks}
                    distanceKm={userLocation ? calculateDistance(
                        userLocation[0], userLocation[1],
                        selectedSpot.location.coordinates[1], selectedSpot.location.coordinates[0]
                    ) : undefined}
                />
            )}
        </Box>


    );
}
