import { test, expect } from '@playwright/test';
import { HomePage } from './page-objects/HomePage';
import { SearchFilterBar } from './page-objects/SearchFilterBar';
import { createTestHelpers } from './utils/test-helpers';
import { connectTestDB, closeTestDB, deleteTestDocuments, createAuthenticatedTestUser, createTestSkatepark } from '../helpers';

/**
 * Favorites functionality tests
 * Tests heart icon toggle, persistence, filtering, and cross-session behavior
 */



test.describe('Favorites', () => {
    // Shared test data holders
    let testUsers: Array<{ email: string; password: string; userId?: string }>; 
    let testSpots: Array<{ title: string; spotId?: string }>; 
    let homePage: HomePage;
    let searchFilterBar: SearchFilterBar;

    let testHelpers: ReturnType<typeof createTestHelpers>;

    // Create 3 users and 3 parks for parallel-safe isolation
    test.beforeAll(async () => {
        await connectTestDB();

        // Unique suite id to avoid duplicates across workers
        const suiteId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        // Short id for titles to satisfy maxlength: 30
        const titleId = Math.random().toString(36).slice(2, 7);

        testUsers = [0, 1, 2].map((i) => ({
            email: `fav-e2e-${suiteId}-${i}@test.com`,
            password: 'Test123456!',
            userId: undefined,
        }));

        // Create users directly in DB
        for (const u of testUsers) {
            const { user } = await createAuthenticatedTestUser({
                email: u.email,
                password: u.password,
            });
            u.userId = user._id.toString();
        }

        // Create approved parks within initial viewport (title must be <= 30 chars)
        testSpots = [0, 1, 2].map((i) => ({ title: `MS${i + 1}-${titleId}` }));
        for (let i = 0; i < testSpots.length; i++) {
            const creatorId = testUsers[i].userId as string;
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

    // Cleanup users and parks created for this suite
    test.afterAll(async () => {
        try {
            const spotIds = (testSpots || []).map(s => s.spotId).filter(Boolean) as string[];
            if (spotIds.length) {
                await deleteTestDocuments('Skatepark', spotIds);
            }

            const userIds = (testUsers || []).map(u => u.userId).filter(Boolean) as string[];
            if (userIds.length) {
                await deleteTestDocuments('User', userIds);
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
        // 1. login with user 0, then go home
        await testHelpers.login(testUsers[0].email, testUsers[0].password);
        await homePage.goto();
        await homePage.waitForLoad();
        await testHelpers.waitForFavoritesToLoad();

        // 2. locate mockSpot 1, read initial counter value (should be 0)
        const spotTitle = testSpots[0].title;
        // Narrow the list to the specific spot using the search box
        const searchBox = page.getByRole('textbox', { name: 'Search spots, tags, locations' });
        await searchBox.click();
        await searchBox.fill(spotTitle);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
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
        // 1. log in as user 2 and go home
        await testHelpers.login(testUsers[1].email, testUsers[1].password);
        await homePage.goto();
        await homePage.waitForLoad();
        await testHelpers.waitForFavoritesToLoad();

        // 2. locate MockSpot 2 card
        const spotTitle = testSpots[1].title; // "MockSpot 2"
        const searchBox = page.getByRole('textbox', { name: 'Search spots, tags, locations' });
        await searchBox.click();
        await searchBox.fill(spotTitle);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
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
        await page.waitForTimeout(1000);

        // 5. re-locate card, expect aria-label remove and same count
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
        // Login with user 3 and go to home
        await testHelpers.login(testUsers[2].email, testUsers[2].password);
        await homePage.goto();
        await homePage.waitForLoad();
        await testHelpers.waitForFavoritesToLoad();
      
        // Wait for cards to load
        await page.waitForTimeout(2000);

        // locate mockSpot 3
        const spotTitle = testSpots[2].title;
        const searchBox = page.getByRole('textbox', { name: 'Search spots, tags, locations' });
        await searchBox.click();
        await searchBox.fill(spotTitle);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
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

        // login again as user 3
        await testHelpers.login(testUsers[2].email, testUsers[2].password);
        await homePage.goto();
        await homePage.waitForLoad();
        await testHelpers.waitForFavoritesToLoad();

        // locate mockSpot 3 again, expect the aria-label to be "remove from favorites" and same count
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
});

