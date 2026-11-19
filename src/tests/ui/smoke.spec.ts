import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { loginFixture } from './test-database';

const parkTitle = 'E2E Tel Aviv Plaza';
const spotDescription = 'Deterministic browser-test plaza with ledges and rails.';

test.beforeEach(async ({ page }) => {
  await page.route('https://*.tile.openstreetmap.org/**', (route) => route.abort());
  await page.route('https://api.geoapify.com/**', (route) => route.abort());
  await page.route('https://res.cloudinary.com/**', (route) => route.abort());
  await page.route('**/_next/image**', (route) => route.abort());
});

test('homepage loads spots and navigation opens the map', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('search-filter-bar')).toBeVisible();
  await expect(page.getByRole('heading', { name: parkTitle })).toBeVisible();

  await page.locator('a[href="/map"]:visible').first().click();
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.locator('#map-container .leaflet-container')).toBeVisible();
});

test('spot listing filters by text and opens full spot details', async ({ page }) => {
  await page.goto('/');
  const search = page.getByPlaceholder('Search spots, tags, locations...');
  await expect(page.getByRole('heading', { name: parkTitle })).toBeVisible();

  await search.fill('Tel Aviv Ledge');
  await expect(page.getByRole('heading', { name: 'E2E Tel Aviv Ledge' })).toBeVisible();
  await expect(page.getByRole('heading', { name: parkTitle })).toHaveCount(0);

  await search.fill(parkTitle);
  const title = page.getByRole('heading', { name: parkTitle });
  await expect(title).toBeVisible();
  await title.click();

  const detailsDialog = page.getByRole('dialog');
  await expect(detailsDialog).toBeVisible();
  await expect(detailsDialog).toContainText(spotDescription);
  await detailsDialog.getByRole('link', { name: 'View Full Park Details' }).click();
  await expect(page).toHaveURL(/\/parks\/66a000000000000000000010$/);
  await expect(page.getByRole('heading', { name: parkTitle })).toBeVisible();
  await expect(page.getByText(spotDescription)).toBeVisible();
});

test('map initializes Leaflet markers and opens a spot detail journey', async ({ page }) => {
  await page.goto('/map');
  const map = page.locator('#map-container .leaflet-container');
  await expect(map).toBeVisible();
  await expect(map.locator('.leaflet-marker-icon')).toHaveCount(3);

  // The first icon is the configured user location; the following icons are seeded spots.
  await map.locator('.leaflet-marker-icon').nth(1).click();
  const popup = page.locator('.leaflet-popup-content');
  await expect(popup).toBeVisible();
  await expect(popup).toContainText(parkTitle);
  await popup.getByRole('button', { name: 'View Details' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('link', { name: 'View Full Park Details' }).click();
  await expect(page).toHaveURL(/\/parks\/66a000000000000000000010$/);
});

test('registration creates an account and completes the registration journey', async ({ page }) => {
  const email = `playwright.e2e.${randomUUID()}@example.com`;
  await page.goto('/register');
  await page.getByRole('textbox', { name: 'Name *' }).fill('Browser Test Skater');
  await page.getByRole('textbox', { name: 'Email *' }).fill(email);
  await page.getByLabel('Password *').fill('SkateGuide-E2E-2026!');

  const registrationResponse = page.waitForResponse((response) =>
    response.url().endsWith('/api/auth/register') && response.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Sign up' }).click();
  const response = await registrationResponse;
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ email });
  await expect(page).toHaveURL(/\/map$/);
});

test('login authenticates the seeded account and mobile navigation remains usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email *' }).fill(loginFixture.email);
  await page.getByLabel('Password *').fill(loginFixture.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await expect(page.getByRole('menuitem', { name: /Profile/ })).toBeVisible();
  await expect(page.getByTestId('search-filter-bar')).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    contentWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
});
