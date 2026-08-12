import type { PresentationContext, PresentationEffect, PresentationOutput } from '../types';
import type { RuntimeObject } from '../../model/RuntimeObject';

/**
 * Generates rare sea creature sightings as runtime objects on the world surface.
 *
 * Creatures appear sporadically in open water, scaled to world coordinates.
 * This is placeholder data-driven rendering — the visual (SVG, tint, scale) is
 * configured per scenario, not hardcoded.
 */
export class SeaCreatureEffect implements PresentationEffect {
  readonly id = 'sea_creature_presence';

  private config: SeaCreatureEffectConfig;

  constructor(config: SeaCreatureEffectConfig = DEFAULT_SEA_CREATURE_CONFIG) {
    this.config = config;
  }

  enabled(): boolean {
    return true;
  }

  update(ctx: PresentationContext): Partial<PresentationOutput> {
    const creatures: RuntimeObject[] = [];

    for (const spawn of this.config.spawns) {
      // Deterministic phase: cycle repeats every cycleSeconds.
      // Visible for visibleFraction of the cycle.
      const phaseInCycle = (ctx.tick * this.config.ticksPerSecond) % spawn.cycleSeconds;
      const visibleWindow = spawn.cycleSeconds * spawn.visibleFraction;

      const isVisible = phaseInCycle < visibleWindow;
      if (!isVisible) continue;

      // Fade in/hold/fade out.
      const opacity = this.getOpacity(phaseInCycle, visibleWindow, spawn);

      creatures.push({
        id: `sea_creature_${spawn.id}`,
        location: { mode: 'dynamic', x: spawn.x, y: spawn.y },
        type: 'sea_creature',
        state: 'present',
        visual: {
          renderLayer: 'world',
          renderMode: 'text',
          scale: spawn.scale,
          iconKey: spawn.icon,
          tint: spawn.tint,
          glow: spawn.glow,
        },
        data: { opacity },
      });
    }

    return { runtimeObjects: creatures };
  }

  private getOpacity(
    phaseInCycle: number,
    visibleWindow: number,
    spawn: SeaCreatureSpawn,
  ): number {
    const rampIn = visibleWindow * 0.2;
    const rampOut = visibleWindow * 0.8;

    if (phaseInCycle < rampIn) {
      return (phaseInCycle / rampIn) * spawn.opacity;
    }
    if (phaseInCycle < rampOut) {
      return spawn.opacity;
    }
    return ((visibleWindow - phaseInCycle) / (visibleWindow - rampOut)) * spawn.opacity;
  }
}

export interface SeaCreatureSpawn {
  id: string;
  x: number;
  y: number;
  icon: string;
  tint: string;
  scale: number;
  opacity: number;
  cycleSeconds: number;
  visibleFraction: number;
  glow?: boolean;
}

export interface SeaCreatureEffectConfig {
  spawns: SeaCreatureSpawn[];
  ticksPerSecond: number;
}

export const DEFAULT_SEA_CREATURE_CONFIG: SeaCreatureEffectConfig = {
  spawns: [
    {
      id: 'leviathan_north',
      x: 2120,
      y: 800,
      icon: '🐙',
      tint: '#4a7c7e',
      scale: 1.2,
      opacity: 0.7,
      cycleSeconds: 120,
      visibleFraction: 0.08,
      glow: true,
    },
    {
      id: 'leviathan_east',
      x: 3600,
      y: 1800,
      icon: '🦑',
      tint: '#5a8c8e',
      scale: 1.0,
      opacity: 0.6,
      cycleSeconds: 140,
      visibleFraction: 0.06,
      glow: true,
    },
  ],
  ticksPerSecond: 2, // 500ms per tick
};

export function createSeaCreatureEffect(
  config?: SeaCreatureEffectConfig,
): SeaCreatureEffect {
  return new SeaCreatureEffect(config);
}
