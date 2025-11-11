/**
 * Centralized type definitions for skatepark-related data structures
 * Replaces scattered interface definitions and any[] types throughout the codebase
 */

import { SkaterLevel, Size, Tag } from './enums';

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Geographic location with coordinates
 */
export interface Location {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude] - GeoJSON format
}

/**
 * User rating for a skatepark
 */
export interface Rating {
  userId: string;
  value: number; // 1-5 rating
  createdAt?: Date;
}

/**
 * External link submitted by users
 */
export interface ExternalLink {
  url: string;
  sentBy: {
    id: string;
    name: string;
  };
  sentAt: string; // ISO date string
}

/**
 * User report for inappropriate content
 */
export interface Report {
  reportedBy: string;
  reason: string;
  createdAt: Date;
}

// ============================================================================
// MAIN SKATEPARK INTERFACE
// ============================================================================

/**
 * Base skatepark data structure - minimal required fields
 */
export interface BaseSkatepark {
  _id: string;
  title: string;
  description?: string;
  tags: Tag[];
  location: Location;
  size: Size;
  levels: SkaterLevel[];
  isPark: boolean;
  avgRating: number;
  photoNames: string[];
  externalLinks?: ExternalLink[];
  createdBy?: string | {
    _id: string;
    name: string;
    photoUrl?: string;
    role?: string;
  };
}

/**
 * Complete skatepark data structure with all fields
 * This is the single source of truth for skatepark types
 */
export interface Skatepark extends BaseSkatepark {
  isApproved: boolean;
  rating: Rating[];
  createdBy: string | { _id: string; name: string; photoUrl?: string; role?: string; };
  reports?: Report[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SkateparkDetail extends Skatepark {
  userRating?: number | null;
  favoritesCount?: number;
  commentsCount?: number;
}

// ============================================================================
// SPECIALIZED INTERFACES
// ============================================================================

/**
 * Skatepark with calculated distance from user location
 */
export interface SkateparkWithDistance extends BaseSkatepark {
  distanceKm: number | null;
}

/**
 * Skatepark data for card display
 */
export interface SkateparkCard extends BaseSkatepark {
  distanceKm: number;
  isDeleting?: boolean;
}

export type CardSpot = {
  _id: string;
  title: string;
  photoNames: string[];
  avgRating: number;
  isPark: boolean;
  size: Size;
  location?: Location;
  distanceKm?: number;
  tags?: Tag[];
  description?: string;
};

/**
 * Skatepark data for map display
 */
export interface SkateparkMapMarker extends BaseSkatepark {
  distanceKm?: number;
}

/**
 * Skatepark data for filtering and sorting
 */
export interface FilteredSkatepark extends BaseSkatepark {
  distanceKm: number | null;
  isDeleting: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// ============================================================================
// REQUEST/RESPONSE INTERFACES
// ============================================================================

/**
 * Data structure for creating a new skatepark
 */
export interface CreateSkateparkRequest {
  title: string;
  description?: string;
  tags: Tag[];
  location: {
    coordinates: [number, number];
  };
  size: Size;
  levels: SkaterLevel[];
  isPark: boolean;
  externalLinks?: ExternalLink[];
}

/**
 * Data structure for updating a skatepark
 */
export interface UpdateSkateparkRequest extends Partial<CreateSkateparkRequest> {
  _id: string;
}

/**
 * API response for skatepark operations
 */
export interface SkateparkResponse {
  success: boolean;
  data?: Skatepark | Skatepark[];
  message?: string;
  error?: string;
}

// ============================================================================
// FORM INTERFACES
// ============================================================================

/**
 * Form data for adding a new skatepark
 */
export interface AddSpotFormData {
  title: string;
  description: string;
  tags: Tag[];
  location: {
    coordinates: [number, number];
  };
  size: Size;
  levels: SkaterLevel[];
  isPark: boolean;
  externalLinks: ExternalLink[];
}

/**
 * Validation result for form data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// FILTER INTERFACES
// ============================================================================

/**
 * Filter state for skatepark filtering
 */
export interface FilterState {
  keyword: string;
  distance: number;
  size: Size[];
  levels: SkaterLevel[];
  tags: Tag[];
  favorites: boolean;
  sortBy: 'distance' | 'rating' | 'name' | 'date';
  sortOrder: 'asc' | 'desc';
}

/**
 * Search parameters for skatepark queries
 */
export interface SearchParams {
  keyword?: string;
  location?: {
    lat: number;
    lng: number;
  };
  radius?: number; // in kilometers
  size?: Size[];
  levels?: SkaterLevel[];
  tags?: Tag[];
  limit?: number;
  offset?: number;
}

// ============================================================================
// CACHE INTERFACES
// ============================================================================

/**
 * Cached skatepark data
 */
export interface CachedSkateparks {
  data: Skatepark[];
  timestamp: number;
  expiresAt: number;
}

/**
 * Cached filtered results
 */
export interface CachedFilteredResults {
  data: FilteredSkatepark[];
  filterState: FilterState;
  timestamp: number;
  expiresAt: number;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is a valid Skatepark
 */
export function isSkatepark(obj: any): obj is Skatepark {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj._id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.isPark === 'boolean' &&
    typeof obj.size === 'string' &&
    Array.isArray(obj.levels) &&
    Array.isArray(obj.tags) &&
    obj.location &&
    typeof obj.location.type === 'string' &&
    Array.isArray(obj.location.coordinates) &&
    obj.location.coordinates.length === 2
  );
}

/**
 * Type guard to check if an object is a valid ExternalLink
 */
export function isExternalLink(obj: any): obj is ExternalLink {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.url === 'string' &&
    obj.sentBy &&
    typeof obj.sentBy.id === 'string' &&
    typeof obj.sentBy.name === 'string' &&
    typeof obj.sentAt === 'string'
  );
}

/**
 * Type guard to check if an object is a valid Location
 */
export function isLocation(obj: any): obj is Location {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.type === 'Point' &&
    Array.isArray(obj.coordinates) &&
    obj.coordinates.length === 2 &&
    typeof obj.coordinates[0] === 'number' &&
    typeof obj.coordinates[1] === 'number'
  );
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Partial skatepark data for updates
 */
export type PartialSkatepark = Partial<Skatepark>;

/**
 * Skatepark data without MongoDB-specific fields
 */
export type SkateparkData = Omit<Skatepark, '_id' | 'createdAt' | 'updatedAt'>;

/**
 * Skatepark summary for lists
 */
export type SkateparkSummary = Pick<Skatepark, '_id' | 'title' | 'description' | 'isPark' | 'size' | 'avgRating' | 'photoNames'>;

/**
 * External link data without MongoDB-specific fields
 */
export type ExternalLinkData = Omit<ExternalLink, 'sentAt'> & {
  sentAt: Date;
};
