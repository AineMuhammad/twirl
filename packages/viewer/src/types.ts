/** Where the viewer fetches decoder files from. Must be same-origin (or CORS-enabled) URLs ending in `/`. */
export interface DecoderPaths {
  /** Directory containing three's `draco_decoder.js/.wasm` and `draco_wasm_wrapper.js`. */
  draco: string;
  /** Directory containing three's `basis_transcoder.js/.wasm` (for KTX2 textures). */
  basis: string;
}

export const DEFAULT_DECODER_PATHS: DecoderPaths = {
  draco: '/decoders/draco/',
  basis: '/decoders/basis/',
};

export interface LoadProgress {
  /** 0–1, or `null` when the server didn't report a size. */
  fraction: number | null;
  loadedBytes: number;
}

/** One node of the model's hierarchy, as shown in a mesh tree. */
export interface MeshTreeNode {
  /** Stable for the same file: the child-index path from the model root, e.g. "0/2/1". */
  id: string;
  /** The node name, or a generated label like "Unnamed mesh 3". */
  name: string;
  /** False when the file didn't name this node (worth warning merchants about). */
  hasName: boolean;
  kind: 'mesh' | 'group';
  /** Triangles in this mesh, or in all meshes under this group. */
  triangleCount: number;
  materialNames: string[];
  children: MeshTreeNode[];
}

export interface ModelInfo {
  meshCount: number;
  triangleCount: number;
  animationNames: string[];
  /** Hierarchy of nodes that contain meshes. */
  meshTree: MeshTreeNode[];
}

export type ViewerErrorKind = 'network' | 'parse' | 'unknown';

export interface ViewerError {
  kind: ViewerErrorKind;
  /** Safe to show to shoppers. */
  message: string;
  cause: unknown;
}

/** Per-node appearance changes, keyed by `MeshTreeNode.id`. Overrides on a group apply to every
 * mesh under it unless a descendant sets its own. */
export interface MeshOverride {
  /** CSS hex color (#rrggbb). Multiplies with any base-color texture (tints it). */
  color?: string;
  /** Show or hide this node. Hiding a group hides everything under it. */
  visible?: boolean;
}

export type MeshOverrides = Record<string, MeshOverride>;
