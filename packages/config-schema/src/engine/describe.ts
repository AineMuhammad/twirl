import type { ProductConfig } from '../config';
import type { Selections } from '../selections';

export interface SelectionLine {
  group: string;
  /** The option's name, e.g. "Seat fabric". */
  label: string;
  /** The choice in words, e.g. "Teal velvet", "Custom colour #12ab34", "Included", "130 cm". */
  value: string;
}

/** A configuration in plain words, in config order (for quotes, emails and summaries). */
export function describeSelections(config: ProductConfig, selections: Selections): SelectionLine[] {
  return config.groups.map((group) => {
    const value = selections[group.id];
    let text: string;
    if (group.type === 'color') {
      if (typeof value === 'object' && value !== null && 'custom' in value) {
        text = `Custom colour ${value.custom}`;
      } else {
        text = group.swatches.find((s) => s.id === value)?.label ?? group.originalLabel;
      }
    } else if (group.type === 'visibility') {
      text = value === false ? 'Not included' : 'Included';
    } else {
      text = `${typeof value === 'number' ? value : group.default} ${group.unit}`;
    }
    return { group: group.id, label: group.label, value: text };
  });
}
