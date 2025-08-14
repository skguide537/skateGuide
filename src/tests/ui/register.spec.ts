import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display the registration form', async ({ page }) => {
    // Check if the form is visible (actual text from the page)
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    
    // Check if all form fields are present
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    
    // Check if submit button is present (actual text from the page)
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
    
    // Check if login link is present
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('should allow user to fill out the form', async ({ page }) => {
    // Fill out the form
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('testpassword123');
    
    // Verify the form is filled
    await expect(page.getByLabel(/name/i)).toHaveValue('Test User');
    await expect(page.getByLabel(/email/i)).toHaveValue('test@example.com');
    await expect(page.getByLabel(/password/i)).toHaveValue('testpassword123');
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Should show browser validation (required field indicators)
    const nameField = page.getByLabel(/name/i);
    const emailField = page.getByLabel(/email/i);
    const passwordField = page.getByLabel(/password/i);
    
    // Check if fields are marked as required
    await expect(nameField).toHaveAttribute('required');
    await expect(emailField).toHaveAttribute('required');
    await expect(passwordField).toHaveAttribute('required');
  });

  test('should handle successful registration', async ({ page }) => {
    // Mock successful registration response
    await page.route('/api/auth/register', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'new-user-id',
          name: 'Test User',
          email: 'test@example.com',
          token: 'mock-jwt-token'
        })
      });
    });

    // Fill and submit form
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('testpassword123');
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Should redirect to map page (actual redirect from the code)
    await expect(page).toHaveURL('/map');
  });

  test('should handle registration failure (duplicate email)', async ({ page }) => {
    // Mock failed registration response
    await page.route('/api/auth/register', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'User already exists'
        })
      });
    });

    // Fill and submit form
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('existing@example.com');
    await page.getByLabel(/password/i).fill('testpassword123');
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Should show error message - use first occurrence to avoid duplicate issues
    await expect(page.getByText(/user already exists/i).first()).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    // Click on sign in link
    await page.getByRole('link', { name: /sign in/i }).click();
    
    // Should navigate to login page
    await expect(page).toHaveURL('/login');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Form should still be usable on mobile
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    
    // Button should be properly sized for mobile
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
  });
});
