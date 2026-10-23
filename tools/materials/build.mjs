// Builds the material library: Poly Haven (CC0) texture sets → WebP maps and a swatch thumbnail.
// Usage: node build.mjs   → out/<id>/{color,normal,roughness,thumb}.webp and out/manifest.json
// Upload out/ to the asset bucket at materials/v1/ (or copy to apps/web/public/materials/).
import { createHash } from 'node:crypto';
import fs from 'node:fs';

import sharp from 'sharp';

/** Library id → Poly Haven texture and the resolution worth shipping. Woods have long boards, so
 * they ship at 2k; fabrics repeat every ~30 cm, so 1k is plenty. */
const LIBRARY = {
  velvet: { source: 'velour_velvet', res: '1k' },
  linen: { source: 'rough_linen', res: '1k' },
  boucle: { source: 'curly_teddy_natural', res: '1k' },
  herringbone: { source: 'poly_wool_herringbone', res: '1k' },
  corduroy: { source: 'ribbed_corduroy', res: '1k' },
  jacquard: { source: 'quatrefoil_jacquard_fabric', res: '1k' },
  leather: { source: 'brown_leather', res: '1k' },
  'grained-leather': { source: 'leather_white', res: '1k' },
  oak: { source: 'oak_veneer_01', res: '2k' },
  walnut: { source: 'walnut_veneer_02', res: '2k' },
  teak: { source: 'teak_veneer', res: '2k' },
  cherry: { source: 'cherry_veneer', res: '2k' },
  sheesham: { source: 'rosewood_veneer1', res: '2k' },
};
const SIZE = { '1k': 1024, '2k': 2048 };
// Colour first: the thumbnail (made with the normal map) may need it.
const MAPS = { color: 'Diffuse', normal: 'nor_gl', roughness: 'Rough' };

const get = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': 'twirl-materials/1.0' } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res;
};
const md5 = (buf) => createHash('md5').update(buf).digest('hex');

async function download(url, path, expected) {
  if (fs.existsSync(path) && md5(fs.readFileSync(path)) === expected) return fs.readFileSync(path);
  const buf = Buffer.from(await (await get(url)).arrayBuffer());
  if (md5(buf) !== expected) throw new Error(`${url}: checksum mismatch`);
  fs.mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  fs.writeFileSync(path, buf);
  return buf;
}

const manifest = { version: 'v1', materials: {} };
for (const [id, { source, res }] of Object.entries(LIBRARY)) {
  const files = await (await get(`https://api.polyhaven.com/files/${source}`)).json();
  const info = await (await get(`https://api.polyhaven.com/info/${source}`)).json();
  const out = `out/${id}`;
  fs.mkdirSync(out, { recursive: true });
  const entry = { source, tileMeters: +(info.dimensions[0] / 1000).toFixed(3), md5: {} };
  for (const [name, key] of Object.entries(MAPS)) {
    const file = files[key][res].jpg;
    const raw = await download(file.url, `raw/${source}/${key}_${res}.jpg`, file.md5);
    entry.md5[name] = file.md5;
    // Colour at full size; surface relief (normal) at most 1k; roughness is smooth, 512 px is plenty.
    const size = name === 'color' ? SIZE[res] : name === 'normal' ? Math.min(1024, SIZE[res]) : 512;
    await sharp(raw)
      .resize(size, size)
      .webp({ quality: name === 'roughness' ? 70 : 85 })
      .toFile(`${out}/${name}.webp`);
    if (name === 'normal') {
      // Swatch thumbnail: grayscale detail, brightened so the UI can tint it with any colour.
      // Some fabrics (jacquard) carry their pattern only in relief: then the thumbnail shows that.
      const colorRaw = fs.readFileSync(`raw/${source}/${MAPS.color}_${res}.jpg`);
      const { channels } = await sharp(colorRaw).greyscale().stats();
      const flat = (channels[0]?.stdev ?? 0) < 6;
      await sharp(flat ? raw : colorRaw)
        .resize(192, 192)
        .greyscale()
        .normalise({ lower: 2, upper: 98 })
        .linear(0.55, 110)
        .webp({ quality: 80 })
        .toFile(`${out}/thumb.webp`);
    }
  }
  manifest.materials[id] = entry;
  console.log(`${id.padEnd(16)} ${source.padEnd(28)} tile ${entry.tileMeters} m`);
}
fs.writeFileSync('out/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
