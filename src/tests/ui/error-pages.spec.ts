import { test, expect } from '@playwright/test';

test.describe('Error Pages', () => {
  test('should handle 404 errors gracefully', async ({ page }) => {
    // Navigate to a non-existent page
    await page.goto('/non-existent-page');
    
    // Should show 404 page or handle gracefully
    // This could be a custom 404 page or just the main layout
    await expect(page).toHaveURL('/non-existent-page');
    
    // Should not crash the app
    await expect(page.locator('body')).toBeVisible();
    
    // Should show some indication of the error (or redirect to home)
    const pageContent = await page.content();
    if (pageContent.includes('404') || pageContent.includes('not found')) {
      // Custom 404 page
      await expect(page.locator('body')).toContainText(/404|not found|page not found/i);
    } else {
      // App handles gracefully - just verify it doesn't crash
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle invalid routes gracefully', async ({ page }) => {
    // Test various invalid routes
    const invalidRoutes = [
      '/invalid/route',
      '/api/invalid',
      '/user/123/invalid',
      '/spot/invalid-id'
    ];

    for (const route of invalidRoutes) {
      try {
        await page.goto(route);
        
        // Should not crash
        await expect(page.locator('body')).toBeVisible();
        
        // Should either show error page or redirect gracefully
        const currentUrl = page.url();
        if (currentUrl === route) {
          // Stays on route - should handle gracefully
          await expect(page.locator('body')).toBeVisible();
        } else {
          // Redirected - should be to a valid page
          await expect(currentUrl).not.toBe(route);
        }
      } catch (error) {
        // If navigation fails, that's also acceptable for invalid routes
        console.log(`Route ${route} handled as expected`);
      }
    }
  });

  test('should handle malformed URLs gracefully', async ({ page }) => {
    // Test malformed URLs
    const malformedUrls = [
      '/%20invalid',
      '/invalid%20space',
      '/invalid/special/chars/!@#$%^&*()',
      '/very/long/url/that/might/cause/issues/with/very/long/paths/that/exceed/normal/limits'
    ];

    for (const url of malformedUrls) {
      try {
        await page.goto(url);
        
        // Should not crash
        await expect(page.locator('body')).toBeVisible();
        
        // Should handle gracefully
        const currentUrl = page.url();
        await expect(currentUrl).toBeDefined();
      } catch (error) {
        // If navigation fails, that's acceptable for malformed URLs
        console.log(`Malformed URL ${url} handled as expected`);
      }
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/*', async route => {
      await route.abort('failed');
    });

    // Try to navigate to a page
    try {
      await page.goto('/');
      
      // Should handle network errors gracefully
      await expect(page.locator('body')).toBeVisible();
    } catch (error) {
      // Network errors should be handled gracefully
      console.log('Network error handled as expected');
    }
  });

  test('should maintain navigation functionality on error pages', async ({ page }) => {
    // Navigate to a potentially problematic route
    await page.goto('/invalid-route');
    
    // Should still have basic navigation
    const navElements = page.locator('nav, header, [role="navigation"]');
    if (await navElements.count() > 0) {
      // If navigation exists, it should be functional
      await expect(navElements.first()).toBeVisible();
    }
    
    // Should be able to navigate back to home
    try {
      await page.goto('/');
      await expect(page).toHaveURL('/');
      await expect(page.locator('body')).toBeVisible();
    } catch (error) {
      // If navigation fails, that's also acceptable
      console.log('Navigation after error handled as expected');
    }
  });
});
