/**
 * Inspects a GLB/glTF file without rendering it: structure, triangle and texture counts, and
 * problems worth telling the merchant about. Pure TypeScript with no dependencies, so the same
 * report is built in the browser before upload and on the server afterwards (the server's is
 * authoritative).
 */

export const MODEL_REPORT_VERSION = 1;

/** Above this the model is likely too heavy for phones. */
export const TRIANGLE_WARNING = 500_000;
/** Textures larger than this on either side cost a lot of GPU memory. */
export const TEXTURE_SIDE_WARNING = 4096;

/** Extensions the viewer (three.js GLTFLoader + our decoders) can handle when required. */
const SUPPORTED_EXTENSIONS = new Set([
  'KHR_draco_mesh_compression',
  'EXT_meshopt_compression',
  'KHR_mesh_quantization',
  'KHR_texture_basisu',
  'KHR_texture_transform',
  'EXT_texture_webp',
  'EXT_texture_avif',
  'KHR_materials_unlit',
  'KHR_materials_emissive_strength',
  'KHR_materials_clearcoat',
  'KHR_materials_ior',
  'KHR_materials_specular',
  'KHR_materials_transmission',
  'KHR_materials_volume',
  'KHR_materials_sheen',
  'KHR_materials_iridescence',
  'KHR_materials_anisotropy',
  'KHR_materials_dispersion',
  'KHR_lights_punctual',
  'EXT_mesh_gpu_instancing',
]);

export interface TextureInfo {
  name: string | null;
  mimeType: string;
  bytes: number;
  width: number | null;
  height: number | null;
}

export interface ModelWarning {
  code: 'many-triangles' | 'large-texture' | 'unnamed-meshes';
  message: string;
}

export interface ModelReport {
  version: typeof MODEL_REPORT_VERSION;
  format: 'glb' | 'gltf';
  /** Problems that make the file unusable. Empty means valid. */
  errors: string[];
  warnings: ModelWarning[];
  /** Nodes that render a mesh (instances count separately). */
  meshCount: number;
  /** Triangles rendered, counting every instance. */
  triangleCount: number;
  materialCount: number;
  animationCount: number;
  textures: TextureInfo[];
  /** Mesh nodes without a name: merchants can't tell them apart when mapping parts. */
  unnamedMeshCount: number;
  extensionsRequired: string[];
}

// ── glTF JSON (only what we read) ─────────────────────────────────────────────────────────

interface GltfJson {
  asset?: { version?: string };
  scene?: number;
  scenes?: { nodes?: number[] }[];
  nodes?: { name?: string; mesh?: number; children?: number[] }[];
  meshes?: {
    primitives?: { mode?: number; indices?: number; attributes?: Record<string, number> }[];
  }[];
  accessors?: { count?: number }[];
  materials?: unknown[];
  animations?: unknown[];
  images?: { name?: string; uri?: string; mimeType?: string; bufferView?: number }[];
  bufferViews?: { buffer?: number; byteOffset?: number; byteLength?: number }[];
  buffers?: { uri?: string; byteLength?: number }[];
  extensionsUsed?: string[];
  extensionsRequired?: string[];
}

const GLB_MAGIC = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a; // "JSON"
const CHUNK_BIN = 0x004e4942; // "BIN\0"

class ModelError extends Error {}

function parseGlb(bytes: Uint8Array): { json: GltfJson; bin: Uint8Array | null } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength < 20 || view.getUint32(0, true) !== GLB_MAGIC) {
    throw new ModelError("This isn't a valid .glb file.");
  }
  if (view.getUint32(4, true) !== 2) throw new ModelError('Only glTF 2.0 files are supported.');
  const length = Math.min(view.getUint32(8, true), bytes.byteLength);
  let offset = 12;
  let json: GltfJson | null = null;
  let bin: Uint8Array | null = null;
  while (offset + 8 <= length) {
    const chunkLength = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const start = offset + 8;
    if (start + chunkLength > length) throw new ModelError('This .glb file is truncated.');
    const chunk = bytes.subarray(start, start + chunkLength);
    if (type === CHUNK_JSON && !json) json = parseJson(chunk);
    else if (type === CHUNK_BIN && !bin) bin = chunk;
    offset = start + chunkLength + ((4 - (chunkLength % 4)) % 4);
  }
  if (!json) throw new ModelError('This .glb file has no glTF data.');
  return { json, bin };
}

function parseJson(bytes: Uint8Array): GltfJson {
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof parsed !== 'object' || parsed === null) throw new Error('not an object');
    return parsed as GltfJson;
  } catch {
    throw new ModelError("The model's glTF data isn't valid JSON.");
  }
}

