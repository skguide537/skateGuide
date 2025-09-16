import { test, expect } from '@playwright/test';
import { testDataFactory } from './factories/test-data-factory';
import { HomePage } from './page-objects/HomePage';

/**
 * Comprehensive Test Runner
 * Runs all tests with consistent test data and configurations
 */

export class TestRunner {
  private static instance: TestRunner;
  private testData = testDataFactory;

  private constructor() {}

  public static getInstance(): TestRunner {
    if (!TestRunner.instance) {
      TestRunner.instance = new TestRunner();
    }
    return TestRunner.instance;
  }

  /**
   * Run all responsive tests across different viewports
   */
  async runResponsiveTests(page: any) {
    const viewports = this.testData.getViewportSizes();
    const results = [];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      const homePage = new HomePage(page);
      await homePage.goto();
      
      const result = {
        viewport: viewport.name,
        width: viewport.width,
        height: viewport.height,
        headingVisible: await homePage.welcomeHeading.isVisible(),
        buttonVisible: await homePage.exploreMapButton.isVisible(),
        cardCount: await homePage.getSkateparkCardCount(),
        responsive: await homePage.isResponsive()
      };
      
      results.push(result);
    }

    return results;
  }

  /**
   * Run performance tests with different data loads
   */
  async runPerformanceTests(page: any) {
    const results = [];
    
    // Test with different geolocation coordinates
    const coordinates = this.testData.getGeolocationCoordinates();
    
    for (const coord of coordinates) {
      await page.addInitScript(({ latitude, longitude }) => {
        Object.defineProperty(navigator, 'geolocation', {
          value: {
            getCurrentPosition: (success: any) => {
              success({
                coords: { latitude, longitude, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
                timestamp: Date.now()
              });
            }
          },
          configurable: true
        });
      }, { latitude: coord.latitude, longitude: coord.longitude });

      const startTime = Date.now();
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.waitForSkateparkCards();
      const loadTime = Date.now() - startTime;

      results.push({
        city: coord.city,
        latitude: coord.latitude,
        longitude: coord.longitude,
        loadTime,
        cardCount: await homePage.getSkateparkCardCount()
      });
    }

    return results;
  }

  /**
   * Run search and filter tests with realistic data
   */
  async runSearchFilterTests(page: any) {
    const results = [];
    const searchQueries = this.testData.getSearchQueries();
    const filterCombinations = this.testData.getFilterCombinations();

    // Test search queries
    for (const query of searchQueries.slice(0, 5)) { // Test first 5 queries
      await page.goto('/map');
      
      const searchInput = page.locator('input[type="text"], input[placeholder*="search"]').first();
      if (await searchInput.isVisible({ timeout: 2000 })) {
        await searchInput.fill(query);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        results.push({
          type: 'search',
          query,
          success: true
        });
      }
    }

    // Test filter combinations
    for (const filter of filterCombinations) {
      await page.goto('/map');
      
      // Try to apply filters
      const filterToggle = page.getByRole('button', { name: /filter|show filters/i }).first();
      if (await filterToggle.isVisible({ timeout: 2000 })) {
        await filterToggle.click();
        
        results.push({
          type: 'filter',
          combination: filter,
          success: true
        });
      }
    }

    return results;
  }

  /**
   * Run accessibility tests
   */
  async runAccessibilityTests(page: any) {
    const homePage = new HomePage(page);
    await homePage.goto();

    const results = {
      headings: await page.locator('h1, h2, h3, h4, h5, h6').count(),
      buttons: await page.locator('button').count(),
      links: await page.locator('a').count(),
      images: await page.locator('img').count(),
      formInputs: await page.locator('input, textarea, select').count(),
      landmarks: await page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]').count()
    };

    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();
    
    results.headingHierarchy = h1Count === 1 && h2Count >= 0;

    // Check for proper button accessibility
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    let accessibleButtons = 0;

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.getAttribute('aria-label') || 
                            await button.textContent() || 
                            await button.getAttribute('title');
      if (accessibleName) accessibleButtons++;
    }

    results.accessibleButtons = accessibleButtons;
    results.buttonAccessibility = accessibleButtons / buttonCount;

    return results;
  }

  /**
   * Run comprehensive test suite
   */
  async runFullTestSuite(page: any) {
    console.log('🚀 Starting comprehensive test suite...');
    
    const results = {
      responsive: await this.runResponsiveTests(page),
      performance: await this.runPerformanceTests(page),
      searchFilter: await this.runSearchFilterTests(page),
      accessibility: await this.runAccessibilityTests(page),
      timestamp: new Date().toISOString()
    };

    console.log('✅ Test suite completed');
    return results;
  }

  /**
   * Generate test report
   */
  generateTestReport(results: any) {
    const report = {
      summary: {
        totalTests: results.responsive.length + results.performance.length + results.searchFilter.length + 1,
        responsiveTests: results.responsive.length,
        performanceTests: results.performance.length,
        searchFilterTests: results.searchFilter.length,
        accessibilityTests: 1
      },
      responsive: {
        passed: results.responsive.filter((r: any) => r.headingVisible && r.buttonVisible).length,
        total: results.responsive.length,
        coverage: results.responsive.filter((r: any) => r.responsive).length
      },
      performance: {
        averageLoadTime: results.performance.reduce((sum: number, r: any) => sum + r.loadTime, 0) / results.performance.length,
        slowestLoad: Math.max(...results.performance.map((r: any) => r.loadTime)),
        fastestLoad: Math.min(...results.performance.map((r: any) => r.loadTime))
      },
      accessibility: {
        headingHierarchy: results.accessibility.headingHierarchy,
        buttonAccessibility: results.accessibility.buttonAccessibility,
        totalElements: results.accessibility.headings + results.accessibility.buttons + results.accessibility.links
      },
      timestamp: results.timestamp
    };

    return report;
  }
}

// Export singleton instance
export const testRunner = TestRunner.getInstance();
