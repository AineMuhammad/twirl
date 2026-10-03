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

const options = (page: Page) => page.getByRole('list', { name: 'Options' });
const total = (page: Page) => page.getByTestId('price-total');

test('home links to the demo, which loads the sample with its options', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await page.getByRole('link', { name: 'Try the demo' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Halo Lounge Chair' })).toBeVisible();

  for (const name of ['Seat fabric', 'Frame finish']) {
    await expect(options(page).getByRole('button', { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  await expect(options(page).getByRole('switch', { name: /Navy cushion/ })).toBeVisible();
  // Base price plus the two cushions included by default.
  await expect(total(page)).toHaveText('$987.00');
  expect(errors).toEqual([]);
});

test('options update the price, rules correct conflicts, custom colours work', async ({ page }) => {
  await page.goto('/demo');
  const fabric = page.getByRole('group', { name: 'Seat fabric' });
  await fabric.getByRole('button', { name: /^Teal velvet/ }).click();
  await expect(total(page)).toHaveText('$1,047.00');

  await options(page)
    .getByRole('switch', { name: /Navy cushion/ })
    .click();
  await expect(total(page)).toHaveText('$1,008.00');

  // Brass and terracotta are exclusive: choosing brass replaces the terracotta fabric.
  await fabric.getByRole('button', { name: 'Terracotta' }).click();
  await options(page)
    .getByRole('button', { name: /^Frame finish/ })
    .click();
  await page
    .getByRole('group', { name: 'Frame finish' })
    .getByRole('button', { name: /^Brushed brass/ })
    .click();
  await expect(page.getByRole('status')).toContainText("Brushed brass isn't offered");
  await expect(options(page).getByRole('button', { name: /^Seat fabric/ })).not.toContainText(
    'Terracotta',
  );

  await options(page)
    .getByRole('button', { name: /^Seat fabric/ })
    .click();
  await page.getByRole('button', { name: /^Custom color/ }).click();
  const hex = page.getByRole('textbox', { name: 'Hex color for Seat fabric' });
  await hex.fill('12AB34');
  await expect(options(page).getByRole('button', { name: /^Seat fabric/ })).toContainText('Custom');
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(hex).toBeHidden();

  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(total(page)).toHaveText('$987.00');
});

test('scene tab is keyboard reachable and switches lighting', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('tab', { name: 'Options' }).focus();
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
  // Uploads get a generated config: a colour and a show/hide option per part.
  await expect(options(page).getByRole('button', { name: /^Body Exterior/ })).toBeVisible();
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
