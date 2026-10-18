/**
 * QuestScenario «Goblin Extermination» — canonical authored config
 * (PLAN-019-S2.1, T-2: migration 1:1 from `questS1Lab/questScenarioGoblin.ts`;
 * R-135: English re-baseline of all authored prose).
 *
 * Director-authored spec: `src/docs/docs/idle_village/quest_sterminio_goblin_spec.md`
 * (PLAN-022). Combat quest, Strength-based, positional slot targeting:
 * the risk lives at the back of the formation — 4 alive → 0/0/20/80 —
 * and compacts when someone dies. NOT a general engine: post-verdict routing
 * of check/combat nodes is hardcoded per node id in `questRun.applyNodeOutcome`
 * (invariant I-3 — the engine is unchanged).
 *
 * The module parses itself at import: `GOBLIN_SCENARIO` is the validated
 * scenario; `GOBLIN_SCENARIO_AUTHORED` is the raw literal kept for the parity
 * test (authored object vs parse output — strict schema, no silent drops).
 */

import type { LabStat, QuestNode } from '@/ui/idleVillage/questS1Lab/questScenario';
import {
  parseQuestScenario,
  type QuestScenario,
} from '@/balancing/config/idleVillage/quests/questScenario.schema';

/* ------------------------------------------------------------------ */
/* Nodes — F0..F7 from the authored spec.                               */
/* ------------------------------------------------------------------ */

