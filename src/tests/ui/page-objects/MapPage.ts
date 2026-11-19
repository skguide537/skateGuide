import { Page, expect, Locator } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Page Object Model for Map Page
 * Encapsulates all map page interactions and assertions
 */
export class MapPage {
  private helpers: TestHelpers;

  // Page elements
  readonly mapContainer: Locator;
  readonly sidebar: Locator;
  readonly sidebarToggle: Locator;
  readonly searchInput: Locator;
  readonly filterToggle: Locator;
  readonly mapStyleController: Locator;
  readonly loadingMessage: Locator;
  readonly errorMessage: Locator;
  readonly geolocationError: Locator;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
    
    // Initialize locators
    this.mapContainer = page.locator('.leaflet-container, [data-testid="map-container"]');
    this.sidebar = page.locator('[data-testid="map-sidebar"], .MuiDrawer-root');
    this.sidebarToggle = page.locator('[data-testid="sidebar-toggle"], button[aria-label*="menu"]');
    this.searchInput = page.locator('input[placeholder*="search"], [data-testid="search-input"]');
    this.filterToggle = page.locator('[data-testid="filter-toggle"], button:has-text("Filter")');
    this.mapStyleController = page.locator('[data-testid="map-style-controller"]');
    this.loadingMessage = page.locator('text=/loading interactive map/i');
    this.errorMessage = page.locator('text=/unable to retrieve your location/i');
    this.geolocationError = page.locator('text=/geolocation is not supported/i');
  }

  /**
   * Navigate to map page
   */
  async goto() {
    await this.page.goto('/map');
    await this.helpers.waitForPageLoad();
  }

  /**
   * Wait for map to load
   */
  async waitForMapLoad() {
    // Wait for either map to load or error message to appear
    await Promise.race([
      this.mapContainer.waitFor({ timeout: 15000 }),
      this.loadingMessage.waitFor({ timeout: 15000 }),
      this.errorMessage.waitFor({ timeout: 15000 }),
      this.geolocationError.waitFor({ timeout: 15000 })
    ]);
  }

  /**
   * Check if map is loaded
   */
  async isMapLoaded(): Promise<boolean> {
    try {
      await this.mapContainer.waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if map is loading
   */
  async isLoading(): Promise<boolean> {
    return await this.helpers.elementExists('text=/loading interactive map/i');
  }

  /**
   * Check if there's a geolocation error
   */
  async hasGeolocationError(): Promise<boolean> {
    return await this.helpers.elementExists('text=/unable to retrieve your location/i') ||
           await this.helpers.elementExists('text=/geolocation is not supported/i');
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    if (await this.errorMessage.isVisible()) {
      return await this.errorMessage.textContent() || '';
    }
    if (await this.geolocationError.isVisible()) {
      return await this.geolocationError.textContent() || '';
    }
    return '';
  }

  /**
   * Toggle sidebar
   */
  async toggleSidebar() {
    if (await this.sidebarToggle.isVisible()) {
      await this.sidebarToggle.click();
    }
  }

  /**
   * Check if sidebar is open
   */
  async isSidebarOpen(): Promise<boolean> {
    return await this.sidebar.isVisible();
  }

  /**
   * Search for skateparks
   */
  async search(query: string) {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(query);
      await this.searchInput.press('Enter');
      await this.helpers.waitForPageLoad();
    }
  }

  /**
   * Clear search
   */
  async clearSearch() {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.clear();
      await this.searchInput.press('Enter');
      await this.helpers.waitForPageLoad();
    }
  }

  /**
   * Toggle filters
   */
  async toggleFilters() {
    if (await this.filterToggle.isVisible()) {
      await this.filterToggle.click();
      await this.helpers.waitForPageLoad();
    }
  }

  /**
   * Check if filters are visible
   */
  async areFiltersVisible(): Promise<boolean> {
    return await this.helpers.elementExists('[data-testid="filters-section"]');
  }

  /**
   * Get map markers count
   */
  async getMarkerCount(): Promise<number> {
    return await this.page.locator('.leaflet-marker-icon, [data-testid="map-marker"]').count();
  }

  /**
   * Click on a map marker
   */
  async clickMarker(index: number = 0) {
    const markers = this.page.locator('.leaflet-marker-icon, [data-testid="map-marker"]');
    await markers.nth(index).click();
  }

  /**
   * Get popup content
   */
  async getPopupContent(): Promise<string> {
    const popup = this.page.locator('.leaflet-popup-content, [data-testid="map-popup"]');
    if (await popup.isVisible()) {
      return await popup.textContent() || '';
    }
    return '';
  }

  /**
   * Close popup
   */
  async closePopup() {
    const closeButton = this.page.locator('.leaflet-popup-close-button, [data-testid="popup-close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }

  /**
   * Get sidebar spots count
   */
  async getSidebarSpotsCount(): Promise<number> {
    return await this.page.locator('[data-testid="sidebar-spot"], .MuiListItem-root').count();
  }

  /**
   * Click on sidebar spot
   */
  async clickSidebarSpot(index: number = 0) {
    const spots = this.page.locator('[data-testid="sidebar-spot"], .MuiListItem-root');
    await spots.nth(index).click();
  }

  /**
   * Get sidebar spot title
   */
  async getSidebarSpotTitle(index: number = 0): Promise<string> {
    const spots = this.page.locator('[data-testid="sidebar-spot"], .MuiListItem-root');
    const titleElement = spots.nth(index).locator('h3, h4, h5, h6, [data-testid="spot-title"]').first();
    return await titleElement.textContent() || '';
  }

  /**
   * Get sidebar spot rating
   */
  async getSidebarSpotRating(index: number = 0): Promise<number> {
    const spots = this.page.locator('[data-testid="sidebar-spot"], .MuiListItem-root');
    const ratingText = await spots.nth(index).locator('text=/\\d+\\.\\d+/').first().textContent();
    return ratingText ? parseFloat(ratingText) : 0;
  }

  /**
   * Get sidebar spot distance
   */
  async getSidebarSpotDistance(index: number = 0): Promise<string> {
    const spots = this.page.locator('[data-testid="sidebar-spot"], .MuiListItem-root');
    const distanceText = await spots.nth(index).locator('text=/distance:/i').textContent();
    return distanceText || '';
  }

  /**
   * Check if map style controller is visible
   */
  async hasMapStyleController(): Promise<boolean> {
    return await this.mapStyleController.isVisible();
  }

  /**
   * Change map style
   */
  async changeMapStyle(style: string) {
    if (await this.hasMapStyleController()) {
      const styleButton = this.mapStyleController.locator(`button:has-text("${style}")`);
      if (await styleButton.isVisible()) {
        await styleButton.click();
      }
    }
  }

  /**
   * Get current map style
   */
  async getCurrentMapStyle(): Promise<string> {
    if (await this.hasMapStyleController()) {
      const activeStyle = this.mapStyleController.locator('button[aria-pressed="true"]');
      if (await activeStyle.isVisible()) {
        return await activeStyle.textContent() || '';
      }
    }
    return '';
  }

  /**
   * Zoom in on map
   */
  async zoomIn() {
    const zoomInButton = this.page.locator('.leaflet-control-zoom-in, [data-testid="zoom-in"]');
    if (await zoomInButton.isVisible()) {
      await zoomInButton.click();
    }
  }

  /**
   * Zoom out on map
   */
  async zoomOut() {
    const zoomOutButton = this.page.locator('.leaflet-control-zoom-out, [data-testid="zoom-out"]');
    if (await zoomOutButton.isVisible()) {
      await zoomOutButton.click();
    }
  }

  /**
   * Get map zoom level
   */
  async getZoomLevel(): Promise<number> {
    return await this.page.evaluate(() => {
      // This would need to be implemented based on your map library
      // For Leaflet, you'd access the map instance
      return 10; // Placeholder
    });
  }

  /**
   * Check if there are any spots displayed
   */
  async hasSpots(): Promise<boolean> {
    const markerCount = await this.getMarkerCount();
    const sidebarCount = await this.getSidebarSpotsCount();
    return markerCount > 0 || sidebarCount > 0;
  }

  /**
   * Wait for spots to load
   */
  async waitForSpots(timeout: number = 10000) {
    await this.page.waitForFunction(
      () => {
        const markers = document.querySelectorAll('.leaflet-marker-icon, [data-testid="map-marker"]');
        const sidebarSpots = document.querySelectorAll('[data-testid="sidebar-spot"], .MuiListItem-root');
        return markers.length > 0 || sidebarSpots.length > 0;
      },
      { timeout }
    );
  }

  /**
   * Get filter count
   */
  async getFilterCount(): Promise<number> {
    return await this.page.locator('[data-testid="filter-chip"], .MuiChip-root').count();
  }

  /**
   * Clear all filters
   */
  async clearAllFilters() {
    const clearButton = this.page.getByRole('button', { name: /clear all filters/i });
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await this.helpers.waitForPageLoad();
    }
  }

  /**
   * Check if page has errors
   */
  async hasErrors(): Promise<boolean> {
    return await this.helpers.hasPageErrors();
  }

  /**
   * Get page performance metrics
   */
  async getPerformanceMetrics() {
    return await this.helpers.getPerformanceMetrics();
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.helpers.takeScreenshot(`map-${name}`);
  }

  /**
   * Set mobile viewport
   */
  async setMobileViewport() {
    await this.helpers.setMobileViewport();
  }

  /**
   * Set desktop viewport
   */
  async setDesktopViewport() {
    await this.helpers.setDesktopViewport();
  }

  /**
   * Check if page is responsive
   */
  async isResponsive(): Promise<boolean> {
    const viewport = this.page.viewportSize();
    if (!viewport) return false;
    
    const isMobile = viewport.width < 768;
    
    if (isMobile) {
      // On mobile, sidebar should be collapsible
      return await this.sidebarToggle.isVisible();
    } else {
      // On desktop, sidebar should be visible by default
      return await this.sidebar.isVisible();
    }
  }

  /**
   * Wait for geolocation to complete
   */
  async waitForGeolocation(timeout: number = 10000) {
    // Wait for either success or error
    await Promise.race([
      this.mapContainer.waitFor({ timeout }),
      this.errorMessage.waitFor({ timeout }),
      this.geolocationError.waitFor({ timeout })
    ]);
  }

  /**
   * Check if user location is displayed
   */
  async hasUserLocation(): Promise<boolean> {
    return await this.helpers.elementExists('.leaflet-marker-icon[data-testid="user-location"]');
  }

  /**
   * Get user location marker
   */
  getUserLocationMarker(): Locator {
    return this.page.locator('.leaflet-marker-icon[data-testid="user-location"]');
  }
}
