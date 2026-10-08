import { useSyncExternalStore } from 'react';

/**
 * Thickness of the bronze band of every `HudPlaque`, in px. One shared value so a dev slider (Tuning panel)
 * thickens or thins every plaque on screen at once; the shipped default is what the config says.
 */
export const DEFAULT_HUD_BAND_PX = 3.5;
let band = DEFAULT_HUD_BAND_PX;
const listeners = new Set<() => void>();

export const setHudBandPx = (value: number) => {
  band = value;
  listeners.forEach((listener) => listener());
};
export const getHudBandPx = () => band;
export const useHudBandPx = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getHudBandPx,
    () => DEFAULT_HUD_BAND_PX,
  );
