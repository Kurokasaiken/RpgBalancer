/**
 * impr002Miniera — catalog imprint «La squadra del caposquadra»
 * (IMPR-002 × kit miniera, R-163: terza istanza compilata).
 *
 * Third compiled instance of «Il compagno che ride» — same B0–B6 spine as
 * `gen-impr002-palude` / `gen-impr002-mare`, domain physics of the deep.
 * With three instances the reusable spine stops being a hypothesis: the
 * deltas below are the authored flesh, and they are mechanical, not copy.
 *
 * Domain deltas vs palude/mare (kit `miniera` physics):
 *
 * - **A = who controls the missing means of B0** — the senior *foreman*:
 *   the missing means is a crew that knows the rock, and he controls the
 *   shift register — in a mine, who controls the register controls who
 *   was where.
 * - **B0 the alternative announces itself by noise.** Underground there
 *   are no eyewitnesses — evidence is physical or *sound* (kit rule). The
 *   waste gallery descent (con+int — reading rotten timber and bad air is
 *   knowledge, not athleticism) flags `annusati` on failure: a rockfall
 *   in the wrong gallery is a name spoken in the dark.
 * - **B2 the register is the documentary channel.** `turni-ombra` —
 *   shifts signed by dead men — proves the parallel extraction AND is the
 *   first trace of the thing below. One intel, two payoffs: feeds
 *   `sospetto`, gates `mi-sgama`, primes `traccia-morso`.
 * - **B4 adds `mi-via-puntelli` — bring the roof down.** First authored
 *   use of an environmental hazard as a combat alternative (the kit's
 *   `puntellamento che cede` turned weapon). It is the riskiest branch:
 *   win bypasses the fight entirely, a partial collapse becomes your
 *   ambush, and failure means fighting hurt — the rock doesn't care
 *   whose side it's on.
 * - **B5 the trapped men were TAKEN, not buried.** The stakes are people
 *   (R-165: «la posta deve sanguinare») — and TAKEN≠SECURED now applies
 *   to them: tools mid-stroke, drag marks toward the deep drift.
 *   `traccia-morso` seeds the entity of IMPR-001 instance C directly —
 *   the next quest looks for the taken.
 * - **B6 'a-sgamato' goes to the company's factor.** Deliver foreman +
 *   register: the company discovers the parallel extraction — and the
 *   dead men's signatures point somewhere worse.
 *
 * Beat → mechanics compilation (same contract, `QUEST_IMPRINTS`
 * §Compilazione): B0 → flag-priced fork; B1 → `squadra-di-a` priced at B3;
 * B2 → `sospetto` on `segna-gesti`/`segna-carta`/`segna-fiuto` + epicfail
 * `annusati`; B3 → post-effect goto router (identical to palude/mare);
 * B4 → force/surprise/roof/ascent/recita fork; B5 → `posta-mossa` on
 * every verdict row + `traccia-morso` on a good read; B6 → `a-consegnato`
 * / `a-fuggito` / `a-sgamato` / `a-padrone` / `soci-*` + TAKEN≠SECURED
 * ascent convoy (the deep does not surrender its foreman easily).
 *
 * English authored prose (R-135 baseline). Parses itself at import.
 */

import type { LabStat, QuestNode } from '@/ui/idleVillage/questS1Lab/questScenario';
import {
  parseQuestScenario,
  type QuestScenario,
} from '@/balancing/config/idleVillage/quests/questScenario.schema';

const inc = (v: string, n: number) => ({ var: v, op: 'inc' as const, value: n });

/* Same post-effect turn router as palude/mare — the imprint's B3 is the
 * shared skeleton: readiness → surprise, suspicion → confirmation,
 * spotted → heavy ambush, else → the trap lands blind. */
const TURN_GOTO = {
  branches: [
    { when: { flag: 'pronti' }, then: 'mi-disposti' },
    { when: { varGE: { var: 'sospetto', value: 2 } }, then: 'mi-lettura' },
    { when: { flag: 'annusati' }, then: 'mi-imboscata' },
  ],
  else: 'mi-trappola',
};

