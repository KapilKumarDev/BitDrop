export const MIN_ZOOM = 1;
export const MAX_ZOOM = 8;
const STEP = 1.5;

export const clampZoom = (zoom) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
export const stepZoom = (zoom, direction) => clampZoom(direction > 0 ? zoom * STEP : zoom / STEP);
