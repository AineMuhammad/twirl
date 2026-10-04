// Builds the Twirl demo models: cleans, segments, names, scales and compresses each source GLB.
// Usage: node build.mjs [modelId ...]   (default: all).
// Output: apps/web/public/samples/<id>.glb (git-ignored; hosted on R2, see upload.mjs) and
// apps/web/src/lib/sample-manifest.json (committed: names, sizes and hashes the tests check).
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import {
  read,
  scene,
  allNodes,
  nodeByName,
  rename,
  removeNodes,
  removeCamerasAndLights,
  stripVariants,
  scaleTo,
  wrapRoots,
  components,
  sampleColors,
  splitNode,
  finish,
} from './lib.mjs';

const OUT = '../../apps/web/public/samples';
const MANIFEST = '../../apps/web/src/lib/sample-manifest.json';
fs.mkdirSync('raw', { recursive: true });

// ── helpers ───────────────────────────────────────────────────────────────────────────────
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const mid = (c) => [0, 1, 2].map((k) => (c.min[k] + c.max[k]) / 2);
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Picks the group whose reference colour is closest to the component's sampled colour. */
const nearest = (refs) => (c) => {
  let best = null,
    bd = Infinity;
  for (const [name, hexes] of Object.entries(refs)) {
    for (const h of [].concat(hexes)) {
      const d = dist(c.color, hexRgb(h));
      if (d < bd) {
        bd = d;
        best = name;
      }
    }
  }
  return best;
};

/** Moves every mesh node directly under the scene root, keeping its world transform, so
 * colouring one part never colours another through the node hierarchy. */
function flatten(doc) {
  const sc = scene(doc);
  for (const node of allNodes(doc)) {
    if (!node.getMesh()) continue;
    const world = node.getWorldMatrix();
    const parent = node.getParentNode();
    if (!parent) continue;
    parent.removeChild(node);
    sc.addChild(node);
    node.setMatrix(world);
  }
  // Drop now-empty transform nodes.
  for (const node of allNodes(doc)) {
    if (!node.getMesh() && node.listChildren().length === 0) node.dispose();
  }
}

async function split(doc, nodeName, classify) {
  const node = nodeByName(doc, nodeName);
  const prim = node.getMesh().listPrimitives()[0];
  const info = components(prim);
  await sampleColors(prim, info);
  const names = splitNode(doc, node, info, classify);
  // Lift the new children to the scene root so names are flat and unique.
  for (const child of node.listChildren()) {
    const world = child.getWorldMatrix();
    node.removeChild(child);
    scene(doc).addChild(child);
    child.setMatrix(world);
  }
  node.dispose();
  return names;
}

