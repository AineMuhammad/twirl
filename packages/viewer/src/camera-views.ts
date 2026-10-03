/** Preset camera views available on every model (no three.js import: safe for settings). */
export const CAMERA_VIEWS = ['front', 'threeQuarter', 'side', 'back', 'top'] as const;
export type CameraView = (typeof CAMERA_VIEWS)[number];
