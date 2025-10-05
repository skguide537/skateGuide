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
    email: 'invalidemail@',
    password: 'asdfghjkl'
  },

];

// TODO: Need to add validation for success message
test('Create new user', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Name *' }).click();
  await page.getByRole('textbox', { name: 'Name *' }).fill('Test');
  await page.getByRole('textbox', { name: 'Email *' }).fill('skateguide12testAccount@gmail.com');
  await page.getByRole('textbox', { name: 'Email *' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password *' }).fill('asdfghjkl');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Account created successfully!' }).first()).toBeVisible({ timeout: 15000 });
});

TEST_CASES.forEach(testCase => {
  test(`Error Handling - ${testCase.name}`, async ({ page }) => {
    await page.getByRole('textbox', { name: 'Name *' }).click();
    await page.getByRole('textbox', { name: 'Name *' }).fill(testCase.name);
    await page.getByRole('textbox', { name: 'Email *' }).fill(testCase.email);
    await page.getByRole('textbox', { name: 'Password *' }).fill(testCase.password);
    await page.getByRole('button', { name: 'Sign up' }).click();
    // For empty/invalid inputs, the browser/MUI will block submit with native
    // HTML5 validation. In those cases we should assert the input's validity
    // state instead of expecting a server error banner.
    const emailInput = page.getByRole('textbox', { name: 'Email *' });
    const passwordInput = page.getByRole('textbox', { name: 'Password *' });

    const expectedEmailInvalid = testCase.email === '' || testCase.email === 'invalidemail@';
    const expectedPasswordInvalid = testCase.password === '';

    // checkValidity() reflects native constraint validation (required, pattern, etc.)
    const emailIsValid = await emailInput.evaluate(el => (el as HTMLInputElement).checkValidity());
    const passwordIsValid = await passwordInput.evaluate(el => (el as HTMLInputElement).checkValidity());

    if (expectedEmailInvalid) expect(emailIsValid).toBe(false);
    
    if (expectedPasswordInvalid) expect(passwordIsValid).toBe(false);
    
    // Only when client-side validation passes do we expect the server error UI
    // (e.g., duplicate/unknown backend failures), so assert the banner then.
    if (!expectedEmailInvalid && !expectedPasswordInvalid) {
      await expect(page.getByText('Registration failed: Internal Server Error').first()).toBeVisible();
    }
  });
});
});
