import { describe, expect, it } from 'vitest';

import { type ProductConfigInput, productConfigSchema } from '../config';
import { jeepConfig, loungeChairConfig } from '../samples';
import { defaultSelections } from '../selections';
import { evaluate, formatPrice, testCondition } from '.';

const chair = productConfigSchema.parse(loungeChairConfig);
const jeep = productConfigSchema.parse(jeepConfig);

describe('testCondition', () => {
  const s = { fabric: { custom: '#123456' }, 'pillow-navy': true, diameter: 130 };
  it('evaluates leaves and combinators', () => {
    expect(testCondition({ group: 'fabric', equals: 'custom' }, s)).toBe(true);
    expect(testCondition({ group: 'pillow-navy', equals: false }, s)).toBe(false);
    expect(testCondition({ group: 'diameter', min: 125 }, s)).toBe(true);
    expect(testCondition({ group: 'diameter', max: 125 }, s)).toBe(false);
    expect(
      testCondition(
        { all: [{ group: 'diameter', min: 100 }, { not: { group: 'fabric', oneOf: ['sage'] } }] },
        s,
      ),
    ).toBe(true);
    expect(testCondition({ any: [{ group: 'missing', equals: true }] }, s)).toBe(false);
  });
});

describe('evaluate: defaults and pricing', () => {
  it('prices the default configuration at the base price', () => {
    const result = evaluate(chair, {});
    expect(result.selections).toEqual(defaultSelections(chair));
    // Both cushions are on by default: $899 + $49 + $39.
    expect(result.price).toEqual({
      currency: 'USD',
      total: 98700,
      lines: [
        { group: 'base', label: 'Halo Lounge Chair', amount: 89900 },
        { group: 'pillow-diamond', label: 'Diamond cushion', amount: 4900 },
        { group: 'pillow-navy', label: 'Navy cushion', amount: 3900 },
      ],
    });
    expect(result.corrections).toEqual([]);
    expect(result.violations).toEqual([]);
  });

  it('adds swatch, custom and per-step prices; smaller sizes are cheaper', () => {
    const result = evaluate(chair, {
      fabric: { custom: '#aa0000' },
      'frame-finish': 'rust',
      'pillow-diamond': false,
      'pillow-navy': false,
      diameter: 110,
    });
    expect(result.price.lines.map((l) => [l.label, l.amount])).toEqual([
      ['Halo Lounge Chair', 89900],
      ['Seat fabric: Custom colour', 2500],
      ['Frame finish: Rust', 8000],
      ['Diameter: 110 cm', -8000],
    ]);
    expect(result.price.total).toBe(92400);
  });

  it('never returns a negative total', () => {
    const cheap = productConfigSchema.parse({
      ...structuredClone(loungeChairConfig),
      pricing: { currency: 'USD', base: 0 },
    } as ProductConfigInput);
    expect(
      evaluate(cheap, { diameter: 100, 'pillow-diamond': false, 'pillow-navy': false }).price.total,
    ).toBe(0);
  });
});

