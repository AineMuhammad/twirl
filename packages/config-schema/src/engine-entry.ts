/**
 * `@twirl/config-schema/engine`: evaluate, price and resolve selections without zod.
 *
 * Takes an already-parsed `ProductConfig` (parse it on the server or in a lazily loaded chunk with
 * `parseProductConfig`). Storefront UI imports from here so the schema library stays out of the
 * page's initial JavaScript.
 */
export type {
  ColorGroup,
  Condition,
  DimensionGroup,
  OptionGroup,
  ProductConfig,
  ProductConfigInput,
  Rule,
  VisibilityGroup,
} from './config';
export * from './engine';
export { humanizeName, slugify } from './names';
export {
  defaultSelections,
  defaultValue,
  parseCustomColor,
  resolveSelections,
  type ResolvedSelections,
  type SelectionAdjustment,
  type SelectionValue,
  type Selections,
  snapDimension,
} from './selections';
