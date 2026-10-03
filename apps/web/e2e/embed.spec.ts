import { expect, test } from '@playwright/test';

test('unknown or unpublished products show a friendly message', async ({ page }) => {
  await page.goto('/embed/doesNotExist1');
  await expect(page.getByText("This product isn't available")).toBeVisible();
});

test('only the embed can be framed; embed.js is served', async ({ request }) => {
  const dashboard = await request.get('/demo');
  expect(dashboard.headers()['x-frame-options']).toBe('DENY');
  expect(dashboard.headers()['content-security-policy']).toContain("frame-ancestors 'none'");

  const embed = await request.get('/embed/doesNotExist1');
  expect(embed.headers()['x-frame-options']).toBeUndefined();
  expect(embed.headers()['content-security-policy'] ?? '').not.toContain('frame-ancestors');

  const script = await request.get('/embed.js');
  expect(script.ok()).toBe(true);
  expect(await script.text()).toContain('data-twirl-product');
});
