import { Page, expect, Locator } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * Page Object Model for Home Page
 * Encapsulates all home page interactions and assertions
 */
export class HomePage {
  private helpers: TestHelpers;

  // Page elements
  readonly welcomeHeading: Locator;
  readonly subtitle: Locator;
  readonly exploreMapButton: Locator;
  readonly navbarMapLink: Locator;
  readonly addSpotButton: Locator;
  readonly skateparkCardsContainer: Locator;
  readonly loadingSection: Locator;
  readonly pagination: Locator;
  readonly filterBar: Locator;

  constructor(public page: Page) {
    this.helpers = new TestHelpers(page);
    
    // Initialize locators
    this.welcomeHeading = page.getByRole('heading', { name: /welcome to skateguide/i });
    this.subtitle = page.getByText(/discover, rate, and share skateparks around the city/i);
    this.exploreMapButton = page.getByRole('button', { name: /explore the map/i });
    this.navbarMapLink = page.locator('a[href="/map"]').first();
    this.addSpotButton = page.getByRole('button', { name: /add spot/i });
    this.skateparkCardsContainer = page.locator('[class*="Card"], article, [data-testid*="card"], [class*="grid"] > div, [class*="list"] > div').first();
    this.loadingSection = page.getByText('Loading Skateparks');
    this.pagination = page.locator('.MuiPagination-root');
    this.filterBar = page.locator('[data-testid="search-filter-bar"]');
  }

