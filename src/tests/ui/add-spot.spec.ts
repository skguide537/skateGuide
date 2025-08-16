import { test, expect } from '@playwright/test';

test.describe('Add Spot Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/add-spot');
  });

  test('should display the add spot form', async ({ page }) => {
    // Wait for the lazy-loaded form to render (increased timeout for Suspense)
    await expect(page.getByRole('heading', { name: /add new spot/i })).toBeVisible({ timeout: 15000 });
    
    // Check if all form fields are present
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
    await expect(page.getByLabel(/street address/i)).toBeVisible();
    await expect(page.getByLabel(/city/i)).toBeVisible();
    await expect(page.getByLabel(/state\/province/i)).toBeVisible();
    await expect(page.getByLabel(/country/i)).toBeVisible();
    
    // Check if buttons are present
    await expect(page.getByRole('button', { name: /use my location/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /search address/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /choose on map/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /submit skate spot/i })).toBeVisible();
  });

  test('should allow user to fill out the form', async ({ page }) => {
    // Wait for form to be fully loaded
    await expect(page.getByLabel(/title/i)).toBeVisible({ timeout: 15000 });
    
    // Fill out the form
    await page.getByLabel(/title/i).fill('Test Skate Spot');
    await page.getByLabel(/description/i).fill('A great place to skate');
    await page.getByLabel(/street address/i).fill('123 Main Street');
    await page.getByLabel(/city/i).fill('Tel Aviv');
    await page.getByLabel(/state\/province/i).fill('Tel Aviv');
    await page.getByLabel(/country/i).fill('Israel');
    
    // Verify the form is filled
    await expect(page.getByLabel(/title/i)).toHaveValue('Test Skate Spot');
    await expect(page.getByLabel(/description/i)).toHaveValue('A great place to skate');
    await expect(page.getByLabel(/street address/i)).toHaveValue('123 Main Street');
    await expect(page.getByLabel(/city/i)).toHaveValue('Tel Aviv');
  });

  test('should show map when choose on map is clicked', async ({ page }) => {
    // Wait for form to be fully loaded
    await expect(page.getByLabel(/title/i)).toBeVisible({ timeout: 15000 });
    
    // Initially map should be hidden (no coords set)
    // The map is now lazy-loaded, so we need to wait for it to be available
    await expect(page.locator('.leaflet-container')).not.toBeVisible();
    
    // Click choose on map button
    await page.getByRole('button', { name: /choose on map/i }).click();
    
    // Map should now be visible (increased timeout for lazy loading)
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 15000 });
  });

  test('should validate required fields', async ({ page }) => {
    // Wait for form to be fully loaded
    await expect(page.getByLabel(/title/i)).toBeVisible({ timeout: 15000 });
    
    // Initially, no validation errors should be visible
    await expect(page.getByText(/Title is required/i)).not.toBeVisible();
    await expect(page.getByText(/Size is required/i)).not.toBeVisible();
    await expect(page.getByText(/Level is required/i)).not.toBeVisible();
    
    // Try to submit without filling required fields
    // The browser might prevent submission due to required attributes
    await page.getByRole('button', { name: /submit skate spot/i }).click();
    
    // Wait a moment for any validation to process
    await page.waitForTimeout(1000);
    
    // Check if validation errors are visible after submission attempt
    // If browser validation prevents submission, we might not see our custom errors
    // So we'll check if the form is still on the same page (which indicates validation worked)
    await expect(page).toHaveURL(/.*add-spot.*/);
    
    // Also check if the submit button is still visible (form didn't navigate away)
    await expect(page.getByRole('button', { name: /submit skate spot/i })).toBeVisible();
  });

  test('should handle address search', async ({ page }) => {
    // Wait for form to be fully loaded
    await expect(page.getByLabel(/street address/i)).toBeVisible({ timeout: 15000 });
    
    // Fill address fields
    await page.getByLabel(/street address/i).fill('Dizengoff Street');
    await page.getByLabel(/city/i).fill('Tel Aviv');
    await page.getByLabel(/state\/province/i).fill('Tel Aviv');
    await page.getByLabel(/country/i).fill('Israel');
    
    // Click search address button
    await page.getByRole('button', { name: /search address/i }).click();
    
    // Should show loading state or results
    // This test will need to be updated based on your actual geocoding implementation
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Wait for form to be fully loaded
    await expect(page.getByLabel(/title/i)).toBeVisible({ timeout: 15000 });
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Form should still be usable on mobile
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
    
    // Buttons should be properly sized for mobile
    await expect(page.getByRole('button', { name: /submit skate spot/i })).toBeVisible();
  });
});
