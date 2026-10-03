import { describe, expect, it } from 'vitest';

import { embedSnippet, isEmbedMessage, preferredHeight } from './embed-protocol';

describe('embed protocol', () => {
  it('accepts only well-formed messages from the embed', () => {
    expect(isEmbedMessage({ source: 'twirl', type: 'ready', productId: 'abc' })).toBe(true);
    expect(isEmbedMessage({ source: 'twirl', type: 'resize', productId: 'abc', height: 600 })).toBe(
      true,
    );
    expect(
      isEmbedMessage({
        source: 'twirl',
        type: 'change',
        productId: 'abc',
        selections: { fabric: 'sage' },
        price: { total: 98700, currency: 'USD' },
      }),
    ).toBe(true);
    for (const bad of [
      null,
      'twirl',
      { source: 'other', type: 'ready', productId: 'abc' },
      { source: 'twirl', type: 'resize', productId: 'abc', height: 'tall' },
      { source: 'twirl', type: 'change', productId: 'abc', selections: {} },
      { source: 'twirl', type: 'unknown', productId: 'abc' },
    ]) {
      expect(isEmbedMessage(bad)).toBe(false);
    }
  });

  it('asks for landscape on wide screens and portrait on phones, within bounds', () => {
    expect(preferredHeight(1000)).toBe(620);
    expect(preferredHeight(375)).toBe(563);
    expect(preferredHeight(200)).toBe(480);
    expect(preferredHeight(3000)).toBe(900);
  });

  it('builds the paste-in snippet', () => {
    expect(embedSnippet('https://twirl.example/', 'Ab12')).toBe(
      '<div data-twirl-product="Ab12"></div>\n<script src="https://twirl.example/embed.js" async></script>',
    );
  });
});
