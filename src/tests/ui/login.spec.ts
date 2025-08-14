import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display the login form', async ({ page }) => {
    // Check if the form is visible
    await expect(page.getByRole('heading', { name: /sign in to your account/i })).toBeVisible();
    
    // Check if all form fields are present
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    
    // Check if submit button is present
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    // Check if register link is present
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('should allow user to fill out the form', async ({ page }) => {
    // Fill out the form
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('testpassword123');
    
    // Verify the form is filled
    await expect(page.getByLabel(/email/i)).toHaveValue('test@example.com');
    await expect(page.getByLabel(/password/i)).toHaveValue('testpassword123');
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show browser validation (required field indicators)
    const emailField = page.getByLabel(/email/i);
    const passwordField = page.getByLabel(/password/i);
    
    // Check if fields are marked as required
    await expect(emailField).toHaveAttribute('required');
    await expect(passwordField).toHaveAttribute('required');
  });

  test('should handle successful login', async ({ page }) => {
    // Mock successful login response
    await page.route('/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          token: 'mock-jwt-token'
        })
      });
    });

    // Fill and submit form
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('testpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
  });

  test('should handle login failure', async ({ page }) => {
    // Mock failed login response
    await page.route('/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid credentials'
        })
      });
    });

    // Fill and submit form
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error message - use first occurrence to avoid duplicate issues
    await expect(page.getByText(/invalid credentials/i).first()).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    // Click on sign up link
    await page.getByRole('link', { name: /sign up/i }).click();
    
    // Should navigate to register page
    await expect(page).toHaveURL('/register');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Form should still be usable on mobile
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    
    // Button should be properly sized for mobile
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});
