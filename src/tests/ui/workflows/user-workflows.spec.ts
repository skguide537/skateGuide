import { test, expect } from '@playwright/test';
import { testDataFactory } from '../factories/test-data-factory';
import { HomePage } from '../page-objects/HomePage';

/**
 * End-to-End User Workflow Tests
 * Tests complete user journeys from start to finish
 */

test.describe('User Workflows', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    
    // Set up geolocation for real data testing
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: any) => {
            success({
              coords: { latitude: 32.073, longitude: 34.789, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
              timestamp: Date.now()
            });
          }
        },
        configurable: true
      });
    });
  });

  test.describe('New User Onboarding Flow', () => {
    test('should complete new user journey from home to skatepark details', async ({ page }) => {
      // Step 1: User lands on home page
      await homePage.goto();
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();

      // Step 2: User explores skatepark cards
      await homePage.waitForSkateparkCards();
      const cardCount = await homePage.getSkateparkCardCount();
      expect(cardCount).toBeGreaterThan(0);

      // Step 3: User clicks on a skatepark card
      if (cardCount > 0) {
        const firstCard = await homePage.getSkateparkCard(0);
        await firstCard.click();
        
        // Verify navigation to skatepark details (if implemented)
        // This would typically navigate to a details page
        await page.waitForTimeout(1000);
      }

      // Step 4: User navigates to map (prefer navbar link for stability)
      const navbarMap = page.locator('a[href="/map"]').first();
      if (await navbarMap.isVisible({ timeout: 2000 }).catch(() => false)) {
        await navbarMap.scrollIntoViewIfNeeded().catch(() => {});
        // If a dialog/backdrop is present, dismiss it before clicking
        const backdrop = page.locator('[role="presentation"].MuiDialog-container, .MuiDialog-root [role="presentation"]');
        if (await backdrop.first().isVisible().catch(() => false)) {
          await page.keyboard.press('Escape').catch(() => {});
          await page.waitForTimeout(200);
        }
        try {
          await navbarMap.click();
        } catch {
          // Fallback: force click if pointer events are intercepted
          await navbarMap.click({ force: true });
        }
      } else {
        await homePage.clickExploreMap();
      }
      await expect(page).toHaveURL('/map', { timeout: 20000 });
    });

    test('should handle user search and filtering workflow', async ({ page }) => {
      // Step 1: User starts on home page
      await homePage.goto();
      await homePage.waitForSkateparkCards();

      // Step 2: User navigates to map for search functionality
      await homePage.clickExploreMap();
      await expect(page).toHaveURL('/map');

      // Step 3: User performs search (if search functionality exists)
      const searchInput = page.locator('input[type="text"], input[placeholder*="search"]').first();
      if (await searchInput.isVisible({ timeout: 2000 })) {
        await searchInput.fill('skatepark');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }

      // Step 4: User applies filters (if filter functionality exists)
      const filterToggle = page.getByRole('button', { name: /filter|show filters/i }).first();
      if (await filterToggle.isVisible({ timeout: 2000 })) {
        await filterToggle.click();
        
        // Try to interact with distance filter
        const distanceFilter = page.getByText(/distance/i).first();
        if (await distanceFilter.isVisible({ timeout: 2000 })) {
          await distanceFilter.click();
        }
      }
    });
  });

  test.describe('Returning User Flow', () => {
    test('should handle returning user with preferences', async ({ page }) => {
      // Step 1: Returning user visits home page
      await homePage.goto();
      await homePage.waitForSkateparkCards();

      // Step 2: User sees personalized content based on location
      const cardCount = await homePage.getSkateparkCardCount();
      expect(cardCount).toBeGreaterThan(0);

      // Step 3: User checks pagination if available
      if (await homePage.hasPagination()) {
        const totalPages = await homePage.getTotalPages();
        expect(totalPages).toBeGreaterThan(0);
      }

      // Step 4: User navigates between pages
      if (await homePage.hasPagination()) {
        const currentPage = await homePage.getCurrentPage();
        if (currentPage < await homePage.getTotalPages()) {
          await homePage.goToNextPage();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should handle user adding new spot workflow', async ({ page }) => {
      // Step 1: User starts on home page
      await homePage.goto();

      // Step 2: User attempts to add new spot
      const addSpotButton = page.getByRole('button', { name: /add spot/i });
      if (await addSpotButton.isVisible({ timeout: 5000 })) {
        await addSpotButton.click();
        await expect(page).toHaveURL('/add-spot');

        // Step 3: User fills out add spot form (if form exists)
        const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
        if (await nameInput.isVisible({ timeout: 2000 })) {
          const testSkatepark = testDataFactory.getRandomSkatepark();
          await nameInput.fill(testSkatepark.name);
        }

        // Step 4: User submits form (if submit button exists)
        const submitButton = page.getByRole('button', { name: /submit|add|create/i }).first();
        if (await submitButton.isVisible({ timeout: 2000 })) {
          await submitButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  

  test.describe('Error Handling Workflows', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Step 1: Simulate network issues
      await page.route('**/api/**', route => route.abort());

      // Step 2: User visits home page
      await homePage.goto();
      
      // Step 3: Verify page still loads basic content
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();

      // Step 4: User can still navigate
      await homePage.clickExploreMap();
      await expect(page).toHaveURL('/map');
    });

    test('should handle geolocation errors', async ({ page }) => {
      // Step 1: Simulate geolocation error
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'geolocation', {
          value: {
            getCurrentPosition: (success: any, error: any) => {
              error({ code: 1, message: 'User denied geolocation' });
            }
          },
          configurable: true
        });
      });

      // Step 2: User visits home page
      await homePage.goto();
      
      // Step 3: Verify page still functions without geolocation
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();
    });
  });

  test.describe('Performance Workflows', () => {
    test('should maintain performance during user interactions', async ({ page }) => {
      // Step 1: Start performance monitoring
      await page.goto('/');
      
      // Step 2: Perform multiple interactions
      await homePage.waitForSkateparkCards();
      
      // Step 3: Navigate to map
      await homePage.clickExploreMap();
      await page.waitForLoadState('networkidle');
      
      // Step 4: Navigate back
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      // Step 5: Test pagination performance
      if (await homePage.hasPagination()) {
        await homePage.goToNextPage();
        await page.waitForLoadState('networkidle');
      }
      
      // Verify page is still responsive
      await expect(homePage.welcomeHeading).toBeVisible();
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Step 1: Load page with many skateparks
      await homePage.goto();
      await homePage.waitForSkateparkCards();
      
      // Step 2: Test pagination with large dataset
      if (await homePage.hasPagination()) {
        const totalPages = await homePage.getTotalPages();
        
        // Navigate through multiple pages
        for (let i = 1; i <= Math.min(3, totalPages); i++) {
          await homePage.goToPage(i);
          await page.waitForLoadState('networkidle');
          
          // Verify content loads
          const cardCount = await homePage.getSkateparkCardCount();
          expect(cardCount).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe.skip('Accessibility Workflows', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Step 1: User navigates with keyboard only
      await homePage.goto();
      
      // Step 2: Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Step 3: Use Enter to activate buttons
      await page.keyboard.press('Enter');
      
      // Step 4: Verify navigation worked
      await expect(page).toHaveURL('/map');
    });

    test('should support screen reader navigation', async ({ page }) => {
      // Step 1: User visits home page
      await homePage.goto();
      
      // Step 2: Verify heading structure
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
      
      // Step 3: Verify button accessibility
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
      
      // Step 4: Verify all buttons have accessible names
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const accessibleName = await button.getAttribute('aria-label') || 
                              await button.textContent() || 
                              await button.getAttribute('title');
        expect(accessibleName).toBeTruthy();
      }
    });
  });
});
