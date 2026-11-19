import { Page, expect, Locator } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Page Object Model for SearchFilterBar Component
 * Encapsulates all filter interactions and assertions
 */
export class SearchFilterBar {
  private helpers: TestHelpers;

  // Main container
  readonly container: Locator;
  readonly header: Locator;

  // Search and sort
  readonly searchInput: Locator;
  readonly sortSelect: Locator;

  // Filter summary
  readonly filterSummary: Locator;
  readonly activeFilters: Locator;
  readonly clearAllButton: Locator;

  // Filter controls
  readonly filterToggle: Locator;
  readonly filtersSection: Locator;

  // Type filter
  readonly typeFilter: Locator;
  readonly typeAll: Locator;
  readonly typePark: Locator;
  readonly typeStreet: Locator;

  // Size filter
  readonly sizeFilter: Locator;
  readonly sizeSmall: Locator;
  readonly sizeMedium: Locator;
  readonly sizeLarge: Locator;

  // Level filter
  readonly levelFilter: Locator;
  readonly levelBeginner: Locator;
  readonly levelIntermediate: Locator;
  readonly levelAdvanced: Locator;

  // Tag filter
  readonly tagFilter: Locator;

  // Distance filter
  readonly distanceFilter: Locator;
  readonly distanceToggle: Locator;
  readonly distanceSlider: Locator;
  readonly distanceValue: Locator;

  // Rating filter
  readonly ratingFilter: Locator;
  readonly ratingToggle: Locator;
  readonly ratingSlider: Locator;
  readonly ratingValue: Locator;

  // Favorites filter
  readonly favoritesFilter: Locator;
  readonly favoritesToggle: Locator;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
    
    // Initialize locators
    this.container = page.locator('[data-testid="search-filter-bar"]');
    this.header = page.locator('text=/🔍 Search & Filter Skate Spots/i');
    
    // Search and sort
    this.searchInput = page.locator('input[placeholder*="search"], [data-testid="search-input"]');
    this.sortSelect = page.locator('[data-testid="sort-select"], .MuiSelect-root');
    
    // Filter summary
    this.filterSummary = page.locator('[data-testid="filter-summary"]');
    this.activeFilters = page.locator('[data-testid="active-filters"]');
    this.clearAllButton = page.getByRole('button', { name: /clear all filters/i });
    
    // Filter controls
    this.filterToggle = page.locator('[data-testid="filter-toggle"], button:has-text("Filter")');
    this.filtersSection = page.locator('[data-testid="filters-section"]');
    
    // Type filter
    this.typeFilter = page.locator('[data-testid="type-filter"]');
    this.typeAll = page.locator('input[value="all"], [data-testid="type-all"]');
    this.typePark = page.locator('input[value="park"], [data-testid="type-park"]');
    this.typeStreet = page.locator('input[value="street"], [data-testid="type-street"]');
    
    // Size filter
    this.sizeFilter = page.locator('[data-testid="size-filter"]');
    this.sizeSmall = page.locator('input[value="small"], [data-testid="size-small"]');
    this.sizeMedium = page.locator('input[value="medium"], [data-testid="size-medium"]');
    this.sizeLarge = page.locator('input[value="large"], [data-testid="size-large"]');
    
    // Level filter
    this.levelFilter = page.locator('[data-testid="level-filter"]');
    this.levelBeginner = page.locator('input[value="beginner"], [data-testid="level-beginner"]');
    this.levelIntermediate = page.locator('input[value="intermediate"], [data-testid="level-intermediate"]');
    this.levelAdvanced = page.locator('input[value="advanced"], [data-testid="level-advanced"]');
    
    // Tag filter
    this.tagFilter = page.locator('[data-testid="tag-filter"]');
    
    // Distance filter
    this.distanceFilter = page.locator('[data-testid="distance-filter"]');
    this.distanceToggle = page.locator('[data-testid="distance-toggle"]');
    this.distanceSlider = page.locator('[data-testid="distance-slider"]');
    this.distanceValue = page.locator('[data-testid="distance-value"]');
    
