/**
 * Frontend API client for skatepark-related operations
 * Replaces direct fetch calls with centralized API methods
 */

import { Skatepark } from './map.service';

export interface SkateparkResponse {
  data?: Skatepark[];
  parks?: Skatepark[];
  message?: string;
}

export interface CreateSkateparkRequest {
  title: string;
  description: string;
  tags: string[];
  location: {
    coordinates: [number, number];
  };
  size: string;
  levels: string[];
  isPark: boolean;
  externalLinks?: Array<{
    url: string;
    sentBy?: string;
  }>;
}

export interface RateSkateparkRequest {
  rating: number;
}

export interface DeleteSkateparkResponse {
  message: string;
}

/**
 * Skatepark API client for frontend operations
 */
class SkateparkClient {
  private baseUrl = '/api/skateparks';

  /**
   * Fetch all skateparks with optional limit
   */
  async getAllSkateparks(limit?: number): Promise<Skatepark[]> {
    const url = limit ? `${this.baseUrl}?limit=${limit}` : this.baseUrl;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch skateparks: ${response.statusText}`);
    }
    
    const data: SkateparkResponse = await response.json();
    return data.data || data.parks || [];
  }

  /**
   * Fetch a single skatepark by ID
   */
  async getSkateparkById(id: string): Promise<Skatepark> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch skatepark: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  }

  /**
   * Create a new skatepark
   */
  async createSkatepark(
    skateparkData: CreateSkateparkRequest,
    userId: string
  ): Promise<Skatepark> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify(skateparkData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to create skatepark: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  }

  /**
   * Create a new skatepark with file uploads (FormData)
   */
  async createSkateparkWithFiles(
    formData: FormData,
    userId: string
  ): Promise<Skatepark> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'x-user-id': userId,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to create skatepark: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  }

  /**
   * Delete a skatepark by ID
   */
  async deleteSkatepark(id: string, userId: string): Promise<DeleteSkateparkResponse> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to delete skatepark: ${response.statusText}`
      );
    }

    return await response.json();
  }

  /**
   * Rate a skatepark
   */
  async rateSkatepark(
    id: string,
    ratingData: RateSkateparkRequest,
    userId: string
  ): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${id}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify(ratingData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to rate skatepark: ${response.statusText}`
      );
    }

    return await response.json();
  }

  /**
   * Report a skatepark
   */
  async reportSkatepark(
    id: string,
    reason: string,
    userId: string
  ): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to report skatepark: ${response.statusText}`
      );
    }

    return await response.json();
  }
}

// Export singleton instance
export const skateparkClient = new SkateparkClient();
