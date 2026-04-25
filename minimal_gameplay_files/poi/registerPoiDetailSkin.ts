import { POI_DETAIL_SKIN_CONFIG } from './poiDetailSkinConfig';
import { registerTemporarySkin } from '../temporary/temporarySkinRegistry';

/**
 * Helper to register POI Detail skin programmatically
 * Usage: registerPoiDetailSkin();
 */
export function registerPoiDetailSkin(): void {
  registerTemporarySkin(POI_DETAIL_SKIN_CONFIG);
}

/**
 * Get POI Detail skin config
 */
export function getPoiDetailSkinConfig() {
  return POI_DETAIL_SKIN_CONFIG;
}
