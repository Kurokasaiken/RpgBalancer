/**
 * impr002Mare — catalog imprint «Il relitto sulla secca»
 * (IMPR-002 × kit mare, R-159: seconda istanza compilata).
 *
 * Second compiled instance of «Il compagno che ride» — same B0–B6 spine as
 * `gen-impr002-palude`, different domain physics. This file exists to prove
 * what the imprint actually contributes: the causal skeleton is shared, the
 * mechanics are NOT a reskin. Domain deltas vs `impr002Palude.ts`:
 *
 * - **A = who controls the missing means of B0** — here the *shipowner-
 *   insurer*, not the lock-keeper: the missing means is a hull and a crew,
 *   and the alternative is a lone sail on open water.
 * - **B0 price of autonomy is exposure, not sweat.** The palude walkway
 *   paid a strength toll and failure cost HP. On the flats there is
 *   nowhere to hide: the skiff check (agi+con — sailing, not slogging)
 *   flags 'annusati' on failure — being seen rowing out alone tells him
 *   exactly who is coming and how.
 * - **B2 third channel is documentary.** The palude gatherer gave a
 *   warning; the mare registry gives `polizza-ombra` — written proof that
 *   he insured the wrecked ship. It still feeds `sospetto`, but it ALSO
 *   gates the strongest B6 branch (`ma-sgama`): evidence beats muscle.
 * - **B5 cross-cast.** The hold was lightened by the *recovery master* —
 *   `traccia-maestro` seeds a second shadow entity of the domain, not a
 *   generic «who emptied it».
 * - **B6 adds 'a-sgamato'.** Deliver him AND the policy to the harbor
 *   authority — the two kit stakeholders (shipowner vs recovery master)
 *   start accusing each other. Strongest ending, intel-gated.
 * - **Fuga is the current, not the walkway** — `ma-scialuppa` rows against
 *   the tide (agi+con), harsher harm profile than the mud.
 *
 * Beat → mechanics compilation (same contract as palude, `QUEST_IMPRINTS`
 * §Compilazione): B0 premise → flag-priced fork; B1 help → the flag that
 * B3 prices; B2 cracks → `sospetto` var on one-shot channels
 * (`segna-gesti`/`segna-carta`/`segna-fiuto`) + epicfail `annusati`;
 * B3 turn → post-effect goto router; B4 inside-out → force/surprise/
 * scialuppa/recita fork; B5 irony → `posta-mossa` on every verdict row
 * + `traccia-maestro` on a good read; B6 fork → `a-consegnato` /
 * `a-fuggito` / `a-sgamato` / `a-padrone` / `soci-*` + TAKEN≠SECURED
 * convoy (the prisoner can go over the side in the dark).
 *
 * English authored prose (R-135 baseline). Parses itself at import.
 */

import type { LabStat, QuestNode } from '@/ui/idleVillage/questS1Lab/questScenario';
import {
  parseQuestScenario,
  type QuestScenario,
} from '@/balancing/config/idleVillage/quests/questScenario.schema';

const inc = (v: string, n: number) => ({ var: v, op: 'inc' as const, value: n });

/* Same post-effect turn router as the palude instance — the imprint's B3
 * is the shared skeleton: readiness → surprise, suspicion → confirmation,
 * spotted → heavy ambush, else → the trap lands blind. */
const TURN_GOTO = {
  branches: [
    { when: { flag: 'pronti' }, then: 'ma-disposti' },
    { when: { varGE: { var: 'sospetto', value: 2 } }, then: 'ma-lettura' },
    { when: { flag: 'annusati' }, then: 'ma-imboscata' },
  ],
  else: 'ma-trappola',
};

