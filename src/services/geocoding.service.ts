// Geocoding service for handling address searches and coordinate validation
import { geocodingClient } from './geocodingClient';
import { logger } from '@/lib/logger';
import { filterCountries } from '@/constants/countries';

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
        console.log('🔍 [GeocodingService] Searching address:', searchQuery);
        const results = await geocodingClient.searchAddress(searchQuery, 1);
        console.log('📄 [GeocodingService] Address search results:', results);
        
        if (results.length === 0) {
            console.error('❌ [GeocodingService] No results found for address:', searchQuery);
            throw new Error('No results found for this address');
        }
        
        const result = results[0];
        console.log('📋 [GeocodingService] Using first result:', result);
        
        if (result && result.lat && result.lng) {
            const geocodingResult = {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lng),
                displayName: result.displayName || searchQuery
            };
            console.log('✅ [GeocodingService] Returning geocoding result:', geocodingResult);
            return geocodingResult;
        } else {
            console.error('❌ [GeocodingService] Invalid result structure:', result);
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
                    logger.error('Geolocation error', err, 'GeocodingService');
                    reject(new Error("Unable to get location"));
                }
            );
        });
    }

    // Search for street suggestions with optional context
    static async searchStreetSuggestions(query: string, context?: { country?: string; city?: string }): Promise<string[]> {
        if (query.length < 2) return [];
        
        try {
            console.log('🔍 [GeocodingService] Searching street suggestions for:', query, context);
            const results = await geocodingClient.searchStreets(query, 5, context);
            console.log('📄 [GeocodingService] Street suggestions results:', results);
            const suggestions = results.map(result => result.displayName);
            console.log('✅ [GeocodingService] Returning street suggestions:', suggestions);
            return suggestions;
        } catch (error) {
            console.error('❌ [GeocodingService] Street autocomplete error:', error);
            logger.error('Street autocomplete error', error, 'GeocodingService');
            return [];
        }
    }

    // Search for city suggestions with optional country context
    static async searchCitySuggestions(query: string, country?: string): Promise<string[]> {
        if (query.length < 2) return [];
        
        try {
            console.log('🔍 [GeocodingService] Searching city suggestions for:', query, country ? `in country: ${country}` : '');
            const results = await geocodingClient.searchCities(query, 5, country);
            console.log('📄 [GeocodingService] City suggestions results:', results);
            const suggestions = results.map(result => result.displayName);
            console.log('✅ [GeocodingService] Returning city suggestions:', suggestions);
            return suggestions;
        } catch (error) {
            console.error('❌ [GeocodingService] City autocomplete error:', error);
            logger.error('City autocomplete error', error, 'GeocodingService');
            return [];
        }
    }

    // Search for country suggestions
    static async searchCountrySuggestions(query: string): Promise<string[]> {
        if (query.length < 2) return [];
        
        try {
            console.log('🔍 [GeocodingService] Searching country suggestions for:', query);
            
            // For short queries (< 6 chars), use local country list for better results
            if (query.length < 6) {
                const localResults = filterCountries(query, 5);
                console.log('📋 [GeocodingService] Using local country list:', localResults);
                return localResults;
            }
            
            // For longer queries, use OpenStreetMap API
            const results = await geocodingClient.searchCountries(query, 5);
            console.log('📄 [GeocodingService] Country suggestions results:', results);
            const suggestions = results.map(result => result.displayName);
            console.log('✅ [GeocodingService] Returning country suggestions:', suggestions);
            return suggestions;
        } catch (error) {
            console.error('❌ [GeocodingService] Country autocomplete error:', error);
            logger.error('Country autocomplete error', error, 'GeocodingService');
            // Fallback to local country list on error
            return filterCountries(query, 5);
        }
    }
}
