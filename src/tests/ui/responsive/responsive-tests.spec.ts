import { test, expect } from '@playwright/test';
import { testDataFactory } from '../factories/test-data-factory';
import { HomePage } from '../page-objects/HomePage';

/**
 * Comprehensive Responsive Testing
 * Tests UI behavior across different screen sizes and orientations
 */

test.describe('Responsive Design Tests', () => {
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

  test.describe('Mobile Responsive Tests', () => {
    test('should adapt to mobile small screens (320px)', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await homePage.goto();
      
      // Verify content is accessible
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();
      
      // Test card layout
      await homePage.waitForSkateparkCards();
      const cardCount = await homePage.getSkateparkCardCount();
      expect(cardCount).toBeGreaterThan(0);
      
      // Verify buttons are touch-friendly
      const button = homePage.exploreMapButton;
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44); // Minimum touch target size
    });

    test('should adapt to mobile medium screens (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await homePage.goto();
      
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();
      
      await homePage.waitForSkateparkCards();
      const cardCount = await homePage.getSkateparkCardCount();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should adapt to mobile large screens (414px)', async ({ page }) => {
      await page.setViewportSize({ width: 414, height: 896 });
      await homePage.goto();
      
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();
      
      await homePage.waitForSkateparkCards();
      const cardCount = await homePage.getSkateparkCardCount();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should handle mobile orientation changes', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await homePage.goto();
      await expect(homePage.welcomeHeading).toBeVisible();
      
      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500); // Allow for reflow
      await expect(homePage.welcomeHeading).toBeVisible();
      
      // Switch back to portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      await expect(homePage.welcomeHeading).toBeVisible();
    });
  });

  test.describe('Tablet Responsive Tests', () => {
    test('should adapt to tablet portrait (768px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await homePage.goto();
      
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();
      
      await homePage.waitForSkateparkCards();
      const cardCount = await homePage.getSkateparkCardCount();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should adapt to tablet landscape (1024px)', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await homePage.goto();
      
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();
      
      await homePage.waitForSkateparkCards();
      const cardCount = await homePage.getSkateparkCardCount();
      expect(cardCount).toBeGreaterThan(0);
    });
  });

  test.describe('Desktop Responsive Tests', () => {
    test('should adapt to desktop small (1280px)', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await homePage.goto();
      
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();
      
      await homePage.waitForSkateparkCards();
      const cardCount = await homePage.getSkateparkCardCount();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should adapt to desktop medium (1440px)', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await homePage.goto();
      
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();
      
      await homePage.waitForSkateparkCards();
      const cardCount = await homePage.getSkateparkCardCount();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should adapt to desktop large (1920px)', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await homePage.goto();
      
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();
      
      await homePage.waitForSkateparkCards();
      const cardCount = await homePage.getSkateparkCardCount();
      expect(cardCount).toBeGreaterThan(0);
    });
  });

  test.describe('Cross-Device Consistency', () => {
    test('should maintain functionality across all viewport sizes', async ({ page }) => {
      const viewports = testDataFactory.getViewportSizes();
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await homePage.goto();
        
        // Verify core functionality works
        await expect(homePage.welcomeHeading).toBeVisible();
        await expect(homePage.exploreMapButton).toBeVisible();
        
        // Test navigation
        await homePage.clickExploreMap();
        await expect(page).toHaveURL('/map');
        
        // Go back and test cards
        await page.goBack();
        await homePage.waitForSkateparkCards();
        const cardCount = await homePage.getSkateparkCardCount();
        expect(cardCount).toBeGreaterThan(0);
      }
    });

    test('should maintain text readability across viewports', async ({ page }) => {
      const viewports = testDataFactory.getViewportSizes();
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await homePage.goto();
        
        // Check heading text is readable
        const heading = homePage.welcomeHeading;
        const headingBox = await heading.boundingBox();
        expect(headingBox?.height).toBeGreaterThan(16); // Minimum readable font size
        
        // Check button text is readable
        const button = homePage.exploreMapButton;
        const buttonBox = await button.boundingBox();
        expect(buttonBox?.height).toBeGreaterThan(16);
      }
    });
  });

  test.describe('Touch and Interaction Responsiveness', () => {
    test('should have appropriate touch targets on mobile', async ({ page }) => {
      const mobileViewports = testDataFactory.getViewportSizes().filter(v => v.width < 768);
      
      for (const viewport of mobileViewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await homePage.goto();
        
        // Check all interactive elements have minimum touch target size
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i);
          const box = await button.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44); // WCAG minimum
            expect(box.width).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    test('should handle touch gestures appropriately', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await homePage.goto();
      
      // Test scroll behavior
      await homePage.waitForSkateparkCards();
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(500);
      
      // Verify content is still accessible after scroll
      await expect(homePage.welcomeHeading).toBeVisible();
    });
  });

  test.describe('Performance Across Viewports', () => {
    test('should maintain performance on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const startTime = Date.now();
      await homePage.goto();
      await homePage.waitForSkateparkCards();
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time on mobile
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
    });

    test('should maintain performance on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      const startTime = Date.now();
      await homePage.goto();
      await homePage.waitForSkateparkCards();
      const loadTime = Date.now() - startTime;
      
      // Should load faster on desktop
      expect(loadTime).toBeLessThan(5000); // 5 seconds max
    });
  });

  test.describe('Accessibility Across Viewports', () => {
    test('should maintain accessibility on all screen sizes', async ({ page }) => {
      const viewports = testDataFactory.getViewportSizes();
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await homePage.goto();
        
        // Check for proper heading hierarchy
        const h1 = page.locator('h1');
        const h1Count = await h1.count();
        expect(h1Count).toBeGreaterThan(0);
        
        // Check for proper button roles
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        expect(buttonCount).toBeGreaterThan(0);
        
        // Check for proper focus management
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
    });
  });

  test.describe('Edge Cases and Boundary Testing', () => {
    test('should handle very small viewports gracefully', async ({ page }) => {
      await page.setViewportSize({ width: 280, height: 400 }); // Very small
      await homePage.goto();
      
      // Should still show essential content
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();
    });

    test('should handle very large viewports gracefully', async ({ page }) => {
      await page.setViewportSize({ width: 2560, height: 1440 }); // Very large
      await homePage.goto();
      
      // Should still function properly
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();
      
      await homePage.waitForSkateparkCards();
      const cardCount = await homePage.getSkateparkCardCount();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should handle viewport changes during interaction', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await homePage.goto();
      await homePage.waitForSkateparkCards();
      
      // Change viewport while page is loaded
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500);
      
      // Verify content is still accessible
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();
    });
  });
});
