import { WORLD_SURFACE_CONFIG } from '../config/worldSurfaceConfig';

/**
 * Calculate a clamped parallax offset from mouse position.
 * @param mouseX - Mouse X coordinate in viewport pixels.
 * @param mouseY - Mouse Y coordinate in viewport pixels.
 * @returns Clamped offset value for the base world layer.
 */
export const calculateParallaxOffset = (mouseX: number, mouseY: number): number => {
  const { bounds } = WORLD_SURFACE_CONFIG.parallax;
  const [min, max] = bounds;
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const deltaX = (mouseX - centerX) / centerX;
  const deltaY = (mouseY - centerY) / centerY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const normalized = Math.min(1, Math.max(-1, distance));
  const value = normalized * max;
  return Math.min(max, Math.max(min, value));
};
