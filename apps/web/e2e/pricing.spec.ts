import { expect, test } from '@playwright/test';

test('the pricing page lists every plan and asks visitors to sign in to upgrade', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Pricing' })
    .click();
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

test('the model request form is reachable from pricing and admins only can list requests', async ({
  page,
}) => {
  await page.goto('/pricing');
  await page.getByRole('link', { name: 'We can make one' }).click();
  await expect(page.getByRole('heading', { name: 'Need a 3D model?' })).toBeVisible();
  await expect(page.getByLabel('What do you need?')).toBeVisible();
  await page.goto('/admin/model-requests');
  await expect(page).toHaveURL(/\/signin/);
});

test('the footer links to about and contact pages', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Company' })
    .getByRole('link', { name: 'About' })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Configurable products');
  await page
    .getByRole('navigation', { name: 'Company' })
    .getByRole('link', { name: 'Contact' })
    .click();
  await expect(page.getByRole('heading', { name: 'Get in touch' })).toBeVisible();
  await expect(page.getByLabel('What’s it about?')).toBeVisible();
});
