/**
 * impr002Palude — catalog imprint «Il traghetto della cassa»
 * (IMPR-002 × kit palude, R-152: compilazione imprint→grafo).
 *
 * The first compiled imprint: the narrative skeleton of `QUEST_IMPRINTS.md`
 * IMPR-002 «Il compagno che ride» (L'Isola del Tesoro) emitted as a REAL
 * `QuestScenario` riding the 'gen' engine profile — every check carries a
 * `verdictTable`, routing is declarative (`goto` branches on flags/vars),
 * run vars + trait-gated armRolls ride the ScenarioInstance. No engine
 * switch entries, no authored-quest id: it runs exactly like the generated
 * catalog (createScenarioInstance → createRun questId 'gen').
 *
 * Beat → mechanics compilation (the reusable contract):
 *   B0 PREMISE   offer + first fork — the missing means is the help itself:
 *                his bargemen (easy ride, his men inside your approach) vs
 *                the peat walkways (a toll check, but you arrive unseen).
 *   B1 THE HELP  'uomini-di-a' flag — a real price paid later, at the turn.
 *   B2 CRACKS    `sospetto` var: three one-shot channels (watch / ask / the
 *                prudent one's nose — trait-armed) — each earns +1, each
 *                fires once (`segna-*` flags), epicfail arms 'annusati'.
 *   B3 THE TURN  `im-schieramento` routes on post-effect state: 'pronti'
 *                flag (unseen approach or confirmed read) → surprise round;
 *                sospetto≥2 → confirmation read; 'annusati' → heavier toll;
 *                else → the trap lands on you. All three land inside HIS
 *                disposition — the read only changes who hits first.
 *   B4 INSIDE-OUT forza (4-turn combat, outnumbered on his water), sorpresa
 *                (2-turn combat — the cracks payoff), fuga (agi extraction),
 *                recita (cha — bluff into a share; fail once and the option
 *                is gone: 'smascherati').
 *   B5 IRONY     `im-cassa`: whoever holds the site finds the chest already
 *                emptied — 'posta-mossa' on every row; only a good read
 *                finds 'depositario-traccia' (the chain seed: who moved the
 *                stake). Even the winning side won a ghost.
 *   B6 FORK      flags the run writes for the world: 'a-consegnato' (reward
 *                path — the prisoner delivered), 'a-fuggito' (he slipped
 *                back into his channels — recurring-entity seed), 'a-padrone'
 *                (he kept the water), 'soci-onorati' / 'soci-traditi'.
 *                TAKEN≠SECURED: the prisoner is the prize — `im-trasporto`
 *                convoys him home, and its fail branch IS the 'a-fuggito'
 *                escape (the chain seed lives in a failed check).
 *
 * English authored prose (R-135 baseline). The module parses itself at
 * import — `IMPR002_PALUDE_SCENARIO` is the validated scenario.
 */

import type { LabStat, QuestNode } from '@/ui/idleVillage/questS1Lab/questScenario';
import {
  parseQuestScenario,
  type QuestScenario,
} from '@/balancing/config/idleVillage/quests/questScenario.schema';

const inc = (v: string, n: number) => ({ var: v, op: 'inc' as const, value: n });

/* The turn router — every verdict of `im-schieramento` resolves the same
 * conditional exit: readiness first (the approach decides who strikes
 * first), suspicion second (the cracks earn a last read), spotted-prying
 * third (they were waiting for exactly you), else the trap lands blind. */
const TURN_GOTO = {
  branches: [
    { when: { flag: 'pronti' }, then: 'im-disposti' },
    { when: { varGE: { var: 'sospetto', value: 2 } }, then: 'im-lettura' },
    { when: { flag: 'annusati' }, then: 'im-imboscata' },
  ],
  else: 'im-trappola',
};

