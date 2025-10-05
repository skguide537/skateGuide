import { test, expect } from '@playwright/test';
import { createTestHelpers } from './utils/test-helpers';
let testHelpers: ReturnType<typeof createTestHelpers>;

test.beforeEach(async ({ page }) => {
    testHelpers = createTestHelpers(page);
});

test.describe('Add Spot Page', () => {

    test('Verify Map Section', async ({ page }) => {
        await page.goto('/add-spot');
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


    test('should handle address search', async ({ page }) => {
        await testHelpers.login(process.env.DB_ADMIN_EMAIL as string, process.env.DB_ADMIN_PASSWORD as string);
        await page.goto('/add-spot');
        await page.getByRole('combobox', { name: 'Country' }).click();
        await page.getByRole('combobox', { name: 'Country' }).fill('Ger');
        await page.getByRole('option', { name: 'Germany' }).click();
        await page.getByRole('combobox', { name: 'City' }).click();
        await page.getByRole('combobox', { name: 'City' }).fill('Berl');
        await page.getByRole('option', { name: 'Berlin' }).click();
        await page.getByRole('combobox', { name: 'Street' }).click();
        await page.getByRole('combobox', { name: 'Street' }).fill('Brandenburgische Straße');
        await page.getByRole('button', { name: 'Search Address' }).click();
        await expect(page.getByRole('alert').filter({ hasText: 'Location found: Brandenburgische Straße, Wilmersdorf, Charlottenburg-Wilmersdorf' }).first()).toBeVisible({ timeout: 15000 });
    });

    test('Create new spot', async ({ page }) => {
        // login before posting a spot
        const helpers = createTestHelpers(page)
        await helpers.login(process.env.DB_ADMIN_EMAIL as string, process.env.DB_ADMIN_PASSWORD as string);


        await page.goto('/add-spot');
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
        await page.getByRole('button', { name: '📍 Use My Location' }).click();
        await page.getByRole('textbox', { name: 'Add a link (e.g., Instagram,' }).click();
        await page.getByRole('textbox', { name: 'Add a link (e.g., Instagram,' }).fill('https://www.youtube.com/shorts/r6OBMUX7nlg');

        let targetId: string | undefined;
        try {
            console.log('🚀 Submitting skatepark...');

            // Capture the POST response to get the created skatepark ID
            const responsePromise = page.waitForResponse(
                response => response.url().includes('/api/skateparks') && response.request().method() === 'POST'
            );

            await page.getByRole('button', { name: 'Submit Skate Spot' }).click();

            const response = await responsePromise;
            const createdPark = await response.json();

            if (createdPark?._id) {
                targetId = createdPark._id;
                console.log(`✅ Skatepark created with ID: ${targetId}`);
            } else {
                console.error('❌ No _id in response:', createdPark);
            }

            console.log('✅ Waiting for success toast...');
            await expect(page.getByRole('alert').filter({ hasText: 'Skatepark added!' }).first()).toBeVisible({ timeout: 15000 });
            console.log('✅ Toast visible');

            await expect(page).toHaveURL('/', { timeout: 15000 });
            console.log('✅ Redirected to home page');
        } finally {
            if (targetId) {
                console.log(`🗑️ Cleaning up: deleting skatepark ${targetId}...`);

                const adminId = process.env.DB_ADMIN_ID;
                if (!adminId) {
                    console.error('❌ DB_ADMIN_ID not found in environment variables');
                    console.warn('⚠️ Skipping cleanup - manual deletion required');
                    return;
                }


                const deleteRes = await page.request.delete(`http://localhost:3000/api/skateparks/${targetId}`, {
                    headers: {
                        'x-user-id': adminId
                    }
                }).catch((err) => {
                    console.error('❌ Cleanup request failed:', err);
                    return null;
                });

                if (deleteRes?.ok()) {
                    console.log('✅ Cleanup successful - skatepark deleted');
                } else if (deleteRes) {
                    const errorBody = await deleteRes.json().catch(() => ({}));
                    console.error(`❌ Cleanup failed with status ${deleteRes.status()}:`, errorBody);
                    console.warn('⚠️ Manual cleanup required for ID:', targetId);
                }
            } else {
                console.warn('⚠️ No targetId found - skipping cleanup');
            }
        }
    });


});

