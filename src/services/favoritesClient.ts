/**
 * Frontend API client for favorites operations
 * Replaces direct fetch calls with centralized API methods
 */

export interface FavoritesResponse {
  favorites?: string[];
  counts?: Record<string, number>;
  message?: string;
}

export interface ToggleFavoriteRequest {
  spotId: string;
}

/**
 * Favorites API client for frontend operations
 */
class FavoritesClient {
  private baseUrl = '/api/favorites';

  /**
   * Get user's favorite spot IDs
   */
  async getFavorites(userId: string): Promise<string[]> {
    const response = await fetch(this.baseUrl, {
      credentials: 'include', // Send cookies with request
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch favorites: ${response.statusText}`);
    }

    const data: FavoritesResponse = await response.json();
    return data.favorites || [];
  }

  /**
   * Get favorite counts for multiple spots
   */
  async getFavoriteCounts(spotIds: string[]): Promise<Record<string, number>> {
    if (spotIds.length === 0) return {};

    const params = new URLSearchParams();
    params.set('counts', 'true');
    params.set('spotIds', spotIds.join(','));

    const response = await fetch(`${this.baseUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch favorite counts: ${response.statusText}`);
    }

    const data: FavoritesResponse = await response.json();
    return data.counts || {};
  }

  /**
   * Toggle favorite status for a spot
   */
  async toggleFavorite(
    spotId: string,
    userId: string
  ): Promise<'added' | 'removed'> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ spotId }),
      credentials: 'include', // Send cookies with request
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to toggle favorite: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.action || 'added';
  }

  /**
   * Add a spot to favorites
   */
  async addFavorite(spotId: string, userId: string): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ spotId }),
      credentials: 'include', // Send cookies with request
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to add favorite: ${response.statusText}`
      );
    }
  }

  /**
   * Remove a spot from favorites
   */
  async removeFavorite(spotId: string, userId: string): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ spotId }),
      credentials: 'include', // Send cookies with request
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to remove favorite: ${response.statusText}`
      );
    }
  }
}

// Export singleton instance
export const favoritesClient = new FavoritesClient();
