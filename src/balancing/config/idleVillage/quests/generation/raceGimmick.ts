/**
 * raceGimmick — core gimmick «gara-di-avanzamento» (PLAN-026): un
 * generatore strutturale parametrizzato per DOMAIN KIT.
 *
 * Separazione contrattuale (QUEST_GENERATION_CONTRACTS §4): la struttura
 * — grafo, vars di corsa, verdictTable, twist arming, gating trait/info —
 * vive qui ed è identica per ogni kit; il rivestimento — nomi, copy per
 * scena, luoghi, minaccia, premio — viene dal `RaceDomainKit`. Cambiare
 * dominio = cambiare il kit, non il generatore.
 *
 * La corsa vive su `vars`: `you`/`rival` corrono a `goal`; ogni check
 * sposta i cursori e il goto condizionale legge lo stato POST-effetti.
 * Il twist `inseguimento` è armato a runstart (armRolls, gated su
 * 'scavezzacollo') e ri-armato in-run dagli epicfail (rollFlag): armato,
 * devia la rotta su `<prefix>-imboscata` — il ramo twist cambia il grafo
 * percorso, non il testo.
 */

import type { LabStat, QuestNode, Verdict } from '@/ui/idleVillage/questS1Lab/questScenario';
import {
  parseQuestScenario,
  type QuestScenario,
} from '@/balancing/config/idleVillage/quests/questScenario.schema';

/* ------------------------------------------------------------------ */
/* Domain kit contract — the dressing the generator consumes.          */
/* ------------------------------------------------------------------ */

/** Node keys of the race skeleton — a kit must dress every scene. */
export type RaceNodeKey =
  | 'partenza' | 'viaA' | 'viaB' | 'tappa'
  | 'sprint' | 'passo' | 'taglio' | 'balzo'
  | 'imboscata' | 'vetta' | 'sicuro' | 'varco'
  | 'sconfitta' | 'fine';

/** Copy for one scene of the skeleton. `option` is the label/detail a
 *  parent choice shows when routing TO this node (for check nodes); the
 *  choice nodes themselves use `options` for their own entries. */
export interface RaceNodeCopy {
  title: string;
  body: string;
  transit?: string;
  failHint?: string;
  verdictFlavor?: Partial<Record<Verdict, string>>;
  /** Authored log lines pushed by the matching verdict outcome. */
  outcomeLog?: Partial<Record<Verdict, string>>;
  /** How a parent choice presents the route into this node. */
  option?: { label: string; detail: string };
  /** Choice nodes: the full option list copy (keyed by option id). */
  options?: Record<string, { label: string; detail: string }>;
}

/**
 * A domain kit for the race gimmick — the vocabulary (names, places,
 * threat, prize) plus the per-scene dressing. Mechanical numbers stay
 * in the generator; everything a player READS lives here.
 */
export interface RaceDomainKit {
  /** Kit tag — also used as node-id prefix basis when `prefix` absent. */
  id: string;
  /** Node-id prefix ('rp' → rp-crepa). */
  prefix: string;
  title: string;
  flavour: string;
  names: {
    place: string;
    rival: string;
    prize: string;
  };
  /** The info id the safe route reveals and the shortcut option requires. */
  intelId: string;
  /** One-line offer objective. */
  objective: string;
  /** Per-scene dressing — every key of the skeleton must be present. */
  copy: Record<RaceNodeKey, RaceNodeCopy>;
}

/* ------------------------------------------------------------------ */
/* Mechanical tuning — the non-copy knobs.                             */
/* ------------------------------------------------------------------ */

export interface RaceTuning {
  /** Progress goal both racers chase. */
  goal: number;
  /** Arm-chance for the twist at runstart (gated on 'scavezzacollo'). */
  twistChance: number;
  /** In-run re-arm chance on epicfail rows. */
  twistRearmChance: number;
}

export const RACE_DEFAULT_TUNING: RaceTuning = {
  goal: 6,
  twistChance: 50,
  twistRearmChance: 60,
};

const inc = (v: string, n: number) => ({ var: v, op: 'inc' as const, value: n });

/* ------------------------------------------------------------------ */
/* The generator.                                                     */
/* ------------------------------------------------------------------ */

/**
 * Emit the race scenario for `kit` under `tuning` — returns the parsed,
 * schema-validated `QuestScenario` (the generator eats its own contract:
 * if the graph or a goto target is wrong, `parseQuestScenario` throws).
 */
