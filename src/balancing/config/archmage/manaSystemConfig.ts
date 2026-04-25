import type { STSManaType } from './types';

/**
 * Identifier for stabilization slots. Each slot has its own probability curve.
 */
export type ArcimagoStabilizationSlotId = 'slot-alpha' | 'slot-beta' | 'slot-gamma';

/**
 * Weight configuration for a mana family inside the Arcimago mana deck.
 */
export interface ArcimagoManaDeckFamilyConfig {
  /** Relative likelihood of drawing this mana family. */
  weight: number;
  /** Optional descriptive tags used by UI and telemetry layers. */
  tags?: readonly string[];
}

/**
 * Configuration for a single stabilization slot.
 */
export interface ArcimagoStabilizationSlotConfig {
  /** Stable identifier consumed by UI and telemetry events. */
  id: ArcimagoStabilizationSlotId;
  /** Default chance of success (0-1 range). */
  baseChance: number;
  /** Minimum allowed chance after decay. */
  minChance: number;
  /** Maximum allowed chance after stacking bonuses. */
  maxChance: number;
  /** Chance penalty applied every time the slot succeeds. */
  successDecayPenalty: number;
  /** Chance recovery applied when the slot fails. */
  failureRecoveryBonus: number;
}

/**
 * Top-level configuration schema for the Arcimago mana management system.
 */
export interface ArcimagoManaSystemConfig {
  /** Per-turn guardrails. */
  turnCaps: {
    /** Maximum amount of permanent mana that can be created in a single turn. */
    maxPermanentGainPerTurn: number;
    /** Maximum number of stabilization attempts the player can perform per turn. */
    maxStabilizationAttempts: number;
  };
  /** Stabilization behavior and slot metadata. */
  stabilization: {
    /** Bonus applied per saved mana point (converted to probability before clamping). */
    savingsBonusPerPoint: number;
    /** Maximum probability bonus granted by savings. */
    savingsBonusCap: number;
    /** Slot configuration array. */
    slots: readonly ArcimagoStabilizationSlotConfig[];
  };
  /** Mana deck definition. */
  manaDeck: {
    /** Number of temporary mana tokens generated at baseline each turn. */
    baseDrawPerTurn: number;
    /** Permanent mana regenerated automatically each turn. */
    permanentBaseline: number;
    /** Weight definition per mana family. */
    families: Record<STSManaType, ArcimagoManaDeckFamilyConfig>;
    /** Weight penalty applied to broken mana tokens when they re-enter the deck. */
    brokenPenaltyWeight: number;
  };
}

/**
 * Default Arcimago mana system configuration. Values mirror the prompt guardrails
 * (three slots, max 75% success, max three permanent mana per turn, etc.).
 */
export const ARCIMAGO_MANA_SYSTEM_CONFIG: ArcimagoManaSystemConfig = {
  turnCaps: {
    maxPermanentGainPerTurn: 3,
    maxStabilizationAttempts: 3,
  },
  stabilization: {
    savingsBonusPerPoint: 0.05,
    savingsBonusCap: 0.15,
    slots: [
      {
        id: 'slot-alpha',
        baseChance: 0.55,
        minChance: 0.2,
        maxChance: 0.75,
        successDecayPenalty: 0.1,
        failureRecoveryBonus: 0.05,
      },
      {
        id: 'slot-beta',
        baseChance: 0.35,
        minChance: 0.15,
        maxChance: 0.6,
        successDecayPenalty: 0.08,
        failureRecoveryBonus: 0.06,
      },
      {
        id: 'slot-gamma',
        baseChance: 0.15,
        minChance: 0.05,
        maxChance: 0.45,
        successDecayPenalty: 0.05,
        failureRecoveryBonus: 0.08,
      },
    ],
  },
  manaDeck: {
    baseDrawPerTurn: 2,
    permanentBaseline: 3,
    families: {
      alteration: { weight: 3, tags: ['control'] },
      bio: { weight: 2, tags: ['sustain'] },
      wave: { weight: 2, tags: ['tempo'] },
      entropy: { weight: 1, tags: ['burst'] },
    },
    brokenPenaltyWeight: 0.5,
  },
} as const;