describe('evaluate: rules', () => {
  it('excludes: keeps what the shopper just changed and resets the other side', () => {
    const picked = evaluate(
      chair,
      { fabric: 'terracotta', 'frame-finish': 'brass' },
      'frame-finish',
    );
    expect(picked.selections).toMatchObject({ 'frame-finish': 'brass', fabric: 'original' });
    expect(picked.corrections).toEqual([
      {
        group: 'fabric',
        from: 'terracotta',
        to: 'original',
        rule: 'brass-not-terracotta',
        message: "Brushed brass isn't offered with terracotta fabric.",
      },
    ]);
    const other = evaluate(chair, { fabric: 'terracotta', 'frame-finish': 'brass' }, 'fabric');
    expect(other.selections).toMatchObject({ fabric: 'terracotta', 'frame-finish': 'original' });
  });

  it('requires: selecting the trigger auto-selects the requirement', () => {
    const result = evaluate(chair, { diameter: 140 }, 'diameter');
    expect(result.selections).toMatchObject({ diameter: 140, 'frame-finish': 'brass' });
    expect(result.corrections[0]?.rule).toBe('large-needs-brass');
    expect(result.price.lines.map((l) => l.group)).toContain('frame-finish');
  });

  it('requires: moving away from the requirement undoes the trigger', () => {
    const result = evaluate(chair, { diameter: 140, 'frame-finish': 'rust' }, 'frame-finish');
    expect(result.selections).toMatchObject({ 'frame-finish': 'rust', diameter: 120 });
  });

  it('chains corrections until stable (large size → brass → terracotta fabric reset)', () => {
    const result = evaluate(chair, { diameter: 140, fabric: 'terracotta' }, 'diameter');
    expect(result.selections).toMatchObject({
      diameter: 140,
      'frame-finish': 'brass',
      fabric: 'original',
    });
    expect(result.violations).toEqual([]);
  });

  it('availability: disables options and drops unavailable choices', () => {
    const result = evaluate(chair, { fabric: 'sage', 'pillow-navy': true }, 'fabric');
    expect(result.availability['pillow-navy']).toMatchObject({
      disabled: true,
      reason: 'The navy cushion is only offered with darker fabrics.',
    });
    expect(result.selections['pillow-navy']).toBe(false);
    expect(evaluate(chair, { fabric: 'charcoal' }).availability['pillow-navy']?.disabled).toBe(
      false,
    );
  });

  it('repairs stale selections from old share links before applying rules', () => {
    const result = evaluate(jeep, { paint: 'lunar-silver', 'roof-rails': true, wheels: '20in' });
    expect(result.adjustments.map((a) => a.reason)).toEqual(['unknown-group', 'invalid-value']);
    expect(result.selections).toMatchObject({ paint: 'original', 'roof-rails': true });
    expect(result.violations).toEqual([]);
  });

  it('jeep: roof rails require metallic paint', () => {
    const result = evaluate(jeep, { paint: 'bright-white', 'roof-rails': true }, 'roof-rails');
    expect(result.selections.paint).toBe('original');
    expect(result.price.total).toBe(3200000 + 35000);
  });

  it('reports contradictory rules instead of looping forever', () => {
    const input = structuredClone(loungeChairConfig) as ProductConfigInput;
    input.rules = [
      {
        type: 'requires',
        id: 'a',
        when: { group: 'pillow-navy', equals: true },
        require: { not: { group: 'pillow-navy', equals: true } },
        message: 'Impossible.',
      },
    ];
    const contradictory = productConfigSchema.parse(input);
    // The navy cushion defaults to on, so the default itself can't satisfy the rule.
    const result = evaluate(contradictory, {});
    expect(result.violations).toEqual([{ rule: 'a', message: 'Impossible.' }]);
  });

  it('handles circular requires without looping', () => {
    const input = structuredClone(loungeChairConfig) as ProductConfigInput;
    input.rules = [
      {
        type: 'requires',
        id: 'a',
        when: { group: 'frame-finish', equals: 'brass' },
        require: { group: 'fabric', equals: 'charcoal' },
        message: 'Brass needs charcoal.',
      },
      {
        type: 'requires',
        id: 'b',
        when: { group: 'fabric', equals: 'charcoal' },
        require: { group: 'frame-finish', equals: 'brass' },
        message: 'Charcoal needs brass.',
      },
    ];
    const circular = productConfigSchema.parse(input);
    const result = evaluate(circular, { 'frame-finish': 'brass' }, 'frame-finish');
    expect(result.selections).toMatchObject({ 'frame-finish': 'brass', fabric: 'charcoal' });
    expect(result.violations).toEqual([]);
  });

  it('is deterministic', () => {
    const input = { diameter: 135, fabric: 'terracotta', 'pillow-navy': true };
    expect(evaluate(chair, input, 'diameter')).toEqual(evaluate(chair, input, 'diameter'));
  });
});

describe('formatPrice', () => {
  it('formats minor units with the currency decimals', () => {
    expect(formatPrice(89900, 'USD')).toBe('$899.00');
    expect(formatPrice(-8000, 'USD')).toBe('-$80.00');
    expect(formatPrice(1500, 'JPY')).toBe('¥1,500');
  });
});
