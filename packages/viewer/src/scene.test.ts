import { describe, expect, it } from 'vitest';

import { backgroundCss } from './scene';

describe('backgroundCss', () => {
  it('uses a plain color for solid backgrounds', () => {
    expect(backgroundCss({ type: 'solid', color: '#112233' })).toBe('#112233');
  });

  it('builds a top-to-bottom gradient', () => {
    expect(backgroundCss({ type: 'gradient', from: '#ffffff', to: '#000000' })).toBe(
      'linear-gradient(180deg, #ffffff 0%, #000000 100%)',
    );
  });
});
