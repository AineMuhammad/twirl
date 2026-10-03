import type { ProductConfig } from '../config';
import { resolveSelections, type SelectionAdjustment, type Selections } from '../selections';
import { type Price, priceOf } from './pricing';
import { applyRules, type Correction, type GroupAvailability, type Violation } from './rules';

export interface Evaluation {
  /** Valid, rule-corrected selections to render and price. */
  selections: Selections;
  /** What the shopper can choose right now. */
  availability: Record<string, GroupAvailability>;
  /** Structural fixes to the input (unknown groups, removed options, snapped sizes). */
  adjustments: SelectionAdjustment[];
  /** Changes made to satisfy rules, with shopper-facing messages. */
  corrections: Correction[];
  /** Rules that couldn't be satisfied (contradictory or circular rules). */
  violations: Violation[];
  price: Price;
}

/**
 * Evaluates a configuration: deterministic and side-effect free, so the browser (live price) and
 * the server (validating saved configs and quotes) get identical results.
 *
 * @param changed the group the shopper just changed; its choice wins when rules conflict.
 */
export function evaluate(config: ProductConfig, input: unknown, changed?: string): Evaluation {
  const { selections: valid, adjustments } = resolveSelections(config, input);
  const { selections, availability, corrections, violations } = applyRules(config, valid, changed);
  return {
    selections,
    availability,
    adjustments,
    corrections,
    violations,
    price: priceOf(config, selections),
  };
}
