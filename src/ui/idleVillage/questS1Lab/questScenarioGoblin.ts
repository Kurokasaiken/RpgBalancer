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
    body: 'Terza razzia in un mese. I carri dei mercanti non passano più dal guado: gli ultimi due sono tornati con le casse vuote e le stanghe rotte. Il consiglio non discute più: paga. Sterminateli.',
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
    title: 'Esplorazione — ai margini del bosco',
    body: 'Il bosco tace in un modo che ai boschi non viene naturale. Sul sentiero, un masso sbarra il passo — e da sotto spunta un lembo di straccio, schiacciato come da chi aveva fretta.',
    transit: 'La strada muore dove il bosco comincia. Il profumo di resina cede alla terra umida e a un fumo basso che non sa di cucina. Davanti marcia chi guida; dietro, gli altri contano i carichi e le uscite.',
    beat: 1,
    options: [
      {
        id: 'gob-cerca-tracce',
        label: 'Arrampicarsi sull’albero',
        detail: 'Percezione. Dall’alto il bosco si lascia leggere.',
        next: 'CHECK:gob-tracce-per',
      },
      {
        id: 'gob-forza-tracce',
        label: 'Spostare il masso',
        detail: 'Percezione + Forza. Lo straccio là sotto può valere — o costare schiena.',
        next: 'CHECK:gob-tracce-perfor',
      },
    ],
  },
  'gob-tracce-per': {
    id: 'gob-tracce-per',
    kind: 'check',
    title: 'Ti arrampichi sull’albero',
    body: 'Dal basso il bosco è un muro. Da sopra, qualcosa dice dove si apre.',
    transit: 'L’albero giusto sta tre passi fuori dal sentiero. La corteccia è il vostro appiglio, la cima il vostro occhio.',
    stats: ['perc'],
    risk: { wound: 0, death: 0 },
    beat: 1,
    verdictFlavor: {
      bigwin: 'Dall’alto: fumo basso a est, una fila di pali appuntiti, una sentinella su un ceppo. E un varco dove nessuno guarda.',
      win: 'Fumo basso a est e, su un ceppo, una sagoma che non dorme. Il campo è vicino.',
      almost: 'Qualcosa si muove tra i rami — una volta sola. Scendi con un sospetto, non con una via.',
      fail: 'L’albero si lascia arrampicare, il bosco no.',
      epicfail: 'Un ramo marcio: giù di schiena. Ora anche il bosco sa che ci siete.',
    },
  },
  'gob-tracce-perfor': {
    id: 'gob-tracce-perfor',
    kind: 'check',
    title: 'Spostare il masso',
    body: 'Lo straccio sotto il masso non è caduto lì da solo. Qualcuno ha nascosto qualcosa, in fretta.',
    transit: 'Spalle contro il masso: cede un centimetro per volta.',
    stats: ['perc', 'str'],
    risk: { wound: 0, death: 0 },
    beat: 1,
    verdictFlavor: {
      bigwin: 'Il masso si sposta in silenzio — sotto, una nicchia di stracci che qualcuno ha chiuso in fretta.',
      win: 'Spalle contro il masso. Sotto: stracci, e qualcosa di avvolto.',
      almost: 'Si sposta, ma il bosco ha sentito qualcosa cadere.',
      fail: 'Il masso cade dalla parte sbagliata. Il sentiero resta chiuso.',
      epicfail: 'La roccia prende una caviglia. Si cammina zoppicando, e non era il piano.',
    },
  },

  /* F2 — EVENTO OPZIONALE (bottino): only if PER+FOR succeeded.
   * DEX: item anyway; fail → 10 dmg + campo allertato (malus F4). */
  'gob-bottino-scelta': {
    id: 'gob-bottino-scelta',
    kind: 'choice',
    title: 'Un nascondiglio',
    body: 'Sotto il masso, un bottino avvolto in stracci. Prenderlo in silenzio costa mano ferma.',
    transit: 'Dietro il masso, una nicchia di stracci: qualcuno ha nascosto qualcosa in fretta e non è più tornato.',
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
    title: 'Le mani sul bottino',
    body: 'Catene, campanelli, un nodo da sciogliere senza un suono.',
    stats: ['agi'],
    verdictFlavor: {
      bigwin: 'Nemmeno i campanelli se ne accorgono. In tasca, senza un suono.',
      win: 'Un nodo alla volta. Il bottino è vostro.',
      almost: 'Qualcosa tintinna. Fiato trattenuto — niente si muove. Preso a metà.',
      fail: 'Un campanello tradisce la mano: il suono corre nella valle.',
      epicfail: 'Il filo resta in mano: i campanelli chiamano, e qualcosa risponde.',
    },
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
    transit: 'Tra le fronde il fumo si fa spesso: l’accampamento è sotto. Da qui si colpisce in un modo solo — e va scelto bene.',
    beat: 3,
    options: [
      {
        id: 'gob-via-stealth',
        label: 'Passare il filo dei campanelli',
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
    title: 'Il filo dei campanelli',
    body: 'Un filo teso a mezza gamba porta a campanelli appesi come trappole. Ogni passo è un suono possibile.',
    stats: ['agi'],
    risk: { wound: 0, death: 0 },
    beat: 3,
    verdictFlavor: {
      bigwin: 'Passate come il fumo tra i paletti. Il campo dorme; la sorpresa è vostra.',
      win: 'Un passo, un respiro, un passo. Siete dentro.',
      almost: 'Uno starnuto strozzato. Due teste si alzano dal fuoco, poi tornano giù. Dentro — ma non invisibili.',
      fail: 'Un filo vibra sotto il palmo. Un campanello decide di vivere.',
      epicfail: 'Il filo resta in mano: i campanelli chiamano, e qualcosa risponde.',
    },
  },
  'gob-assalto': {
    id: 'gob-assalto',
    kind: 'check',
    title: 'La carica',
    body: 'La palizzata è fatta di rifiuti e fango. Sfondarla prima che si organizzino — o subirla.',
    stats: ['str'],
    risk: { wound: 0, death: 0 },
    beat: 3,
    verdictFlavor: {
      bigwin: 'Il primo palo cade prima che qualcuno capisca. Una tenda si accartoccia sul fuoco; due goblin rotolano via ciechi di fumo.',
      win: 'Sfondate dove la palizzata è più bassa. Una lancia si alza — troppo tardi.',
      almost: 'La palizzata tiene un respiro di troppo. Qualcuno urla; il campo ha il tempo di afferrare le armi.',
      fail: 'La carica si pianta nel fango. Vi aspettano già, lance puntate.',
      epicfail: 'Inciampate nella vostra stessa carica: in mezzo al campo, in disordine.',
    },
  },

  /* F4 — COMBATTIMENTO: X turns of mutual damage, positional targeting with
   * escalation; no instant death — only HP. */
  'gob-combattimento': {
    id: 'gob-combattimento',
    kind: 'combat',
    title: 'Combattimento — il campo dei goblin',
    body: 'Li avete. O loro.',
    transit: 'Il momento è scelto. Il bosco trattiene il fiato — poi il campo esplode.',
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
    transit: 'Polvere e sangue. I goblin che restano spezzano il fronte e corrono verso il bosco, portandosi dietro la vostra faccia.',
    beat: 5,
    options: [
      {
        id: 'gob-lascia-fuggire',
        label: 'Lasciarli fuggire',
        detail: 'Torneranno. Li rivedrete sulla strada di casa.',
        next: 'gob-esplora-extra',
        sets: 'agguatoPeggiore', // R-097 v2: letting them go = they regroup → HEAVY ambush at F7
      },
      {
        id: 'gob-insegui',
        label: 'Incalzare',
        detail: 'Forza. Chiudete la quest qui — o peggiorate il conto.',
        next: 'CHECK:gob-incalza-check',
      },
    ],
  },
  'gob-incalza-check': {
    id: 'gob-incalza-check',
    kind: 'check',
    title: 'La caccia tra le rocce',
    body: 'La caccia attraverso le rocce. Ogni metro guadagnato è uno di troppo.',
    stats: ['str'],
    risk: { wound: 0, death: 0 },
    beat: 5,
    verdictFlavor: {
      bigwin: 'Li chiudete dove il sentiero stringe. Nessuno tornerà a raccontare cosa è successo.',
      win: 'Li chiudete contro le rocce, uno alla volta. Il sentiero torna silenzioso.',
      almost: 'Correte fino al fiatone: qualcuno gli taglia la fuga, qualcuno no. Torneranno feriti — e avvisati.',
      fail: 'Le rocce vi tradiscono. Li vedete svanire, e sapete che li rivedrete.',
      epicfail: 'La caccia costa sangue e non chiude nulla. Tornano tutti — e torneranno organizzati.',
    },
    // R-097 v2: the deterministic price of the chase itself — escaping
    // goblins are bloodied → the ambush is the mild one.
    upfrontDamage: { amount: 10, epicfailAmount: 20 },
    failHint: 'La caccia costa sangue comunque. Se scappano, tornano feriti: l’agguato sarà più debole.',
  },

  /* F6 — CONTINUA L'ESPLORAZIONE: push-your-luck, damage grows 5→10→15. */
  'gob-esplora-extra': {
    id: 'gob-esplora-extra',
    kind: 'choice',
    title: 'Il campo conquistato',
    body: 'Cenere e tende rovesciate. Sotto il telo della tenda più bassa, un angolo di cuoio con un fermaglio d’ottone.',
    transit: 'Il campo conquistato è un campo aperto: cenere, tende rovesciate, e il bottino che nessuno reclama più.',
    beat: 6,
    options: [
      {
        id: 'gob-fruga',
        label: 'Frugare ancora',
        detail: 'Il telo cede piano. Ogni altro giro costa di più — in oro e in pelle.',
        next: 'CHECK:gob-cerca',
      },
      {
        id: 'gob-fermati',
        label: 'Fermarsi',
        detail: 'Lasciate il cuoio dov’è: si torna a casa.',
        next: 'gob-ritorno',
      },
    ],
  },
  'gob-cerca': {
    id: 'gob-cerca',
    kind: 'check',
    title: 'Razzia tra le tende',
    body: 'Tra le tende bruciate e le trappole lasciate dai goblin — il campo si fa pagare anche da morto.',
    stats: ['int', 'perc'],
    risk: { wound: 0, death: 0 },
    beat: 6,
    verdictFlavor: {
      bigwin: 'Il fermaglio cede: dentro, il meglio di ciò che restava.',
      win: 'Un fondo di tenda, un pugno di stracci — qualcosa che valeva la pena.',
      almost: 'Poca roba, e la trave vi presenta il conto.',
      fail: 'Solo cenere, spine — e la trappola che chiude il giro.',
      epicfail: 'Il campo si fa pagare l’ultimo debito: cenere, spine e sangue.',
    },
  },

  /* F7 — RITORNO / AGGUATO. 'gob-ritorno' routes: sterminio → end clean;
   * else → ambush (5 dry dmg to all) → drop trophy OR last stand. */
  'gob-ritorno': {
    id: 'gob-ritorno',
    kind: 'info',
    title: 'La via del ritorno',
    body: 'La strada scende verso casa. Qualcuno ha cominciato a fischiettare. Poi smette, senza che nessuno dica perché.',
    next: 'gob-agguato',
    beat: 7,
  },
  'gob-agguato': {
    id: 'gob-agguato',
    kind: 'harm',
    title: 'Agguato sulla strada',
    body: 'Il fischiettio si interrompe a metà. Una freccia nel palo accanto a voi. Poi tutte le altre.',
    next: 'gob-agguato-scelta',
    beat: 7,
  },
  'gob-agguato-scelta': {
    id: 'gob-agguato-scelta',
    kind: 'choice',
    title: 'Trofeo o sangue',
    body: 'Potete mollare il trofeo e correre — o combattere l’ultima mischia.',
    transit: 'Attorno, il bosco si stringe di nuovo. Resta una scelta sola: lasciare il trofeo, o lasciare qualcuno.',
    beat: 7,
    options: [
      {
        id: 'gob-molla-trofeo',
        label: 'Lasciare il trofeo',
        detail: 'Il trofeo rotola nel fosso. La strada si libera — a mani vuote.',
        next: 'gob-fine',
        abandonsObjective: true,
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
    body: 'Uno scontro secco come un osso che si spezza. Il profilo decide chi paga.',
    transit: 'L’ultima mischia non è una battaglia: è un conto da chiudere. Chi resta a coprire paga per tutti.',
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
    transit: 'La strada si apre sul villaggio. Chi torna conta i nomi di chi non torna — e chi ha visto sa cosa è costato.',
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
