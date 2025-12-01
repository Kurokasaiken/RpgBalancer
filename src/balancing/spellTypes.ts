// Spell / Skill type definitions

export type SpellType = 'damage' | 'heal' | 'shield' | 'buff' | 'debuff' | 'cc';

/**
 * Represents a single spell/skill that can be created by the user.
 * All numeric fields are expressed as percentages or counts as described in the design doc.
 */
export interface Spell {
  /** Unique identifier (generated when saved) */
  id: string;
  /** Human readable name */
  name: string;
  /** Category of the spell */
  type: SpellType;
  /** Base effect percentage (100% = base attack damage) */
  effect: number; // 10 – 300 (step 10)
  /** Scale modifier – can be negative */
  scale: number; // -10 … +10
  /** Number of rounds the effect repeats (DOT/HoT) */
  eco: number; // >=1
  /** Number of targets hit (AoE) */
  aoe: number; // >=1
  /** Hit chance modifier (renamed from dangerous) */
  precision: number; // -50 – 50
  /** Damage on miss/save (renamed from pierce) */
  dangerous: number; // 0 – 50 (step 5)
  /** Cooldown in seconds */
  cooldown: number; // 0 – 5.0 (step 0.5)
  /** Range in game units */
  range: number; // 1 – 10
  /** Initiative priority: negative = early, positive = late */
  priority: number; // -5 … +5
  /** Specific crowd‑control effect when type === 'cc'. */
  ccEffect?: 'stun' | 'slow' | 'knockback' | 'silence';
  evasion?: number;
  agility?: number;
  critChance?: number;
  critMult?: number;
  lifesteal?: number;
  regen?: number;
  /** Duration of the effect in rounds (for buffs/debuffs) */
  duration?: number;
  /** Stat modifications for buffs/debuffs */
  statModifications?: Record<string, number>;

  // ========== PHASE 9: MULTI-UNIT COMBAT ==========
  aoeShape?: 'circle' | 'cone' | 'line' | null; // AoE type
  aoeRadius?: number; // For circle (tiles), for cone/line (length)
  friendlyFire?: boolean; // If true, can damage allies

  /** Situational modifiers – array of condition/adjustment objects */
  situationalModifiers?: Array<{
    /** Human readable description, e.g. "Target below 25% HP" */
    condition: string;
    /** Adjustment in % (positive = stronger, negative = weaker) */
    adjustment: number;
  }>;
  /** Which base stat the spell scales on */
  scalingStat?: 'attack' | 'magic' | 'health' | 'mana' | 'defense';
  /** Customizable slots (gem‑like) */
  slots?: Slot[];
  /** Mana cost of the ability */
  manaCost?: number; // 0 – 200
  /** Damage type – influences interaction with resistances */
  damageType?: 'physical' | 'magical' | 'true';
  /** Indicates this entry is a passive (no active cast) */
  isPassive?: boolean;
  /** Arbitrary custom fields for edge‑case data */
  customFields?: Record<string, any>;
  /** Calculated cost (spell level) – should be 0 for normal spells */
  spellLevel: number;
  /** Description of the spell */
  description?: string;
  /** Tags for categorization */
  tags?: string[];
  /** Target stat for buff/debuff spells */
  targetStat?: string;
}

/** Definition of a customizable slot (gem‑like) */
export interface Slot {
  /** Unique id for the slot */
  id: string;
  /** Which tag is placed in this slot */
  tag: TagOption;
  /** Optional numeric value for the tag (e.g., % increase) */
  value?: number;
}

/** Enumerated tag options that can be placed in slots */
export type TagOption =
  | 'damageBoost'      // +% damage
  | 'cooldownReduction' // -% cooldown
  | 'castTimeReduction' // -% cast time
  | 'rangeIncrease'     // +% range
  | 'aoeIncrease'       // +% AoE targets
  | 'pierceIncrease'    // +% pierce
  | 'dangerousIncrease' // +% success chance
  | 'lifeSteal'         // % of damage returned as heal
  | 'manaCostReduction'; // -% mana cost

/** Factory that returns a spell with all default values (zero-cost baseline) */
export const createEmptySpell = (id: string = crypto.randomUUID()): Spell => ({
  id,
  name: 'New Spell',
  type: 'damage',
  effect: 0,          // baseline = 0
  scale: 0,           // baseline = 0
  eco: 0,             // baseline = 0
  aoe: 0,             // baseline = 0
  precision: 0,       // baseline = 0 (renamed from dangerous)
  dangerous: 0,       // baseline = 0 (renamed from pierce)
  cooldown: 0,        // baseline = 0
  range: 0,           // baseline = 0
  priority: 0,        // baseline = 0
  // Phase 9: Multi-Unit
  aoeShape: null,
  aoeRadius: undefined,
  friendlyFire: false,
  manaCost: 0,        // baseline = 0
  scalingStat: undefined,
  slots: [],
  spellLevel: 0,
  description: '',
  tags: [],
  targetStat: 'damage', // baseline = no modifications
});
