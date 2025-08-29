/**
 * Frontend-friendly skatepark data types
 * These are simplified versions of the backend models for UI consumption
 */

import { SkaterLevel, Size, Tag } from './enums';

// Basic skatepark data structure for lists and grids
export interface SkateparkBasic {
  _id: string;
  title: string;
  description: string; 
  tags: Tag[];
  location: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  size: Size;
  levels: SkaterLevel[];
  isPark: boolean;
  avgRating: number;
  photoNames: string[];
  createdAt?: string;
  updatedAt?: string;
  externalLinks?: Array<{
    url: string;
    sentBy: {
      id: string;
      name: string;
    };
    sentAt: string;
  }>;
}

// Extended skatepark data for detailed views
export interface SkateparkDetailed extends SkateparkBasic {
  rating: Array<{
    userId: string;
    value: number;
  }>;
  externalLinks: Array<{
    url: string;
    sentBy: {
      id: string;
      name: string;
    };
    sentAt: string;
  }>;
  createdBy: string;
  isApproved: boolean;
  reports?: Array<{
    reportedBy: string;
    reason: string;
    createdAt: string;
  }>;
}

// Skatepark with distance calculation for map and search
export interface SkateparkWithDistance extends SkateparkBasic {
  distance?: number; // in kilometers
  distanceFormatted?: string; // human readable distance
}

// Skatepark form data for creation/editing
export interface SkateparkFormData {
  title: string;
  description: string;
  tags: Tag[];
  location: {
    coordinates: [number, number];
  };
  size: Size;
  levels: SkaterLevel[];
  isPark: boolean;
  photoNames: string[];
}

// API response types
export interface SkateparksResponse {
  data: SkateparkBasic[];
  totalCount: number;
  page?: number;
  limit?: number;
}

export interface SkateparkResponse {
  data: SkateparkDetailed;
}

// Search and filter types
export interface SkateparkFilters {
  searchTerm?: string;
  typeFilter?: 'all' | 'parks' | 'streets';
  sizeFilter?: Size;
  levelFilter?: SkaterLevel[];
  tagFilter?: Tag[];
  showOnlyFavorites?: boolean;
  distanceFilterEnabled?: boolean;
  distanceFilter?: number;
  ratingFilterEnabled?: boolean;
  ratingFilter?: number;
  sortBy?: 'newest' | 'oldest' | 'rating' | 'distance' | 'name';
}

// Geocoding types
export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  address?: {
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    country?: string;
  };
}

// Autocomplete types
export interface AutocompleteResult {
  value: string;
  label: string;
  type: 'street' | 'city' | 'country';
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  details?: string;
}

// Utility types
export type SortDirection = 'asc' | 'desc';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
