import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });


  const TEST_CASES = [
    {
      name: 'Invalid email',
      email: 'invalidemail',
      password: 'asdfghjkl'
    },
    {
      name: 'Invalid password',
      email: 'skateguide12+testAccount@gmail.com',
      password: '53477'
    }
  ];
  
  TEST_CASES.forEach(testCase => {
    test(`Error Handling - ${testCase.name}`, async ({ page }) => {
      const emailInput = page.getByRole('textbox', { name: 'Email *' });
      const passwordInput = page.getByRole('textbox', { name: 'Password *' });

      await emailInput.fill(testCase.email);
      await emailInput.press('Tab');
      await passwordInput.fill(testCase.password);
      await page.getByRole('button', { name: 'Sign in' }).click();

      if(testCase.name === 'Invalid password') {
        await expect(page.getByRole('alert').filter({ hasText: 'Unauthorized' }).first()).toBeVisible({ timeout: 15000 });

        return; // Don't attempt submit when client-side validation fails
      }

      // For invalid email, native HTML validation should mark input invalid
      if (testCase.name === 'Invalid email') {
        const emailIsValid = await emailInput.evaluate(el => (el as HTMLInputElement).checkValidity());
        expect(emailIsValid).toBe(false);
        return; // Don't attempt submit when client-side validation fails
      }

      
    });
  });


 
});