const IMPR002_NODES: Record<string, QuestNode> = {
  /* ---- B0 — PREMISE: the missing means is the help itself --------------- */
  'im-partenza': {
    id: 'im-partenza',
    kind: 'choice',
    title: 'The sunken chest',
    body: 'A marriage chest of documents and dowry sank in the inner canals years ago — and tonight the village needs it, or what it was worth, to close a deal. You have no boats and no one who knows the water. The lock-keeper does: he offers his bargemen, his poles, his channels — «for the good of the village».',
    transit: 'The locks answer to his hands. Everyone here owes him a dry crossing or a drowned one.',
    beat: 0,
    options: [
      {
        id: 'im-accetta',
        label: 'Take his bargemen',
        detail: 'Fast, dry, guided — his men row you through his water. Accepting means his men inside your approach.',
        next: 'im-canali',
        sets: 'uomini-di-a',
      },
      {
        id: 'im-rifiuta',
        label: 'Take the peat walkways',
        detail: 'Strength + Constitution — mud, rot, and no one watching your backs. But nobody sees you coming, either.',
        next: 'CHECK:im-passerelle',
        sets: 'senza-guida',
      },
    ],
  },

  /* ---- B1 — THE HELP: the ride is smooth, the loyalty is not yours ------ */
  'im-canali': {
    id: 'im-canali',
    kind: 'info',
    title: 'On his barges',
    body: 'His men row without a wasted stroke. They know every channel, every sunken fence — and they take their orders from his gestures, not from your leader. The ride is easy. That is exactly the problem.',
    transit: 'The barge slides where a boat should not fit. The bargemen watch his hands before they answer you.',
    next: 'im-segnali',
    beat: 1,
  },
  'im-passerelle': {
    id: 'im-passerelle',
    kind: 'check',
    title: 'The peat walkways',
    body: 'Half-sunken planks over black water. The long way — and the way nobody watches.',
    stats: ['str', 'con'],
    risk: { wound: 14, death: 3 },
    risky: true,
    failHint: 'the peat takes its toll — and you arrive loud.',
    beat: 1,
    verdictFlavor: {
      bigwin: 'You cross like herons — dry boots, steady boards, and no lantern ever turns your way.',
      win: 'A hard crossing, but a clean one: the water never learns your names.',
      almost: 'Someone goes in to the waist. You pull them out and keep moving — wetter, unseen.',
      fail: 'A walkway gives — the splash carries. You climb out loud and bleeding.',
      epicfail: 'The peat swallows the path and half your nerve. You arrive soaked, hurt, and announced.',
    },
    verdictTable: {
      /* An unseen approach IS readiness: the surprise round is earned here. */
      win: { setFlags: ['pronti'], goto: 'im-segnali' },
      bigwin: { setFlags: ['pronti'], log: 'Unseen and unheard — the water keeps your secret.', goto: 'im-segnali' },
      almost: { goto: 'im-segnali' },
      fail: { damage: 8, goto: 'im-segnali' },
      epicfail: { damage: 15, goto: 'im-segnali' },
    },
  },

  /* ---- B2 — CRACKS: three one-shot channels feed `sospetto` ------------- */
  'im-segnali': {
    id: 'im-segnali',
    kind: 'choice',
    title: 'Small wrong things',
    body: 'Nothing is wrong that you could swear to — and several things are wrong. The bargemen watch his hands, not the water. He names channels he has «never worked». Every crack has an innocent reading. You can collect them, or let them go.',
    transit: 'The kind of nothing that keeps a prudent mind awake.',
    beat: 2,
    options: [
      {
        id: 'im-osserva',
        label: 'Watch his men',
        detail: 'Perception. One careful look at who they really answer to — one look is all a careful look gets.',
        next: 'CHECK:im-osserva',
        hiddenIfFlag: 'segna-gesti',
      },
      {
        id: 'im-domande',
        label: 'Ask at the locks',
        detail: 'Charisma + Intellect. The gatherers talk — if you know how to listen to people who are afraid of him.',
        next: 'CHECK:im-domande',
        hiddenIfFlag: 'segna-voci',
      },
      {
        id: 'im-fiuto',
        label: 'The prudent one’s nose',
        detail: 'Perception. Someone in your party smelled this days ago — let them show you what.',
        next: 'CHECK:im-fiuto',
        requiresFlag: 'fiuto-prudente',
        hiddenIfFlag: 'segna-fiuto',
      },
      {
        id: 'im-lascia',
        label: 'Let it slide — the water is calm',
        detail: 'You reach the landing as you are: trusting, or blind.',
        next: 'CHECK:im-schieramento',
      },
    ],
  },
  'im-osserva': {
    id: 'im-osserva',
    kind: 'check',
    title: 'Reading the bargemen',
    body: 'They work like a crew that has done this together for years — for him, not for whoever pays the day’s wage.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 2,
    verdictFlavor: {
      bigwin: 'Every gesture maps to him: the hand signal, the glance before they move, the way they space you on the deck.',
      win: 'They take orders from his hands. The mission is a passenger — they are not.',
      almost: 'Something in how they space you on the deck. A hunch, not a proof.',
      fail: 'Competent men doing a job. Nothing a fair judge could object to.',
      epicfail: 'One of them catches you watching — and marks it.',
    },
    verdictTable: {
      bigwin: { vars: [inc('sospetto', 1)], setFlags: ['segna-gesti'], setInfo: ['fedeli-ad-a'], log: 'The bargemen are his — every order runs through his hands.', goto: 'im-segnali' },
      win: { vars: [inc('sospetto', 1)], setFlags: ['segna-gesti'], setInfo: ['fedeli-ad-a'], goto: 'im-segnali' },
      almost: { vars: [inc('sospetto', 1)], setFlags: ['segna-gesti'], goto: 'im-segnali' },
      fail: { setFlags: ['segna-gesti'], goto: 'im-segnali' },
      epicfail: { setFlags: ['segna-gesti', 'annusati'], log: 'They noticed you watching. Now they are watching back.', goto: 'im-segnali' },
    },
  },
  'im-domande': {
    id: 'im-domande',
    kind: 'check',
    title: 'Words at the locks',
    body: 'A raccoglitrice sells river herbs at the toll and talks to everyone. The question is whether anyone talks back — about him.',
    stats: ['cha', 'int'],
    risk: { wound: 0, death: 0 },
    beat: 2,
    verdictFlavor: {
      bigwin: 'The gatherer answers late and low: «his lamps do not mark the way. They mark the prey.»',
      win: 'Rumours priced like merchandise: men who crossed him still owe him crossings.',
      almost: 'A half-warning, retracted as soon as spoken.',
      fail: 'Smiles, weather, herbs. Nobody here discusses the water.',
      epicfail: 'Your question travels the locks faster than you do.',
    },
    verdictTable: {
      bigwin: { vars: [inc('sospetto', 1)], setFlags: ['segna-voci'], setInfo: ['avviso-tardivo'], log: '«His lamps mark the prey» — the warning arrives late, but it arrives.', goto: 'im-segnali' },
      win: { vars: [inc('sospetto', 1)], setFlags: ['segna-voci'], setInfo: ['avviso-tardivo'], goto: 'im-segnali' },
      almost: { vars: [inc('sospetto', 1)], setFlags: ['segna-voci'], goto: 'im-segnali' },
      fail: { setFlags: ['segna-voci'], goto: 'im-segnali' },
      epicfail: { setFlags: ['segna-voci', 'annusati'], log: 'Your interest is now a fact he owns.', goto: 'im-segnali' },
    },
  },
  'im-fiuto': {
    id: 'im-fiuto',
    kind: 'check',
    title: 'What the prudent one smelled',
    hidden: true,
    body: 'The careful member of your party kept their doubts quiet — until now. Show me what you saw, you say. They do.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 2,
    verdictFlavor: {
      bigwin: 'A catalogue: the loaded pole-ends, the spare rope under the thwarts, the channel he «forgot» to name.',
      win: 'The barges carry more rope and more men than a salvage trip needs.',
      almost: 'A list of small things that add up to a posture, not a proof.',
      fail: 'Even the prudent one only has a smell — but the smell is real.',
      epicfail: 'They recount it loudly enough to be overheard.',
    },
    verdictTable: {
      bigwin: { vars: [inc('sospetto', 1)], setFlags: ['segna-fiuto'], setInfo: ['fedeli-ad-a'], goto: 'im-segnali' },
      win: { vars: [inc('sospetto', 1)], setFlags: ['segna-fiuto'], setInfo: ['fedeli-ad-a'], goto: 'im-segnali' },
      almost: { vars: [inc('sospetto', 1)], setFlags: ['segna-fiuto'], goto: 'im-segnali' },
      fail: { vars: [inc('sospetto', 1)], setFlags: ['segna-fiuto'], goto: 'im-segnali' },
      epicfail: { vars: [inc('sospetto', 1)], setFlags: ['segna-fiuto'], goto: 'im-segnali' },
    },
  },

  /* ---- B3 — THE TURN: the plan was always his --------------------------- */
  'im-schieramento': {
    id: 'im-schieramento',
    kind: 'check',
    title: 'The landing',
    body: 'The chest site opens ahead — and his men are already positioned around it, exactly where a recovery crew would not stand. Whatever you suspected, the disposition answers for him: the expedition was his vehicle. You were the escort of your own trap.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 3,
    verdictFlavor: {
      bigwin: 'You read the whole shape of it before the first pole comes up — every man, every angle, every way out he thinks he owns.',
      win: 'You see it: the spacing, the loaded poles, the channel behind them already crewed.',
      almost: 'You catch the shape late — enough to know it is a shape.',
      fail: 'It takes you a breath too long to understand what you are looking at.',
      epicfail: 'You are still counting men when the first pole rises.',
    },
    verdictTable: {
      bigwin: { goto: TURN_GOTO },
      win: { goto: TURN_GOTO },
      almost: { goto: TURN_GOTO },
      fail: { goto: TURN_GOTO },
      epicfail: { goto: TURN_GOTO },
    },
  },
  'im-disposti': {
    id: 'im-disposti',
    kind: 'info',
    title: 'You came unseen',
    body: 'From the last walkway you watch his men take positions meant for a party that should never have seen them. He planned a trap for passengers — and you are not passengers. The water is his. The first move is yours.',
    transit: 'You count his men while they count a trap that is not there.',
    next: 'im-scelta',
    beat: 3,
  },
  'im-lettura': {
    id: 'im-lettura',
    kind: 'check',
    title: 'The pieces assemble',
    body: 'Every crack you collected lands at once: the hands, the lamps, the rope. You are not surprised — but knowing and acting are two different check rolls.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 3,
    verdictFlavor: {
      bigwin: 'You move before his hands finish the signal — the cracks were worth every minute.',
      win: 'You are ready when it springs. The cracks paid.',
      almost: 'You catch it a breath late — late enough to lose the first word, not the first move.',
      fail: 'You had every clue and still freeze — the meaning arrives with the poles.',
      epicfail: 'The clues were there. You assembled them a heartbeat too late.',
    },
    verdictTable: {
      bigwin: { setFlags: ['pronti'], goto: 'im-scelta' },
      win: { setFlags: ['pronti'], goto: 'im-scelta' },
      almost: { setFlags: ['pronti'], goto: 'im-scelta' },
      fail: { goto: 'im-scelta' },
      epicfail: { goto: 'im-scelta' },
    },
  },
  'im-trappola': {
    id: 'im-trappola',
    kind: 'check',
    title: 'It lands on you',
    body: 'The poles come up together — a cordon, not a crew. «Put the tools down,» he says, pleasant as a lock gate closing. You walk into it open-eyed now, but it is open eyes at knife-point.',
    stats: ['agi'],
    risk: { wound: 15, death: 4 },
    risky: true,
    upfrontDamage: { amount: 12 },
    failHint: 'the cordon closes first — surprise was his, not yours.',
    beat: 3,
    verdictTable: {
      bigwin: { goto: 'im-scelta' },
      win: { goto: 'im-scelta' },
      almost: { goto: 'im-scelta' },
      fail: { damage: 8, goto: 'im-scelta' },
      epicfail: { damage: 15, goto: 'im-scelta' },
    },
  },
  'im-imboscata': {
    id: 'im-imboscata',
    kind: 'check',
    title: 'He knew you knew',
    body: 'Your questions reached him before you reached the site. The cordon is already set and watching the approach he expects — you. «Careful,» he calls, friendly. «The ground is bad where you are standing.»',
    stats: ['agi'],
    risk: { wound: 20, death: 6 },
    risky: true,
    upfrontDamage: { amount: 20 },
    failHint: 'prepared for exactly you — the toll is heavier.',
    beat: 3,
    verdictTable: {
      bigwin: { goto: 'im-scelta' },
      win: { goto: 'im-scelta' },
      almost: { goto: 'im-scelta' },
      fail: { damage: 10, goto: 'im-scelta' },
      epicfail: { damage: 20, goto: 'im-scelta' },
    },
  },

  /* ---- B4 — INSIDE OUT: his water, his men, your move ------------------- */
  'im-scelta': {
    id: 'im-scelta',
    kind: 'choice',
    title: 'Inside his disposition',
    body: 'The chest site, the cordon, the channels behind him that only he crewed. Force means his numbers on his water. Flight means the walkways at speed. Or you can keep playing the expedition — and split what he was going to take alone.',
    transit: 'The kind of position you only get out of by paying.',
    beat: 4,
    options: [
      {
        id: 'im-primo-colpo',
        label: 'Strike first — you saw it coming',
        detail: 'A two-turn fight on your timing, not his. The surprise is yours: it ends fast, one way or the other.',
        next: 'im-scontro-sorpresa',
        requiresFlag: 'pronti',
      },
      {
        id: 'im-via-forza',
        label: 'Fight the cordon',
        detail: 'A four-turn fight — his numbers, his water, his terms. It will cost blood whether it works or not.',
        next: 'im-scontro',
      },
      {
        id: 'im-via-fuga',
        label: 'Run the walkways',
        detail: 'Agility. Out of his cordon and gone — he keeps the water, you keep your skin.',
        next: 'CHECK:im-ritirata',
      },
      {
        id: 'im-via-recita',
        label: 'Play the expedition',
        detail: 'Charisma. Smile, split the recovery, walk out partners. If he reads the bluff, you do not get to offer twice.',
        next: 'CHECK:im-farsa',
        hiddenIfFlag: 'smascherati',
      },
    ],
  },
  'im-scontro-sorpresa': {
    id: 'im-scontro-sorpresa',
    kind: 'combat',
    title: 'Your ambush',
    body: 'You were the escort of your own trap — so you spring yours first.',
    transit: 'The moment is chosen. His cordon turns toward the wrong direction.',
    previewHint: 'A short, brutal fight on your terms — the surprise round you earned.',
    beat: 4,
    combat: {
      turns: 2,
      enemies: 4,
      attackStats: ['str', 'agi'],
      killPerWin: 2,
      killPerBigwin: 3,
      hitDamage: 7,
      escalateProfile: false,
      nextCleared: 'im-a-piede',
      nextSurvivors: 'im-rotti',
      enemyName: 'Bargemen',
      attackLines: {
        bigwin: 'You hit the cordon where it was watching the wrong water.',
        win: 'First blood is yours — the trap springs backwards.',
        almost: 'A ragged strike — they reel, but they answer.',
        fail: 'Your surprise meets his poles — it still hurts them less than it should.',
        epicfail: 'The strike comes apart in your hands — now they know everything.',
      },
      clearedText: 'The cordon breaks. His water, your field — the lock-keeper is on his knees.',
      survivorsText: 'The surprise bought you a moment, not the field — his men close around it again.',
      holdingText: 'Turn {turn} closed — his bargemen still hold the cordon ({left} standing).',
    },
  },
  'im-scontro': {
    id: 'im-scontro',
    kind: 'combat',
    title: 'The cordon',
    body: 'Poles against steel, on a raft in his channels. You are inside his disposition — the only way out is through.',
    transit: 'The water closes around the fight like a second opponent.',
    previewHint: 'A long fight on his terms — expect to pay in blood for every meter.',
    beat: 4,
    combat: {
      turns: 4,
      enemies: 5,
      attackStats: ['str', 'con'],
      killPerWin: 2,
      killPerBigwin: 3,
      hitDamage: 10,
      escalateProfile: true,
      nextCleared: 'im-a-piede',
      nextSurvivors: 'im-rotti',
      enemyName: 'Bargemen',
      attackLines: {
        bigwin: 'A gap in the cordon — you drive the whole party through it.',
        win: 'You break one end of his line before it can close.',
        almost: 'You trade blows with men who fight for their river.',
        fail: 'The poles find their range — his men know this water better than your steel knows it.',
        epicfail: 'The cordon contracts around you like a lock gate.',
      },
      clearedText: 'The cordon breaks apart on his own water. The lock-keeper stands alone.',
      survivorsText: 'The cordon holds — barely, but it holds. His men are still between you and everything.',
      holdingText: 'Turn {turn} closed — the cordon still stands ({left} poles up).',
    },
  },
  'im-ritirata': {
    id: 'im-ritirata',
    kind: 'check',
    title: 'The walkways at speed',
    body: 'You break for the peat — half-sunken planks, black water, his men knowing every plank. Getting out means trusting the ground he did not expect you to use.',
    stats: ['agi'],
    risk: { wound: 18, death: 5 },
    risky: true,
    failHint: 'they cut the walkway behind you — the escape still works, at a price.',
    beat: 4,
    verdictFlavor: {
      bigwin: 'You are already on the second walkway when his men reach the first.',
      win: 'Mud, a held breath, a sprint — the cordon loses you in the reeds.',
      almost: 'You get out with your lungs burning and his curses in your ears.',
      fail: 'They cut the walkway behind you — out is out, but it costs.',
      epicfail: 'The planks give under the sprint — you crawl out bleeding, but you crawl out.',
    },
    verdictTable: {
      bigwin: { setFlags: ['a-padrone'], goto: 'im-ritorno' },
      win: { setFlags: ['a-padrone'], goto: 'im-ritorno' },
      almost: { setFlags: ['a-padrone'], goto: 'im-ritorno' },
      fail: { setFlags: ['a-padrone'], damage: 10, goto: 'im-ritorno' },
      epicfail: { setFlags: ['a-padrone'], damage: 18, goto: 'im-ritorno' },
    },
  },
  'im-farsa': {
    id: 'im-farsa',
    kind: 'check',
    title: 'The performance',
    body: 'You keep playing the expedition he wrote: polite, useful, blind. The question is who is performing for whom — you offer to split the recovery as if there were nothing to forgive.',
    stats: ['cha'],
    risk: { wound: 0, death: 0 },
    beat: 4,
    verdictFlavor: {
      bigwin: 'He laughs — the real one, the one that respects a player. «Partners, then.»',
      win: 'He weighs you, smiles, and puts the poles down. A deal is a deal — on his water.',
      almost: 'He plays along watching you the whole time — a partnership with a hand on the knife.',
      fail: 'His smile does not change, but his men shift their grip. He read you.',
      epicfail: 'He applauds the performance — then names what you were doing, out loud, in front of his men.',
    },
    verdictTable: {
      bigwin: { goto: 'im-soci' },
      win: { goto: 'im-soci' },
      almost: { goto: 'im-soci' },
      fail: { setFlags: ['smascherati'], damage: 6, log: 'He read the bluff — the offer is gone from the table.', goto: 'im-scelta' },
      epicfail: { setFlags: ['smascherati'], damage: 12, log: 'Unmasked in front of his men — you will not get to offer twice.', goto: 'im-scelta' },
    },
  },
  'im-a-piede': {
    id: 'im-a-piede',
    kind: 'choice',
    title: 'The lock-keeper, kneeling',
    body: 'His men are gone or fled, his cordon broken on his own water. He kneels in the mud of his lock — polite even now, a man already pricing the future. He knows every channel, every debt, every drowned secret in the palude.',
    transit: 'The water goes quiet. Even the reeds seem to wait for your call.',
    beat: 4,
    options: [
      {
        id: 'im-lega',
        label: 'Bind him — he answers to the village',
        detail: 'The man who controlled the water, delivered. That is worth more to the village than the chest ever was — if you get him home.',
        next: 'CHECK:im-cassa',
        sets: 'a-prigioniero',
      },
      {
        id: 'im-lascialo',
        label: 'Let him crawl away',
        detail: 'He will vanish into his own channels. The water keeps its keeper — and you keep your hands clean of a fight you already won.',
        next: 'CHECK:im-cassa',
        sets: 'a-fuggito',
      },
    ],
  },
  'im-soci': {
    id: 'im-soci',
    kind: 'choice',
    title: 'His hand, extended',
    body: 'Partners in the recovery, then — his smile says he respects the play, and his eyes say he prices it too. The chest is below; the split is above. Shake on it, or walk away from the only offer on the water.',
    beat: 4,
    options: [
      {
        id: 'im-stretta',
        label: 'Take the deal — split the recovery',
        detail: 'Partners. He pays a share for silence, and a share of whatever the bottom still holds.',
        next: 'CHECK:im-cassa',
        sets: 'soci',
      },
      {
        id: 'im-niente-accordo',
        label: 'No deal — back off',
        detail: 'You do not shake a hand that was on a knife a minute ago. He keeps his water; you keep your options.',
        next: 'CHECK:im-cassa-lontana',
        sets: 'a-padrone',
      },
    ],
  },
  'im-rotti': {
    id: 'im-rotti',
    kind: 'choice',
    title: 'The water is still his',
    body: 'The cordon holds — barely, but it holds, and bleeding on his raft is a bet that gets worse every breath. You back off through the reeds while his men watch you go.',
    beat: 4,
    options: [
      {
        id: 'im-indietro',
        label: 'Back off and watch from the walkway',
        detail: 'You keep your distance and your lives — and you get to watch what he came for.',
        next: 'CHECK:im-cassa-lontana',
        sets: 'a-padrone',
      },
    ],
  },

  /* ---- B5 — IRONY: the stake was moved before the game began ------------- */
  'im-cassa': {
    id: 'im-cassa',
    kind: 'check',
    title: 'The chest, at last',
    body: 'Below the silt line, exactly where the old ledger said. You raise it with ropes and expectation — and it answers wrong: too light, too loose at the hinges. It was opened and emptied a long time ago. Everyone on this water has been fighting over a ghost.',
    stats: ['perc', 'int'],
    risk: { wound: 0, death: 0 },
    beat: 5,
    verdictFlavor: {
      bigwin: 'The silt tells you more than the chest: emptied years ago, carefully, by someone who knew it was there — and who it belonged to.',
      win: 'Emptied long ago — but the way it was emptied is itself information.',
      almost: 'Empty. The only question left is who knew first.',
      fail: 'Empty. Whatever answer the silt held, it slips through your hands.',
      epicfail: 'Empty, and the lid drops a finger on it besides.',
    },
    verdictTable: {
      bigwin: {
        setFlags: ['posta-mossa'],
        setInfo: ['depositario-traccia'],
        goldDelta: 15,
        log: 'Scraps in the false bottom — and a trace of who emptied it first.',
        goto: {
          branches: [
            { when: { flag: 'a-prigioniero' }, then: 'im-trasporto' },
            { when: { flag: 'soci' }, then: 'im-patto' },
          ],
          else: 'im-ritorno',
        },
      },
      win: {
        setFlags: ['posta-mossa'],
        setInfo: ['depositario-traccia'],
        goto: {
          branches: [
            { when: { flag: 'a-prigioniero' }, then: 'im-trasporto' },
            { when: { flag: 'soci' }, then: 'im-patto' },
          ],
          else: 'im-ritorno',
        },
      },
      almost: {
        setFlags: ['posta-mossa'],
        goto: {
          branches: [
            { when: { flag: 'a-prigioniero' }, then: 'im-trasporto' },
            { when: { flag: 'soci' }, then: 'im-patto' },
          ],
          else: 'im-ritorno',
        },
      },
      fail: {
        setFlags: ['posta-mossa'],
        goto: {
          branches: [
            { when: { flag: 'a-prigioniero' }, then: 'im-trasporto' },
            { when: { flag: 'soci' }, then: 'im-patto' },
          ],
          else: 'im-ritorno',
        },
      },
      epicfail: {
        setFlags: ['posta-mossa'],
        damage: 5,
        goto: {
          branches: [
            { when: { flag: 'a-prigioniero' }, then: 'im-trasporto' },
            { when: { flag: 'soci' }, then: 'im-patto' },
          ],
          else: 'im-ritorno',
        },
      },
    },
  },
  'im-cassa-lontana': {
    id: 'im-cassa-lontana',
    kind: 'check',
    title: 'The chest, from the walkway',
    body: 'You watch him raise it — and watch his face when the ropes come up too easy. The curse he spits across the water is the answer you would have paid blood for: it was empty. For him too.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 5,
    verdictFlavor: {
      bigwin: 'You even catch what he mutters after — a name. The man who could have emptied it first.',
      win: 'Empty — for him as much as for you. The ghost took everyone.',
      almost: 'His men carry it off empty. You read the defeat in their shoulders.',
      fail: 'Too far to read more than the shape of disappointment.',
      epicfail: 'A pole cracks against the water — you duck lower than the sound.',
    },
    verdictTable: {
      bigwin: { setFlags: ['posta-mossa'], setInfo: ['depositario-traccia'], goto: 'im-ritorno' },
      win: { setFlags: ['posta-mossa'], goto: 'im-ritorno' },
      almost: { setFlags: ['posta-mossa'], goto: 'im-ritorno' },
      fail: { setFlags: ['posta-mossa'], goto: 'im-ritorno' },
      epicfail: { setFlags: ['posta-mossa'], goto: 'im-ritorno' },
    },
  },
  'im-patto': {
    id: 'im-patto',
    kind: 'check',
    title: 'The letter of the deal',
    body: 'Partners in a recovery that recovered a ghost. Now you hold him to the letter: a cut of the salvage operation, not of the chest — and a name. He knows exactly who could have emptied it first. He just needs a reason to say it.',
    stats: ['cha'],
    risk: { wound: 0, death: 0 },
    beat: 5,
    verdictFlavor: {
      bigwin: 'He pays the share — and gives you the name like a man settling two debts with one coin.',
      win: 'A thin share, but a real one — and a name whispered like it costs him.',
      almost: 'A token payment and a promise about the name. Half a deal is still a deal.',
      fail: 'He pays you in smiles — the letter of the deal says you are owed exactly nothing.',
      epicfail: 'The deal dissolves like salt in canal water. He owes you nothing, and now he knows you think otherwise.',
    },
    verdictTable: {
      bigwin: { setObjective: 'done', setFlags: ['soci-onorati'], setInfo: ['depositario-traccia'], goldDelta: 30, log: 'His share — and the name of whoever emptied the chest first.', goto: 'im-fine' },
      win: { setObjective: 'done', setFlags: ['soci-onorati'], setInfo: ['depositario-traccia'], goldDelta: 20, goto: 'im-fine' },
      almost: { setObjective: 'done', goldDelta: 10, goto: 'im-fine' },
      fail: { setFlags: ['soci-traditi'], goto: 'im-fine' },
      epicfail: { setFlags: ['soci-traditi'], goto: 'im-fine' },
    },
  },
  'im-trasporto': {
    id: 'im-trasporto',
    kind: 'check',
    title: 'The prisoner convoy',
    body: 'Bound and quiet, he rides your lead barge through channels his own men know better than their hands. Every lantern that follows at a polite distance belongs to him. Getting him home is the whole job now — the water does not let its keeper go easily.',
    stats: ['agi', 'con'],
    risk: { wound: 14, death: 4 },
    risky: true,
    failHint: 'his men shadow the convoy — in the dark, over the side, he is gone.',
    beat: 5,
    verdictFlavor: {
      bigwin: 'You land him at the village dock before his men finish planning the rescue — and under oath, he names who emptied the chest first.',
      win: 'The convoy holds. He steps onto dry land in your custody — and the water loses its keeper.',
      almost: 'One scramble in the dark, one pole too close — but he arrives bound.',
      fail: 'A lantern drifts closer in the dark; a splash answers it. By morning the water has him back.',
      epicfail: 'His men take the channel like it owes them — the convoy breaks, and he is gone into his own element.',
    },
    verdictTable: {
      bigwin: { setObjective: 'done', setFlags: ['a-consegnato'], setInfo: ['depositario-traccia'], log: 'Delivered — and talking. He names who could have emptied the chest first.', goto: 'im-fine' },
      win: { setObjective: 'done', setFlags: ['a-consegnato'], goto: 'im-fine' },
      almost: { setObjective: 'done', setFlags: ['a-consegnato'], damage: 10, goto: 'im-fine' },
      fail: { setFlags: ['a-fuggito'], damage: 10, log: 'He slipped overboard in the dark — the channels keep their keeper. You will meet him again.', goto: 'im-fine' },
      epicfail: { setFlags: ['a-fuggito'], damage: 18, log: 'He slipped overboard in the dark — the channels keep their keeper. You will meet him again.', goto: 'im-fine' },
    },
  },

  /* ---- B6 — FORK: the water gives back ---------------------------------- */
  'im-ritorno': {
    id: 'im-ritorno',
    kind: 'info',
    title: 'The channels give you back',
    body: 'The palude closes behind you with no comment. Whatever happened at the chest site, the water keeps its own version — and its keeper, if it kept him.',
    transit: 'A quiet way back, purchased one way or another.',
    next: 'im-fine',
    beat: 6,
  },
  'im-fine': {
    id: 'im-fine',
    kind: 'end',
    title: 'Return to the village',
    body: 'The expedition is over. The deal the village needed is closed — or the village learns what it actually bought.',
    beat: 6,
  },
};

