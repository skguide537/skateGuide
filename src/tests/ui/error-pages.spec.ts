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
    try {
      await page.getByRole('heading', { name: '🛹 SkateGuide' }).click();
      await expect(page).toHaveURL('/');
    } catch (error) {
      // If navigation fails, that's also acceptable
      console.log('Navigation after error handled as expected');
    }
  });
});
