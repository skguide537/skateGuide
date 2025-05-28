'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef } from 'react';
import { Spot } from '@/types/spot';
import { Map } from 'leaflet';

// Fix for default marker icons in Next.js
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

// TODO: Replace with actual database connection
// Temporary mock data until database is set up
const mockSpots: Spot[] = [
    {
        _id: '1',
        name: 'Central Park Skate Spot',
        description: 'Great spot with smooth concrete and plenty of space',
        type: 'Park',
        location: {
            type: 'Point',
            coordinates: [-73.968285, 40.785091]
        }
    },
    {
        _id: '2',
        name: 'Downtown Plaza',
        description: 'Popular spot with stairs and ledges',
        type: 'Plaza',
        location: {
            type: 'Point',
            coordinates: [-73.985130, 40.758896]
        }
    }
];

export default function MapComponent({ userLocation }: MapProps) {
    const [spots, setSpots] = useState<Spot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mapRef = useRef<Map | null>(null);

    useEffect(() => {
        // TODO: Replace with actual API call when database is set up
        // For now, using mock data
        const fetchSpots = async () => {
            try {
                // TODO: Uncomment and implement actual API call when database is ready
                // const response = await fetch('/api/spots');
                // if (!response.ok) {
                //   throw new Error('Failed to fetch spots');
                // }
                // const data = await response.json();
                // setSpots(data);

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                setSpots(mockSpots);
            } catch (error) {
                console.error('Error fetching spots:', error);
                setError('Failed to load skate spots. Using mock data instead.');
                setSpots(mockSpots); // Fallback to mock data
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
        <div id="map-wrapper" style={{ height: '100vh', width: '100vw' }}>
            <MapContainer
                center={userLocation || [40.785091, -73.968285]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
                scrollWheelZoom={true}
                whenReady={() => {
                    if (mapRef.current) {
                        mapRef.current.invalidateSize();
                    }
                }}
                ref={mapRef}
            >


                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User location marker */}
                {userLocation && (
                    <Marker position={[userLocation[0], userLocation[1]]} icon={icon}>
                        <Popup>Your location</Popup>
                    </Marker>
                )}

                {/* Loading state */}
                {isLoading && (
                    <div className="absolute top-4 left-4 z-[1000] bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                        Loading spots...
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="absolute top-4 left-4 z-[1000] bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {/* Skate spots markers */}
                {spots.map((spot) => (
                    <Marker
                        key={spot._id}
                        position={[spot.location.coordinates[1], spot.location.coordinates[0]]}
                        icon={icon}
                    >
                        <Popup>
                            <div>
                                <h3 className="font-bold">{spot.name}</h3>
                                <p>{spot.description}</p>
                                <p className="text-sm text-gray-500">Type: {spot.type}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
} 