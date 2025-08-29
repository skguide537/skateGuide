import { useState, useCallback, useMemo } from 'react';
import { SearchFilterService, FilterOptions, SkateparkData } from '@/services/searchFilter.service';
import { Tag } from '@/types/enums';

export const useSearchFilters = (initialSkateparks: SkateparkData[]) => {
    // Filter state
    const [filters, setFilters] = useState<FilterOptions>(SearchFilterService.getDefaultFilters());
    const [sortBy, setSortBy] = useState<string>('newest');
    const [showFilters, setShowFilters] = useState(false);

    // Get unique filter options from data
    const uniqueLevels = useMemo(() => 
        SearchFilterService.getUniqueLevels(initialSkateparks), [initialSkateparks]
    );
    
    const uniqueSizes = useMemo(() => 
        SearchFilterService.getUniqueSizes(initialSkateparks), [initialSkateparks]
    );
    
    const uniqueTags = useMemo(() => 
        SearchFilterService.getUniqueTags(initialSkateparks), [initialSkateparks]
    );

    // Apply filters and sorting
    const filteredAndSortedSkateparks = useMemo(() => {
        const filtered = SearchFilterService.filterSkateparks(initialSkateparks, filters);
        return SearchFilterService.sortSkateparks(filtered, sortBy);
    }, [initialSkateparks, filters, sortBy]);

    // Filter counts
    const filterCounts = useMemo(() => 
        SearchFilterService.getFilterCounts(initialSkateparks), [initialSkateparks]
    );

    // Filter handlers
    const updateLevelFilter = useCallback((levels: string[]) => {
        setFilters(prev => ({ ...prev, levelFilter: levels }));
    }, []);

    const updateSizeFilter = useCallback((sizes: string[]) => {
        setFilters(prev => ({ ...prev, sizeFilter: sizes }));
    }, []);

    const updateTagFilter = useCallback((tags: Tag[]) => {
        setFilters(prev => ({ ...prev, tagFilter: tags }));
    }, []);

    const updateIsParkFilter = useCallback((isPark: boolean | null) => {
        setFilters(prev => ({ ...prev, isParkFilter: isPark }));
    }, []);

    const updateSearchQuery = useCallback((query: string) => {
        setFilters(prev => ({ ...prev, searchQuery: query }));
    }, []);

    const clearAllFilters = useCallback(() => {
        setFilters(SearchFilterService.getDefaultFilters());
    }, []);

    const toggleFilters = useCallback(() => {
        setShowFilters(prev => !prev);
    }, []);

    const hasActiveFilters = useMemo(() => 
        SearchFilterService.hasActiveFilters(filters), [filters]
    );

    // Get filter summary for display
    const getFilterSummary = useCallback(() => {
        const activeFilters: string[] = [];
        
        if (filters.levelFilter.length > 0) {
            activeFilters.push(`${filters.levelFilter.length} level(s)`);
        }
        if (filters.sizeFilter.length > 0) {
            activeFilters.push(`${filters.sizeFilter.length} size(s)`);
        }
        if (filters.tagFilter.length > 0) {
            activeFilters.push(`${filters.tagFilter.length} tag(s)`);
        }
        if (filters.isParkFilter !== null) {
            activeFilters.push(filters.isParkFilter ? 'Parks only' : 'Street only');
        }
        if (filters.searchQuery.trim()) {
            activeFilters.push(`"${filters.searchQuery}"`);
        }
        
        return activeFilters;
    }, [filters]);

    // Get results summary
    const getResultsSummary = useCallback(() => {
        const total = initialSkateparks.length;
        const filtered = filteredAndSortedSkateparks.length;
        
        if (total === filtered) {
            return `Showing all ${total} spots`;
        } else {
            return `Showing ${filtered} of ${total} spots`;
        }
    }, [initialSkateparks.length, filteredAndSortedSkateparks.length]);

    return {
        // State
        filters,
        sortBy,
        showFilters,
        
        // Computed values
        filteredAndSortedSkateparks,
        uniqueLevels,
        uniqueSizes,
        uniqueTags,
        filterCounts,
        hasActiveFilters,
        
        // Actions
        updateLevelFilter,
        updateSizeFilter,
        updateTagFilter,
        updateIsParkFilter,
        updateSearchQuery,
        setSortBy,
        clearAllFilters,
        toggleFilters,
        
        // Utilities
        getFilterSummary,
        getResultsSummary
    };
};
