import type { CSSProperties } from 'react';
import {
  DEFAULT_PORTRAIT_CROP,
  type PortraitCropSettings,
} from '@/balancing/config/idleVillage/residentVisuals';

export const PORTRAIT_BADGE_CONTAINER_CLASS =
  'relative overflow-hidden rounded-full border-[3px] border-[#c58a3e] bg-black/40 shadow-[0_0_15px_rgba(197,138,62,0.4)]';

export const PORTRAIT_IMAGE_CLASS =
  'h-full w-full object-cover object-center transition-transform duration-300 will-change-transform';

export function getPortraitImageStyle(crop?: PortraitCropSettings): CSSProperties {
  const focusX = crop?.focusX ?? DEFAULT_PORTRAIT_CROP.focusX;
  const focusY = crop?.focusY ?? DEFAULT_PORTRAIT_CROP.focusY;
  const zoom = crop?.zoom ?? DEFAULT_PORTRAIT_CROP.zoom;
  return {
    objectPosition: `${focusX}% ${focusY}%`,
    transform: `scale(${zoom})`,
    transformOrigin: `${focusX}% ${focusY}%`,
  };
}