const IMPR002_MARE_NODES: Record<string, QuestNode> = {
  /* ---- B0 — PREMISE: the missing means is a hull and a crew ------------- */
  'ma-partenza': {
    id: 'ma-partenza',
    kind: 'choice',
    title: 'The wreck on the flats',
    body: 'A cargo hulk surfaced at low water on a far shoal — its manifest and its hold are worth a quarter’s debt to the village. You have no hull and no crew that knows the flats. The shipowner does: he offers his carrack and his men — «for the good of the harbor». He also insured the wreck. Nobody mentions that.',
    transit: 'The flats take a keel and a chart — or a hull and a man who already owns both.',
    beat: 0,
    options: [
      {
        id: 'ma-accetta',
        label: 'Take his carrack',
        detail: 'Fast, crewed, legal-looking — his men sail you onto his water. Accepting means his crew inside your voyage.',
        next: 'ma-traversata',
        sets: 'ciurma-di-a',
      },
      {
        id: 'ma-rifiuta',
        label: 'Row the fisher’s skiff',
        detail: 'Agility + Constitution. The flats drown the careless — and a lone sail on open water is easy to spot.',
        next: 'CHECK:ma-secche',
        sets: 'rotta-propria',
      },
    ],
  },

  /* ---- B1 — THE HELP: his deck, his crew, your cargo-space -------------- */
  'ma-traversata': {
    id: 'ma-traversata',
    kind: 'info',
    title: 'On his deck',
    body: 'The carrack rides the channel like it belongs there — because it does. The crew works on his glances, not your leader’s orders. The crossing is easy. That is exactly the problem.',
    transit: 'The crew answers you politely — after looking at him.',
    next: 'ma-segnali',
    beat: 1,
  },
  'ma-secche': {
    id: 'ma-secche',
    kind: 'check',
    title: 'The flats under a lone sail',
    body: 'A fisher’s skiff, a stolen chart, and a tide that forgives nothing. The long way — and the way nobody expects, unless a sail on the flats gets noticed.',
    stats: ['agi', 'con'],
    risk: { wound: 14, death: 3 },
    risky: true,
    failHint: 'the flats are watched — a lone sail out here names itself.',
    beat: 1,
    verdictFlavor: {
      bigwin: 'You ghost the shoals on the last of the ebb — dry powder, a quiet keel, and not one gull reports you.',
      win: 'A hard pull against the tide, but a clean one — the flats keep your secret.',
      almost: 'You ground once and float off on luck. Wet boots, no names exchanged.',
      fail: 'A channel marker watches you pass. By the time you land, someone ashore has counted your sail.',
      epicfail: 'The skiff broaches on the bar — you wade in soaked, bleeding, and announced.',
    },
    verdictTable: {
      /* An unseen approach IS readiness — but a spotted sail costs more
       * than skin: on open water, failure names you. */
      win: { setFlags: ['pronti'], goto: 'ma-segnali' },
      bigwin: { setFlags: ['pronti'], log: 'Unseen and unheard — the flats keep your secret.', goto: 'ma-segnali' },
      almost: { goto: 'ma-segnali' },
      fail: { damage: 8, setFlags: ['annusati'], log: 'A sail alone on the flats is a signature — he knows a party came uninvited.', goto: 'ma-segnali' },
      epicfail: { damage: 15, setFlags: ['annusati'], goto: 'ma-segnali' },
    },
  },

  /* ---- B2 — CRACKS: three one-shot channels feed `sospetto` ------------- */
  'ma-segnali': {
    id: 'ma-segnali',
    kind: 'choice',
    title: 'Small wrong things',
    body: 'Nothing is wrong that you could swear to — and several things are wrong. The crew watches his hands, not the chart. He names the shoal’s bearing from «hearsay» — a bearing no insurer should know. Every crack has an innocent reading. You can collect them, or let them go.',
    transit: 'The kind of nothing that keeps a prudent mind awake.',
    beat: 2,
    options: [
      {
        id: 'ma-osserva',
        label: 'Watch his crew',
        detail: 'Perception. One careful look at who they really answer to — one look is all a careful look gets.',
        next: 'CHECK:ma-osserva',
        hiddenIfFlag: 'segna-gesti',
      },
      {
        id: 'ma-registro',
        label: 'Read the harbor registry',
        detail: 'Intellect. Wrecks are paperwork before they are salvage — and insurance is written down.',
        next: 'CHECK:ma-registro',
        hiddenIfFlag: 'segna-carta',
      },
      {
        id: 'ma-fiuto',
        label: 'The prudent one’s nose',
        detail: 'Perception. Someone in your party smelled this days ago — let them show you what.',
        next: 'CHECK:ma-fiuto',
        requiresFlag: 'fiuto-prudente',
        hiddenIfFlag: 'segna-fiuto',
      },
      {
        id: 'ma-lascia',
        label: 'Let it slide — the water is calm',
        detail: 'You reach the shoal as you are: trusting, or blind.',
        next: 'ma-avviso',
      },
    ],
  },
  'ma-osserva': {
    id: 'ma-osserva',
    kind: 'check',
    title: 'Reading the crew',
    body: 'They work like men who have done this together for years — for him, not for whoever the manifest names as client.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 2,
    verdictFlavor: {
      bigwin: 'Every gesture maps to him: the glance before they answer, the drill rehearsed too smoothly to be new, the way they space you along the rail.',
      win: 'They take orders from his hands. The expedition is cargo — they are not.',
      almost: 'Something in how they space you along the rail. A hunch, not a proof.',
      fail: 'Competent sailors doing a job. Nothing a fair judge could object to.',
      epicfail: 'One of them catches you watching — and marks it.',
    },
    verdictTable: {
      bigwin: { vars: [inc('sospetto', 1)], setFlags: ['segna-gesti'], setInfo: ['equipaggio-suo'], log: 'The crew is his — every order runs through his hands.', goto: 'ma-segnali' },
      win: { vars: [inc('sospetto', 1)], setFlags: ['segna-gesti'], setInfo: ['equipaggio-suo'], goto: 'ma-segnali' },
      almost: { vars: [inc('sospetto', 1)], setFlags: ['segna-gesti'], goto: 'ma-segnali' },
      fail: { setFlags: ['segna-gesti'], goto: 'ma-segnali' },
      epicfail: { setFlags: ['segna-gesti', 'annusati'], log: 'They noticed you watching. Now they are watching back.', goto: 'ma-segnali' },
    },
  },
  'ma-registro': {
    id: 'ma-registro',
    kind: 'check',
    title: 'The harbor registry',
    body: 'In the harbormaster’s dry ledgers, wrecks are paperwork: insurer, declared cargo, recovery rights. The entries are public — to anyone who knows what a policy looks like when it is also a motive.',
    stats: ['int'],
    risk: { wound: 0, death: 0 },
    beat: 2,
    verdictFlavor: {
      bigwin: 'Three lines and the whole voyage rewrites itself: he insured the hull, he underwrote the cargo, and he filed no recovery claim.',
      win: 'The policy is real — he insured the very wreck he now «helps» you reach.',
      almost: 'An entry smells wrong — the signature is his, the dates tell you less.',
      fail: 'Names, dates, tonnage. Nothing a fair judge could object to.',
      epicfail: 'A clerk notices your reading and mentions it where it pays to be mentioned.',
    },
    verdictTable: {
      bigwin: { vars: [inc('sospetto', 1)], setFlags: ['segna-carta'], setInfo: ['polizza-ombra'], log: 'The shadow policy: insurer of the wreck, claimant of nothing — written proof of motive.', goto: 'ma-segnali' },
      win: { vars: [inc('sospetto', 1)], setFlags: ['segna-carta'], setInfo: ['polizza-ombra'], goto: 'ma-segnali' },
      almost: { vars: [inc('sospetto', 1)], setFlags: ['segna-carta'], goto: 'ma-segnali' },
      fail: { setFlags: ['segna-carta'], goto: 'ma-segnali' },
      epicfail: { setFlags: ['segna-carta', 'annusati'], log: 'Your reading of the registry is now a fact he owns.', goto: 'ma-segnali' },
    },
  },
  'ma-fiuto': {
    id: 'ma-fiuto',
    kind: 'check',
    title: 'What the prudent one smelled',
    hidden: true,
    body: 'The careful member of your party kept their doubts quiet — until now. Show me what you saw, you say. They do.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 2,
    verdictFlavor: {
      bigwin: 'A catalogue: the armed boat-crew «for boarding», the second manifest under the chart table, the bearing he «forgot» to explain.',
      win: 'The carrack carries more line-handlers and more canvas than a salvage escort needs.',
      almost: 'A list of small things that add up to a posture, not a proof.',
      fail: 'Even the prudent one only has a smell — but the smell is real.',
      epicfail: 'They recount it loudly enough to be overheard on deck.',
    },
    verdictTable: {
      bigwin: { vars: [inc('sospetto', 1)], setFlags: ['segna-fiuto'], setInfo: ['equipaggio-suo'], goto: 'ma-segnali' },
      win: { vars: [inc('sospetto', 1)], setFlags: ['segna-fiuto'], setInfo: ['equipaggio-suo'], goto: 'ma-segnali' },
      almost: { vars: [inc('sospetto', 1)], setFlags: ['segna-fiuto'], goto: 'ma-segnali' },
      fail: { vars: [inc('sospetto', 1)], setFlags: ['segna-fiuto'], goto: 'ma-segnali' },
      epicfail: { vars: [inc('sospetto', 1)], setFlags: ['segna-fiuto'], goto: 'ma-segnali' },
    },
  },

  /* ---- B3 — THE TURN: the salvage plan was always his -------------------- */
  'ma-avviso': {
    id: 'ma-avviso',
    kind: 'info',
    title: 'The widow’s warning',
    body: 'A fisher boy rows out with a message from the wreck-widow — the woman who lost her crew on that shoal and never got her claim. «Do not sail with him. His carracks come back lighter than they leave.» The warning arrives now: too late to matter for the departure, early enough to count.',
    transit: 'The evidence always arrives after leaving — that is what makes it evidence.',
    next: 'ma-schieramento',
    beat: 3,
  },
  'ma-schieramento': {
    id: 'ma-schieramento',
    kind: 'check',
    title: 'The shoal',
    body: 'The hulk heaves on the flats ahead — and his men are already positioned around it, exactly where a recovery escort would not stand. Whatever you suspected, the disposition answers for him: the expedition was his legal cover to strip a wreck he had no claim on. You were the witnesses of your own ambush.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 3,
    verdictFlavor: {
      bigwin: 'You read the whole shape of it before the first boathook comes up — every man, every angle, every current he thinks he owns.',
      win: 'You see it: the spacing, the ready lines, the skiff already crewed behind him.',
      almost: 'You catch the shape late — enough to know it is a shape.',
      fail: 'It takes you a breath too long to understand what you are looking at.',
      epicfail: 'You are still counting men when the first boathook rises.',
    },
    verdictTable: {
      bigwin: { goto: TURN_GOTO },
      win: { goto: TURN_GOTO },
      almost: { goto: TURN_GOTO },
      fail: { goto: TURN_GOTO },
      epicfail: { goto: TURN_GOTO },
    },
  },
  'ma-disposti': {
    id: 'ma-disposti',
    kind: 'info',
    title: 'You came unseen',
    body: 'From the lee of the shoal you watch his men take positions meant for a party that should never have seen them. He planned a trap for passengers — and you are not passengers. The water is his. The first move is yours.',
    transit: 'You count his men while they count a trap that is not there.',
    next: 'ma-scelta',
    beat: 3,
  },
  'ma-lettura': {
    id: 'ma-lettura',
    kind: 'check',
    title: 'The pieces assemble',
    body: 'Every crack you collected lands at once: the glances, the policy, the rehearsed drill. You are not surprised — but knowing and acting are two different check rolls.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 3,
    verdictFlavor: {
      bigwin: 'You move before his hands finish the signal — the cracks were worth every minute.',
      win: 'You are ready when it springs. The cracks paid.',
      almost: 'You catch it a breath late — late enough to lose the first word, not the first move.',
      fail: 'You had every clue and still freeze — the meaning arrives with the boathooks.',
      epicfail: 'The clues were there. You assembled them a heartbeat too late.',
    },
    verdictTable: {
      bigwin: { setFlags: ['pronti'], goto: 'ma-scelta' },
      win: { setFlags: ['pronti'], goto: 'ma-scelta' },
      almost: { setFlags: ['pronti'], goto: 'ma-scelta' },
      fail: { goto: 'ma-scelta' },
      epicfail: { goto: 'ma-scelta' },
    },
  },
  'ma-trappola': {
    id: 'ma-trappola',
    kind: 'check',
    title: 'It lands on you',
    body: 'The boathooks come up together — a boarding party, not a crew. «Put the tools down,» he calls across the water, pleasant as a harbor gate closing. You walk into it open-eyed now, but it is open eyes at hook-point.',
    stats: ['agi'],
    risk: { wound: 15, death: 4 },
    risky: true,
    upfrontDamage: { amount: 12 },
    failHint: 'the boarding line closes first — surprise was his, not yours.',
    beat: 3,
    verdictTable: {
      bigwin: { goto: 'ma-scelta' },
      win: { goto: 'ma-scelta' },
      almost: { goto: 'ma-scelta' },
      fail: { damage: 8, goto: 'ma-scelta' },
      epicfail: { damage: 15, goto: 'ma-scelta' },
    },
  },
  'ma-imboscata': {
    id: 'ma-imboscata',
    kind: 'check',
    title: 'He knew you knew',
    body: 'Your questions reached him before you reached the shoal — or your lone sail did the telling. The boarding party is already set and watching the approach he expects — you. «Careful,» he calls, friendly. «The current is bad where you are standing.»',
    stats: ['agi'],
    risk: { wound: 20, death: 6 },
    risky: true,
    upfrontDamage: { amount: 20 },
    failHint: 'prepared for exactly you — the toll is heavier.',
    beat: 3,
    verdictTable: {
      bigwin: { goto: 'ma-scelta' },
      win: { goto: 'ma-scelta' },
      almost: { goto: 'ma-scelta' },
      fail: { damage: 10, goto: 'ma-scelta' },
      epicfail: { damage: 20, goto: 'ma-scelta' },
    },
  },

  /* ---- B4 — INSIDE OUT: his deck, his crew, your move -------------------- */
  'ma-scelta': {
    id: 'ma-scelta',
    kind: 'choice',
    title: 'Inside his boarding plan',
    body: 'The wreck, the boarding party, the open sea behind him that only his chart knows. Force means his numbers on his deck. Flight means the skiff against the current. Or you can keep playing the salvage escort — and split what he was going to take alone.',
    transit: 'The kind of position you only get out of by paying.',
    beat: 4,
    options: [
      {
        id: 'ma-primo-colpo',
        label: 'Strike first — you saw it coming',
        detail: 'A two-turn fight on your timing, not his. The surprise is yours: it ends fast, one way or the other.',
        next: 'ma-scontro-sorpresa',
        requiresFlag: 'pronti',
      },
      {
        id: 'ma-via-forza',
        label: 'Fight the boarding party',
        detail: 'A four-turn fight — his numbers, his deck, his terms. It will cost blood whether it works or not.',
        next: 'ma-scontro',
      },
      {
        id: 'ma-via-fuga',
        label: 'Run the skiff against the current',
        detail: 'Agility + Constitution. Out of his reach and gone — he keeps the water, you keep your skin.',
        next: 'CHECK:ma-scialuppa',
      },
      {
        id: 'ma-via-recita',
        label: 'Play the salvage escort',
        detail: 'Charisma. Smile, split the recovery, sail out partners. If he reads the bluff, you do not get to offer twice.',
        next: 'CHECK:ma-farsa',
        hiddenIfFlag: 'smascherati',
      },
    ],
  },
  'ma-scontro-sorpresa': {
    id: 'ma-scontro-sorpresa',
    kind: 'combat',
    title: 'Your ambush',
    body: 'You were the witnesses of your own ambush — so you spring yours first.',
    transit: 'The moment is chosen. His boarding line turns toward the wrong deck.',
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
      nextCleared: 'ma-in-piedi',
      nextSurvivors: 'ma-respinti',
      enemyName: 'Deckhands',
      attackLines: {
        bigwin: 'You hit the boarding line where it was watching the wrong water.',
        win: 'First blood is yours — the trap springs backwards.',
        almost: 'A ragged strike — they reel, but they answer.',
        fail: 'Your surprise meets his boathooks — it still hurts them less than it should.',
        epicfail: 'The strike comes apart in your hands — now they know everything.',
      },
      clearedText: 'The boarding line breaks. His deck, your field — the shipowner is on his knees.',
      survivorsText: 'The surprise bought you a moment, not the deck — his men close around it again.',
      holdingText: 'Turn {turn} closed — his deckhands still hold the boarding line ({left} standing).',
    },
  },
  'ma-scontro': {
    id: 'ma-scontro',
    kind: 'combat',
    title: 'The boarding line',
    body: 'Boathooks against steel, on a deck in his water. You are inside his disposition — the only way out is through.',
    transit: 'The sea closes around the fight like a second opponent.',
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
      nextCleared: 'ma-in-piedi',
      nextSurvivors: 'ma-respinti',
      enemyName: 'Deckhands',
      attackLines: {
        bigwin: 'A gap in the boarding line — you drive the whole party through it.',
        win: 'You break one end of his line before it can close.',
        almost: 'You trade blows with men who fight for their owner.',
        fail: 'The boathooks find their range — his men know this deck better than your steel knows it.',
        epicfail: 'The boarding line contracts around you like a harbor gate.',
      },
      clearedText: 'The boarding line breaks apart on his own deck. The shipowner stands alone.',
      survivorsText: 'The boarding line holds — barely, but it holds. His men are still between you and everything.',
      holdingText: 'Turn {turn} closed — the boarding line still stands ({left} hooks up).',
    },
  },
  'ma-scialuppa': {
    id: 'ma-scialuppa',
    kind: 'check',
    title: 'The skiff against the current',
    body: 'You break for the skiff — oars against a turning tide, his men knowing every channel. Getting out means winning a race the water itself is paid to lose for him.',
    stats: ['agi', 'con'],
    risk: { wound: 18, death: 5 },
    risky: true,
    failHint: 'they cut the channel behind you — the escape still works, at a price.',
    beat: 4,
    verdictFlavor: {
      bigwin: 'You are already past the second shoal when his men reach the first.',
      win: 'Spray, a held breath, a pull at the oars — the boarding party loses you to the current.',
      almost: 'You get out with your arms burning and his curses crossing the water.',
      fail: 'They cut the channel behind you — out is out, but it costs.',
      epicfail: 'A boathook finds the gunwale mid-sprint — you row out bleeding, but you row out.',
    },
    verdictTable: {
      bigwin: { setFlags: ['a-padrone'], goto: 'ma-ritorno' },
      win: { setFlags: ['a-padrone'], goto: 'ma-ritorno' },
      almost: { setFlags: ['a-padrone'], goto: 'ma-ritorno' },
      fail: { setFlags: ['a-padrone'], damage: 10, goto: 'ma-ritorno' },
      epicfail: { setFlags: ['a-padrone'], damage: 18, goto: 'ma-ritorno' },
    },
  },
  'ma-farsa': {
    id: 'ma-farsa',
    kind: 'check',
    title: 'The performance',
    body: 'You keep playing the escort he hired: polite, useful, blind. The question is who is performing for whom — you offer to split the recovery as if there were nothing to forgive.',
    stats: ['cha'],
    risk: { wound: 0, death: 0 },
    beat: 4,
    verdictFlavor: {
      bigwin: 'He laughs — the real one, the one that respects a player. «Partners, then.»',
      win: 'He weighs you, smiles, and puts the hooks down. A deal is a deal — on his deck.',
      almost: 'He plays along watching you the whole time — a partnership with a hand on the boathook.',
      fail: 'His smile does not change, but his men shift their grip. He read you.',
      epicfail: 'He applauds the performance — then names what you were doing, out loud, in front of his crew.',
    },
    verdictTable: {
      bigwin: { goto: 'ma-soci' },
      win: { goto: 'ma-soci' },
      almost: { goto: 'ma-soci' },
      fail: { setFlags: ['smascherati'], damage: 6, log: 'He read the bluff — the offer is gone from the table.', goto: 'ma-scelta' },
      epicfail: { setFlags: ['smascherati'], damage: 12, log: 'Unmasked in front of his crew — you will not get to offer twice.', goto: 'ma-scelta' },
    },
  },
  'ma-in-piedi': {
    id: 'ma-in-piedi',
    kind: 'choice',
    title: 'The shipowner, kneeling',
    body: 'His men are gone or fled, his boarding line broken on his own deck. He kneels on the planks of his carrack — polite even now, a man already pricing the future. He knows every shoal, every policy, every drowned ledger in the harbor.',
    transit: 'The water goes quiet. Even the gulls seem to wait for your call.',
    beat: 4,
    options: [
      {
        id: 'ma-lega',
        label: 'Bind him — he answers to the village',
        detail: 'The man who owned the water, delivered. That is worth more to the village than the cargo ever was — if you get him home.',
        next: 'CHECK:ma-stiva',
        sets: 'a-prigioniero',
      },
      {
        id: 'ma-sgama',
        label: 'Hold him AND the policy — the registry is evidence',
        detail: 'The insurance fraud in writing, and the man who signed it. Two stakeholders will start blaming each other before the ink dries.',
        next: 'CHECK:ma-stiva',
        sets: 'a-sgamato',
        requiresInfo: 'polizza-ombra',
      },
      {
        id: 'ma-lascialo',
        label: 'Let him swim for it',
        detail: 'He will vanish into his own channels. The sea keeps its shipowner — and you keep your hands clean of a fight you already won.',
        next: 'CHECK:ma-stiva',
        sets: 'a-fuggito',
      },
    ],
  },
  'ma-soci': {
    id: 'ma-soci',
    kind: 'choice',
    title: 'His hand, extended',
    body: 'Partners in the recovery, then — his smile says he respects the play, and his eyes say he prices it too. The hold is below; the split is above. Shake on it, or walk away from the only offer on the water.',
    beat: 4,
    options: [
      {
        id: 'ma-stretta',
        label: 'Take the deal — split the recovery',
        detail: 'Partners. He pays a share for silence, and a share of whatever the hold still holds.',
        next: 'CHECK:ma-stiva',
        sets: 'soci',
      },
      {
        id: 'ma-niente-accordo',
        label: 'No deal — back off',
        detail: 'You do not shake a hand that was on a hook a minute ago. He keeps his water; you keep your options.',
        next: 'CHECK:ma-stiva-lontana',
        sets: 'a-padrone',
      },
    ],
  },
  'ma-respinti': {
    id: 'ma-respinti',
    kind: 'choice',
    title: 'The water is still his',
    body: 'The boarding line holds — barely, but it holds, and bleeding on his deck is a bet that gets worse every breath. You back off to the skiff while his men watch you go.',
    beat: 4,
    options: [
      {
        id: 'ma-indietro',
        label: 'Back off and watch from the shoal',
        detail: 'You keep your distance and your lives — and you get to watch what he came for.',
        next: 'CHECK:ma-stiva-lontana',
        sets: 'a-padrone',
      },
    ],
  },

  /* ---- B5 — IRONY: the hold was emptied before the game began ------------ */
  'ma-stiva': {
    id: 'ma-stiva',
    kind: 'check',
    title: 'The hold, at last',
    body: 'Below the waterline, exactly where the manifest said. You force the hatch with expectation — and it answers wrong: too empty, too carefully emptied. The registered recovery master took the good cargo years ago, under a claim filed to nobody. Everyone on this water has been fighting over a ghost.',
    stats: ['perc', 'int'],
    risk: { wound: 0, death: 0 },
    beat: 5,
    verdictFlavor: {
      bigwin: 'The bilge tells you more than the hold: emptied by a professional, stamped with the recovery master’s mark — and the mark is a name.',
      win: 'Emptied long ago — but the way it was emptied is itself information.',
      almost: 'Empty. The only question left is who knew first.',
      fail: 'Empty. Whatever answer the bilge held, it slips through your hands.',
      epicfail: 'Empty, and the hatch drops a finger on it besides.',
    },
    verdictTable: {
      bigwin: {
        setFlags: ['posta-mossa'],
        setInfo: ['traccia-maestro'],
        goldDelta: 15,
        log: 'Scraps in the false bottom — and the recovery master’s mark, with a registry number.',
        goto: {
          branches: [
            { when: { flag: 'a-prigioniero' }, then: 'ma-convoglio' },
            { when: { flag: 'a-sgamato' }, then: 'ma-consegna' },
            { when: { flag: 'soci' }, then: 'ma-patto' },
          ],
          else: 'ma-ritorno',
        },
      },
      win: {
        setFlags: ['posta-mossa'],
        setInfo: ['traccia-maestro'],
        goto: {
          branches: [
            { when: { flag: 'a-prigioniero' }, then: 'ma-convoglio' },
            { when: { flag: 'a-sgamato' }, then: 'ma-consegna' },
            { when: { flag: 'soci' }, then: 'ma-patto' },
          ],
          else: 'ma-ritorno',
        },
      },
      almost: {
        setFlags: ['posta-mossa'],
        goto: {
          branches: [
            { when: { flag: 'a-prigioniero' }, then: 'ma-convoglio' },
            { when: { flag: 'a-sgamato' }, then: 'ma-consegna' },
            { when: { flag: 'soci' }, then: 'ma-patto' },
          ],
          else: 'ma-ritorno',
        },
      },
      fail: {
        setFlags: ['posta-mossa'],
        goto: {
          branches: [
            { when: { flag: 'a-prigioniero' }, then: 'ma-convoglio' },
            { when: { flag: 'a-sgamato' }, then: 'ma-consegna' },
            { when: { flag: 'soci' }, then: 'ma-patto' },
          ],
          else: 'ma-ritorno',
        },
      },
      epicfail: {
        setFlags: ['posta-mossa'],
        damage: 5,
        goto: {
          branches: [
            { when: { flag: 'a-prigioniero' }, then: 'ma-convoglio' },
            { when: { flag: 'a-sgamato' }, then: 'ma-consegna' },
            { when: { flag: 'soci' }, then: 'ma-patto' },
          ],
          else: 'ma-ritorno',
        },
      },
    },
  },
  'ma-stiva-lontana': {
    id: 'ma-stiva-lontana',
    kind: 'check',
    title: 'The hold, from the shoal',
    body: 'You watch him force the hatch — and watch his face when the lantern finds the bilge. The curse he spits across the flats is the answer you would have paid blood for: it was empty. For him too.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 5,
    verdictFlavor: {
      bigwin: 'You even catch what he mutters after — a name. The recovery master whose mark is on the bilge.',
      win: 'Empty — for him as much as for you. The ghost took everyone.',
      almost: 'His men carry it off empty. You read the defeat in their shoulders.',
      fail: 'Too far to read more than the shape of disappointment.',
      epicfail: 'A boathook cracks against the hull — you duck lower than the sound.',
    },
    verdictTable: {
      bigwin: { setFlags: ['posta-mossa'], setInfo: ['traccia-maestro'], goto: 'ma-ritorno' },
      win: { setFlags: ['posta-mossa'], goto: 'ma-ritorno' },
      almost: { setFlags: ['posta-mossa'], goto: 'ma-ritorno' },
      fail: { setFlags: ['posta-mossa'], goto: 'ma-ritorno' },
      epicfail: { setFlags: ['posta-mossa'], goto: 'ma-ritorno' },
    },
  },
  'ma-convoglio': {
    id: 'ma-convoglio',
    kind: 'check',
    title: 'The prisoner convoy',
    body: 'Bound and quiet, he rides your skiff’s tow-line through channels his own men know better than their hands. Every sail that follows at a polite distance belongs to him. Getting him home is the whole job now — the sea does not let its shipowner go easily.',
    stats: ['agi', 'con'],
    risk: { wound: 14, death: 4 },
    risky: true,
    failHint: 'his boats shadow the convoy — in the dark, over the side, he is gone.',
    beat: 5,
    verdictFlavor: {
      bigwin: 'You land him at the harbor dock before his men finish planning the rescue — and under oath, he names the recovery master who emptied it first.',
      win: 'The convoy holds. He steps onto dry land in your custody — and the sea loses its owner.',
      almost: 'One scramble in the dark, one hook too close — but he arrives bound.',
      fail: 'A sail drifts closer in the dark; a splash answers it. By morning the water has him back.',
      epicfail: 'His men take the channel like it owes them — the convoy breaks, and he is gone into his own element.',
    },
    verdictTable: {
      bigwin: { setObjective: 'done', setFlags: ['a-consegnato'], setInfo: ['traccia-maestro'], log: 'Delivered — and talking. He names the recovery master who emptied the hold first.', goto: 'ma-fine' },
      win: { setObjective: 'done', setFlags: ['a-consegnato'], goto: 'ma-fine' },
      almost: { setObjective: 'done', setFlags: ['a-consegnato'], damage: 10, goto: 'ma-fine' },
      fail: { setFlags: ['a-fuggito'], damage: 10, log: 'He slipped overboard in the dark — the sea keeps its shipowner. You will meet him again.', goto: 'ma-fine' },
      epicfail: { setFlags: ['a-fuggito'], damage: 18, log: 'He slipped overboard in the dark — the sea keeps its shipowner. You will meet him again.', goto: 'ma-fine' },
    },
  },
  'ma-consegna': {
    id: 'ma-consegna',
    kind: 'check',
    title: 'The evidence voyage',
    body: 'Bound, and bound in papers: the shadow policy rides in a sealed pouch beside him. His own boats shadow the convoy — but a rescue now means assaulting a legal delivery, and the registry already knows. The papers do most of the rowing. The question is whether he buys his way out of even this.',
    stats: ['cha', 'int'],
    risk: { wound: 0, death: 0 },
    beat: 5,
    verdictFlavor: {
      bigwin: 'The harbor authority reads the policy twice — then asks for the recovery master’s name before he finishes his first excuse. Two stakeholders begin accusing each other in the same room.',
      win: 'He lands with the papers. The authority has both the man and the motive — and a second name to chase.',
      almost: 'The delivery holds, barely — the paperwork survives where the man almost does not.',
      fail: 'Somewhere between the shoal and the dock, a clerk is paid and a rope is loosed. The papers stay; the man goes.',
      epicfail: 'The convoy arrives with the policy intact and an empty chair — his money rowed faster than your evidence.',
    },
    verdictTable: {
      bigwin: { setObjective: 'done', setFlags: ['a-consegnato'], setInfo: ['traccia-maestro'], goldDelta: 25, log: 'Delivered with the policy — the shipowner and the recovery master now accuse each other in the same ledger.', goto: 'ma-fine' },
      win: { setObjective: 'done', setFlags: ['a-consegnato'], setInfo: ['traccia-maestro'], goldDelta: 15, goto: 'ma-fine' },
      almost: { setObjective: 'done', setFlags: ['a-consegnato'], goto: 'ma-fine' },
      fail: { setFlags: ['a-fuggito'], setInfo: ['traccia-maestro'], log: 'He bought his way off the convoy — but the policy stayed. The recovery master will hear of it.', goto: 'ma-fine' },
      epicfail: { setFlags: ['a-fuggito'], setInfo: ['traccia-maestro'], damage: 8, log: 'He bought his way off the convoy — but the policy stayed. The recovery master will hear of it.', goto: 'ma-fine' },
    },
  },
  'ma-patto': {
    id: 'ma-patto',
    kind: 'check',
    title: 'The letter of the deal',
    body: 'Partners in a recovery that recovered a ghost. Now you hold him to the letter: a cut of the salvage operation, not of the hold — and a name. He knows exactly whose mark is on that bilge. He just needs a reason to say it.',
    stats: ['cha'],
    risk: { wound: 0, death: 0 },
    beat: 5,
    verdictFlavor: {
      bigwin: 'He pays the share — and gives you the name like a man settling two debts with one coin.',
      win: 'A thin share, but a real one — and a name whispered like it costs him.',
      almost: 'A token payment and a promise about the name. Half a deal is still a deal.',
      fail: 'He pays you in smiles — the letter of the deal says you are owed exactly nothing.',
      epicfail: 'The deal dissolves like salt in sea water. He owes you nothing, and now he knows you think otherwise.',
    },
    verdictTable: {
      bigwin: { setObjective: 'done', setFlags: ['soci-onorati'], setInfo: ['traccia-maestro'], goldDelta: 30, log: 'His share — and the recovery master’s name, with his mark for proof.', goto: 'ma-fine' },
      win: { setObjective: 'done', setFlags: ['soci-onorati'], setInfo: ['traccia-maestro'], goldDelta: 20, goto: 'ma-fine' },
      almost: { setObjective: 'done', goldDelta: 10, goto: 'ma-fine' },
      fail: { setFlags: ['soci-traditi'], goto: 'ma-fine' },
      epicfail: { setFlags: ['soci-traditi'], goto: 'ma-fine' },
    },
  },

  /* ---- B6 — FORK: the water gives back ---------------------------------- */
  'ma-ritorno': {
    id: 'ma-ritorno',
    kind: 'info',
    title: 'The channels give you back',
    body: 'The flats close behind you with no comment. Whatever happened at the shoal, the sea keeps its own version — and its shipowner, if it kept him.',
    transit: 'A quiet way home, purchased one way or another.',
    next: 'ma-fine',
    beat: 6,
  },
  'ma-fine': {
    id: 'ma-fine',
    kind: 'end',
    title: 'Return to the village',
    body: 'The expedition is over. The debt the village needed is closed — or the village learns what it actually bought.',
    beat: 6,
  },
};

