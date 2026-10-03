# 0004. Look and rendering pipeline

- **Status:** Accepted
- **Date:** 2026-10-02

## Context

Twirl's configurator has to make products look as good as a product photo, on any merchant's
site, without making phones stutter. The look also has to stay honest: a colour a shopper picks
must look like that colour.

## Decision

1. **Tone mapping: Khronos PBR Neutral.** Base colours stay true; ACES Filmic (R3F's default)
   darkens and desaturates them. When post-processing is on, the composer applies the same
   tone mapping as its last pass.
2. **Default look:** warm studio light (procedural, instant) on a soft radial backdrop. Products
   carry their own look (lighting, backdrop, studio). Merchants will set it per product in the
   M2 config `scene` and the M4 editor.
3. **Studio cyclorama.** A 3D infinity cove (a lathe whose floor curves up into a wall all round)
   sized from the model, painted from the backdrop and lit by the scene. It replaces the flat CSS
   backdrop when on, so the product looks shot in a studio from every angle.
4. **Shadows.** A soft contact shadow does the grounding; the directional key-light shadow stays
   faint and only conveys light direction. The contact shadow re-renders only while the model
   animates and once after its shape changes.
5. **Post-processing is adaptive.** N8AO ambient occlusion plus a subtle bloom, lazily loaded,
   enabled automatically only on mouse/trackpad devices while adaptive quality is high
   (`effects="auto"`).
6. **Motion with restraint.**
   - A 1.2 s camera glide-in on load.
   - Preset camera views with glides.
   - A slow idle turntable after 4 s.
   - 0.2 s colour cross-fades.
   - All of it is disabled for users who prefer reduced motion, and any interaction cancels it.
7. **Shopper UI.** No 3D selection outlines; parts are chosen from the panel. Light and dark UI
   themes, with the default backdrop paired to the theme.

## Consequences

- Phones get the same look minus ambient occlusion and bloom. The contact shadow adds one depth
  pass per frame only during animations.
- Image export (M5) must render the same pipeline (cyclorama, tone mapping, effects when
  available) so exports match the screen.
- The look settings (`lighting`, `background`, `cyclorama`, `floor`, `shadows`) become part of
  the versioned product config in M2; `effects` and `idleRotate` stay viewer or embed options.
