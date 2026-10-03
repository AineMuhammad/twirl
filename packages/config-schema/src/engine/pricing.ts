import type { ProductConfig } from '../config';
import type { Selections } from '../selections';
import { optionIdOf } from './conditions';

export interface PriceLine {
  /** Group id, or 'base'. */
  group: string;
  label: string;
  /** Minor units (cents). */
  amount: number;
}

export interface Price {
  currency: string;
  /** Total in minor units, never below zero. */
  total: number;
  /** Base price first, then every option that changes the price. */
  lines: PriceLine[];
}

/** Prices a (rule-corrected) configuration. */
export function priceOf(config: ProductConfig, selections: Selections): Price {
  const lines: PriceLine[] = [
    { group: 'base', label: config.product.name, amount: config.pricing.base },
  ];
  for (const group of config.groups) {
    const value = selections[group.id];
    if (group.type === 'color') {
      const id = optionIdOf(value);
      if (id === 'custom' && group.customPrice !== 0) {
        lines.push({
          group: group.id,
          label: `${group.label}: Custom colour`,
          amount: group.customPrice,
        });
      }
      const swatch = group.swatches.find((s) => s.id === id);
      if (swatch && swatch.price !== 0) {
        lines.push({
          group: group.id,
          label: `${group.label}: ${swatch.label}`,
          amount: swatch.price,
        });
      }
    } else if (group.type === 'visibility') {
      if (value === true && group.price !== 0) {
        lines.push({ group: group.id, label: group.label, amount: group.price });
      }
    } else if (typeof value === 'number' && group.pricePerStep !== 0) {
      const steps = Math.round((value - group.default) / group.step);
      if (steps !== 0) {
        lines.push({
          group: group.id,
          label: `${group.label}: ${value} ${group.unit}`,
          amount: steps * group.pricePerStep,
        });
      }
    }
  }
  const total = Math.max(
    0,
    lines.reduce((sum, line) => sum + line.amount, 0),
  );
  return { currency: config.pricing.currency, total, lines };
}

/** Formats minor units for display, using the currency's own decimals: 89900 USD → "$899.00". */
export function formatPrice(amount: number, currency: string, locale = 'en-US'): string {
  const format = new Intl.NumberFormat(locale, { style: 'currency', currency });
  const decimals = format.resolvedOptions().maximumFractionDigits ?? 2;
  return format.format(amount / 10 ** decimals);
}
