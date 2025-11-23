import { test, expect } from '@playwright/test';
import { HomePage } from './page-objects/HomePage';
import { createTestHelpers, TEST_DATA } from './utils/test-helpers';

/**
 * Avialability tests
 * Uses real data and comprehensive page object model
 */

test.describe('Availability', () => {
    let homePage: HomePage;
    let testHelpers: ReturnType<typeof createTestHelpers>;

    test.beforeEach(async ({ page }) => {
        testHelpers = createTestHelpers(page);
        homePage = new HomePage(page);

        // Set up geolocation for consistent testing
        await testHelpers.setupGeolocation();

    });


    //   ✅✅✅
    test.describe('Home Page', () => {
        test('Home Page Availability', async () => {
            await homePage.goto();
            await homePage.waitForLoad();
            await testHelpers.waitForApiCall('/api/skateparks');
            expect(await homePage.hasSkateparkCards()).toBe(true);
            expect(await homePage.hasFilterBar()).toBe(true);
        });

    });

    //   ✅✅✅
    test.describe('Skatepark Cards Display', () => {


        test('card availability', async ({ page }) => {
            // 1. Wait for the page to load
            await homePage.goto();
            await page.waitForTimeout(3000);

            // 2. Scroll down a little to ensure cards are visible
            await homePage.page.evaluate(() => window.scrollTo(0, 200));
            await page.waitForTimeout(1000);

            // 3. Check the first card for required elements
            const firstCard = homePage.page.locator('.MuiCard-root').first();

            // Expect card title (h3 with MuiTypography-h6)
            await expect(firstCard.locator('h3.MuiTypography-h6')).toBeVisible();

            // Expect at least one tag (MUI Chip components)
                await expect(homePage.page.locator('.MuiChip-root').first()).toBeVisible();

            // Expect rating display (star icon + rating number)
            await expect(firstCard.locator('svg[viewBox="0 0 24 24"]').first()).toBeVisible(); // Star icon

            // Expect distance text (format: "455m away" or "X.Xkm away")
            await expect(firstCard.locator('text=/\\d+[mk]\\s*away/')).toBeVisible();

            // Expect location icon (location pin)
            await expect(firstCard.locator('svg[viewBox="0 0 24 24"]').nth(1)).toBeVisible(); // Location icon

            // Expect size and difficulty labels
            await expect(firstCard.locator('text=/Medium|Small|Large|Beginner|Intermediate|Advanced/')).toBeVisible();
        });

        test('clip on card opens up modal', async ({ page }) => {
            await page.goto('/');
          
            // Wait for data and ensure at least one card is present and visible
            await testHelpers.waitForApiCall('/api/skateparks', 30000);
            const firstCard = page.locator('.MuiCard-root').first();
            await firstCard.scrollIntoViewIfNeeded();
            await expect(firstCard).toBeVisible({ timeout: 15000 });
          
            await firstCard.click();
          
            // Use role and allow time for MUI dialog animation
            await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 });
          });

    });


    test.describe('Navigation', () => {


        test('/map availability', async () => {
            await homePage.goto();
            await homePage.clickExploreMap();
            await expect(homePage.page).toHaveURL('/map');
        });

        test('/register availability', async () => {
            await homePage.goto();
            await homePage.page.getByRole('link', { name: 'Create a new account' }).getByRole('button').click();
            await expect(homePage.page).toHaveURL('/register');
        });

        test('/login availability', async () => {
            await homePage.goto();
            await homePage.page.getByRole('link', { name: 'Login to your account' }).getByRole('button').click();
            await expect(homePage.page).toHaveURL('/login');
        });



        test('/add-spot availability', async () => {
            await homePage.goto();
            await testHelpers.login(process.env.DB_ADMIN_EMAIL as string, process.env.DB_ADMIN_PASSWORD as string);
            await homePage.page.getByLabel('Add New Spot').getByRole('button').click();
            
            await expect(homePage.page).toHaveURL('/add-spot');
        });

    });

});
