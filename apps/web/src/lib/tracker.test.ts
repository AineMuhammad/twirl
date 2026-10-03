import { describe, expect, it } from 'vitest';

import { eventBatchSchema } from './events';
import { changedGroups } from './tracker';

describe('events', () => {
  it('finds the options that changed', () => {
    expect(
      changedGroups(
        { a: 'x', b: true, c: { custom: '#000000' } },
        { a: 'y', b: true, c: { custom: '#000000' } },
      ),
    ).toEqual(['a']);
  });

  it('validates batches strictly', () => {
    const base = { publicId: 'abcdefgh1234', sessionId: crypto.randomUUID() };
    expect(eventBatchSchema.safeParse({ ...base, events: [{ type: 'view' }] }).success).toBe(true);
    expect(eventBatchSchema.safeParse({ ...base, events: [] }).success).toBe(false);
    expect(eventBatchSchema.safeParse({ ...base, events: [{ type: 'hack' }] }).success).toBe(false);
    expect(
      eventBatchSchema.safeParse({
        ...base,
        events: Array.from({ length: 51 }, () => ({ type: 'view' })),
      }).success,
    ).toBe(false);
    expect(
      eventBatchSchema.safeParse({ ...base, sessionId: 'x', events: [{ type: 'view' }] }).success,
    ).toBe(false);
  });
});
