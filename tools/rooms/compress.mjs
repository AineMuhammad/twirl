// Compresses the exported room for the web: WebP textures and Meshopt geometry.
// Usage: node compress.mjs   (reads out/room-raw.glb, writes out/room.glb)
import fs from 'node:fs';

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, simplify, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const IN = 'out/room-raw.glb';
const OUT = 'out/room.glb';
// Seen up close next to the product: kept sharper than the rest of the room.
const CLOSE_UP = /floor|rug|carpet|artwork|laminate/i;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(IN);

// Anchors (product spot, lights) are empty nodes: keep them through pruning.
const keepAnchors = prune({ keepLeaves: true, keepExtras: true });

await doc.transform(
  dedup(),
  keepAnchors,
  weld(),
  // Removes only detail too small to see at room scale (error relative to each mesh's size).
  simplify({ simplifier: MeshoptSimplifier, ratio: 0, error: 0.0012 }),
  textureCompress({
    encoder: sharp,
    targetFormat: 'webp',
    pattern: CLOSE_UP,
    // Only colour stays sharp; their normal and roughness maps don't need 2048 px.
    slots: /^baseColor/,
    resize: [2048, 2048],
    quality: 86,
  }),
  // Everything not yet WebP: the rest of the room, smaller.
  textureCompress({
    encoder: sharp,
    targetFormat: 'webp',
    formats: /^image\/(png|jpeg)$/,
    resize: [1024, 1024],
    quality: 84,
  }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  keepAnchors,
);
await io.write(OUT, doc);

const mb = (f) => (fs.statSync(f).size / 1048576).toFixed(1);
let triangles = 0;
for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) triangles += (prim.getIndices()?.getCount() ?? 0) / 3;
}
console.log(
  `${IN} ${mb(IN)} MB → ${OUT} ${mb(OUT)} MB, ${Math.round(triangles / 1000)}k triangles`,
);
