import { describe, expect, it } from 'vitest';

import { isHidden, patchOverride } from './overrides';

describe('patchOverride', () => {
  it('adds and merges fields', () => {
    const a = patchOverride({}, '0', { color: '#ff0000' });
    expect(a).toEqual({ '0': { color: '#ff0000' } });
    expect(patchOverride(a, '0', { visible: false })).toEqual({
      '0': { color: '#ff0000', visible: false },
    });
  });

  it('clears a field with undefined and drops empty entries', () => {
    const a = { '0': { color: '#ff0000' }, '1': { visible: false } };
    expect(patchOverride(a, '0', { color: undefined })).toEqual({ '1': { visible: false } });
  });

  it('never mutates its input', () => {
    const a = { '0': { color: '#ff0000' } };
    patchOverride(a, '0', { color: '#00ff00' });
    expect(a).toEqual({ '0': { color: '#ff0000' } });
  });
});

describe('isHidden', () => {
  it('is true only for an explicit visible: false', () => {
    expect(isHidden({ '0': { visible: false } }, '0')).toBe(true);
    expect(isHidden({ '0': { color: '#fff' } }, '0')).toBe(false);
    expect(isHidden({}, '0')).toBe(false);
  });
});