/**
 * Authored scenario literal (pre-parse). `id` rides the 'gen' profile —
 * `gen-<imprint>-<kit>` marks provenance: an imprint-compiled scenario,
 * not a skeleton×kit generation. `armRolls`/`initialVars` travel into the
 * ScenarioInstance via `createScenarioInstance`.
 */
export const IMPR002_PALUDE_SCENARIO_AUTHORED = {
  id: 'gen-impr002-palude',
  title: 'The Lock-Keeper’s Bargemen',
  flavour: 'He offers exactly what you lack — boats, men, channels. The help is the trap.',
  scenarioVersion: 'impr002-palude-v1',
  startNode: 'im-partenza',
  primaryStats: ['perc', 'cha'] as LabStat[],
  beats: [
    'The sunken chest',
    'His water',
    'Small wrong things',
    'The landing',
    'Inside his disposition',
    'The ghost in the chest',
    'The return',
  ],
  intelLabels: {
    'fedeli-ad-a': 'his men take orders from his hands, not from the mission',
    'avviso-tardivo': 'the gatherer’s warning — his lamps mark prey, not the way',
    'depositario-traccia': 'a trace of whoever emptied the chest first — a thread someone will want pulled',
  },
  initialVars: { sospetto: 0 },
  armRolls: [
    /* Mixed arming (PLAN-026): a party carrying a living 'prudente' rolls
     * once at runstart — armed, the prudent one's nose becomes a third
     * cracks channel (`im-fiuto`). */
    { flag: 'fiuto-prudente', chance: 60, requiresTrait: 'prudente' },
  ],
  epilogue: {
    titles: [
      {
        label: 'Chain-breaker of the locks',
        requiresFlag: 'a-consegnato',
      },
    ],
    lore: [
      {
        label: 'He slipped back into his own channels — the water keeps its keeper. You will hear his name again.',
        requiresFlag: 'a-fuggito',
      },
      {
        label: 'The locks still answer to his hands — and now he knows your faces.',
        requiresFlag: 'a-padrone',
      },
      {
        label: 'Partners in a hollow deal — he paid with a smile.',
        requiresFlag: 'soci-traditi',
      },
      {
        label: 'The chest had been emptied long before — the prize was a ghost for everyone on the water.',
        requiresFlag: 'posta-mossa',
      },
      {
        label: 'He honoured the letter of the deal — and named who emptied the chest first.',
        requiresFlag: 'soci-onorati',
      },
    ],
  },
  offer: {
    objective: 'Recover the marriage chest from the inner canals — or whatever its loss is worth to the village.',
    tags: ['quest', 'imprint', 'impr002', 'palude', 'gen'],
    slots: {
      required: [
        {
          id: 'im-slot-leader',
          label: 'Expedition leader',
          role: 'leader',
          statFocus: ['perc', 'cha'],
          requirement: { label: 'Expedition leader', anyOf: ['precision', 'clarity'] },
        },
      ],
      optional: [
        {
          id: 'im-slot-member-1',
          label: 'Fighter',
          role: 'member',
          statFocus: ['str', 'con'],
          requirement: { label: 'Fighter', anyOf: ['edge', 'fortitude', 'warden'] },
        },
        {
          id: 'im-slot-member-2',
          label: 'Fixer',
          role: 'member',
          statFocus: ['cha', 'int'],
          requirement: { label: 'Fixer', anyOf: ['clarity', 'precision'] },
        },
        {
          id: 'im-slot-bodyguard',
          label: 'Bodyguard',
          role: 'bodyguard',
          statFocus: ['con', 'agi'],
          requirement: { label: 'Bodyguard', anyOf: ['warden', 'fortitude'] },
        },
      ],
    },
    referenceParty: [
      { id: 'im-ref-leader', name: 'Agnese', role: 'leader', hp: 80, stats: { str: 45, con: 50, agi: 55, perc: 75, int: 55, cha: 65 } },
      { id: 'im-ref-m1', name: 'Boro', role: 'member', hp: 75, stats: { str: 70, con: 65, agi: 45, perc: 35, int: 30, cha: 30 } },
      { id: 'im-ref-m2', name: 'Lia', role: 'member', hp: 60, stats: { str: 35, con: 40, agi: 55, perc: 50, int: 65, cha: 70 } },
      { id: 'im-ref-bg', name: 'Gor', role: 'bodyguard', hp: 85, stats: { str: 60, con: 75, agi: 50, perc: 30, int: 20, cha: 25 } },
    ],
    dangerBandRef: 'media',
    rewardBase: 70,
  },
  nodes: IMPR002_NODES,
} satisfies Omit<QuestScenario, 'primaryStats'> & { primaryStats: LabStat[] };

/** Parsed, validated scenario — the single source consumed by the engine. */
export const IMPR002_PALUDE_SCENARIO: QuestScenario = parseQuestScenario(IMPR002_PALUDE_SCENARIO_AUTHORED);