function decodeDataUri(uri: string): Uint8Array | null {
  const match = /^data:[^;,]*(;base64)?,(.*)$/s.exec(uri);
  if (!match) return null;
  const data = match[2] ?? '';
  if (!match[1]) return new TextEncoder().encode(decodeURIComponent(data));
  const binary = atob(data);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

// ── Image sizes from headers ──────────────────────────────────────────────────────────────

/** Width and height read from PNG, JPEG, WebP or KTX2 headers; null if unrecognised. */
export function imageSize(b: Uint8Array): { width: number; height: number } | null {
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  // PNG: IHDR right after the signature.
  if (b.length >= 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  // JPEG: walk segments to a start-of-frame marker.
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1] ?? 0;
      const segment = view.getUint16(i + 2);
      const isFrame =
        marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isFrame) return { height: view.getUint16(i + 5), width: view.getUint16(i + 7) };
      i += 2 + segment;
    }
    return null;
  }
  // WebP: RIFF....WEBP then VP8 / VP8L / VP8X.
  if (b.length >= 30 && String.fromCharCode(...b.subarray(0, 4)) === 'RIFF') {
    const kind = String.fromCharCode(...b.subarray(12, 16));
    if (kind === 'VP8 ')
      return {
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
      };
    if (kind === 'VP8L') {
      const bits = view.getUint32(21, true);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (kind === 'VP8X') {
      const w = (b[24] ?? 0) | ((b[25] ?? 0) << 8) | ((b[26] ?? 0) << 16);
      const h = (b[27] ?? 0) | ((b[28] ?? 0) << 8) | ((b[29] ?? 0) << 16);
      return { width: w + 1, height: h + 1 };
    }
    return null;
  }
  // KTX2: identifier then pixelWidth / pixelHeight.
  if (b.length >= 28 && b[0] === 0xab && b[1] === 0x4b && b[2] === 0x54 && b[3] === 0x58) {
    return { width: view.getUint32(20, true), height: view.getUint32(24, true) };
  }
  return null;
}

// ── Report ────────────────────────────────────────────────────────────────────────────────

function trianglesIn(json: GltfJson, meshIndex: number): number {
  let total = 0;
  for (const primitive of json.meshes?.[meshIndex]?.primitives ?? []) {
    const mode = primitive.mode ?? 4;
    const accessor =
      primitive.indices !== undefined ? primitive.indices : primitive.attributes?.POSITION;
    const count = accessor !== undefined ? (json.accessors?.[accessor]?.count ?? 0) : 0;
    if (mode === 4) total += Math.floor(count / 3);
    else if (mode === 5 || mode === 6) total += Math.max(0, count - 2);
  }
  return total;
}

/** Mesh nodes reachable from the default scene (or all scenes), with instance counts. */
function meshNodes(json: GltfJson) {
  const nodes = json.nodes ?? [];
  const scenes = json.scenes ?? [];
  const roots =
    scenes.length === 0
      ? nodes.map((_, i) => i)
      : (scenes[json.scene ?? 0]?.nodes ?? scenes.flatMap((s) => s.nodes ?? []));
  const found: { name: string | undefined; mesh: number }[] = [];
  const seen = new Set<number>();
  const stack = [...roots];
  while (stack.length > 0) {
    const index = stack.pop() as number;
    if (seen.has(index)) continue; // malformed files can contain cycles
    seen.add(index);
    const node = nodes[index];
    if (!node) continue;
    if (node.mesh !== undefined) found.push({ name: node.name, mesh: node.mesh });
    stack.push(...(node.children ?? []));
  }
  return found;
}

function bufferViewBytes(json: GltfJson, index: number, bin: Uint8Array | null): Uint8Array | null {
  const view = json.bufferViews?.[index];
  if (!view) return null;
  const buffer = json.buffers?.[view.buffer ?? 0];
  const data = buffer?.uri ? decodeDataUri(buffer.uri) : bin;
  if (!data) return null;
  const start = view.byteOffset ?? 0;
  return data.subarray(start, start + (view.byteLength ?? 0));
}

function texturesOf(json: GltfJson, bin: Uint8Array | null): TextureInfo[] {
  return (json.images ?? []).map((image) => {
    const bytes =
      image.bufferView !== undefined
        ? bufferViewBytes(json, image.bufferView, bin)
        : image.uri
          ? decodeDataUri(image.uri)
          : null;
    const size = bytes ? imageSize(bytes) : null;
    return {
      name: image.name ?? null,
      mimeType: image.mimeType ?? image.uri?.match(/^data:([^;,]+)/)?.[1] ?? 'unknown',
      bytes: bytes?.byteLength ?? 0,
      width: size?.width ?? null,
      height: size?.height ?? null,
    };
  });
}

