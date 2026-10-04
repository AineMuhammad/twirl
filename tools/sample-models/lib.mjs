// Toolkit for preparing Twirl demo models with glTF-Transform, preserving material extensions.
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, meshopt, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';

export const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder });

export const read = (f) => io.read(f);

export function scene(doc) {
  const root = doc.getRoot();
  return root.getDefaultScene() || root.listScenes()[0];
}

export function allNodes(doc) {
  return doc.getRoot().listNodes();
}

export function nodeByName(doc, name) {
  const found = allNodes(doc).filter((n) => n.getName() === name);
  if (found.length !== 1) throw new Error(`Expected one node "${name}", found ${found.length}`);
  return found[0];
}

export function rename(doc, map) {
  for (const [from, to] of Object.entries(map)) nodeByName(doc, from).setName(to);
}

export function removeNodes(doc, names) {
  for (const name of names) {
    const node = nodeByName(doc, name);
    node.listChildren().forEach((c) => c.dispose());
    node.dispose();
  }
}

/** Removes cameras, punctual lights, and nodes left empty by that. */
export function removeCamerasAndLights(doc) {
  for (const node of allNodes(doc)) {
    if (node.getCamera()) node.setCamera(null);
    const light = node.getExtension('KHR_lights_punctual');
    if (light) node.setExtension('KHR_lights_punctual', null);
  }
  pruneEmptyNodes(doc);
}

export function pruneEmptyNodes(doc) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of allNodes(doc)) {
      if (!node.getMesh() && node.listChildren().length === 0 && !node.getSkin()) {
        node.dispose();
        changed = true;
      }
    }
  }
}

/** Drops KHR_materials_variants (the viewer recolours parts itself), so unused variant
 * materials and textures can be pruned. */
export function stripVariants(doc) {
  const ext = doc
    .getRoot()
    .listExtensionsUsed()
    .find((e) => e.extensionName === 'KHR_materials_variants');
  if (!ext) return;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) prim.setExtension('KHR_materials_variants', null);
  }
  ext.dispose();
}

/** Wraps the scene's roots in one node scaled uniformly so the model's size along `axis`
 * (0=x,1=y,2=z) becomes `meters`. Returns the scale factor. */
export function scaleTo(doc, axis, meters, name = 'Product') {
  const sc = scene(doc);
  const b = getBounds(sc);
  const current = b.max[axis] - b.min[axis];
  const f = meters / current;
  wrapRoots(doc, name, f);
  return f;
}

export function wrapRoots(doc, name, f = 1) {
  const sc = scene(doc);
  const wrapper = doc.createNode(name).setScale([f, f, f]);
  for (const child of sc.listChildren()) {
    sc.removeChild(child);
    wrapper.addChild(child);
  }
  sc.addChild(wrapper);
  return wrapper;
}

// ── Connected components ───────────────────────────────────────────────────────────────────

function positionsOf(prim) {
  const pos = prim.getAttribute('POSITION');
  const out = [];
  for (let i = 0; i < pos.getCount(); i++) out.push(pos.getElement(i, []));
  return out;
}

function trianglesOf(prim) {
  const idx = prim.getIndices();
  const n = idx ? idx.getCount() : prim.getAttribute('POSITION').getCount();
  const tris = [];
  for (let i = 0; i < n; i += 3) {
    tris.push(
      idx ? [idx.getScalar(i), idx.getScalar(i + 1), idx.getScalar(i + 2)] : [i, i + 1, i + 2],
    );
  }
  return tris;
}

/** Splits a primitive's triangles into pieces connected through shared vertex positions
 * (welded by position, so UV seams don't break a piece). */
export function components(prim) {
  const pos = positionsOf(prim);
  const tris = trianglesOf(prim);
  // Weld by quantised position.
  let lo = [Infinity, Infinity, Infinity],
    hi = [-Infinity, -Infinity, -Infinity];
  for (const p of pos)
    for (let k = 0; k < 3; k++) {
      lo[k] = Math.min(lo[k], p[k]);
      hi[k] = Math.max(hi[k], p[k]);
    }
  const tol = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) * 1e-5;
  const key = (p) => p.map((v) => Math.round(v / tol)).join(',');
  const canon = new Map();
  const vid = pos.map((p) => {
    const k = key(p);
    if (!canon.has(k)) canon.set(k, canon.size);
    return canon.get(k);
  });
  const parent = Array.from({ length: canon.size }, (_, i) => i);
  const find = (a) => {
    while (parent[a] !== a) {
      parent[a] = parent[parent[a]];
      a = parent[a];
    }
    return a;
  };
  const union = (a, b) => {
    a = find(a);
    b = find(b);
    if (a !== b) parent[a] = b;
  };
  for (const [a, b, c] of tris) {
    union(vid[a], vid[b]);
    union(vid[a], vid[c]);
  }
  const groups = new Map();
  tris.forEach((t, ti) => {
    const r = find(vid[t[0]]);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(ti);
  });
  const comps = [...groups.values()].map((triIdx) => {
    const cl = [Infinity, Infinity, Infinity],
      ch = [-Infinity, -Infinity, -Infinity];
    for (const ti of triIdx)
      for (const v of tris[ti])
        for (let k = 0; k < 3; k++) {
          cl[k] = Math.min(cl[k], pos[v][k]);
          ch[k] = Math.max(ch[k], pos[v][k]);
        }
    const size = [0, 1, 2].map((k) => hi[k] - lo[k] || 1);
    return {
      tris: triIdx,
      faces: triIdx.length,
      min: cl,
      max: ch,
      // Relative to the primitive's bounds (0..1), in the primitive's local axes.
      c: [0, 1, 2].map((k) => +(((cl[k] + ch[k]) / 2 - lo[k]) / size[k]).toFixed(3)),
      s: [0, 1, 2].map((k) => +((ch[k] - cl[k]) / size[k]).toFixed(3)),
    };
  });
  comps.sort((a, b) => b.faces - a.faces);
  return { comps, tris, pos };
}

