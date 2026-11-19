/**
 * Geoapify Service
 * Frontend service for address autocomplete using Geoapify API
 * 
 * Features:
 * - Address autocomplete (Hebrew & English)
 * - Coordinate validation
 * - Result formatting helpers
 * - Icon helpers for UI display
 */

export interface GeoapifyResult {
  formatted: string;           // Full formatted address
  street?: string;             // Street name
  houseNumber?: string;        // House/building number
  city?: string;               // City name
  postcode?: string;           // Postal/ZIP code
  state?: string;              // State/Province
  country?: string;            // Country name
  countryCode?: string;        // ISO country code (e.g., 'IL', 'US')
  lat: number;                 // Latitude
  lon: number;                 // Longitude
  placeId: string;             // Unique place identifier
  resultType: string;          // Type of result (amenity, street, postcode, etc.)
}

export class GeoapifyService {
  private static baseUrl = '/api/geoapify/autocomplete';
  private static reverseUrl = '/api/geoapify/reverse';
  private static reverseCache = new Map<string, string>();

  /**
   * Search for address suggestions
   * Minimum 3 characters required
   * 
   * @param query - User input (supports Hebrew & English)
   * @param limit - Maximum number of results (default: 5)
   * @returns Array of address suggestions with coordinates
   */
  static async searchAddress(
    query: string,
    limit: number = 5
  ): Promise<GeoapifyResult[]> {
    // Don't search if query is too short
    if (query.length < 3) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        text: query,
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many requests. Please slow down.');
        }
        if (response.status === 400) {
          const error = await response.json();
          throw new Error(error.error || 'Invalid search query');
        }
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const results: GeoapifyResult[] = await response.json();
      return results;

    } catch (error) {
      console.error('Geoapify search error:', error);
      throw error;
    }
  }

  /**
   * Validate coordinates are within valid bounds
   * Also rejects 0,0 which is often an error
   * 
   * @param lat - Latitude (-90 to 90)
   * @param lon - Longitude (-180 to 180)
   * @returns true if coordinates are valid
   */
  static validateCoordinates(lat: number, lon: number): boolean {
    // Check bounds
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return false;
    }
    
    // Reject 0,0 (Null Island - likely an error)
    if (lat === 0 && lon === 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Get emoji icon for result type
   * Used to visually distinguish between different place types
   * 
   * @param resultType - Type from Geoapify (amenity, street, postcode, etc.)
   * @returns Emoji icon
   */
  static getResultTypeIcon(resultType: string): string {
    switch (resultType) {
      case 'amenity':
        return '🏢'; // Building/Place
      case 'street':
        return '🛣️'; // Street
      case 'postcode':
        return '📮'; // Postal code area
      case 'city':
        return '🏙️'; // City
      case 'county':
      case 'state':
        return '🗺️'; // Region
      case 'country':
        return '🌍'; // Country
      case 'suburb':
      case 'district':
        return '🏘️'; // Neighborhood
      default:
        return '📍'; // Generic location
    }
  }

  /**
   * Format result for short display
   * Shows only the most relevant parts of an address
   * 
   * @param result - Geoapify result
   * @returns Shortened address string
   */
  static formatShortAddress(result: GeoapifyResult): string {
    const parts: string[] = [];
    
    // Priority: street > city > country
    if (result.street) {
      parts.push(result.street);
    }
    if (result.city) {
      parts.push(result.city);
    }
    if (result.country && parts.length < 2) {
      parts.push(result.country);
    }
    
    // Fallback to formatted if we don't have enough parts
    if (parts.length === 0) {
      return result.formatted;
    }
    
    // Return first 2 parts max
    return parts.slice(0, 2).join(', ');
  }

  /**
   * Format result for detailed display
   * Shows full address with all available details
   * 
   * @param result - Geoapify result
   * @returns Full address string
   */
  static formatFullAddress(result: GeoapifyResult): string {
    return result.formatted;
  }

  /**
   * Check if a result is in Israel
   * Useful for prioritizing local results for Israeli users
   * 
   * @param result - Geoapify result
   * @returns true if result is in Israel
   */
  static isIsraeliAddress(result: GeoapifyResult): boolean {
    return result.countryCode?.toUpperCase() === 'IL';
  }

  /**
   * Sort results by relevance for Israeli users
   * Prioritizes Israeli addresses, then by result type
   * 
   * @param results - Array of Geoapify results
   * @returns Sorted array
   */
  static sortForIsraeliUsers(results: GeoapifyResult[]): GeoapifyResult[] {
    return [...results].sort((a, b) => {
      // Israeli addresses first
      const aIsIsraeli = this.isIsraeliAddress(a);
      const bIsIsraeli = this.isIsraeliAddress(b);
      
      if (aIsIsraeli && !bIsIsraeli) return -1;
      if (!aIsIsraeli && bIsIsraeli) return 1;
      
      // Then by result type priority (street > amenity > city > other)
      const typePriority: Record<string, number> = {
        street: 1,
        amenity: 2,
        city: 3,
        suburb: 4,
        postcode: 5,
      };
      
      const aPriority = typePriority[a.resultType] || 99;
      const bPriority = typePriority[b.resultType] || 99;
      
      return aPriority - bPriority;
    });
  }

  /**
   * Reverse geocode coordinates to a readable location label.
   * Results are cached in-memory for the session.
   */
  static async reverseGeocode(lat: number, lon: number): Promise<string> {
    const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (this.reverseCache.has(cacheKey)) {
      return this.reverseCache.get(cacheKey)!;
    }

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
      });
      const response = await fetch(`${this.reverseUrl}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Reverse geocode failed: ${response.statusText}`);
      }
      const data = await response.json();
      const label =
        data?.formatted ||
        data?.rawFormatted ||
        data?.results?.[0]?.formatted ||
        cacheKey;
      this.reverseCache.set(cacheKey, label);
      return label;
    } catch (error) {
      console.error('Geoapify reverse geocode error:', error);
      return cacheKey;
    }
  }
}

