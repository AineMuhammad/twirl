# 0006. Dimension behaviours

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

Shoppers resize products (a chair's diameter, a table's length). Scaling the whole model
distorts parts that shouldn't change size, such as cushions, knobs and wheels. Merchants need a
simple, predictable way to say what happens to each part.

## Decision

1. **A dimension group scales chosen axes** (`x`, `y`, `z` in model space) by
   `value / nativeSize`. `nativeSize` is the model's authored size in the group's unit.
2. **Each listed part has a behaviour:**
   - `stretch`: the part resizes with the dimension.
   - `anchor`: the part keeps its size but moves with the resize, staying attached.
   - Unlisted parts stay fixed.
3. **Changes are centred on the bottom-centre of the model's bounds,** so products grow from the
   floor and stay centred.
4. **Applied through a wrapper node per part,** holding the change in its parent's space. The
   part keeps its own transform, so built-in animations still play. Anchor positions are
   re-measured once animations settle.
5. **Sizes apply after load.** The mesh tree (node ids) is built from the undeformed model.

## Consequences

- Stretching is a plain scale: textures stretch and rounded corners distort at extreme ratios.
  Merchants should keep ranges modest or model the product in segments (future: swaps).
- Camera framing and shadows use the model's size at load. Very large ranges may need a
  re-frame later.
