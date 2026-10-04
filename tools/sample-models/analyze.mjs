// Prints connected components of a node's mesh with relative centre/size and sampled colour.
// Usage: node analyze.mjs <file.glb> <nodeName> [limit]
import { read, nodeByName, components, sampleColors } from './lib.mjs';

const [file, nodeName, limit = '60'] = process.argv.slice(2);
const doc = await read(file);
const node = nodeByName(doc, nodeName);
const prim = node.getMesh().listPrimitives()[0];
const info = components(prim);
await sampleColors(prim, info);
console.log(`${info.comps.length} components`);
const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
info.comps
  .slice(0, +limit)
  .forEach((c, i) =>
    console.log(
      `${String(i).padStart(3)} f=${String(c.faces).padStart(5)} c=${c.c.join(',')} s=${c.s.join(',')} ${hex(c.color)}`,
    ),
  );
