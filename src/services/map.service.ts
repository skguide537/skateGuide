// Map service for handling map-related logic and utilities
import L from 'leaflet';

export interface MapStyle {
  name: string;
  url: string;
  attribution: string;
}

export interface MapLocation {
  lat: number;
  lng: number;
}

import { SkateparkBasic, SkateparkDetailed } from '@/types/skatepark';

export class MapService {
  // Map style definitions
  static readonly MAP_STYLES: Record<string, MapStyle> = {
    street: {
      name: 'Street',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    },
    satellite: {
      name: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
    },
    terrain: {
      name: 'Terrain',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>'
    },
    dark: {
      name: 'Dark',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  };

  // Calculate distance between two points using Haversine formula
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Create custom icon for different spot types
  static createCustomIcon(isPark: boolean, size: string, levels: string[]): L.DivIcon {
    const baseSize = [30, 30];
    const iconColor = isPark ? '#4CAF50' : '#FF9800'; // Green for parks, Orange for street
    
    // Get the first valid level, or default to 'beginner'
    const level = levels && levels.length > 0 && levels[0] !== null && levels[0] !== undefined ? levels[0] : 'beginner';
    
    // Create a custom SVG icon
    const svgIcon = `
      <svg width="${baseSize[0]}" height="${baseSize[1]}" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="12" fill="${iconColor}" stroke="white" stroke-width="2"/>
        <text x="15" y="18" text-anchor="middle" fill="white" font-size="10" font-weight="bold">
          ${isPark ? 'P' : 'S'}
        </text>
      </svg>
    `;

    return L.divIcon({
      html: svgIcon,
      className: 'custom-marker-icon',
      iconSize: [baseSize[0], baseSize[1]],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
  }

  // Get my location icon
  static getMyLocationIcon(): L.Icon {
    return L.icon({
      iconUrl: '/marker-my-location.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowUrl: '/marker-shadow.png',
      shadowSize: [41, 41],
    });
  }

  // Fly to location on map
  static flyToLocation(map: L.Map, lat: number, lng: number, zoom: number = 16): void {
    if (map) {
      map.flyTo([lat, lng], zoom, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }

  // Get map center from user location or default
  static getMapCenter(userLocation: [number, number] | null): [number, number] {
    if (userLocation) {
      return userLocation;
    }
    // Default to a central location (you can adjust this)
    return [32.0853, 34.7818]; // Tel Aviv, Israel
  }

  // Get default zoom level
  static getDefaultZoom(): number {
    return 10;
  }

  // Format distance for display
  static formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)}km away`;
    } else {
      return `${Math.round(distance)}km away`;
    }
  }

  // Check if a location is within bounds
  static isLocationInBounds(lat: number, lng: number, bounds: L.LatLngBounds): boolean {
    return bounds.contains([lat, lng]);
  }

  // Get bounds for a set of locations
  static getBoundsForLocations(locations: MapLocation[]): L.LatLngBounds | null {
    if (locations.length === 0) return null;
    
    const lats = locations.map(loc => loc.lat);
    const lngs = locations.map(loc => loc.lng);
    
    return L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
  }

  // Fit map to show all markers
  static fitMapToMarkers(map: L.Map, locations: MapLocation[]): void {
    if (locations.length === 0) return;
    
    const bounds = this.getBoundsForLocations(locations);
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }

  // Get unique values for filter options
  static getUniqueSizes(skateparks: SkateparkBasic[]): string[] {
    const sizes = new Set<string>();
    skateparks.forEach(spot => {
      if (spot.size) {
        sizes.add(spot.size);
      }
    });
    return Array.from(sizes).sort();
  }

  static getUniqueLevels(skateparks: SkateparkBasic[]): string[] {
    const levels = new Set<string>();
    skateparks.forEach(spot => {
      if (spot.levels) {
        spot.levels.forEach(level => {
          if (level && level !== null && level !== undefined) {
            levels.add(level);
          }
        });
      }
    });
    return Array.from(levels).sort();
  }

  static getUniqueTags(skateparks: SkateparkBasic[]): string[] {
    const tags = new Set<string>();
    skateparks.forEach(spot => {
      spot.tags.forEach(tag => {
        if (tag) {
          tags.add(tag);
        }
      });
    });
    return Array.from(tags).sort();
  }
}
