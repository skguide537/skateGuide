import { UtilityService } from './utility.service';

export interface FilteredSkatepark {
    _id: string;
    title: string;
    description: string;
    tags: string[];
    photoNames: string[];
    location: { coordinates: [number, number] };
    isPark: boolean;
    size: string;
    levels: string[];
    avgRating: number;
    externalLinks?: {
        url: string;
        sentBy: { id: string; name: string };
        sentAt: string;
    }[];
    coordinates: { lat: number; lng: number };
    distanceKm: number;
    isDeleting: boolean;
}

export interface FilterState {
    searchTerm: string;
    typeFilter: 'all' | 'park' | 'street';
    sizeFilter: string[];
    levelFilter: string[];
    tagFilter: string[];
    showOnlyFavorites: boolean;
    distanceFilterEnabled: boolean;
    distanceFilter: number;
    ratingFilter: number[];
    sortBy: 'default' | 'distance' | 'rating' | 'recent';
}

export class ParksFilterService {
    static filterAndSortParks(
        parks: any[],
        filterState: FilterState,
        userCoords: { lat: number; lng: number } | null,
        favorites: string[],
        deletedSpotIds: Set<string>,
        deletingSpotIds: Set<string>
    ): FilteredSkatepark[] {
        if (!userCoords) return [];

        // Filter out deleted spots and null parks
        let filtered = parks
            .filter(park => park && park._id && !deletedSpotIds.has(park._id))
            .filter(park => this.applyFilters(park, filterState, userCoords, favorites))
            .map(park => this.addDistanceAndMetadata(park, userCoords, deletingSpotIds))
            .filter(Boolean) as FilteredSkatepark[];

        // Apply sorting
        filtered = this.sortParks(filtered, filterState.sortBy, filterState.distanceFilterEnabled);

        return filtered;
    }

    private static applyFilters(
        park: any,
        filterState: FilterState,
        userCoords: { lat: number; lng: number },
        favorites: string[]
    ): boolean {
        // Search filter
        if (filterState.searchTerm) {
            const searchLower = filterState.searchTerm.toLowerCase();
            const matchesSearch = 
                park.title.toLowerCase().includes(searchLower) ||
                park.description.toLowerCase().includes(searchLower) ||
                park.tags.some((tag: string) => tag.toLowerCase().includes(searchLower));
            if (!matchesSearch) return false;
        }

        // Type filter
        if (filterState.typeFilter !== 'all') {
            if (filterState.typeFilter === 'park' && !park.isPark) return false;
            if (filterState.typeFilter === 'street' && park.isPark) return false;
        }

        // Size filter
        if (filterState.sizeFilter.length > 0 && !filterState.sizeFilter.includes(park.size)) return false;

        // Level filter
        if (filterState.levelFilter.length > 0 && !filterState.levelFilter.includes('All Levels')) {
            if (!park.levels || !park.levels.some((level: string) => 
                level !== null && level !== undefined && filterState.levelFilter.includes(level)
            )) return false;
        }

        // Tag filter
        if (filterState.tagFilter.length > 0) {
            const hasMatchingTag = filterState.tagFilter.some(tag => park.tags.includes(tag));
            if (!hasMatchingTag) return false;
        }

        // Distance filter
        if (filterState.distanceFilterEnabled) {
            const distance = UtilityService.getDistanceKm(
                userCoords.lat,
                userCoords.lng,
                park.location.coordinates[1],
                park.location.coordinates[0]
            );
            if (distance > filterState.distanceFilter) return false;
        }

        // Rating filter
        if (park.avgRating < filterState.ratingFilter[0] || park.avgRating > filterState.ratingFilter[1]) return false;

        // Favorites filter
        if (filterState.showOnlyFavorites) {
            if (!favorites.includes(park._id)) return false;
        }

        return true;
    }

    private static addDistanceAndMetadata(
        park: any,
        userCoords: { lat: number; lng: number },
        deletingSpotIds: Set<string>
    ): FilteredSkatepark | null {
        if (!park || !park.location || !park.location.coordinates) return null;
        
        const parkCoords = {
            lat: park.location.coordinates[1],
            lng: park.location.coordinates[0],
        };
        const distanceKm = UtilityService.getDistanceKm(
            userCoords.lat,
            userCoords.lng,
            parkCoords.lat,
            parkCoords.lng
        );

        return {
            ...park,
            coordinates: parkCoords,
            distanceKm,
            isDeleting: deletingSpotIds.has(park._id),
        };
    }

    private static sortParks(
        parks: FilteredSkatepark[],
        sortBy: string,
        distanceFilterEnabled: boolean
    ): FilteredSkatepark[] {
        if (sortBy === 'distance' || (distanceFilterEnabled && sortBy === 'default')) {
            // Sort by distance (closest first)
            return parks.sort((a, b) => a.distanceKm - b.distanceKm);
        } else if (sortBy === 'rating') {
            // Sort by rating (highest first)
            return parks.sort((a, b) => b.avgRating - a.avgRating);
        } else if (sortBy === 'recent') {
            // Sort by recently added (newest first) - using _id as proxy for creation time
            return parks.sort((a, b) => b._id.localeCompare(a._id));
        }
        // For 'default' without distance filter, maintain original order
        return parks;
    }
}