const IMPR002_MINIERA_NODES: Record<string, QuestNode> = {
  /* ---- B0 — PREMISE: the missing means is a crew that knows the rock ---- */
  'mi-partenza': {
    id: 'mi-partenza',
    kind: 'choice',
    title: 'The shift still inside',
    body: 'The collapse sealed the low gallery with a full shift inside — nine miners on bad air, their families already at the cage asking questions nobody can answer. Reaching them in time means a crew that knows which rock is safe to touch, and the only one belongs to the senior foreman: «my men know where to step — and I know where». He offers them free, for the good of the camp.',
    transit: 'The headframe creaks over a shaft full of waiting faces.',
    beat: 0,
    options: [
      {
        id: 'mi-accetta',
        label: 'Take the foreman’s crew',
        detail: 'His miners, his signals, his register — but they know the way down. Accepting puts his crew inside your rescue.',
        next: 'mi-discesa',
        sets: 'squadra-di-a',
      },
      {
        id: 'mi-rifiuta',
        label: 'Drop through the waste gallery',
        detail: 'Constitution + Intellect. The old adit might bypass his crews entirely — rotten timber, bad air, and every stumble echoes down there.',
        next: 'CHECK:mi-scarico',
        sets: 'rotta-propria',
      },
    ],
  },

  /* ---- B1 — THE HELP: his crew, his signals, your descent --------------- */
  'mi-discesa': {
    id: 'mi-discesa',
    kind: 'info',
    title: 'The cage goes down',
    body: 'The cage drops past lamp-light into working dark. His miners move through it like men on their own stairs — because they are. Every order travels on his whistle-code, not your leader’s voice — and not toward the trapped men either, unless the whistle says so. The descent is easy. That is exactly the problem.',
    transit: 'The miners answer you politely — after the whistle.',
    next: 'mi-segnali',
    beat: 1,
  },
  'mi-scarico': {
    id: 'mi-scarico',
    kind: 'check',
    title: 'The waste gallery',
    body: 'The abandoned adit: props gone soft as bread, air that sits in your chest like wet wool. Down here there are no witnesses — but the rock carries sound for a quarter mile, and a stone kicked loose in the wrong gallery has a name.',
    stats: ['con', 'int'],
    risk: { wound: 14, death: 3 },
    risky: true,
    failHint: 'the rock carries a stumble further than a shout.',
    beat: 1,
    verdictFlavor: {
      bigwin: 'You read the timbering like a ledger — where it holds, where it lies — and ghost the adit without waking a single prop.',
      win: 'A slow descent, a hard one — but the gallery keeps your secret.',
      almost: 'One prop groans and holds. Dust in your teeth, no names exchanged.',
      fail: 'A slab lets go behind you — the crack rolls down the galleries like a bell.',
      epicfail: 'The adit answers your weight with a section of roof — you crawl out bleeding, and announced.',
    },
    verdictTable: {
      /* An unseen descent IS readiness — but a rockfall announces you:
       * underground, failure is heard, not seen. */
      win: { setFlags: ['pronti'], goto: 'mi-segnali' },
      bigwin: { setFlags: ['pronti'], log: 'Silent as the rock allows — the adit keeps your secret.', goto: 'mi-segnali' },
      almost: { goto: 'mi-segnali' },
      fail: { damage: 8, setFlags: ['annusati'], log: 'The collapse echoes through every gallery he owns — he knows someone came the hard way.', goto: 'mi-segnali' },
      epicfail: { damage: 15, setFlags: ['annusati'], goto: 'mi-segnali' },
    },
  },

  /* ---- B2 — CRACKS: three one-shot channels feed `sospetto` ------------- */
  'mi-segnali': {
    id: 'mi-segnali',
    kind: 'choice',
    title: 'Small wrong things',
    body: 'Nothing is wrong that you could swear to — and several things are wrong. The miners work to his whistle-code, not to the shift bell. His lamp crew passed a gallery your map calls sealed — without slowing. Every crack has an innocent reading. You can collect them, or let them go.',
    transit: 'The kind of nothing that keeps a prudent mind awake.',
    beat: 2,
    options: [
      {
        id: 'mi-osserva',
        label: 'Read the whistle-code',
        detail: 'Perception. His crew works to signals that were never taught to outsiders — one careful listen is all a careful listen gets.',
        next: 'CHECK:mi-osserva',
        hiddenIfFlag: 'segna-gesti',
      },
      {
        id: 'mi-registro',
        label: 'Read the shift register',
        detail: 'Intellect. The register decides who was where — and registers can be made to lie in very specific ways.',
        next: 'CHECK:mi-registro',
        hiddenIfFlag: 'segna-carta',
      },
      {
        id: 'mi-fiuto',
        label: 'The prudent one’s nose',
        detail: 'Perception. Someone in your party smelled this days ago — let them show you what.',
        next: 'CHECK:mi-fiuto',
        requiresFlag: 'fiuto-prudente',
        hiddenIfFlag: 'segna-fiuto',
      },
      {
        id: 'mi-lascia',
        label: 'Let it slide — the lamps are lit',
        detail: 'You reach the low gallery as you are: trusting, or blind.',
        next: 'mi-avviso',
      },
    ],
  },
  'mi-osserva': {
    id: 'mi-osserva',
    kind: 'check',
    title: 'The whistle-code',
    body: 'In the dark, orders travel as sound: two short, one long, a trill that means something the shift bell never says. The miners answer the foreman’s code like a second nervous system.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 2,
    verdictFlavor: {
      bigwin: 'The code maps completely: spacing calls that move YOUR party apart, a signal rehearsed too smoothly to be new — this crew has done this before.',
      win: 'They take orders from his whistle. The expedition is cargo — they are not.',
      almost: 'Something in how the spacing calls move you apart. A hunch, not a proof.',
      fail: 'Work-songs and signals. Nothing a fair judge could object to.',
      epicfail: 'One of them catches you counting the calls — and whistles something new.',
    },
    verdictTable: {
      bigwin: { vars: [inc('sospetto', 1)], setFlags: ['segna-gesti'], setInfo: ['equipaggio-suo'], log: 'The crew is his — every order travels on his whistle-code.', goto: 'mi-segnali' },
      win: { vars: [inc('sospetto', 1)], setFlags: ['segna-gesti'], setInfo: ['equipaggio-suo'], goto: 'mi-segnali' },
      almost: { vars: [inc('sospetto', 1)], setFlags: ['segna-gesti'], goto: 'mi-segnali' },
      fail: { setFlags: ['segna-gesti'], goto: 'mi-segnali' },
      epicfail: { setFlags: ['segna-gesti', 'annusati'], log: 'They noticed you listening. Now they are listening back.', goto: 'mi-segnali' },
    },
  },
  'mi-registro': {
    id: 'mi-registro',
    kind: 'check',
    title: 'The shift register',
    body: 'In the lamp-room the register says who was where: shifts, crews, galleries. Three pages in, the entries stop matching the maps — his crews have been logging a gallery the maps call sealed, for months.',
    stats: ['int'],
    risk: { wound: 0, death: 0 },
    beat: 2,
    verdictFlavor: {
      bigwin: 'Months of entries, one pattern: his crew in a gallery the maps call sealed — and the timber and candles drawn for it charged to other crews. This is not an error. It is a hidden mine.',
      win: 'Shadow shifts: his crew has been working a gallery the maps call sealed.',
      almost: 'A crew listed where no crew should be — the hand is his clerk’s, the explanation missing.',
      fail: 'Names, lamp counts, galleries. Nothing a fair judge could object to.',
      epicfail: 'The lamp-boy notices your reading and mentions it where it pays to be mentioned.',
    },
    verdictTable: {
      bigwin: { vars: [inc('sospetto', 1)], setFlags: ['segna-carta'], setInfo: ['turni-ombra'], log: 'The register hides a second mine — and it has been hiding it for months.', goto: 'mi-segnali' },
      win: { vars: [inc('sospetto', 1)], setFlags: ['segna-carta'], setInfo: ['turni-ombra'], goto: 'mi-segnali' },
      almost: { vars: [inc('sospetto', 1)], setFlags: ['segna-carta'], goto: 'mi-segnali' },
      fail: { setFlags: ['segna-carta'], goto: 'mi-segnali' },
      epicfail: { setFlags: ['segna-carta', 'annusati'], log: 'Your reading of the register is now a fact he owns.', goto: 'mi-segnali' },
    },
  },
  'mi-fiuto': {
    id: 'mi-fiuto',
    kind: 'check',
    title: 'What the prudent one smelled',
    hidden: true,
    body: 'The careful member of your party kept their doubts quiet — until now. Show me what you saw, you say. They do.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 2,
    verdictFlavor: {
      bigwin: 'A catalogue: the extra candles drawn «for the low gallery», the picks counted out and never counted back, the fresh ore dust on boots that should only see the shaft.',
      win: 'His lamp crew carries more picks and more candles than an escort needs.',
      almost: 'A list of small things that add up to a posture, not a proof.',
      fail: 'Even the prudent one only has a smell — but the smell is real.',
      epicfail: 'They recount it loudly enough for the nearest lamp crew to hear.',
    },
    verdictTable: {
      bigwin: { vars: [inc('sospetto', 1)], setFlags: ['segna-fiuto'], setInfo: ['equipaggio-suo'], goto: 'mi-segnali' },
      win: { vars: [inc('sospetto', 1)], setFlags: ['segna-fiuto'], setInfo: ['equipaggio-suo'], goto: 'mi-segnali' },
      almost: { vars: [inc('sospetto', 1)], setFlags: ['segna-fiuto'], goto: 'mi-segnali' },
      fail: { vars: [inc('sospetto', 1)], setFlags: ['segna-fiuto'], goto: 'mi-segnali' },
      epicfail: { vars: [inc('sospetto', 1)], setFlags: ['segna-fiuto'], goto: 'mi-segnali' },
    },
  },

  /* ---- B3 — THE TURN: the vein was already his --------------------------- */
  'mi-avviso': {
    id: 'mi-avviso',
    kind: 'info',
    title: 'The cage-boy’s warning',
    body: 'Halfway down, the cage-boy rides the rope beside you for one dark stretch — long enough to whisper: «the low gallery didn’t fall by itself. His crews had been cutting beside it for months.» Then the rope pulls him up and away. Too late to matter for the descent; early enough to count.',
    transit: 'The evidence always arrives after descending — that is what makes it evidence.',
    next: 'mi-schieramento',
    beat: 3,
  },
  'mi-schieramento': {
    id: 'mi-schieramento',
    kind: 'check',
    title: 'The low gallery',
    body: 'The collapsed gallery opens ahead — and his men are already staged in it, not digging toward the trapped crew but holding the line of an undeclared side vein: HIS vein, cut alongside the seam that fell. The shape lands at once: his hidden digging weakened the roof that buried nine men, and your rescue is the legal cover for pulling the last load before the company notices. You were the witnesses of your own ambush — and of his crime.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 3,
    verdictFlavor: {
      bigwin: 'You read the whole shape of it before the first pick comes up — every man, every prop, every dark mouth he thinks he owns.',
      win: 'You see it: the spacing, the ready picks, the ore sacks already staged behind him.',
      almost: 'You catch the shape late — enough to know it is a shape.',
      fail: 'It takes you a breath too long to understand what the lamplight is showing.',
      epicfail: 'You are still counting men when the first pick rises.',
    },
    verdictTable: {
      bigwin: { goto: TURN_GOTO },
      win: { goto: TURN_GOTO },
      almost: { goto: TURN_GOTO },
      fail: { goto: TURN_GOTO },
      epicfail: { goto: TURN_GOTO },
    },
  },
  'mi-disposti': {
    id: 'mi-disposti',
    kind: 'info',
    title: 'You came unannounced',
    body: 'From the dark past their lamp-line you watch his crew take positions meant for a party that should never have seen them. He planned a trap for passengers — and you are not passengers. The dark is his. The first move is yours.',
    transit: 'You count his men while they count a trap that is not there.',
    next: 'mi-scelta',
    beat: 3,
  },
  'mi-lettura': {
    id: 'mi-lettura',
    kind: 'check',
    title: 'The pieces assemble',
    body: 'Every crack you collected lands at once: the whistle-code, the shadow shifts, the candles that never came back. You are not surprised — but knowing and acting are two different check rolls.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 3,
    verdictFlavor: {
      bigwin: 'You move before his whistle finishes the call — the cracks were worth every minute.',
      win: 'You are ready when it springs. The cracks paid.',
      almost: 'You catch it a breath late — late enough to lose the first word, not the first move.',
      fail: 'You had every clue and still freeze — the meaning arrives with the picks.',
      epicfail: 'The clues were there. You assembled them a heartbeat too late.',
    },
    verdictTable: {
      bigwin: { setFlags: ['pronti'], goto: 'mi-scelta' },
      win: { setFlags: ['pronti'], goto: 'mi-scelta' },
      almost: { setFlags: ['pronti'], goto: 'mi-scelta' },
      fail: { goto: 'mi-scelta' },
      epicfail: { goto: 'mi-scelta' },
    },
  },
  'mi-trappola': {
    id: 'mi-trappola',
    kind: 'check',
    title: 'It lands on you',
    body: 'The picks come up together — a work crew, not a rescue party. «Careful where you stand,» the foreman calls from behind the lamp-line, pleasant as a cage door closing. «The props don’t hold for everyone.» You walk into it open-eyed now, but it is open eyes at pick-point.',
    stats: ['agi'],
    risk: { wound: 15, death: 4 },
    risky: true,
    upfrontDamage: { amount: 12 },
    failHint: 'the cordon closes first — surprise was his, not yours.',
    beat: 3,
    verdictTable: {
      bigwin: { goto: 'mi-scelta' },
      win: { goto: 'mi-scelta' },
      almost: { goto: 'mi-scelta' },
      fail: { damage: 8, goto: 'mi-scelta' },
      epicfail: { damage: 15, goto: 'mi-scelta' },
    },
  },
  'mi-imboscata': {
    id: 'mi-imboscata',
    kind: 'check',
    title: 'He knew you knew',
    body: 'Your questions reached him before you reached the gallery — or your descent announced itself through the rock. The crew is already set and facing the approach he expects — you. «Mind the props,» he calls, friendly. «They’re particular about who walks under them.»',
    stats: ['agi'],
    risk: { wound: 20, death: 6 },
    risky: true,
    upfrontDamage: { amount: 20 },
    failHint: 'prepared for exactly you — the toll is heavier.',
    beat: 3,
    verdictTable: {
      bigwin: { goto: 'mi-scelta' },
      win: { goto: 'mi-scelta' },
      almost: { goto: 'mi-scelta' },
      fail: { damage: 10, goto: 'mi-scelta' },
      epicfail: { damage: 20, goto: 'mi-scelta' },
    },
  },

  /* ---- B4 — INSIDE OUT: his galleries, his dark, your move --------------- */
  'mi-scelta': {
    id: 'mi-scelta',
    kind: 'choice',
    title: 'Inside his gallery',
    body: 'The worked vein, the pick-line, nine men somewhere under his bad timbering. Force means his numbers in his dark. The ascent means leaving them to him. The rotten props overhead hold up more mountain than any crew — and his smile still offers a deal priced in silence about who put those men under.',
    transit: 'The kind of position you only get out of by paying.',
    beat: 4,
    options: [
      {
        id: 'mi-primo-colpo',
        label: 'Strike first — you saw it coming',
        detail: 'A two-turn fight on your timing, not his. The surprise is yours: it ends fast, one way or the other.',
        next: 'mi-scontro-sorpresa',
        requiresFlag: 'pronti',
      },
      {
        id: 'mi-via-forza',
        label: 'Fight the pick-line',
        detail: 'A four-turn fight — his numbers, his dark, his ground. It will cost blood whether it works or not.',
        next: 'mi-scontro',
      },
      {
        id: 'mi-via-puntelli',
        label: 'Cut the props — bring the roof down',
        detail: 'Agility. The timbering over their position is rotten — sever it and let the rock argue. The rock does not care whose side it takes.',
        next: 'CHECK:mi-puntelli',
      },
      {
        id: 'mi-via-fuga',
        label: 'Take the long ascent',
        detail: 'Strength + Constitution. Up the shaft against the shift bell — out of his reach and gone, if your arms hold.',
        next: 'CHECK:mi-risalita',
      },
      {
        id: 'mi-via-recita',
        label: 'Play the extraction partner',
        detail: 'Charisma. Smile, ask for a cut of the vein, become partners. If he reads the bluff, you do not get to offer twice.',
        next: 'CHECK:mi-farsa',
        hiddenIfFlag: 'smascherati',
      },
    ],
  },
  'mi-puntelli': {
    id: 'mi-puntelli',
    kind: 'check',
    title: 'The argument of rotten timber',
    body: 'You saw it on the way in: the props over their position are soft as old bread, and the load above them is a gallery’s worth of mountain. Three cuts, well placed, and the mine does your fighting. The trick is being somewhere else when it answers.',
    stats: ['agi'],
    risk: { wound: 20, death: 6 },
    risky: true,
    failHint: 'the rock does not care whose side it takes.',
    beat: 4,
    verdictFlavor: {
      bigwin: 'Three cuts and a held breath — the gallery folds onto his crew like a closing hand, and the dust settles on silence.',
      win: 'The props go — the roof comes down in a roar that ends the argument entirely.',
      almost: 'Partial collapse — half his line is down or scrambling, and the rest turn to find you already moving.',
      fail: 'The props hold — barely — and now his crew knows exactly where you are and what you tried.',
      epicfail: 'The rock comes down on everyone — you dig yourself out while his crew digs in for a fight.',
    },
    verdictTable: {
      /* Win: the rock does the fighting — his crew is buried or routed,
       * no combat node at all. Almost: the partial collapse becomes your
       * ambush. Fail: you fight hurt, on his ground. */
      bigwin: { setFlags: ['galleria-crollata'], log: 'The roof took the pick-line — the foreman is pulled from the dust alone.', goto: 'mi-in-piedi' },
      win: { setFlags: ['galleria-crollata'], goto: 'mi-in-piedi' },
      almost: { damage: 8, log: 'The half-collapse scatters them — you have the moment, not the victory.', goto: 'mi-scontro-sorpresa' },
      fail: { damage: 12, goto: 'mi-scontro' },
      epicfail: { damage: 22, goto: 'mi-scontro' },
    },
  },
  'mi-scontro-sorpresa': {
    id: 'mi-scontro-sorpresa',
    kind: 'combat',
    title: 'Your ambush',
    body: 'You were the witnesses of your own ambush — so you spring yours first.',
    transit: 'The moment is chosen. His pick-line turns toward the wrong dark.',
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
      nextCleared: 'mi-in-piedi',
      nextSurvivors: 'mi-respinti',
      enemyName: 'Vein-crew',
      attackLines: {
        bigwin: 'You hit the pick-line where its lamps were pointing the wrong way.',
        win: 'First blood is yours — the trap springs backwards.',
        almost: 'A ragged strike in the dark — they reel, but they answer.',
        fail: 'Your surprise meets miners who fight in the dark for a living — it hurts them less than it should.',
        epicfail: 'The strike comes apart in the dark — now they know everything.',
      },
      clearedText: 'The pick-line breaks. His gallery, your field — the foreman is on his knees.',
      survivorsText: 'The surprise bought you a moment, not the gallery — his crew closes around it again.',
      holdingText: 'Turn {turn} closed — his vein-crew still holds the gallery ({left} standing).',
    },
  },
  'mi-scontro': {
    id: 'mi-scontro',
    kind: 'combat',
    title: 'The pick-line',
    body: 'Picks against steel, in the dark they were born to. You are inside his disposition — the only way out is through.',
    transit: 'The gallery closes around the fight like a second opponent.',
    previewHint: 'A long fight on his terms — they know where to step and you don’t.',
    beat: 4,
    combat: {
      turns: 4,
      enemies: 5,
      attackStats: ['str', 'con'],
      killPerWin: 2,
      killPerBigwin: 3,
      hitDamage: 10,
      escalateProfile: true,
      nextCleared: 'mi-in-piedi',
      nextSurvivors: 'mi-respinti',
      enemyName: 'Vein-crew',
      attackLines: {
        bigwin: 'A gap in the pick-line — you drive the whole party through it.',
        win: 'You break one end of his line before it can close.',
        almost: 'You trade blows with men who swing picks for a living.',
        fail: 'The picks find their range — his men know this dark better than your steel knows it.',
        epicfail: 'The pick-line contracts around you like a cage dropping.',
      },
      clearedText: 'The pick-line breaks apart on his own ground. The foreman stands alone.',
      survivorsText: 'The pick-line holds — barely, but it holds. His crew is still between you and everything.',
      holdingText: 'Turn {turn} closed — the pick-line still stands ({left} picks up).',
    },
  },
  'mi-risalita': {
    id: 'mi-risalita',
    kind: 'check',
    title: 'The long ascent',
    body: 'You break for the shaft — rope, ladder, and the shift bell already ringing the next crew down against you. Getting out means climbing past men who own every level.',
    stats: ['str', 'con'],
    risk: { wound: 18, death: 5 },
    risky: true,
    failHint: 'they hold the levels above you — the climb still works, at a price.',
    beat: 4,
    verdictFlavor: {
      bigwin: 'You are past the second level before his whistle catches up.',
      win: 'Arms burning, bell ringing — the pick-line loses you to the shaft.',
      almost: 'You surface with torn hands and his whistles fading below.',
      fail: 'They cut the ladder line above you — out is out, but it costs.',
      epicfail: 'A pick finds the rope mid-climb — you surface bleeding, but you surface.',
    },
    verdictTable: {
      bigwin: { setFlags: ['a-padrone'], goto: 'mi-ritorno' },
      win: { setFlags: ['a-padrone'], goto: 'mi-ritorno' },
      almost: { setFlags: ['a-padrone'], goto: 'mi-ritorno' },
      fail: { setFlags: ['a-padrone'], damage: 10, goto: 'mi-ritorno' },
      epicfail: { setFlags: ['a-padrone'], damage: 18, goto: 'mi-ritorno' },
    },
  },
  'mi-farsa': {
    id: 'mi-farsa',
    kind: 'check',
    title: 'The performance',
    body: 'You keep playing the rescue crew he escorted: polite, useful, blind. The question is who is performing for whom — you offer a partnership in the vein as if nine men weren’t buried under the bargain.',
    stats: ['cha'],
    risk: { wound: 0, death: 0 },
    beat: 4,
    verdictFlavor: {
      bigwin: 'He laughs — the real one, the one that respects a player. «Partners, then.»',
      win: 'He weighs you, smiles, and waves the picks down. A deal is a deal — in his gallery.',
      almost: 'He plays along watching you the whole time — a partnership with a hand on the pick.',
      fail: 'His smile does not change, but his crew shifts their grip. He read you.',
      epicfail: 'He applauds the performance — then names what you were doing, out loud, in front of his crew.',
    },
    verdictTable: {
      bigwin: { goto: 'mi-soci' },
      win: { goto: 'mi-soci' },
      almost: { goto: 'mi-soci' },
      fail: { setFlags: ['smascherati'], damage: 6, log: 'He read the bluff — the offer is gone from the table.', goto: 'mi-scelta' },
      epicfail: { setFlags: ['smascherati'], damage: 12, log: 'Unmasked in front of his crew — you will not get to offer twice.', goto: 'mi-scelta' },
    },
  },
  'mi-in-piedi': {
    id: 'mi-in-piedi',
    kind: 'choice',
    title: 'The foreman, kneeling',
    body: 'His crew is buried, broken, or fled — his own arithmetic, this time. He kneels in the dust of the gallery that put nine men under for his ledger — calm even now, already pricing what your party’s silence is worth. He knows every level, every seam, every name the register ever signed.',
    transit: 'The dust settles. Even the rock seems to wait for your call.',
    beat: 4,
    options: [
      {
        id: 'mi-lega',
        label: 'Bind him — he answers to the company',
        detail: 'The man who owned the register, delivered. That is worth more to the village than the cargo ever was — if you get him to the surface.',
        next: 'CHECK:mi-vena',
        sets: 'a-prigioniero',
      },
      {
        id: 'mi-sgama',
        label: 'Hold him AND the register — the shifts are evidence',
        detail: 'The shadow shifts in his own hand, and the man who wrote them. The factor will want both — and the dead man’s signature raises questions nobody can ignore.',
        next: 'CHECK:mi-vena',
        sets: 'a-sgamato',
        requiresInfo: 'turni-ombra',
      },
      {
        id: 'mi-lascialo',
        label: 'Let him run the deep',
        detail: 'He will vanish into galleries no register maps. The deep keeps its foreman — and you keep your hands clean of a fight you already won.',
        next: 'CHECK:mi-vena',
        sets: 'a-fuggito',
      },
    ],
  },
  'mi-soci': {
    id: 'mi-soci',
    kind: 'choice',
    title: 'His hand, extended',
    body: 'Partners in the vein, then — his smile says he respects the play, and his eyes say he prices it too. The face is ahead; the split is here. Shake on it, or walk away from the only offer underground.',
    beat: 4,
    options: [
      {
        id: 'mi-stretta',
        label: 'Take the deal — split the vein',
        detail: 'Partners. He pays a share for silence, and a share of whatever the face still holds.',
        next: 'CHECK:mi-vena',
        sets: 'soci',
      },
      {
        id: 'mi-niente-accordo',
        label: 'No deal — back off',
        detail: 'You do not shake a hand that was on a pick a minute ago. He keeps his galleries; you keep your options.',
        next: 'CHECK:mi-vena-lontana',
        sets: 'a-padrone',
      },
    ],
  },
  'mi-respinti': {
    id: 'mi-respinti',
    kind: 'choice',
    title: 'The dark is still his',
    body: 'The pick-line holds — barely, but it holds, and bleeding in his dark is a bet that gets worse every breath. You back off toward the shaft while his crew watches you go.',
    beat: 4,
    options: [
      {
        id: 'mi-indietro',
        label: 'Back off and watch from the level',
        detail: 'You keep your distance and your lives — and you get to watch what he came for.',
        next: 'CHECK:mi-vena-lontana',
        sets: 'a-padrone',
      },
    ],
  },

  /* ---- B5 — IRONY: the vein was bitten before the game began ------------- */
  'mi-vena': {
    id: 'mi-vena',
    kind: 'check',
    title: 'Where the shift was',
    body: 'Through the broken seam to where the trapped crew should be — and the dark answers wrong. No men, no bodies. Tools put down mid-stroke, lamps still burning, and drag marks — heavy, wrong-footed — pulling away from the collapse toward the deeper drift. The trapped miners did not die under the rock. Something came through it and took them.',
    stats: ['perc', 'int'],
    risk: { wound: 0, death: 0 },
    beat: 5,
    verdictFlavor: {
      bigwin: 'The drag marks are readable: something came through the broken seam and took the living, not the dead — toward the deeper drift, and the marks are fresh.',
      win: 'No bodies where bodies should be — the shift was taken, not buried.',
      almost: 'Empty. The question is no longer where they are — it is what reached them first.',
      fail: 'Empty. Whatever answer the dark held, it slips through your hands.',
      epicfail: 'Empty, and a prop gives way on your shoulder besides.',
    },
    verdictTable: {
      bigwin: {
        setFlags: ['posta-mossa'],
        setInfo: ['traccia-morso'],
        goldDelta: 15,
        log: 'Drag marks toward the deep drift — the trapped crew was taken alive. The thing below is real, and it is recent.',
        goto: {
          branches: [
            { when: { flag: 'a-prigioniero' }, then: 'mi-convoglio' },
            { when: { flag: 'a-sgamato' }, then: 'mi-consegna' },
            { when: { flag: 'soci' }, then: 'mi-patto' },
          ],
          else: 'mi-ritorno',
        },
      },
      win: {
        setFlags: ['posta-mossa'],
        setInfo: ['traccia-morso'],
        goto: {
          branches: [
            { when: { flag: 'a-prigioniero' }, then: 'mi-convoglio' },
            { when: { flag: 'a-sgamato' }, then: 'mi-consegna' },
            { when: { flag: 'soci' }, then: 'mi-patto' },
          ],
          else: 'mi-ritorno',
        },
      },
      almost: {
        setFlags: ['posta-mossa'],
        goto: {
          branches: [
            { when: { flag: 'a-prigioniero' }, then: 'mi-convoglio' },
            { when: { flag: 'a-sgamato' }, then: 'mi-consegna' },
            { when: { flag: 'soci' }, then: 'mi-patto' },
          ],
          else: 'mi-ritorno',
        },
      },
      fail: {
        setFlags: ['posta-mossa'],
        goto: {
          branches: [
            { when: { flag: 'a-prigioniero' }, then: 'mi-convoglio' },
            { when: { flag: 'a-sgamato' }, then: 'mi-consegna' },
            { when: { flag: 'soci' }, then: 'mi-patto' },
          ],
          else: 'mi-ritorno',
        },
      },
      epicfail: {
        setFlags: ['posta-mossa'],
        damage: 5,
        goto: {
          branches: [
            { when: { flag: 'a-prigioniero' }, then: 'mi-convoglio' },
            { when: { flag: 'a-sgamato' }, then: 'mi-consegna' },
            { when: { flag: 'soci' }, then: 'mi-patto' },
          ],
          else: 'mi-ritorno',
        },
      },
    },
  },
  'mi-vena-lontana': {
    id: 'mi-vena-lontana',
    kind: 'check',
    title: 'Where the shift was — from the level',
    body: 'You watch his crew reach where the trapped men should be — and watch the foreman’s lantern stop dead. No men, no bodies; whatever took them took the value out of his secret too. The curse he spits into the dark is the answer you would have paid blood for: empty. For him too.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 5,
    verdictFlavor: {
      bigwin: 'You even catch what his crew won’t look at — drag marks toward the drift, tools left mid-stroke. No rock did that. Something down here got there first.',
      win: 'Empty — for him as much as for you. The taken took everyone’s answer with them.',
      almost: 'His men carry it off empty. You read the defeat in their shoulders.',
      fail: 'Too far to read more than the shape of disappointment.',
      epicfail: 'A pick cracks against rock too close — you press lower than the sound.',
    },
    verdictTable: {
      bigwin: { setFlags: ['posta-mossa'], setInfo: ['traccia-morso'], goto: 'mi-ritorno' },
      win: { setFlags: ['posta-mossa'], goto: 'mi-ritorno' },
      almost: { setFlags: ['posta-mossa'], goto: 'mi-ritorno' },
      fail: { setFlags: ['posta-mossa'], goto: 'mi-ritorno' },
      epicfail: { setFlags: ['posta-mossa'], goto: 'mi-ritorno' },
    },
  },
  'mi-convoglio': {
    id: 'mi-convoglio',
    kind: 'check',
    title: 'The ascent convoy',
    body: 'Bound and quiet, he climbs your rope through levels his own crews know — a man who sent nine miners under bad timber for his vein, being carried toward daylight. Every shadow that falls in step behind belongs to him. Getting him to the surface is the whole job now — the deep does not surrender its foreman easily.',
    stats: ['agi', 'con'],
    risk: { wound: 14, death: 4 },
    risky: true,
    failHint: 'his crews shadow the ascent — in the dark, down a side gallery, he is gone.',
    beat: 5,
    verdictFlavor: {
      bigwin: 'You land him at the headframe before his crews finish planning the rescue — and under oath, he tells you what really reached the trapped men first.',
      win: 'The convoy holds. He steps into daylight in your custody — and the deep loses its register-keeper.',
      almost: 'One scramble in a side drift, one pick too close — but he arrives bound.',
      fail: 'A lamp flares in a side gallery; a scuffle answers it. By the next level the deep has him back.',
      epicfail: 'His crews take the level like it owes them — the convoy breaks, and he is gone into his own element.',
    },
    verdictTable: {
      bigwin: { setObjective: 'done', setFlags: ['a-consegnato'], setInfo: ['traccia-morso'], log: 'Delivered — and talking. He names what took the trapped crew, and it was never the rock.', goto: 'mi-fine' },
      win: { setObjective: 'done', setFlags: ['a-consegnato'], goto: 'mi-fine' },
      almost: { setObjective: 'done', setFlags: ['a-consegnato'], damage: 10, goto: 'mi-fine' },
      fail: { setFlags: ['a-fuggito'], damage: 10, log: 'He slipped into a side gallery in the dark — the deep keeps its foreman. You will meet him again.', goto: 'mi-fine' },
      epicfail: { setFlags: ['a-fuggito'], damage: 18, log: 'He slipped into a side gallery in the dark — the deep keeps its foreman. You will meet him again.', goto: 'mi-fine' },
    },
  },
  'mi-consegna': {
    id: 'mi-consegna',
    kind: 'check',
    title: 'The evidence ascent',
    body: 'Bound, and bound in paper: the register rides in a sealed pouch beside him — crews in a sealed gallery, timber charged to other names, months of it, and nine men under the roof it bought. The factor will read it as what it is: the cause of the collapse, in his own clerk’s hand.',
    stats: ['cha', 'int'],
    risk: { wound: 0, death: 0 },
    beat: 5,
    verdictFlavor: {
      bigwin: 'The factor reads the shadow shifts twice — then asks, quietly, what the nine trapped men were actually buried over. Two questions begin answering each other in the same ledger.',
      win: 'He surfaces with the register. The factor has both the man and the motive — and a second question to chase.',
      almost: 'The delivery holds, barely — the paperwork survives where the man almost does not.',
      fail: 'Somewhere between the third level and daylight, a tally-man is paid and a rope is loosed. The register stays; the man goes.',
      epicfail: 'The convoy arrives with the register intact and an empty rope — his money climbed faster than your evidence.',
    },
    verdictTable: {
      bigwin: { setObjective: 'done', setFlags: ['a-consegnato'], setInfo: ['traccia-morso'], goldDelta: 25, log: 'Delivered with the register — his hidden dig and the taken men now point at each other in the same ledger.', goto: 'mi-fine' },
      win: { setObjective: 'done', setFlags: ['a-consegnato'], setInfo: ['traccia-morso'], goldDelta: 15, goto: 'mi-fine' },
      almost: { setObjective: 'done', setFlags: ['a-consegnato'], goto: 'mi-fine' },
      fail: { setFlags: ['a-fuggito'], setInfo: ['traccia-morso'], log: 'He bought his way off the ascent — but the register stayed. His part in the collapse is out of the bag.', goto: 'mi-fine' },
      epicfail: { setFlags: ['a-fuggito'], setInfo: ['traccia-morso'], damage: 8, log: 'He bought his way off the ascent — but the register stayed. His part in the collapse is out of the bag.', goto: 'mi-fine' },
    },
  },
  'mi-patto': {
    id: 'mi-patto',
    kind: 'check',
    title: 'The letter of the deal',
    body: 'Partners in a vein whose real price was nine men. Now you hold him to the letter: a cut of the operation — and an answer. He knows exactly what moves in the deeper drift. He just needs a reason to say it.',
    stats: ['cha'],
    risk: { wound: 0, death: 0 },
    beat: 5,
    verdictFlavor: {
      bigwin: 'He pays the share — and gives you the truth like a man settling two debts with one coin. The thing below has a history, and now so do you.',
      win: 'A thin share, but a real one — and a word about the drag marks whispered like it costs him.',
      almost: 'A token payment and a promise about the face. Half a deal is still a deal.',
      fail: 'He pays you in smiles — the letter of the deal says you are owed exactly nothing.',
      epicfail: 'The deal dissolves like lamplight in deep dark. He owes you nothing, and now he knows you think otherwise.',
    },
    verdictTable: {
      bigwin: { setObjective: 'done', setFlags: ['soci-onorati'], setInfo: ['traccia-morso'], goldDelta: 30, log: 'His share — and what he knows about what took his trapped crew.', goto: 'mi-fine' },
      win: { setObjective: 'done', setFlags: ['soci-onorati'], setInfo: ['traccia-morso'], goldDelta: 20, goto: 'mi-fine' },
      almost: { setObjective: 'done', goldDelta: 10, goto: 'mi-fine' },
      fail: { setFlags: ['soci-traditi'], goto: 'mi-fine' },
      epicfail: { setFlags: ['soci-traditi'], goto: 'mi-fine' },
    },
  },

  /* ---- B6 — FORK: the deep gives back ------------------------------------ */
  'mi-ritorno': {
    id: 'mi-ritorno',
    kind: 'info',
    fase: 'ritorno',
    title: 'The levels give you back',
    body: 'The galleries close behind you with no comment. Whatever happened at the seam, nine families still wait at the cage — and the deep keeps its own answer about where their men went.',
    transit: 'A quiet way up, purchased one way or another.',
    next: 'mi-fine',
    beat: 6,
  },
  'mi-fine': {
    id: 'mi-fine',
    kind: 'end',
    fase: 'ritorno',
    title: 'Return to the village',
    body: 'The expedition is over. The village gets its answer about the collapse — and a worse question about where the taken went.',
    beat: 6,
  },
};

