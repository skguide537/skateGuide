// Map style controller component for EnhancedMap
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapStyleControllerProps {
  currentStyle: string;
  onStyleChange: (style: string) => void;
}

export default function MapStyleController({ currentStyle, onStyleChange }: MapStyleControllerProps) {
  const map = useMap();
  
  useEffect(() => {
    // Force map refresh when style changes
    map.invalidateSize();
  }, [currentStyle, map]);

  return null;
}
