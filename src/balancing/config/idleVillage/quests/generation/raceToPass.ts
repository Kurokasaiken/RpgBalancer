/**
 * raceToPass — primo scenario generato (PLAN-026 T-3): core gimmick
 * «gara-di-avanzamento» su domain kit «passo-montano».
 *
 * La corsa vive su due vars numeriche (`you`/`rival`, goal 6): ogni check
 * sposta i cursori e il goto condizionale legge lo stato POST-effetti —
 * chi arriva prima a 6 decide l'esito. Il twist «inseguimento» è armato
 * a runstart (armRolls) solo se la spedizione porta uno Scavezzacollo, e
 * ri-armato in-run dagli epicfail (rollFlag): quando è armato, i fail sui
 * tratti veloci deviano su «rp-imboscata» — il ramo twist non è solo testo,
 * cambia il grafo percorso.
 *
 * Il modulo espone un generatore parametrizzato (`generateRaceToPass`)
 * più il catalogo v0 congelato (`RACE_TO_PASS_SCENARIO`), validato contro
 * QuestScenarioSchema a import-time — stesso contratto degli authored.
 */

import type { LabStat, QuestNode } from '@/ui/idleVillage/questS1Lab/questScenario';
import {
  parseQuestScenario,
  type QuestScenario,
} from '@/balancing/config/idleVillage/quests/questScenario.schema';

/* ------------------------------------------------------------------ */
/* Generator parameters — the knobs a caller can turn.                 */
/* ------------------------------------------------------------------ */

export interface RaceToPassParams {
  /** Progress goal both racers chase (the pass closes at this var value). */
  goal: number;
  /** Arm-chance for the «inseguimento» twist at runstart (needs the trait). */
  twistChance: number;
  /** In-run re-arm chance on epicfail rows. */
  twistRearmChance: number;
  /** Domain dressing — the names the generator weaves into the copy. */
  names: {
    place: string;
    rival: string;
    prize: string;
  };
}

/** v0 defaults — passo-montano kit, balanced for the reference party. */
export const RACE_TO_PASS_DEFAULTS: RaceToPassParams = {
  goal: 6,
  twistChance: 50,
  twistRearmChance: 60,
  names: {
    place: 'il Passo del Corvo',
    rival: 'i predoni della Val Nera',
    prize: 'il carico del passo',
  },
};

const PREFIX = 'rp';

/** Conditional exit every race check shares: the twist steals the route
 *  when armed, then the first cursor at goal wins, else back to the hub. */
function raceGoto(p: RaceToPassParams, fallback: string) {
  return {
    branches: [
      { when: { flag: 'inseguimento' }, then: `${PREFIX}-imboscata` },
      { when: { varGE: { var: 'you', value: p.goal } }, then: `${PREFIX}-vetta` },
      { when: { varGE: { var: 'rival', value: p.goal } }, then: `${PREFIX}-sconfitta` },
    ],
    else: fallback,
  };
}

/** Conditional exit without the twist branch — for the twist node itself
 *  (the flag is already consumed) and the last secure check. */
function goalGoto(p: RaceToPassParams, fallback: string) {
  return {
    branches: [
      { when: { varGE: { var: 'you', value: p.goal } }, then: `${PREFIX}-vetta` },
      { when: { varGE: { var: 'rival', value: p.goal } }, then: `${PREFIX}-sconfitta` },
    ],
    else: fallback,
  };
}

const inc = (v: string, n: number) => ({ var: v, op: 'inc' as const, value: n });

/* ------------------------------------------------------------------ */
/* Node builders — one per scene archetype used by the gimmick.        */
/* ------------------------------------------------------------------ */

