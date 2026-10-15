/**
 * QuestScenario «The Ruins beneath the River» — canonical authored config
 * (PLAN-019-S2.1, T-3: migration 1:1 from `questS1Lab/questScenarioRovine.ts`;
 * R-135: English re-baseline of all authored prose).
 *
 * Director mockup 2026-10-04. Exploration/recovery profile on STRENGTH:
 * attrition gauntlet where the currency of loss is HP and TIME (days), not
 * camp alertness. Same engine, different shape: merchant = check-choice
 * (safe info vs risky pressure), mandatory river, variance-vs-certainty
 * guards, trap cascade in the treasure room, checkpoint push-your-luck with
 * VISIBLE stake (gold + days + wounded), unavoidable attrition, deep chamber,
 * return event with an economic callback (the clotting agent won at the merchant
 * sells to a wounded traveler for more than its worth), and a report-style
 * epilogue that costs the run in man-days.
 *
 * Not a general engine: post-verdict routing of check nodes is hardcoded per
 * node id in `questRun.applyNodeOutcome` (invariant I-3 — engine unchanged).
 *
 * The module parses itself at import: `ROVINE_SCENARIO` is the validated
 * scenario; `ROVINE_SCENARIO_AUTHORED` is the raw literal kept for the parity
 * test (authored object vs parse output — strict schema, no silent drops).
 */

import type { LabStat, QuestNode } from '@/ui/idleVillage/questS1Lab/questScenario';
import {
  parseQuestScenario,
  type QuestScenario,
} from '@/balancing/config/idleVillage/quests/questScenario.schema';

