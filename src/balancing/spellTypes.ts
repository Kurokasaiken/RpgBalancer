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
  /** Success chance of the effect (percentage). 100 = always hits */
  dangerous: number; // 0 – 100
  /** Damage that passes through a successful save (percentage of effect) */
  pierce: number; // 0 – 50 (step 5)
  /** Cast time in seconds */
  castTime: number; // 0.1 – 2.0 (step 0.1)
  /** Cooldown in seconds */
  cooldown: number; // 0 – 5.0 (step 0.5)
  /** Range in game units */
  range: number; // 1 – 10
  /** Initiative priority: negative = early, positive = late */
  priority: number; // -5 … +5
  /** If true, this spell is part of a double‑spell pair */
  doubleSpell: boolean;
  /** Legendary spells have a fixed positive cost and ignore the zero‑cost rule */
  legendary: boolean;
  /** Specific crowd‑control effect when type === 'cc'. */
  ccEffect?: 'stun' | 'slow' | 'knockback' | 'silence';
  /** Damage reflection percentage. */
  reflection?: number; // 0 – 100
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
  /** New optional fields for LoL‑style abilities */
  /** Mana cost of the ability */
  manaCost?: number; // 0 – 200
  /** Duration in seconds (for buffs, shields, DoT, etc.) */
  duration?: number; // >=0
  /** Damage type – influences interaction with resistances */
  damageType?: 'physical' | 'magical' | 'true';
  /** Number of charges (e.g., Flash has 2 charges) */
  charges?: number; // >=1
  /** Channel time in seconds (for channeled abilities) */
  channel?: number; // >=0
  /** Indicates this entry is a passive (no active cast) */
  isPassive?: boolean;
  /** Maximum stack count for a passive or buff */
  maxStacks?: number; // >=1
  /** Arbitrary custom fields for edge‑case data */
  customFields?: Record<string, any>;
  /** Calculated cost (spell level) – should be 0 for normal spells */
  spellLevel: number;
  /** Description of the spell */
  description?: string;
  /** Tags for categorization */
  tags?: string[];
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

/** Factory that returns a spell with all default values (based on base attack) */
export const createEmptySpell = (id: string = crypto.randomUUID()): Spell => ({
  id,
  name: 'New Spell',
  type: 'damage',
  effect: 100,
  scale: 0,
  eco: 1,
  aoe: 1,
  dangerous: 100,
  pierce: 0,
  castTime: 0.5,
  cooldown: 0,
  range: 1,
  priority: 0,
  doubleSpell: false,
  legendary: false,
  // optional new fields default to undefined / empty
  scalingStat: undefined,
  slots: [],
  spellLevel: 0,
  description: '',
  tags: [],
});
