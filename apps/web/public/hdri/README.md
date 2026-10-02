# HDRI environments

Image-based lighting for the 3D viewer. All files are from [Poly Haven](https://polyhaven.com)
and licensed **CC0** (public domain; no attribution required).

| Id                                     | Source                                                       | Used for               |
| -------------------------------------- | ------------------------------------------------------------ | ---------------------- |
| `studio_small_08`                      | https://polyhaven.com/a/studio_small_08                      | Soft photo studio      |
| `photo_studio_loft_hall`               | https://polyhaven.com/a/photo_studio_loft_hall               | Bright loft, daylight  |
| `lythwood_room`                        | https://polyhaven.com/a/lythwood_room                        | Lived-in interior room |
| `empty_warehouse_01`                   | https://polyhaven.com/a/empty_warehouse_01                   | Industrial warehouse   |
| `autoshop_01`                          | https://polyhaven.com/a/autoshop_01                          | Garage / showroom      |
| `potsdamer_platz`                      | https://polyhaven.com/a/potsdamer_platz                      | City street, overcast  |
| `kloofendal_48d_partly_cloudy_puresky` | https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky | Open sky, midday sun   |
| `venice_sunset`                        | https://polyhaven.com/a/venice_sunset                        | Warm sunset            |

- `1k/` (committed, ~1.5 MB each): the default for lighting everywhere.
- `2k/` (~6 MB each): **not in git**. Hosted on Cloudflare R2 under `hdri/2k/` and only loaded on
  large screens when the environment is shown as the background.

Filenames follow Poly Haven's convention: `<id>_<res>.hdr`. To replace a file, add it under a new
name rather than overwriting, because browsers cache these for a long time.
