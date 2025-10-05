/**
 * Frontend API client for geocoding operations
 * Replaces direct fetch calls with centralized API methods
 */

export interface GeocodingResult {
    displayName: string;
    lat: string;
    lng: string;
    place_id: number;
    type: string;
    importance: number;
}

export interface GeocodingResponse {
    results: GeocodingResult[];
    message?: string;
}

export type GeocodingSearchType = 'address' | 'street' | 'city' | 'country';

/**
 * Geocoding API client for frontend operations
 */
class GeocodingClient {
    private baseUrl = '/api/geocoding/search';

    /**
     * Search for addresses using geocoding
     */
    async searchAddress(
        query: string,
        limit: number = 1
    ): Promise<GeocodingResult[]> {
        const params = new URLSearchParams({
            type: 'address',
            q: query,
            limit: limit.toString(),
        });

        console.log('🔍 [GeocodingClient] Searching address:', query);
        const response = await fetch(`${this.baseUrl}?${params.toString()}`);

        if (!response.ok) {
            console.error('❌ [GeocodingClient] Address search failed:', response.status, response.statusText);
            throw new Error(`Geocoding search failed: ${response.statusText}`);
        }

        const data: GeocodingResponse = await response.json();
        console.log('📄 [GeocodingClient] Address search response:', data);

        // Check if data has the expected structure
        if (data && typeof data === 'object' && 'lat' in data) {
            // Direct coordinate response (not wrapped in results array)
            console.log('✅ [GeocodingClient] Direct coordinate response detected');
            return [data as any]; // Convert to array format
        }

        console.log('📋 [GeocodingClient] Returning results:', data.results || []);
        return data.results || [];
    }

  /**
   * Search for streets using geocoding with optional context
   */
  async searchStreets(
    query: string,
    limit: number = 5,
    context?: { country?: string; city?: string }
  ): Promise<GeocodingResult[]> {
    const params = new URLSearchParams({
      type: 'street',
      q: query,
      limit: limit.toString(),
    });

    // Add context parameters if provided
    if (context?.country) {
      params.append('country', context.country);
    }
    if (context?.city) {
      params.append('city', context.city);
    }

    console.log('🔍 [GeocodingClient] Searching streets:', query, context ? `with context: ${JSON.stringify(context)}` : '');
    const response = await fetch(`${this.baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      console.error('❌ [GeocodingClient] Street search failed:', response.status, response.statusText);
      throw new Error(`Street search failed: ${response.statusText}`);
    }

    const data: GeocodingResponse = await response.json();
    console.log('📄 [GeocodingClient] Street search response:', data);
    
    // Check if data is an array (autocomplete response)
    if (Array.isArray(data)) {
      console.log('✅ [GeocodingClient] Array response detected for streets');
      return data.map(item => ({ displayName: item, lat: '', lng: '', place_id: 0, type: '', importance: 0 }));
    }
    
    console.log('📋 [GeocodingClient] Returning street results:', data.results || []);
    return data.results || [];
  }

    /**
     * Search for cities using geocoding with optional country context
     */
    async searchCities(
        query: string,
        limit: number = 5,
        country?: string
    ): Promise<GeocodingResult[]> {
        const params = new URLSearchParams({
            type: 'city',
            q: query,
            limit: limit.toString(),
        });

        // Add country context if provided
        if (country) {
            params.append('country', country);
        }

        console.log('🔍 [GeocodingClient] Searching cities:', query, country ? `in country: ${country}` : '');
        const response = await fetch(`${this.baseUrl}?${params.toString()}`);
        
        if (!response.ok) {
            console.error('❌ [GeocodingClient] City search failed:', response.status, response.statusText);
            throw new Error(`City search failed: ${response.statusText}`);
        }

        const data: GeocodingResponse = await response.json();
        console.log('📄 [GeocodingClient] City search response:', data);
        
        // Check if data is an array (autocomplete response)
        if (Array.isArray(data)) {
            console.log('✅ [GeocodingClient] Array response detected for cities');
            return data.map(item => ({ displayName: item, lat: '', lng: '', place_id: 0, type: '', importance: 0 }));
        }
        
        console.log('📋 [GeocodingClient] Returning city results:', data.results || []);
        return data.results || [];
    }

    /**
     * Search for countries using geocoding
     */
    async searchCountries(
        query: string,
        limit: number = 5
    ): Promise<GeocodingResult[]> {
        const params = new URLSearchParams({
            type: 'country',
            q: query,
            limit: limit.toString(),
        });

        console.log('🔍 [GeocodingClient] Searching countries:', query);
        const response = await fetch(`${this.baseUrl}?${params.toString()}`);

        if (!response.ok) {
            console.error('❌ [GeocodingClient] Country search failed:', response.status, response.statusText);
            throw new Error(`Country search failed: ${response.statusText}`);
        }

        const data: GeocodingResponse = await response.json();
        console.log('📄 [GeocodingClient] Country search response:', data);

        // Check if data is an array (autocomplete response)
        if (Array.isArray(data)) {
            console.log('✅ [GeocodingClient] Array response detected for countries');
            return data.map(item => ({ displayName: item, lat: '', lng: '', place_id: 0, type: '', importance: 0 }));
        }

        console.log('📋 [GeocodingClient] Returning country results:', data.results || []);
        return data.results || [];
    }

    /**
     * Generic search method for any geocoding type
     */
    async search(
        query: string,
        type: GeocodingSearchType,
        limit: number = 5
    ): Promise<GeocodingResult[]> {
        const params = new URLSearchParams({
            type,
            q: query,
            limit: limit.toString(),
        });

        const response = await fetch(`${this.baseUrl}?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`${type} search failed: ${response.statusText}`);
        }

        const data: GeocodingResponse = await response.json();
        return data.results || [];
    }
}

// Export singleton instance
export const geocodingClient = new GeocodingClient();
