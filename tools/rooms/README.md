# Rooms

Builds the furnished rooms the viewer can show a product in ("View in room"), from a Blender
scene. Outputs are git-ignored and hosted on R2 at `rooms/<version>/` (like the demo models,
[ADR 0013](../../docs/adr/0013-demo-sample-models.md)).

Lighting is **not** baked: the viewer lights the room live (`RoomLighting` in `@twirl/viewer`),
from anchor nodes the export carries, so day and night switch instantly and the product is lit by
the same lights as the room.

```bash
cd tools/rooms
npm install
B=~/Documents/Blender/blender-5.2.0-linux-x64/blender   # Blender 5.2
SRC=<path to the source scene.blend>

$B -b "$SRC" --python prepare.py      # → out/room.blend (never edits the source)
$B -b out/room.blend --python export.py   # → out/room-raw.glb
node compress.mjs                     # → out/room.glb (~11 MB, ~210k triangles)
```

Upload `out/room.glb` to `rooms/v1/living-room.glb` in the asset bucket. For local development
without `NEXT_PUBLIC_ASSETS_BASE_URL`, copy it to `apps/web/public/rooms/living-room.glb`.

Previews (Cycles, for judging the look; the preview light rigs aren't exported):

```bash
$B -b out/room.blend --python render.py -- --lighting day --view hero
# --lighting day|night, --view hero|overview|top → out/preview-<lighting>-<view>.png
```

## What the scripts do

- **`prepare.py`**: removes brand logos (Bosch, ConServ), clears the product spot (the living-room
  rug), seals the walls (light leaked at the skirting), adds finishes (wall paint, ceiling, a
  Poly Haven oak floor), stages the room with Poly Haven pieces (plant, framed print between two
  sconces, side table and vase; all CC0, pinned by MD5) and an original generated artwork, and sets
  up day and night preview lights. With `-- --product <file.gltf>` it places a product for previews.
- **`export.py`**: repairs invalid meshes, caps subdivision for real time, and exports without
  lights or product. Anchor nodes (glTF extras `twirl_anchor`, `target` in glTF coordinates) mark
  the product spot, sun, window, sconces, downlights and pendant.
- **`compress.mjs`**: simplifies only invisible detail, WebP textures (2048 px for the colour of
  close-up surfaces like the floor and rug, 1024 px elsewhere), Meshopt geometry; anchors kept.

The product spot keeps a 3.3 m wide zone clear, so the widest demo sofa (300 cm) fits.
