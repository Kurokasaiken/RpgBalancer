/**
 * QuestScenario «Goblin Extermination» — canonical authored config
 * (PLAN-019-S2.1, T-2: migration 1:1 from `questS1Lab/questScenarioGoblin.ts`;
 * R-135: English re-baseline of all authored prose; R-219: v3 manuscript
 * sync, Director 2026-10-18).
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
/* Nodes — F1..F7 from the authored spec (v3 manuscript).              */
/* ------------------------------------------------------------------ */

const GOBLIN_NODES: Record<string, QuestNode> = {
  /* F0 (ASSIGNMENT) is no longer a node: the consumables the player brings from the village are
   * armed in the planner, so the run opens straight on the first real decision (Director, 2026-10-16).
   * Beats are 0-indexed into `beats` — the 'Assignment' filler entry is gone (v3). */

  /* F1 — EXPLORATION: two alternative checks (v3, Director 2026-10-18).
   * Options name the gesture only — never the stat's purpose or the
   * outcome. PER "Examine the ground" success → stealth bonus (F3);
   * epicfail = a hidden blade, −10 HP wired in the engine. STR+PER
   * "Examine from above" success → opens F2 (from above you spot the
   * hidden stash); fail −10 HP (fall). */
  'gob-esplora': {
    id: 'gob-esplora',
    kind: 'choice',
    title: 'Exploration',
    body: 'The undergrowth narrows the path into a wall of fallen trunks. The thicket is silent on every side, and tells you nothing of who lives in it.',
    transit: 'The trees close out the light behind you. Among the damp ferns the air lies still, smelling of wet moss and rotting wood.',
    beat: 0,
    options: [
      {
        id: 'gob-cerca-tracce',
        label: 'Examine the ground',
        detail: 'Perception',
        next: 'CHECK:gob-tracce-per',
      },
      {
        id: 'gob-forza-tracce',
        label: 'Examine from above',
        detail: 'Strength + Perception',
        next: 'CHECK:gob-tracce-perfor',
      },
    ],
  },
  'gob-tracce-per': {
    id: 'gob-tracce-per',
    kind: 'check',
    title: 'Examine the ground',
    body: 'You crouch where the moss gives way to dark earth, searching the wet leaves for a sign.',
    transit: 'You crouch among the roots. Beneath the leaf litter, the earth still holds marks the wood has not had time to erase.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 0,
    failHint: 'The leaves settle back into place, but your own prints stay pressed in the damp earth.',
    verdictFlavor: {
      /* r008 (artifact, Director 2026-10-19). epicfail: the crash-down
       * through dead branches is what pays the wired −10 HP — the wound
       * narrative lives in the engine log, not the verdict text. */
      bigwin: 'Beneath the rotting leaves, light prints surface — and further on, in the tall grass, the thin glint of a bell wire strung at shin height.',
      win: 'Bare heels in the damp earth and low snapped branches draw a slanting trail that points deeper into the wood.',
      almost: 'Overlapping, muddled prints in the soft ground: someone passed, but the direction dies among the roots.',
      fail: 'Only bare roots and rain-turned soil. The ground yields you nothing.',
      epicfail: 'Your foot gives on the sodden moss and you go down through the dry branches with a crash that bounces through the silence of the wood.',
    },
  },
  'gob-tracce-perfor': {
    id: 'gob-tracce-perfor',
    kind: 'check',
    title: 'Examine from above',
    body: 'The oak’s trunk is damp and rough under your palms; higher up, the dome of leaves closes off everything beyond.',
    transit: 'An old oak rises above the undergrowth. The lowest branches are within reach, but the bark is rough and cracked.',
    stats: ['str', 'perc'],
    risk: { wound: 0, death: 0 },
    beat: 0,
    failHint: 'The wood creaks under your weight. A thin branch bends and snaps back with a sharp crack.',
    verdictFlavor: {
      bigwin: 'From above the wood changes face: a thread of smoke rises straight over the camp’s clearing, the trampling spirals around the fires and, far from the tents, a patch of undergrowth looks put back with too much care, like a stitched wound.',
      win: 'Through the high branches you spot the camp’s grey smoke and, far from the fires, a patch of undergrowth put back with too much care, like a stitched wound.',
      almost: 'The wind opens the fronds for an instant: you glimpse a thread of grey smoke among the treetops before the leaves close over the sight.',
      fail: 'The crown is a green wall and your arms burn from the climb: you come down with bark under your nails, having seen nothing past the trees.',
      epicfail: 'The rotten branch gives with a crack under your weight: you drop through the lower boughs and slam your shoulder into the ground.',
    },
  },

  /* F2 — HIDDEN EVENT (loot): only if "Examine from above" succeeded.
   * v3 (Director 2026-10-18): no check and no leave option — one click
   * recovers the stash. Engine shape: a single-option choice (the node
   * kinds carry no 'reward'); the 'war loot' item lands via the
   * `gob-prendi` grant in questRun's option application, the gold via
   * `grantsGold`. */
  'gob-bottino': {
    id: 'gob-bottino',
    kind: 'choice',
    title: 'What was hidden',
    hidden: true,
    immediate: true,
    body: 'The leaves come away in a single handful. Beneath, in a hide-lined hollow, lies what the goblins buried in secret: you reach in and pull it out.',
    transit: 'The patch of undergrowth set back with too much care is still there, apart from the fires.',
    beat: 1,
    options: [
      {
        id: 'gob-prendi',
        label: 'Recover the loot',
        detail: 'The bundle goes in the bag.',
        next: 'gob-accampamento',
        grantsGold: 12,
      },
    ],
  },

  /* F3 — RULES OF ENGAGEMENT: Stealth (AGI) vs Assault (STR).
   * Same lever (+damage at F4), different risk. */
  'gob-accampamento': {
    id: 'gob-accampamento',
    kind: 'choice',
    title: 'Rules of engagement',
    body: 'Low embers burn at the clearing’s heart. Short shapes move between the crooked tents: all that remains is to choose how to get in.',
    transit: 'Past the last curtain of ferns, the sharp smell of rancid fat hits you in the half-light.',
    beat: 2,
    options: [
      {
        id: 'gob-via-stealth',
        label: 'Move through the shadows',
        detail: 'Agility',
        next: 'CHECK:gob-stealth',
      },
      {
        id: 'gob-via-assalto',
        label: 'Charge with bare steel',
        detail: 'Strength',
        next: 'CHECK:gob-assalto',
      },
    ],
  },
  'gob-stealth': {
    id: 'gob-stealth',
    kind: 'check',
    title: 'Move through the shadows',
    body: 'You advance bent low where the undergrowth’s shadow touches the clearing’s edge, measuring every foothold.',
    stats: ['agi'],
    risk: { wound: 0, death: 0 },
    beat: 2,
    failHint: 'The wire tightens under your weight. A bell quivers, barely.',
    verdictFlavor: {
      bigwin: 'You slip past a bell wire without stirring a breath: you are already behind them while they still stare at the fire.',
      win: 'A step, a pause, another step in the dark. You cross the outer perimeter without a single leaf speaking.',
      almost: 'You brush a bell that sways faintly: near the fire a head turns, then hesitates.',
      fail: 'A wire bites your boot and a bell rasps in the night: the shapes around the fire spring up.',
      epicfail: 'You trip full into a taut wire and the bells erupt in a single sound: the whole camp pours out at you.',
    },
  },
  'gob-assalto': {
    id: 'gob-assalto',
    kind: 'check',
    title: 'Charge with bare steel',
    body: 'You tighten your grip on the hilts and burst out of the scrub, charging straight for the ring of fire.',
    stats: ['str'],
    risk: { wound: 0, death: 0 },
    beat: 2,
    failHint: 'The wood groans under the push. On the other side, something thuds against the barrier.',
    verdictFlavor: {
      bigwin: 'You smash through the entrance barricade on sheer momentum: you are already on top of the fires before the first scream takes shape.',
      win: 'You break the camp’s edge shoulder-first, carrying your blades inside the circle of light.',
      almost: 'The soft ground brakes your boots on the last step: you enter the clearing as the first guards are already rising.',
      fail: 'The mud under your feet snaps the run’s momentum; before the fires the wall of points is already tight.',
      epicfail: 'Your foot slides in the mire at full run: you fall forward against the barricade, guard wide open.',
    },
  },

  /* F4 — COMBAT: X turns of mutual damage, positional targeting with
   * escalation; no instant death — only HP. */
  'gob-combattimento': {
    id: 'gob-combattimento',
    kind: 'combat',
    title: 'Iron and ash',
    body: 'Trampled embers, hoarse screams bouncing between the trunks, and the warm taste of copper on your tongue. Every shape around the coals has teeth and a blade.',
    transit: 'Your breath closes in your throat. Then there is only the sound of iron.',
    previewHint: 'Amid smoke and flame, even the shadows seem to have teeth.',
    beat: 3,
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
      /* r008 attack lines — sensory channels, no tallies (the UI counts). */
      attackLines: {
        bigwin: 'The full weight of your body falls into the cleave and breaks through the guard in front of you.',
        win: 'The dry clash of steel splits the shield-wood, and the noise stays in your ears.',
        almost: 'The fire turns every blade into a crooked flash: the cut bites, but only in passing.',
        fail: 'The blow dies on greased leather and warped wood, leaving your wrist humming on empty air.',
        epicfail: 'The slick ash betrays your heel and a hit from the flank pours the breath back into your throat.',
      },
    },
  },

  /* F5 — PURSUIT: let them flee (heavy ambush) or pursue (STR check with
   * verdict bands: almost = fail-mild, fail/epicfail = milder ambush). */
  'gob-incalzare': {
    id: 'gob-incalzare',
    kind: 'choice',
    title: 'Pursuit',
    body: 'Those still standing throw themselves among the trees without looking back, swallowed piecemeal by the dark: a back, a gasp, a swaying branch.',
    transit: 'The last embers smoke on the trampled earth. Deeper in the wood you hear the frantic rustle of those fleeing into the night.',
    beat: 4,
    options: [
      {
        id: 'gob-lascia-fuggire',
        label: 'Let them flee',
        detail: 'Lower your weapons.',
        next: 'gob-esplora-extra',
        sets: 'agguatoPeggiore', // R-097 v2: letting them go = they regroup → HEAVY ambush at F7
      },
      {
        id: 'gob-insegui',
        label: 'Run them down',
        detail: 'Strength',
        next: 'CHECK:gob-incalza-check',
      },
    ],
  },
  'gob-incalza-check': {
    id: 'gob-incalza-check',
    kind: 'check',
    title: 'Run them down',
    body: 'You dash under the low fronds after the sound of fleeing steps, where the ground drops steep between wet stones and roots.',
    stats: ['str'],
    risk: { wound: 0, death: 0 },
    beat: 4,
    failHint: 'A slab shifts under the weight of your boots. The scree grants no safe step.',
    previewHint: 'Among the rocks, every turn erases for an instant what waits beyond.',
    verdictFlavor: {
      bigwin: 'You reach them where the gorge narrows, and the wood goes suddenly mute.',
      win: 'Your stride outruns theirs on the stone rise: the rustling ahead dies beneath your blows.',
      almost: 'Your throat burns at every breath; you catch them down at the gorge’s end, but the thicket closes over the faster backs.',
      fail: 'The wet stones betray your step and the thicket takes them back before the blades arrive.',
      epicfail: 'You slide down the escarpment, striking hard against living rock, while the fleeing steps are lost.',
    },
    // R-097 v2: the deterministic price of the chase itself — escaping
    // goblins are bloodied → the ambush is the mild one.
    upfrontDamage: { amount: 10, epicfailAmount: 20 },
  },

  /* F6 — KEEP EXPLORING: push-your-luck, damage grows 5→10→15. */
  'gob-esplora-extra': {
    id: 'gob-esplora-extra',
    kind: 'choice',
    title: 'Among the ashes',
    body: 'Around the dead embers lie torn tarps and heaps of smouldering straw the flame has not yet fully consumed.',
    transit: 'Silence falls again over the ruined clearing, broken only by the creak of fire-blackened wood.',
    beat: 5,
    options: [
      {
        id: 'gob-fruga',
        label: 'Rummage through the embers',
        detail: 'Intelligence or Perception',
        next: 'CHECK:gob-cerca',
      },
      {
        id: 'gob-fermati',
        label: 'Stop here',
        detail: 'You have seen enough.',
        next: 'gob-ritorno',
      },
    ],
  },
  'gob-cerca': {
    id: 'gob-cerca',
    kind: 'check',
    title: 'Rummage through the embers',
    body: 'You lift the blackened tarps with the flat of your blade, groping through the acrid warmth rising from the camp’s remains.',
    stats: ['int', 'perc'],
    risk: { wound: 0, death: 0 },
    beat: 5,
    failHint: 'A beam creaks above you. A rain of ash falls to the ground.',
    previewHint: 'The smoke veils the camp again; the burnt wood gives at the slightest knock.',
    verdictFlavor: {
      bigwin: 'Under the deepest layer your fingers meet the heavy leather of a chest spared by the flames.',
      win: 'From the blackened remains you pull out what the fire failed to devour.',
      almost: 'A short grab in the smoke, while a burnt support gives way a breath from your shoulder.',
      fail: 'Only warm ash clinging to your palms through the gloves.',
      epicfail: 'The tent’s blackened beam gives with a crash, pouring a rain of burning embers and split wood over you.',
    },
  },

  /* F7 — RETURN / AMBUSH. 'gob-ritorno' routes: extermination → end clean;
   * else → ambush (5 dry dmg to all) → drop trophy OR last stand.
   * PLAN-053 T-004: the whole cluster is `fase:'ritorno'` — road beats on
   * the way home; only 'gob-ritorno' and 'gob-fine' carry authored pins
   * (questPois.fasi), the ambush chain inherits the reaching pin. */
  'gob-ritorno': {
    id: 'gob-ritorno',
    kind: 'info',
    fase: 'ritorno',
    title: 'The return',
    body: 'The air turns colder beneath the high crowns. Someone loosens their grip on the hilt — then a branch snaps where the wind does not blow.',
    next: 'gob-agguato',
    beat: 6,
    /* PLAN-043 WS-4: the way home is a J-cut — the whistling dies before
     * the ambush image lands. */
    stageDirection: { cut: ['j-cut', 'reveal'] },
  },
  'gob-agguato': {
    id: 'gob-agguato',
    kind: 'harm',
    fase: 'ritorno',
    title: 'Those who were left',
    /* r008: the survivors were WAITING — they tracked you, still carrying
     * the smoke of their camp. Rage and revenge drive the attack. */
    body: 'The surviving goblins were waiting for you. They still carry the smoke of their camp on them: they tracked you all the way here, and now they step out of the fronds without a cry, teeth already bared.',
    next: 'gob-agguato-scelta',
    previewHint: 'Among the trees, the shadows move before you can make out the bodies.',
    revealHint: 'The fugitives’ tracks criss-cross around the trail. They did not end up here by chance.',
    beat: 6,
    /* PLAN-043 WS-4: the ambush is a tone change — bars close, the stage
     * jolts, the scene opens through the aperture. */
    stageDirection: { cut: ['bars', 'reveal', 'impact'] },
  },
  'gob-agguato-scelta': {
    id: 'gob-agguato-scelta',
    kind: 'choice',
    fase: 'ritorno',
    title: 'Encircled',
    body: 'Low blades close off the path between the trees, and the snarling rises on every side.',
    transit: 'The arrows still quiver in the trunks around you.',
    beat: 6,
    options: [
      {
        id: 'gob-molla-trofeo',
        label: 'Leave the trophy',
        detail: 'The trophy hits the dirt.',
        next: 'gob-fine',
        abandonsObjective: true,
      },
      {
        id: 'gob-ultima-mischia',
        label: 'Stand and fight',
        detail: 'Steel drawn.',
        next: 'gob-ultimo-scontro',
      },
    ],
  },
  'gob-ultimo-scontro': {
    id: 'gob-ultimo-scontro',
    kind: 'combat',
    fase: 'ritorno',
    title: 'The last assault',
    body: 'They throw themselves on your shields heedless of the steel; from their throats comes no word any more, only a long low breath, teeth clenched.',
    transit: 'Shoulder to shoulder. The impact comes from every side.',
    beat: 6,
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
      /* r008 attack lines — the survivors' last fury, sensory only. */
      attackLines: {
        bigwin: 'All the melee’s fury pours into a single cleave, and the circle opens.',
        win: 'Steel answers steel with a short sound that cuts the snarl.',
        almost: 'The blades seek each other in the dim light and meet only halfway.',
        fail: 'Teeth grate on the shield while the line holds by a breath.',
        epicfail: 'A counterblow out of the dark takes the ground from under your feet for one endless instant.',
      },
    },
  },
  'gob-fine': {
    id: 'gob-fine',
    kind: 'end',
    fase: 'ritorno',
    title: 'Cold ash',
    /* r008: poetic closer — 'the smoke calls no one any more'. The ledger
     * is composeEndingText's job, not the prose's. */
    body: 'Your hands still bear the mark of the night, while the trees’ shadow closes behind you. Deep in the thicket the smoke still rises straight — but it calls no one any more.',
    transit: 'The trees thin into the grey of dawn; the smell of smoke and iron stays stitched to you.',
    beat: 6,
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
  flavour: 'The wood has gone quiet. The goblins have not.',
  scenarioVersion: 's2.1-goblin-v3',
  startNode: 'gob-esplora',
  primaryStats: ['str', 'perc'] as LabStat[],
  /* PLAN-036 (R-195): planner key-stat tiers — Forza primary, Percezione
   * secondary (spec §0 verbatim). Display tiers only; `primaryStats` —
   * the frozen simulation input — is untouched. */
  keyStats: { primary: ['str'], secondary: ['perc'] },
  /* v3 beats — 7 phases, 0-indexed from the first real decision; the
   * 'Assignment' filler is gone with F0 (Director 2026-10-18). */
  beats: [
    'Exploration',
    'Loot',
    'Rules of Engagement',
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
        label: 'The ashes of the camp still smoke among the trees — seen from the hills, the forest has already closed over them.',
        requiresOutcome: ['reward', 'survived'],
      },
    ],
  },
  offer: {
    objective: 'Exterminate the goblin camp.',
    /* WS-3 dispatch line — the terse order under the hero title. */
    dispatch: 'Follow their tracks to the camp. None of them must come back to threaten the village.',
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