const GOBLIN_NODES: Record<string, QuestNode> = {
  /* F0 (ASSIGNMENT) is no longer a node: the consumables the player brings from the village are
   * armed in the planner, so the run opens straight on the first real decision (Director, 2026-10-16). */

  /* F1 — EXPLORATION: two alternative checks.
   * PER "Look for tracks" success → stealth bonus (F3).
   * STR+PER "Climb the tree" success → opens F2 (from above you spot
   * the stash by the boulder); fail −10 HP (fall). */
  'gob-esplora': {
    id: 'gob-esplora',
    kind: 'choice',
    title: 'Exploration — at the edge of the wood',
    body: 'The wood is silent in a way that does not come naturally to woods. On the trail, a boulder blocks the way — and from underneath a flap of rag sticks out, crushed as if by someone in a hurry.',
    transit: 'The road dies where the wood begins. The smell of resin gives way to damp earth and a low smoke that is no kitchen fire. Whoever leads marches ahead; behind, the others count loads and exits.',
    beat: 1,
    options: [
      {
        id: 'gob-cerca-tracce',
        label: 'Look for tracks',
        detail: 'Perception. The ground tells who passed, and how many they were.',
        next: 'CHECK:gob-tracce-per',
      },
      {
        id: 'gob-forza-tracce',
        label: 'Climb the tree',
        detail: 'Strength + Perception. From above: the camp, and where they hide what they steal.',
        next: 'CHECK:gob-tracce-perfor',
      },
    ],
  },
  'gob-tracce-per': {
    id: 'gob-tracce-per',
    kind: 'check',
    title: 'Looking for tracks',
    body: 'On the ground the wood speaks softly: footprints in the damp earth, branches broken at the wrong height.',
    transit: 'You spread along the trail reading the ground: prints, churned earth, the sense of a path the others cannot see.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 1,
    verdictFlavor: {
      bigwin: 'Fresh tracks, turned earth, a thread of bells strung between the branches: you know where they go, and where they watch from.',
      win: 'Fresh tracks heading north, and signs of repeated passages. You know how to approach.',
      almost: 'Confused signs, double prints. A suspicion, not a path.',
      fail: 'The ground was churned on purpose. The wood tells you nothing.',
      epicfail: 'You read the tracks backwards — and someone, somewhere, has read yours.',
    },
  },
  'gob-tracce-perfor': {
    id: 'gob-tracce-perfor',
    kind: 'check',
    title: 'You climb the tree',
    body: 'From below the wood is a wall. From above, something says where it opens — and what it hides.',
    transit: 'The right tree stands three paces off the trail. The bark is your grip, the top your eye.',
    stats: ['str', 'perc'],
    risk: { wound: 0, death: 0 },
    beat: 1,
    verdictFlavor: {
      bigwin: 'From above: low smoke to the east, a line of sharpened stakes, a sentry on a stump — and below, by the boulder, churned earth where someone closed something in a hurry.',
      win: 'The bark gives but holds. From above: the camp to the east, and by the boulder a flap of rag that should not be there.',
      almost: 'The branch gives halfway up — but it is enough to glimpse the churned earth under the boulder.',
      fail: 'The branch holds halfway, then gives: your back finds the ground before your eyes find the camp.',
      epicfail: 'A rotten branch: down on your back, and the thud runs through the wood. Now even they know you are here.',
    },
  },

  /* F2 — HIDDEN EVENT (loot): only if PER+STR succeeded.
   * AGI: item anyway; fail → 10 dmg + camp awake (alarm −10pp at F4+). */
  'gob-bottino-scelta': {
    id: 'gob-bottino-scelta',
    kind: 'choice',
    title: 'Hidden treasure',
    hidden: true,
    body: 'Under the boulder, loot wrapped in rags. Taking it in silence costs a steady hand — one sound and the camp wakes.',
    transit: 'Behind the boulder, a niche of rags: someone hid something in a hurry and never came back.',
    beat: 2,
    options: [
      {
        id: 'gob-prendi',
        label: 'Take the loot',
        detail: 'Agility. If your hand betrays you, the camp wakes.',
        next: 'CHECK:gob-bottino',
      },
      {
        id: 'gob-lascia-bottino',
        label: 'Leave it be',
        detail: 'A sleeping camp is worth more than loot: you move on.',
        next: 'gob-accampamento',
      },
    ],
  },
  'gob-bottino': {
    id: 'gob-bottino',
    kind: 'check',
    title: 'Hands on the loot',
    hidden: true,
    body: 'Chains, bells, a knot to undo without a sound.',
    stats: ['agi'],
    verdictFlavor: {
      bigwin: 'Not even the bells notice. In the bag, without a sound.',
      win: 'One knot at a time. The loot is yours.',
      almost: 'Something jingles. Breath held — nothing moves. Half taken.',
      fail: 'A bell betrays the hand: the sound runs through the valley.',
      epicfail: 'The wire stays in your hand: the bells call, and something answers.',
    },
    risk: { wound: 0, death: 0 },
    beat: 2,
  },

  /* F3 — CAMP: Stealth (AGI) vs Assault (STR).
   * Same lever (+damage at F4), different risk. */
  'gob-accampamento': {
    id: 'gob-accampamento',
    kind: 'choice',
    title: 'Assault',
    body: 'Smoke among the tents. From here you strike in one way only — yours.',
    transit: 'Among the leaves the smoke thickens: the camp is below. From here you strike in one way only — choose it well.',
    beat: 3,
    options: [
      {
        id: 'gob-via-stealth',
        label: 'Slip past the bell wire',
        detail: 'Agility. Bigger bonus — but if they see you, the camp is alerted.',
        next: 'CHECK:gob-stealth',
      },
      {
        id: 'gob-via-assalto',
        label: 'Assault',
        detail: 'Strength. Moderate bonus — failure costs nothing.',
        next: 'CHECK:gob-assalto',
      },
    ],
  },
  'gob-stealth': {
    id: 'gob-stealth',
    kind: 'check',
    title: 'The bell wire',
    body: 'A wire strung at half-shin leads to bells hung like traps. Every step is a possible sound.',
    stats: ['agi'],
    risk: { wound: 0, death: 0 },
    beat: 3,
    verdictFlavor: {
      bigwin: 'You pass like smoke between the stakes. The camp sleeps; the surprise is yours.',
      win: 'One step, one breath, one step. You are inside.',
      almost: 'A stifled sneeze. Two heads rise from the fire, then sink back down. Inside — but not invisible.',
      fail: 'A wire trembles under the palm. A bell decides to live.',
      epicfail: 'The wire stays in your hand: the bells call, and something answers.',
    },
  },
  'gob-assalto': {
    id: 'gob-assalto',
    kind: 'check',
    title: 'The charge',
    body: 'The palisade is made of refuse and mud. Break through before they organize — or take the hit.',
    stats: ['str'],
    risk: { wound: 0, death: 0 },
    beat: 3,
    verdictFlavor: {
      bigwin: 'The first stake falls before anyone understands. A tent collapses onto the fire; two goblins roll away blind with smoke.',
      win: 'You break through where the palisade is lowest. A spear rises — too late.',
      almost: 'The palisade holds one breath too long. Someone shouts; the camp has time to grab their weapons.',
      fail: 'The charge plants itself in the mud. They are already waiting, spears leveled.',
      epicfail: 'You trip on your own charge: in the middle of the camp, in disarray.',
    },
  },

  /* F4 — COMBAT: X turns of mutual damage, positional targeting with
   * escalation; no instant death — only HP. */
  'gob-combattimento': {
    id: 'gob-combattimento',
    kind: 'combat',
    title: 'Combat — the goblin camp',
    body: 'You have them. Or they have you.',
    transit: 'The moment is chosen. The wood holds its breath — then the camp erupts.',
    previewHint: 'A turn-based fight on the camp: the goblins answer blow for blow — skin pays the price.',
    beat: 4,
    /* PLAN-043 WS-4: the camp fight earns the full cut — aperture reveal,
     * dolly-in on the eruption, impact on each exchange. */
    stageDirection: { cut: ['reveal', 'impact', 'push'] },
    combat: {
      turns: 5,
      enemies: 6,
      attackStats: ['str'],
      killPerWin: 1,
      killPerBigwin: 2,
      hitDamage: 12, // placeholder — MC calibration
      escalateProfile: true,
      nextCleared: 'gob-esplora-extra', // extermination → F5 skipped
      nextSurvivors: 'gob-incalzare',
    },
  },

  /* F5 — PURSUIT: let them flee (heavy ambush) or pursue (STR check with
   * verdict bands: almost = fail-mild, fail/epicfail = milder ambush). */
  'gob-incalzare': {
    id: 'gob-incalzare',
    kind: 'choice',
    title: 'Pursuit',
    body: 'The survivors run toward the wood. Close them here — or let them go.',
    transit: 'Dust and blood. The remaining goblins break the front and run toward the wood, carrying your faces with them.',
    beat: 5,
    options: [
      {
        id: 'gob-lascia-fuggire',
        label: 'Let them flee',
        detail: 'They will come back. You will see them again on the road home.',
        next: 'gob-esplora-extra',
        sets: 'agguatoPeggiore', // R-097 v2: letting them go = they regroup → HEAVY ambush at F7
      },
      {
        id: 'gob-insegui',
        label: 'Pursue them',
        detail: 'Strength. Close the quest here — or make the bill worse.',
        next: 'CHECK:gob-incalza-check',
      },
    ],
  },
  'gob-incalza-check': {
    id: 'gob-incalza-check',
    kind: 'check',
    title: 'The hunt among the rocks',
    body: 'The hunt through the rocks. Every meter gained is one too many.',
    stats: ['str'],
    risk: { wound: 0, death: 0 },
    beat: 5,
    verdictFlavor: {
      bigwin: 'You close them where the trail narrows. No one will return to tell what happened.',
      win: 'You close them against the rocks, one at a time. The trail goes silent again.',
      almost: 'You run until your lungs burn: some of you cut off their escape, some do not. They will return wounded — and warned.',
      fail: 'The rocks betray you. You watch them vanish, and you know you will see them again.',
      epicfail: 'The hunt costs blood and closes nothing. They all get back — and they will return organized.',
    },
    // R-097 v2: the deterministic price of the chase itself — escaping
    // goblins are bloodied → the ambush is the mild one.
    upfrontDamage: { amount: 10, epicfailAmount: 20 },
    failHint: 'The hunt costs blood anyway. If they escape, they come back wounded: the ambush will be weaker.',
    previewHint: 'Pursuing exposes your backs: the hunt has a certain toll, the verdict decides the rest.',
  },

  /* F6 — KEEP EXPLORING: push-your-luck, damage grows 5→10→15. */
  'gob-esplora-extra': {
    id: 'gob-esplora-extra',
    kind: 'choice',
    title: 'The conquered camp',
    body: 'Ash and overturned tents. Under the tarp of the lowest tent, a corner of leather with a brass clasp.',
    transit: 'A conquered camp is an open camp: ash, overturned tents, and loot no one claims anymore.',
    beat: 6,
    options: [
      {
        id: 'gob-fruga',
        label: 'Keep looting',
        detail: 'The tarp gives slowly. Every extra round costs more — in gold and in skin.',
        next: 'CHECK:gob-cerca',
      },
      {
        id: 'gob-fermati',
        label: 'Stop here',
        detail: 'Leave the leather where it is: time to go home.',
        next: 'gob-ritorno',
      },
    ],
  },
  'gob-cerca': {
    id: 'gob-cerca',
    kind: 'check',
    title: 'Raiding the tents',
    body: 'Among burnt tents and traps the goblins left behind — the camp makes you pay even dead.',
    previewHint: 'Every extra round of looting costs more than the last — the camp does not stay stable.',
    stats: ['int', 'perc'],
    risk: { wound: 0, death: 0 },
    beat: 6,
    verdictFlavor: {
      bigwin: 'The clasp gives: inside, the best of what was left.',
      win: 'A tent floor, a fistful of rags — something worth the trouble.',
      almost: 'Little stuff, and the beam presents its bill.',
      fail: 'Only ash, thorns — and the trap that closes the round.',
      epicfail: 'The camp collects its last debt: ash, thorns and blood.',
    },
  },

  /* F7 — RETURN / AMBUSH. 'gob-ritorno' routes: extermination → end clean;
   * else → ambush (5 dry dmg to all) → drop trophy OR last stand. */
  'gob-ritorno': {
    id: 'gob-ritorno',
    kind: 'info',
    title: 'The road home',
    body: 'The road descends toward home. Someone has started whistling. Then stops, without anyone saying why.',
    next: 'gob-agguato',
    beat: 7,
    /* PLAN-043 WS-4: the road home is a J-cut — the whistling dies before
     * the ambush image lands. */
    stageDirection: { cut: ['j-cut', 'reveal'] },
  },
  'gob-agguato': {
    id: 'gob-agguato',
    kind: 'harm',
    title: 'Ambush on the road',
    body: 'The whistling cuts off mid-note. An arrow in the post beside you. Then all the others.',
    next: 'gob-agguato-scelta',
    previewHint: 'The road home is not safe: someone is waiting for you.',
    revealHint: 'A trained eye would read the tracks: the fugitives you spare come back to prepare this ambush.',
    beat: 7,
    /* PLAN-043 WS-4: the ambush is a tone change — bars close, the stage
     * jolts, the scene opens through the aperture. */
    stageDirection: { cut: ['bars', 'reveal', 'impact'] },
  },
  'gob-agguato-scelta': {
    id: 'gob-agguato-scelta',
    kind: 'choice',
    title: 'Trophy or blood',
    body: 'You can drop the trophy and run — or fight the last melee.',
    transit: 'Around you, the wood closes in again. One choice remains: leave the trophy, or leave someone.',
    beat: 7,
    options: [
      {
        id: 'gob-molla-trofeo',
        label: 'Drop the trophy',
        detail: 'The trophy rolls into the ditch. The road clears — empty-handed.',
        next: 'gob-fine',
        abandonsObjective: true,
      },
      {
        id: 'gob-ultima-mischia',
        label: 'Stand and fight',
        detail: 'One combat turn. Whoever stays to cover pays.',
        next: 'gob-ultimo-scontro',
      },
    ],
  },
  'gob-ultimo-scontro': {
    id: 'gob-ultimo-scontro',
    kind: 'combat',
    title: 'The last melee',
    body: 'A fight as dry as a bone snapping. The profile decides who pays.',
    transit: 'The last melee is not a battle: it is a debt to settle. Whoever stays to cover pays for everyone.',
    beat: 7,
    /* PLAN-043 WS-4: the last melee takes the wide stage (BV-11 fixture) —
     * expanded + breath before the blows land. */
    stageDirection: { cut: ['expanded', 'reveal', 'impact', 'breath'] },
    combat: {
      turns: 1,
      enemies: 3,
      attackStats: ['str'],
      killPerWin: 3,
      killPerBigwin: 3,
      hitDamage: 25, // placeholder — expectation: almost everyone dies but the hero
      escalateProfile: false,
      nextCleared: 'gob-fine',
      nextSurvivors: 'gob-fine',
    },
  },
  'gob-fine': {
    id: 'gob-fine',
    kind: 'end',
    title: 'Return to the village',
    body: 'The expedition is over.',
    transit: 'The road opens onto the village. Those who return count the names of those who do not — and those who saw it know what it cost.',
    beat: 7,
  },
};

