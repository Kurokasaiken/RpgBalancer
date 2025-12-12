// src/balancing/config/idleVillage/defaultConfig.ts
// Minimal default IdleVillageConfig. Intentionally almost empty so that
// all domain content is authored via config/UI rather than hardcoded here.

import type { IdleVillageConfig } from './types';

export const DEFAULT_IDLE_VILLAGE_CONFIG: IdleVillageConfig = {
  version: '1.0.0',

  // Core economic resources for the village meta-game. All values are editable
  // from the Idle Village config UI; these are just safe starting presets for
  // the first playable scenario.
  resources: {
    gold: {
      id: 'gold',
      label: 'Gold',
      description: 'Coins used for wages, equipment and basic upgrades.',
      icon: '◆',
      colorClass: 'text-amber-300',
      isCore: true,
    },
    food: {
      id: 'food',
      label: 'Food',
      description: 'Daily upkeep for all residents in the village.',
      icon: '♨',
      colorClass: 'text-emerald-300',
      isCore: true,
    },
    materials: {
      id: 'materials',
      label: 'Materials',
      description: 'Abstract building materials for construction and upgrades.',
      icon: '⬤',
      colorClass: 'text-slate-200',
      isCore: true,
    },
    xp: {
      id: 'xp',
      label: 'XP',
      description: 'Experience gained from combat and risky jobs.',
      icon: '✦',
      colorClass: 'text-violet-300',
      isCore: true,
    },
  },

  // Minimal starting activities: core jobs + an early quest to exercise
  // the time, job, quest and injury engines.
  activities: {
    job_city_rats: {
      id: 'job_city_rats',
      label: 'Clear Rats in City',
      description: 'Hunt rats in the city sewers for a small but steady income.',
      tags: ['job', 'combat', 'city'],
      slotTags: ['village', 'job_site'],
      resolutionEngineId: 'job',
      level: 1,
      dangerRating: 1,
      durationFormula: '1',
      // Simple deterministic rewards; fully configurable from the Activities tab.
      rewards: [
        { resourceId: 'gold', amountFormula: '5' },
        { resourceId: 'xp', amountFormula: '2' },
      ],
      metadata: {
        // Allow this job to auto-repeat in the main Idle Village UI.
        supportsAutoRepeat: true,
        // Default map slot; still overridable via Activities/Map config.
        mapSlotId: 'village_square',
        // Mark this as a continuous job: while assigned, it pays out once per time segment.
        continuousJob: true,
      },
    },
    job_explore_outskirts: {
      id: 'job_explore_outskirts',
      label: 'Explore the Outskirts',
      description: 'Scout the outskirts for threats and opportunities.',
      tags: ['job', 'explore'],
      slotTags: ['world', 'job_site'],
      resolutionEngineId: 'job',
      level: 1,
      dangerRating: 2,
      durationFormula: '5',
      rewards: [
        { resourceId: 'xp', amountFormula: '3' },
        { resourceId: 'materials', amountFormula: '1' },
      ],
      metadata: {
        supportsAutoRepeat: false,
        mapSlotId: 'village_gate',
      },
    },
    job_training_basics: {
      id: 'job_training_basics',
      label: 'Basic Training',
      description: 'Light drills and exercises to improve fundamentals.',
      tags: ['job', 'training'],
      slotTags: ['village', 'job_site'],
      resolutionEngineId: 'job',
      level: 1,
      dangerRating: 0,
      durationFormula: '2',
      rewards: [
        { resourceId: 'xp', amountFormula: '4' },
      ],
      metadata: {
        supportsAutoRepeat: true,
        mapSlotId: 'village_square',
        trainingProgramId: 'basic_combat',
      },
    },
    quest_city_rats: {
      id: 'quest_city_rats',
      label: 'Cull Rats in Sewers',
      description: 'A riskier extermination quest in the city sewers: better XP, but chance of injury.',
      tags: ['quest', 'combat', 'city'],
      slotTags: ['city', 'job_site'],
      resolutionEngineId: 'quest_combat',
      level: 1,
      dangerRating: 2,
      durationFormula: '3',
      // Quest rewards are explicit XP resource; QuestResolver also reports xpAwarded.
      rewards: [
        { resourceId: 'xp', amountFormula: '6' },
      ],
      metadata: {
        mapSlotId: 'village_square',
        verbToneId: 'danger',
        // Enable quest spawning for the vertical slice.
        questSpawnEnabled: true,
        questSpawnWeight: 3,
        questMinDay: 1,
        questMaxConcurrent: 2,
        questAllowedSlotTags: ['city'],
        // UI-only display hints for FTUE: not used by engines yet.
        injuryChanceDisplay: 35,
        deathChanceDisplay: 5,
      },
    },
    job_visit_market: {
      id: 'job_visit_market',
      label: 'Visit Market',
      description: 'Spend some time at the market to open trading opportunities.',
      tags: ['job', 'market'],
      slotTags: ['village', 'job_site', 'shop'],
      resolutionEngineId: 'job',
      level: 1,
      dangerRating: 0,
      durationFormula: '1',
      // No direct rewards; buying food is handled by the Market UI using
      // baseFoodPriceInGold from globalRules.
      rewards: [],
      metadata: {
        mapSlotId: 'village_market',
        marketJob: true,
      },
    },
  },

  // Simple logical map layout with two generic slots: one inside the village
  // and one just outside the walls. Coordinates are purely logical and the UI
  // is responsible for normalising them.
  mapSlots: {
    village_square: {
      id: 'village_square',
      label: 'Village Square',
      description: 'Central hub for simple city jobs.',
      x: 0,
      y: 0,
      slotTags: ['village', 'job_site', 'city'],
      isInitiallyUnlocked: true,
      icon: '★',
      colorClass: 'text-amber-200',
    },
    village_gate: {
      id: 'village_gate',
      label: 'Village Gate',
      description: 'Edge of the village, entry point to the outskirts.',
      x: 8,
      y: 3,
      slotTags: ['world', 'job_site'],
      isInitiallyUnlocked: true,
      icon: '\u21E8',
      colorClass: 'text-sky-200',
    },
    village_market: {
      id: 'village_market',
      label: 'Market',
      description: 'A small trading stall inside the village walls.',
      x: 4,
      y: 1,
      slotTags: ['village', 'job_site', 'shop'],
      isInitiallyUnlocked: true,
      icon: '\u25CE',
      colorClass: 'text-emerald-200',
    },
  },

  // Starting buildings are currently informational; future engines can read
  // their bonuses. They are still fully editable from the Buildings tab.
  buildings: {
    founder_house: {
      id: 'founder_house',
      label: "Founder’s House",
      description: 'Basic housing for the founder and first residents.',
      tags: ['house', 'village'],
      isInitiallyBuilt: true,
    },
    city_sewers: {
      id: 'city_sewers',
      label: 'City Sewers',
      description: 'Access point to the rat-infested sewers beneath the village.',
      tags: ['job_site', 'combat', 'village'],
      isInitiallyBuilt: true,
    },
    village_wall_gate: {
      id: 'village_wall_gate',
      label: 'Village Gate',
      description: 'Where residents leave the safety of the walls to explore.',
      tags: ['job_site', 'world'],
      isInitiallyBuilt: true,
    },
    village_market: {
      id: 'village_market',
      label: 'Village Market',
      description: 'Basic trading post used to buy food and goods.',
      tags: ['shop', 'village'],
      isInitiallyBuilt: true,
      level: 1,
      maxLevel: 3,
      upgrades: [
        {
          level: 2,
          costs: {
            gold: 50,
            materials: 5,
          },
          notes: 'Unlocks better stall space and more efficient trading.',
        },
        {
          level: 3,
          costs: {
            gold: 120,
            materials: 15,
          },
          notes: 'Full market square with multiple stalls and improved prices.',
        },
      ],
    },
  },

  // Founder presets are intentionally left empty for now; a future step will
  // wire these to ArchetypeRegistry / character creator presets.
  founders: {},

  // Neutral variance config so that QuestResolver can opt into categories
  // later without forcing any randomness on the first jobs.
  variance: {
    difficultyCategories: {
      normal: {
        id: 'normal',
        label: 'Normal Difficulty',
        minMultiplier: 1,
        maxMultiplier: 1,
        weight: 1,
      },
    },
    rewardCategories: {
      normal: {
        id: 'normal',
        label: 'Normal Reward',
        minMultiplier: 1,
        maxMultiplier: 1,
        weight: 1,
      },
    },
  },

  globalRules: {
    // These numbers are safe placeholders and should be tuned via config/UI.
    maxFatigueBeforeExhausted: 100,
    fatigueRecoveryPerDay: 50,
    dayLengthInTimeUnits: 5,
    fatigueYellowThreshold: 33,
    fatigueRedThreshold: 66,
    baseLightInjuryChanceAtMaxFatigue: 0.3,
    dangerInjuryMultiplierPerPoint: 0.1,
    foodConsumptionPerResidentPerDay: 1,
    baseFoodPriceInGold: 25,
    startingResources: {
      gold: 0,
      food: 2,
    },
    // Simple base formula, expected to be overridden from the config UI.
    questXpFormula: 'level * 10',
    maxActiveQuests: 5,
    // Minimal quest spawning defaults for the vertical slice.
    // One spawn check per day, up to a small number of offers.
    questSpawnEveryNDays: 1,
    maxGlobalQuestOffers: 4,
    maxQuestOffersPerSlot: 2,
    verbToneColors: {
      neutral: '#94A3B8',
      job: '#3B82F6',
      quest: '#34D399',
      danger: '#F87171',
      system: '#38BDF8',
    },
  },
};
