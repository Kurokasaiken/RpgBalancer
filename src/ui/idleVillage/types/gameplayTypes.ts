/**
 * Gameplay Type Definitions
 *
 * Shared interfaces for Minimal Gameplay Page state.
 */

import type { VillageEvent } from '@/engine/game/idleVillage/TimeEngine';
import type { GameOverState } from '@/balancing/config/idleVillage/types/survivalTypes';
import type { LocationDropState } from '../map/validators/locationDropValidators';

export interface MinimalResident {
  id: string;
  name: string;
  stats: Record<string, number>;
  fatigue: number;
  isWorking: boolean;
  isInjured: boolean;
  isHero: boolean;
  level: number;
  /** Quest settlement (PLAN-019-S2.5): terminal death — data, not a flag on
   *  the run. Overrides every other status; the wound fields are cleared. */
  isDead?: boolean;
  /** Tick at which a settlement-inflicted wound heals (`tick` clears
   *  `isInjured` when reached). Undefined = legacy/self-managed injury. */
  injuredUntilTick?: number;
}

export type LocationStateMap = Record<string, LocationDropState>;

export interface GameplayViewState {
  gold: number;
  food: number;
  maxFood: number;
  warningLevel: 'safe' | 'low' | 'critical';
  daysRemaining: number;
  currentDay: number;
  residents: MinimalResident[];
  activeQuests: string[];
  isPaused: boolean;
  speedMultiplier: number;
  eventLog: VillageEvent[];
  locationStates: LocationStateMap;
  gameOver: GameOverState;
}

export interface GameplayActions {
  buyFood: (quantity: number) => void;
  startQuest: (questId: string, residentIds: string[]) => void;
  assignWork: (residentId: string, locationId: string) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setSpeed: (multiplier: number) => void;
  resetGame: () => void;
}
