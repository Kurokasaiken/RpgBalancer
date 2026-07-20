/**
 * Pure coordinate conversion helpers for the world surface camera.
 *
 * All calculations assume a top-left origin and world pixel units.
 */

export interface CameraState {
  panX: number;
  panY: number;
  zoom: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface WorldPoint {
  x: number;
  y: number;
}

export interface ViewportPoint {
  x: number;
  y: number;
}

/**
 * Convert a world point to viewport (screen) coordinates.
 * Pan is the world point currently shown at the top-left of the viewport.
 */
export function worldToViewport(
  world: WorldPoint,
  camera: CameraState,
): ViewportPoint {
  return {
    x: (world.x - camera.panX) * camera.zoom,
    y: (world.y - camera.panY) * camera.zoom,
  };
}

/**
 * Convert a viewport (screen) point to world coordinates.
 */
export function viewportToWorld(
  viewport: ViewportPoint,
  camera: CameraState,
): WorldPoint {
  return {
    x: viewport.x / camera.zoom + camera.panX,
    y: viewport.y / camera.zoom + camera.panY,
  };
}

/**
 * Clamp camera pan so the world bounds remain reachable.
 */
export function clampPan(
  panX: number,
  panY: number,
  zoom: number,
  viewport: ViewportSize,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
): { panX: number; panY: number } {
  const visibleWidth = viewport.width / zoom;
  const visibleHeight = viewport.height / zoom;

  const minX = bounds.minX;
  const maxX = Math.max(bounds.minX, bounds.maxX - visibleWidth);
  const minY = bounds.minY;
  const maxY = Math.max(bounds.minY, bounds.maxY - visibleHeight);

  return {
    panX: Math.min(Math.max(panX, minX), maxX),
    panY: Math.min(Math.max(panY, minY), maxY),
  };
}

/**
 * Clamp zoom to the allowed range.
 */
export function clampZoom(zoom: number, minZoom: number, maxZoom: number): number {
  return Math.min(Math.max(zoom, minZoom), maxZoom);
}
