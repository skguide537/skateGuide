// Search and filter service for handling skatepark filtering and search logic
export interface FilterOptions {
    levelFilter: string[];
    sizeFilter: string[];
    tagFilter: string[];
    isParkFilter: boolean | null;
    searchQuery: string;
}

export interface SkateparkData {
    _id: string;
    title: string;
    description: string;
    size: string;
    levels: string[];
    isPark: boolean;
    tags: string[];
    rating: number;
    avgRating: number;
    location: {
        type: string;
        coordinates: number[];
    };
    photoNames: string[];
    createdAt: string;
    updatedAt: string;
}

export class SearchFilterService {
    // Apply all filters to skatepark data
    static filterSkateparks(skateparks: SkateparkData[], filters: FilterOptions): SkateparkData[] {
        return skateparks.filter(park => {
            // Level filter
            if (filters.levelFilter.length > 0 && 
                (!park.levels || !park.levels.some(level => 
                    level !== null && level !== undefined && filters.levelFilter.includes(level)
                ))) {
                return false;
            }

            // Size filter
            if (filters.sizeFilter.length > 0 && !filters.sizeFilter.includes(park.size)) {
                return false;
            }

            // Tag filter
            if (filters.tagFilter.length > 0 && 
                !filters.tagFilter.some(tag => park.tags.includes(tag))) {
                return false;
            }

            // Park/Street filter
            if (filters.isParkFilter !== null && park.isPark !== filters.isParkFilter) {
                return false;
            }

            // Search query filter
            if (filters.searchQuery.trim()) {
                const query = filters.searchQuery.toLowerCase();
                const titleMatch = park.title.toLowerCase().includes(query);
                const descriptionMatch = park.description.toLowerCase().includes(query);
                const tagsMatch = park.tags.some(tag => tag.toLowerCase().includes(query));
                
                if (!titleMatch && !descriptionMatch && !tagsMatch) {
                    return false;
                }
            }

            return true;
        });
    }

    // Sort skateparks by various criteria
    static sortSkateparks(skateparks: SkateparkData[], sortBy: string): SkateparkData[] {
        const sorted = [...skateparks];
        
        switch (sortBy) {
            case 'newest':
                return sorted.sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
            
            case 'oldest':
                return sorted.sort((a, b) => 
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
            
            case 'rating':
                return sorted.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
            
            case 'rating-low':
                return sorted.sort((a, b) => (a.avgRating || 0) - (b.avgRating || 0));
            
            case 'name':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            
            case 'name-reverse':
                return sorted.sort((a, b) => b.title.localeCompare(a.title));
            
            default:
                return sorted;
        }
    }

    // Get unique values for filter options
    static getUniqueLevels(skateparks: SkateparkData[]): string[] {
        const levels = new Set<string>();
        skateparks.forEach(park => {
            if (park.levels) {
                park.levels.forEach(level => {
                    if (level && level !== null && level !== undefined) {
                        levels.add(level);
                    }
                });
            }
        });
        return Array.from(levels).sort();
    }

    static getUniqueSizes(skateparks: SkateparkData[]): string[] {
        const sizes = new Set<string>();
        skateparks.forEach(park => {
            if (park.size) {
                sizes.add(park.size);
            }
        });
        return Array.from(sizes).sort();
    }

    static getUniqueTags(skateparks: SkateparkData[]): string[] {
        const tags = new Set<string>();
        skateparks.forEach(park => {
            park.tags.forEach(tag => {
                if (tag) {
                    tags.add(tag);
                }
            });
        });
        return Array.from(tags).sort();
    }

    // Get filter counts for UI display
    static getFilterCounts(skateparks: SkateparkData[]): {
        total: number;
        byLevel: Record<string, number>;
        bySize: Record<string, number>;
        byTag: Record<string, number>;
        byType: { parks: number; street: number };
    } {
        const counts = {
            total: skateparks.length,
            byLevel: {} as Record<string, number>,
            bySize: {} as Record<string, number>,
            byTag: {} as Record<string, number>,
            byType: { parks: 0, street: 0 }
        };

        skateparks.forEach(park => {
            // Count by level
            if (park.levels) {
                park.levels.forEach(level => {
                    if (level && level !== null && level !== undefined) {
                        counts.byLevel[level] = (counts.byLevel[level] || 0) + 1;
                    }
                });
            }

            // Count by size
            if (park.size) {
                counts.bySize[park.size] = (counts.bySize[park.size] || 0) + 1;
            }

            // Count by tag
            park.tags.forEach(tag => {
                if (tag) {
                    counts.byTag[tag] = (counts.byTag[tag] || 0) + 1;
                }
            });

            // Count by type
            if (park.isPark) {
                counts.byType.parks++;
            } else {
                counts.byType.street++;
            }
        });

        return counts;
    }

    // Reset all filters to default values
    static getDefaultFilters(): FilterOptions {
        return {
            levelFilter: [],
            sizeFilter: [],
            tagFilter: [],
            isParkFilter: null,
            searchQuery: ''
        };
    }

    // Check if any filters are active
    static hasActiveFilters(filters: FilterOptions): boolean {
        return filters.levelFilter.length > 0 ||
               filters.sizeFilter.length > 0 ||
               filters.tagFilter.length > 0 ||
               filters.isParkFilter !== null ||
               filters.searchQuery.trim().length > 0;
    }

    // Clear all filters
    static clearFilters(): FilterOptions {
        return this.getDefaultFilters();
    }
}
