/**
 * Minimal Feedback UI Config
 *
 * Exposes feedback-related settings (resource ticker, slot glow, sensory cues)
 * for the Minimal Gameplay vertical slice. Reads the canonical values from the
 * balancing config to keep UI layers config-first.
 */
import { MINIMAL_GAMEPLAY_CONFIG } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import type {
  MinimalGameplayFeedbackConfig,
  MinimalGameplayResourceTickerConfig,
  MinimalGameplaySlotGlowConfig,
  MinimalGameplaySensoryFeedbackConfig,
} from '@/balancing/config/idleVillage/minimalGameplayConfig';

export interface MinimalFeedbackUIConfig {
  resourceTicker: MinimalGameplayResourceTickerConfig;
  slotGlow: MinimalGameplaySlotGlowConfig;
  sensory: MinimalGameplaySensoryFeedbackConfig;
}

const FEEDBACK_CONFIG: MinimalFeedbackUIConfig = MINIMAL_GAMEPLAY_CONFIG.feedback;

/**
 * Returns the full feedback configuration for Minimal Gameplay UI surfaces.
 */
export function getMinimalFeedbackConfig(): MinimalFeedbackUIConfig {
  return FEEDBACK_CONFIG;
}

export function getResourceTickerConfig(): MinimalGameplayResourceTickerConfig {
  return FEEDBACK_CONFIG.resourceTicker;
}

export function getSlotGlowConfig(): MinimalGameplaySlotGlowConfig {
  // TODO(style-lab-flexibility): extend this to read Style Lab interactionPhysics
  // (bloomIntensity, shadowDepth, overshoot profile) once the new token schema lands.
  // Until then we proxy the MINIMAL_GAMEPLAY_CONFIG values.
  return FEEDBACK_CONFIG.slotGlow;
}

export function getSensoryFeedbackConfig(): MinimalGameplaySensoryFeedbackConfig {
  return FEEDBACK_CONFIG.sensory;
}