/**
 * Authored scenario literal (pre-parse). Same 'gen' profile and the same
 * `gen-<imprint>-<domain>` provenance as the palude instance.
 */
export const IMPR002_MARE_SCENARIO_AUTHORED = {
  id: 'gen-impr002-mare',
  title: 'The Shipowner’s Carrack',
  flavour: 'He owns the only hull that can reach the wreck — and the wreck was already his business.',
  scenarioVersion: 'impr002-mare-v1',
  startNode: 'ma-partenza',
  primaryStats: ['perc', 'int'] as LabStat[],
  beats: [
    'The wreck on the flats',
    'His deck',
    'Small wrong things',
    'The shoal',
    'Inside his boarding plan',
    'The ghost in the hold',
    'The return',
  ],
  intelLabels: {
    'equipaggio-suo': 'his crew takes orders from his hands, not from the manifest',
    'polizza-ombra': 'the shadow policy — he insured the very wreck he «helps» you reach; written proof of motive',
    'traccia-maestro': 'the recovery master’s mark and registry number — a second shadow entity of the harbor',
  },
  initialVars: { sospetto: 0 },
  armRolls: [
    /* Same arming as palude: a party carrying a living 'prudente' rolls
     * once at runstart — armed, the nose becomes the third cracks channel. */
    { flag: 'fiuto-prudente', chance: 60, requiresTrait: 'prudente' },
  ],
  epilogue: {
    titles: [
      {
        label: 'Chain-breaker of the flats',
        requiresFlag: 'a-consegnato',
      },
    ],
    lore: [
      {
        label: 'He slipped back into his own channels — the sea keeps its shipowner. You will see his sail again.',
        requiresFlag: 'a-fuggito',
      },
      {
        label: 'The flats still answer to his hands — and now he knows your faces.',
        requiresFlag: 'a-padrone',
      },
      {
        label: 'The policy you carried ashore set two masters of the harbor accusing each other — the ledger is not closed.',
        requiresFlag: 'a-sgamato',
      },
      {
        label: 'Partners in a hollow deal — he paid with a smile.',
        requiresFlag: 'soci-traditi',
      },
      {
        label: 'The hold had been emptied long before — the prize was a ghost for everyone on the water.',
        requiresFlag: 'posta-mossa',
      },
      {
        label: 'He honoured the letter of the deal — and named the recovery master who emptied the hold first.',
        requiresFlag: 'soci-onorati',
      },
    ],
  },
  offer: {
    objective: 'Recover the wreck’s manifest and cargo from the flats — or whatever its loss is worth to the village.',
    tags: ['quest', 'imprint', 'impr002', 'mare', 'gen'],
    slots: {
      required: [
        {
          id: 'ma-slot-leader',
          label: 'Expedition leader',
          role: 'leader',
          statFocus: ['perc', 'int'],
          requirement: { label: 'Expedition leader', anyOf: ['precision', 'clarity'] },
        },
      ],
      optional: [
        {
          id: 'ma-slot-member-1',
          label: 'Fighter',
          role: 'member',
          statFocus: ['str', 'con'],
          requirement: { label: 'Fighter', anyOf: ['edge', 'fortitude', 'warden'] },
        },
        {
          id: 'ma-slot-member-2',
          label: 'Fixer',
          role: 'member',
          statFocus: ['cha', 'int'],
          requirement: { label: 'Fixer', anyOf: ['clarity', 'precision'] },
        },
        {
          id: 'ma-slot-bodyguard',
          label: 'Bodyguard',
          role: 'bodyguard',
          statFocus: ['con', 'agi'],
          requirement: { label: 'Bodyguard', anyOf: ['warden', 'fortitude'] },
        },
      ],
    },
    referenceParty: [
      { id: 'ma-ref-leader', name: 'Sera', role: 'leader', hp: 80, stats: { str: 45, con: 50, agi: 55, perc: 75, int: 65, cha: 55 } },
      { id: 'ma-ref-m1', name: 'Donno', role: 'member', hp: 75, stats: { str: 70, con: 65, agi: 45, perc: 35, int: 30, cha: 30 } },
      { id: 'ma-ref-m2', name: 'Iria', role: 'member', hp: 60, stats: { str: 35, con: 40, agi: 55, perc: 50, int: 65, cha: 70 } },
      { id: 'ma-ref-bg', name: 'Vast', role: 'bodyguard', hp: 85, stats: { str: 60, con: 75, agi: 50, perc: 30, int: 20, cha: 25 } },
    ],
    dangerBandRef: 'media',
    rewardBase: 70,
  },
  nodes: IMPR002_MARE_NODES,
} satisfies Omit<QuestScenario, 'primaryStats'> & { primaryStats: LabStat[] };

/** Parsed, validated scenario — the single source consumed by the engine. */
export const IMPR002_MARE_SCENARIO: QuestScenario = parseQuestScenario(IMPR002_MARE_SCENARIO_AUTHORED);
