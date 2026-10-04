import { describe, expect, it } from 'vitest';

import { planHighlights, planPriceLabel, PLANS, trialState } from './plans';

describe('pricing copy', () => {
  it('derives highlights and price labels from the plan config', () => {
    expect(planHighlights(PLANS.FREE)).toEqual([
      '1 live product',
      '14 days, then upgrade to stay live',
      '“Made with Twirl” watermark',
      'Unlimited drafts',
    ]);
    expect(planHighlights(PLANS.PRO)[0]).toBe('50 live products');
    expect(planPriceLabel(PLANS.FREE)).toBe('$0');
    expect(planPriceLabel(PLANS.STARTER)).toBe('Contact us');
    expect(planPriceLabel({ ...PLANS.PRO, monthlyPriceUsd: 49 })).toBe('$49 / month');
  });
});

describe('free trial', () => {
  const now = new Date('2026-10-10T12:00:00Z');
  const inHours = (h: number) => new Date(now.getTime() + h * 3_600_000);

  it('counts whole days left, rounding up', () => {
    expect(trialState('FREE', inHours(14 * 24), now)).toEqual({
      active: true,
      ended: false,
      daysLeft: 14,
    });
    expect(trialState('FREE', inHours(25), now).daysLeft).toBe(2);
    expect(trialState('FREE', inHours(1), now).daysLeft).toBe(1);
  });

  it('ends at the end date', () => {
    expect(trialState('FREE', now, now)).toEqual({ active: false, ended: true, daysLeft: 0 });
    expect(trialState('FREE', inHours(-48), now).ended).toBe(true);
  });

  it("doesn't apply to paid plans", () => {
    for (const plan of ['STARTER', 'PRO'] as const) {
      expect(trialState(plan, inHours(-48), now)).toEqual({
        active: false,
        ended: false,
        daysLeft: 0,
      });
    }
  });
});
