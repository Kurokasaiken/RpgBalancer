import type { ScenarioType, ScenarioConfig } from '../contextWeights';

export type EliteScenarioId =
  | 'elite_high_armor'
  | 'elite_evasion_boss'
  | 'elite_swarm_5v20'
  | 'elite_burst_race'
  | 'elite_healing_boss';

export interface EliteScenario {
  id: EliteScenarioId;
  name: string;
  description: string;
  baseScenarioType: ScenarioType;
  scenarioOverrides?: Partial<Pick<ScenarioConfig,
    'expectedTurns' | 'enemyCount' | 'enemyAvgHP' | 'statEffectiveness'>>;
  tags: string[];
}

export const ELITE_SCENARIOS: Record<EliteScenarioId, EliteScenario> = {
  elite_high_armor: {
    id: 'elite_high_armor',
    name: 'Elite: High Armor Wall',
    description:
      'Nemico singolo con armatura estremamente alta: premia penetrazione e %pen, penalizza puro damage.',
    baseScenarioType: 'duel_1v1',
    scenarioOverrides: {
      expectedTurns: 10,
      enemyCount: 1,
      enemyAvgHP: 400,
      statEffectiveness: {
        armorPen: 2.0,
        penPercent: 2.5,
        damage: 0.7,
        lifesteal: 1.1,
      },
    },
    tags: ['elite', 'high_armor', 'check_penetration'],
  },

  elite_evasion_boss: {
    id: 'elite_evasion_boss',
    name: 'Elite: Evasion Boss',
    description:
      'Boss singolo con evasione altissima: valorizza TxC e consistenza, punisce i build a colpi rari.',
    baseScenarioType: 'boss_1v1_long',
    scenarioOverrides: {
      expectedTurns: 20,
      enemyCount: 1,
      enemyAvgHP: 1600,
      statEffectiveness: {
        txc: 2.2,
        evasion: 1.2,
        critChance: 0.8,
      },
    },
    tags: ['elite', 'evasion', 'accuracy_check'],
  },

  elite_swarm_5v20: {
    id: 'elite_swarm_5v20',
    name: 'Elite: Swarm 5v20',
    description:
      'Scenario a sciame estremo: molti nemici a bassa vita, AoE e controllo sono fondamentali.',
    baseScenarioType: 'swarm_1vMany',
    scenarioOverrides: {
      expectedTurns: 5,
      enemyCount: 20,
      enemyAvgHP: 25,
      statEffectiveness: {
        damage: 0.5,
        lifesteal: 1.8,
        regen: 0.4,
        armor: 0.8,
      },
    },
    tags: ['elite', 'swarm', 'aoe_check'],
  },

  elite_burst_race: {
    id: 'elite_burst_race',
    name: 'Elite: Burst Race',
    description:
      'Corsa al burst nei primi turni: vince chi chunk-a più in fretta prima che il sustain entri in gioco.',
    baseScenarioType: 'duel_1v1',
    scenarioOverrides: {
      expectedTurns: 4,
      enemyCount: 1,
      enemyAvgHP: 120,
      statEffectiveness: {
        damage: 1.6,
        critChance: 1.5,
        critMult: 1.5,
        lifesteal: 0.6,
        regen: 0.3,
      },
    },
    tags: ['elite', 'burst', 'early_game'],
  },

  elite_healing_boss: {
    id: 'elite_healing_boss',
    name: 'Elite: Healing Boss',
    description:
      'Boss con forte rigenerazione/passive healing: richiede DPS sostenuto e anti-heal.',
    baseScenarioType: 'boss_1v1_long',
    scenarioOverrides: {
      expectedTurns: 30,
      enemyCount: 1,
      enemyAvgHP: 2200,
      statEffectiveness: {
        damage: 1.4,
        lifesteal: 1.2,
        regen: 0.4,
        penPercent: 1.6,
      },
    },
    tags: ['elite', 'healing', 'dps_check'],
  },
};
