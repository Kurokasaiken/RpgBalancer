/**
 * LaCassaDelleSementiScenario v2 — hardcoded S1 quest content.
 *
 * Per PLAN-019-S1 this is NOT a general quest engine: it is the authored
 * matrix of one single quest («La cassa delle sementi»), frozen by the
 * Director in `.mw/runs/20261002-s1-quest-design/quest-design.md` and
 * restructured after the senior-designer critique (funnel: 2 real decisions
 * + micro, camp alertness states, the thing in the tower pays off).
 * Do not genericize: registries, DSLs, branching engines are S2+ scope.
 */

/** Mock competence ids used by the lab (mapping to balancer stats is S2 work). */
export type LabStat = 'perc' | 'int' | 'str' | 'con' | 'agi' | 'cha';

/**
 * The quest's declared primary stats (Director 2026-10-03): every quest must
 * declare the stats that solve it, so the player knows a priori which party
 * or bonuses are better. Rule: at least one option using a primary stat must
 * exist on the critical path — here every mandatory check uses AGI or PER
 * (this is an infiltration quest); only the OPTIONAL prisoner check (STR)
 * breaks the pattern, by design — it is the muscle- off-path.
 * agi×4 checks, perc×4 checks across the scenario.
 */
export const PRIMARY_STATS: LabStat[] = ['agi', 'perc'];

/**
 * Player-facing labels for `state.info` entries. `info` holds internal keys
 * used by `requiresInfo` gating — the HUD must show what the party *saw*,
 * not the flag name.
 */
export const INTEL_LABELS: Record<string, string> = {
  simbolo: 'il simbolo sui goblin',
  gabbia: 'la gabbia del prigioniero',
  sideDoor: 'la porta laterale',
  turni: 'i turni di guardia',
  pattuglia: 'il giro di pattuglia',
  qualcosaDiGrosso: 'qualcosa di grosso nella torre',
  mappaAccampamento: 'la mappa dell’accampamento',
};

/** A single authored node of the quest. */
export interface QuestNode {
  id: string;
  /** 'choice' = player picks an option; 'check' = skill check; 'info' = lore beat; 'harm' = direct non-check damage. */
  kind: 'choice' | 'check' | 'info' | 'harm' | 'end';
  title: string;
  body: string;
  /** For check nodes: stats contributing to the group roll. */
  stats?: LabStat[];
  /** Per-slot base risk for check nodes: wound/death in percentage points. */
  risk?: { wound: number; death: number };
  /** True if the check may wound/kill. */
  risky?: boolean;
  /** Check nodes: the declared state-consequence of failing — shown in the
   *  preview so the player knows what a fail *changes*, not only what it costs. */
  failHint?: string;
  /** Options for choice nodes; checks resolve via resolveCheck. */
  options?: QuestOption[];
  /** Info nodes: text revealed to the player, then next node. */
  next?: string;
  /** Beat index for the progress component (0..QUEST_BEATS-1). */
  beat?: number;
}

export interface QuestOption {
  id: string;
  label: string;
  detail: string;
  /** Node to go to, or 'CHECK:<id>' to run check <id> then branch on verdict. */
  next: string;
  /** Optional gold cost (merchant). */
  costGold?: number;
  /** Only shown if this info flag was discovered. */
  requiresInfo?: string;
  /** Only shown if this run flag is set (e.g. the freed prisoner's breach). */
  requiresFlag?: string;
  /** Hidden if this flag is already set (e.g. already-bought consumable). */
  hiddenIfFlag?: string;
  /** Sets a flag on the run state. */
  sets?: string;
  /** Consumes an inventory flag when the option is chosen (e.g. selling the
   *  coagulo to the wounded traveler). */
  consumesFlag?: string;
  /** Gold granted when the option is chosen. */
  grantsGold?: number;
  /** Intel entry granted when the option is chosen. */
  grantsInfo?: string;
  /** Days added to the run's duration when the option is chosen (ruins quest:
   *  time is a cost the player can see accumulating). */
  costDays?: number;
}