export function generateRaceScenario(
  kit: RaceDomainKit,
  tuning?: Partial<RaceTuning>,
): QuestScenario {
  const p = { ...RACE_DEFAULT_TUNING, ...tuning };
  const K = kit.prefix;
  const copy = kit.copy;

  /** Conditional exit every race check shares: the twist steals the route
   *  when armed, then the first cursor at goal wins, else back to the hub. */
  const raceGoto = (fallback: string) => ({
    branches: [
      { when: { flag: 'inseguimento' }, then: `${K}-imboscata` },
      { when: { varGE: { var: 'you', value: p.goal } }, then: `${K}-vetta` },
      { when: { varGE: { var: 'rival', value: p.goal } }, then: `${K}-sconfitta` },
    ],
    else: fallback,
  });

  /** Same exit without the twist branch — used by the twist node itself
   *  (its outcomes consume the flag). */
  const goalGoto = (fallback: string) => ({
    branches: [
      { when: { varGE: { var: 'you', value: p.goal } }, then: `${K}-vetta` },
      { when: { varGE: { var: 'rival', value: p.goal } }, then: `${K}-sconfitta` },
    ],
    else: fallback,
  });

  const nodes: Record<string, QuestNode> = {};
  const N = (key: RaceNodeKey) => copy[key];

  /* ---- F0 — ASSEGNAZIONE: first route choice ---- */
  nodes[`${K}-partenza`] = {
    id: `${K}-partenza`,
    kind: 'choice',
    title: N('partenza').title,
    body: N('partenza').body,
    beat: 0,
    options: [
      { id: `${K}-via-a`, label: N('viaA').option!.label, detail: N('viaA').option!.detail, next: `CHECK:${K}-viaA` },
      { id: `${K}-via-b`, label: N('viaB').option!.label, detail: N('viaB').option!.detail, next: `CHECK:${K}-viaB` },
    ],
  };

  /* ---- F1a — fast route: big you-gains, rival punishes fails ---- */
  nodes[`${K}-viaA`] = {
    id: `${K}-viaA`,
    kind: 'check',
    title: N('viaA').title,
    body: N('viaA').body,
    transit: N('viaA').transit,
    stats: ['agi'],
    risk: { wound: 10, death: 4 },
    risky: true,
    failHint: N('viaA').failHint,
    beat: 1,
    verdictFlavor: N('viaA').verdictFlavor,
    verdictTable: {
      epicfail: {
        vars: [inc('rival', 2)],
        damage: 15,
        rollFlag: { flag: 'inseguimento', chance: p.twistRearmChance },
        log: N('viaA').outcomeLog?.epicfail,
        goto: raceGoto(`${K}-tappa`),
      },
      fail: { vars: [inc('rival', 2)], damage: 8, goto: raceGoto(`${K}-tappa`) },
      almost: { vars: [inc('you', 1)], goto: raceGoto(`${K}-tappa`) },
      win: { vars: [inc('you', 2)], log: N('viaA').outcomeLog?.win, goto: raceGoto(`${K}-tappa`) },
      bigwin: { vars: [inc('you', 3)], goto: raceGoto(`${K}-tappa`) },
    },
  };

  /* ---- F1b — safe route: smaller gains, reveals the shortcut intel ---- */
  nodes[`${K}-viaB`] = {
    id: `${K}-viaB`,
    kind: 'check',
    title: N('viaB').title,
    body: N('viaB').body,
    transit: N('viaB').transit,
    stats: ['perc'],
    risk: { wound: 4, death: 1 },
    failHint: N('viaB').failHint,
    beat: 1,
    verdictTable: {
      epicfail: { vars: [inc('rival', 2)], goto: raceGoto(`${K}-tappa`) },
      fail: { vars: [inc('rival', 1)], goto: raceGoto(`${K}-tappa`) },
      almost: { vars: [inc('you', 1)], goto: raceGoto(`${K}-tappa`) },
      win: {
        vars: [inc('you', 1)],
        setInfo: [kit.intelId],
        log: N('viaB').outcomeLog?.win,
        goto: raceGoto(`${K}-tappa`),
      },
      bigwin: {
        vars: [inc('you', 2)],
        setInfo: [kit.intelId],
        log: N('viaB').outcomeLog?.bigwin ?? N('viaB').outcomeLog?.win,
        goto: raceGoto(`${K}-tappa`),
      },
    },
  };

  /* ---- F2 — TAPPA (hub): the second crucial choice ---- */
  nodes[`${K}-tappa`] = {
    id: `${K}-tappa`,
    kind: 'choice',
    title: N('tappa').title,
    body: N('tappa').body,
    transit: N('tappa').transit,
    beat: 2,
    options: [
      { id: `${K}-sprint`, label: N('sprint').option!.label, detail: N('sprint').option!.detail, next: `CHECK:${K}-sprint` },
      { id: `${K}-passo`, label: N('passo').option!.label, detail: N('passo').option!.detail, next: `CHECK:${K}-passo` },
      {
        id: `${K}-tagliata`,
        label: N('taglio').option!.label,
        detail: N('taglio').option!.detail,
        next: `CHECK:${K}-taglio`,
        requiresInfo: kit.intelId,
      },
      {
        id: `${K}-balzo`,
        label: N('balzo').option!.label,
        detail: N('balzo').option!.detail,
        next: `CHECK:${K}-balzo`,
        requiresTrait: 'avido',
      },
    ],
  };

  nodes[`${K}-sprint`] = {
    id: `${K}-sprint`,
    kind: 'check',
    title: N('sprint').title,
    body: N('sprint').body,
    stats: ['str'],
    risk: { wound: 8, death: 2 },
    failHint: N('sprint').failHint,
    beat: 2,
    verdictTable: {
      epicfail: {
        vars: [inc('rival', 2)],
        damage: 12,
        rollFlag: { flag: 'inseguimento', chance: p.twistRearmChance },
        log: N('sprint').outcomeLog?.epicfail,
        goto: raceGoto(`${K}-tappa`),
      },
      fail: { vars: [inc('rival', 2)], damage: 6, goto: raceGoto(`${K}-tappa`) },
      almost: { vars: [inc('you', 1)], goto: raceGoto(`${K}-tappa`) },
      win: { vars: [inc('you', 3)], goto: raceGoto(`${K}-tappa`) },
      bigwin: { vars: [inc('you', 4)], goto: raceGoto(`${K}-tappa`) },
    },
  };

  nodes[`${K}-passo`] = {
    id: `${K}-passo`,
    kind: 'check',
    title: N('passo').title,
    body: N('passo').body,
    stats: ['con'],
    risk: { wound: 5, death: 1 },
    beat: 2,
    verdictTable: {
      epicfail: {
        vars: [inc('rival', 2)],
        rollFlag: { flag: 'inseguimento', chance: p.twistRearmChance },
        goto: raceGoto(`${K}-tappa`),
      },
      fail: { vars: [inc('rival', 1)], goto: raceGoto(`${K}-tappa`) },
      almost: { vars: [inc('you', 1)], goto: raceGoto(`${K}-tappa`) },
      win: { vars: [inc('you', 2)], goto: raceGoto(`${K}-tappa`) },
      bigwin: { vars: [inc('you', 3)], goto: raceGoto(`${K}-tappa`) },
    },
  };

  /* ---- info-gated shortcut ---- */
  nodes[`${K}-taglio`] = {
    id: `${K}-taglio`,
    kind: 'check',
    title: N('taglio').title,
    body: N('taglio').body,
    stats: ['agi'],
    risk: { wound: 6, death: 2 },
    failHint: N('taglio').failHint,
    beat: 2,
    verdictTable: {
      epicfail: { vars: [inc('rival', 2)], damage: 10, goto: raceGoto(`${K}-tappa`) },
      fail: { vars: [inc('rival', 1)], goto: raceGoto(`${K}-tappa`) },
      almost: { vars: [inc('you', 1)], goto: raceGoto(`${K}-tappa`) },
      win: { vars: [inc('you', 3)], goto: raceGoto(`${K}-tappa`) },
      bigwin: { vars: [inc('you', 4)], goto: raceGoto(`${K}-tappa`) },
    },
  };

  /* ---- trait-gated leap (avido) ---- */
  nodes[`${K}-balzo`] = {
    id: `${K}-balzo`,
    kind: 'check',
    title: N('balzo').title,
    body: N('balzo').body,
    stats: ['agi'],
    risk: { wound: 15, death: 6 },
    risky: true,
    failHint: N('balzo').failHint,
    beat: 2,
    verdictFlavor: N('balzo').verdictFlavor,
    verdictTable: {
      epicfail: {
        vars: [inc('rival', 3)],
        damage: 20,
        rollFlag: { flag: 'inseguimento', chance: p.twistRearmChance },
        goto: raceGoto(`${K}-tappa`),
      },
      fail: { vars: [inc('rival', 2)], damage: 15, goto: raceGoto(`${K}-tappa`) },
      almost: { vars: [inc('you', 2)], damage: 5, goto: raceGoto(`${K}-tappa`) },
      win: { vars: [inc('you', 4)], goto: raceGoto(`${K}-tappa`) },
      bigwin: { vars: [inc('you', 5)], goto: goalGoto(`${K}-vetta`) },
    },
  };

  /* ---- F3 — TWIST: reachable only while 'inseguimento' is armed ---- */
  nodes[`${K}-imboscata`] = {
    id: `${K}-imboscata`,
    kind: 'check',
    title: N('imboscata').title,
    body: N('imboscata').body,
    stats: ['str', 'agi'],
    risk: { wound: 18, death: 7 },
    risky: true,
    failHint: N('imboscata').failHint,
    beat: 3,
    verdictFlavor: N('imboscata').verdictFlavor,
    verdictTable: {
      epicfail: {
        vars: [inc('rival', 3)],
        damage: 25,
        clearFlags: ['inseguimento'],
        goto: goalGoto(`${K}-tappa`),
      },
      fail: {
        vars: [inc('rival', 2)],
        damage: 18,
        clearFlags: ['inseguimento'],
        goto: goalGoto(`${K}-tappa`),
      },
      almost: {
        damage: 8,
        clearFlags: ['inseguimento'],
        goto: goalGoto(`${K}-tappa`),
      },
      win: {
        vars: [inc('you', 1)],
        clearFlags: ['inseguimento'],
        log: N('imboscata').outcomeLog?.win,
        goto: goalGoto(`${K}-tappa`),
      },
      bigwin: {
        vars: [inc('you', 2)],
        clearFlags: ['inseguimento'],
        log: N('imboscata').outcomeLog?.bigwin ?? N('imboscata').outcomeLog?.win,
        goto: goalGoto(`${K}-tappa`),
      },
    },
  };

  /* ---- F4 — VETTA: prize TAKEN, not yet SECURED ---- */
  nodes[`${K}-vetta`] = {
    id: `${K}-vetta`,
    kind: 'choice',
    title: N('vetta').title,
    body: N('vetta').body,
    transit: N('vetta').transit,
    beat: 3,
    options: [
      {
        id: `${K}-carico`,
        label: N('sicuro').option!.label,
        detail: N('sicuro').option!.detail,
        next: `CHECK:${K}-sicuro`,
      },
      {
        id: `${K}-attesa`,
        label: N('varco').option!.label,
        detail: N('varco').option!.detail,
        next: `CHECK:${K}-varco`,
        requiresTrait: 'scavezzacollo',
      },
    ],
  };

  /* ---- F5a — secure check: the prize is taken whatever the verdict;
   *  the verdict decides the price of carrying it home. ---- */
  nodes[`${K}-sicuro`] = {
    id: `${K}-sicuro`,
    kind: 'check',
    title: N('sicuro').title,
    body: N('sicuro').body,
    stats: ['con'],
    risk: { wound: 8, death: 2 },
    beat: 4,
    verdictTable: {
      epicfail: {
        takeLoot: [kit.names.prize],
        setObjective: 'done',
        damage: 20,
        log: N('sicuro').outcomeLog?.epicfail,
        goto: `${K}-fine`,
      },
      fail: {
        takeLoot: [kit.names.prize],
        setObjective: 'done',
        damage: 10,
        goto: `${K}-fine`,
      },
      almost: { takeLoot: [kit.names.prize], setObjective: 'done', goto: `${K}-fine` },
      win: {
        takeLoot: [kit.names.prize],
        setObjective: 'done',
        log: N('sicuro').outcomeLog?.win,
        goto: `${K}-fine`,
      },
      bigwin: {
        takeLoot: [kit.names.prize],
        setObjective: 'done',
        goldDelta: 15,
        log: N('sicuro').outcomeLog?.bigwin ?? N('sicuro').outcomeLog?.win,
        goto: `${K}-fine`,
      },
    },
  };

  /* ---- F5b — scavezzacollo ending: hold the choke point ---- */
  nodes[`${K}-varco`] = {
    id: `${K}-varco`,
    kind: 'check',
    title: N('varco').title,
    body: N('varco').body,
    stats: ['str'],
    risk: { wound: 20, death: 8 },
    risky: true,
    failHint: N('varco').failHint,
    beat: 4,
    verdictTable: {
      epicfail: { damage: 25, goto: `${K}-fine` },
      fail: {
        takeLoot: [kit.names.prize],
        setObjective: 'done',
        damage: 20,
        goto: `${K}-fine`,
      },
      almost: {
        takeLoot: [kit.names.prize],
        setObjective: 'done',
        damage: 10,
        goto: `${K}-fine`,
      },
      win: {
        takeLoot: [kit.names.prize],
        setObjective: 'done',
        goldDelta: 20,
        log: N('varco').outcomeLog?.win,
        goto: `${K}-fine`,
      },
      bigwin: {
        takeLoot: [kit.names.prize],
        setObjective: 'done',
        goldDelta: 35,
        log: N('varco').outcomeLog?.bigwin ?? N('varco').outcomeLog?.win,
        goto: `${K}-fine`,
      },
    },
  };

  /* ---- F6/F7 — ends ---- */
  nodes[`${K}-sconfitta`] = {
    id: `${K}-sconfitta`,
    kind: 'end',
    title: N('sconfitta').title,
    body: N('sconfitta').body,
    beat: 4,
  };
  nodes[`${K}-fine`] = {
    id: `${K}-fine`,
    kind: 'end',
    title: N('fine').title,
    body: N('fine').body,
    beat: 4,
  };

  return parseQuestScenario({
    id: `gen-race-${kit.id}`,
    title: kit.title,
    flavour: kit.flavour,
    scenarioVersion: `gen-race-${kit.id}-${p.goal}-${p.twistChance}`,
    startNode: `${K}-partenza`,
    primaryStats: ['agi', 'str'] as LabStat[],
    beats: ['Assegnazione', 'La prima via', 'La tappa', 'Il twist', 'La vetta'],
    initialVars: { you: 0, rival: 0, goal: p.goal },
    armRolls: [
      { flag: 'inseguimento', chance: p.twistChance, requiresTrait: 'scavezzacollo' },
    ],
    offer: {
      objective: kit.objective,
      tags: ['quest', 'gara-di-avanzamento', kit.id, 'gen'],
      slots: {
        required: [
          {
            id: `${K}-slot-leader`,
            label: 'Capo spedizione',
            role: 'leader',
            statFocus: ['agi'],
            requirement: { label: 'Capo spedizione', anyOf: ['edge', 'precision'] },
          },
        ],
        optional: [
          {
            id: `${K}-slot-member-1`,
            label: 'Corridore',
            role: 'member',
            statFocus: ['str', 'con'],
            requirement: { label: 'Corridore', anyOf: ['edge', 'fortitude', 'warden'] },
          },
          {
            id: `${K}-slot-member-2`,
            label: 'Esploratore',
            role: 'member',
            statFocus: ['perc'],
            requirement: { label: 'Esploratore', anyOf: ['precision', 'clarity'] },
          },
          {
            id: `${K}-slot-bodyguard`,
            label: 'Guardia del corpo',
            role: 'bodyguard',
            statFocus: ['con', 'str'],
            requirement: { label: 'Guardia del corpo', anyOf: ['warden', 'fortitude'] },
          },
        ],
      },
      referenceParty: [
        { id: `${K}-leader`, name: 'Vera', role: 'leader', hp: 80, stats: { str: 45, con: 50, agi: 70, perc: 55, int: 40, cha: 45 } },
        { id: `${K}-m1`, name: 'Dag', role: 'member', hp: 70, stats: { str: 65, con: 60, agi: 45, perc: 35, int: 30, cha: 35 } },
        { id: `${K}-m2`, name: 'Siri', role: 'member', hp: 60, stats: { str: 35, con: 40, agi: 50, perc: 70, int: 55, cha: 50 } },
        { id: `${K}-bg`, name: 'Ulf', role: 'bodyguard', hp: 80, stats: { str: 60, con: 70, agi: 40, perc: 30, int: 25, cha: 25 } },
      ],
      dangerBandRef: 'media',
      rewardBase: 55,
    },
    nodes,
  });
}
