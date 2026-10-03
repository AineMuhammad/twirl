import { describe, expect, it } from 'vitest';

import { createUsageCounter } from './dispose';

describe('createUsageCounter', () => {
  it('frees a shared resource only after its last user leaves', () => {
    const users = createUsageCounter();
    users.acquire('/sofa.glb');
    users.acquire('/sofa.glb');
    expect(users.release('/sofa.glb')).toBe(1);
    expect(users.count('/sofa.glb')).toBe(1);
    expect(users.release('/sofa.glb')).toBe(0);
    expect(users.count('/sofa.glb')).toBe(0);
    // Extra releases never go negative.
    expect(users.release('/sofa.glb')).toBe(0);
    expect(users.count('/other.glb')).toBe(0);
  });
});