/**
 * Quest beats for the progress indicator — when it's full, the quest is done.
 * Mirrors the POI-quest pattern (desiderata v4): phases resolve one at a time.
 */
export const QUEST_BEATS = [
  'Partenza',
  'Viaggio',
  'Avvistamento',
  'Approccio',
  'Dentro il campo',
  'La torre',
  'La cassa',
  'Rientro',
] as const;

/**
 * Authored nodes — v2 funnel:
 * merchant (micro) → incident (auto) → sighting (auto check) →
 * DECISION 1 approach → entry check → inside chain w/ camp alertness →
 * tower (prisoner micro, alertness-conditional) → DECISION 2 push-your-luck →
 * creature wakes on a further failure inside a sveglio camp → extraction.
 */
export const SCENARIO_NODES: Record<string, QuestNode> = {
  viaggio: {
    id: 'viaggio',
    kind: 'choice',
    title: 'Viaggio — il Passo del Corvo',
    body: 'La carovana è stata assalita sul Passo. Un ambulante in fuga offre tre oggetti — ma la borsa non basta per tutto.',
    beat: 0,
    options: [
      {
        id: 'buy-pozione',
        label: 'Compra la pozione di ristoro',
        detail: 'Cura una ferita o ripristina HP.',
        next: 'viaggio',
        costGold: 12,
        sets: 'hasPozione',
        hiddenIfFlag: 'hasPozione',
      },
      {
        id: 'buy-fumogeno',
        label: 'Compra il fumogeno',
        detail: '+15 a un check di infiltrazione.',
        next: 'viaggio',
        costGold: 8,
        sets: 'hasFumogeno',
        hiddenIfFlag: 'hasFumogeno',
      },
      {
        id: 'buy-corda',
        label: 'Compra corda e rampino',
        detail: '+15 a un check di arrampicata o forzo.',
        next: 'viaggio',
        costGold: 8,
        sets: 'hasCorda',
        hiddenIfFlag: 'hasCorda',
      },
      {
        id: 'no-buy',
        label: 'Prosegui verso il Passo',
        detail: 'Chiudi con il mercante e continua il viaggio.',
        next: 'incidente',
      },
    ],
  },
  incidente: {
    id: 'incidente',
    kind: 'harm',
    title: 'Incidente sul Passo',
    body: 'Una frana improvvisa coglie la spedizione. Non è una prova: è un pericolo diretto — il bodyguard non può intercettarlo.',
    next: 'avvistamento',
    beat: 1,
  },
  avvistamento: {
    id: 'avvistamento',
    kind: 'check',
    title: 'L’accampamento è sotto di voi',
    body: 'Prima di muovervi, osservate. Quanto vedrete deciderà quali strade avrete dentro.',
    stats: ['perc'],
    risk: { wound: 8, death: 0 },
    risky: true,
    beat: 2,
  },
  approccio: {
    id: 'approccio',
    kind: 'choice',
    title: 'Scelta di approccio',
    body: 'Come entrate? È la decisione che conta: ogni strada chiede una competenza diversa al party.',
    beat: 3,
    options: [
      {
        id: 'sneak',
        label: 'Infiltrarsi tra le tende',
        detail: 'Agilità e occhio: un filo teso vi aspetta al buio.',
        next: 'CHECK:check-ingresso-agi',
      },
      {
        id: 'talk',
        label: 'Porta principale',
        detail: 'Parola pronta: il capo goblin vi metterà alla prova.',
        next: 'CHECK:check-ingresso-cha',
      },
      {
        id: 'side-door',
        label: 'Porta laterale',
        detail: 'Scoperta dall’avvistamento. Più sicura.',
        next: 'CHECK:check-ingresso-laterale',
        requiresInfo: 'sideDoor',
      },
      {
        id: 'brute',
        label: 'Forza bruta',
        detail: 'Scontro aperto. Rumore massimo, rischio alto.',
        next: 'CHECK:check-ingresso-forza',
      },
    ],
  },
  'check-ingresso-agi': {
    id: 'check-ingresso-agi',
    kind: 'check',
    title: 'Trappola a filo tra le tende',
    body: 'Un filo teso tra i paletti. Se lo spezzate, il campo vi sente.',
    stats: ['agi', 'perc'],
    risk: { wound: 15, death: 3 },
    risky: true,
    beat: 4,
  },
  'check-ingresso-cha': {
    id: 'check-ingresso-cha',
    kind: 'check',
    title: 'Il capo goblin vi mette alla prova',
    body: 'Vi squadra e vi interroga. Una parola sbagliata e si scatena lo scontro.',
    stats: ['cha', 'int'],
    risk: { wound: 15, death: 3 },
    risky: true,
    beat: 4,
  },
  'check-ingresso-laterale': {
    id: 'check-ingresso-laterale',
    kind: 'check',
    title: 'La porta laterale',
    body: 'Un mercante vi riconosce come estranei. Servono parola pronta e sangue freddo.',
    stats: ['cha', 'int'],
    risk: { wound: 12, death: 2 },
    risky: true,
    beat: 4,
  },
  'check-ingresso-forza': {
    id: 'check-ingresso-forza',
    kind: 'check',
    title: 'Scontro aperto',
    body: 'Sfondare a mani nude. Si colpisce e si viene colpiti — e il campo intero vi sente.',
    stats: ['str', 'con'],
    risk: { wound: 25, death: 8 },
    risky: true,
    beat: 4,
  },
  perquisizione: {
    id: 'perquisizione',
    kind: 'check',
    title: 'Perquisire l’accampamento',
    body: 'Cercate la cassa delle sementi tra le tende e la vecchia torre.',
    stats: ['perc', 'int'],
    risk: { wound: 12, death: 0 },
    risky: true,
    beat: 5,
  },
  torre: {
    id: 'torre',
    kind: 'choice',
    title: 'La torre',
    body: 'La cassa è qui, in cima alla vecchia torre. Prenderla è la parte difficile.',
    beat: 5,
    options: [
      {
        id: 'free-him',
        label: 'Liberare il prigioniero, poi la cassa',
        detail: 'Un check in più, rumore in più — ma al villaggio potrebbe restare.',
        next: 'CHECK:check-gabbia',
        requiresInfo: 'gabbia',
      },
      {
        id: 'straight-cassa',
        label: 'Dritto alla cassa',
        detail: 'Nessuna deviazione. La gabbia resta chiusa.',
        next: 'obiettivo',
      },
    ],
  },
  'check-gabbia': {
    id: 'check-gabbia',
    kind: 'check',
    title: 'Aprire la gabbia',
    body: 'Il ferro è rugginoso e rumoroso. Ogni secondo in più è un rischio.',
    stats: ['str'],
    risk: { wound: 15, death: 0 },
    risky: true,
    beat: 5,
  },
  obiettivo: {
    id: 'obiettivo',
    kind: 'check',
    title: 'Portare via la cassa',
    body: 'La cassa delle sementi è pesante e la via d’uscita è lunga. Questa è la prova che decide la quest.',
    stats: ['agi', 'con'],
    risk: { wound: 20, death: 5 },
    risky: true,
    beat: 6,
    failHint: 'la cassa vi sfugge — uscirete dal campo a mani vuote.',
  },
  'rientra-o-rischi': {
    id: 'rientra-o-rischi',
    kind: 'choice',
    title: 'Cassa in mano — fuggire o rischiare?',
    body: 'Avete l’obiettivo. Ogni momento in più qui è rumore — e qualcosa nella torre potrebbe svegliarsi.',
    beat: 7,
    options: [
      {
        id: 'return-now',
        label: 'Fuggire con la cassa',
        detail: 'Portatela fuori — non è al sicuro finché non siete lontani dal campo.',
        next: 'estrazione',
      },
      {
        id: 'forziere',
        label: 'Frugare il forziere goblin',
        detail: 'Oro extra — ma il rumore sale. Se qualcosa dorme nella torre, non sarà contento.',
        next: 'CHECK:check-forziere',
      },
    ],
  },
  'check-forziere': {
    id: 'check-forziere',
    kind: 'check',
    title: 'Il forziere goblin',
    body: 'L’ultima stanza custodisce un forziere. Le guardie possono tornare da un momento all’altro.',
    stats: ['agi', 'perc'],
    risk: { wound: 20, death: 5 },
    risky: true,
    beat: 7,
  },
  /* ---- Estrazione: TAKEN ≠ SECURED -----------------------------------------
   * The crate in hand is stake on the table, not a win. The escape's *shape*
   * is written by the run: the breach exists only if you freed the prisoner,
   * the quiet way out exists only if the camp never woke, and cutting through
   * the camp is always there — at a declared price. */
  estrazione: {
    id: 'estrazione',
    kind: 'choice',
    title: 'La via d’uscita',
    body: 'La cassa pesa e il campo è alle spalle. Come uscite dipende da come siete entrati.',
    beat: 7,
    options: [
      {
        id: 'exit-breach',
        label: 'La breccia nel muro',
        detail: 'Il prigioniero conosce un varco che i goblin non guardano. È la via che vi ha aperto.',
        next: 'CHECK:check-uscita-breccia',
        requiresFlag: 'prigionieroLibero',
      },
      {
        id: 'exit-quiet',
        label: 'Nell’ombra da cui siete venuti',
        detail: 'Il campo non vi ha mai visti. Rifate il percorso all’indietro, piano.',
        next: 'CHECK:check-uscita-calma',
        hiddenIfFlag: 'campoSveglio',
      },
      {
        id: 'exit-alarm',
        label: 'Attraversare il campo',
        detail: 'La via più breve e la più vista. Si corre, e chi inciampa paga.',
        next: 'CHECK:check-uscita-allarme',
      },
    ],
  },
  'check-uscita-breccia': {
    id: 'check-uscita-breccia',
    kind: 'check',
    title: 'La breccia nel muro',
    body: 'Il prigioniero vi guida lungo la parete crollata. Stretta, bassa — ma nessuno la guarda.',
    stats: ['agi', 'con'],
    risk: { wound: 10, death: 0 },
    risky: true,
    beat: 7,
    failHint: 'perdete il bottino extra nella strettoia. La cassa arriva comunque.',
  },
  'check-uscita-calma': {
    id: 'check-uscita-calma',
    kind: 'check',
    title: 'Uscire come siete entrati',
    body: 'Le stesse ombre, lo stesso passo. Finché qualcuno non si volta.',
    stats: ['agi', 'perc'],
    risk: { wound: 15, death: 3 },
    risky: true,
    beat: 7,
    failHint: 'il bottino extra resta indietro. Epicfail: la cassa scivola — resta al campo.',
  },
  'check-uscita-allarme': {
    id: 'check-uscita-allarme',
    kind: 'check',
    title: 'Il campo vi ha visti',
    body: 'Frecce, urla, il barrito dalla torre. Si corre con quello che si riesce a tenere.',
    stats: ['agi', 'con'],
    risk: { wound: 25, death: 8 },
    risky: true,
    beat: 7,
    failHint: 'la cassa vi rallenta troppo — la mollate. Resta al campo.',
  },
  risveglio: {
    id: 'risveglio',
    kind: 'check',
    title: 'Qualcosa si sveglia nella torre',
    body: 'Le fessure della torre si spalancano in un ruggito. Non c’è più tempo per essere cauti: solo per correre.',
    stats: ['agi', 'con'],
    risk: { wound: 30, death: 10 },
    risky: true,
    beat: 7,
    failHint: 'è la fine della cautela — quello che non riuscite a portare resta qui.',
  },
  ritorno: {
    id: 'ritorno',
    kind: 'end',
    title: 'Ritorno al villaggio',
    body: 'La spedizione è finita.',
    beat: 7,
  },
};

