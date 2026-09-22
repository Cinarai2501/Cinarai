export const MIN_ZOOM = 0.8;
export const DEFAULT_ZOOM = 1;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.25;
export const ZOOM_LEVELS = [MIN_ZOOM, DEFAULT_ZOOM, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, MAX_ZOOM];

export function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))));
}

export function stepZoom(currentZoom: number, direction: 1 | -1): number {
  const currentIndex = ZOOM_LEVELS.reduce((closestIndex, level, index) =>
    Math.abs(level - currentZoom) < Math.abs(ZOOM_LEVELS[closestIndex] - currentZoom) ? index : closestIndex, 0);
  const nextIndex = Math.min(ZOOM_LEVELS.length - 1, Math.max(0, currentIndex + direction));
  return ZOOM_LEVELS[nextIndex];
}