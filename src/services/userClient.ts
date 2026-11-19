import { logger } from '@/lib/logger';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  photoUrl: string;
  bio: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  website: string;
  createdAt: Date;
}

export interface PaginatedSpotsResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
}

export interface UserCommentsResponse {
  comments: Array<{
    id: string;
    body: string;
    createdAt: Date;
    skateparkId: string;
    skateparkTitle: string;
    editedAt?: Date;
  }>;
  total: number;
}

export interface UserStats {
  totalSpots: number;
  totalComments: number;
  avgRating: number;
}

/**
 * Frontend API client for user profile operations
 * Centralizes all HTTP requests to profile endpoints
 */
class UserClient {
  private baseUrl = '/api/users';

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch profile' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to get user profile', error, 'UserClient');
      throw error;
    }
  }

  /**
   * Get user's spots with pagination
   */
  async getSpots(userId: string, page: number = 1, limit: number = 20): Promise<PaginatedSpotsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/spots?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch spots' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to get user spots', error, 'UserClient');
      throw error;
    }
  }

  /**
   * Get user's recent comments
   */
  async getComments(userId: string, limit: number = 5): Promise<UserCommentsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/comments?limit=${limit}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch comments' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to get user comments', error, 'UserClient');
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getStats(userId: string): Promise<UserStats> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/stats`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch stats' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to get user stats', error, 'UserClient');
      throw error;
    }
  }

  /**
   * Update bio and social links
   */
  async updateBio(userId: string, data: { bio?: string; instagram?: string; tiktok?: string; youtube?: string; website?: string }): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/bio`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update bio' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to update bio', error, 'UserClient');
      throw error;
    }
  }

  /**
   * Change password
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to change password' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to change password', error, 'UserClient');
      throw error;
    }
  }

  /**
   * Upload profile photo
   */
  async uploadPhoto(userId: string, file: File): Promise<{ photoUrl: string; photoId: string }> {
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`${this.baseUrl}/${userId}/photo`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to upload photo' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to upload photo', error, 'UserClient');
      throw error;
    }
  }

  /**
   * Delete profile photo
   */
  async deletePhoto(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/photo`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete photo' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to delete photo', error, 'UserClient');
      throw error;
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete account' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to delete account', error, 'UserClient');
      throw error;
    }
  }
}

// Export singleton instance
export const userClient = new UserClient();