/** First node of the run. */
export const START_NODE = 'viaggio';

/** Party presets — plausible, not built to prove the thesis. */
export interface LabMember {
  id: string;
  name: string;
  stats: Record<LabStat, number>;
  /** 'leader' = fixed quest slot (slot 0). 'bodyguard' = optional interceptor. */
  role: 'leader' | 'member' | 'bodyguard';
  /** Portrait asset under /assets/portraits (mock mapping for the lab). */
  portrait?: string;
}

export interface PartyPreset {
  id: string;
  label: string;
  description: string;
  gold: number;
  members: LabMember[];
}

export const PARTY_PRESETS: PartyPreset[] = [
  {
    id: 'fisico',
    label: 'Preset A — Fisico',
    description: 'Forte in Forza/Costituzione, debole altrove.',
    gold: 20,
    members: [
      { id: 'a1', name: 'Bruna', role: 'leader', stats: { str: 70, con: 65, agi: 40, perc: 35, int: 30, cha: 30 } , portrait: '/assets/portraits/portrait male warrior.png'},
      { id: 'a2', name: 'Gorik', role: 'member', stats: { str: 75, con: 70, agi: 30, perc: 25, int: 20, cha: 20 } , portrait: '/assets/portraits/portrait male warrior.png'},
      { id: 'a3', name: 'Teo', role: 'member', stats: { str: 50, con: 55, agi: 45, perc: 40, int: 35, cha: 35 } , portrait: '/assets/portraits/portrait female magician.png'},
    ],
  },
  {
    id: 'percettivo',
    label: 'Preset B — Percettivo',
    description: 'Forte in Percezione/Intelligenza.',
    gold: 20,
    members: [
      { id: 'b1', name: 'Leda', role: 'leader', stats: { str: 25, con: 30, agi: 45, perc: 75, int: 70, cha: 50 } , portrait: '/assets/portraits/portrait female magician.png'},
      { id: 'b2', name: 'Omero', role: 'member', stats: { str: 30, con: 35, agi: 40, perc: 70, int: 75, cha: 45 } , portrait: '/assets/portraits/portrait male warrior.png'},
      { id: 'b3', name: 'Sira', role: 'member', stats: { str: 35, con: 40, agi: 55, perc: 60, int: 55, cha: 60 } , portrait: '/assets/portraits/portrait female magician.png'},
    ],
  },
  {
    id: 'ibrido',
    label: 'Preset C — Ibrido',
    description: 'Nessuna specialità dominante.',
    gold: 20,
    members: [
      { id: 'c1', name: 'Edda', role: 'leader', stats: { str: 50, con: 50, agi: 50, perc: 55, int: 50, cha: 55 } , portrait: '/assets/portraits/portrait female magician.png'},
      { id: 'c2', name: 'Milo', role: 'member', stats: { str: 55, con: 55, agi: 55, perc: 50, int: 45, cha: 45 } , portrait: '/assets/portraits/portrait male warrior.png'},
      { id: 'c3', name: 'Nina', role: 'member', stats: { str: 45, con: 45, agi: 50, perc: 50, int: 55, cha: 50 } , portrait: '/assets/portraits/portrait female magician.png'},
    ],
  },
  {
    id: 'bodyguard',
    label: 'Preset D — Con bodyguard',
    description: 'Due specialisti + bodyguard sacrificabile. Kran non porta nulla: si viaggia leggeri — 16 gold, non 20.',
    gold: 16,
    members: [
      { id: 'd1', name: 'Vera', role: 'leader', stats: { str: 35, con: 40, agi: 50, perc: 60, int: 60, cha: 60 } , portrait: '/assets/portraits/portrait female magician.png'},
      { id: 'd2', name: 'Kran', role: 'bodyguard', stats: { str: 60, con: 70, agi: 40, perc: 30, int: 20, cha: 20 } , portrait: '/assets/portraits/portrait male warrior.png'},
      { id: 'd3', name: 'Ivo', role: 'member', stats: { str: 45, con: 45, agi: 60, perc: 55, int: 50, cha: 40 } , portrait: '/assets/portraits/portrait female magician.png'},
    ],
  },
];
