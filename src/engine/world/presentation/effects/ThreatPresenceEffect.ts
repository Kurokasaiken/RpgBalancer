import type { RuntimeObject } from '../../model/RuntimeObject';
import type { WorldEvent } from '../../model/WorldEvent';
import type { PresentationContext, PresentationEffect, PresentationOutput } from '../types';
import {
  type ThreatPresenceEffectConfig,
  DEFAULT_THREAT_PRESENCE_EFFECT_CONFIG,
  validateThreatPresenceEffectConfig,
} from '../config/threatPresenceEffectConfig';

type ThreatPhase = 'safe' | 'manifesting' | 'threatened';

function getEventOrigin(event: WorldEvent): string {
  if (event.data && typeof event.data.origin === 'string') {
    return event.data.origin;
  }
  return 'north';
}

function buildMarker(
  event: WorldEvent,
  config: ThreatPresenceEffectConfig,
  opacity: number,
): RuntimeObject {
  const origin = getEventOrigin(event);
  const position = config.originPositions[origin] ?? config.originPositions.north;

  return {
    id: `${config.markerId}-${event.id}`,
    location: { mode: 'dynamic', x: position.x, y: position.y },
    type: config.markerType,
    state: 'present',
    visual: {
      renderLayer: 'world',
      renderMode: config.markerVisual.renderMode,
      scale: config.markerVisual.scale,
      tint: config.colors.markerTint,
      glow: config.markerVisual.glow,
    },
    animation: {
      mode: 'pulse',
      speed: 1,
      direction: 'both',
    },
    data: { origin, opacity },
  };
}

function getPhase(tick: number, config: ThreatPresenceEffectConfig): ThreatPhase {
  if (tick < config.phaseTicks.manifestingStart) return 'safe';
  if (tick <= config.phaseTicks.manifestingEnd) return 'manifesting';
  return 'threatened';
}

/**
 * Pure, deterministic effect that translates an active `threat` {@link WorldEvent}
 * into a persistent visual perception on the world surface.
 *
 * - Tick 0..4: safe, no output.
 * - Tick 5..14: threat is manifesting: light vignette tint, partial marker.
 * - Tick 15+: persistent threatened state: full vignette tint, marker visible.
 *
 * The effect never mutates {@link WorldState} and uses no randomness.
 */
export class ThreatPresenceEffect implements PresentationEffect {
  readonly id = 'threat_presence';

  private readonly config: ThreatPresenceEffectConfig;

  constructor(config: ThreatPresenceEffectConfig = DEFAULT_THREAT_PRESENCE_EFFECT_CONFIG) {
    this.config = validateThreatPresenceEffectConfig(config);
  }

  enabled(ctx: PresentationContext): boolean {
    return ctx.model.activeEvents.some(
      (event) => event.category === 'threat' && event.lifecycle?.state === 'active',
    );
  }

  update(ctx: PresentationContext): Partial<PresentationOutput> {
    const activeThreat = ctx.model.activeEvents.find(
      (event) => event.category === 'threat' && event.lifecycle?.state === 'active',
    );

    if (!activeThreat) {
      return {};
    }

    const phase = getPhase(ctx.tick, this.config);

    if (phase === 'safe') {
      return {
        activeVisualStateId: this.config.visualStateIds.safe,
      };
    }

    const isManifesting = phase === 'manifesting';
    const tint = isManifesting ? this.config.colors.manifestingTint : this.config.colors.threatenedTint;
    const layerOpacity = isManifesting
      ? this.config.opacities.manifestingLayerOpacity
      : this.config.opacities.threatenedLayerOpacity;
    const markerOpacity = isManifesting
      ? this.config.opacities.manifestingMarkerOpacity
      : this.config.opacities.threatenedMarkerOpacity;
    const visualStateId = isManifesting
      ? this.config.visualStateIds.manifesting
      : this.config.visualStateIds.threatened;

    return {
      activeVisualStateId: visualStateId,
      visualStateOverrides: [
        {
          type: 'tint_layer',
          layerId: this.config.layerTarget,
          tint,
        },
        {
          type: 'set_opacity',
          layerId: this.config.layerTarget,
          opacity: layerOpacity,
        },
      ],
      runtimeObjects: [buildMarker(activeThreat, this.config, markerOpacity)],
    };
  }
}

/**
 * Factory for creating a {@link ThreatPresenceEffect} with an optional config.
 */
export function createThreatPresenceEffect(
  config?: ThreatPresenceEffectConfig,
): ThreatPresenceEffect {
  return new ThreatPresenceEffect(config);
}
