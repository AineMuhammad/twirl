import { describe, expect, it } from 'vitest';

import { evaluate } from '../engine';
import { parseProductConfig } from '../migrations';
import * as samples from './index';

describe.each(Object.entries(samples))('sample %s', (_name, input) => {
  const parsed = parseProductConfig(input);

  it('is a valid product config', () => {
    if (!parsed.success) throw parsed.error;
    expect(parsed.data.parts.length).toBeGreaterThan(0);
  });

  it('evaluates its default configuration cleanly', () => {
    if (!parsed.success) throw parsed.error;
    const result = evaluate(parsed.data, {});
    expect(result.violations).toEqual([]);
    expect(result.corrections).toEqual([]);
    // Add-ons shown by default are part of the default price.
    const defaultAddOns = parsed.data.groups.reduce(
      (sum, g) => sum + (g.type === 'visibility' && g.default ? g.price : 0),
      0,
    );
    expect(result.price.total).toBe(parsed.data.pricing.base + defaultAddOns);
  });

  it('puts every part in at least one option group or keeps it on purpose', () => {
    if (!parsed.success) throw parsed.error;
    const used = new Set(
      parsed.data.groups.flatMap((g) =>
        g.type === 'dimension' ? g.behaviors.map((b) => b.part) : g.parts,
      ),
    );
    // A few fixed, named pieces are fine, but most parts should be configurable.
    const unused = parsed.data.parts.filter((p) => !used.has(p.id));
    expect(unused.length).toBeLessThanOrEqual(2);
  });
});
