import type { MapLayoutDefinition, MapSlotDefinition } from '@/balancing/config/idleVillage/types';

export const DEFAULT_MAP_LAYOUT: MapLayoutDefinition = {
  pixelWidth: 1280,
  pixelHeight: 720,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function resolveMapLayout(layout?: MapLayoutDefinition | null): MapLayoutDefinition {
  return {
    pixelWidth: Math.max(1, layout?.pixelWidth ?? DEFAULT_MAP_LAYOUT.pixelWidth),
    pixelHeight: Math.max(1, layout?.pixelHeight ?? DEFAULT_MAP_LAYOUT.pixelHeight),
  };
}

const usesLegacyGrid = (slot: Pick<MapSlotDefinition, 'x' | 'y'>) => slot.x <= 10 && slot.y <= 10;

export function computeSlotPercentPosition(
  slot: Pick<MapSlotDefinition, 'x' | 'y'>,
  layout: MapLayoutDefinition,
): { leftPercent: number; topPercent: number } {
  if (usesLegacyGrid(slot)) {
    const left = 8 + (slot.x / 10) * 80;
    const top = 12 + (slot.y / 10) * 55;
    return {
      leftPercent: clamp(left, 0, 100),
      topPercent: clamp(top, 0, 100),
    };
  }

  const left = (slot.x / layout.pixelWidth) * 100;
  const top = (slot.y / layout.pixelHeight) * 100;
  return {
    leftPercent: clamp(left, 0, 100),
    topPercent: clamp(top, 0, 100),
  };
}

export function relativeCoordsToPixels(
  relX: number,
  relY: number,
  layout: MapLayoutDefinition,
): { x: number; y: number } {
  const clampedX = clamp(relX, 0, 1);
  const clampedY = clamp(relY, 0, 1);
  return {
    x: Math.round(clampedX * layout.pixelWidth),
    y: Math.round(clampedY * layout.pixelHeight),
  };
}
