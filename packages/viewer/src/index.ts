import { CURRENT_SCHEMA_VERSION } from '@twirl/config-schema';

/** Highest product-config schema version this viewer build can render. */
export const VIEWER_SUPPORTED_SCHEMA_VERSION = CURRENT_SCHEMA_VERSION;

export { Viewer, type ViewerHandle, type ViewerProps } from './Viewer';
export {
  DEFAULT_DECODER_PATHS,
  type DecoderPaths,
  type LoadProgress,
  type MeshOverride,
  type MeshOverrides,
  type MeshTreeNode,
  type ModelInfo,
  type ViewerError,
  type ViewerErrorKind,
} from './types';
export {
  backgroundCss,
  DEFAULT_SCENE,
  LIGHTING_PRESETS,
  type LightingPreset,
  type SceneBackground,
  type SceneSettings,
} from './scene';
