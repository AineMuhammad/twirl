import { MAX_MODEL_BYTES } from '@/config/limits';

export type LocalModelCheck = { ok: true } | { ok: false; message: string };

const GLB_MAGIC = 0x46546c67; // "glTF", little-endian

function extensionOf(name: string) {
  return name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '';
}

function isEmbedded(uri: unknown) {
  return typeof uri !== 'string' || uri.startsWith('data:');
}

/**
 * Checks a file the user dropped or picked before handing it to the viewer. The file never
 * leaves the browser. A .gltf must embed its buffers and images: one dropped file can't bring
 * its separate .bin and texture files along.
 */
export async function checkLocalModel(file: File): Promise<LocalModelCheck> {
  const ext = extensionOf(file.name);
  if (ext !== 'glb' && ext !== 'gltf') {
    return { ok: false, message: 'Please choose a .glb or .gltf file.' };
  }
  if (file.size === 0) return { ok: false, message: 'This file is empty.' };
  if (file.size > MAX_MODEL_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return { ok: false, message: `This file is ${mb} MB. The limit is 15 MB.` };
  }

  if (ext === 'glb') {
    const header = new DataView(await file.slice(0, 4).arrayBuffer());
    if (header.byteLength < 4 || header.getUint32(0, true) !== GLB_MAGIC) {
      return { ok: false, message: "This doesn't look like a valid .glb file." };
    }
    return { ok: true };
  }

  let json: { buffers?: { uri?: unknown }[]; images?: { uri?: unknown }[] };
  try {
    json = JSON.parse(await file.text()) as typeof json;
  } catch {
    return { ok: false, message: "This .gltf file isn't valid JSON." };
  }
  const external = [...(json.buffers ?? []), ...(json.images ?? [])].some(
    (r) => !isEmbedded(r.uri),
  );
  if (external) {
    return {
      ok: false,
      message:
        'This .gltf uses separate .bin or texture files. Export it as a single .glb (or a .gltf with embedded data) and try again.',
    };
  }
  return { ok: true };
}
