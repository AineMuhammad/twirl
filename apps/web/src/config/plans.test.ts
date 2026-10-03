import { describe, expect, it } from 'vitest';

import { planHighlights, planPriceLabel, PLANS } from './plans';

describe('pricing copy', () => {
  it('derives highlights and price labels from the plan config', () => {
    expect(planHighlights(PLANS.FREE)).toEqual([
      '1 live product',
      '“Made with Twirl” watermark',
      'Unlimited drafts',
    ]);
    expect(planHighlights(PLANS.PRO)[0]).toBe('50 live products');
    expect(planPriceLabel(PLANS.FREE)).toBe('$0');
    expect(planPriceLabel(PLANS.STARTER)).toBe('Contact us');
    expect(planPriceLabel({ ...PLANS.PRO, monthlyPriceUsd: 49 })).toBe('$49 / month');
  });
});
