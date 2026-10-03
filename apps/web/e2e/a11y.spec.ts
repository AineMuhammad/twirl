import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Automated accessibility checks (WCAG 2.1 A/AA) on the public pages. They catch missing
// labels, contrast problems and invalid ARIA; they don't replace manual keyboard testing.
const PAGES = [
  '/',
  '/pricing',
  '/about',
  '/contact',
  '/signin',
  '/request-model',
  '/embed/doesNotExist1',
  '/demo',
];

for (const path of PAGES) {
  test(`no detectable accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle').catch(() => {});
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // The 3D canvas has no text content to check.
      .exclude('canvas')
      .analyze();
    const summary = results.violations.map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help} → ${v.nodes
          .map((n) => n.target.join(' '))
          .slice(0, 3)
          .join(' | ')}`,
    );
    expect(summary).toEqual([]);
  });
}
