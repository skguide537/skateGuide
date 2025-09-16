/**
 * Frontend API client for authentication operations
 * Replaces direct fetch calls with centralized API methods
 */

import { logger } from '@/lib/logger';

export interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user?: User;
  message?: string;
  error?: string;
}

/**
 * Authentication API client for frontend operations
 */
class AuthClient {
  private baseUrl = '/api/auth';

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/me`);
      
      if (response.status === 401) {
        return null; // Not authenticated
      }
      
      if (!response.ok) {
        throw new Error(`Failed to get current user: ${response.statusText}`);
      }
      
      const json = await response.json();
      const user = (json && typeof json === 'object' && 'user' in json)
        ? (json as AuthResponse).user
        : (json as unknown);
      return user && typeof user === 'object' && (user as any)._id ? (user as any) : null;
    } catch (error) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        logger.error('Error fetching current user', error, 'AuthClient');
      }
      return null;
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Login failed: ${response.statusText}`
      );
    }

    const json = await response.json();
    return typeof json === 'object' && json && !('user' in json)
      ? { user: json as User }
      : (json as AuthResponse);
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Registration failed: ${response.statusText}`
      );
    }

    return await response.json();
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
      });
    } catch (error) {
      // Logout should not throw errors - user might already be logged out
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Logout request failed', error, 'AuthClient');
      }
    }
  }

  /**
   * Promote user to admin (admin only)
   */
  async promoteToAdmin(userId: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/promote-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to promote user: ${response.statusText}`
      );
    }

    return await response.json();
  }
}

// Export singleton instance
export const authClient = new AuthClient();
