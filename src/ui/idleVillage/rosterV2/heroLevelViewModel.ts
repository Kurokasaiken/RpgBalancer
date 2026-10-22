/**
 * Hero level view-model (PLAN-032 SP-5, artifact r009).
 *
 * Pure derivation over the canonical resident + the mock config: `level` is
 * `null` unless the resident `isHero` AND `levels[residentId]` exists —
 * gate FIRST, no leak. A non-hero listed in `levels` still yields `null`;
 * a hero without a `levels` entry yields `null`.
 *
 * The mock config marker is honored here too: an invalid/unsalvageable
 * config produces `level: null` for every card, matching the command's
 * reject path (a filtered config can never masquerade as valid).
 *
 * Effect lifecycle (ignition, floater) is owned by presentation components,
 * never by this view-model.
 */

import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { HERO_LEVEL_CONFIG, HERO_LEVEL_CONFIG_INVALID } from '@/balancing/config/idleVillage/heroLevelConfig';
import { getMockLevelBoost } from './heroLevelMock';

/** What the decorative layer needs from a resident: the mock display level, or `null`. */
export interface HeroLevelView {
  level: number | null;
}

/**
 * Derives the level badge value for one roster card. `null` when the
 * resident is not a hero, has no `levels` entry, or the config is
 * invalid/absent — callers render the slot but no badge/ring contents.
 */
export const heroLevelView = (resident: ResidentState | null | undefined): HeroLevelView => {
  if (HERO_LEVEL_CONFIG_INVALID || HERO_LEVEL_CONFIG === null) return { level: null };
  if (resident == null || resident.isHero !== true) return { level: null };
  const level = HERO_LEVEL_CONFIG.levels[resident.id];
  /* T-C1 (R-234): the Director level-up raises the shown level (mock boost, in memory). */
  return { level: typeof level === 'number' ? level + getMockLevelBoost(resident.id) : null };
};