function buildNodes(p: RaceToPassParams): Record<string, QuestNode> {
  const { rival, place, prize } = p.names;
  const nodes: Record<string, QuestNode> = {};

  /** F0 — ASSEGNAZIONE: the race is declared, the first route is the first
   *  crucial choice — fast pass vs safe trail. */
  nodes[`${PREFIX}-partenza`] = {
    id: `${PREFIX}-partenza`,
    kind: 'choice',
    title: `Assegnazione — la corsa a ${place}`,
    body: `Un mercante ha lasciato ${prize} incustodito oltre ${place}: lo recupera chi arriva primo. Ma ${rival} sono già in marcia — e corrono.`,
    beat: 0,
    options: [
      {
        id: 'rp-via-crepa',
        label: 'Il valico diretto',
        detail: 'Agilità. La via più breve — se il ghiaccio tiene.',
        next: `CHECK:${PREFIX}-crepa`,
      },
      {
        id: 'rp-via-orme',
        label: 'Seguire le vecchie orme',
        detail: 'Percezione. Più lenta, ma rivela ciò che la montagna nasconde.',
        next: `CHECK:${PREFIX}-orme`,
      },
    ],
  };

  /** F1a — fast route: big you-gains, rival punishes fails. */
  nodes[`${PREFIX}-crepa`] = {
    id: `${PREFIX}-crepa`,
    kind: 'check',
    title: 'La crepa nel ghiaccio',
    body: 'La pista muore su una lastra di ghiaccio sospesa sul vuoto. Di sotto, il niente.',
    stats: ['agi'],
    risk: { wound: 10, death: 4 },
    risky: true,
    failHint: 'I predoni guadagnano terreno — e qualcuno può farsi male.',
    beat: 1,
    verdictFlavor: {
      epicfail: 'La lastra cede sotto il peso di due. Per un momento il vuoto è tutto ciò che esiste.',
      fail: 'Il ghiaccio scricchiola a ogni passo. La traversata costa tempo che non avete.',
      win: 'Passate leggeri come se la montagna vi lasciasse correre.',
      bigwin: 'Volteggiate sulla lastra. Dalla cresta, la via è tutta vostra.',
    },
    verdictTable: {
      epicfail: {
        vars: [inc('rival', 2)],
        damage: 15,
        rollFlag: { flag: 'inseguimento', chance: p.twistRearmChance },
        log: 'Il rumore della lastra che cede rimbalza nella valle — qualcuno vi ha sentito.',
        goto: raceGoto(p, `${PREFIX}-tappa`),
      },
      fail: {
        vars: [inc('rival', 2)],
        damage: 8,
        goto: raceGoto(p, `${PREFIX}-tappa`),
      },
      almost: { vars: [inc('you', 1)], goto: raceGoto(p, `${PREFIX}-tappa`) },
      win: { vars: [inc('you', 2)], goto: raceGoto(p, `${PREFIX}-tappa`) },
      bigwin: { vars: [inc('you', 3)], goto: raceGoto(p, `${PREFIX}-tappa`) },
    },
  };

  /** F1b — safe route: smaller you-gains, rival creeps on fails, but the
   *  win reveals the shortcut info that opens a better leg later. */
  nodes[`${PREFIX}-orme`] = {
    id: `${PREFIX}-orme`,
    kind: 'check',
    title: 'Le vecchie orme',
    body: 'Un contrabbandiere morto anni fa ha lasciato segni che ancora raccontano la montagna.',
    stats: ['perc'],
    risk: { wound: 4, death: 1 },
    failHint: 'La lettura costa tempo: i predoni avanzano.',
    beat: 1,
    verdictTable: {
      epicfail: { vars: [inc('rival', 2)], goto: raceGoto(p, `${PREFIX}-tappa`) },
      fail: { vars: [inc('rival', 1)], goto: raceGoto(p, `${PREFIX}-tappa`) },
      almost: { vars: [inc('you', 1)], goto: raceGoto(p, `${PREFIX}-tappa`) },
      win: {
        vars: [inc('you', 1)],
        setInfo: ['tagliata'],
        log: 'Le orme mostrano una tagliata tra le rocce — una via che i predoni non conoscono.',
        goto: raceGoto(p, `${PREFIX}-tappa`),
      },
      bigwin: {
        vars: [inc('you', 2)],
        setInfo: ['tagliata'],
        log: 'Le orme mostrano una tagliata tra le rocce — una via che i predoni non conoscono.',
        goto: raceGoto(p, `${PREFIX}-tappa`),
      },
    },
  };

  /** F2 — TAPPA (hub): the second crucial choice. Push hard, keep pace,
   *  take the discovered shortcut (requiresInfo) or the trait one
   *  (requiresTrait avido). */
  nodes[`${PREFIX}-tappa`] = {
    id: `${PREFIX}-tappa`,
    kind: 'choice',
    title: 'La tappa intermedia',
    body: `Da qui si vede il profilo di ${place}. Da qui si sente anche il passo di ${rival}, da qualche parte sotto di voi.`,
    transit: 'Fiato bianco e gambe che bruciano. La montagna non premia chi si ferma a pensare.',
    beat: 2,
    options: [
      {
        id: 'rp-sprint',
        label: 'Forzare il passo',
        detail: 'Forza. Bruciare le gambe per bruciare la distanza.',
        next: `CHECK:${PREFIX}-sprint`,
      },
      {
        id: 'rp-passo',
        label: 'Tenere il ritmo',
        detail: 'Costituzione. Misura contro fretta — la via regolare.',
        next: `CHECK:${PREFIX}-passo`,
      },
      {
        id: 'rp-tagliata',
        label: 'La tagliata tra le rocce',
        detail: 'Agilità. La via che le orme hanno rivelato.',
        next: `CHECK:${PREFIX}-taglio`,
        requiresInfo: 'tagliata',
      },
      {
        id: 'rp-balzo',
        label: 'Il balzo dell’avido',
        detail: 'Agilità. Uno strappo impossibile — solo chi non sa frenare lo tenta.',
        next: `CHECK:${PREFIX}-balzo`,
        requiresTrait: 'avido',
      },
    ],
  };

  nodes[`${PREFIX}-sprint`] = {
    id: `${PREFIX}-sprint`,
    kind: 'check',
    title: 'Lo sprint sul falsopiano',
    body: 'I polmoni gridano. La vetta no — è già più vicina.',
    stats: ['str'],
    risk: { wound: 8, death: 2 },
    failHint: 'Chi forza e cade perde il vantaggio — e le gambe.',
    beat: 2,
    verdictTable: {
      epicfail: {
        vars: [inc('rival', 2)],
        damage: 12,
        rollFlag: { flag: 'inseguimento', chance: p.twistRearmChance },
        log: 'Lo strappo finisce nella ghiaia. Il vostro rumore ha fatto da guida.',
        goto: raceGoto(p, `${PREFIX}-tappa`),
      },
      fail: { vars: [inc('rival', 2)], damage: 6, goto: raceGoto(p, `${PREFIX}-tappa`) },
      almost: { vars: [inc('you', 1)], goto: raceGoto(p, `${PREFIX}-tappa`) },
      win: { vars: [inc('you', 3)], goto: raceGoto(p, `${PREFIX}-tappa`) },
      bigwin: { vars: [inc('you', 4)], goto: raceGoto(p, `${PREFIX}-tappa`) },
    },
  };

  nodes[`${PREFIX}-passo`] = {
    id: `${PREFIX}-passo`,
    kind: 'check',
    title: 'Il passo regolare',
    body: 'Un piede davanti all’altro. La montagna si scala a fiato, non a furia.',
    stats: ['con'],
    risk: { wound: 5, death: 1 },
    beat: 2,
    verdictTable: {
      epicfail: {
        vars: [inc('rival', 2)],
        rollFlag: { flag: 'inseguimento', chance: p.twistRearmChance },
        goto: raceGoto(p, `${PREFIX}-tappa`),
      },
      fail: { vars: [inc('rival', 1)], goto: raceGoto(p, `${PREFIX}-tappa`) },
      almost: { vars: [inc('you', 1)], goto: raceGoto(p, `${PREFIX}-tappa`) },
      win: { vars: [inc('you', 2)], goto: raceGoto(p, `${PREFIX}-tappa`) },
      bigwin: { vars: [inc('you', 3)], goto: raceGoto(p, `${PREFIX}-tappa`) },
    },
  };

  /** F2c — info-gated shortcut: high you-gain, low risk, but the fail means
   *  the "hidden" route turns out exposed (rival gains ground too). */
  nodes[`${PREFIX}-taglio`] = {
    id: `${PREFIX}-taglio`,
    kind: 'check',
    title: 'La tagliata',
    body: 'Una fessura tra due pareti che nessuna mappa segna. Stretta — praticabile.',
    stats: ['agi'],
    risk: { wound: 6, death: 2 },
    failHint: 'La tagliata era meno segreta di quanto sembrasse.',
    beat: 2,
    verdictTable: {
      epicfail: { vars: [inc('rival', 2)], damage: 10, goto: raceGoto(p, `${PREFIX}-tappa`) },
      fail: { vars: [inc('rival', 1)], goto: raceGoto(p, `${PREFIX}-tappa`) },
      almost: { vars: [inc('you', 1)], goto: raceGoto(p, `${PREFIX}-tappa`) },
      win: { vars: [inc('you', 3)], goto: raceGoto(p, `${PREFIX}-tappa`) },
      bigwin: { vars: [inc('you', 4)], goto: raceGoto(p, `${PREFIX}-tappa`) },
    },
  };

  /** F2d — trait-gated leap (avido): the greedy line pays huge you-gains
   *  but bleeds on every miss — and a bad miss re-arms the chase. */
  nodes[`${PREFIX}-balzo`] = {
    id: `${PREFIX}-balzo`,
    kind: 'check',
    title: 'Il balzo dell’avido',
    body: 'Da questo cornicione alla cresta mancano tre metri di niente. Tre metri che valgono la corsa intera.',
    stats: ['agi'],
    risk: { wound: 15, death: 6 },
    risky: true,
    failHint: 'Il vuoto non perdona — e i predoni ringraziano.',
    beat: 2,
    verdictFlavor: {
      epicfail: 'Le mani trovano aria. La montagna decide di tenervi un pezzo.',
      win: 'Il salto si chiude con un rotolo sulla cresta. Nessuno ha visto — tutti hanno sentito il cuore.',
    },
    verdictTable: {
      epicfail: {
        vars: [inc('rival', 3)],
        damage: 20,
        rollFlag: { flag: 'inseguimento', chance: p.twistRearmChance },
        goto: raceGoto(p, `${PREFIX}-tappa`),
      },
      fail: { vars: [inc('rival', 2)], damage: 15, goto: raceGoto(p, `${PREFIX}-tappa`) },
      almost: { vars: [inc('you', 2)], damage: 5, goto: raceGoto(p, `${PREFIX}-tappa`) },
      win: { vars: [inc('you', 4)], goto: raceGoto(p, `${PREFIX}-tappa`) },
      bigwin: { vars: [inc('you', 5)], goto: raceGoto(p, `${PREFIX}-vetta`) },
    },
  };

  /** F3 — TWIST NODE: only reachable while 'inseguimento' is armed (runstart
   *  ArmRoll gated on trait 'scavezzacollo', or re-armed by epicfails).
   *  The chase steals a whole leg: clear it or pay the price. */
  nodes[`${PREFIX}-imboscata`] = {
    id: `${PREFIX}-imboscata`,
    kind: 'check',
    title: 'L’imboscata dei predoni',
    body: `${rival} vi hanno letto la rotta meglio di quanto credevate. Escono dalle rocce tutti insieme — non per il carico: per voi.`,
    stats: ['str', 'agi'],
    risk: { wound: 18, death: 7 },
    risky: true,
    failHint: 'Chi perde lo scontro perde la corsa — e forse più.',
    beat: 3,
    verdictFlavor: {
      epicfail: 'Non era un’imboscata: era una trappola. Il primo colpo vi spezza la fila.',
      win: 'Li prendete di sorpresa sul loro stesso agguato. La valle torna a essere solo vento.',
    },
    verdictTable: {
      epicfail: {
        vars: [inc('rival', 3)],
        damage: 25,
        clearFlags: ['inseguimento'],
        goto: goalGoto(p, `${PREFIX}-tappa`),
      },
      fail: {
        vars: [inc('rival', 2)],
        damage: 18,
        clearFlags: ['inseguimento'],
        goto: goalGoto(p, `${PREFIX}-tappa`),
      },
      almost: {
        damage: 8,
        clearFlags: ['inseguimento'],
        goto: goalGoto(p, `${PREFIX}-tappa`),
      },
      win: {
        vars: [inc('you', 1)],
        clearFlags: ['inseguimento'],
        log: 'Restano indietro a raccogliere i denti. La corsa riprende — ora sono loro ad aver paura.',
        goto: goalGoto(p, `${PREFIX}-tappa`),
      },
      bigwin: {
        vars: [inc('you', 2)],
        clearFlags: ['inseguimento'],
        log: 'Restano indietro a raccogliere i denti. La corsa riprende — ora sono loro ad aver paura.',
        goto: goalGoto(p, `${PREFIX}-tappa`),
      },
    },
  };

  /** F4 — VETTA: you hit goal first. The prize is TAKEN, not SECURED —
   *  one last check to carry it down before the rival arrives. */
  nodes[`${PREFIX}-vetta`] = {
    id: `${PREFIX}-vetta`,
    kind: 'choice',
    title: 'La vetta',
    body: `Ci arrivate primi. ${prize} è lì, intatto. Ma da sotto sale il rumore di ${rival} — non sono lontani.`,
    transit: 'L’ultimo tratto è solo verticale e fiato. Poi il profilo del passo si apre — e il carico è davvero lì.',
    beat: 3,
    options: [
      {
        id: 'rp-carico',
        label: 'Prendere il carico e scendere',
        detail: 'Costituzione. Caricarlo in fretta prima che arrivino.',
        next: `CHECK:${PREFIX}-sicuro`,
      },
      {
        id: 'rp-attesa',
        label: 'Aspettarli al varco',
        detail: 'Forza. Finirla qui, col vantaggio dell’altezza.',
        next: `CHECK:${PREFIX}-varco`,
        requiresTrait: 'scavezzacollo',
      },
    ],
  };

  /** F5a — secure check: whatever the verdict, the prize is in hand —
   *  the verdict decides the price of carrying it (and whether the rival
   *  catches you on the way down). */
  nodes[`${PREFIX}-sicuro`] = {
    id: `${PREFIX}-sicuro`,
    kind: 'check',
    title: 'La discesa col carico',
    body: 'Il carico pesa il doppio in discesa. E la discesa non aspetta.',
    stats: ['con'],
    risk: { wound: 8, death: 2 },
    beat: 4,
    verdictTable: {
      epicfail: {
        takeLoot: [prize],
        setObjective: 'done',
        damage: 20,
        log: 'Il carico arriva — insieme a un fianco pieno di lividi e un debito di fortuna.',
        goto: `${PREFIX}-fine`,
      },
      fail: {
        takeLoot: [prize],
        setObjective: 'done',
        damage: 10,
        goto: `${PREFIX}-fine`,
      },
      almost: {
        takeLoot: [prize],
        setObjective: 'done',
        goto: `${PREFIX}-fine`,
      },
      win: {
        takeLoot: [prize],
        setObjective: 'done',
        log: 'Il carico scende facile. Dietro, il passo si chiude sul silenzio.',
        goto: `${PREFIX}-fine`,
      },
      bigwin: {
        takeLoot: [prize],
        setObjective: 'done',
        goldDelta: 15,
        log: 'Il carico scende facile — e sotto la tela c’è più di quanto promesso.',
        goto: `${PREFIX}-fine`,
      },
    },
  };

  /** F5b — the reckless alternative ending: hold the pass and break the
   *  chase. Higher risk, a cleaner win (no descent toll) and a gold bonus
   *  for finishing the fight. */
  nodes[`${PREFIX}-varco`] = {
    id: `${PREFIX}-varco`,
    kind: 'check',
    title: 'Il varco tenuto',
    body: `Da quassù ${rival} devono salire uno alla volta. L’altezza è la vostra armatura.`,
    stats: ['str'],
    risk: { wound: 20, death: 8 },
    risky: true,
    failHint: 'Se il varco cede, cedete voi — con il carico ancora da caricare.',
    beat: 4,
    verdictTable: {
      epicfail: {
        damage: 25,
        goto: `${PREFIX}-fine`,
      },
      fail: {
        takeLoot: [prize],
        setObjective: 'done',
        damage: 20,
        goto: `${PREFIX}-fine`,
      },
      almost: {
        takeLoot: [prize],
        setObjective: 'done',
        damage: 10,
        goto: `${PREFIX}-fine`,
      },
      win: {
        takeLoot: [prize],
        setObjective: 'done',
        goldDelta: 20,
        log: 'Il varco tiene. Lasciano il campo — e lasciano anche la borsa.',
        goto: `${PREFIX}-fine`,
      },
      bigwin: {
        takeLoot: [prize],
        setObjective: 'done',
        goldDelta: 35,
        log: 'Il varco tiene. Lasciano il campo — e lasciano anche la borsa.',
        goto: `${PREFIX}-fine`,
      },
    },
  };

  /** F6 — LOSE END: rival hit goal first. The pass is already empty. */
  nodes[`${PREFIX}-sconfitta`] = {
    id: `${PREFIX}-sconfitta`,
    kind: 'end',
    title: 'Il passo vuoto',
    body: `Quando arrivate in vetta, di ${prize} resta solo la sagoma nella neve. ${rival} sono già oltre la cresta, e la cresta non perdona due volte.`,
    beat: 4,
  };

  /** F7 — WIN END: down with the prize. */
  nodes[`${PREFIX}-fine`] = {
    id: `${PREFIX}-fine`,
    kind: 'end',
    title: 'Il ritorno',
    body: 'La strada del ritorno sembra più corta — la montagna vi ha già preso quello che doveva.',
    beat: 4,
  };

  return nodes;
}

