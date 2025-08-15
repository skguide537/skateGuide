'use client';

import Loading from '@/components/loading/Loading';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

// Dynamically import the EnhancedMap component with no SSR
const EnhancedMap = dynamic(() => import('@/components/map/EnhancedMap'), {
  ssr: false,
  loading: () => <Loading />
});

export default function MapPage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      ) : userLocation ? (
        <EnhancedMap userLocation={userLocation} />
      ) : (
        <Loading />
      )}
    </main>
  );
}