  /**
   * Navigate to home page
   */
  async goto() {
    await this.page.goto('/');
    await this.helpers.waitForPageLoad();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForLoad() {
    await this.helpers.waitForElement('#home-welcome-heading');
    await this.helpers.waitForLoadingToComplete();
  }

  /**
   * Check if page is loaded correctly
   */
  async isLoaded(): Promise<boolean> {
    try {
      await this.welcomeHeading.waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the number of skatepark cards displayed
   */
  async getSkateparkCardCount(): Promise<number> {
    // Use a more resilient approach to count cards
    const cardSelectors = [
      '[class*="Card"]',
      'article',
      '[data-testid*="card"]',
      '[class*="grid"] > div',
      '[class*="list"] > div'
    ];
    
    let totalCount = 0;
    for (const selector of cardSelectors) {
      const count = await this.page.locator(selector).count();
      totalCount = Math.max(totalCount, count);
    }
    
    return totalCount;
  }

  /**
   * Get skatepark card by index
   */
  async getSkateparkCard(index: number): Promise<Locator> {
    // Use resilient selectors to find cards
    const cardSelectors = [
      '[class*="Card"]',
      'article',
      '[data-testid*="card"]',
      '[class*="grid"] > div',
      '[class*="list"] > div'
    ];
    
    // Try each selector until we find one that has cards
    for (const selector of cardSelectors) {
      const cards = this.page.locator(selector);
      const count = await cards.count();
      if (count > index) {
        return cards.nth(index);
      }
    }
    
    // Fallback to the first available selector
    return this.page.locator(cardSelectors[0]).nth(index);
  }

  /**
   * Click on a skatepark card
   */
  async clickSkateparkCard(index: number) {
    const card = await this.getSkateparkCard(index);
    await card.click();
  }

  /**
   * Get card title by index
   */
  async getCardTitle(index: number): Promise<string> {
    const card = await this.getSkateparkCard(index);
    const titleElement = card.locator('h3, h4, h5, h6, [data-testid="card-title"]').first();
    return await titleElement.textContent() || '';
  }

  /**
   * Get card rating by index
   */
  async getCardRating(index: number): Promise<number> {
    const card = await this.getSkateparkCard(index);
    
    // Try to find rating in different formats
    const ratingSelectors = [
      'text=/\\d+\\.\\d+/',  // Direct number format
      '[data-testid*="rating"]',  // Rating component
      '.MuiRating-root',  // MUI Rating component
      'text=/\\d+/',  // Integer format
    ];
    
    for (const selector of ratingSelectors) {
      try {
        const ratingElement = card.locator(selector).first();
        if (await ratingElement.isVisible()) {
          const ratingText = await ratingElement.textContent();
          if (ratingText) {
            const rating = parseFloat(ratingText);
            if (!isNaN(rating)) {
              return rating;
            }
          }
        }
      } catch {
        // Continue to next selector
      }
    }
    
    // If no rating found, return 0
    return 0;
  }

  /**
   * Get card distance by index
   */
  async getCardDistance(index: number): Promise<string> {
    const card = await this.getSkateparkCard(index);
    
    // Try to find distance in different formats
    const distanceSelectors = [
      'text=/\\d+\\.\\d+\\s*km/i',  // "X.X km" format
      'text=/\\d+\\s*km/i',  // "X km" format
      'text=/distance:/i',  // "Distance: X" format
      'text=/from your location/i',  // "X.X km from your location" format
    ];
    
    for (const selector of distanceSelectors) {
      try {
        const distanceElement = card.locator(selector).first();
        if (await distanceElement.isVisible()) {
          const distanceText = await distanceElement.textContent();
          if (distanceText) {
            return distanceText.trim();
          }
        }
      } catch {
        // Continue to next selector
      }
    }
    
    // If no distance found, return empty string
    return '';
  }

  /**
   * Check if loading state is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.helpers.elementExists('text=Loading Skateparks');
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete() {
    await this.helpers.waitForLoadingToComplete();
  }

  /**
   * Check if pagination is visible
   */
  async hasPagination(): Promise<boolean> {
    return await this.helpers.elementExists('.MuiPagination-root');
  }

  /**
   * Get current page number
   */
  async getCurrentPage(): Promise<number> {
    const pageInfo = await this.page.getByText(/page \d+ of \d+/i).textContent();
    if (!pageInfo) return 1;
    
    const match = pageInfo.match(/page (\d+) of \d+/i);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Get total pages
   */
  async getTotalPages(): Promise<number> {
    const pageInfo = await this.page.getByText(/page \d+ of \d+/i).textContent();
    if (!pageInfo) return 1;
    
    const match = pageInfo.match(/page \d+ of (\d+)/i);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Navigate to next page
   */
  async goToNextPage() {
    const nextButton = this.pagination.locator('button[aria-label="Go to next page"]');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await this.helpers.waitForPageLoad();
    }
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage() {
    const prevButton = this.pagination.locator('button[aria-label="Go to previous page"]');
    if (await prevButton.isVisible()) {
      await prevButton.click();
      await this.helpers.waitForPageLoad();
    }
  }

  /**
   * Navigate to specific page
   */
  async goToPage(pageNumber: number) {
    const pageButton = this.pagination.locator(`button:has-text("${pageNumber}")`);
    if (await pageButton.isVisible()) {
      await pageButton.click();
      await this.helpers.waitForPageLoad();
    }
  }

  /**
   * Click explore map button
   */
  async clickExploreMap() {
    // Prefer navbar link if available for stable navigation
    try {
      if (await this.navbarMapLink.isVisible({ timeout: 2000 })) {
        await this.navbarMapLink.scrollIntoViewIfNeeded().catch(() => {});
        await this.navbarMapLink.click();
      } else {
        await this.exploreMapButton.scrollIntoViewIfNeeded().catch(() => {});
        await this.exploreMapButton.click();
      }
    } catch {
      // Fallback to CTA button if navbar link fails
      await this.exploreMapButton.click();
    }
    await this.helpers.waitForNavigation('/map', 20000);
  }

  /**
   * Click add spot button
   */
  async clickAddSpot() {
    if (await this.addSpotButton.isVisible() && !(await this.addSpotButton.isDisabled())) {
      await this.addSpotButton.click();
      await this.helpers.waitForNavigation('/add-spot');
    }
  }

  /**
   * Check if add spot button is enabled
   */
  async isAddSpotEnabled(): Promise<boolean> {
    try {
      return await this.addSpotButton.isEnabled({ timeout: 5000 });
    } catch {
      return false;
    }
  }

  /**
   * Wait for skatepark cards to load
   */
  async waitForSkateparkCards(timeout: number = 10000) {
    // Wait for any card-like content to appear
    const cardSelectors = [
      '[class*="Card"]',
      'article',
      '[data-testid*="card"]',
      '[class*="grid"] > div',
      '[class*="list"] > div'
    ];
    
    let found = false;
    for (const selector of cardSelectors) {
      try {
        await expect(this.page.locator(selector).first()).toBeVisible({ timeout: 2000 });
        found = true;
        break;
      } catch {
        // Continue to next selector
      }
    }
    
    if (!found) {
      throw new Error(`No skatepark cards found with any of the selectors: ${cardSelectors.join(', ')}`);
    }
  }

  /**
   * Check if cards are displayed
   */
  async hasSkateparkCards(): Promise<boolean> {
    const count = await this.getSkateparkCardCount();
    return count > 0;
  }

  /**
   * Get all card titles
   */
  async getAllCardTitles(): Promise<string[]> {
    const count = await this.getSkateparkCardCount();
    const titles: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const title = await this.getCardTitle(i);
      titles.push(title);
    }
    
    return titles;
  }

  /**
   * Get all card ratings
   */
  async getAllCardRatings(): Promise<number[]> {
    const count = await this.getSkateparkCardCount();
    const ratings: number[] = [];
    
    for (let i = 0; i < count; i++) {
      const rating = await this.getCardRating(i);
      ratings.push(rating);
    }
    
    return ratings;
  }

  /**
   * Check if filter bar is visible
   */
  async hasFilterBar(): Promise<boolean> {
    return await this.helpers.elementExists('[data-testid="search-filter-bar"]');
  }

  /**
   * Get filter summary text
   */
  async getFilterSummary(): Promise<string> {
    try {
      const summaryElement = this.page.locator('[data-testid="filter-summary"]');
      if (await summaryElement.isVisible({ timeout: 2000 })) {
        return await summaryElement.textContent() || '';
      }
    } catch {
      // Element not found or not visible
    }
    return '';
  }

  /**
   * Check if there are active filters
   */
  async hasActiveFilters(): Promise<boolean> {
    return await this.helpers.elementExists('[data-testid="active-filters"]');
  }

  /**
   * Get active filter count
   */
  async getActiveFilterCount(): Promise<number> {
    const activeFilters = this.page.locator('[data-testid="active-filters"] [data-testid="filter-chip"]');
    return await activeFilters.count();
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
    await this.helpers.takeScreenshot(`home-${name}`);
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
    
    // Check if content is properly sized for viewport
    const isMobile = viewport.width < 768;
    const isDesktop = viewport.width >= 1200;
    
    if (isMobile) {
      // On mobile, check if content fits
      return await this.welcomeHeading.isVisible();
    } else if (isDesktop) {
      // On desktop, check if we have more cards
      const cardCount = await this.getSkateparkCardCount();
      return cardCount >= 4; // Desktop should show more cards
    }
    
    return true;
  }
}
