import type { PresentationEffect } from '../types';
import { createThreatPresenceEffect, ThreatPresenceEffect } from '../effects/ThreatPresenceEffect';
import { createSeaCreatureEffect, SeaCreatureEffect } from '../effects/SeaCreatureEffect';
import type { ThreatPresenceEffectConfig } from './threatPresenceEffectConfig';

export type PresentationEffectFactory = (config?: unknown) => PresentationEffect;

/**
 * Registry of presentation effect factories.
 *
 * New effects are registered here so {@link useWorldPresentationRuntime} can
 * resolve them by id without hardcoding effect construction in UI code.
 */
const PRESENTATION_EFFECT_REGISTRY: Record<string, PresentationEffectFactory> = {
  threat_presence: (config?: unknown) =>
    createThreatPresenceEffect(config as ThreatPresenceEffectConfig | undefined),
  sea_creature_presence: (config?: unknown) =>
    createSeaCreatureEffect(config as any),
};

/**
 * Resolve a presentation effect factory by id.
 *
 * @param id - Effect id registered in {@link PRESENTATION_EFFECT_REGISTRY}.
 * @returns The factory or `undefined` if the id is unknown.
 */
export function resolvePresentationEffectFactory(id: string): PresentationEffectFactory | undefined {
  return PRESENTATION_EFFECT_REGISTRY[id];
}

/**
 * Resolve and instantiate a presentation effect by id.
 *
 * @param id - Effect id.
 * @param config - Optional effect-specific config.
 * @returns A {@link PresentationEffect} instance or `undefined` if unknown.
 */
export function resolvePresentationEffect(
  id: string,
  config?: unknown,
): PresentationEffect | undefined {
  const factory = resolvePresentationEffectFactory(id);
  if (!factory) return undefined;
  return factory(config);
}

/**
 * Register a custom effect factory at runtime.
 */
export function registerPresentationEffect(id: string, factory: PresentationEffectFactory): void {
  PRESENTATION_EFFECT_REGISTRY[id] = factory;
}

export { ThreatPresenceEffect, createThreatPresenceEffect, SeaCreatureEffect, createSeaCreatureEffect };
