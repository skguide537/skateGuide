/**
 * Frontend API client for geocoding operations
 * Replaces direct fetch calls with centralized API methods
 */

export interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
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

    const response = await fetch(`${this.baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Geocoding search failed: ${response.statusText}`);
    }

    const data: GeocodingResponse = await response.json();
    return data.results || [];
  }

  /**
   * Search for streets using geocoding
   */
  async searchStreets(
    query: string,
    limit: number = 5
  ): Promise<GeocodingResult[]> {
    const params = new URLSearchParams({
      type: 'street',
      q: query,
      limit: limit.toString(),
    });

    const response = await fetch(`${this.baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Street search failed: ${response.statusText}`);
    }

    const data: GeocodingResponse = await response.json();
    return data.results || [];
  }

  /**
   * Search for cities using geocoding
   */
  async searchCities(
    query: string,
    limit: number = 5
  ): Promise<GeocodingResult[]> {
    const params = new URLSearchParams({
      type: 'city',
      q: query,
      limit: limit.toString(),
    });

    const response = await fetch(`${this.baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`City search failed: ${response.statusText}`);
    }

    const data: GeocodingResponse = await response.json();
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

    const response = await fetch(`${this.baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Country search failed: ${response.statusText}`);
    }

    const data: GeocodingResponse = await response.json();
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
