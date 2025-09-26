import { test, expect } from '@playwright/test';

test.describe('Add Spot Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/add-spot');
  });


  test('Verify Map Section', async ({ page }) => {
    // Wait for form to be fully loaded
    await expect(page.getByLabel(/title/i)).toBeVisible({ timeout: 15000 });
    
    // Initially the button should say "Show Map"
    await expect(page.getByRole('button', { name: /show map/i })).toBeVisible();
    
    // Click show map button - this toggles showMap state in the form
    await page.getByRole('button', { name: /show map/i }).click();
    await expect(page.locator('div').filter({ hasText: /^\+− Leaflet \| © OpenStreetMap contributors$/ }).first()).toBeVisible();
    // After clicking, the button should change to "Hide Map"
    await expect(page.getByRole('button', { name: /hide map/i })).toBeVisible();
    await page.getByRole('button', { name: /hide map/i }).click();

    await expect(page.getByText('Map Selection')).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^\+− Leaflet \| © OpenStreetMap contributors$/ }).first()).toBeHidden();

  });

  // TODO: Need to add validation for success message
  test('should handle address search', async ({ page }) => {
    // Wait for form to be fully loaded
    await expect(page.getByLabel(/street/i)).toBeVisible({ timeout: 15000 });
    
    // Fill address fields
    await page.getByLabel(/street/i).fill('Dizengoff Street');
    await page.getByLabel(/city/i).fill('Tel Aviv');
    await page.getByLabel(/state\/province/i).fill('Tel Aviv');
    await page.getByLabel(/country/i).fill('Israel');
    
    // Click search address button
    await page.getByRole('button', { name: /search address/i }).click();
    
    // Should show loading state or results
    // This test will need to be updated based on your actual geocoding implementation
  });

     

test('Create new spot', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Title' }).click();
  await page.getByRole('textbox', { name: 'Title' }).fill('Test');
  await page.getByRole('textbox', { name: 'Description' }).click();
  await page.getByRole('textbox', { name: 'Description' }).fill('Test Description');
  await page.getByRole('textbox', { name: 'Description' }).press('Tab');
  await page.locator('form div').filter({ hasText: '📝 Basic InformationTitle *' }).getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'Large' }).click();
  await page.locator('form div').filter({ hasText: '📝 Basic InformationTitle *' }).getByRole('combobox').nth(1).click();
  await page.getByRole('option', { name: 'All Levels' }).click();
  await page.locator('#menu- div').first().click();
  await page.getByRole('checkbox').check();
  await page.locator('form div').filter({ hasText: '📝 Basic InformationTitle *' }).getByRole('combobox').nth(2).click();
  await page.getByRole('option', { name: 'Bowl' }).click();
  await page.getByRole('option', { name: 'Stairs' }).click();
  await page.keyboard.press('Escape');
  await page.locator('#menu- div').first().click();
  await page.getByRole('button', { name: '📍 Use My Location' }).click();
  await page.getByRole('alert').filter({ hasText: 'Location set: 32.0730,' }).click();
  await page.locator('div').filter({ hasText: /^\+− Leaflet \| © OpenStreetMap contributors$/ }).first().click();
  await page.getByRole('textbox', { name: 'Add a link (e.g., Instagram,' }).click();
  await page.getByRole('textbox', { name: 'Add a link (e.g., Instagram,' }).fill('Google.com');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Submit Skate Spot' }).click();
});

});

