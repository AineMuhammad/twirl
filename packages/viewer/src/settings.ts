/**
 * `@twirl/viewer/settings`: scene and environment settings without the 3D engine.
 *
 * Import runtime values from here (not from `@twirl/viewer`) in code that renders before the
 * viewer loads, so three.js stays out of the page's initial JavaScript. Types can come from
 * either entry point.
 */
export {
  DEFAULT_ENVIRONMENT_SOURCES,
  ENVIRONMENT_IDS,
  ENVIRONMENTS,
  type EnvironmentId,
  type EnvironmentResolution,
  type EnvironmentSources,
  isEnvironmentId,
} from './environments';
export {
  backgroundCss,
  DEFAULT_SCENE,
  LIGHTING_PRESETS,
  type LightingPreset,
  type SceneBackground,
  type SceneSettings,
} from './scene';
export { CAMERA_VIEWS, type CameraView } from './camera-views';
