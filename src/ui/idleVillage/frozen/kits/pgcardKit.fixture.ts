/**
 * pgcardKit.fixture
 *
 * Re-exports of canonical data sources used by PgCard.
 * NEVER define inline mock data here — go through CanonicalDataBridge.
 */

export { MINIMAL_GAMEPLAY_RESIDENTS as pgcardFixtureResidents } from '@/balancing/config/idleVillage/minimalGameplayConfig';
export { TEST_ROSTER_HEROES as pgcardFixtureHeroes } from '@/balancing/config/idleVillage/testRosterResidents';
export type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
