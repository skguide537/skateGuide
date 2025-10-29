/**
 * Frontend API client for skatepark-related operations
 * Replaces direct fetch calls with centralized API methods
 */

import { BaseSkatepark } from '@/types/skatepark';

export interface SkateparkResponse {
  data?: BaseSkatepark[];
  parks?: BaseSkatepark[];
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
  async getAllSkateparks(limit?: number): Promise<BaseSkatepark[]> {
    const url = limit ? `${this.baseUrl}?limit=${limit}` : this.baseUrl;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch skateparks: ${response.statusText}`);
    }
    
    const json = await response.json();
    if (Array.isArray(json)) return json;
    return (json?.data || json?.parks || []) as BaseSkatepark[];
  }

  /**
   * Fetch a single skatepark by ID
   */
  async getSkateparkById(id: string): Promise<BaseSkatepark> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch skatepark: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  }

  /**
   * Fetch multiple skateparks by their IDs
   */
  async getSkateparksByIds(ids: string[]): Promise<BaseSkatepark[]> {
    if (ids.length === 0) return [];
    
    const idsParam = ids.join(',');
    const response = await fetch(`${this.baseUrl}?ids=${idsParam}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch skateparks: ${response.statusText}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  /**
   * Create a new skatepark
   */
  async createSkatepark(
    skateparkData: CreateSkateparkRequest,
    userId: string
  ): Promise<BaseSkatepark> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(skateparkData),
      credentials: 'include', // Send cookies with request
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
  ): Promise<BaseSkatepark> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Send cookies with request
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
      credentials: 'include', // Send cookies with request
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
      },
      body: JSON.stringify(ratingData),
      credentials: 'include', // Send cookies with request
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
      },
      body: JSON.stringify({ reason }),
      credentials: 'include', // Send cookies with request
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to report skatepark: ${response.statusText}`
      );
    }

    return await response.json();
  }

  /**
   * Update a skatepark with file uploads (FormData)
   */
  async updateSkateparkWithFiles(
    id: string,
    formData: FormData
  ): Promise<BaseSkatepark> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: formData,
      credentials: 'include', // Send cookies with request
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to update skatepark: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  }
}

// Export singleton instance
export const skateparkClient = new SkateparkClient();
