/**
 * SterminioGoblinScenario — authored S1 quest «Sterminio dei goblin».
 *
 * Director-authored spec: `src/docs/docs/idle_village/quest_sterminio_goblin_spec.md`
 * (PLAN-022). Combat quest, Forza-based, positional slot targeting:
 * the risk lives at the back of the formation — 4 alive → 0/0/20/80 —
 * and compacts when someone dies. NOT a general engine: hardcoded matrix.
 */

import type { LabStat, PartyPreset, QuestNode } from './questScenario';

/** Quest's declared primary stats: Forza solves it, Percezione is the hidden edge. */
export const GOBLIN_PRIMARY_STATS: LabStat[] = ['str', 'perc'];

/** Progress beats for the quest progress indicator. */
export const GOBLIN_BEATS = [
  'Assegnazione',
  'Esplorazione',
  'Bottino',
  'Accampamento',
  'Combattimento',
  'Incalzare',
  'Razzia',
  'Ritorno',
] as const;

/* ------------------------------------------------------------------ */
/* Nodes — F0..F7 from the authored spec.                               */
/* ------------------------------------------------------------------ */

export const GOBLIN_NODES: Record<string, QuestNode> = {
  /* F0 — ASSEGNAZIONE: combat quest, Forza visible, Percezione revealable,
   * three consumables carried (granted by the preset flags). No check. */
  'gob-inizio': {
    id: 'gob-inizio',
    kind: 'choice',
    title: 'Assegnazione — Sterminio dei goblin',
    body: 'I goblin razziano i confini. Sterminateli.',
    beat: 0,
    options: [
      {
        id: 'gob-partenza',
        label: 'Partire',
        detail: 'Bonus Forza, Bonus Percezione e una cura nella sacca. Si marcia.',
        next: 'gob-esplora',
      },
    ],
  },

  /* F1 — ESPLORAZIONE: two alternative checks.
   * PER success → stealth bonus (F3). PER+FOR success → opens F2, fail −10 HP. */
  'gob-esplora': {
    id: 'gob-esplora',
    kind: 'choice',
    title: 'Esplorazione — cercare tracce',
    body: 'Il bosco tace. Da qualche parte, il campo dei goblin.',
    beat: 1,
    options: [
      {
        id: 'gob-cerca-tracce',
        label: 'Cercare tracce',
        detail: 'Percezione. Se vedi bene, sai come avvicinarti.',
        next: 'CHECK:gob-tracce-per',
      },
      {
        id: 'gob-forza-tracce',
        label: 'Seguire il sentiero a forza',
        detail: 'Percezione + Forza. Può aprire un’occasione — o costare sangue.',
        next: 'CHECK:gob-tracce-perfor',
      },
    ],
  },
  'gob-tracce-per': {
    id: 'gob-tracce-per',
    kind: 'check',
    title: 'Tracce nel sottobosco',
    body: 'Orme, rami spezzati, gocce scure.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 1,
  },
  'gob-tracce-perfor': {
    id: 'gob-tracce-perfor',
    kind: 'check',
    title: 'Il sentiero bloccato',
    body: 'Un masso sospeso sul passaggio: guardarlo costa occhio, spostarlo costa schiena.',
    stats: ['perc', 'str'],
    risk: { wound: 0, death: 0 },
    beat: 1,
  },

  /* F2 — EVENTO OPZIONALE (bottino): only if PER+FOR succeeded.
   * DEX: item anyway; fail → 10 dmg + campo allertato (malus F4). */
  'gob-bottino-scelta': {
    id: 'gob-bottino-scelta',
    kind: 'choice',
    title: 'Un nascondiglio',
    body: 'Sotto il masso, un bottino avvolto in stracci. Prenderlo in silenzio costa mano ferma.',
    beat: 2,
    options: [
      {
        id: 'gob-prendi',
        label: 'Prendere il bottino',
        detail: 'Destrezza. Il rumore può svegliare il campo.',
        next: 'CHECK:gob-bottino',
      },
      {
        id: 'gob-lascia-bottino',
        label: 'Lasciare stare',
        detail: 'Nessun rumore, nessun rischio — nessun bottino.',
        next: 'gob-accampamento',
      },
    ],
  },
  'gob-bottino': {
    id: 'gob-bottino',
    kind: 'check',
    title: 'Mani sul bottino',
    body: 'Catene, campanelli, un nodo da sciogliere senza un suono.',
    stats: ['agi'],
    risk: { wound: 0, death: 0 },
    beat: 2,
  },

  /* F3 — ACCAMPAMENTO: Stealth (DEX) vs Assalto (FOR).
   * Same lever (+Danno a F4), different risk. */
  'gob-accampamento': {
    id: 'gob-accampamento',
    kind: 'choice',
    title: 'L’accampamento goblin',
    body: 'Fumi tra le tende. Da qui si colpisce in un modo solo — il vostro.',
    beat: 3,
    options: [
      {
        id: 'gob-via-stealth',
        label: 'Stealth',
        detail: 'Destrezza. Bonus maggiore — ma se vi vedono, il campo è all’erta.',
        next: 'CHECK:gob-stealth',
      },
      {
        id: 'gob-via-assalto',
        label: 'Assalto',
        detail: 'Forza. Bonus moderato — il fallimento non costa nulla.',
        next: 'CHECK:gob-assalto',
      },
    ],
  },
  'gob-stealth': {
    id: 'gob-stealth',
    kind: 'check',
    title: 'Stealth — tra le ombre',
    body: 'Un filo di latta tra i paletti. Ogni passo è un suono possibile.',
    stats: ['agi'],
    risk: { wound: 0, death: 0 },
    beat: 3,
  },
  'gob-assalto': {
    id: 'gob-assalto',
    kind: 'check',
    title: 'Assalto — la carica',
    body: 'Sfondare la linea prima che possano formarla.',
    stats: ['str'],
    risk: { wound: 0, death: 0 },
    beat: 3,
  },

  /* F4 — COMBATTIMENTO: X turns of mutual damage, positional targeting with
   * escalation; no instant death — only HP. */
  'gob-combattimento': {
    id: 'gob-combattimento',
    kind: 'combat',
    title: 'Combattimento — il campo dei goblin',
    body: 'Li avete. O loro.',
    beat: 4,
    combat: {
      turns: 5,
      enemies: 6,
      attackStats: ['str'],
      killPerWin: 1,
      killPerBigwin: 2,
      hitDamage: 12, // placeholder — calibrazione MC
      escalateProfile: true,
      nextCleared: 'gob-esplora-extra', // sterminio → F5 skipped
      nextSurvivors: 'gob-incalzare',
    },
  },

  /* F5 — INCALZARE: let them flee (mild ambush) or pursue (FORZA check with
   * verdict bands: almost = fail-mild, fail/epicfail = worsened ambush). */
  'gob-incalzare': {
    id: 'gob-incalzare',
    kind: 'choice',
    title: 'I goblin fuggono',
    body: 'I superstiti corrono verso il bosco. Chiuderli qui — o lasciarli andare.',
    beat: 5,
    options: [
      {
        id: 'gob-lascia-fuggire',
        label: 'Lasciarli fuggire',
        detail: 'Torneranno. Li rivedrete sulla strada di casa.',
        next: 'gob-esplora-extra',
        sets: 'agguatoMite', // R-097: letting them go = the MILD ambush
      },
      {
        id: 'gob-insegui',
        label: 'Incalzare',
        detail: 'Forza. Chiudeteli qui — o vi danno la caccia fino in fondo.',
        next: 'CHECK:gob-incalza-check',
      },
    ],
  },
  'gob-incalza-check': {
    id: 'gob-incalza-check',
    kind: 'check',
    title: 'Incalzare i fuggitivi',
    body: 'La caccia attraverso le rocce. Ogni metro guadagnato è uno di troppo.',
    stats: ['str'],
    risk: { wound: 0, death: 0 },
    beat: 5,
    // R-097: pursuit-fail is a commitment, not a free-roll — the ambush is
    // worsened AND dropping the trophy no longer saves you (forced last stand).
    failHint: 'Se falliscono, vi hanno visti: l’agguato peggiora e non potrete mollare il trofeo.',
  },

  /* F6 — CONTINUA L'ESPLORAZIONE: push-your-luck, damage grows 5→10→15. */
  'gob-esplora-extra': {
    id: 'gob-esplora-extra',
    kind: 'choice',
    title: 'Il campo conquistato',
    body: 'Cenere e tende rovesciate. Potete frugare ancora — ogni turno in più costa di più.',
    beat: 6,
    options: [
      {
        id: 'gob-fruga',
        label: 'Frugare ancora',
        detail: 'Intelligenza o Percezione. Danni crescenti a ogni turno.',
        next: 'CHECK:gob-cerca',
      },
      {
        id: 'gob-fermati',
        label: 'Fermarsi',
        detail: 'Avete preso abbastanza. Si torna a casa.',
        next: 'gob-ritorno',
      },
    ],
  },
  'gob-cerca': {
    id: 'gob-cerca',
    kind: 'check',
    title: 'Razzia del campo',
    body: 'Tra le tende bruciate e le trappole lasciate dai goblin.',
    stats: ['int', 'perc'],
    risk: { wound: 0, death: 0 },
    beat: 6,
  },

  /* F7 — RITORNO / AGGUATO. 'gob-ritorno' routes: sterminio → end clean;
   * else → ambush (5 dry dmg to all) → drop trophy OR last stand. */
  'gob-ritorno': {
    id: 'gob-ritorno',
    kind: 'info',
    title: 'La via del ritorno',
    body: 'Il trofeo pesa. La strada è lunga.',
    next: 'gob-agguato',
    beat: 7,
  },
  'gob-agguato': {
    id: 'gob-agguato',
    kind: 'harm',
    title: 'Agguato sulla strada',
    body: 'Frecce dal ciglio. Erano rimasti in attesa.',
    next: 'gob-agguato-scelta',
    beat: 7,
  },
  'gob-agguato-scelta': {
    id: 'gob-agguato-scelta',
    kind: 'choice',
    title: 'Trofeo o sangue',
    body: 'Potete mollare il trofeo e correre — o combattere l’ultima mischia.',
    beat: 7,
    options: [
      {
        id: 'gob-molla-trofeo',
        label: 'Lasciare il trofeo',
        detail: 'La quest è persa — ma la strada si libera.',
        next: 'gob-fine',
        abandonsObjective: true,
        // R-097: a failed pursuit removes the bail-out — they SAW you.
        hiddenIfFlag: 'agguatoPeggiore',
      },
      {
        id: 'gob-ultima-mischia',
        label: 'Affrontare',
        detail: 'Un turno di combattimento. Chi resta a coprire paga.',
        next: 'gob-ultimo-scontro',
      },
    ],
  },
  'gob-ultimo-scontro': {
    id: 'gob-ultimo-scontro',
    kind: 'combat',
    title: 'L’ultima mischia',
    body: 'Uno scontro secco. Il profilo decide chi paga.',
    beat: 7,
    combat: {
      turns: 1,
      enemies: 3,
      attackStats: ['str'],
      killPerWin: 3,
      killPerBigwin: 3,
      hitDamage: 25, // placeholder — attesa: muoiono quasi tutti tranne l'eroe
      escalateProfile: false,
      nextCleared: 'gob-fine',
      nextSurvivors: 'gob-fine',
    },
  },
  'gob-fine': {
    id: 'gob-fine',
    kind: 'end',
    title: 'Ritorno al villaggio',
    body: 'La spedizione è finita.',
    beat: 7,
  },
};

