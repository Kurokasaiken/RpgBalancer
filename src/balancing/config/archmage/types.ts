/**
 * Mana families available to the STS-like numeric simulator.
 */
export type STSManaType = 'alteration' | 'bio' | 'wave' | 'entropy';

/**
 * Supported effect archetypes for spell cards.
 */
export type SpellCardEffectType = 'attack' | 'block' | 'draw' | 'inspiration' | 'status';

/**
 * Optional status modifiers applied by spells or intents.
 */
export type STSStatusEffect = 'poison' | 'weaken' | 'fortify';

export interface SpellCardEffect {
  type: SpellCardEffectType;
  value: number;
  statusEffect?: STSStatusEffect;
  /**
   * When true the effect scales using Inspiration stacks rather than flat value.
   */
  inspirationScaling?: boolean;
}

export interface SpellCardConfig {
  id: string;
  name: string;
  summary: string;
  description?: string;
  manaCost: Partial<Record<STSManaType, number>>;
  effect: SpellCardEffect;
  rebellionTimer: number;
  tags?: string[];
}

export interface STSDeckPreset {
  id: string;
  label: string;
  handSize: number;
  drawPerTurn: number;
  cards: SpellCardConfig[];
  basePlayerHp: number;
  baseEnemyHp: number;
  /**
   * Optional turn limit used for pacing analysis.
   */
  maxTurns?: number;
  /**
   * Resonance regeneration per turn for each mana family.
   */
  manaGrowth: Partial<Record<STSManaType, number>>;
  inspirationPerTurn: number;
  inspirationDecay: number;
}

export type EnemyIntentType = 'attack' | 'block' | 'buff' | 'special';

export type STSIntentSeverity = 'info' | 'warning' | 'lethal';

export interface EnemyIntentAction {
  id: string;
  label: string;
  type: EnemyIntentType;
  weight: number;
  baselineValue: number;
  variance: number;
  statusEffect?: STSStatusEffect;
  severity?: STSIntentSeverity;
}

export interface EnemyReactiveModifier {
  condition: 'playerLowHp' | 'enemyLowHp';
  threshold: number;
  type: 'multiply';
  targetIntentId: string;
  factor: number;
}

export interface EnemyIntentProfile {
  id: string;
  label: string;
  maxHp: number;
  intents: EnemyIntentAction[];
  reactiveModifiers?: EnemyReactiveModifier[];
  pacingCaps?: {
    minTurns?: number;
    maxTurns?: number;
  };
}

export interface STSInputBinding {
  key: string;
  action: 'play_card' | 'end_turn' | 'reset' | 'cancel';
  value?: string;
}

export interface STSInputSchema {
  bindings: STSInputBinding[];
}

export type ReadonlyDeckMap = Readonly<Record<string, STSDeckPreset>>;
export type ReadonlyEnemyMap = Readonly<Record<string, EnemyIntentProfile>>;
