import { CURRENT_SCHEMA_VERSION } from '@twirl/config-schema';

/** Highest product-config schema version this viewer build can render. */
export const VIEWER_SUPPORTED_SCHEMA_VERSION = CURRENT_SCHEMA_VERSION;

export { Viewer, type ViewerProps } from './Viewer';
export {
  DEFAULT_DECODER_PATHS,
  type DecoderPaths,
  type LoadProgress,
  type ModelInfo,
  type ViewerError,
  type ViewerErrorKind,
} from './types';
