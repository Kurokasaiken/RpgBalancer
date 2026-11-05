import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

/** Visual state of a roster row (KIT-ROSTER.md § Stati reali del residente). */
export type ZanaraRosterState = 'available' | 'away' | 'exhausted' | 'injured' | 'dead' | 'locked';

/** How a state is shown: castone, label key (null = the normal state says nothing), portrait treatment. */
export interface ZanaraRosterStateView {
  state: ZanaraRosterState;
  gem: 'lit' | 'dim' | 'iron';
  labelKey: string | null;
  portrait: 'normal' | 'veiled' | 'fallen';
  interactive: boolean;
}

const VIEWS: Record<ZanaraRosterState, Omit<ZanaraRosterStateView, 'state'>> = {
  available: { gem: 'lit', labelKey: null, portrait: 'normal', interactive: true },
  away: { gem: 'dim', labelKey: 'gameFrame.roster.zanara.state.away', portrait: 'veiled', interactive: true },
  exhausted: { gem: 'dim', labelKey: 'gameFrame.roster.zanara.state.exhausted', portrait: 'normal', interactive: true },
  injured: { gem: 'dim', labelKey: 'gameFrame.roster.zanara.state.injured', portrait: 'normal', interactive: true },
  dead: { gem: 'iron', labelKey: 'gameFrame.roster.zanara.state.dead', portrait: 'fallen', interactive: false },
  locked: { gem: 'dim', labelKey: null, portrait: 'veiled', interactive: true },
};

/**
 * Resolves the row state with the same precedence as the production roster
 * (`DragTestContainerV2.describeStatus`): locked → injured → dead → exhausted → away.
 */
export function zanaraRosterState(resident: ResidentState, locked: boolean): ZanaraRosterStateView {
  let state: ZanaraRosterState;
  if (locked) state = 'locked';
  else if (resident.isInjured || resident.status === 'injured') state = 'injured';
  else if (resident.status === 'dead') state = 'dead';
  else if (resident.status === 'exhausted') state = 'exhausted';
  else if (resident.status === 'away') state = 'away';
  else state = 'available';
  return { state, ...VIEWS[state] };
}
