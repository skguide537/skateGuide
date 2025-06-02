'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

export function LocationPicker({ onSelect }: { onSelect: (coords: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    }
  });
  return null;
}

export default function AddSpotMap({
  coords,
  setCoords
}: {
  coords: { lat: number; lng: number } | null;
  setCoords: (coords: { lat: number; lng: number }) => void;
}) {
  useEffect(() => {
    (async () => {
      const L = await import('leaflet');
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: '/marker-icon.png',
        shadowUrl: '/marker-shadow.png'
      });
    })();
  }, []);

  return (
    <MapContainer center={[32.073, 34.789]} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationPicker onSelect={setCoords} />
      {coords && <Marker position={[coords.lat, coords.lng]} />}
    </MapContainer>
  );
}
