'use client';

import Loading from '@/components/loading/Loading';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import the Map component with no SSR
const Map = dynamic(() => import('@/components/map/Map'), {
  ssr: false,
  loading: () => <Loading />

});

export default function MapPage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          setError('Unable to retrieve your location');
          console.error('Error getting location:', error);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main className="h-screen w-full">
      {error ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <Map userLocation={userLocation} />
      )}
    </main>
  );
} 