/** Mean sRGB base colour of each component, sampled from the primitive's base colour texture at
 * its vertex UVs (falls back to the material's base colour factor). Adds `color` [r,g,b] 0-255. */
export async function sampleColors(prim, info) {
  const mat = prim.getMaterial();
  const tex = mat?.getBaseColorTexture();
  const factor = mat?.getBaseColorFactor() ?? [1, 1, 1, 1];
  if (!tex) {
    for (const c of info.comps)
      c.color = factor.slice(0, 3).map((v) => Math.round(Math.pow(v, 1 / 2.2) * 255));
    return;
  }
  const { data, info: im } = await sharp(Buffer.from(tex.getImage()))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const texCoord = mat.getBaseColorTextureInfo()?.getTexCoord() ?? 0;
  const uv = prim.getAttribute(`TEXCOORD_${texCoord}`);
  for (const c of info.comps) {
    const acc = [0, 0, 0];
    let n = 0;
    const step = Math.max(1, Math.floor(c.tris.length / 300));
    for (let i = 0; i < c.tris.length; i += step) {
      for (const v of info.tris[c.tris[i]]) {
        let [u, w] = uv.getElement(v, []);
        u -= Math.floor(u);
        w -= Math.floor(w);
        const x = Math.min(im.width - 1, Math.floor(u * im.width));
        const y = Math.min(im.height - 1, Math.floor(w * im.height));
        const k = (y * im.width + x) * 4;
        acc[0] += data[k];
        acc[1] += data[k + 1];
        acc[2] += data[k + 2];
        n++;
      }
    }
    c.color = acc.map((v) => Math.round(v / n));
  }
}

/** Replaces `node`'s mesh (one primitive) with child nodes, one per group returned by
 * `classify(component, index)` (a node name, or null to drop the component). Child nodes share
 * the original material and attributes (unused vertices are pruned later). */
export function splitNode(doc, node, info, classify) {
  const mesh = node.getMesh();
  const prims = mesh.listPrimitives();
  if (prims.length !== 1) throw new Error(`splitNode expects one primitive on ${node.getName()}`);
  const prim = prims[0];
  const byGroup = new Map();
  info.comps.forEach((c, i) => {
    const g = classify(c, i);
    if (g === null) return;
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(...c.tris);
  });
  const indexType = prim.getAttribute('POSITION').getCount() > 65535 ? Uint32Array : Uint32Array;
  for (const [name, triIdx] of byGroup) {
    const arr = new indexType(triIdx.length * 3);
    triIdx.forEach((ti, j) => arr.set(info.tris[ti], j * 3));
    const indices = doc
      .createAccessor(`${name}_indices`)
      .setType('SCALAR')
      .setArray(arr)
      .setBuffer(doc.getRoot().listBuffers()[0]);
    const p = doc
      .createPrimitive()
      .setMaterial(prim.getMaterial())
      .setIndices(indices)
      .setMode(prim.getMode());
    for (const sem of prim.listSemantics()) p.setAttribute(sem, prim.getAttribute(sem));
    const m = doc.createMesh(name).addPrimitive(p);
    node.addChild(doc.createNode(name).setMesh(m));
  }
  node.setMesh(null);
  return [...byGroup.keys()];
}

/** Final pass: drop unused data, compress geometry (Meshopt) and textures (WebP, ≤ maxSize). */
export async function finish(doc, out, { maxTexture = 2048 } = {}) {
  // Demo products don't auto-animate; animations also break once part hierarchies are flattened.
  for (const anim of doc.getRoot().listAnimations()) {
    anim.listChannels().forEach((c) => c.dispose());
    anim.listSamplers().forEach((sm) => sm.dispose());
    anim.dispose();
  }
  pruneEmptyNodes(doc);
  await doc.transform(
    prune({ keepLeaves: false }),
    dedup(),
    textureCompress({
      encoder: sharp,
      targetFormat: 'webp',
      resize: [maxTexture, maxTexture],
      quality: 88,
    }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
    prune(),
  );
  await io.write(out, doc);
}