const ROVINE_NODES: Record<string, QuestNode> = {
  /* ---- PHASE I — the merchant: safe info vs risky pressure -------------- */
  'rv-mercante': {
    id: 'rv-mercante',
    kind: 'choice',
    title: 'The merchant at the entrance',
    body: 'A merchant claims to have found an ancient entrance beneath the river. He could not get in — but he knows more than he says.',
    beat: 0,
    options: [
      {
        id: 'rv-osserva',
        label: 'Observe him',
        detail: 'Perception. Almost no risk: information about the area.',
        next: 'CHECK:rv-check-osserva',
      },
      {
        id: 'rv-incalza',
        label: 'Press the merchant',
        detail: 'Strength + Perception. More information, a possible extra — and a small risk.',
        next: 'CHECK:rv-check-incalza',
      },
    ],
  },
  'rv-check-osserva': {
    id: 'rv-check-osserva',
    kind: 'check',
    title: 'Reading the merchant',
    body: 'You study him as he talks: hands, eyes, what he avoids saying.',
    stats: ['perc'],
    risk: { wound: 2, death: 0 },
    risky: true,
    beat: 0,
  },
  'rv-check-incalza': {
    id: 'rv-check-incalza',
    kind: 'check',
    title: 'Pressing the merchant',
    body: 'You grab him by the collar of his jacket: he wants your money, but you want the truth.',
    stats: ['str', 'perc'],
    risk: { wound: 8, death: 0 },
    risky: true,
    beat: 0,
    failHint: 'he throws you out badly — no information, and you start worse off.',
  },
  /* ---- PHASE II — the underground river: mandatory, no choice ----------- */
  'rv-fiume': {
    id: 'rv-fiume',
    kind: 'check',
    title: 'The underground river',
    body: 'The mandatory passage. The water is freezing and the current pushes the party against the wall — here you do not choose, you endure.',
    stats: ['str', 'con'],
    risk: { wound: 20, death: 3 },
    risky: true,
    beat: 1,
    failHint: 'the current drags you: +1–2 days and physical consequences.',
  },
  /* ---- PHASE III — the guards: variance vs certainty -------------------- */
  'rv-guardie': {
    id: 'rv-guardie',
    kind: 'choice',
    title: 'The guards in the gallery',
    body: 'Two guards stand before the passage. You can vanish into the shadows — or pay the passage in blood and take their loot.',
    beat: 2,
    options: [
      {
        id: 'rv-sneak',
        label: 'Sneak past',
        detail: 'Agility. Success: no damage. Fail: a wound. All or nothing.',
        next: 'CHECK:rv-check-sneak',
      },
      {
        id: 'rv-fight',
        label: 'Fight them',
        detail: 'Strength. Always costs something — but the guards’ loot is yours if you win.',
        next: 'CHECK:rv-check-fight',
      },
    ],
  },
  'rv-check-sneak': {
    id: 'rv-check-sneak',
    kind: 'check',
    title: 'Sneaking past the guards',
    body: 'Loose stones and held breaths. If they see you, the pikes do not ask permission.',
    stats: ['agi'],
    risk: { wound: 18, death: 4 },
    risky: true,
    beat: 2,
    failHint: 'they see you: direct damage, and the guards stay between you and the exit.',
  },
  'rv-check-fight': {
    id: 'rv-check-fight',
    kind: 'check',
    title: 'Fighting the guards',
    body: 'Two pikes against four of you. Win fast or pay in blood — either way you pay.',
    stats: ['str'],
    risk: { wound: 22, death: 6 },
    risky: true,
    beat: 2,
    failHint: 'the pikes do their job: serious damage, no loot.',
  },
  /* ---- PHASE IV — the treasure room + trap cascade ----------------------- */
  'rv-sala': {
    id: 'rv-sala',
    kind: 'check',
    title: 'The treasure room',
    body: 'The treasure is there, in the torchlight. But something is off: too easy, too exposed.',
    stats: ['perc'],
    risk: { wound: 5, death: 0 },
    risky: true,
    beat: 3,
    failHint: 'you miss the trap — it springs as you walk in.',
  },
  'rv-check-trappola': {
    id: 'rv-check-trappola',
    kind: 'check',
    title: 'The trap springs',
    body: 'The floor gives way. The cavern closes on you — getting out is the only thing that matters.',
    stats: ['agi', 'con'],
    risk: { wound: 25, death: 8 },
    risky: true,
    beat: 3,
    failHint: 'wounded, maybe worse. And the treasure is damaged in the fall.',
  },
  'rv-tesoro-scelta': {
    id: 'rv-tesoro-scelta',
    kind: 'choice',
    title: 'The treasure before you',
    body: 'Take it fast, or find a safe way — time against safety against value.',
    beat: 3,
    options: [
      {
        id: 'rv-prendi',
        label: 'Take the treasure',
        detail: 'Strength + Constitution to haul it away. Normal reward, no extra days.',
        next: 'CHECK:rv-check-prendi',
      },
      {
        id: 'rv-sicuro',
        label: 'Look for a safe way',
        detail: '+1 day. Safer, and maybe richer: you study the room’s mechanisms.',
        next: 'CHECK:rv-check-sicuro',
        costDays: 1,
      },
    ],
  },
  'rv-check-prendi': {
    id: 'rv-check-prendi',
    kind: 'check',
    title: 'Loading the treasure',
    body: 'Coins, chalices, an ancient chest. It is weight — and weight rides on the back.',
    stats: ['str', 'con'],
    risk: { wound: 15, death: 3 },
    risky: true,
    beat: 3,
    failHint: 'strain and falls: part of the treasure stays on the ground.',
  },
  'rv-check-sicuro': {
    id: 'rv-check-sicuro',
    kind: 'check',
    title: 'The safe way',
    body: 'You study the slabs, the weights, the counterweights. +1 day of work — but the room pays for the attention.',
    stats: ['str', 'con'],
    risk: { wound: 8, death: 1 },
    risky: true,
    beat: 3,
    failHint: 'the “safe” way was not that safe after all.',
  },
  /* ---- CHECKPOINT — the stake is visible, the bet is yours --------------- */
  'rv-checkpoint': {
    id: 'rv-checkpoint',
    kind: 'choice',
    title: 'Treasure in hand — turn back or push on?',
    body: 'You have the treasure. Ahead lies another passage, deeper down. Everything you carry can still be lost.',
    beat: 4,
    options: [
      {
        id: 'rv-torna',
        label: 'Return to the village',
        detail: 'You keep everything you found.',
        next: 'rv-ritorno-evento',
      },
      {
        id: 'rv-continua',
        label: 'Keep exploring',
        detail: 'There may be something far more precious. It costs something either way.',
        next: 'rv-attrito',
      },
    ],
  },
  /* ---- PHASE V — attrition without a check (no check can remove this cost) */
  'rv-attrito': {
    id: 'rv-attrito',
    kind: 'harm',
    title: 'The unstable zone',
    body: 'The passage leads to a second chamber through groaning stone. No check erases this cost: crossing it always pays a toll.',
    next: 'rv-camera',
    beat: 4,
  },
  /* ---- PHASE VI — the deep chamber: the optional reward ------------------ */
  'rv-camera': {
    id: 'rv-camera',
    kind: 'check',
    title: 'The deep chamber',
    body: 'An ancient vault, untouched for centuries. What you manage to haul out depends on how much back you have left.',
    stats: ['str', 'con'],
    risk: { wound: 18, death: 4 },
    risky: true,
    beat: 5,
    failHint: '+1–2 days for little: the vault had already been almost emptied.',
  },
  /* ---- PHASE VII — return: the wounded man on the road ------------------- */
  'rv-ritorno-evento': {
    id: 'rv-ritorno-evento',
    kind: 'choice',
    title: 'The wounded man on the road',
    body: 'On the way home you find a wounded man, abandoned by his own. He looks at you the way one looks at a last chance.',
    beat: 6,
    options: [
      {
        id: 'rv-aiuta',
        label: 'Help him — give him the clotting agent',
        detail: 'Consumes the merchant’s clotting agent. He will repay you more than it is worth.',
        next: 'rv-fine',
        requiresFlag: 'hasCoagulo',
        consumesFlag: 'hasCoagulo',
        grantsGold: 50,
        sets: 'viandanteAiutato',
      },
      {
        id: 'rv-porta',
        label: 'Take him with you',
        detail: '+1 day and you bring him to the village — he may remember you.',
        next: 'rv-fine',
        costDays: 1,
        grantsGold: 20,
        grantsInfo: 'contattoViandante',
        sets: 'viandantePortato',
      },
      {
        id: 'rv-lascia',
        label: 'Leave him',
        detail: 'No cost. No gain. The road will remember.',
        next: 'rv-fine',
        sets: 'viandanteLasciato',
      },
    ],
  },
  'rv-fine': {
    id: 'rv-fine',
    kind: 'end',
    title: 'Return to the village',
    body: 'The expedition is over.',
    beat: 6,
  },
};

