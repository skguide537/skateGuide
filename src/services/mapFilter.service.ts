// Map filter service for handling map filtering logic
import { MapService, Skatepark } from './map.service';

export interface MapFilterOptions {
  searchTerm: string;
  typeFilter: 'all' | 'park' | 'street';
  sizeFilter: string[];
  levelFilter: string[];
  tagFilter: string[];
  distanceFilterEnabled: boolean;
  distanceFilter: number; // km
  ratingFilter: number[]; // [min, max]
}

export interface MapFilterState {
  filters: MapFilterOptions;
  showFilters: boolean;
  sidebarOpen: boolean;
}

export class MapFilterService {
  // Get default filter options
  static getDefaultFilters(): MapFilterOptions {
    return {
      searchTerm: '',
      typeFilter: 'all',
      sizeFilter: [],
      levelFilter: [],
      tagFilter: [],
      distanceFilterEnabled: false,
      distanceFilter: 10, // km
      ratingFilter: [0, 5]
    };
  }

  // Get default filter state
  static getDefaultFilterState(): MapFilterState {
    return {
      filters: this.getDefaultFilters(),
      showFilters: false,
      sidebarOpen: true
    };
  }

  // Apply all filters to skatepark data
  static filterSkateparks(
    skateparks: Skatepark[], 
    filters: MapFilterOptions, 
    userLocation: [number, number] | null
  ): Skatepark[] {
    return skateparks.filter(spot => {
      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          spot.title.toLowerCase().includes(searchLower) ||
          spot.description.toLowerCase().includes(searchLower) ||
          spot.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filters.typeFilter !== 'all') {
        if (filters.typeFilter === 'park' && !spot.isPark) return false;
        if (filters.typeFilter === 'street' && spot.isPark) return false;
      }

      // Size filter
      if (filters.sizeFilter.length > 0 && !filters.sizeFilter.includes(spot.size)) return false;

      // Level filter
      if (filters.levelFilter.length > 0 && 
          (!spot.levels || !spot.levels.some(level => 
            level !== null && level !== undefined && filters.levelFilter.includes(level)
          ))) return false;

      // Tag filter
      if (filters.tagFilter.length > 0 && 
          !filters.tagFilter.some(tag => spot.tags.includes(tag))) return false;

      // Distance filter
      if (filters.distanceFilterEnabled && userLocation) {
        const distance = MapService.calculateDistance(
          userLocation[0], userLocation[1],
          spot.location.coordinates[1], spot.location.coordinates[0]
        );
        if (distance > filters.distanceFilter) return false;
      }

      // Rating filter
      if (spot.avgRating < filters.ratingFilter[0] || spot.avgRating > filters.ratingFilter[1]) return false;

      return true;
    });
  }

  // Check if any filters are active
  static hasActiveFilters(filters: MapFilterOptions): boolean {
    return filters.searchTerm.trim().length > 0 ||
           filters.typeFilter !== 'all' ||
           filters.sizeFilter.length > 0 ||
           filters.levelFilter.length > 0 ||
           filters.tagFilter.length > 0 ||
           filters.distanceFilterEnabled ||
           filters.ratingFilter[0] !== 0 ||
           filters.ratingFilter[1] !== 5;
  }

  // Clear all filters
  static clearAllFilters(): MapFilterOptions {
    return this.getDefaultFilters();
  }

  // Get filter summary for display
  static getFilterSummary(filters: MapFilterOptions): string[] {
    const activeFilters: string[] = [];
    
    if (filters.searchTerm.trim()) {
      activeFilters.push(`"${filters.searchTerm}"`);
    }
    if (filters.typeFilter !== 'all') {
      activeFilters.push(filters.typeFilter === 'park' ? 'Parks only' : 'Street only');
    }
    if (filters.sizeFilter.length > 0) {
      activeFilters.push(`${filters.sizeFilter.length} size(s)`);
    }
    if (filters.levelFilter.length > 0) {
      activeFilters.push(`${filters.levelFilter.length} level(s)`);
    }
    if (filters.tagFilter.length > 0) {
      activeFilters.push(`${filters.tagFilter.length} tag(s)`);
    }
    if (filters.distanceFilterEnabled) {
      activeFilters.push(`Within ${filters.distanceFilter}km`);
    }
    if (filters.ratingFilter[0] > 0 || filters.ratingFilter[1] < 5) {
      const min = filters.ratingFilter[0];
      const max = filters.ratingFilter[1];
      if (min === max) {
        activeFilters.push(`${min}+ stars`);
      } else {
        activeFilters.push(`${min}-${max} stars`);
      }
    }
    
    return activeFilters;
  }

  // Get results summary
  static getResultsSummary(total: number, filtered: number): string {
    if (total === filtered) {
      return `Showing all ${total} spots`;
    } else {
      return `Showing ${filtered} of ${total} spots`;
    }
  }

  // Update individual filter
  static updateFilter<T extends keyof MapFilterOptions>(
    currentFilters: MapFilterOptions,
    key: T,
    value: MapFilterOptions[T]
  ): MapFilterOptions {
    return {
      ...currentFilters,
      [key]: value
    };
  }

  // Toggle filter visibility
  static toggleFilters(showFilters: boolean): boolean {
    return !showFilters;
  }

  // Toggle sidebar
  static toggleSidebar(sidebarOpen: boolean): boolean {
    return !sidebarOpen;
  }

  // Validate filter values
  static validateFilters(filters: MapFilterOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (filters.distanceFilter < 0) {
      errors.push('Distance filter cannot be negative');
    }
    if (filters.distanceFilter > 1000) {
      errors.push('Distance filter cannot exceed 1000km');
    }
    if (filters.ratingFilter[0] < 0 || filters.ratingFilter[1] > 5) {
      errors.push('Rating filter must be between 0 and 5');
    }
    if (filters.ratingFilter[0] > filters.ratingFilter[1]) {
      errors.push('Minimum rating cannot be greater than maximum rating');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get filter counts for UI display
  static getFilterCounts(skateparks: Skatepark[]): {
    total: number;
    byType: { parks: number; street: number };
    bySize: Record<string, number>;
    byLevel: Record<string, number>;
    byTag: Record<string, number>;
  } {
    const counts = {
      total: skateparks.length,
      byType: { parks: 0, street: 0 },
      bySize: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
      byTag: {} as Record<string, number>
    };

    skateparks.forEach(spot => {
      // Count by type
      if (spot.isPark) {
        counts.byType.parks++;
      } else {
        counts.byType.street++;
      }

      // Count by size
      if (spot.size) {
        counts.bySize[spot.size] = (counts.bySize[spot.size] || 0) + 1;
      }

      // Count by level
      if (spot.levels) {
        spot.levels.forEach(level => {
          if (level && level !== null && level !== undefined) {
            counts.byLevel[level] = (counts.byLevel[level] || 0) + 1;
          }
        });
      }

      // Count by tag
      spot.tags.forEach(tag => {
        if (tag) {
          counts.byTag[tag] = (counts.byTag[tag] || 0) + 1;
        }
      });
    });

    return counts;
  }
}
