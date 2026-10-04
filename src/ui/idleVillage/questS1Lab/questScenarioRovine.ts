/**
 * LeRovineSottoIlFiume — second authored S1 lab quest (mockup Director
 * 2026-10-04). Exploration/recovery profile on FORZA: attrition gauntlet
 * where the currency of loss is HP and TIME (days), not camp alertness.
 *
 * Same engine, different shape: merchant = check-choice (safe info vs risky
 * pressure), mandatory river, variance-vs-certainty guards, trap cascade in
 * the treasure room, checkpoint push-your-luck with VISIBLE stake (gold +
 * days + wounded), unavoidable attrition, deep chamber, return event with an
 * economic callback (the coagulo won at the merchant sells to a wounded
 * traveler for more than its worth), and a report-style epilogue that costs
 * the run in human-days.
 *
 * Not a general engine: node ids are hardcoded in questRun.applyNodeOutcome.
 */

import type { LabStat, PartyPreset, QuestNode } from './questScenario';

/**
 * Declared primary stats (mockup: requisito principale Forza, secondari
 * Percezione/Costituzione/Destrezza). Every mandatory check uses STR or CON
 * — this is the muscle quest; PER/AGI appear only on optional routes.
 */
export const ROVINE_PRIMARY_STATS: LabStat[] = ['str', 'con'];

/** Player-facing labels for `state.info` entries in this quest. */
export const ROVINE_INTEL_LABELS: Record<string, string> = {
  guardiePiuAvanti: 'le guardie proteggono qualcosa più avanti',
  mappaRovine: 'la mappa approssimativa delle rovine',
  contattoViandante: 'il viandante che vi deve un favore',
};

/**
 * Quest beats for the progress indicator — mirrors the mockup's phases:
 * partenza implicit, then the seven authored phases.
 */
export const ROVINE_BEATS = [
  'Il mercante',
  'Il fiume',
  'Le guardie',
  'La sala del tesoro',
  'Oltre',
  'La camera profonda',
  'Il ritorno',
] as const;

/**
 * Authored nodes — mockup «Le Rovine sotto il Fiume»:
 * mercante (check-choice) → fiume (STR+CON mandatory) → guardie (variance
 * choice) → sala (PER) → trappola cascade → tesoro → CHECKPOINT →
 * attrito (no check) → camera profonda → evento ritorno → report.
 */
