import type { StatBlock } from '@/balancing/types';
import type { ResidentStatus, VillageTimeUnit } from '@/engine/game/idleVillage/TimeEngine';
import type { AIBehavior } from '@/engine/idle/types';

/**
 * Shared persistence model for characters created via the Character Manager.
 * Extends combat statistics with Idle Village resident state so both systems
 * read/write the same payload.
 */
export interface SavedCharacter {
  /** Unique identifier (shared with Entity/Resident IDs). */
  id: string;
  /** Display name shown in UIs. */
  name: string;
  /** High-level AI hint used by arena simulations and resident tagging. */
  aiBehavior: AIBehavior;
  /** Full stat block exported from the Balancer modules. */
  statBlock: StatBlock;
  /** IDs of equipped spells (at most four entries, order-preserving). */
  equippedSpellIds: string[];
  /** Current state of the corresponding Idle Village resident. */
  status: ResidentStatus;
  /** Accumulated fatigue recorded by Idle Village ticks. */
  fatigue: number;
  /** Current HP snapshot tracked by Idle Village. */
  currentHp: number;
  /** Maximum HP snapshot (can differ from statBlock.hp after injuries). */
  maxHp: number;
  /** Whether the resident is currently flagged as injured. */
  isInjured: boolean;
  /** Optional recovery timer used by the Idle Village engine. */
  injuryRecoveryTime?: VillageTimeUnit;
  /** Optional stat-profile reference (links to Balancer presets/archetypes). */
  statProfileId?: string;
  /** Cached stat snapshot for assignment UIs (partial StatBlock to avoid recompute). */
  statSnapshot?: Partial<StatBlock>;
  /** Cached stat tags describing the strongest attributes. */
  statTags?: string[];
  /** Whether the resident earned hero status. */
  isHero: boolean;
  /** Survival counter used by Trial of Fire tallies. */
  survivalCount: number;
  /** Aggregate survival score. */
  survivalScore: number;
  /** Last update timestamp (ms) for sync/debugging purposes. */
  lastUpdated?: number;
}
