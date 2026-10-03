import { parseProductConfig } from '@twirl/config-schema';
import { loungeChairConfig } from '@twirl/config-schema/samples';
import { describe, expect, it } from 'vitest';

import { conditionText, groupSummary, ruleSummary } from './summaries';

const parsed = parseProductConfig(loungeChairConfig);
if (!parsed.success) throw parsed.error;
const config = parsed.data;
const group = (id: string) => {
  const g = config.groups.find((x) => x.id === id);
  if (!g) throw new Error(id);
  return g;
};
const rule = (id: string) => {
  const r = config.rules.find((x) => x.id === id);
  if (!r) throw new Error(id);
  return r;
};

describe('summaries', () => {
  it('summarise each option type', () => {
    expect(groupSummary(config, group('fabric'))).toBe(
      '6 colours + any colour · Seat cushion · Default: Lagoon weave',
    );
    expect(groupSummary(config, group('pillow-navy'))).toBe(
      'Navy cushion · Shown by default · +$39.00 when shown',
    );
    expect(groupSummary(config, group('diameter'))).toBe(
      '100–140 cm · Default 120 cm · 4 parts respond',
    );
  });

  it('read rules as sentences', () => {
    expect(ruleSummary(config, rule('large-needs-brass'))).toBe(
      'If Diameter is at least 135 cm, then Frame finish is Brushed brass.',
    );
    expect(ruleSummary(config, rule('brass-not-terracotta'))).toMatch(/can't be combined with/);
    expect(ruleSummary(config, rule('navy-with-dark-fabrics'))).toBe(
      'If Seat fabric is Oat linen or Sage, disable Navy cushion.',
    );
    expect(conditionText(config, { group: 'gone', equals: 'x' })).toBe('gone (removed)');
  });
});
