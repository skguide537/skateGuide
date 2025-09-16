import { test, expect } from '@playwright/test';

/**
 * Simple test to verify our setup works
 */

test.describe('Simple Setup Test', () => {
  test('should load home page', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Check if main content is visible
    const heading = page.getByRole('heading', { name: /welcome to skateguide/i });
    await expect(heading).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if map button exists
    const mapButton = page.getByRole('button', { name: /explore the map/i });
    await expect(mapButton).toBeVisible();
    
    // Click map button
    await mapButton.click();
    
    // Verify navigation
    await expect(page).toHaveURL('/map');
  });
});
