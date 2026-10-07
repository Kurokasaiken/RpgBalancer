import { DEFAULT_SKIN_PRESET_ID, SKIN_CONFIG_REGISTRY, type SkinPresetId } from './skinConfigRegistry';

/** Skins that can be compared live (public presets). */
export const COMPARABLE_SKIN_IDS: SkinPresetId[] = ['base', 'lacquer_atlas'];

/**
 * Skin applied at boot: the default, or in dev builds the one named by `?skin=`
 * so two skins can be compared on the same page.
 */
export function resolveInitialSkinPresetId(): SkinPresetId {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const requested = new URLSearchParams(window.location.search).get('skin');
    if (requested && requested in SKIN_CONFIG_REGISTRY) return requested as SkinPresetId;
  }
  return DEFAULT_SKIN_PRESET_ID;
}
