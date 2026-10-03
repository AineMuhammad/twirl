import {
  type Condition,
  formatPrice,
  type OptionGroup,
  type ProductConfig,
  type Rule,
} from '@twirl/config-schema/engine';

/** Short, human summaries for collapsed cards: "4 colours · Seat cushion · Default: Sage". */

function partNames(config: ProductConfig, ids: string[]) {
  const names = ids.map((id) => config.parts.find((p) => p.id === id)?.label ?? id);
  return names.length > 2
    ? `${names.slice(0, 2).join(', ')} +${names.length - 2}`
    : names.join(', ');
}

function signedPrice(amount: number, currency: string) {
  return `${amount < 0 ? '−' : '+'}${formatPrice(Math.abs(amount), currency)}`;
}

export function groupSummary(config: ProductConfig, group: OptionGroup): string {
  const currency = config.pricing.currency;
  if (group.type === 'color') {
    const def = group.swatches.find((s) => s.id === group.default)?.label ?? group.originalLabel;
    return [
      `${group.swatches.length} colour${group.swatches.length === 1 ? '' : 's'}${group.allowCustom ? ' + any colour' : ''}`,
      partNames(config, group.parts),
      `Default: ${def}`,
    ].join(' · ');
  }
  if (group.type === 'visibility') {
    return [
      partNames(config, group.parts),
      group.default ? 'Shown by default' : 'Hidden by default',
      group.price ? `${signedPrice(group.price, currency)} when shown` : null,
    ]
      .filter(Boolean)
      .join(' · ');
  }
  return [
    `${group.min}–${group.max} ${group.unit}`,
    `Default ${group.default} ${group.unit}`,
    `${group.behaviors.length} part${group.behaviors.length === 1 ? '' : 's'} respond`,
  ].join(' · ');
}

/** "Seat fabric is Sage", "Diameter is at least 135 cm", "Navy cushion is shown". */
export function conditionText(config: ProductConfig, condition: Condition): string {
  if ('all' in condition) return condition.all.map((c) => conditionText(config, c)).join(' and ');
  if ('any' in condition) return condition.any.map((c) => conditionText(config, c)).join(' or ');
  if ('not' in condition) return `not (${conditionText(config, condition.not)})`;
  const group = config.groups.find((g) => g.id === condition.group);
  const name = group?.label ?? condition.group;
  if (!group) return `${name} (removed)`;
  if (group.type === 'visibility')
    return `${name} is ${condition.equals === false ? 'hidden' : 'shown'}`;
  if (group.type === 'dimension') {
    return condition.max !== undefined
      ? `${name} is at most ${condition.max} ${group.unit}`
      : `${name} is at least ${condition.min ?? group.min} ${group.unit}`;
  }
  const label = (id: string) =>
    id === 'original'
      ? group.originalLabel
      : id === 'custom'
        ? 'a custom colour'
        : (group.swatches.find((s) => s.id === id)?.label ?? id);
  if (condition.oneOf) return `${name} is ${condition.oneOf.map(label).join(' or ')}`;
  return `${name} is ${label(String(condition.equals ?? 'original'))}`;
}

export function ruleSummary(config: ProductConfig, rule: Rule): string {
  if (rule.type === 'requires') {
    return `If ${conditionText(config, rule.when)}, then ${conditionText(config, rule.require)}.`;
  }
  if (rule.type === 'excludes') {
    return `${conditionText(config, rule.a)} can't be combined with ${conditionText(config, rule.b)}.`;
  }
  const target = config.groups.find((g) => g.id === rule.target.group);
  const what =
    target?.type === 'color' && rule.target.options?.length
      ? `${rule.target.options.length} choice${rule.target.options.length === 1 ? '' : 's'} in ${target.label}`
      : (target?.label ?? rule.target.group);
  return `If ${conditionText(config, rule.when)}, ${rule.effect} ${what}.`;
}
