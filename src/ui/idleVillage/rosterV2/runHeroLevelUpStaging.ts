/**
 * Director "Level up" staging command (PLAN-032 SP-5, artifact r009).
 *
 * Enumerated outcomes, identical in dev and prod:
 * - REJECT — invalid config (`configInvalid` or `config === null`) or any
 *   target that is not a roster-valid hero: nothing is dispatched, no
 *   telemetry, no audio, no FX. A blocked button is the correct teaser
 *   behavior.
 * - REJECT (no-op) — valid config but ZERO eligible targets (no valid target
 *   has a mounted hero card): same shape, nothing emitted — no telemetry or
 *   audio for an invisible level-up.
 * - ACCEPT — >=1 eligible target: one `hero_levelup_mock` presentation event
 *   per eligible target (eventId `<commandSeq>:<targetIndex>`, monotonic —
 *   newer wins every supersede rule), ONE `feature_action` telemetry event,
 *   ONE `level_up` cue.
 */

import { HERO_LEVEL_CONFIG, HERO_LEVEL_CONFIG_INVALID, type HeroLevelConfig } from '@/balancing/config/idleVillage/heroLevelConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { dispatchHeroLevelUp } from './heroLevelUpEvents';
import { isCardMounted } from './mountedCardRegistry';
import { bumpMockLevel } from './heroLevelMock';

/** Command result — `configuredTargets` is always the original `staging.targets` snapshot. */
export interface HeroLevelUpStagingResult {
  accepted: boolean;
  configuredTargets: string[];
  dispatchedTargets: string[];
}

export interface HeroLevelUpStagingDeps {
  /** Canonical roster (`residentsById` from `useRosterKitData`). */
  residentsById: Record<string, ResidentState>;
  /** Test seam — defaults to the module-load parse. */
  config?: HeroLevelConfig | null;
  /** Test seam — defaults to the module-load marker. */
  configInvalid?: boolean;
  /** The `level_up` cue; injected so tests can spy and prod can stay silent. */
  playCue?: () => void;
}

/** Per-session monotonic command counter — feeds `eventId`. */
let commandSeq = 0;

/** Fires the staging beat. See module doc for the three enumerated outcomes. */
export function runHeroLevelUpStaging({
  residentsById,
  config = HERO_LEVEL_CONFIG,
  configInvalid = HERO_LEVEL_CONFIG_INVALID,
  playCue,
}: HeroLevelUpStagingDeps): HeroLevelUpStagingResult {
  const configuredTargets = config?.staging.targets ?? [];

  // REJECT — invalid config or any invalid (non-hero/stale) target. Uniform
  // dev/prod: the roster cross-check runs at command time, never at load.
  if (configInvalid || config === null) {
    return { accepted: false, configuredTargets, dispatchedTargets: [] };
  }
  const allTargetsValid = configuredTargets.every(
    (id) => residentsById[id]?.isHero === true,
  );
  if (!allTargetsValid) {
    return { accepted: false, configuredTargets, dispatchedTargets: [] };
  }

  // Eligibility = roster-valid hero AND card mounted in the rosterV2
  // decorative layer ("on-screen" = mounted, not viewport-visible) AND a
  // configured level to show (a hero with no `levels` entry can't flare).
  const dispatchedTargets = configuredTargets.filter(
    (id) => isCardMounted(id) && typeof config.levels[id] === 'number',
  );

  // REJECT (no-op) — valid config, zero eligible targets.
  if (dispatchedTargets.length === 0) {
    return { accepted: false, configuredTargets, dispatchedTargets: [] };
  }

  // ACCEPT — N visual flares, one telemetry, one audio cue.
  commandSeq += 1;
  dispatchedTargets.forEach((residentId, targetIndex) => {
    dispatchHeroLevelUp({
      type: 'hero_levelup_mock',
      residentId,
      /* T-C1 (R-234): the level really rises — the event carries the NEW level. */
      level: config.levels[residentId] + bumpMockLevel(residentId),
      eventId: `${commandSeq}:${targetIndex}`,
    });
  });
  trackTelemetryEvent('feature_action', {
    action: 'hero_levelup_mock',
    configuredTargets,
    dispatchedTargets,
  });
  playCue?.();

  return { accepted: true, configuredTargets, dispatchedTargets };
}