/** First node of the run. */
export const GOBLIN_START_NODE = 'gob-inizio';

/** Party preset — Forza-based, hero + three members (positional slots). */
export const GOBLIN_PRESETS: PartyPreset[] = [
  {
    id: 'gob-band',
    label: 'Banda — l’eroe e la sua scorta',
    description: 'Eroe davanti, tre compagni dietro: il rischio vive in coda.',
    gold: 0,
    members: [
      { id: 'g1', name: 'Edda', role: 'leader', hp: 100, stats: { str: 70, con: 60, agi: 45, perc: 40, int: 35, cha: 40 }, portrait: '/assets/portraits/portrait female magician.png' },
      { id: 'g2', name: 'Milo', role: 'member', hp: 60, stats: { str: 60, con: 55, agi: 50, perc: 45, int: 40, cha: 35 }, portrait: '/assets/portraits/portrait male warrior.png' },
      { id: 'g3', name: 'Bruna', role: 'member', hp: 60, stats: { str: 65, con: 60, agi: 40, perc: 35, int: 30, cha: 30 }, portrait: '/assets/portraits/portrait male warrior.png' },
      { id: 'g4', name: 'Kran', role: 'bodyguard', hp: 60, stats: { str: 60, con: 70, agi: 40, perc: 30, int: 20, cha: 20 }, portrait: '/assets/portraits/portrait male warrior.png' },
    ],
  },
];