function emptyReport(format: ModelReport['format'], error: string): ModelReport {
  return {
    version: MODEL_REPORT_VERSION,
    format,
    errors: [error],
    warnings: [],
    meshCount: 0,
    triangleCount: 0,
    materialCount: 0,
    animationCount: 0,
    textures: [],
    unnamedMeshCount: 0,
    extensionsRequired: [],
  };
}

/** Builds the report for a whole file's bytes. Never throws: problems become `errors`. */
export function inspectModel(bytes: Uint8Array, filename: string): ModelReport {
  const format: ModelReport['format'] = filename.toLowerCase().endsWith('.gltf') ? 'gltf' : 'glb';
  let json: GltfJson;
  let bin: Uint8Array | null = null;
  try {
    if (format === 'glb') ({ json, bin } = parseGlb(bytes));
    else json = parseJson(bytes);
  } catch (error) {
    return emptyReport(
      format,
      error instanceof ModelError ? error.message : 'This file could not be read.',
    );
  }

  const errors: string[] = [];
  const warnings: ModelWarning[] = [];
  if (!json.asset?.version?.startsWith('2.')) errors.push('Only glTF 2.0 files are supported.');

  const external = [...(json.buffers ?? []), ...(json.images ?? [])].some(
    (r) => typeof r.uri === 'string' && !r.uri.startsWith('data:'),
  );
  if (external) {
    errors.push(
      'This model uses separate .bin or texture files. Export a single .glb (or a .gltf with embedded data).',
    );
  }

  const required = json.extensionsRequired ?? [];
  const unsupported = required.filter((e) => !SUPPORTED_EXTENSIONS.has(e));
  if (unsupported.length > 0) {
    errors.push(`This model needs features the viewer can't display: ${unsupported.join(', ')}.`);
  }

  const nodes = meshNodes(json);
  if (nodes.length === 0) errors.push("This model doesn't contain any meshes.");
  const triangleCount = nodes.reduce((sum, n) => sum + trianglesIn(json, n.mesh), 0);
  const unnamedMeshCount = nodes.filter((n) => !n.name?.trim()).length;
  const textures = texturesOf(json, bin);

  if (triangleCount > TRIANGLE_WARNING) {
    warnings.push({
      code: 'many-triangles',
      message: `${triangleCount.toLocaleString('en-US')} triangles: this may be slow on phones. Under ${TRIANGLE_WARNING.toLocaleString('en-US')} is recommended.`,
    });
  }
  const large = textures.filter(
    (t) => (t.width ?? 0) > TEXTURE_SIDE_WARNING || (t.height ?? 0) > TEXTURE_SIDE_WARNING,
  );
  if (large.length > 0) {
    warnings.push({
      code: 'large-texture',
      message: `${large.length} texture${large.length === 1 ? ' is' : 's are'} larger than ${TEXTURE_SIDE_WARNING}px, which uses a lot of memory on phones.`,
    });
  }
  if (unnamedMeshCount > 0) {
    warnings.push({
      code: 'unnamed-meshes',
      message: `${unnamedMeshCount} mesh${unnamedMeshCount === 1 ? ' has' : 'es have'} no name. Name them in your 3D tool so parts are easy to identify.`,
    });
  }

  return {
    version: MODEL_REPORT_VERSION,
    format,
    errors,
    warnings,
    meshCount: nodes.length,
    triangleCount,
    materialCount: json.materials?.length ?? 0,
    animationCount: json.animations?.length ?? 0,
    textures,
    unnamedMeshCount,
    extensionsRequired: required,
  };
}

/**
 * A stored validation value (JSON from the database), read defensively: older rows may hold only
 * `{ errors }`, and nothing here should crash a page.
 */
export function readReport(value: unknown): {
  report: ModelReport | null;
  errors: string[];
  warnings: ModelWarning[];
} {
  if (typeof value !== 'object' || value === null)
    return { report: null, errors: [], warnings: [] };
  const v = value as Partial<ModelReport>;
  const errors = Array.isArray(v.errors) ? v.errors.filter((e) => typeof e === 'string') : [];
  const warnings = Array.isArray(v.warnings)
    ? v.warnings.filter((w): w is ModelWarning => typeof w?.message === 'string')
    : [];
  const report = v.version === MODEL_REPORT_VERSION ? (v as ModelReport) : null;
  return { report, errors, warnings };
}
