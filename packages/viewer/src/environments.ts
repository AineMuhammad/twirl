/**
 * HDRI environments (Poly Haven, CC0). Files are served by the host app, not the viewer:
 * `<base>/<id>_<resolution>.hdr`. See apps/web/public/hdri/README.md.
 *
 * `intensity` scales image-based lighting so environments read at similar exposure; values are
 * starting points to be tuned by eye.
 */
export const ENVIRONMENTS = {
  studio_small_08: { label: 'Studio', intensity: 1 },
  photo_studio_loft_hall: { label: 'Loft', intensity: 0.9 },
  lythwood_room: { label: 'Living room', intensity: 1.2 },
  empty_warehouse_01: { label: 'Warehouse', intensity: 1 },
  autoshop_01: { label: 'Garage', intensity: 1 },
  potsdamer_platz: { label: 'City street', intensity: 1 },
  kloofendal_48d_partly_cloudy_puresky: { label: 'Open sky', intensity: 0.8 },
  venice_sunset: { label: 'Sunset', intensity: 1 },
} as const satisfies Record<string, { label: string; intensity: number }>;

export type EnvironmentId = keyof typeof ENVIRONMENTS;
export const ENVIRONMENT_IDS = Object.keys(ENVIRONMENTS) as EnvironmentId[];

export type EnvironmentResolution = '1k' | '2k';

/** Base URLs (ending in `/`) per resolution. 2k is optional and only used on large screens. */
export interface EnvironmentSources {
  '1k': string;
  '2k'?: string;
}

export const DEFAULT_ENVIRONMENT_SOURCES: EnvironmentSources = { '1k': '/hdri/1k/' };

export function isEnvironmentId(value: string): value is EnvironmentId {
  return Object.hasOwn(ENVIRONMENTS, value);
}

export function environmentUrl(
  id: EnvironmentId,
  resolution: EnvironmentResolution,
  sources: EnvironmentSources,
): string {
  const base = (resolution === '2k' ? sources['2k'] : undefined) ?? sources['1k'];
  const res = resolution === '2k' && sources['2k'] ? '2k' : '1k';
  return `${base.endsWith('/') ? base : `${base}/`}${id}_${res}.hdr`;
}

/** Physical pixel width from which a visible environment background switches to 2k. */
export const LARGE_SCREEN_PX = 1600;

/**
 * 1k is plenty for lighting and reflections; 2k only matters when the panorama is visible as
 * the background on a large screen (a 1k panorama spans 360° in 1024 px).
 */
export function pickEnvironmentResolution(opts: {
  backgroundVisible: boolean;
  physicalWidth: number;
  has2k: boolean;
}): EnvironmentResolution {
  return opts.backgroundVisible && opts.has2k && opts.physicalWidth >= LARGE_SCREEN_PX
    ? '2k'
    : '1k';
}
