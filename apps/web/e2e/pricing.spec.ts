import { expect, test } from '@playwright/test';

test('the pricing page lists every plan and asks visitors to sign in to upgrade', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Pricing' }).click();
  await expect(page).toHaveURL(/\/pricing$/);
  for (const plan of ['Free', 'Starter', 'Pro']) {
    await expect(page.getByRole('heading', { name: plan, exact: true })).toBeVisible();
  }
  await expect(page.getByText('1 live product', { exact: true })).toBeVisible();
  await expect(page.getByText('50 live products', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in to upgrade' }).first()).toHaveAttribute(
    'href',
    '/signin?callbackUrl=%2Fpricing',
  );
});