export const ROVINE_NODES: Record<string, QuestNode> = {
  /* ---- FASE I — il mercante: safe info vs risky pressure ---------------- */
  'rv-mercante': {
    id: 'rv-mercante',
    kind: 'choice',
    title: 'Il mercante dell’entrata',
    body: 'Un mercante sostiene di aver trovato un’antica entrata sotto il fiume. Non è riuscito a entrare — ma sa più di quanto dice.',
    beat: 0,
    options: [
      {
        id: 'rv-osserva',
        label: 'Osservare',
        detail: 'Percezione. Rischio quasi nullo: informazioni sulla zona.',
        next: 'CHECK:rv-check-osserva',
      },
      {
        id: 'rv-incalza',
        label: 'Incalzare il mercante',
        detail: 'Forza + Percezione. Più informazioni, un possibile extra — e un piccolo rischio.',
        next: 'CHECK:rv-check-incalza',
      },
    ],
  },
  'rv-check-osserva': {
    id: 'rv-check-osserva',
    kind: 'check',
    title: 'Leggere il mercante',
    body: 'Lo studiate mentre parla: mani, sguardo, ciò che evita di dire.',
    stats: ['perc'],
    risk: { wound: 2, death: 0 },
    risky: true,
    beat: 0,
  },
  'rv-check-incalza': {
    id: 'rv-check-incalza',
    kind: 'check',
    title: 'Incalzare il mercante',
    body: 'Lo prendete per il bavero della giacca: vuole i vostri soldi, ma voi volete la verità.',
    stats: ['str', 'perc'],
    risk: { wound: 8, death: 0 },
    risky: true,
    beat: 0,
    failHint: 'vi caccia malamente — nessuna informazione, e partite peggio.',
  },
  /* ---- FASE II — il fiume sotterraneo: mandatory, no choice ------------- */
  'rv-fiume': {
    id: 'rv-fiume',
    kind: 'check',
    title: 'Il fiume sotterraneo',
    body: 'Il passaggio obbligatorio. L’acqua è gelida e la corrente spinge il gruppo contro la parete — qui non si sceglie, si resiste.',
    stats: ['str', 'con'],
    risk: { wound: 20, death: 3 },
    risky: true,
    beat: 1,
    failHint: 'la corrente vi trascina: +1–2 giorni e conseguenze fisiche.',
  },
  /* ---- FASE III — le guardie: variance vs certainty --------------------- */
  'rv-guardie': {
    id: 'rv-guardie',
    kind: 'choice',
    title: 'Le guardie nella galleria',
    body: 'Due guardie stanno davanti al passaggio. Potete sparire nell’ombra — o pagare il passaggio in sangue e prendere il loro bottino.',
    beat: 2,
    options: [
      {
        id: 'rv-sneak',
        label: 'Passare di soppiatto',
        detail: 'Destrezza. Successo: nessun danno. Fail: ferita. Tutto o niente.',
        next: 'CHECK:rv-check-sneak',
      },
      {
        id: 'rv-fight',
        label: 'Affrontarle',
        detail: 'Forza. Costa sempre qualcosa — ma il bottino delle guardie è vostro se vincete.',
        next: 'CHECK:rv-check-fight',
      },
    ],
  },
  'rv-check-sneak': {
    id: 'rv-check-sneak',
    kind: 'check',
    title: 'Di soppiatto oltre le guardie',
    body: 'Pietre smosse e respiri trattenuti. Se vi vedono, le picche non chiedono permesso.',
    stats: ['agi'],
    risk: { wound: 18, death: 4 },
    risky: true,
    beat: 2,
    failHint: 'vi vedono: danno diretto, e le guardie restano tra voi e l’uscita.',
  },
  'rv-check-fight': {
    id: 'rv-check-fight',
    kind: 'check',
    title: 'Affrontare le guardie',
    body: 'Due picche contro quattro di voi. Si vince in fretta o si paga in sangue — comunque si paga.',
    stats: ['str'],
    risk: { wound: 22, death: 6 },
    risky: true,
    beat: 2,
    failHint: 'le picche fanno il loro lavoro: danni seri, niente bottino.',
  },
  /* ---- FASE IV — la sala del tesoro + trappola cascade ------------------- */
  'rv-sala': {
    id: 'rv-sala',
    kind: 'check',
    title: 'La sala del tesoro',
    body: 'Il tesoro è lì, alla luce delle torce. Ma qualcosa non torna: troppo facile, troppo in vista.',
    stats: ['perc'],
    risk: { wound: 5, death: 0 },
    risky: true,
    beat: 3,
    failHint: 'non vedete la trappola — scatta mentre entrate.',
  },
  'rv-check-trappola': {
    id: 'rv-check-trappola',
    kind: 'check',
    title: 'La trappola scatta',
    body: 'Il pavimento cede. La caverna si chiude su di voi — uscirne è la sola cosa che conta.',
    stats: ['agi', 'con'],
    risk: { wound: 25, death: 8 },
    risky: true,
    beat: 3,
    failHint: 'feriti, forse peggio. E il tesoro si danneggia nella caduta.',
  },
  'rv-tesoro-scelta': {
    id: 'rv-tesoro-scelta',
    kind: 'choice',
    title: 'Il tesoro davanti a voi',
    body: 'Prenderlo in fretta, o cercare un modo sicuro — tempo contro sicurezza contro valore.',
    beat: 3,
    options: [
      {
        id: 'rv-prendi',
        label: 'Prendere il tesoro',
        detail: 'Forza + Costituzione per portarlo via. Ricompensa normale, nessun giorno extra.',
        next: 'CHECK:rv-check-prendi',
      },
      {
        id: 'rv-sicuro',
        label: 'Cercare un modo sicuro',
        detail: '+1 giorno. Più sicuro, e forse più ricco: studiate i meccanismi della sala.',
        next: 'CHECK:rv-check-sicuro',
        costDays: 1,
      },
    ],
  },
  'rv-check-prendi': {
    id: 'rv-check-prendi',
    kind: 'check',
    title: 'Caricare il tesoro',
    body: 'Monete, calici, un cofanetto antico. È peso — e il peso si porta con la schiena.',
    stats: ['str', 'con'],
    risk: { wound: 15, death: 3 },
    risky: true,
    beat: 3,
    failHint: 'fatica e cadute: parte del tesoro resta a terra.',
  },
  'rv-check-sicuro': {
    id: 'rv-check-sicuro',
    kind: 'check',
    title: 'Il modo sicuro',
    body: 'Studiate le lastre, i pesi, i contrappesi. +1 giorno di lavoro — ma la sala vi paga l’attenzione.',
    stats: ['str', 'con'],
    risk: { wound: 8, death: 1 },
    risky: true,
    beat: 3,
    failHint: 'il modo «sicuro» non era poi così sicuro.',
  },
  /* ---- CHECKPOINT — the stake is visible, the bet is yours --------------- */
  'rv-checkpoint': {
    id: 'rv-checkpoint',
    kind: 'choice',
    title: 'Tesoro in mano — tornare o continuare?',
    body: 'Avete il tesoro. Davanti a voi c’è un altro passaggio, più in basso. Ogni cosa che portate può ancora essere persa.',
    beat: 4,
    options: [
      {
        id: 'rv-torna',
        label: 'Tornare al villaggio',
        detail: 'Conservate tutto ciò che avete trovato.',
        next: 'rv-ritorno-evento',
      },
      {
        id: 'rv-continua',
        label: 'Continuare a esplorare',
        detail: 'Potrebbe esserci qualcosa di molto più prezioso. Costa comunque qualcosa.',
        next: 'rv-attrito',
      },
    ],
  },
  /* ---- FASE V — attrition without a check (no check can remove this cost) */
  'rv-attrito': {
    id: 'rv-attrito',
    kind: 'harm',
    title: 'La zona instabile',
    body: 'Il passaggio conduce a una seconda camera attraverso pietra che scricchiola. Non c’è check che annulli questo costo: attraversarla paga sempre dazio.',
    next: 'rv-camera',
    beat: 4,
  },
  /* ---- FASE VI — la camera profonda: the optional reward ----------------- */
  'rv-camera': {
    id: 'rv-camera',
    kind: 'check',
    title: 'La camera profonda',
    body: 'Un antico deposito, intatto da secoli. Quello che riuscirete a tirar fuori dipende da quanta schiena vi resta.',
    stats: ['str', 'con'],
    risk: { wound: 18, death: 4 },
    risky: true,
    beat: 5,
    failHint: '+1–2 giorni per poco: il deposito era già stato svuotato quasi tutto.',
  },
  /* ---- FASE VII — ritorno: the wounded man on the road ------------------- */
  'rv-ritorno-evento': {
    id: 'rv-ritorno-evento',
    kind: 'choice',
    title: 'Il ferito sulla strada',
    body: 'Sulla via del ritorno trovate un uomo ferito, abbandonato dai suoi. Vi guarda come si guarda un’ultima possibilità.',
    beat: 6,
    options: [
      {
        id: 'rv-aiuta',
        label: 'Aiutarlo — cedergli il coagulo',
        detail: 'Consuma il coagulo del mercante. Vi ripagherà più di quanto vale.',
        next: 'rv-fine',
        requiresFlag: 'hasCoagulo',
        consumesFlag: 'hasCoagulo',
        grantsGold: 50,
        sets: 'viandanteAiutato',
      },
      {
        id: 'rv-porta',
        label: 'Prenderlo con voi',
        detail: '+1 giorno e lo portate al villaggio — potrebbe ricordarsi di voi.',
        next: 'rv-fine',
        costDays: 1,
        grantsGold: 20,
        grantsInfo: 'contattoViandante',
        sets: 'viandantePortato',
      },
      {
        id: 'rv-lascia',
        label: 'Lasciarlo',
        detail: 'Nessun costo. Nessun guadagno. La strada ricorderà.',
        next: 'rv-fine',
        sets: 'viandanteLasciato',
      },
    ],
  },
  'rv-fine': {
    id: 'rv-fine',
    kind: 'end',
    title: 'Ritorno al villaggio',
    body: 'La spedizione è finita.',
    beat: 6,
  },
};

