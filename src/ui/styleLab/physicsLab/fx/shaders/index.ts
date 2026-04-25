/**
 * Shaders Module Index
 *
 * Exports all shader types and configurations for Physics Lab FX.
 */

export type { LiquidGaugeConfig } from './liquidGaugeShader';
export type { FogSlotConfig } from './fogSlotShader';
export type { FoilCardConfig } from './foilCardShader';

export { 
  createLiquidGaugeShaderConfig,
  DEFAULT_LIQUID_GAUGE_CONFIG,
  LIQUID_GAUGE_VERTEX_SHADER,
  LIQUID_GAUGE_FRAGMENT_SHADER,
  LIQUID_GAUGE_VERTEX_SHADER_WEBGL2,
  LIQUID_GAUGE_FRAGMENT_SHADER_WEBGL2,
  hexToRgb as liquidGaugeHexToRgb,
} from './liquidGaugeShader';

export { 
  createFogSlotShaderConfig,
  DEFAULT_FOG_SLOT_CONFIG,
  FOG_SLOT_VERTEX_SHADER,
  FOG_SLOT_FRAGMENT_SHADER,
  FOG_SLOT_VERTEX_SHADER_WEBGL2,
  FOG_SLOT_FRAGMENT_SHADER_WEBGL2,
  hexToRgb as fogSlotHexToRgb,
} from './fogSlotShader';

export { 
  createFoilCardShaderConfig,
  DEFAULT_FOIL_CARD_CONFIG,
  FOIL_CARD_VERTEX_SHADER,
  FOIL_CARD_FRAGMENT_SHADER,
  FOIL_CARD_VERTEX_SHADER_WEBGL2,
  FOIL_CARD_FRAGMENT_SHADER_WEBGL2,
  hexToRgb as foilCardHexToRgb,
} from './foilCardShader';
