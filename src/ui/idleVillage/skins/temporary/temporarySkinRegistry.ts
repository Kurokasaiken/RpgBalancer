import type { TemporarySkinConfig } from './TemporarySkinConfig';
import { validateTemporarySkinConfig } from './TemporarySkinConfig';
import { POI_AMBER_SKIN_CONFIG } from '../poi/poiAmberSkinConfig';
import { SLOT_WILDERNESS_BRONZE_CONFIG } from '../converted/slotWildernessBronzeConfig';
import { POI_DETAIL_SKIN_CONFIG } from '../poi/poiDetailSkinConfig';

const registry = new Map<string, TemporarySkinConfig>();

function registerBuiltInSkin(config: TemporarySkinConfig): void {
  validateTemporarySkinConfig(config);
  registry.set(config.id, config);
}

registerBuiltInSkin(POI_AMBER_SKIN_CONFIG);
registerBuiltInSkin(SLOT_WILDERNESS_BRONZE_CONFIG);
registerBuiltInSkin(POI_DETAIL_SKIN_CONFIG);

export function registerTemporarySkin(config: TemporarySkinConfig): void {
  validateTemporarySkinConfig(config);
  registry.set(config.id, config);
}

export function getTemporarySkinConfig(id: string): TemporarySkinConfig | undefined {
  return registry.get(id);
}

export function listTemporarySkins(): TemporarySkinConfig[] {
  return Array.from(registry.values());
}