/* ------------------------------------------------------------------ */
/* The generator.                                                     */
/* ------------------------------------------------------------------ */

/**
 * Emit the «Corsa al Passo» scenario literal for the given parameters.
 * The output is raw authored data — callers validate via
 * `parseQuestScenario` (the catalog const below already is).
 */
export function generateRaceToPass(params?: Partial<RaceToPassParams>): QuestScenario {
  const p: RaceToPassParams = {
    ...RACE_TO_PASS_DEFAULTS,
    ...params,
    names: { ...RACE_TO_PASS_DEFAULTS.names, ...params?.names },
  };

  return parseQuestScenario({
    id: 'gen-race-to-pass',
    title: `La corsa a ${p.names.place}`,
    flavour: `${p.names.prize}: lo prende chi arriva primo.`,
    scenarioVersion: `gen-race-${p.goal}-${p.twistChance}`,
    startNode: `${PREFIX}-partenza`,
    primaryStats: ['agi', 'str'] as LabStat[],
    beats: ['Assegnazione', 'La prima via', 'La tappa', 'Il twist', 'La vetta'],
    initialVars: { you: 0, rival: 0, goal: p.goal },
    armRolls: [
      {
        flag: 'inseguimento',
        chance: p.twistChance,
        requiresTrait: 'scavezzacollo',
      },
    ],
    offer: {
      objective: `Raggiungere ${p.names.place} prima de ${p.names.rival} e mettere ${p.names.prize} al sicuro.`,
      tags: ['quest', 'gara-di-avanzamento', 'passo-montano', 'gen'],
      slots: {
        required: [
          {
            id: 'rp-slot-leader',
            label: 'Capo spedizione',
            role: 'leader',
            statFocus: ['agi'],
            requirement: { label: 'Capo spedizione', anyOf: ['edge', 'precision'] },
          },
        ],
        optional: [
          {
            id: 'rp-slot-member-1',
            label: 'Corridore',
            role: 'member',
            statFocus: ['str', 'con'],
            requirement: { label: 'Corridore', anyOf: ['edge', 'fortitude', 'warden'] },
          },
          {
            id: 'rp-slot-member-2',
            label: 'Esploratore',
            role: 'member',
            statFocus: ['perc'],
            requirement: { label: 'Esploratore', anyOf: ['precision', 'clarity'] },
          },
          {
            id: 'rp-slot-bodyguard',
            label: 'Guardia del corpo',
            role: 'bodyguard',
            statFocus: ['con', 'str'],
            requirement: { label: 'Guardia del corpo', anyOf: ['warden', 'fortitude'] },
          },
        ],
      },
      referenceParty: [
        { id: 'rp-leader', name: 'Vera', role: 'leader', hp: 80, stats: { str: 45, con: 50, agi: 70, perc: 55, int: 40, cha: 45 } },
        { id: 'rp-m1', name: 'Dag', role: 'member', hp: 70, stats: { str: 65, con: 60, agi: 45, perc: 35, int: 30, cha: 35 } },
        { id: 'rp-m2', name: 'Siri', role: 'member', hp: 60, stats: { str: 35, con: 40, agi: 50, perc: 70, int: 55, cha: 50 } },
        { id: 'rp-bg', name: 'Ulf', role: 'bodyguard', hp: 80, stats: { str: 60, con: 70, agi: 40, perc: 30, int: 25, cha: 25 } },
      ],
      dangerBandRef: 'media',
      rewardBase: 55,
    },
    nodes: buildNodes(p),
  });
}

/* ------------------------------------------------------------------ */
/* The frozen v0 catalog entry.                                        */
/* ------------------------------------------------------------------ */

/** Parsed + validated v0 catalog scenario — the «Corsa al Passo» imprint. */
export const RACE_TO_PASS_SCENARIO: QuestScenario = generateRaceToPass();
