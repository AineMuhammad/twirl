// Copies three.js' Draco and Basis (KTX2) decoders into public/decoders so the viewer loads them
// from our own origin (never a CDN). Runs before `next dev` and `next build`; the output is
// git-ignored. Paths match the viewer's DEFAULT_DECODER_PATHS.
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'decoders');
const libDir = (file) => dirname(require.resolve(`three/examples/jsm/libs/${file}`));

const targets = {
  draco: [libDir('draco/gltf/draco_decoder.js'), /^draco_(decoder\.(js|wasm)|wasm_wrapper\.js)$/],
  basis: [libDir('basis/basis_transcoder.js'), /^basis_transcoder\.(js|wasm)$/],
};

for (const [name, [from, pattern]] of Object.entries(targets)) {
  const to = join(publicDir, name);
  mkdirSync(to, { recursive: true });
  const files = readdirSync(from).filter((f) => pattern.test(f));
  for (const file of files) copyFileSync(join(from, file), join(to, file));
  process.stdout.write(`decoders: ${name} (${files.length} files) → public/decoders/${name}/\n`);
}