/**
 * Authored scenario literal (pre-parse). Same 'gen' profile and the same
 * `gen-<imprint>-<domain>` provenance as the previous two instances.
 */
export const IMPR002_MINIERA_SCENARIO_AUTHORED = {
  id: 'gen-impr002-miniera',
  title: 'The Foreman’s Crew',
  flavour: 'His men know where to walk — because they have been walking an unmapped vein for months.',
  scenarioVersion: 'impr002-miniera-v1',
  startNode: 'mi-partenza',
  primaryStats: ['perc', 'int'] as LabStat[],
  beats: [
    'The shift still inside',
    'The cage goes down',
    'Small wrong things',
    'The low gallery',
    'Inside his gallery',
    'Where the shift was',
    'The ascent',
  ],
  intelLabels: {
    'equipaggio-suo': 'his crew works to his whistle-code, not the shift bell — and their spacing keeps you where he wants you',
    'turni-ombra': 'his crew has been digging a sealed gallery for months — the register hides it, and hiding it is the crime',
    'traccia-morso': 'the trapped miners were taken, not buried — drag marks toward the deeper drift; the thing below is real, and it is recent',
  },
  initialVars: { sospetto: 0 },
  armRolls: [
    /* Same arming as the other instances: a party carrying a living
     * 'prudente' rolls once at runstart — armed, the nose becomes the
     * third cracks channel. */
    { flag: 'fiuto-prudente', chance: 60, requiresTrait: 'prudente' },
  ],
  epilogue: {
    titles: [
      {
        label: 'Breaker of the shadow shifts',
        requiresFlag: 'a-consegnato',
      },
    ],
    lore: [
      {
        label: 'He slipped back into his own galleries — the man who buried nine miners for a vein is still down there. You will hear his whistle again.',
        requiresFlag: 'a-fuggito',
      },
      {
        label: 'The register still answers to his hand — and nine families still wait for an answer he already has.',
        requiresFlag: 'a-padrone',
      },
      {
        label: 'The register you carried to daylight told the factor two things at once — who dug the vein, and who paid for the roof it weakened. Neither ledger is closed.',
        requiresFlag: 'a-sgamato',
      },
      {
        label: 'Partners in a vein paid for in buried men — he paid with a smile.',
        requiresFlag: 'soci-traditi',
      },
      {
        label: 'The trapped crew was never under the rock — drag marks lead to the deeper drift, and something down there is still keeping their hours.',
        requiresFlag: 'posta-mossa',
      },
      {
        label: 'You argued with the mountain itself — and the mountain won your fight for you.',
        requiresFlag: 'galleria-crollata',
      },
      {
        label: 'He honoured the letter of the deal — and told you what the taken men went toward.',
        requiresFlag: 'soci-onorati',
      },
    ],
  },
  offer: {
    objective: 'Reach the miners trapped in the collapsed gallery — or answer for what put them there.',
    tags: ['quest', 'imprint', 'impr002', 'miniera', 'gen'],
    slots: {
      required: [
        {
          id: 'mi-slot-leader',
          label: 'Expedition leader',
          role: 'leader',
          statFocus: ['perc', 'int'],
          requirement: { label: 'Expedition leader', anyOf: ['precision', 'clarity'] },
        },
      ],
      optional: [
        {
          id: 'mi-slot-member-1',
          label: 'Fighter',
          role: 'member',
          statFocus: ['str', 'con'],
          requirement: { label: 'Fighter', anyOf: ['edge', 'fortitude', 'warden'] },
        },
        {
          id: 'mi-slot-member-2',
          label: 'Fixer',
          role: 'member',
          statFocus: ['cha', 'int'],
          requirement: { label: 'Fixer', anyOf: ['clarity', 'precision'] },
        },
        {
          id: 'mi-slot-bodyguard',
          label: 'Bodyguard',
          role: 'bodyguard',
          statFocus: ['con', 'agi'],
          requirement: { label: 'Bodyguard', anyOf: ['warden', 'fortitude'] },
        },
      ],
    },
    referenceParty: [
      { id: 'mi-ref-leader', name: 'Bren', role: 'leader', hp: 80, stats: { str: 45, con: 50, agi: 55, perc: 75, int: 65, cha: 55 } },
      { id: 'mi-ref-m1', name: 'Otta', role: 'member', hp: 75, stats: { str: 70, con: 65, agi: 45, perc: 35, int: 30, cha: 30 } },
      { id: 'mi-ref-m2', name: 'Liss', role: 'member', hp: 60, stats: { str: 35, con: 40, agi: 55, perc: 50, int: 65, cha: 70 } },
      { id: 'mi-ref-bg', name: 'Gorm', role: 'bodyguard', hp: 85, stats: { str: 60, con: 75, agi: 50, perc: 30, int: 20, cha: 25 } },
    ],
    dangerBandRef: 'media',
    rewardBase: 70,
  },
  nodes: IMPR002_MINIERA_NODES,
} satisfies Omit<QuestScenario, 'primaryStats'> & { primaryStats: LabStat[] };

/** Parsed, validated scenario — the single source consumed by the engine. */
export const IMPR002_MINIERA_SCENARIO: QuestScenario = parseQuestScenario(IMPR002_MINIERA_SCENARIO_AUTHORED);
