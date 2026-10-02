import { resolve } from 'node:path';

import { expect, type Page, test } from '@playwright/test';

const SAMPLES = resolve(import.meta.dirname, '../public/samples');

/** Collects console errors and uncaught exceptions so tests can assert there were none. */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

const parts = (page: Page) => page.getByRole('list', { name: 'Parts' });

test('home links to the demo, which loads the sample with its parts', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await page.getByRole('link', { name: 'Try the demo' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.locator('canvas')).toBeVisible();

  // The sample is Draco-compressed: listing its parts proves the decoders are served.
  for (const name of ['Chair', 'iron', 'Pillow_01', 'Pillow_02']) {
    await expect(parts(page).getByRole('button', { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  await expect(page.getByText(/4 meshes · 35,350 triangles/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('parts can be hidden and recolored', async ({ page }) => {
  await page.goto('/demo');
  const hide = page.getByRole('button', { name: 'Hide Pillow_01' });
  await hide.click();
  await expect(page.getByRole('button', { name: 'Show Pillow_01' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );

  await parts(page).getByRole('button', { name: /^iron/ }).click();
  const swatch = page
    .getByRole('group', { name: 'Color for iron' })
    .getByRole('button', { name: 'Terracotta' });
  await swatch.click();
  await expect(swatch).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Original' }).click();
  await expect(swatch).toHaveAttribute('aria-pressed', 'false');
});

test('scene tab is keyboard reachable and switches lighting', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('tab', { name: 'Parts' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Scene' })).toHaveAttribute('aria-selected', 'true');

  const livingRoom = page.getByRole('button', { name: 'Living room' });
  await livingRoom.click();
  await expect(livingRoom).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('switch', { name: 'Shadows' }).click();
  await expect(page.getByRole('switch', { name: 'Shadows' })).toHaveAttribute(
    'aria-checked',
    'false',
  );
});

test('uploading a local model replaces the sample; bad files are explained', async ({ page }) => {
  await page.goto('/demo');
  const input = page.locator('input[type=file]');

  await input.setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hi'),
  });
  // Scoped by text: Next.js also renders an (empty) role="alert" route announcer.
  await expect(page.getByRole('alert').filter({ hasText: '.glb or .gltf' })).toBeVisible();
  await page.getByRole('button', { name: 'Dismiss' }).click();

  await input.setInputFiles(resolve(SAMPLES, 'jeep_2021.glb'));
  await expect(parts(page).getByRole('button', { name: /^Body_Exterior/ })).toBeVisible();
  await expect(page.getByRole('combobox')).toHaveValue(/^blob:/);
});

test('layout: panel beside the viewer on desktop, below it on phones', async ({ page }, info) => {
  await page.goto('/demo');
  const viewer = await page.locator('main').boundingBox();
  const panel = await page.getByRole('complementary', { name: 'Configure' }).boundingBox();
  if (!viewer || !panel) throw new Error('layout not rendered');
  if (info.project.name === 'mobile') {
    expect(panel.y).toBeGreaterThanOrEqual(viewer.y + viewer.height - 1);
  } else {
    expect(panel.x).toBeGreaterThanOrEqual(viewer.x + viewer.width - 1);
  }
});
