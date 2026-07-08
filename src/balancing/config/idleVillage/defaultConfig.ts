// src/balancing/config/idleVillage/defaultConfig.ts
// Minimal default IdleVillageConfig. Intentionally almost empty so that
// all domain content is authored via config/UI rather than hardcoded here.

import type { IdleVillageConfig } from './types';
import { DEFAULT_QUEST_TYPES } from './questTypeDefaults';
import { DEFAULT_PASSIVE_EFFECTS } from './passiveEffects';
import { defaultQuestBlueprints } from './quests/questBlueprints';

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
    wood: {
      id: 'wood',
      label: 'Wood',
      description: 'Timber harvested from forests, used for construction and fuel.',
      icon: '🪵',
      colorClass: 'text-amber-700',
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
    ember_sigils: {
      id: 'ember_sigils',
      label: 'Ember Sigils',
      description: 'Seared currency granted to residents who survive Trial of Fire assignments.',
      icon: '🔥',
      colorClass: 'text-amber-300',
    },
    radiant_ore: {
      id: 'radiant_ore',
      label: 'Radiant Ore',
      description: 'Luminous ore harvested from stabilized storm nodes.',
      icon: '💎',
      colorClass: 'text-sky-300',
    },
    ashen_favor: {
      id: 'ashen_favor',
      label: 'Ashen Favor',
      description: 'Political weight issued by the Silent Order for perfect upkeep.',
      icon: '🕯️',
      colorClass: 'text-rose-200',
    },
    chronicle_shards: {
      id: 'chronicle_shards',
      label: 'Chronicle Shards',
      description: 'Encoded battle reports, used to unlock high-tier tactics.',
      icon: '📜',
      colorClass: 'text-emerald-200',
    },
  },

  questTypes: DEFAULT_QUEST_TYPES,

  // Minimal starting activities: core jobs + an early quest to exercise
  // the time, job, quest and injury engines.
  activities: {
    // TEST RACK — drives /minimal-roster-slot-integration (L2 Roster + SlotRack).
    // One open slot + one HP>200 slot, infinite virtual slots beyond those.
    slot_rack_lab: {
      id: 'slot_rack_lab',
      label: 'Slot Rack Lab',
      description: 'Rack di test: slot aperto + slot HP > 200, slot infiniti.',
      tags: ['job', 'test', 'slot_lab'],
      slotTags: ['test_rack'],
      resolutionEngineId: 'slot-lab-harness',
      durationFormula: '60',
      maxSlots: 'infinite',
      metadata: {
        slotBlueprints: [
          {
            id: 'rack-slot-open',
            label: 'Slot Aperto',
            requirementLabel: 'Qualsiasi',
          },
          {
            id: 'rack-slot-hp200',
            label: 'Slot HP > 200',
            requirement: {
              label: 'HP > 200',
              allOf: [{ stat: 'hp', operator: '>', value: 200 }],
            },
            requirementLabel: 'HP > 200',
          },
        ],
      },
    },
    // STABLE JOBS - Low risk, repeatable, consistent rewards
    job_wood_gathering_stable: {
      id: 'job_wood_gathering_stable',
      label: 'Wood Gathering',
      description: 'Collect wood from nearby forest. Stable, low-risk work.',
      tags: ['job', 'stable', 'economy'],
      slotTags: ['village', 'job_site'],
      resolutionEngineId: 'job',
      level: 1,
      dangerRating: 1,
      durationFormula: '4000', // 4 seconds
      rewards: [
        { resourceId: 'wood', amountFormula: '2' },
        { resourceId: 'xp', amountFormula: '1' },
      ],
      statRequirement: {
        allOf: ['strength'],
        anyOf: ['endurance'],
      },
      maxSlots: 'infinite',
      metadata: {
        cardKind: 'job' as const,
        jobType: 'stable',
        riskLevel: 'low',
        repeatable: true,
        autoRepeatEnabled: true,
        mapSlotId: 'wood_gathering_slot',
      },
    },
    job_city_rats: {
      id: 'job_city_rats',
      label: 'Clear Rats in City',
      description: 'Hunt rats in the city sewers for a small but steady income.',
      tags: ['job', 'combat', 'city'],
      cardKind: 'job',
      slotTags: ['village', 'job_site'],
      resolutionEngineId: 'job',
      level: 1,
      dangerRating: 1,
      durationFormula: '1',
      maxSlots: 'infinite',
      supportsPartialResolution: true,
      continuousJob: true,
      supportsAutoRepeat: true,
      dailyFatigueCost: 100,
      dailyRewardProfile: [
        { resourceId: 'gold', amountPerDay: 5 },
        { resourceId: 'xp', amountPerDay: 2 },
      ],
      statRequirement: {
        label: 'Discipline + (Edge | Lantern)',
        allOf: ['discipline'],
        anyOf: ['edge', 'lantern'],
      },
      // Simple deterministic rewards; fully configurable from the Activities tab.
      rewards: [
        { resourceId: 'gold', amountFormula: '5' },
        { resourceId: 'xp', amountFormula: '2' },
      ],
      metadata: {
        // Allow this job to auto-repeat in the main Idle Village UI.
        // Default map slot; still overridable via Activities/Map config.
        mapSlotId: 'village_square',
      },
    },
    job_explore_outskirts: {
      id: 'job_explore_outskirts',
      label: 'Explore the Outskirts',
      description: 'Scout the outskirts for threats and opportunities.',
      tags: ['job', 'explore'],
      cardKind: 'job',
      slotTags: ['world', 'job_site'],
      resolutionEngineId: 'job',
      level: 1,
      dangerRating: 2,
      durationFormula: '5',
      maxSlots: 'infinite',
      statRequirement: {
        label: 'Lantern Tracker',
        allOf: ['lantern'],
        noneOf: ['frailty'],
      },
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
      cardKind: 'training',
      slotTags: ['village', 'job_site'],
      resolutionEngineId: 'job',
      level: 1,
      dangerRating: 0,
      durationFormula: '2',
      maxSlots: 'infinite',
      statRequirement: {
        label: 'Reason Focus',
        allOf: ['reason'],
      },
      rewards: [
        { resourceId: 'xp', amountFormula: '4' },
      ],
      metadata: {
        supportsAutoRepeat: true,
        mapSlotId: 'village_square',
        trainingProgramId: 'basic_combat',
      },
    },
    // REPEATABLE QUESTS - Always available, moderate risk, consistent gold rewards
    quest_gold_repeatable: {
      id: 'quest_gold_repeatable',
      label: 'Repeatable Gold Quest',
      description: 'Always available quest for steady gold income with moderate risk.',
      tags: ['quest', 'repeatable', 'gold'],
      cardKind: 'quest',
      slotTags: ['village', 'quest_board'],
      resolutionEngineId: 'quest_combat',
      level: 1,
      dangerRating: 2,
      durationFormula: '6000', // 6 seconds
      maxSlots: 'infinite',
      statRequirement: {
        label: 'Basic Skills',
        allOf: ['intelligence'],
        anyOf: ['perception', 'agility'],
      },
      rewards: [
        { resourceId: 'gold', amountFormula: '8' },
        { resourceId: 'xp', amountFormula: '3' },
      ],
      metadata: {
        questSpawnEnabled: true,
        questSpawnWeight: 5, // High spawn weight for availability
        questMinDay: 1,
        questMaxConcurrent: 3, // Allow multiple concurrent
        mapSlotId: 'repeatable_quest_slot',
        repeatable: true,
        autoRepeatEnabled: false, // Manual repeat only
      },
    },
    // DANGEROUS QUESTS - High risk, high reward, low success rate
    quest_dangerous_hunt: {
      id: 'quest_dangerous_hunt',
      label: 'Dangerous Hunt',
      description: 'High-risk quest with substantial rewards but low success probability.',
      tags: ['quest', 'danger', 'high-risk'],
      cardKind: 'quest',
      slotTags: ['world', 'danger_zone'],
      resolutionEngineId: 'quest_combat',
      level: 2,
      dangerRating: 4, // High danger rating
      durationFormula: '8000', // 8 seconds
      maxSlots: 1, // Only one at a time
      statRequirement: {
        label: 'Elite Hunter',
        allOf: ['strength'],
        anyOf: ['agility', 'perception'],
      },
      rewards: [
        { resourceId: 'gold', amountFormula: '15' },
        { resourceId: 'xp', amountFormula: '8' },
      ],
      metadata: {
        questSpawnEnabled: true,
        questSpawnWeight: 2, // Low spawn weight
        questMinDay: 2,
        questMaxConcurrent: 1, // Only one dangerous quest at a time
        mapSlotId: 'dangerous_quest_slot',
        repeatable: false,
        highRisk: true,
        injuryChanceDisplay: 25, // 25% injury chance display
        deathChanceDisplay: 8, // 8% death chance display
      },
    },
    quest_city_rats: {
      id: 'quest_city_rats',
      label: 'Cull Rats in Sewers',
      description: 'A riskier extermination quest in the city sewers: better XP, but chance of injury.',
      tags: ['quest', 'combat', 'city'],
      cardKind: 'quest',
      slotTags: ['city', 'job_site'],
      resolutionEngineId: 'quest_combat',
      level: 1,
      dangerRating: 2,
      durationFormula: '3',
      maxSlots: 'infinite',
      statRequirement: {
        label: 'Edge Veteran',
        allOf: ['edge'],
        anyOf: ['discipline', 'moth'],
      },
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
      cardKind: 'job',
      slotTags: ['village', 'job_site', 'shop'],
      resolutionEngineId: 'job',
      level: 1,
      dangerRating: 0,
      durationFormula: '1',
      maxSlots: 'infinite',
      statRequirement: {
        label: 'Lantern or Reason',
        anyOf: ['lantern', 'reason'],
      },
      // No direct rewards; buying food is handled by the Market UI using
      // baseFoodPriceInGold from globalRules.
      rewards: [],
      metadata: {
        mapSlotId: 'village_market',
        marketJob: true,
      },
    },
    job_chop_wood: {
      id: 'job_chop_wood',
      label: 'Chop Wood',
      description: 'Harvest timber from the forest. Output scales with worker strength and diminishing returns apply.',
      tags: ['job', 'production', 'woodcutting'],
      cardKind: 'job',
      slotTags: ['village', 'job_site', 'production'],
      resolutionEngineId: 'job',
      level: 1,
      dangerRating: 0,
      durationFormula: '1',
      maxSlots: 'infinite',
      supportsPartialResolution: true,
      continuousJob: true,
      supportsAutoRepeat: true,
      dailyFatigueCost: 80,
      dailyRewardProfile: [
        { resourceId: 'wood', amountPerDay: 3 },
      ],
      statRequirement: {
        label: 'Edge (Strength)',
        anyOf: ['edge'],
      },
      rewards: [
        { resourceId: 'wood', amountFormula: '3' },
      ],
      metadata: {
        mapSlotId: 'village_gate',
        supportsAutoRepeat: true,
        icon: '🪵',
        productionJob: true,
        baseProduction: 3,
        scalingStatTag: 'edge',
      },
    },
    job_custode_sigilli: {
      id: 'job_custode_sigilli',
      label: 'Custode dei Sigilli di Grano',
      description: 'Rafforza i filamenti runici dei silo che alimentano il Trial of Fire.',
      tags: ['job', 'logistics'],
      cardKind: 'maintenance',
      slotTags: ['village', 'job_site'],
      resolutionEngineId: 'job',
      level: 2,
      dangerRating: 1,
      durationFormula: '3',
      maxSlots: 2,
      slotModifiers: {
        0: { yieldMult: 1 },
        1: { yieldMult: 1.15, fatigueMult: 1.05 },
      },
      statRequirement: {
        label: 'Discipline & Lantern',
        allOf: ['discipline'],
        anyOf: ['lantern'],
      },
      rewards: [
        { resourceId: 'ember_sigils', amountFormula: '3' },
        { resourceId: 'ashen_favor', amountFormula: '1' },
      ],
      metadata: {
        supportsAutoRepeat: true,
        mapSlotId: 'village_square',
        icon: '🌾',
        injuryChanceDisplay: 6,
        deathChanceDisplay: 2,
      },
    },
    job_idromante_cisterne: {
      id: 'job_idromante_cisterne',
      label: 'Idromante delle Cisterne',
      description: 'Mantieni il flusso delle cisterne cristalline con canti idromantici.',
      tags: ['job', 'support'],
      cardKind: 'maintenance',
      slotTags: ['village', 'job_site'],
      resolutionEngineId: 'job',
      level: 2,
      dangerRating: 1,
      durationFormula: '2',
      statRequirement: {
        label: 'Lantern Cantor',
        allOf: ['lantern'],
        noneOf: ['frailty'],
      },
      rewards: [
        { resourceId: 'ember_sigils', amountFormula: '2' },
        { resourceId: 'chronicle_shards', amountFormula: '1' },
      ],
      metadata: {
        supportsAutoRepeat: true,
        mapSlotId: 'village_square',
        icon: '💧',
        maxCrewSize: 1,
        injuryChanceDisplay: 4,
        deathChanceDisplay: 1,
      },
    },
    job_cartografo_lucciole: {
      id: 'job_cartografo_lucciole',
      label: 'Cartografo delle Lucciole',
      description: 'Segui le lucciole eteree e aggiorna le mappe dei corridoi sicuri.',
      tags: ['job', 'scouting'],
      cardKind: 'job',
      slotTags: ['village', 'job_site'],
      resolutionEngineId: 'job',
      level: 2,
      dangerRating: 1,
      durationFormula: '4',
      statRequirement: {
        label: 'Lantern Tracker',
        allOf: ['lantern'],
        anyOf: ['moth'],
      },
      rewards: [
        { resourceId: 'ember_sigils', amountFormula: '2' },
        { resourceId: 'radiant_ore', amountFormula: '1' },
      ],
      metadata: {
        supportsAutoRepeat: false,
        mapSlotId: 'village_gate',
        icon: '🕯',
        maxCrewSize: 1,
        injuryChanceDisplay: 5,
        deathChanceDisplay: 2,
      },
    },
    job_sentinella_vetro_aurico: {
      id: 'job_sentinella_vetro_aurico',
      label: 'Sentinella del Vetro Aurico',
      description: 'Pattuglia il bastione di vetro aurico e rinforza gli scudi notturni.',
      tags: ['job', 'defense'],
      cardKind: 'job',
      slotTags: ['village', 'job_site'],
      resolutionEngineId: 'job',
      level: 3,
      dangerRating: 2,
      durationFormula: '3',
      statRequirement: {
        label: 'Edge Bastion',
        allOf: ['edge', 'discipline'],
      },
      rewards: [
        { resourceId: 'ember_sigils', amountFormula: '3' },
        { resourceId: 'ashen_favor', amountFormula: '1' },
      ],
      metadata: {
        supportsAutoRepeat: true,
        mapSlotId: 'village_square',
        icon: '🛡️',
        maxCrewSize: 2,
        injuryChanceDisplay: 7,
        deathChanceDisplay: 3,
      },
    },
    job_archivista_frammenti: {
      id: 'job_archivista_frammenti',
      label: 'Archivista dei Frammenti',
      description: 'Cataloga frammenti di reliquie e aggiorna i registri del Trial of Fire.',
      tags: ['job', 'scholar'],
      cardKind: 'job',
      slotTags: ['village', 'job_site'],
      resolutionEngineId: 'job',
      level: 2,
      dangerRating: 1,
      durationFormula: '2',
      statRequirement: {
        label: 'Reason Scholar',
        allOf: ['reason'],
      },
      rewards: [
        { resourceId: 'ember_sigils', amountFormula: '2' },
        { resourceId: 'chronicle_shards', amountFormula: '2' },
      ],
      metadata: {
        supportsAutoRepeat: true,
        mapSlotId: 'village_market',
        icon: '🧩',
        maxCrewSize: 1,
        injuryChanceDisplay: 3,
        deathChanceDisplay: 1,
      },
    },
    quest_fornaci_spettro: {
      id: 'quest_fornaci_spettro',
      label: 'Assalto alle Fornaci Spettro',
      description: 'Spezza le catene delle fornaci infestate dai wraith e riconfigura i crogioli.',
      tags: ['quest', 'combat'],
      slotTags: ['world', 'job_site'],
      resolutionEngineId: 'quest_combat',
      level: 4,
      dangerRating: 6,
      durationFormula: '4',
      statRequirement: {
        label: 'Edge or Forge Savant',
        anyOf: ['edge', 'forge'],
        noneOf: ['frailty'],
      },
      rewards: [
        { resourceId: 'ember_sigils', amountFormula: '6' },
        { resourceId: 'radiant_ore', amountFormula: '2' },
        { resourceId: 'chronicle_shards', amountFormula: '1' },
      ],
      metadata: {
        icon: '🔥',
        verbToneId: 'danger',
        questSpawnEnabled: true,
        questSpawnWeight: 4,
        questMinDay: 2,
        questMaxConcurrent: 2,
        questAllowedSlotTags: ['world'],
        mapSlotId: 'village_gate',
        maxCrewSize: 3,
        injuryChanceDisplay: 58,
        deathChanceDisplay: 38,
      },
    },
    quest_corridor_ceneri: {
      id: 'quest_corridor_ceneri',
      label: 'Duello nel Corridoio delle Ceneri',
      description: 'Affronta il campione del Corridoio per ottenere i suoi pattern rituali.',
      tags: ['quest', 'combat'],
      slotTags: ['world', 'job_site'],
      resolutionEngineId: 'quest_combat',
      level: 5,
      dangerRating: 7,
      durationFormula: '3',
      statRequirement: {
        label: 'Discipline Duelist',
        allOf: ['discipline'],
        anyOf: ['edge', 'heart'],
      },
      rewards: [
        { resourceId: 'ember_sigils', amountFormula: '5' },
        { resourceId: 'ashen_favor', amountFormula: '3' },
        { resourceId: 'chronicle_shards', amountFormula: '2' },
      ],
      metadata: {
        icon: '⚔️',
        verbToneId: 'danger',
        questSpawnEnabled: true,
        questSpawnWeight: 3,
        questMinDay: 3,
        questMaxConcurrent: 1,
        questAllowedSlotTags: ['world'],
        maxCrewSize: 2,
        injuryChanceDisplay: 65,
        deathChanceDisplay: 42,
      },
    },
    quest_nodo_tempesta: {
      id: 'quest_nodo_tempesta',
      label: 'Incursione al Nodo Tempesta',
      description: 'Stabilizza il nodo tempestoso prima che cancelli l’avamposto.',
      tags: ['quest', 'arcane'],
      slotTags: ['world', 'job_site'],
      resolutionEngineId: 'quest_combat',
      level: 6,
      dangerRating: 8,
      durationFormula: '4',
      statRequirement: {
        label: 'Lantern Anchor',
        allOf: ['lantern'],
        anyOf: ['reason'],
      },
      rewards: [
        { resourceId: 'ember_sigils', amountFormula: '7' },
        { resourceId: 'radiant_ore', amountFormula: '3' },
        { resourceId: 'ashen_favor', amountFormula: '2' },
      ],
      metadata: {
        icon: '⚡',
        verbToneId: 'danger',
        questSpawnEnabled: true,
        questSpawnWeight: 3,
        questMinDay: 4,
        questMaxConcurrent: 1,
        questAllowedSlotTags: ['world'],
        maxCrewSize: 3,
        injuryChanceDisplay: 70,
        deathChanceDisplay: 47,
      },
    },
    quest_rituale_sangue_stellare: {
      id: 'quest_rituale_sangue_stellare',
      label: 'Rituale del Sangue Stellare',
      description: 'Canalizza il sangue stellare per chiudere una frattura dimensionale.',
      tags: ['quest', 'ritual'],
      slotTags: ['world', 'job_site'],
      resolutionEngineId: 'quest_combat',
      level: 6,
      dangerRating: 8,
      durationFormula: '5',
      statRequirement: {
        label: 'Moth or Winter Choir',
        anyOf: ['moth', 'winter'],
      },
      rewards: [
        { resourceId: 'ember_sigils', amountFormula: '8' },
        { resourceId: 'ashen_favor', amountFormula: '2' },
        { resourceId: 'chronicle_shards', amountFormula: '2' },
      ],
      metadata: {
        icon: '🩸',
        verbToneId: 'danger',
        questSpawnEnabled: true,
        questSpawnWeight: 2,
        questMinDay: 5,
        questMaxConcurrent: 1,
        questAllowedSlotTags: ['world'],
        maxCrewSize: 3,
        injuryChanceDisplay: 74,
        deathChanceDisplay: 55,
      },
    },
    quest_caccia_tiranno_ossidiano: {
      id: 'quest_caccia_tiranno_ossidiano',
      label: 'Caccia al Tiranno Ossidiano',
      description: 'Abbatti il tiranno ossidiano che domina le steppe vulcaniche.',
      tags: ['quest', 'combat'],
      slotTags: ['world', 'job_site'],
      resolutionEngineId: 'quest_combat',
      level: 7,
      dangerRating: 9,
      durationFormula: '6',
      statRequirement: {
        label: 'Edge & Heart Vanguard',
        allOf: ['edge', 'heart'],
      },
      rewards: [
        { resourceId: 'ember_sigils', amountFormula: '9' },
        { resourceId: 'radiant_ore', amountFormula: '3' },
        { resourceId: 'chronicle_shards', amountFormula: '3' },
      ],
      metadata: {
        icon: '💀',
        verbToneId: 'danger',
        questSpawnEnabled: true,
        questSpawnWeight: 2,
        questMinDay: 6,
        questMaxConcurrent: 1,
        questAllowedSlotTags: ['world'],
        maxCrewSize: 4,
        injuryChanceDisplay: 82,
        deathChanceDisplay: 55,
      },
    },
    quest_frontier_patrol: {
      id: 'quest_frontier_patrol',
      label: 'Ricognizione Frontiera',
      description: 'Scorta i cartografi lungo il margine delle rovine per recuperare reliquie leggere.',
      tags: ['quest', 'explore'],
      slotTags: ['world', 'job_site'],
      resolutionEngineId: 'quest_combat',
      level: 2,
      dangerRating: 3,
      durationFormula: '3',
      statRequirement: {
        label: 'Lantern Scout',
        allOf: ['lantern'],
        anyOf: ['edge', 'moth'],
      },
      rewards: [
        { resourceId: 'xp', amountFormula: '4' },
        { resourceId: 'materials', amountFormula: '2' },
      ],
      metadata: {
        icon: '🗺️',
        questSpawnEnabled: false,
        mapSlotId: 'village_gate',
        injuryChanceDisplay: 18,
        deathChanceDisplay: 4,
      },
    },
  },

  questBlueprints: defaultQuestBlueprints,

  // Simple logical map layout with two generic slots: one inside the village
  // and one just outside the walls. Coordinates are purely logical and the UI
  // is responsible for normalising them.
  mapLayout: {
    pixelWidth: 1280,
    pixelHeight: 720,
  },
  mapSlots: {
    village_square: {
      id: 'village_square',
      label: 'Village Square',
      description: 'Central hub for simple city jobs.',
      x: 420,
      y: 460,
      slotTags: ['village', 'job_site', 'city'],
      isInitiallyUnlocked: true,
      icon: '★',
      colorClass: 'text-amber-200',
    },
    village_gate: {
      id: 'village_gate',
      label: 'Village Gate',
      description: 'Edge of the village, entry point to the outskirts.',
      x: 1080,
      y: 260,
      slotTags: ['world', 'job_site'],
      isInitiallyUnlocked: true,
      icon: '⇨',
      colorClass: 'text-sky-200',
    },
    village_market: {
      id: 'village_market',
      label: 'Market',
      description: 'A small trading stall inside the village walls.',
      x: 760,
      y: 380,
      slotTags: ['village', 'job_site', 'shop'],
      isInitiallyUnlocked: true,
      icon: '◎',
      colorClass: 'text-emerald-200',
    },
    wood_gathering_slot: {
      id: 'wood_gathering_slot',
      label: 'Forest Edge',
      description: 'Edge of the forest where wood is gathered.',
      x: 200,
      y: 300,
      slotTags: ['village', 'job_site', 'forest'],
      isInitiallyUnlocked: true,
      icon: 'Tree',
      colorClass: 'text-green-600',
    },
  },

  // Starting buildings are currently informational; future engines can read
  // their bonuses. They are still fully editable from the Buildings tab.
  passiveEffects: DEFAULT_PASSIVE_EFFECTS,

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
      safe: {
        id: 'safe',
        label: 'Under-Tuned',
        description: 'Activities resolving a bit easier than expected.',
        colorClass: 'text-emerald-300',
        minMultiplier: 0.8,
        maxMultiplier: 0.95,
        weight: 0.2,
      },
      risky: {
        id: 'risky',
        label: 'Over-Tuned',
        description: 'Tougher encounters with higher injury risk.',
        colorClass: 'text-rose-300',
        minMultiplier: 1.05,
        maxMultiplier: 1.3,
        weight: 0.3,
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
      lean: {
        id: 'lean',
        label: 'Underpaid',
        description: 'Reward variance on the low side.',
        colorClass: 'text-amber-200',
        minMultiplier: 0.7,
        maxMultiplier: 0.9,
        weight: 0.25,
      },
      lavish: {
        id: 'lavish',
        label: 'Heroic Reward',
        description: 'High payout missions with flashy loot.',
        colorClass: 'text-sky-200',
        minMultiplier: 1.15,
        maxMultiplier: 1.4,
        weight: 0.2,
      },
    },
  },

  globalRules: {
    // Fatigue model: 0 = rested, increases with activity, cap = exhausted
    maxFatigueBeforeExhausted: 100,
    defaultActivityFatigueGain: 10,
    startingResidentFatigue: 0,
    fatigueRecoveryPerDay: 50,
    dayLengthInTimeUnits: 5,
    dayNightCycle: {
      dayTimeUnits: 5,
      nightTimeUnits: 5,
    },
    secondsPerTimeUnit: 1,
    fatigueYellowThreshold: 33,
    fatigueRedThreshold: 66,
    baseLightInjuryChanceAtMaxFatigue: 0.3,
    dangerInjuryMultiplierPerPoint: 0.1,
    injuryTiers: {
      light: {
        id: 'light',
        label: 'Light Injury',
        description: 'Bruises and sprains; resident still functional.',
        recoveryTimeInDays: 1,
        jobEfficiencyMultiplier: 0.85,
        questEligibility: 'limited',
        fatigueGainMultiplier: 1.1,
        colorClass: 'text-amber-200',
      },
      moderate: {
        id: 'moderate',
        label: 'Moderate Injury',
        description: 'Serious wounds that need proper care.',
        recoveryTimeInDays: 3,
        jobEfficiencyMultiplier: 0.65,
        questEligibility: 'none',
        fatigueGainMultiplier: 1.3,
        colorClass: 'text-orange-300',
      },
      severe: {
        id: 'severe',
        label: 'Severe Injury',
        description: 'Life-threatening state requiring infirmary time.',
        recoveryTimeInDays: 7,
        jobEfficiencyMultiplier: 0.4,
        questEligibility: 'none',
        fatigueGainMultiplier: 1.5,
        colorClass: 'text-rose-300',
      },
    },
    deathRules: {
      baseDeathChanceAtMaxDanger: 0.05,
      dangerDeathMultiplierPerPoint: 0.02,
      injuryTierMultipliers: {
        light: 0.5,
        moderate: 1,
        severe: 1.5,
      },
      questOutcomeAdjustments: {
        perfect: -0.02,
        success: -0.01,
        partial: 0,
        fail: 0.03,
        deadly: 0.1,
      },
      starvationDeathChancePerDay: 0.02,
    },
    foodConsumptionPerResidentPerDay: 1,
    baseFoodPriceInGold: 25,
    startingResources: {
      gold: 0,
      food: 2,
    },
    // Initial resident roster for gameplay bootstrap
    startingResidents: [
      {
        id: 'pc-trainee-1',
        name: 'Lucia "Lantern" Bassi',
        stats: { hp: 210, damage: 25, txc: 25, evasion: 0, agility: 50, hitChance: 0, effectiveDamage: 0, attacksPerKo: 0, htk: 0, edpt: 0, ttk: 0, earlyImpact: 0, critChance: 5, critMult: 2, critTxCBonus: 20, failChance: 0, failMult: 0, failTxCMalus: 20, armor: 0, resistance: 0, armorPen: 0, penPercent: 0, lifesteal: 0, regen: 0, ward: 0, block: 0, energyShield: 0, thorns: 0, cooldownReduction: 0, castSpeed: 0, movementSpeed: 100, configFlatFirst: true, configApplyBeforeCrit: false },
        fatigue: 12,
        isInjured: false,
        level: 1,
      },
      {
        id: 'pc-ring-anchor',
        name: 'Anselmo "Anchor" Riva',
        stats: { hp: 230, damage: 25, txc: 25, evasion: 0, agility: 50, hitChance: 0, effectiveDamage: 0, attacksPerKo: 0, htk: 0, edpt: 0, ttk: 0, earlyImpact: 0, critChance: 5, critMult: 2, critTxCBonus: 20, failChance: 0, failMult: 0, failTxCMalus: 20, armor: 0, resistance: 0, armorPen: 0, penPercent: 0, lifesteal: 0, regen: 0, ward: 0, block: 0, energyShield: 0, thorns: 0, cooldownReduction: 0, castSpeed: 0, movementSpeed: 100, configFlatFirst: true, configApplyBeforeCrit: false },
        fatigue: 18,
        isInjured: false,
        level: 1,
      },
      {
        id: 'ws11-resident-2',
        name: 'WS11 Vanguard',
        stats: { hp: 180, damage: 25, txc: 25, evasion: 0, agility: 50, hitChance: 0, effectiveDamage: 0, attacksPerKo: 0, htk: 0, edpt: 0, ttk: 0, earlyImpact: 0, critChance: 5, critMult: 2, critTxCBonus: 20, failChance: 0, failMult: 0, failTxCMalus: 20, armor: 0, resistance: 0, armorPen: 0, penPercent: 0, lifesteal: 0, regen: 0, ward: 0, block: 0, energyShield: 0, thorns: 0, cooldownReduction: 0, castSpeed: 0, movementSpeed: 100, configFlatFirst: true, configApplyBeforeCrit: false },
        fatigue: 10,
        isInjured: false,
        level: 1,
      },
      {
        id: 'ws11-resident-3',
        name: 'WS11 Archivist',
        stats: { hp: 150, damage: 25, txc: 25, evasion: 0, agility: 50, hitChance: 0, effectiveDamage: 0, attacksPerKo: 0, htk: 0, edpt: 0, ttk: 0, earlyImpact: 0, critChance: 5, critMult: 2, critTxCBonus: 20, failChance: 0, failMult: 0, failTxCMalus: 20, armor: 0, resistance: 0, armorPen: 0, penPercent: 0, lifesteal: 0, regen: 0, ward: 0, block: 0, energyShield: 0, thorns: 0, cooldownReduction: 0, castSpeed: 0, movementSpeed: 100, configFlatFirst: true, configApplyBeforeCrit: false },
        fatigue: 5,
        isInjured: false,
        level: 1,
      },
    ],
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
    trialOfFire: {
      highRiskThreshold: 0.4,
      statBonusMultiplier: 0.15,
      heroSurvivalThreshold: 3,
      hpRecoveryPercent: 0.25,
    },
    productionScaling: {
      diminishingReturnsFactor: 0.8,
      statMultiplierPerPoint: 0.1,
      applyDiminishingToFirstWorker: false,
      maxStatMultiplier: 3.0,
    },
    warningThresholds: {
      // Essential warning thresholds for critical game states
      fatigue: {
        yellowThreshold: 33,    // Show yellow warning at 33% fatigue
        redThreshold: 66,        // Show red warning at 66% fatigue
        criticalThreshold: 90,   // Show critical warning at 90% fatigue
      },
      food: {
        lowThreshold: 2,          // Low food warning at 2 units
        criticalThreshold: 1,     // Critical food warning at 1 unit
        starvingThreshold: 0,    // Starving warning at 0 units
      },
      injury: {
        lightThreshold: 1,       // Warning when 1+ residents have light injuries
        moderateThreshold: 1,     // Warning when 1+ residents have moderate injuries
        severeThreshold: 1,      // Critical warning when 1+ residents have severe injuries
        deathThreshold: 1,       // Critical alert when any resident dies
      },
      resources: {
        goldLowThreshold: 10,     // Low gold warning
        goldCriticalThreshold: 5, // Critical gold warning
        materialsLowThreshold: 5, // Low materials warning
      },
    },
  },

  overlaySettings: {
    enabled: true,
    defaultPosition: 'top-right',
    defaultSize: 'medium',
    defaultZoom: 1.0,
    alwaysOnTop: true,
    transparency: false,
    enabledWidgets: [
      { id: 'resources', enabled: true, order: 0 },
      { id: 'activities', enabled: true, order: 1 },
      { id: 'time', enabled: true, order: 2 },
      { id: 'villagers', enabled: true, order: 3 },
    ],
    autoHideTimeoutSeconds: 0,
    showSystemTrayIcon: true,
  },
  uiPreferences: {
    defaultAppTabId: 'map',
  },
};
