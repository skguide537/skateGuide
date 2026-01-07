import { Page, expect } from '@playwright/test';

/**
 * Test utilities for Playwright UI tests
 * These helpers work with real data instead of mocks
 */

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export interface TestSkatepark {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  photoNames: string[];
  location: {
    coordinates: [number, number];
  };
  isPark: boolean;
  size: string;
  levels: string[];
  avgRating: number;
  distance?: number;
}

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Set up geolocation for tests
   */
  async setupGeolocation(lat: number = 32.073, lng: number = 34.789) {
    await this.page.addInitScript(({ lat, lng }) => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: any, error: any) => {
            // Simulate successful geolocation
            setTimeout(() => {
              success({
                coords: {
                  latitude: lat,
                  longitude: lng,
                  accuracy: 10,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null
                },
                timestamp: Date.now()
              });
            }, 100);
          }
        },
        configurable: true
      });
    }, { lat, lng });
  }

  /**
   * Set up geolocation error for tests
   */
  async setupGeolocationError(errorCode: number = 1, message: string = 'User denied geolocation') {
    await this.page.addInitScript(({ errorCode, message }) => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: any, error: any) => {
            error({
              code: errorCode,
              message
            });
          }
        },
        configurable: true
      });
    }, { errorCode, message });
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(timeout: number = 10000) {
    // Use domcontentloaded instead of networkidle for more reliable loading
    await this.page.waitForLoadState('domcontentloaded', { timeout });
    // Add a small delay to ensure all components are rendered
    await this.page.waitForTimeout(1000);
  }

  /**
   * Wait for Redux store to be ready (essential slices loaded)
   */
  async waitForReduxReady(timeout: number = 10000) {
    try {
      await this.page.waitForSelector('body[data-redux-ready="true"]', { timeout });
    } catch {
      // If attribute doesn't appear, continue anyway (might be SSR or already ready)
      console.warn('Redux readiness attribute not found, continuing...');
    }
  }

  /**
   * Wait for home page slices to be ready (parks, filters, favorites, geolocation)
   */
  async waitForHomeSlicesReady(timeout: number = 15000) {
    try {
      await this.page.waitForSelector('body[data-home-slices-ready="true"]', { timeout });
    } catch {
      // If attribute doesn't appear, wait a bit more for slices to load
      await this.page.waitForTimeout(2000);
      console.warn('Home slices readiness attribute not found, continuing...');
    }
  }

  /**
   * Wait for element to be visible with custom timeout
   */
  async waitForElement(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Wait for API call to complete
   * Handles both future calls and already-completed calls
   */
  async waitForApiCall(urlPattern: string, timeout: number = 10000) {
    // Set up listener BEFORE checking if it already happened
    const responsePromise = this.page.waitForResponse(response => 
      response.url().includes(urlPattern) && response.status() === 200,
      { timeout }
    ).catch(() => null);

    // Check if it already happened using network request interception
    // If we're already on the page, the call might have happened
    // So we'll wait a short time to see if responsePromise resolves
    const quickCheck = Promise.race([
      responsePromise,
      new Promise(resolve => setTimeout(() => resolve('timeout'), 100))
    ]);

    const result = await quickCheck;
    
    if (result === 'timeout') {
      // Call might have already happened, check network logs
      // Or just wait for the response promise (which will timeout if not happening)
      await responsePromise;
    }
  }

  /**
   * Wait for favorites to load by checking if favorite buttons are interactive
   */
  async waitForFavoritesToLoad(timeout: number = 15000) {
    try {
      // First wait for Redux and home slices to be ready
      await this.waitForReduxReady(timeout);
      await this.waitForHomeSlicesReady(timeout);
      
      // Wait for favorites API call to complete (if user is logged in)
      await this.waitForApiCall('/api/favorites', timeout).catch(() => {
        // If no favorites API call (user not logged in), that's okay
        console.log('No favorites API call detected (user may not be logged in)');
      });
      
      // Wait for at least one favorite button to be visible and interactive
      await this.page.waitForSelector('.MuiCard-root', { timeout });
      const firstCard = this.page.locator('.MuiCard-root').first();
      const favoriteButton = firstCard.getByTestId('favorite-toggle').first();
      await favoriteButton.waitFor({ state: 'visible', timeout });
      
      // Additional wait to ensure favorites slice has loaded
      await this.page.waitForTimeout(1000);
    } catch (error) {
      console.warn('Favorites may not have loaded properly:', error);
    }
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Check if element exists without throwing
   */
  async elementExists(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get element count
   */
  async getElementCount(selector: string): Promise<number> {
    return await this.page.locator(selector).count();
  }

  /**
   * Wait for loading state to disappear
   */
  

  /**
   * Clear all form inputs
   */
  async clearForm(formSelector: string = 'form') {
    const inputs = await this.page.locator(`${formSelector} input, ${formSelector} textarea, ${formSelector} select`);
    const count = await inputs.count();
    
    for (let i = 0; i < count; i++) {
      await inputs.nth(i).clear();
    }
  }

  /**
   * Fill form with data
   */
  async fillForm(formData: Record<string, string>, formSelector: string = 'form') {
    for (const [field, value] of Object.entries(formData)) {
      const input = this.page.locator(`${formSelector} [name="${field}"], ${formSelector} [data-testid="${field}"]`);
      await input.fill(value);
    }
  }

  /**
   * Wait for toast notification
   */
  async waitForToast(message?: string, timeout: number = 5000) {
    const toastSelector = '[role="alert"], .MuiAlert-root, [data-testid="toast"]';
    
    if (message) {
      await expect(this.page.locator(toastSelector).filter({ hasText: message })).toBeVisible({ timeout });
    } else {
      await expect(this.page.locator(toastSelector)).toBeVisible({ timeout });
    }
  }

  /**
   * Wait for modal to open
   */
  async waitForModal(modalSelector: string = '[role="dialog"], .MuiModal-root', timeout: number = 5000) {
    await expect(this.page.locator(modalSelector)).toBeVisible({ timeout });
  }

  /**
   * Close modal
   */
  async closeModal(modalSelector: string = '[role="dialog"], .MuiModal-root') {
    const closeButton = this.page.locator(`${modalSelector} [aria-label="close"], ${modalSelector} button[aria-label="Close"]`);
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation(urlPattern: string, timeout: number = 10000) {
    await this.page.waitForURL(urlPattern, { timeout });
  }

  /**
   * Perform UI login flow
   */
  async login(email: string, password: string) {
    await this.page.goto('/login');
    await this.waitForPageLoad();

    await this.page.getByRole('textbox', { name: /email\s*\*/i }).fill(email);
    await this.page.getByRole('textbox', { name: /email\s*\*/i }).press('Tab');
    await this.page.getByRole('textbox', { name: /password\s*\*/i }).fill(password);
    await this.page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation away from /login
    await this.page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 15000 }).catch(() => {});
    await this.waitForPageLoad();
  }

  /**
   * Perform UI logout flow
   */
  async logout() {
    // Prefer a stable navbar logout button accessible from anywhere
    const bannerLogout = this.page.getByRole('banner').getByRole('button').nth(3);
    if (await bannerLogout.isVisible({ timeout: 500 }).catch(() => false)) {
      await bannerLogout.click();
      await this.page.waitForTimeout(200);
      await this.page.waitForURL(url => url.pathname === '/login' || url.pathname === '/', { timeout: 5000 }).catch(() => {});
      await this.waitForPageLoad();
      return;
    }

    // Try common direct logout buttons first (no CSS selector unions)
    const directCandidates = [
      this.page.getByTestId('logout-button'),
      this.page.getByRole('button', { name: /logout/i }),
      this.page.getByRole('menuitem', { name: /logout/i }),
      this.page.getByText(/^logout$/i),
    ];

    for (const candidate of directCandidates) {
      if (await candidate.first().isVisible({ timeout: 500 }).catch(() => false)) {
        await candidate.first().click();
        await this.page.waitForTimeout(200);
        await this.page.waitForURL(url => url.pathname === '/login' || url.pathname === '/', { timeout: 5000 }).catch(() => {});
        await this.waitForPageLoad();
        return;
      }
    }

    // If not directly visible, open a possible user/account menu then click logout
    const menuCandidates = [
      this.page.getByTestId('user-menu'),
      this.page.getByRole('button', { name: /user|account|profile|menu|avatar/i }),
    ];

    for (const menuBtn of menuCandidates) {
      if (await menuBtn.first().isVisible({ timeout: 500 }).catch(() => false)) {
        await menuBtn.first().click();
        await this.page.waitForTimeout(300);
        const logoutAfterMenu = [
          this.page.getByRole('menuitem', { name: /logout/i }),
          this.page.getByRole('button', { name: /logout/i }),
          this.page.getByText(/^logout$/i),
          this.page.getByTestId('logout-button'),
        ];
        for (const item of logoutAfterMenu) {
          if (await item.first().isVisible({ timeout: 500 }).catch(() => false)) {
            await item.first().click();
            await this.page.waitForTimeout(200);
            await this.page.waitForURL(url => url.pathname === '/login' || url.pathname === '/', { timeout: 5000 }).catch(() => {});
            await this.waitForPageLoad();
            return;
          }
        }
      }
    }

    // As a last resort, navigate to /logout route if exists or clear cookies (not implemented here)
  }

  /**
   * Check if page has errors
   */
  async hasPageErrors(): Promise<boolean> {
    const errorSelectors = [
      '[data-testid="error"]',
      '.error',
      'text=/^Error:/i',
      'text=/^Failed:/i',
      'text=/Something went wrong/i'
    ];

    // Check for alert elements that are actually errors (not toast notifications)
    const alertElements = await this.page.locator('[role="alert"]').all();
    for (const alert of alertElements) {
      const text = await alert.textContent();
      if (text && (text.includes('Error') || text.includes('Failed') || text.includes('error'))) {
        console.log('Found error alert:', text);
        return true;
      }
    }

    for (const selector of errorSelectors) {
      if (await this.elementExists(selector)) {
        console.log('Found error with selector:', selector);
        return true;
      }
    }
    return false;
  }

  /**
   * Get page performance metrics
   */
  async getPerformanceMetrics() {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
  }

  /**
   * Simulate mobile viewport
   */
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  /**
   * Simulate desktop viewport
   */
  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1200, height: 800 });
  }

  /**
   * Wait for specific number of elements
   */
  async waitForElementCount(selector: string, count: number, timeout: number = 10000) {
    await expect(this.page.locator(selector)).toHaveCount(count, { timeout });
  }

  /**
   * Check if element is in viewport
   */
  async isElementInViewport(selector: string): Promise<boolean> {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }, selector);
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Wait for element to be in viewport
   */
  async waitForElementInViewport(selector: string, timeout: number = 5000) {
    await this.page.waitForFunction(
      (sel) => {
        const element = document.querySelector(sel);
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
      },
      selector,
      { timeout }
    );
  }
}

/**
 * Create test helpers instance
 */
export function createTestHelpers(page: Page): TestHelpers {
  return new TestHelpers(page);
}

/**
 * Common test data
 */
export const TEST_DATA = {
  users: {
    valid: {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    },
    admin: {
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User'
    }
  },
  
  skateparks: {
    sample: {
      _id: 'test-park-1',
      title: 'Test Skatepark',
      description: 'A test skatepark for testing purposes',
      tags: ['street', 'beginner'],
      photoNames: [],
      location: { coordinates: [32.073, 34.789] },
      isPark: true,
      size: 'medium',
      levels: ['beginner', 'intermediate'],
      avgRating: 4.2,
      distance: 0.5
    }
  },

  locations: {
    telAviv: { lat: 32.073, lng: 34.789 },
    newYork: { lat: 40.7128, lng: -74.0060 },
    london: { lat: 51.5074, lng: -0.1278 }
  }
};
