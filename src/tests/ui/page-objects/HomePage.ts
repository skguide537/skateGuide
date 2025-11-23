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
    // Wait for Redux to be ready
    await this.helpers.waitForReduxReady();
    // Wait for home page slices to be loaded
    await this.helpers.waitForHomeSlicesReady();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForLoad() {
    // Wait for Redux and slices first
    await this.helpers.waitForReduxReady();
    await this.helpers.waitForHomeSlicesReady();
    // Wait for filter bar instead of hero heading (which is commented out)
    await this.helpers.waitForElement('[data-testid="search-filter-bar"]', 10000).catch(() => {
      // Fallback: wait for any skatepark card to appear
      return this.page.waitForSelector('.MuiCard-root', { timeout: 10000 });
    });
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
    // Check if virtual scrolling container exists and has cards
    const virtualContainer = this.page.locator('.MuiBox-root.css-1f2autu');
    const isVisible = await virtualContainer.isVisible();
    
    if (!isVisible) {
      return 0;
    }
    
    // Count cards within the virtual container
    const cards = virtualContainer.locator('.MuiCard-root');
    return await cards.count();
  }

  /**
   * Get skatepark card by index
   */
  async getSkateparkCard(index: number): Promise<Locator> {
    // Find cards within the virtual scrolling container
    const virtualContainer = this.page.locator('.MuiBox-root.css-1f2autu');
    const cards = virtualContainer.locator('.MuiCard-root');
    
    const count = await cards.count();
    if (count <= index) {
      throw new Error(`No skatepark card found at index ${index}. Found ${count} cards.`);
    }
    
    return cards.nth(index);
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
    // Look for MUI Typography components and standard headings
    const titleElement = card.locator('h3, h4, h5, h6, [class*="MuiTypography-root MuiTypography-h6 css-1gtdv9s-MuiTypography-root"]').first();
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
      'text=/\\d+\\.\\d+\\s*km/i',  // "X.X km" format (your app's format)
      'text=/\\d+\\s*km/i',  // "X km" format
      'text=/\\d+\\s*m\\s*away/i',  // "X m away" format
      'text=/\\d+\\.\\d+\\s*m\\s*away/i',  // "X.X m away" format
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
  

  /**
   * Check if pagination is visible (Note: App uses virtual scrolling, not pagination)
   */
  async hasPagination(): Promise<boolean> {
    // Since the app uses virtual scrolling, pagination is not available
    // Return false to skip pagination-related tests
    return false;
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
  async waitForSkateparkCards(timeout: number = 30000) {
    // First wait for the parks API to return successfully
    await this.helpers.waitForApiCall('/api/skateparks', timeout).catch(() => {});

    // Wait for the virtual scrolling container to appear
    const virtualContainerSelector = '.MuiBox-root.css-1f2autu';
    
    try {
      await expect(this.page.locator(virtualContainerSelector)).toBeVisible({ timeout });
      console.log('✅ Virtual scrolling container found');
    } catch (error) {
      throw new Error(`Virtual scrolling container not found with selector: ${virtualContainerSelector}`);
    }
  }

  /**
   * Check if cards are displayed
   */
  async hasSkateparkCards(): Promise<boolean> {
    // Check for skatepark cards directly (more reliable than virtual container selector)
    try {
      const cards = this.page.locator('.MuiCard-root');
      await cards.first().waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
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
