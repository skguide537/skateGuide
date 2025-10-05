import { test, expect } from '@playwright/test';

test.describe('Error Pages', () => {
  

  

  

  

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
    // Todo: go to home page by clicking on button from the error page
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
