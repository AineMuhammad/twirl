/**
 * `@twirl/viewer/ui`: the configurator UI and shared controls, without the 3D engine or zod.
 *
 * Pass `Viewer` (or a lazily loaded wrapper of it) to `Configurator`, so pages can render the
 * panel immediately and fetch three.js separately.
 */
export {
  Configurator,
  type ConfiguratorLayout,
  type ConfiguratorProps,
} from './configurator/Configurator';
export { OptionsPanel, type OptionsPanelProps } from './configurator/OptionsPanel';
export {
  colorFor,
  deformationsForSelections,
  nodeIdsByMesh,
  overridesForSelections,
  partNodeIds,
} from './configurator/config-overrides';
export { accentVars, titleFontClass } from './configurator/theme';
export { ColorPicker, type ColorPickerProps } from './ui/ColorPicker';
export * from './ui/icons';
export { type Tab, Tabs } from './ui/Tabs';
export { CheckBadge, focusRing, glass, RAINBOW, SectionTitle, Switch } from './ui/ui';