/** First node of the run. */
export const ROVINE_START_NODE = 'rv-mercante';

/**
 * Party presets for the ruins quest — the mockup party is Eroe (leader,
 * +25% on the quest's primary stat, baked into the numbers below) plus
 * three ordinary villagers. Second preset = same shape, weaker hero:
 * the delta between party stats and quest requirements IS the difficulty.
 */
export const ROVINE_PRESETS: PartyPreset[] = [
  {
    id: 'rv-eroe',
    label: 'Eroe + Villager — il mockup',
    description: 'Eroe forte in Forza (+25% sulla primaria), tre villager ordinari.',
    gold: 0,
    members: [
      { id: 'r1', name: 'Aldric', role: 'leader', stats: { str: 90, con: 72, agi: 40, perc: 45, int: 35, cha: 50 }, portrait: '/assets/portraits/portrait male warrior.png' },
      { id: 'r2', name: 'Pietro', role: 'member', stats: { str: 45, con: 50, agi: 45, perc: 40, int: 35, cha: 40 }, portrait: '/assets/portraits/portrait male warrior.png' },
      { id: 'r3', name: 'Sara', role: 'member', stats: { str: 35, con: 45, agi: 60, perc: 55, int: 45, cha: 50 }, portrait: '/assets/portraits/portrait female magician.png' },
      { id: 'r4', name: 'Nando', role: 'member', stats: { str: 50, con: 55, agi: 35, perc: 35, int: 30, cha: 30 }, portrait: '/assets/portraits/portrait male warrior.png' },
    ],
  },
  {
    id: 'rv-gracile',
    label: 'Party debole — stessa quest, più letale',
    description: 'Nessun muscolo vero: il delta fra requisiti e party decide quanto costa.',
    gold: 0,
    members: [
      { id: 'g1', name: 'Berta', role: 'leader', stats: { str: 45, con: 40, agi: 55, perc: 70, int: 60, cha: 55 }, portrait: '/assets/portraits/portrait female magician.png' },
      { id: 'g2', name: 'Ugo', role: 'member', stats: { str: 40, con: 35, agi: 60, perc: 50, int: 55, cha: 45 }, portrait: '/assets/portraits/portrait male warrior.png' },
      { id: 'g3', name: 'Lia', role: 'member', stats: { str: 30, con: 30, agi: 50, perc: 60, int: 50, cha: 60 }, portrait: '/assets/portraits/portrait female magician.png' },
      { id: 'g4', name: 'Doro', role: 'member', stats: { str: 35, con: 45, agi: 40, perc: 45, int: 40, cha: 35 }, portrait: '/assets/portraits/portrait male warrior.png' },
    ],
  },
];
