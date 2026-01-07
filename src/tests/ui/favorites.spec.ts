import { test, expect } from '@playwright/test';
import { HomePage } from './page-objects/HomePage';
import { SearchFilterBar } from './page-objects/SearchFilterBar';
import { createTestHelpers } from './utils/test-helpers';
import { connectTestDB, closeTestDB, deleteTestDocuments, createTestSkatepark } from '../helpers';
import User from '../../models/User';

/**
 * Favorites functionality tests
 * Tests heart icon toggle, persistence, filtering, and cross-session behavior
 */



test.describe('Favorites', () => {
    // Shared test data holders
    let testSpots: Array<{ title: string; spotId?: string }>; 
    let homePage: HomePage;
    let searchFilterBar: SearchFilterBar;

    let testHelpers: ReturnType<typeof createTestHelpers>;

    // Create 3 parks for parallel-safe isolation
    test.beforeAll(async () => {
        await connectTestDB();

        // Worker-specific prefix to prevent parallel interference
        const workerId = Math.random().toString(36).substring(2, 8); // 6 chars

        // Create approved parks within initial viewport (title must be <= 30 chars)
        testSpots = [0, 1, 2].map((i) => ({ title: `W${workerId}-S${i+1}` }));
        for (let i = 0; i < testSpots.length; i++) {
            const creatorId = process.env.DB_ADMIN_ID as string;
            const park = await createTestSkatepark({
                title: testSpots[i].title,
                isApproved: true,
                tags: [],
                photoNames: ['marker-icon.png'],
                location: {
                    type: 'Point',
                    coordinates: [34.7818 + i * 0.001, 32.0853 + i * 0.001], // [lng, lat]
                },
                createdBy: creatorId,
            });
            testSpots[i].spotId = park._id.toString();
        }
    });

    // Cleanup parks created for this suite
    test.afterAll(async () => {
        try {
            const spotIds = (testSpots || []).map(s => s.spotId).filter(Boolean) as string[];
            if (spotIds.length) {
                await deleteTestDocuments('Skatepark', spotIds);
            }
        } finally {
            await closeTestDB().catch(() => {});
        }
    });

    // setup geolocation only; tests handle their own login
    test.beforeEach(async ({ page }) => { 
        testHelpers = createTestHelpers(page);
        homePage = new HomePage(page);
        searchFilterBar = new SearchFilterBar(page);

        // Set up geolocation for consistent testing
        await testHelpers.setupGeolocation();
    });

    test('should toggle favorite on/off and update counter', async ({ page }) => {
        // 1. login with user A, then go home
        await testHelpers.login(
            process.env.DB_USER_A_EMAIL as string,
            process.env.DB_USERS_PASSWORD as string
        );
        await homePage.goto();
        await homePage.waitForLoad();
        await testHelpers.waitForFavoritesToLoad();

        // 2. Wait for cards to appear instead of API call
        await expect(page.locator('.MuiCard-root').first()).toBeVisible({ timeout: 30000 });
        await page.waitForTimeout(1000); // Allow cards to render

        // 3. locate mockSpot 1, read initial counter value (should be 0)
        const spotTitle = testSpots[0].title;
        // Narrow the list to the specific spot using the search box
        const searchBox = page.getByRole('textbox', { name: 'Search spots, tags, locations' });
        await searchBox.click();
        await searchBox.fill(spotTitle);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000); // Allow search to filter
        const card = page.locator('.MuiCard-root').filter({ hasText: spotTitle }).first();
        await card.scrollIntoViewIfNeeded();
        await expect(card).toBeVisible({ timeout: 15000 });

        const likeButton = card.getByTestId('favorite-toggle').first();
        const counter = card.getByTestId('favorite-count');
        await expect(counter).toBeVisible({ timeout: 15000 });

        await expect(async () => {
            await expect(likeButton).toHaveAttribute('aria-label', /add to favorites/i, { timeout: 1000 });
        }).toPass({ timeout: 15000, intervals: [500] });

        const initialCounter = parseInt((await counter.textContent()) || '0');
        expect(initialCounter).toBe(0);

        // 3. toggle favorite on, expect counter should be 1 and toast
        await likeButton.click();
        await testHelpers.waitForApiCall('/api/favorites');

        await expect(async () => {
            await expect(likeButton).toHaveAttribute('aria-label', /remove from favorites/i, { timeout: 1000 });
            const current = parseInt((await counter.textContent()) || '0');
            expect(current).toBe(initialCounter + 1);
        }).toPass({ timeout: 20000, intervals: [500] });

        await expect(page.getByRole('alert').filter({ hasText: /Added to favorites!/i }).first()).toBeVisible({ timeout: 15000 });

        // 4. toggle favorite off, expect counter should be 0 and toast
        await likeButton.click();
        await testHelpers.waitForApiCall('/api/favorites');

        await expect(async () => {
            await expect(likeButton).toHaveAttribute('aria-label', /add to favorites/i, { timeout: 1000 });
            const current = parseInt((await counter.textContent()) || '0');
            expect(current).toBe(initialCounter);
        }).toPass({ timeout: 20000, intervals: [500] });

        await expect(page.getByRole('alert').filter({ hasText: /Removed from favorites/i }).first()).toBeVisible({ timeout: 15000 });
    });

    test('should persist favorite state after page reload', async ({ page }) => {
        // 1. log in as user B and go home
        await testHelpers.login(
            process.env.DB_USER_B_EMAIL as string,
            process.env.DB_USERS_PASSWORD as string
        );
        await homePage.goto();
        await homePage.waitForLoad();
        await testHelpers.waitForFavoritesToLoad();

        // 2. Wait for parks to load before searching
        await testHelpers.waitForApiCall('/api/skateparks', 30000);
        await page.waitForTimeout(1000); // Allow cards to render

        // 3. locate MockSpot 2 card
        const spotTitle = testSpots[1].title; // "MockSpot 2"
        const searchBox = page.getByRole('textbox', { name: 'Search spots, tags, locations' });
        await searchBox.click();
        await searchBox.fill(spotTitle);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000); // Allow search to filter
        const card = page.locator('.MuiCard-root').filter({ hasText: spotTitle }).first();
        await card.scrollIntoViewIfNeeded();
        await expect(card).toBeVisible({ timeout: 15000 });
        const likeButton = card.getByTestId('favorite-toggle').first();
        const counter = card.getByTestId('favorite-count');
        await expect(counter).toBeVisible({ timeout: 15000 });

        // 3. click favorite to ensure it's added, save current count (should be 1)
        const ariaBefore = (await likeButton.getAttribute('aria-label')) || '';
        if (!/remove from favorites/i.test(ariaBefore)) {
            await likeButton.click();
            await testHelpers.waitForApiCall('/api/favorites');
            await expect(async () => {
                await expect(likeButton).toHaveAttribute('aria-label', /remove from favorites/i, { timeout: 1000 });
            }).toPass({ timeout: 15000, intervals: [500] });
        }
        const countBeforeReload = parseInt((await counter.textContent()) || '0');

        // 4. reload the page
        await page.reload();
        await homePage.waitForLoad();
        await testHelpers.waitForFavoritesToLoad();
        // Wait for parks to load after reload
        await testHelpers.waitForApiCall('/api/skateparks', 30000);
        await page.waitForTimeout(1000);

        // 5. Re-search for the card after reload
        const searchBoxAfter = page.getByRole('textbox', { name: 'Search spots, tags, locations' });
        await searchBoxAfter.click();
        await searchBoxAfter.fill(spotTitle);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);

        // 6. re-locate card, expect aria-label remove and same count
        const reloadedCard = page.locator('.MuiCard-root').filter({ hasText: spotTitle }).first();
        await reloadedCard.scrollIntoViewIfNeeded();
        await expect(reloadedCard).toBeVisible({ timeout: 15000 });
        const likeAfter = reloadedCard.getByTestId('favorite-toggle').first();
        const counterAfter = reloadedCard.getByTestId('favorite-count');
        await expect(async () => {
            await expect(likeAfter).toHaveAttribute('aria-label', /remove from favorites/i, { timeout: 1000 });
            const countAfter = parseInt((await counterAfter.textContent()) || '0');
            expect(countAfter).toBe(countBeforeReload);
        }).toPass({ timeout: 20000, intervals: [500] });
    });

    test('should persist favorites across logout/login session', async ({ page }) => {
        // Login with user C and go to home
        await testHelpers.login(
            process.env.DB_USER_C_EMAIL as string,
            process.env.DB_USERS_PASSWORD as string
        );
        await homePage.goto();
        await homePage.waitForLoad();
        await testHelpers.waitForFavoritesToLoad();
      
        // Wait for parks to load
        await testHelpers.waitForApiCall('/api/skateparks', 30000);
        await page.waitForTimeout(1000); // Allow cards to render

        // locate mockSpot 3
        const spotTitle = testSpots[2].title;
        
        const searchBox = page.getByRole('textbox', { name: 'Search spots, tags, locations' });
        await searchBox.click();
        await searchBox.fill(spotTitle);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000); // Allow search to filter
        
        const card = page.locator('.MuiCard-root').filter({ hasText: spotTitle }).first();
        await card.scrollIntoViewIfNeeded();
        await expect(card).toBeVisible({ timeout: 15000 });

        // locate like button on this card
        const likeButton = card.getByTestId('favorite-toggle').first();

        // click like button
        await likeButton.click();
        await testHelpers.waitForApiCall('/api/favorites');        
        await expect(async () => {
            await expect(likeButton).toHaveAttribute('aria-label', /remove from favorites/i, { timeout: 1000 });
        }).toPass({ timeout: 20000, intervals: [500] });

        // save current count before logout/login
        const counterBefore = card.getByTestId('favorite-count');
        const countBeforeReload = parseInt((await counterBefore.textContent()) || '0');

        // log out
        await testHelpers.logout();
        await page.waitForTimeout(1000);

        // login again as user C
        await testHelpers.login(
            process.env.DB_USER_C_EMAIL as string,
            process.env.DB_USERS_PASSWORD as string
        );
        await homePage.goto();
        await homePage.waitForLoad();
        await testHelpers.waitForFavoritesToLoad();
        // Wait for parks to load after login
        await testHelpers.waitForApiCall('/api/skateparks', 30000);
        await page.waitForTimeout(1000);

        // locate mockSpot 3 again, expect the aria-label to be "remove from favorites" and same count
        const searchBoxAfter = page.getByRole('textbox', { name: 'Search spots, tags, locations' });
        await searchBoxAfter.click();
        await searchBoxAfter.fill(spotTitle);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000); // Allow search to filter
        const reloadedCard = page.locator('.MuiCard-root').filter({ hasText: spotTitle }).first();
        await reloadedCard.scrollIntoViewIfNeeded();
        await expect(reloadedCard).toBeVisible({ timeout: 15000 });        
        const likeAfter = reloadedCard.getByTestId('favorite-toggle').first();
        const counterAfter = reloadedCard.getByTestId('favorite-count');
        
        await expect(async () => {
            const countAfter = parseInt((await counterAfter.textContent()) || '0');
            await expect(likeAfter).toHaveAttribute('aria-label', /remove from favorites/i, { timeout: 1000 });
            expect(countAfter).toBe(countBeforeReload);
        }).toPass({ timeout: 20000, intervals: [500] });

       
    });
});

