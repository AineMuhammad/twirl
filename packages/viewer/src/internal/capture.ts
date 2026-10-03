import type { SceneBackground } from '../scene';

/**
 * Paints a scene background onto a 2D canvas, matching `backgroundCss` (the WebGL canvas is
 * transparent; the page shows the backdrop behind it).
 */
export function paintBackground(
  ctx: CanvasRenderingContext2D,
  background: SceneBackground,
  width: number,
  height: number,
) {
  if (background.type === 'solid') {
    ctx.fillStyle = background.color;
    ctx.fillRect(0, 0, width, height);
    return;
  }
  if (background.type === 'gradient') {
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, background.from);
    g.addColorStop(1, background.to);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    return;
  }
  // radial-gradient(120% 95% at 50% 38%, inner, outer): an ellipse, drawn as a scaled circle.
  ctx.fillStyle = background.outer;
  ctx.fillRect(0, 0, width, height);
  const rx = width * 1.2;
  const ry = height * 0.95;
  ctx.save();
  ctx.translate(width * 0.5, height * 0.38);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, background.inner);
  g.addColorStop(1, background.outer);
  ctx.fillStyle = g;
  ctx.fillRect(-width, -height / (ry / rx), width * 2, (height * 2) / (ry / rx));
  ctx.restore();
}

/** A small rounded label in the bottom-right corner (e.g. "Made with Twirl"). */
export function paintWatermark(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
) {
  const size = Math.max(14, Math.round(width * 0.016));
  ctx.save();
  ctx.font = `600 ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const padX = size * 0.8;
  const boxW = ctx.measureText(text).width + padX * 2;
  const boxH = size * 2;
  const x = width - boxW - size;
  const y = height - boxH - size;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, boxH / 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(23, 23, 23, 0.85)';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + padX, y + boxH / 2);
  ctx.restore();
}

/** The pixel ratio for a capture: `scale`× the current one, with the longest side ≤ `maxSize`. */
export function capturePixelRatio(
  current: number,
  viewport: { width: number; height: number },
  scale = 2,
  maxSize = 3000,
) {
  const longest = Math.max(viewport.width, viewport.height, 1);
  return Math.max(0.5, Math.min(Math.max(current, 1) * scale, maxSize / longest));
}