/**
 * Authored scenario literal (pre-parse). The `offer` block is NEW content —
 * not 1:1 with the lab: slot requirements reuse the `StatRequirement`
 * contract; `dangerBandRef`/`rewardBase` are declared placeholders whose value
 * ownership is S2.3 (`questPois`/`rewardTiers`).
 */
export const GOBLIN_SCENARIO_AUTHORED = {
  id: 'goblin',
  title: 'Goblin Extermination',
  flavour: 'The ford is closed by fear. Exterminate them.',
  scenarioVersion: 's2.1-goblin-v1',
  startNode: 'gob-esplora',
  primaryStats: ['str', 'perc'] as LabStat[],
  /* PLAN-036 (R-195): planner key-stat tiers — Forza primary, Percezione
   * secondary (spec §0 verbatim). Display tiers only; `primaryStats` —
   * the frozen simulation input — is untouched. */
  keyStats: { primary: ['str'], secondary: ['perc'] },
  beats: [
    'Assignment',
    'Exploration',
    'Treasure',
    'Assault',
    'Combat',
    'Pursuit',
    'Raid',
    'Return',
  ],
  /* S4 T-2 epilogue seam — what the return report tells beyond the ledger.
   *  Grants ride records that already exist: the outcome (a title on a
   *  victorious return) and authored flavour that always lands. */
  epilogue: {
    titles: [
      {
        label: 'Goblin Exterminators',
        requiresOutcome: ['reward'],
      },
    ],
    lore: [
      {
        label: 'The ashes of the camp still smoke beyond the ford — the merchants’ wagons will see them from far away.',
        requiresOutcome: ['reward', 'survived'],
      },
    ],
  },
  offer: {
    objective: 'Exterminate the goblin camp at the ford.',
    /* WS-3 dispatch line — the terse order under the hero title. */
    dispatch: 'Strike the ford camp before the smoke spreads to the road.',
    tags: ['quest', 'combat', 'goblin'],
    /* Slot gates use the CANONICAL resident statTags vocabulary (role gates:
     * edge/fortitude/warden/ward/clarity/precision — see
     * `mission_planner_data_model_fix.md` §2.2: numeric stat keys are NOT
     * role tags). `statFocus` is the LabStat the slot is expected to bring —
     * it drives the offer↔nodes coverage check. */
    slots: {
      required: [
        {
          id: 'goblin-slot-leader',
          label: 'Expedition leader',
          role: 'leader',
          statFocus: ['str'],
          requirement: { label: 'Expedition leader', anyOf: ['edge', 'fortitude'] },
        },
      ],
      optional: [
        {
          id: 'goblin-slot-member-1',
          label: 'Fighter',
          role: 'member',
          statFocus: ['str', 'agi'],
          requirement: { label: 'Fighter', anyOf: ['edge', 'fortitude', 'warden'] },
        },
        {
          id: 'goblin-slot-member-2',
          label: 'Scout',
          role: 'member',
          statFocus: ['perc', 'int'],
          requirement: { label: 'Scout', anyOf: ['precision', 'clarity'] },
          /* Director 2026-10-10: NO revealAtPlanning on party slots — intel
           * must come from an external scouting system (explorer building/
           * resident — not yet on /game). The slot is a party role only. */
        },
        {
          id: 'goblin-slot-bodyguard',
          label: 'Bodyguard',
          role: 'bodyguard',
          statFocus: ['con', 'str'],
          requirement: { label: 'Bodyguard', anyOf: ['warden', 'fortitude'] },
        },
      ],
    },
    /* Calibration party for `dangerBandRef` — mirrors the lab `gob-band`
     * preset's stats (the party the band was authored against). The parity
     * test re-simulates it; ±1 grade tolerated, ε-borderline passes. */
    referenceParty: [
      { id: 'ref-leader', name: 'Edda', role: 'leader', hp: 100, stats: { str: 70, con: 60, agi: 45, perc: 40, int: 35, cha: 40 } },
      { id: 'ref-m1', name: 'Milo', role: 'member', hp: 60, stats: { str: 60, con: 55, agi: 50, perc: 45, int: 40, cha: 35 } },
      { id: 'ref-m2', name: 'Bruna', role: 'member', hp: 60, stats: { str: 65, con: 60, agi: 40, perc: 35, int: 30, cha: 30 } },
      { id: 'ref-bg', name: 'Kran', role: 'bodyguard', hp: 60, stats: { str: 60, con: 70, agi: 40, perc: 30, int: 20, cha: 20 } },
    ],
    dangerBandRef: 'alta',
    rewardBase: 60,
    /* PLAN-036: ~21:9 planner banner (the goblin totem, scene library). */
    coverArt: '/assets/scene-library/totem-goblin.jpg',
  },
  nodes: GOBLIN_NODES,
} satisfies Omit<QuestScenario, 'primaryStats'> & { primaryStats: LabStat[] };

/** Parsed, validated scenario — the single source consumed by the engine. */
export const GOBLIN_SCENARIO: QuestScenario = parseQuestScenario(GOBLIN_SCENARIO_AUTHORED);
