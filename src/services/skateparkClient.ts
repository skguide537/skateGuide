/**
 * Frontend API client for skatepark-related operations
 * Class-based approach for better organization and encapsulation
 */

import {
    GeocodingResult,
    SkateparkBasic,
    SkateparkDetailed,
    SkateparksResponse
} from '@/types/skatepark';
import { logger } from '@/utils/logger';
import { HttpError } from '@/types/error-models';

// Base API configuration
const API_BASE = '/api';

// Common headers for authenticated requests
const getAuthHeaders = (): HeadersInit => {
    return {
        'Content-Type': 'application/json',
    };
};

/**
 * Make an API request with authentication
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    
    const config: RequestInit = {
        headers: getAuthHeaders(),
        ...options,
    };

    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            
            // Create HttpError to preserve response data for better error handling
            throw new HttpError(
                errorData.error || `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                errorData
            );
        }

        return await response.json();
    } catch (error) {
        logger.error(`API request failed for ${endpoint}`, error as Error, { component: 'skateparkClient' });
        throw error;
    }
}

/**
 * Skatepark API client class
 */
export class SkateparkClient {
    /**
     * Get all skateparks
     */
      async getAll(): Promise<SkateparkBasic[]> {
    return apiRequest<SkateparkBasic[]>('/skateparks');
  }
    
    /**
     * Get skateparks with pagination
     */
      async getPaginated(page: number, limit: number): Promise<SkateparksResponse> {
    return apiRequest<SkateparksResponse>(`/skateparks?page=${page}&limit=${limit}`);
  }
    
    /**
     * Get skateparks with limit (for virtual scrolling)
     */
    async getWithLimit(limit: number): Promise<SkateparkBasic[]> {
        const response = await apiRequest<SkateparksResponse>(`/skateparks?limit=${limit}`);
        return response.data || [];
    }
    
    /**
     * Get single skatepark by ID
     */
    async getById(id: string): Promise<SkateparkDetailed> {
        return apiRequest<SkateparkDetailed>(`/skateparks/${id}`);
    }
    
    /**
     * Create new skatepark
     */
    async create(data: FormData, userId: string): Promise<SkateparkDetailed> {
        return apiRequest<SkateparkDetailed>('/skateparks', {
            method: 'POST',
            headers: { 'x-user-id': userId },
            body: data,
        });
    }
    
    /**
     * Update skatepark
     */
    async update(id: string, data: FormData, userId: string): Promise<SkateparkDetailed> {
        return apiRequest<SkateparkDetailed>(`/skateparks/${id}`, {
            method: 'PUT',
            headers: { 'x-user-id': userId },
            body: data,
        });
    }
    
    /**
     * Delete skatepark
     */
    async delete(id: string, userId: string): Promise<string> {
        return apiRequest<string>(`/skateparks/${id}`, {
            method: 'DELETE',
            headers: { 'x-user-id': userId },
        });
    }
    
    /**
     * Rate skatepark
     */
    async rate(id: string, rating: number, userId: string): Promise<string> {
        return apiRequest<string>(`/skateparks/${id}/rate`, {
            method: 'POST',
            headers: { 'x-user-id': userId },
            body: JSON.stringify({ rating }),
        });
    }
    
    /**
     * Report skatepark
     */
    async report(id: string, reason: string, userId: string): Promise<string> {
        return apiRequest<string>(`/skateparks/${id}/report`, {
            method: 'POST',
            headers: { 'x-user-id': userId },
            body: JSON.stringify({ reason }),
        });
    }
    
    /**
     * Search skateparks
     */
    async search(query: Record<string, any>): Promise<SkateparkBasic[]> {
        return apiRequest<SkateparkBasic[]>(`/skateparks?${new URLSearchParams(query).toString()}`);
    }
    
    /**
     * Advanced search
     */
    async advancedSearch(filters: Record<string, any>): Promise<SkateparkBasic[]> {
        return apiRequest<SkateparkBasic[]>(`/skateparks?advanced=true&${new URLSearchParams(filters).toString()}`);
    }
    
    /**
     * Get skateparks by tags
     */
    async getByTags(tags: string[]): Promise<SkateparkBasic[]> {
        return apiRequest<SkateparkBasic[]>(`/skateparks?tags=${tags.join(',')}`);
    }
    
    /**
     * Get skateparks near location
     */
    async getNearLocation(lat: number, lng: number, radius: number): Promise<SkateparkBasic[]> {
        return apiRequest<SkateparkBasic[]>(`/skateparks?near=${lat},${lng},${radius}`);
    }
    
    /**
     * Get top rated skateparks
     */
    async getTopRated(limit?: number): Promise<SkateparkBasic[]> {
        return apiRequest<SkateparkBasic[]>(`/skateparks?top-rated=true${limit ? `&limit=${limit}` : ''}`);
    }
    
    /**
     * Get recent skateparks
     */
    async getRecent(limit: number = 3): Promise<SkateparkBasic[]> {
        return apiRequest<SkateparkBasic[]>(`/skateparks?recent=true&limit=${limit}`);
    }
}

/**
 * Auth API client class
 */
export class AuthClient {
    /**
     * Get current user
     */
    async getCurrentUser(): Promise<any> {
        return apiRequest<any>('/auth/me');
    }
    
    /**
     * Login
     */
    async login(credentials: { email: string; password: string }): Promise<any> {
        return apiRequest<any>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }
    
    /**
     * Register
     */
    async register(userData: { email: string; password: string; name: string }): Promise<any> {
        return apiRequest<any>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }
    
    /**
     * Logout
     */
    async logout(): Promise<any> {
        return apiRequest<any>('/auth/logout', { method: 'POST' });
    }
}

/**
 * Favorites API client class
 */
export class FavoritesClient {
    /**
     * Get user favorites
     */
    async getUserFavorites(userId: string): Promise<SkateparkBasic[]> {
        return apiRequest<SkateparkBasic[]>(`/favorites?${new URLSearchParams({ 'x-user-id': userId }).toString()}`);
    }
    
    /**
     * Get favorites with filters
     */
    async getFavoritesWithFilters(filters: Record<string, any>): Promise<SkateparkBasic[]> {
        return apiRequest<SkateparkBasic[]>(`/favorites?${new URLSearchParams(filters).toString()}`);
    }
    
    /**
     * Toggle favorite
     */
    async toggleFavorite(spotId: string, userId: string): Promise<any> {
        return apiRequest<any>('/favorites', {
            method: 'POST',
            headers: { 'x-user-id': userId },
            body: JSON.stringify({ spotId }),
        });
    }
    
    /**
     * Get favorite counts for multiple spots
     */
    async getFavoriteCounts(spotIds: string[]): Promise<{ counts: Record<string, number> }> {
        const params = new URLSearchParams();
        params.set('counts', 'true');
        params.set('spotIds', spotIds.join(','));
        return apiRequest<{ counts: Record<string, number> }>(`/favorites?${params.toString()}`);
    }
}

/**
 * Geocoding API client class
 */
export class GeocodingClient {
    /**
     * Search for addresses/places
     */
    async search(query: string): Promise<GeocodingResult[]> {
        return apiRequest<GeocodingResult[]>(`/geocoding/search?q=${encodeURIComponent(query)}`);
    }
    
    /**
     * Get current location coordinates
     */
    async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    reject(new Error(`Geolocation error: ${error.message}`));
                }
            );
        });
    }
}

// Export singleton instances for easy use
export const skateparkClient = new SkateparkClient();
export const authClient = new AuthClient();
export const favoritesClient = new FavoritesClient();
export const geocodingClient = new GeocodingClient();
