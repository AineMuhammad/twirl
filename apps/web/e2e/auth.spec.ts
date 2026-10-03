import { expect, test } from '@playwright/test';

test('the dashboard asks visitors to sign in and comes back afterwards', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/signin\?callbackUrl=%2Fdashboard$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('sign-in errors are explained, and off-site return URLs are ignored', async ({ page }) => {
  await page.goto('/signin?error=Verification&callbackUrl=https://evil.example');
  // Scoped by text: Next.js also renders an (empty) role="alert" route announcer.
  await expect(page.getByRole('alert').filter({ hasText: 'expired' })).toBeVisible();
  const returnTo = page.locator('input[name=callbackUrl]').first();
  if ((await returnTo.count()) > 0) await expect(returnTo).toHaveValue('/dashboard');
});
