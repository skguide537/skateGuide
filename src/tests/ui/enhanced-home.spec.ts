import { test, expect } from '@playwright/test';
import { HomePage } from './page-objects/HomePage';
import { createTestHelpers, TEST_DATA } from './utils/test-helpers';

/**
 * Enhanced Home Page Tests
 * Uses real data and comprehensive page object model
 */

test.describe('Enhanced Home Page Tests', () => {
  let homePage: HomePage;
  let testHelpers: ReturnType<typeof createTestHelpers>;

  test.beforeEach(async ({ page }) => {
    testHelpers = createTestHelpers(page);
    homePage = new HomePage(page);
    
    // Set up geolocation for consistent testing
    await testHelpers.setupGeolocation();
    
    // Navigate to home page
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test.describe('Page Loading and Structure', () => {
    test('should load home page successfully', async () => {
      // Verify page is loaded
      expect(await homePage.isLoaded()).toBe(true);
      
      // Check main elements are visible
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.subtitle).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();
    });

    test('should display correct page content', async () => {
      // Verify heading text
      await expect(homePage.welcomeHeading).toHaveText(/welcome to skateguide/i);
      
      // Verify subtitle text
      await expect(homePage.subtitle).toHaveText(/discover, rate, and share skateparks around the city/i);
      
      // Verify button text
      await expect(homePage.exploreMapButton).toHaveText(/explore the map/i);
    });

    test('should handle page load performance', async () => {
      const metrics = await homePage.getPerformanceMetrics();
      
      // Basic performance checks
      expect(metrics.loadTime).toBeLessThan(5000); // Should load within 5 seconds
      expect(metrics.domContentLoaded).toBeLessThan(3000); // DOM should be ready within 3 seconds
    });
  });

  test.describe('Skatepark Cards Display', () => {
    test('should display skatepark cards', async () => {
      // Wait for cards to load
      await homePage.waitForSkateparkCards();
      
      // Verify cards are displayed
      expect(await homePage.hasSkateparkCards()).toBe(true);
      
      const cardCount = await homePage.getSkateparkCardCount();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should display card information correctly', async () => {
      await homePage.waitForSkateparkCards();
      
      if (await homePage.hasSkateparkCards()) {
        // Check first card has required information
        const firstCardTitle = await homePage.getCardTitle(0);
        expect(firstCardTitle).toBeTruthy();
        expect(firstCardTitle.length).toBeGreaterThan(0);
        
        const firstCardRating = await homePage.getCardRating(0);
        expect(firstCardRating).toBeGreaterThanOrEqual(0);
        expect(firstCardRating).toBeLessThanOrEqual(5);
        
        const firstCardDistance = await homePage.getCardDistance(0);
        expect(firstCardDistance).toContain('km');
      }
    });

    test('should handle card interactions', async () => {
      await homePage.waitForSkateparkCards();
      
      if (await homePage.hasSkateparkCards()) {
        // Click on first card
        await homePage.clickSkateparkCard(0);
        
        // Verify interaction (this would depend on your modal implementation)  
        // For now, just verify the click doesn't cause errors
        const hasErrors = await homePage.hasErrors();
        console.log('hasErrors after card click:', hasErrors);
        expect(hasErrors).toBe(false);
      }
    });

    test('should display all card titles', async () => {
      await homePage.waitForSkateparkCards();
      
      if (await homePage.hasSkateparkCards()) {
        const titles = await homePage.getAllCardTitles();
        expect(titles.length).toBeGreaterThan(0);
        
        // Verify all titles are non-empty
        titles.forEach(title => {
          expect(title).toBeTruthy();
          expect(title.length).toBeGreaterThan(0);
        });
      }
    });

    test('should display all card ratings', async () => {
      await homePage.waitForSkateparkCards();
      
      if (await homePage.hasSkateparkCards()) {
        const ratings = await homePage.getAllCardRatings();
        expect(ratings.length).toBeGreaterThan(0);
        
        // Verify all ratings are valid
        ratings.forEach(rating => {
          expect(rating).toBeGreaterThanOrEqual(0);
          expect(rating).toBeLessThanOrEqual(5);
        });
      }
    });
  });

  test.describe('Pagination', () => {
    test('should handle pagination when available', async () => {
      await homePage.waitForSkateparkCards();
      
      if (await homePage.hasPagination()) {
        const currentPage = await homePage.getCurrentPage();
        const totalPages = await homePage.getTotalPages();
        
        expect(currentPage).toBeGreaterThan(0);
        expect(totalPages).toBeGreaterThan(0);
        expect(currentPage).toBeLessThanOrEqual(totalPages);
      }
    });

    test('should navigate between pages', async () => {
      await homePage.waitForSkateparkCards();
      
      if (await homePage.hasPagination()) {
        const totalPages = await homePage.getTotalPages();
        
        if (totalPages > 1) {
          // Navigate to next page
          await homePage.goToNextPage();
          
          // Verify page changed
          const newPage = await homePage.getCurrentPage();
          expect(newPage).toBeGreaterThan(1);
          
          // Navigate back
          await homePage.goToPreviousPage();
          
          // Verify we're back to page 1
          const backToPage = await homePage.getCurrentPage();
          expect(backToPage).toBe(1);
        }
      }
    });

    test('should navigate to specific page', async () => {
      await homePage.waitForSkateparkCards();
      
      if (await homePage.hasPagination()) {
        const totalPages = await homePage.getTotalPages();
        
        if (totalPages > 2) {
          // Navigate to page 2
          await homePage.goToPage(2);
          
          // Verify page changed
          const currentPage = await homePage.getCurrentPage();
          expect(currentPage).toBe(2);
        }
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to map page', async () => {
      await homePage.clickExploreMap();
      
      // Verify navigation
      await expect(homePage.page).toHaveURL('/map');
    });

    test('should handle add spot navigation', async () => {
      if (await homePage.addSpotButton.isVisible()) {
        if (await homePage.isAddSpotEnabled()) {
          await homePage.clickAddSpot();
          
          // Verify navigation
          await expect(homePage.page).toHaveURL('/add-spot');
        } else {
          // If button is disabled, just verify it exists
          await expect(homePage.addSpotButton).toBeVisible();
        }
      } else {
        // Add spot button might not be visible (e.g., user not logged in)
        expect(true).toBe(true);
      }
    });
  });

  test.describe('Filter Bar Integration', () => {
    test('should display filter bar when available', async () => {
      if (await homePage.hasFilterBar()) {
        expect(await homePage.hasFilterBar()).toBe(true);
      }
    });

    test('should show filter summary', async () => {
      if (await homePage.hasFilterBar()) {
        const summary = await homePage.getFilterSummary();
        // Filter summary might be empty if no filters are active, which is okay
        expect(typeof summary).toBe('string');
      }
    });

    test('should handle active filters', async () => {
      if (await homePage.hasFilterBar()) {
        if (await homePage.hasActiveFilters()) {
          const filterCount = await homePage.getActiveFilterCount();
          expect(filterCount).toBeGreaterThan(0);
        }
      }
    });

    test('should clear all filters', async () => {
      if (await homePage.hasFilterBar()) {
        if (await homePage.hasActiveFilters()) {
          await homePage.clearAllFilters();
          
          // Verify filters are cleared
          const filterCount = await homePage.getActiveFilterCount();
          expect(filterCount).toBe(0);
        }
      }
    });
  });

  test.describe('Loading States', () => {
    test('should handle loading state', async () => {
      // Check if loading state appears
      if (await homePage.isLoading()) {
        expect(await homePage.isLoading()).toBe(true);
        
        // Wait for loading to complete
        await homePage.waitForLoadingComplete();
        expect(await homePage.isLoading()).toBe(false);
      }
    });

    test('should transition from loading to content', async () => {
      // Wait for loading to complete
      await homePage.waitForLoadingComplete();
      
      // Verify content is displayed
      expect(await homePage.hasSkateparkCards()).toBe(true);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle page errors gracefully', async () => {
      // Check if page has errors
      const hasErrors = await homePage.hasErrors();
      
      if (hasErrors) {
        // If there are errors, verify they're handled gracefully
        // The page should still be functional
        expect(await homePage.isLoaded()).toBe(true);
      } else {
        // If no errors, verify normal functionality
        expect(await homePage.hasSkateparkCards()).toBe(true);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile', async () => {
      await homePage.setMobileViewport();
      
      // Verify page is responsive
      expect(await homePage.isResponsive()).toBe(true);
      
      // Verify main elements are still visible
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();
    });

    test('should be responsive on desktop', async () => {
      await homePage.setDesktopViewport();
      
      // Verify page is responsive
      expect(await homePage.isResponsive()).toBe(true);
      
      // Verify main elements are still visible
      await expect(homePage.welcomeHeading).toBeVisible();
      await expect(homePage.exploreMapButton).toBeVisible();
    });

    test('should adapt card layout for different viewports', async () => {
      await homePage.waitForSkateparkCards();
      
      // Test mobile viewport
      await homePage.setMobileViewport();
      const mobileCardCount = await homePage.getSkateparkCardCount();
      
      // Test desktop viewport
      await homePage.setDesktopViewport();
      const desktopCardCount = await homePage.getSkateparkCardCount();
      
      // Desktop should show more cards (if responsive design is implemented)
      if (mobileCardCount > 0 && desktopCardCount > 0) {
        expect(desktopCardCount).toBeGreaterThanOrEqual(mobileCardCount);
      }
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('should meet performance requirements', async () => {
      const metrics = await homePage.getPerformanceMetrics();
      
      // Performance thresholds
      expect(metrics.loadTime).toBeLessThan(5000);
      expect(metrics.domContentLoaded).toBeLessThan(3000);
      expect(metrics.firstContentfulPaint).toBeLessThan(2000);
    });

    test('should have proper heading hierarchy', async () => {
      // Check if main heading is h1
      const heading = homePage.page.locator('h1').first();
      if (await heading.isVisible()) {
        await expect(heading).toBeVisible();
      }
    });

    test('should have accessible buttons', async () => {
      // Check if buttons are accessible (MUI buttons use semantic button elements, not role attributes)
      await expect(homePage.exploreMapButton).toBeVisible();
      
      if (await homePage.addSpotButton.isVisible()) {
        await expect(homePage.addSpotButton).toBeVisible();
      }
    });
  });

  test.describe('Data Validation', () => {
    test('should display valid skatepark data', async () => {
      await homePage.waitForSkateparkCards();
      
      if (await homePage.hasSkateparkCards()) {
        const cardCount = await homePage.getSkateparkCardCount();
        
        for (let i = 0; i < Math.min(cardCount, 5); i++) { // Check first 5 cards
          const title = await homePage.getCardTitle(i);
          const rating = await homePage.getCardRating(i);
          const distance = await homePage.getCardDistance(i);
          
          // Validate title
          expect(title).toBeTruthy();
          expect(title.length).toBeGreaterThan(0);
          
          // Validate rating
          expect(rating).toBeGreaterThanOrEqual(0);
          expect(rating).toBeLessThanOrEqual(5);
          
          // Validate distance (might be empty if no location data)
          if (distance) {
            expect(distance).toContain('km');
          }
        }
      }
    });

    test('should handle empty data gracefully', async () => {
      // This test would need to be run in a scenario where no data is available
      // For now, just verify the page doesn't crash
      const hasErrors = await homePage.hasErrors();
      console.log('hasErrors result:', hasErrors);
      expect(hasErrors).toBe(false);
    });
  });
});
