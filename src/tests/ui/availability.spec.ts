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

       
    });


    //   ✅✅✅
    test.describe('Availability', () => {
        test('Home Page Availability', async () => {
            await expect(homePage.page.locator('#home-welcome-heading')).toBeVisible();
            expect(await homePage.hasSkateparkCards()).toBe(true);
            expect(await homePage.hasFilterBar()).toBe(true);
        });

    });

    //   ✅✅✅
    test.describe('Skatepark Cards Display', () => {


        test('card availability', async ({ page }) => {
            // 1. Wait for the page to load
            await page.goto('/');
            await page.waitForTimeout(3000);

            // 2. Scroll down a little to ensure cards are visible
            await page.evaluate(() => window.scrollTo(0, 200));
            await page.waitForTimeout(1000);

            // 3. Check the first card for required elements
            const firstCard = page.locator('.MuiCard-root').first();

            // Expect card title (h3 with MuiTypography-h6)
            await expect(firstCard.locator('h3.MuiTypography-h6')).toBeVisible();

            // Expect at least one tag (MUI Chip components)
            await expect(firstCard.locator('.MuiChip-root').first()).toBeVisible();

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
            // 1. Go to the page
            await page.goto('/');

            // 2. Wait for cards to get generated
            await page.waitForTimeout(3000);

            // 3. Click on one of the cards
            const firstCard = page.locator('.MuiCard-root').first();
            await firstCard.click();

            // 4. Expect modal
            await expect(page.locator('.MuiDialog-root')).toBeVisible();
        });

    });


    test.describe('Navigation', () => {

        // Todo: general navigation test, testing register,login,add-spot,map

        test('general nav test', async () => {
            await homePage.clickExploreMap();

            // Verify navigation
            await expect(homePage.page).toHaveURL('/map');
        });

    });

});
