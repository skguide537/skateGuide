import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

const TEST_CASES = [
  {
    name: 'No user name',
    email: 'skateguide12+testAccount@gmail.com',
    password: 'asdfghjkl'
  },
  {
    name: 'No email',
    email: '',
    password: 'asdfghjkl'
  },
  {
    name: 'No password',
    email: 'skateguide12+testAccount@gmail.com',
    password: ''
  },
  {
    name: 'Existing email',
    email: 'skateguide12+testAccount@gmail.com',
    password: 'asdfghjkl'
  },
  {
    name: 'Invalid email',
    email: 'invalidemail',
    password: 'asdfghjkl'
  },

];

// TODO: Need to add validation for success message
test('Create new user', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Name *' }).click();
  await page.getByRole('textbox', { name: 'Name *' }).fill('Test');
  await page.getByRole('textbox', { name: 'Email *' }).fill('skateguide12+testAccount@gmail.com');
  await page.getByRole('textbox', { name: 'Email *' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password *' }).fill('asdfghjkl');
  await page.getByRole('button', { name: 'Sign up' }).click();
});

TEST_CASES.forEach(testCase => {
  test(`Error Handling - ${testCase.name}`, async ({ page }) => {
    await page.getByRole('textbox', { name: 'Name *' }).click();
    await page.getByRole('textbox', { name: 'Name *' }).fill(testCase.name);
    await page.getByRole('textbox', { name: 'Email *' }).fill(testCase.email);
    await page.getByRole('textbox', { name: 'Password *' }).fill(testCase.password);
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page.getByText('Registration failed')).toBeVisible();
  });
});
});
