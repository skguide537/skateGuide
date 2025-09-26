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
// TODO: Need to add validation for success message
  test('Successfull Login', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Email *' }).fill('skateguide12+testAccount@gmail.com');
      await page.getByRole('textbox', { name: 'Email *' }).press('Tab');
      await page.getByRole('textbox', { name: 'Password *' }).fill('asdfghjkl');
      await page.getByRole('button', { name: 'Sign in' }).click();
      
  });
  // TODO: Need to add validation for error message
  TEST_CASES.forEach(testCase => {
    test(`Error Handling - ${testCase.name}`, async ({ page }) => {
      await page.getByRole('textbox', { name: 'Email *' }).fill(testCase.email);
      await page.getByRole('textbox', { name: 'Email *' }).press('Tab');
      await page.getByRole('textbox', { name: 'Password *' }).fill(testCase.password);
      await page.getByRole('button', { name: 'Sign in' }).click();
    });
  });


 
});
