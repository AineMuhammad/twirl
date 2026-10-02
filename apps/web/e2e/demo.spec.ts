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
  for (const name of ['Chair', 'Iron', 'Pillow 01', 'Pillow 02']) {
    await expect(parts(page).getByRole('button', { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  await expect(page.getByText(/4 parts · 35,350 triangles/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('parts can be hidden and recolored, including a custom color', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Hide Pillow 01' }).click();
  await expect(page.getByRole('button', { name: 'Show Pillow 01' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );

  await parts(page).getByRole('button', { name: /^Iron/ }).click();
  const swatch = page
    .getByRole('group', { name: 'Color for Iron' })
    .getByRole('button', { name: 'Terracotta' });
  await swatch.click();
  await expect(swatch).toHaveAttribute('aria-pressed', 'true');
  await expect(parts(page).getByRole('button', { name: /^Iron/ })).toContainText('Terracotta');

  // The custom picker opens inline, right under the swatches.
  await page.getByRole('button', { name: 'Custom color' }).click();
  const hex = page.getByRole('textbox', { name: 'Hex color for Iron' });
  await expect(hex).toBeVisible();
  await hex.fill('12AB34');
  await expect(parts(page).getByRole('button', { name: /^Iron/ })).toContainText('#12AB34');
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(hex).toBeHidden();

  await page.getByRole('button', { name: 'Original', exact: true }).click();
  await expect(parts(page).getByRole('button', { name: /^Iron/ })).toContainText('Original finish');
});

test('scene tab is keyboard reachable and switches lighting', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('tab', { name: 'Parts' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Scene' })).toHaveAttribute('aria-selected', 'true');

  const livingRoom = page.getByRole('button', { name: 'Living room' });
  await expect(livingRoom).toBeVisible();
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
  await expect(parts(page).getByRole('button', { name: /^Body Exterior/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Your file' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('heading', { name: 'jeep_2021.glb' })).toBeVisible();
});

test('layout: panel beside the viewer on desktop, below it on phones', async ({ page }, info) => {
  await page.goto('/demo');
  // The stage is the canvas' container.
  const viewer = await page.locator('canvas').boundingBox();
  const panel = await page.getByRole('complementary', { name: 'Configure' }).boundingBox();
  if (!viewer || !panel) throw new Error('layout not rendered');
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('no viewport');
  if (info.project.name === 'mobile') {
    // Bottom sheet: the stage sits above it (tucked ≤ 32px under its rounded top edge).
    expect(panel.y).toBeGreaterThan(viewer.y + viewer.height - 32);
    expect(panel.y).toBeGreaterThan(viewer.y + viewer.height / 2);
  } else {
    // Full-height sidebar flush with the right edge; the stage ends where it begins.
    expect(Math.round(panel.y)).toBe(0);
    expect(Math.round(panel.height)).toBe(viewport.height);
    expect(Math.round(panel.x + panel.width)).toBe(viewport.width);
    expect(Math.round(viewer.x + viewer.width)).toBeLessThanOrEqual(Math.round(panel.x) + 1);
  }
});
