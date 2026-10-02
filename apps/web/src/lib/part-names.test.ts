import { describe, expect, it } from 'vitest';

import { prettyPartName } from './part-names';

describe('prettyPartName', () => {
  it.each([
    ['Pillow_01', 'Pillow 01'],
    ['iron', 'Iron'],
    ['Black_Gloss_Trim_Mesh', 'Black Gloss Trim'],
    ['Windows_Tinted_Dark', 'Windows Tinted Dark'],
    ['seatCushionLeft', 'Seat Cushion Left'],
    ['leg.002', 'Leg 002'],
    ['pillow01', 'Pillow 01'],
    ['Unnamed mesh 3', 'Unnamed mesh 3'],
    ['___', '___'],
  ])('%s → %s', (input, expected) => {
    expect(prettyPartName(input)).toBe(expected);
  });
});
