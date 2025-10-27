'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { Map } from 'leaflet';
import { 
  Box, 
  IconButton, 
  Tooltip, 
  Drawer,
  useMediaQuery,
  useTheme,
  Typography
} from '@mui/material';
import { 
  Layers, 
  Menu as MenuIcon, 
  MyLocation
} from '@mui/icons-material';
import SkateparkModal from '../modals/SkateparkModal';
import MapSidebar from './MapSidebar';
import RichPopup from './RichPopup';
import MapStyleController from './MapStyleController';
import { useEnhancedMap } from '@/hooks/useEnhancedMap';
import { MapService } from '@/services/map.service';
import { BaseSkatepark } from '@/types/skatepark';
import { MapService as MapServiceInstance } from '@/services/map.service';

interface MapProps {
  userLocation: [number, number] | null;
}

// Component to handle map style changes
function MapStyleControllerWrapper({ currentStyle, onStyleChange }: { 
  currentStyle: string; 
  onStyleChange: (style: string) => void 
}) {
  return <MapStyleController currentStyle={currentStyle} onStyleChange={onStyleChange} />;
}

export default function EnhancedMap({ userLocation }: MapProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
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
    setMapRef
  } = useEnhancedMap(userLocation);

  // Set map ref when component mounts
  useEffect(() => {
    return () => setMapRef(null);
  }, [setMapRef]);


  
  if (error) {
    return <div>Error: {error}</div>;
  }

  const mapCenter = MapService.getMapCenter(userLocation);
  const defaultZoom = MapService.getDefaultZoom();

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100dvh', // Dynamic viewport height for mobile
      position: 'relative',
      overflow: 'hidden',
      width: '100vw',
      maxHeight: '100dvh'
    }}>
      {/* Sidebar */}
      <MapSidebar
        isMobile={isMobile}
        sidebarOpen={filterState.sidebarOpen}
        showFilters={filterState.showFilters}
        filters={filterState.filters}
        hasActiveFilters={hasActiveFilters}
        filterSummary={filterSummary}
        resultsSummary={resultsSummary}
        filteredSpots={filteredSpots}
        allSizes={allSizes}
        allLevels={allLevels}
        uniqueTags={uniqueTags}
        isLoading={isLoading}
        onClose={toggleSidebar}
        onToggleFilters={toggleFilters}
        onUpdateSearchTerm={updateSearchTerm}
        onUpdateTypeFilter={updateTypeFilter}
        onUpdateSizeFilter={updateSizeFilter}
        onUpdateLevelFilter={updateLevelFilter}
        onUpdateTagFilter={updateTagFilter}
        onUpdateDistanceFilterEnabled={updateDistanceFilterEnabled}
        onUpdateDistanceFilter={updateDistanceFilter}
        onUpdateRatingFilter={updateRatingFilter}
        onClearAllFilters={clearAllFilters}
        onSpotClick={handleSpotClick}
      />

      {/* Map Container */}
      <Box sx={{ flexGrow: 1, position: 'relative', zIndex: 1 }}>
        <MapContainer
          center={mapCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          ref={setMapRef}
        >
          {/* Map Style Controller */}
          <MapStyleControllerWrapper 
            currentStyle={currentMapStyle} 
            onStyleChange={handleStyleChange} 
          />

          {/* Tile Layer */}
          <TileLayer
            url={MapService.MAP_STYLES[currentMapStyle].url}
            attribution={MapService.MAP_STYLES[currentMapStyle].attribution}
          />

          {/* User Location Marker */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={MapService.getMyLocationIcon()}
            >
              <Popup>
                <Typography variant="body2">Your Location</Typography>
              </Popup>
            </Marker>
          )}

          {/* Skatepark Markers */}
          {filteredSpots.map((spot) => {
            const [lng, lat] = spot.location.coordinates;
            const icon = MapService.createCustomIcon(spot.isPark, spot.size, spot.levels);
            
            return (
            <Marker
              key={spot._id}
                position={[lat, lng]}
                icon={icon}
                eventHandlers={{
                  click: () => handleSpotClick(spot)
                }}
            >
              <Popup>
                <RichPopup spot={spot} onViewDetails={handleViewDetails} />
              </Popup>
            </Marker>
            );
          })}
        </MapContainer>

        {/* Map Controls */}
        <Box sx={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1,
          zIndex: 9999,
          pointerEvents: 'auto'
        }}>
          {/* Map Style Toggle */}
          <Tooltip title="Change Map Style">
            <IconButton
              onClick={() => {
                const styles = Object.keys(MapService.MAP_STYLES);
                const currentIndex = styles.indexOf(currentMapStyle);
                const nextIndex = (currentIndex + 1) % styles.length;
                handleStyleChange(styles[nextIndex]);
              }}
              sx={{
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-primary)',
                boxShadow: 'var(--shadow-lg)',
                border: '2px solid var(--color-border)',
                minWidth: 48,
                minHeight: 48,
                '&:hover': {
                  backgroundColor: 'var(--color-surface)',
                  transform: 'translateY(-1px)',
                  boxShadow: 'var(--shadow-xl)',
                }
              }}
            >
              <Layers />
            </IconButton>
          </Tooltip>

          {/* Sidebar Toggle */}
          <Tooltip title="Toggle Sidebar">
            <IconButton
              onClick={toggleSidebar}
              sx={{
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-primary)',
                boxShadow: 'var(--shadow-lg)',
                border: '2px solid var(--color-border)',
                minWidth: 48,
                minHeight: 48,
                '&:hover': {
                  backgroundColor: 'var(--color-surface)',
                  transform: 'translateY(-1px)',
                  boxShadow: 'var(--shadow-xl)',
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Skatepark Modal */}
      {selectedSpot && (
        <SkateparkModal
          open={!!selectedSpot}
          onClose={handleCloseModal}
          title={selectedSpot.title}
          description={selectedSpot.description || ''}
          tags={selectedSpot.tags}
          photoNames={selectedSpot.photoNames}
          coordinates={{
            lat: selectedSpot.location.coordinates[1],
            lng: selectedSpot.location.coordinates[0]
          }}
          isPark={selectedSpot.isPark}
          size={selectedSpot.size}
          levels={selectedSpot.levels}
          _id={selectedSpot._id}
          externalLinks={selectedSpot.externalLinks}
          avgRating={selectedSpot.avgRating}
          createdBy={typeof selectedSpot.createdBy === 'object' ? selectedSpot.createdBy : undefined}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={filterState.sidebarOpen}
          onClose={toggleSidebar}
          sx={{
            '& .MuiDrawer-paper': {
              width: '100vw',
              height: '100vh',
              backgroundColor: 'var(--color-surface)',
            }
          }}
        >
          <MapSidebar
            isMobile={isMobile}
            sidebarOpen={filterState.sidebarOpen}
            showFilters={filterState.showFilters}
            filters={filterState.filters}
            hasActiveFilters={hasActiveFilters}
            filterSummary={filterSummary}
            resultsSummary={resultsSummary}
            filteredSpots={filteredSpots}
            allSizes={allSizes}
            allLevels={allLevels}
            uniqueTags={uniqueTags}
            isLoading={isLoading}
            onClose={toggleSidebar}
            onToggleFilters={toggleFilters}
            onUpdateSearchTerm={updateSearchTerm}
            onUpdateTypeFilter={updateTypeFilter}
            onUpdateSizeFilter={updateSizeFilter}
            onUpdateLevelFilter={updateLevelFilter}
            onUpdateTagFilter={updateTagFilter}
            onUpdateDistanceFilterEnabled={updateDistanceFilterEnabled}
            onUpdateDistanceFilter={updateDistanceFilter}
            onUpdateRatingFilter={updateRatingFilter}
            onClearAllFilters={clearAllFilters}
            onSpotClick={handleSpotClick}
          />
        </Drawer>
      )}
    </Box>
  );
}