    // Rating filter
    this.ratingFilter = page.locator('[data-testid="rating-filter"]');
    this.ratingToggle = page.locator('[data-testid="rating-toggle"]');
    this.ratingSlider = page.locator('[data-testid="rating-slider"]');
    this.ratingValue = page.locator('[data-testid="rating-value"]');
    
    // Favorites filter
    this.favoritesFilter = page.locator('[data-testid="favorites-filter"]');
    this.favoritesToggle = page.locator('[data-testid="favorites-toggle"]');
  }

  /**
   * Check if filter bar is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.container.isVisible();
  }

  /**
   * Wait for filter bar to load
   */
  async waitForLoad() {
    await this.container.waitFor({ timeout: 10000 });
  }

  /**
   * Search for skateparks
   */
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.helpers.waitForPageLoad();
  }

  /**
   * Clear search
   */
  async clearSearch() {
    await this.searchInput.clear();
    await this.searchInput.press('Enter');
    await this.helpers.waitForPageLoad();
  }

  /**
   * Get search value
   */
  async getSearchValue(): Promise<string> {
    return await this.searchInput.inputValue();
  }

  /**
   * Change sort order
   */
  async changeSort(sortBy: 'distance' | 'rating' | 'recent') {
    await this.sortSelect.click();
    const option = this.page.locator(`[data-value="${sortBy}"], text="${sortBy}"`);
    await option.click();
    await this.helpers.waitForPageLoad();
  }

  /**
   * Get current sort value
   */
  async getCurrentSort(): Promise<string> {
    return await this.sortSelect.textContent() || '';
  }

  /**
   * Toggle filters section
   */
  async toggleFilters() {
    await this.filterToggle.click();
    await this.helpers.waitForPageLoad();
  }

  /**
   * Check if filters are expanded
   */
  async areFiltersExpanded(): Promise<boolean> {
    return await this.filtersSection.isVisible();
  }

  /**
   * Set type filter
   */
  async setTypeFilter(type: 'all' | 'park' | 'street') {
    await this.toggleFilters();
    
    switch (type) {
      case 'all':
        await this.typeAll.click();
        break;
      case 'park':
        await this.typePark.click();
        break;
      case 'street':
        await this.typeStreet.click();
        break;
    }
    
    await this.helpers.waitForPageLoad();
  }

  /**
   * Get current type filter
   */
  async getCurrentTypeFilter(): Promise<string> {
    if (await this.typeAll.isChecked()) return 'all';
    if (await this.typePark.isChecked()) return 'park';
    if (await this.typeStreet.isChecked()) return 'street';
    return 'all';
  }

  /**
   * Set size filter
   */
  async setSizeFilter(sizes: string[]) {
    await this.toggleFilters();
    
    // Clear existing selections
    if (await this.sizeSmall.isChecked()) await this.sizeSmall.click();
    if (await this.sizeMedium.isChecked()) await this.sizeMedium.click();
    if (await this.sizeLarge.isChecked()) await this.sizeLarge.click();
    
    // Select new sizes
    for (const size of sizes) {
      switch (size) {
        case 'small':
          await this.sizeSmall.click();
          break;
        case 'medium':
          await this.sizeMedium.click();
          break;
        case 'large':
          await this.sizeLarge.click();
          break;
      }
    }
    
    await this.helpers.waitForPageLoad();
  }

  /**
   * Get current size filters
   */
  async getCurrentSizeFilters(): Promise<string[]> {
    const sizes: string[] = [];
    if (await this.sizeSmall.isChecked()) sizes.push('small');
    if (await this.sizeMedium.isChecked()) sizes.push('medium');
    if (await this.sizeLarge.isChecked()) sizes.push('large');
    return sizes;
  }

  /**
   * Set level filter
   */
  async setLevelFilter(levels: string[]) {
    await this.toggleFilters();
    
    // Clear existing selections
    if (await this.levelBeginner.isChecked()) await this.levelBeginner.click();
    if (await this.levelIntermediate.isChecked()) await this.levelIntermediate.click();
    if (await this.levelAdvanced.isChecked()) await this.levelAdvanced.click();
    
    // Select new levels
    for (const level of levels) {
      switch (level) {
        case 'beginner':
          await this.levelBeginner.click();
          break;
        case 'intermediate':
          await this.levelIntermediate.click();
          break;
        case 'advanced':
          await this.levelAdvanced.click();
          break;
      }
    }
    
    await this.helpers.waitForPageLoad();
  }

  /**
   * Get current level filters
   */
  async getCurrentLevelFilters(): Promise<string[]> {
    const levels: string[] = [];
    if (await this.levelBeginner.isChecked()) levels.push('beginner');
    if (await this.levelIntermediate.isChecked()) levels.push('intermediate');
    if (await this.levelAdvanced.isChecked()) levels.push('advanced');
    return levels;
  }

  /**
   * Set tag filter
   */
  async setTagFilter(tags: string[]) {
    await this.toggleFilters();
    
    // Clear existing selections
    const existingTags = this.page.locator('[data-testid="tag-chip"]');
    const count = await existingTags.count();
    for (let i = 0; i < count; i++) {
      await existingTags.nth(i).click();
    }
    
    // Select new tags
    for (const tag of tags) {
      const tagButton = this.page.locator(`button:has-text("${tag}"), [data-testid="tag-${tag}"]`);
      if (await tagButton.isVisible()) {
        await tagButton.click();
      }
    }
    
    await this.helpers.waitForPageLoad();
  }

  /**
   * Get current tag filters
   */
  async getCurrentTagFilters(): Promise<string[]> {
    const tags: string[] = [];
    const tagChips = this.page.locator('[data-testid="tag-chip"]');
    const count = await tagChips.count();
    
    for (let i = 0; i < count; i++) {
      const tagText = await tagChips.nth(i).textContent();
      if (tagText) tags.push(tagText);
    }
    
    return tags;
  }

  /**
   * Toggle distance filter
   */
  async toggleDistanceFilter(enabled: boolean) {
    await this.toggleFilters();
    
    const isCurrentlyEnabled = await this.distanceToggle.isChecked();
    if (isCurrentlyEnabled !== enabled) {
      await this.distanceToggle.click();
    }
    
    await this.helpers.waitForPageLoad();
  }

  /**
   * Set distance filter value
   */
  async setDistanceFilter(distance: number) {
    await this.toggleFilters();
    await this.toggleDistanceFilter(true);
    
    // Set slider value
    await this.distanceSlider.fill(distance.toString());
    await this.distanceSlider.press('Enter');
    
    await this.helpers.waitForPageLoad();
  }

  /**
   * Get current distance filter value
   */
  async getCurrentDistanceFilter(): Promise<number> {
    const valueText = await this.distanceValue.textContent();
    return valueText ? parseFloat(valueText) : 0;
  }

  /**
   * Check if distance filter is enabled
   */
  async isDistanceFilterEnabled(): Promise<boolean> {
    return await this.distanceToggle.isChecked();
  }

  /**
   * Toggle rating filter
   */
  async toggleRatingFilter(enabled: boolean) {
    await this.toggleFilters();
    
    const isCurrentlyEnabled = await this.ratingToggle.isChecked();
    if (isCurrentlyEnabled !== enabled) {
      await this.ratingToggle.click();
    }
    
    await this.helpers.waitForPageLoad();
  }

  /**
   * Set rating filter range
   */
  async setRatingFilter(minRating: number, maxRating: number) {
    await this.toggleFilters();
    await this.toggleRatingFilter(true);
    
    // Set slider values (this would need to be implemented based on your slider component)
    // For now, we'll just verify the values are set
    await this.helpers.waitForPageLoad();
  }

  /**
   * Get current rating filter range
   */
  async getCurrentRatingFilter(): Promise<[number, number]> {
    const valueText = await this.ratingValue.textContent();
    if (!valueText) return [0, 5];
    
    const match = valueText.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    if (match) {
      return [parseFloat(match[1]), parseFloat(match[2])];
    }
    
    return [0, 5];
  }

  /**
   * Check if rating filter is enabled
   */
  async isRatingFilterEnabled(): Promise<boolean> {
    return await this.ratingToggle.isChecked();
  }

  /**
   * Toggle favorites filter
   */
  async toggleFavoritesFilter(enabled: boolean) {
    await this.toggleFilters();
    
    const isCurrentlyEnabled = await this.favoritesToggle.isChecked();
    if (isCurrentlyEnabled !== enabled) {
      await this.favoritesToggle.click();
    }
    
    await this.helpers.waitForPageLoad();
  }

  /**
   * Check if favorites filter is enabled
   */
  async isFavoritesFilterEnabled(): Promise<boolean> {
    return await this.favoritesToggle.isChecked();
  }

  /**
   * Clear all filters
   */
  async clearAllFilters() {
    await this.clearAllButton.click();
    await this.helpers.waitForPageLoad();
  }

  /**
   * Get filter summary text
   */
  async getFilterSummary(): Promise<string> {
    return await this.filterSummary.textContent() || '';
  }

  /**
   * Get active filter count
   */
  async getActiveFilterCount(): Promise<number> {
    return await this.page.locator('[data-testid="filter-chip"], .MuiChip-root').count();
  }

  /**
   * Get active filter names
   */
  async getActiveFilterNames(): Promise<string[]> {
    const filters: string[] = [];
    const filterChips = this.page.locator('[data-testid="filter-chip"], .MuiChip-root');
    const count = await filterChips.count();
    
    for (let i = 0; i < count; i++) {
      const filterText = await filterChips.nth(i).textContent();
      if (filterText) filters.push(filterText);
    }
    
    return filters;
  }

  /**
   * Check if there are active filters
   */
  async hasActiveFilters(): Promise<boolean> {
    return await this.activeFilters.isVisible();
  }

  /**
   * Get filtered count
   */
  async getFilteredCount(): Promise<number> {
    const summaryText = await this.getFilterSummary();
    const match = summaryText.match(/(\d+)\s*of\s*(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get total count
   */
  async getTotalCount(): Promise<number> {
    const summaryText = await this.getFilterSummary();
    const match = summaryText.match(/(\d+)\s*of\s*(\d+)/);
    return match ? parseInt(match[2]) : 0;
  }

  /**
   * Check if filter bar is responsive
   */
  async isResponsive(): Promise<boolean> {
    const viewport = this.page.viewportSize();
    if (!viewport) return false;
    
    const isMobile = viewport.width < 768;
    
    if (isMobile) {
      // On mobile, filters should be collapsible
      return await this.filterToggle.isVisible();
    } else {
      // On desktop, filters might be always visible
      return await this.container.isVisible();
    }
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.helpers.takeScreenshot(`filter-bar-${name}`);
  }

  /**
   * Get all available filter options
   */
  async getAvailableFilterOptions(): Promise<{
    sizes: string[];
    levels: string[];
    tags: string[];
  }> {
    await this.toggleFilters();
    
    const sizes: string[] = [];
    const levels: string[] = [];
    const tags: string[] = [];
    
    // Get available sizes
    if (await this.sizeSmall.isVisible()) sizes.push('small');
    if (await this.sizeMedium.isVisible()) sizes.push('medium');
    if (await this.sizeLarge.isVisible()) sizes.push('large');
    
    // Get available levels
    if (await this.levelBeginner.isVisible()) levels.push('beginner');
    if (await this.levelIntermediate.isVisible()) levels.push('intermediate');
    if (await this.levelAdvanced.isVisible()) levels.push('advanced');
    
    // Get available tags
    const tagButtons = this.page.locator('[data-testid="tag-option"], button[data-testid*="tag"]');
    const tagCount = await tagButtons.count();
    for (let i = 0; i < tagCount; i++) {
      const tagText = await tagButtons.nth(i).textContent();
      if (tagText) tags.push(tagText);
    }
    
    return { sizes, levels, tags };
  }
}
