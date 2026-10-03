import { describe, expect, it } from 'vitest';

import { PLAN_ORDER, PLANS } from '@/config/plans';

import { canPublish } from './plans';

describe('plans', () => {
  it('match the published-product limits and watermarks', () => {
    expect(PLAN_ORDER.map((p) => PLANS[p].maxPublishedProducts)).toEqual([1, 10, 50]);
    expect(PLAN_ORDER.map((p) => PLANS[p].watermark)).toEqual([true, false, false]);
  });

  it('allow publishing below the limit, and re-publishing a live product at it', () => {
    expect(canPublish(PLANS.FREE, 0, false)).toBe(true);
    expect(canPublish(PLANS.FREE, 1, false)).toBe(false);
    expect(canPublish(PLANS.FREE, 1, true)).toBe(true);
    expect(canPublish(PLANS.STARTER, 9, false)).toBe(true);
    expect(canPublish(PLANS.STARTER, 10, false)).toBe(false);
  });
});
