'use client';

import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';

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

export default function AddSpotMap({
  coords,
  setCoords
}: {
  coords: { lat: number; lng: number } | null;
  setCoords: (coords: { lat: number; lng: number }) => void;
}) {
  useEffect(() => {
    // Customize default Leaflet icon
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: '/marker-icon.png',
      shadowUrl: '/marker-shadow.png'
    });
  }, []);

  return (
    <MapContainer center={[32.073, 34.789]} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <RecenterMap coords={coords} />

      <LocationPicker onSelect={setCoords} />

      {coords && <Marker position={[coords.lat, coords.lng]} />}
    </MapContainer>
  );
}
