// Geocoding service for handling address searches and coordinate validation

import { logger } from '@/utils/logger';

export interface GeocodingResult {
    lat: number;
    lng: number;
    displayName?: string;
}

export interface AddressField {
    street: string;
    city: string;
    state: string;
    country: string;
}

export class GeocodingService {
    // Validate coordinates are within reasonable bounds
    static validateCoordinates(lat: number, lng: number): boolean {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return false;
        }
        // Check if coordinates are not exactly 0,0 (which is often an error)
        if (lat === 0 && lng === 0) {
            return false;
        }
        return true;
    }

    // Create shorter, more readable addresses for display
    static createShortAddress(fullAddress: string): string {
        if (!fullAddress) return 'Unknown location';
        
        // Split by commas and take the first 2-3 meaningful parts
        const parts = fullAddress.split(',').map(part => part.trim()).filter(part => part.length > 0);
        
        if (parts.length <= 2) return fullAddress;
        
        // Take first 2-3 parts, but avoid very short parts like postal codes
        const meaningfulParts = parts.filter(part => part.length > 2);
        const shortParts = meaningfulParts.slice(0, 3);
        
        return shortParts.join(', ');
    }

    // Search for an address and return coordinates
    static async searchAddress(
        fullAddress: string, 
        structuredAddress: AddressField
    ): Promise<GeocodingResult | null> {
        // Check if we have a full address or structured address
        const hasFullAddress = fullAddress.trim();
        const hasStructuredAddress = structuredAddress.street.trim() && structuredAddress.city.trim();
        
        if (!hasFullAddress && !hasStructuredAddress) {
            throw new Error('Please enter either a full address or at least street and city');
        }

        // Build the search query - prioritize full address if available
        let searchQuery = '';
        if (hasFullAddress) {
            searchQuery = fullAddress;
        } else {
            searchQuery = [
                structuredAddress.street, 
                structuredAddress.city, 
                structuredAddress.state, 
                structuredAddress.country
            ]
            .filter(part => part.trim())
            .join(', ');
        }
        
        // Use our backend geocoding API
        const response = await fetch(
            `/api/geocoding/search?type=address&q=${encodeURIComponent(searchQuery)}&limit=1`
        );
        
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Too many requests. Please wait a moment and try again.');
            } else if (response.status === 503) {
                throw new Error('Geocoding service temporarily unavailable. Please try again later.');
            } else {
                throw new Error('Geocoding service unavailable');
            }
        }
        
        const data = await response.json();
        
        if (data && data.lat && data.lng) {
            return {
                lat: data.lat,
                lng: data.lng,
                displayName: data.displayName || searchQuery
            };
        } else {
            throw new Error('Address not found. Please try a different address or use the map.');
        }
    }

    // Get user's current location using GPS
    static async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
        return new Promise((resolve, reject) => {
            if (!("geolocation" in navigator)) {
                reject(new Error("Geolocation is not supported in your browser"));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    
                    if (this.validateCoordinates(lat, lng)) {
                        resolve({ lat, lng });
                    } else {
                        reject(new Error('Invalid coordinates received'));
                    }
                },
                (err) => {
                    logger.error('Geolocation error', err as unknown as Error, { component: 'GeocodingService' });
                    reject(new Error("Unable to get location"));
                }
            );
        });
    }

    // Search for street suggestions
    static async searchStreetSuggestions(query: string): Promise<string[]> {
        if (query.length < 2) return [];
        
        try {
            const response = await fetch(
                `/api/geocoding/search?type=street&q=${encodeURIComponent(query)}&limit=5`
            );
            
            if (response.ok) {
                const data = await response.json();
                return Array.isArray(data) ? data : [];
            } else {
                logger.warn('Street autocomplete error', { component: 'GeocodingService', status: response.status });
                return [];
            }
        } catch (error) {
            logger.error('Street autocomplete error', error as Error, { component: 'GeocodingService' });
            return [];
        }
    }

    // Search for city suggestions
    static async searchCitySuggestions(query: string): Promise<string[]> {
        if (query.length < 2) return [];
        
        try {
            const response = await fetch(
                `/api/geocoding/search?type=city&q=${encodeURIComponent(query)}&limit=5`
            );
            
            if (response.ok) {
                const data = await response.json();
                return Array.isArray(data) ? data : [];
            } else {
                logger.warn('City autocomplete error', { component: 'GeocodingService', status: response.status });
                return [];
            }
        } catch (error) {
            logger.error('City autocomplete error', error as Error, { component: 'GeocodingService' });
            return [];
        }
    }

    // Search for country suggestions
    static async searchCountrySuggestions(query: string): Promise<string[]> {
        if (query.length < 2) return [];
        
        try {
            const response = await fetch(
                `/api/geocoding/search?type=country&q=${encodeURIComponent(query)}&limit=5`
            );
            
            if (response.ok) {
                const data = await response.json();
                return Array.isArray(data) ? data : [];
            } else {
                logger.warn('Country autocomplete error', { component: 'GeocodingService', status: response.status });
                return [];
            }
        } catch (error) {
            logger.error('Country autocomplete error', error as Error, { component: 'GeocodingService' });
            return [];
        }
    }
}
