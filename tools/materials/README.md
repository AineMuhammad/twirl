# Materials

Builds the material library a colour option can use (`material` on a swatch, see
`MATERIALS` in `@twirl/config-schema/constants`): real fabric, leather and wood texture sets from
[Poly Haven](https://polyhaven.com/textures) (CC0), tinted in the viewer with the option's colour.

```bash
cd tools/materials
npm install
npm run build   # → out/<id>/{color,normal,roughness,thumb}.webp and out/manifest.json
```

Upload `out/<id>/` folders to the asset bucket at `materials/v1/` (for local development without
`NEXT_PUBLIC_ASSETS_BASE_URL`, copy them to `apps/web/public/materials/`). After changing a
material, bump `HOSTED_MATERIALS_VERSION` in `apps/web/src/lib/sample-urls.ts`.

Each source is checked against the MD5 Poly Haven publishes. Colour ships at the source size (2k for
woods, whose boards are long; 1k for fabrics, which repeat every ~30 cm), relief at most 1k and
roughness at 512 px (it's smooth). The thumbnail is grayscale so the options panel can dye it with
any colour; fabrics whose pattern is only in relief (jacquard) use the relief for it.

Tile sizes (metres per repeat, from the scans) live in `MATERIAL_TILE_METERS` in
`packages/viewer/src/internal/materials.ts`; the viewer tiles each part to true size from its UVs.

| Id                | Poly Haven source          | Tile (m) |
| ----------------- | -------------------------- | -------- |
| `velvet`          | Velour Velvet              | 0.284    |
| `linen`           | Rough Linen                | 0.271    |
| `boucle`          | Curly Teddy Natural        | 0.336    |
| `herringbone`     | Poly Wool Herringbone      | 0.27     |
| `corduroy`        | Ribbed Corduroy            | 0.266    |
| `jacquard`        | Quatrefoil Jacquard Fabric | 0.28     |
| `leather`         | Brown Leather              | 0.4      |
| `grained-leather` | Leather White              | 0.3      |
| `oak`             | Oak Veneer 01              | 1.83     |
| `walnut`          | Walnut Veneer 02           | 1        |
| `teak`            | Teak Veneer                | 1        |
| `cherry`          | Cherry Veneer              | 1        |
| `sheesham`        | Rosewood Veneer 1          | 2.43     |

All CC0 1.0 (<https://creativecommons.org/publicdomain/zero/1.0/>). Sheesham is North Indian
rosewood; the rosewood veneer scan stands in for it.