/** Numbers components left-to-right along x (in the primitive's local space). */
const indexed = (prefix) => {
  return (c, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`;
};

// ── models ────────────────────────────────────────────────────────────────────────────────
const MODELS = {
  'glam-sofa': {
    src: 'GlamVelvetSofa',
    async build(doc) {
      removeCamerasAndLights(doc);
      stripVariants(doc);
      rename(doc, { GlamVelvetSofa_fabric: 'Upholstery' });
      await split(doc, 'GlamVelvetSofa_legs', indexed('Leg'));
      await split(doc, 'GlamVelvetSofa_feet', indexed('Foot'));
      scaleTo(doc, 0, 2.2);
    },
  },

  'accent-chair': {
    src: 'ChairDamaskPurplegold',
    async build(doc) {
      flatten(doc);
      const p = 'oval-tufted-chair_';
      rename(doc, {
        [`${p}legs-frame`]: 'Legs',
        [`${p}legs-hardware`]: 'Leg_Hardware',
        [`${p}back-panel`]: 'Back_Panel',
        [`${p}back-fabric`]: 'Back_Fabric',
        [`${p}back-buttons`]: 'Back_Buttons',
        [`${p}back-welt`]: 'Back_Piping',
        [`${p}seat-panel`]: 'Seat_Panel',
        [`${p}seat-label`]: 'Label',
        [`${p}seat-fabric`]: 'Seat_Fabric',
        [`${p}seat-buttons`]: 'Seat_Buttons',
        [`${p}seat-welt`]: 'Seat_Piping',
      });
      wrapRoots(doc, 'Product');
    },
  },

  'chesterfield-sofa': {
    src: 'SheenWoodLeatherSofa',
    async build(doc) {
      // Pillows: fringe pieces follow the nearest pillow; Paisley 0–2 are seat cushions.
      const pillowCentres = {};
      await split(doc, 'Paisley', (c, i) => {
        if (i <= 2) return `Seat_Cushion-${i + 1}`;
        const name = i <= 4 ? `Corner_Pillow-${i - 2}` : `Accent_Pillow-${i - 4}`;
        pillowCentres[name] = mid(c);
        return name;
      });
      await split(doc, 'Stripes', (c, i) => {
        if (i === 0) {
          pillowCentres['Lumbar_Pillow'] = mid(c);
          return 'Lumbar_Pillow';
        }
        return `Arm_Bolster-${i}`;
      });
      await split(doc, 'Brown', (c, i) => (i <= 1 ? `Back_Cushion-${i + 1}` : `Deck-${i - 1}`));
      await split(doc, 'Frame', (c, i) =>
        i === 0 ? 'Leather_Shell' : i === 1 ? 'Inner_Frame' : `Foot-${i - 1}`,
      );
      rename(doc, { Frame_Fabric: 'Deck_Fabric' });
      // Fringe: assign each piece to the pillow it trims (x/z centres are comparable across
      // these meshes: same authoring space and bounds span the sofa).
      const pillows = Object.entries(pillowCentres);
      const used = new Set();
      await split(doc, 'Fringe', (c) => {
        // Fringe local bounds ≈ pillow layout: match on x only.
        let best = null,
          bd = Infinity;
        for (const [name, pc] of pillows) {
          if (used.has(name)) continue;
          const d = dist(mid(c), pc);
          if (d < bd) {
            bd = d;
            best = name;
          }
        }
        used.add(best);
        return `${best}_Fringe`;
      });
      scaleTo(doc, 0, 2.7);
    },
  },

  'silk-pouf': {
    src: 'SpecularSilkPouf',
    async build(doc) {
      flatten(doc);
      rename(doc, { SpecularSilkPouf: 'Pouf' });
      scaleTo(doc, 0, 0.6);
    },
  },

  'barn-sconce': {
    src: 'AnisotropyBarnLamp',
    async build(doc) {
      rename(doc, {
        'Lamp Metal': 'Metal',
        'Lamp Glass': 'Bulb_Glass',
        'Lamp Filament': 'Filament',
      });
      wrapRoots(doc, 'Product');
    },
  },

  'glass-table-lamp': {
    src: 'IridescenceLamp',
    async build(doc) {
      await split(doc, 'lamp', (c, i) => (i === 0 ? 'Shade' : i === 3 ? 'Bulb' : 'Metal'));
      rename(doc, { lamp_transmission: 'Glass_Base', lamp_iridescence: 'Glass_Inner' });
      wrapRoots(doc, 'Product');
    },
  },

  'tulip-lamp': {
    src: 'LightsPunctualLamp',
    async build(doc) {
      removeCamerasAndLights(doc);
      const meshNodes = allNodes(doc).filter((n) => n.getMesh());
      const tris = (n) =>
        n
          .getMesh()
          .listPrimitives()
          .reduce((a, p) => a + (p.getIndices()?.getCount() ?? 0) / 3, 0);
      meshNodes.sort((a, b) => tris(b) - tris(a));
      meshNodes[0].setName('Stand');
      meshNodes[1].setName('Shade');
      meshNodes[2].setName('Bulb');
      scaleTo(doc, 1, 0.55);
    },
  },

  sneaker: {
    src: 'MaterialsVariantsShoe',
    async build(doc) {
      stripVariants(doc);
      flatten(doc);
      await split(
        doc,
        'Shoe',
        nearest({
          Sole: '#e1e1e1',
          Upper: ['#204354', '#223944'],
          Tongue_Heel_Tab: '#337fa5',
          Side_Stripes: ['#042436', '#0f1010'],
          Laces: '#2e2e2e',
          Eyelets: '#3d8fb4',
        }),
      );
      wrapRoots(doc, 'Product');
    },
  },

  'corset-dress-form': {
    src: 'Corset',
    async build(doc) {
      flatten(doc);
      await split(doc, 'Corset', (c) => {
        const isRef = (h, t = 40) => dist(c.color, hexRgb(h)) < t;
        if (c.faces === 1392) return 'Corset';
        if (c.c[1] < 0.05) return 'Stand';
        if (isRef('#c89e6a') || isRef('#cca470') || isRef('#212121', 12) || isRef('#959da3', 20))
          return 'Dress_Form';
        if (c.c[1] > 0.85) return 'Choker';
        if (isRef('#807a6d', 12)) return 'Straps';
        return 'Hardware';
      });
      scaleTo(doc, 1, 0.8);
    },
  },

  'aviator-sunglasses': {
    src: 'SunglassesKhronos',
    async build(doc) {
      flatten(doc);
      // Remove the trademark texture from the earhooks; give them a plain matte finish.
      const ear = doc
        .getRoot()
        .listMaterials()
        .find((m) => m.getName() === 'earhooks');
      ear
        .setBaseColorTexture(null)
        .setBaseColorFactor([0.03, 0.03, 0.03, 1])
        .setRoughnessFactor(0.6);
      wrapRoots(doc, 'Product');
    },
  },

  'teacup-set': {
    src: 'DiffuseTransmissionTeacup',
    async build(doc) {
      rename(doc, { tea_cup: 'Cup', tea_saucer: 'Saucer' });
      wrapRoots(doc, 'Product');
    },
  },

  'water-bottle': {
    src: 'WaterBottle',
    async build(doc) {
      await split(doc, 'WaterBottle', (c, i) => ['Sleeve', 'Cap', 'Bottle'][i]);
      wrapRoots(doc, 'Product');
    },
  },

  boombox: {
    src: 'BoomBox',
    async build(doc) {
      await split(doc, 'BoomBox', (c, i) => {
        if (i === 0) return 'Body';
        if (i === 1 || i === 4 || i === 5) return 'Handle';
        if ([2, 3, 13].includes(i)) return 'Antenna';
        return 'Buttons';
      });
      scaleTo(doc, 0, 0.42);
    },
  },

  'beverage-cooler': {
    src: 'CommercialRefrigerator',
    async build(doc) {
      flatten(doc);
      rename(doc, {
        FridgeCase: 'Cabinet',
        FridgeDoor: 'Door_Frame',
        FridgeDoorInner: 'Door_Inner',
        FridgeGlass: 'Door_Glass',
        FridgeInterior: 'Interior',
        ChampagneBottles: 'Bottles',
      });
      wrapRoots(doc, 'Product');
    },
  },

  'toy-car': {
    src: 'ToyCar',
    async build(doc) {
      removeCamerasAndLights(doc);
      removeNodes(doc, ['Fabric']);
      flatten(doc);
      await split(doc, 'ToyCar', (c) => {
        const [r, g, b] = c.color;
        if (g > r + 40 && g > b + 20) return 'Body';
        if (r < 90 && g < 90 && b < 90) return 'Tires';
        if (r > 200 && g < 170) return 'Lights';
        return 'Chrome';
      });
      rename(doc, { Glass: 'Windows' });
      const sc = scene(doc);
      void sc;
      scaleTo(doc, 2, 0.2);
    },
  },
};

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(MODELS);
// Building a subset keeps the other entries. Bump `version` whenever a file changes after it has
// been uploaded: hosted files are cached as immutable, so a changed file needs a new folder.
const manifest = fs.existsSync(MANIFEST)
  ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
  : { version: 'v1', files: {} };
for (const id of ids) {
  const spec = MODELS[id];
  const doc = await read(`raw/${spec.src}.glb`);
  await spec.build(doc);
  // Every remaining mesh node must have a unique, non-empty name (configs reference them).
  const names = allNodes(doc)
    .filter((n) => n.getMesh())
    .map((n) => n.getName());
  const dupes = names.filter((n, i) => !n || names.indexOf(n) !== i);
  if (dupes.length)
    throw new Error(`${id}: duplicate or empty mesh node names: ${dupes.join(', ')}`);
  const file = `${id}.glb`;
  await finish(doc, `${OUT}/${file}`);
  const bytes = fs.readFileSync(`${OUT}/${file}`);
  manifest.files[file] = {
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    nodes: names.slice().sort(),
  };
  console.log(`${id}: ${Math.round(bytes.length / 1024)} KB, nodes: ${names.join(', ')}`);
}

manifest.files = Object.fromEntries(
  Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)),
);
fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
// Format with the repo's Prettier so rebuilds don't produce formatting-only diffs.
const prettier = '../../node_modules/.bin/prettier';
if (fs.existsSync(prettier)) execFileSync(prettier, ['--write', '--log-level=warn', MANIFEST]);
console.log(`wrote ${MANIFEST}`);