/**
 * Authored scenario literal (pre-parse). `intelLabels` = the journal labels
 * for `state.info` entries of this quest (moved here 1:1 from the lab).
 * The `offer` block is NEW content — see `GOBLIN_SCENARIO_AUTHORED` for the
 * ownership rules (S2.1 owns fields, S2.3 owns values).
 */
export const ROVINE_SCENARIO_AUTHORED = {
  id: 'rovine',
  title: 'The Ruins beneath the River',
  scenarioVersion: 's2.1-rovine-v1',
  startNode: 'rv-mercante',
  primaryStats: ['str', 'con'] as LabStat[],
  /* PLAN-036 (R-195): planner key-stat tiers per spec §0 — Forza primary;
   * Percezione, Costituzione, Destrezza secondary. `con` is BOTH a frozen
   * primaryStats member AND a secondary display tier — that's legal:
   * `secondary` has no subset constraint, only tier disjointness vs
   * `keyStats.primary`. */
  keyStats: { primary: ['str'], secondary: ['perc', 'con', 'agi'] },
  beats: [
    'The merchant',
    'The river',
    'The guards',
    'The treasure room',
    'Beyond',
    'The deep chamber',
    'The return',
  ],
  intelLabels: {
    guardiePiuAvanti: 'the guards are protecting something further on',
    mappaRovine: 'the rough map of the ruins',
    contattoViandante: 'the traveler who owes you a favor',
  },
  offer: {
    objective: 'Recover the treasure from the ruins beneath the river.',
    tags: ['quest', 'exploration', 'ruins'],
    /* Slot gates use the CANONICAL resident statTags vocabulary (role gates:
     * edge/fortitude/warden/ward/clarity/precision — numeric stat keys are
     * NOT role tags, `mission_planner_data_model_fix.md` §2.2). */
    slots: {
      required: [
        {
          id: 'rovine-slot-leader',
          label: 'Expedition leader',
          role: 'leader',
          statFocus: ['str', 'con'],
          requirement: { label: 'Expedition leader', anyOf: ['fortitude', 'edge'] },
        },
      ],
      optional: [
        {
          id: 'rovine-slot-member-1',
          label: 'Porter',
          role: 'member',
          statFocus: ['str', 'con'],
          requirement: { label: 'Porter', anyOf: ['edge', 'fortitude', 'warden'] },
        },
        {
          id: 'rovine-slot-member-2',
          label: 'Porter',
          role: 'member',
          statFocus: ['str', 'con'],
          requirement: { label: 'Porter', anyOf: ['edge', 'fortitude', 'warden'] },
        },
        {
          id: 'rovine-slot-esploratore',
          label: 'Scout',
          role: 'member',
          statFocus: ['perc', 'agi'],
          requirement: { label: 'Scout', anyOf: ['clarity', 'precision'] },
        },
      ],
    },
    /* Calibration party for `dangerBandRef` — mirrors the lab `rv-eroe`
     * preset (the mockup party: strong hero + three ordinary villagers).
     * hp omitted = engine default, exactly like the preset. */
    referenceParty: [
      { id: 'ref-leader', name: 'Aldric', role: 'leader', stats: { str: 90, con: 72, agi: 40, perc: 45, int: 35, cha: 50 } },
      { id: 'ref-m1', name: 'Pietro', role: 'member', stats: { str: 45, con: 50, agi: 45, perc: 40, int: 35, cha: 40 } },
      { id: 'ref-m2', name: 'Sara', role: 'member', stats: { str: 35, con: 45, agi: 60, perc: 55, int: 45, cha: 50 } },
      { id: 'ref-m3', name: 'Nando', role: 'member', stats: { str: 50, con: 55, agi: 35, perc: 35, int: 30, cha: 30 } },
    ],
    dangerBandRef: 'media',
    rewardBase: 100,
    /* PLAN-036: ~21:9 planner banner. NOTE — the directory's historical
     * spelling is `quest-robine` (on disk since 2026-10-05); do NOT
     * "fix" it — renaming would orphan committed references. */
    coverArt: '/assets/quest-robine/rovine-hero.jpg',
  },
  nodes: ROVINE_NODES,
} satisfies Omit<QuestScenario, 'primaryStats'> & { primaryStats: LabStat[] };

/** Parsed, validated scenario — the single source consumed by the engine. */
export const ROVINE_SCENARIO: QuestScenario = parseQuestScenario(ROVINE_SCENARIO_AUTHORED);
