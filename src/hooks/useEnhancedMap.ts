// Custom hook for EnhancedMap state and logic
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Map } from 'leaflet';
import { useCache } from '@/context/ToastContext';
import { MapService, Skatepark } from '@/services/map.service';
import { MapFilterService, MapFilterOptions, MapFilterState } from '@/services/mapFilter.service';
import { logger } from '@/lib/logger';
import { skateparkClient } from '@/services/skateparkClient';

export const useEnhancedMap = (userLocation: [number, number] | null) => {
  // Core state
  const [spots, setSpots] = useState<Skatepark[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Skatepark | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMapStyle, setCurrentMapStyle] = useState('street');

  // Filter state
  const [filterState, setFilterState] = useState<MapFilterState>(
    MapFilterService.getDefaultFilterState()
  );

  // Refs
  const mapRef = useRef<Map | null>(null);

  // Fetch spots data
  const fetchSpots = useCallback(async () => {
    try {
      const data = await skateparkClient.getAllSkateparks();
      setSpots(data);
    } catch (err) {
      setError('Unable to load skateparks');
      logger.error('Failed to load skateparks', err, 'useEnhancedMap');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  // Subscribe to cache invalidation events
  useCache('skateparks', fetchSpots);

  // Force map refresh when user location changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, [userLocation]);

  // Filtered spots
  const filteredSpots = useMemo(() => {
    return MapFilterService.filterSkateparks(spots, filterState.filters, userLocation);
  }, [spots, filterState.filters, userLocation]);

  // Get unique values for filter options
  const allSizes = ['Small', 'Medium', 'Large'];
  const allLevels = ['Beginner', 'Intermediate', 'Expert'];
  const uniqueTags = MapService.getUniqueTags(spots);

  // Filter counts
  const filterCounts = useMemo(() => 
    MapFilterService.getFilterCounts(spots), [spots]
  );

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => 
    MapFilterService.hasActiveFilters(filterState.filters), [filterState.filters]
  );

  // Filter summary
  const filterSummary = useMemo(() => 
    MapFilterService.getFilterSummary(filterState.filters), [filterState.filters]
  );

  // Results summary
  const resultsSummary = useMemo(() => 
    MapFilterService.getResultsSummary(spots.length, filteredSpots.length), 
    [spots.length, filteredSpots.length]
  );

  // Map style handlers
  const handleStyleChange = useCallback((style: string) => {
    setCurrentMapStyle(style);
  }, []);

  // Spot interaction handlers
  const handleViewDetails = useCallback((spot: Skatepark) => {
    setSelectedSpot(spot);
  }, []);

  const handleSpotClick = useCallback((spot: Skatepark) => {
    // Fly to the spot location
    if (mapRef.current) {
      const [lng, lat] = spot.location.coordinates;
      MapService.flyToLocation(mapRef.current, lat, lng, 16);
    }
    
    // Don't open modal - let the popup handle it
    setSelectedSpot(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedSpot(null);
  }, []);

  // Filter handlers
  const updateFilter = useCallback(<T extends keyof MapFilterOptions>(
    key: T,
    value: MapFilterOptions[T]
  ) => {
    setFilterState(prev => ({
      ...prev,
      filters: MapFilterService.updateFilter(prev.filters, key, value)
    }));
  }, []);

  const updateSearchTerm = useCallback((searchTerm: string) => {
    updateFilter('searchTerm', searchTerm);
  }, [updateFilter]);

  const updateTypeFilter = useCallback((typeFilter: 'all' | 'park' | 'street') => {
    updateFilter('typeFilter', typeFilter);
  }, [updateFilter]);

  const updateSizeFilter = useCallback((sizeFilter: string[]) => {
    updateFilter('sizeFilter', sizeFilter);
  }, [updateFilter]);

  const updateLevelFilter = useCallback((levelFilter: string[]) => {
    updateFilter('levelFilter', levelFilter);
  }, [updateFilter]);

  const updateTagFilter = useCallback((tagFilter: string[]) => {
    updateFilter('tagFilter', tagFilter);
  }, [updateFilter]);

  const updateDistanceFilterEnabled = useCallback((enabled: boolean) => {
    updateFilter('distanceFilterEnabled', enabled);
  }, [updateFilter]);

  const updateDistanceFilter = useCallback((distance: number) => {
    updateFilter('distanceFilter', distance);
  }, [updateFilter]);

  const updateRatingFilter = useCallback((rating: number[]) => {
    updateFilter('ratingFilter', rating);
  }, [updateFilter]);

  const toggleFilters = useCallback(() => {
    setFilterState(prev => ({
      ...prev,
      showFilters: MapFilterService.toggleFilters(prev.showFilters)
    }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setFilterState(prev => ({
      ...prev,
      sidebarOpen: MapFilterService.toggleSidebar(prev.sidebarOpen)
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilterState(prev => ({
      ...prev,
      filters: MapFilterService.clearAllFilters()
    }));
  }, []);

  // Map ref handler
  const setMapRef = useCallback((map: Map | null) => {
    mapRef.current = map;
  }, []);

  return {
    // State
    spots,
    filteredSpots,
    selectedSpot,
    isLoading,
    error,
    currentMapStyle,
    filterState,
    
    // Computed values
    allSizes,
    allLevels,
    uniqueTags,
    filterCounts,
    hasActiveFilters,
    filterSummary,
    resultsSummary,
    
    // Actions
    handleStyleChange,
    handleViewDetails,
    handleSpotClick,
    handleCloseModal,
    
    // Filter actions
    updateSearchTerm,
    updateTypeFilter,
    updateSizeFilter,
    updateLevelFilter,
    updateTagFilter,
    updateDistanceFilterEnabled,
    updateDistanceFilter,
    updateRatingFilter,
    toggleFilters,
    toggleSidebar,
    clearAllFilters,
    
    // Map ref
    setMapRef,
    
    // Data refresh
    fetchSpots
  };
};
