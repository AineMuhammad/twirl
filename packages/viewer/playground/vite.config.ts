import { createReadStream, existsSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize, resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const require = createRequire(import.meta.url);
const libDir = (file: string) => dirname(require.resolve(`three/examples/jsm/libs/${file}`));

const DECODER_DIRS: Record<string, string> = {
  '/decoders/draco/': libDir('draco/gltf/draco_decoder.js'),
  '/decoders/basis/': libDir('basis/basis_transcoder.js'),
};
const MIME: Record<string, string> = { '.js': 'text/javascript', '.wasm': 'application/wasm' };

/** Serves three's decoder files at the viewer's default paths, straight from node_modules. */
function serveDecoders(): Plugin {
  const middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url?.split('?')[0] ?? '';
    for (const [prefix, dir] of Object.entries(DECODER_DIRS)) {
      if (!url.startsWith(prefix)) continue;
      const file = normalize(join(dir, url.slice(prefix.length)));
      if (!file.startsWith(dir) || !existsSync(file)) break;
      res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream');
      createReadStream(file).pipe(res);
      return;
    }
    next();
  };
  return {
    name: 'twirl-serve-decoders',
    // Dev server and `vite preview` (production build, for realistic performance checks).
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  };
}

// Dev-only harness for the viewer. Sample models come from the web app's public folder.
export default defineConfig({
  root: resolve(import.meta.dirname),
  publicDir: resolve(import.meta.dirname, '../../../apps/web/public'),
  plugins: [react(), serveDecoders()],
  server: { port: 5174 },
  preview: { port: 5175 },
  build: { outDir: resolve(import.meta.dirname, '../dist/playground'), emptyOutDir: true },
});
