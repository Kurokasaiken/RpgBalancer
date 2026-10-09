/**
 * floodVault — secondo core gimmick «la volta che allaga» (PLAN-026 T-3
 * residuo): loot-vs-fuga, struttura radicalmente diversa dalla corsa.
 *
 * La meccanica centrale è avidità/rimpianto (pilastro emotivo primo):
 * due cursori — `acqua` (sale a OGNI azione) e `uscita` (sale solo se
 * spingi verso il pozzo) — più il bottino come ITEM TAKEN. Il giocatore
 * decide a ogni hub se saccheggiare ancora o scappare; quando `acqua`
 * supera il limite la galleria va in piena e il bottino in mano va
 * mollato o rischiato in un nuoto quasi suicida.
 *
 * Kit dressing `miniera` (vocabolario QUEST_IMPRINTS: gabbia del pozzo,
 * vena, puntellame, buio, campana del turno). La struttura e il dressing
 * sono separati come in raceGimmick; un secondo kit si aggiunge
 * fornendo un altro `FloodDomainKit`.
 */

import type { LabStat, QuestNode, Verdict } from '@/ui/idleVillage/questS1Lab/questScenario';
import {
  parseQuestScenario,
  type QuestScenario,
} from '@/balancing/config/idleVillage/quests/questScenario.schema';

/* ------------------------------------------------------------------ */
/* Domain kit contract — the dressing the generator consumes.          */
/* ------------------------------------------------------------------ */

/** Node keys of the flooding-vault skeleton. */
export type FloodNodeKey =
  | 'ingresso' | 'gabbia' | 'cunicolo' | 'crocevia'
  | 'vena' | 'punta' | 'camera' | 'puntella' | 'madre'
  | 'piena' | 'nuoto' | 'sacca' | 'sbarramento' | 'diaframma' | 'ultimo'
  | 'fine';

/** Copy for one scene — same shape as `RaceNodeCopy`. */
export interface FloodNodeCopy {
  title: string;
  body: string;
  transit?: string;
  failHint?: string;
  verdictFlavor?: Partial<Record<Verdict, string>>;
  outcomeLog?: Partial<Record<Verdict, string>>;
  option?: { label: string; detail: string };
}

/** A domain kit for the flood gimmick. */
export interface FloodDomainKit {
  id: string;
  prefix: string;
  title: string;
  flavour: string;
  objective: string;
  /** The info id the scout route reveals and the hidden-chamber option
   *  requires. */
  intelId: string;
  /** Loot item names — the TAKEN things the water can make you drop. */
  loot: {
    /** Small haul — the common sack (deduped in the loot list). */
    pezzo: string;
    /** Hidden-chamber chest (requiresInfo). */
    cassa: string;
    /** The mother lode (avido-armed twist option). */
    madre: string;
    /** The last grab right before the exit. */
    lingotto: string;
  };
  copy: Record<FloodNodeKey, FloodNodeCopy>;
}

/* ------------------------------------------------------------------ */
/* Mechanical tuning.                                                 */
/* ------------------------------------------------------------------ */

export interface FloodTuning {
  /** `acqua` at which the gallery floods. */
  limite: number;
  /** `uscita` progress needed to reach the barrier. */
  uscitaGoal: number;
  /** Runstart arm chance for 'cassa-madre' (gated on 'avido'). */
  madreChance: number;
  /** Runstart arm chance for 'parete-cede' (ungated event twist). */
  pareteChance: number;
}

export const FLOOD_DEFAULT_TUNING: FloodTuning = {
  limite: 8,
  uscitaGoal: 5,
  madreChance: 50,
  pareteChance: 35,
};

const inc = (v: string, n: number) => ({ var: v, op: 'inc' as const, value: n });
const dec = (v: string, n: number) => ({ var: v, op: 'dec' as const, value: n });

/* ------------------------------------------------------------------ */
/* The generator.                                                     */
/* ------------------------------------------------------------------ */

/**
 * Emit the flooding-vault scenario for `kit` under `tuning` — returns the
 * parsed, schema-validated `QuestScenario`.
 */
export function generateFloodVault(
  kit: FloodDomainKit,
  tuning?: Partial<FloodTuning>,
): QuestScenario {
  const p = { ...FLOOD_DEFAULT_TUNING, ...tuning };
  const K = kit.prefix;
  const C = kit.copy;
  const ALL_LOOT = [kit.loot.pezzo, kit.loot.cassa, kit.loot.madre, kit.loot.lingotto];

  /** Exit shared by every hub check: flood trumps escape — if both
   *  thresholds cross on the same roll the wall broke first. */
  const floodGoto = (fallback: string) => ({
    branches: [
      { when: { varGE: { var: 'acqua', value: p.limite } }, then: `${K}-piena` },
      { when: { varGE: { var: 'uscita', value: p.uscitaGoal } }, then: `${K}-sbarramento` },
    ],
    else: fallback,
  });

  const nodes: Record<string, QuestNode> = {};
  const N = (k: FloodNodeKey) => C[k];

  /* ---- F0 — INGRESSO: the descent, two ways down ---- */
  nodes[`${K}-ingresso`] = {
    id: `${K}-ingresso`,
    kind: 'choice',
    title: N('ingresso').title,
    body: N('ingresso').body,
    beat: 0,
    options: [
      { id: `${K}-via-gabbia`, label: N('gabbia').option!.label, detail: N('gabbia').option!.detail, next: `CHECK:${K}-gabbia` },
      { id: `${K}-via-cunicolo`, label: N('cunicolo').option!.label, detail: N('cunicolo').option!.detail, next: `CHECK:${K}-cunicolo` },
    ],
  };

  nodes[`${K}-gabbia`] = {
    id: `${K}-gabbia`,
    kind: 'check',
    title: N('gabbia').title,
    body: N('gabbia').body,
    stats: ['con'],
    risk: { wound: 6, death: 1 },
    failHint: N('gabbia').failHint,
    beat: 1,
    verdictTable: {
      epicfail: { vars: [inc('acqua', 3)], damage: 12, goto: floodGoto(`${K}-crocevia`) },
      fail: { vars: [inc('acqua', 2)], damage: 6, goto: floodGoto(`${K}-crocevia`) },
      almost: { vars: [inc('uscita', 1), inc('acqua', 1)], goto: floodGoto(`${K}-crocevia`) },
      win: { vars: [inc('uscita', 1), inc('acqua', 1)], goto: floodGoto(`${K}-crocevia`) },
      bigwin: { vars: [inc('uscita', 2), inc('acqua', 1)], goto: floodGoto(`${K}-crocevia`) },
    },
  };

  nodes[`${K}-cunicolo`] = {
    id: `${K}-cunicolo`,
    kind: 'check',
    title: N('cunicolo').title,
    body: N('cunicolo').body,
    stats: ['perc'],
    risk: { wound: 6, death: 1 },
    failHint: N('cunicolo').failHint,
    beat: 1,
    verdictTable: {
      epicfail: { vars: [inc('acqua', 2)], damage: 8, goto: floodGoto(`${K}-crocevia`) },
      fail: { vars: [inc('acqua', 2)], goto: floodGoto(`${K}-crocevia`) },
      almost: { vars: [inc('uscita', 1), inc('acqua', 1)], goto: floodGoto(`${K}-crocevia`) },
      win: {
        vars: [inc('uscita', 1), inc('acqua', 1)],
        setInfo: [kit.intelId],
        log: N('cunicolo').outcomeLog?.win,
        goto: floodGoto(`${K}-crocevia`),
      },
      bigwin: {
        vars: [inc('uscita', 2), inc('acqua', 1)],
        setInfo: [kit.intelId],
        log: N('cunicolo').outcomeLog?.bigwin ?? N('cunicolo').outcomeLog?.win,
        goto: floodGoto(`${K}-crocevia`),
      },
    },
  };

  /* ---- F1 — CROCEVIA (hub): the greed heart. Loot or leave. ---- */
  nodes[`${K}-crocevia`] = {
    id: `${K}-crocevia`,
    kind: 'choice',
    title: N('crocevia').title,
    body: N('crocevia').body,
    transit: N('crocevia').transit,
    beat: 1,
    options: [
      { id: `${K}-saccheggia`, label: N('vena').option!.label, detail: N('vena').option!.detail, next: `CHECK:${K}-vena` },
      { id: `${K}-punta`, label: N('punta').option!.label, detail: N('punta').option!.detail, next: `CHECK:${K}-punta` },
      {
        id: `${K}-occulta`,
        label: N('camera').option!.label,
        detail: N('camera').option!.detail,
        next: `CHECK:${K}-camera`,
        requiresInfo: kit.intelId,
      },
      {
        id: `${K}-puntellare`,
        label: N('puntella').option!.label,
        detail: N('puntella').option!.detail,
        next: `CHECK:${K}-puntella`,
        requiresTrait: 'prudente',
      },
      {
        id: `${K}-madre`,
        label: N('madre').option!.label,
        detail: N('madre').option!.detail,
        next: `CHECK:${K}-madre`,
        requiresFlag: 'cassa-madre',
      },
    ],
  };

  /* ---- loot the vein: +1 item, +1 acqua ---- */
  nodes[`${K}-vena`] = {
    id: `${K}-vena`,
    kind: 'check',
    title: N('vena').title,
    body: N('vena').body,
    stats: ['perc'],
    risk: { wound: 8, death: 2 },
    failHint: N('vena').failHint,
    beat: 1,
    verdictFlavor: N('vena').verdictFlavor,
    verdictTable: {
      epicfail: { vars: [inc('acqua', 2)], damage: 10, goto: floodGoto(`${K}-crocevia`) },
      fail: { vars: [inc('acqua', 2)], goto: floodGoto(`${K}-crocevia`) },
      almost: {
        takeLoot: [kit.loot.pezzo],
        vars: [inc('acqua', 1)],
        goto: floodGoto(`${K}-crocevia`),
      },
      win: {
        takeLoot: [kit.loot.pezzo],
        vars: [inc('acqua', 1)],
        rollFlag: { flag: 'cassa-madre', chance: 40 },
        log: N('vena').outcomeLog?.win,
        goto: floodGoto(`${K}-crocevia`),
      },
      bigwin: {
        takeLoot: [kit.loot.pezzo],
        vars: [inc('acqua', 1)],
        rollFlag: { flag: 'cassa-madre', chance: 60 },
        log: N('vena').outcomeLog?.bigwin ?? N('vena').outcomeLog?.win,
        goto: floodGoto(`${K}-crocevia`),
      },
    },
  };

  /* ---- push to the shaft: +2 uscita, +1 acqua; the 'parete-cede' twist
   *  makes a bad push break the gallery early. ---- */
  nodes[`${K}-punta`] = {
    id: `${K}-punta`,
    kind: 'check',
    title: N('punta').title,
    body: N('punta').body,
    stats: ['agi'],
    risk: { wound: 10, death: 4 },
    risky: true,
    failHint: N('punta').failHint,
    beat: 1,
    verdictTable: {
      epicfail: {
        vars: [inc('acqua', 3)],
        damage: 15,
        goto: {
          branches: [
            { when: { flag: 'parete-cede' }, then: `${K}-piena` },
            { when: { varGE: { var: 'acqua', value: p.limite } }, then: `${K}-piena` },
            { when: { varGE: { var: 'uscita', value: p.uscitaGoal } }, then: `${K}-sbarramento` },
          ],
          else: `${K}-crocevia`,
        },
      },
      fail: { vars: [inc('uscita', 1), inc('acqua', 2)], goto: floodGoto(`${K}-crocevia`) },
      almost: { vars: [inc('uscita', 1), inc('acqua', 1)], goto: floodGoto(`${K}-crocevia`) },
      win: { vars: [inc('uscita', 2), inc('acqua', 1)], goto: floodGoto(`${K}-crocevia`) },
      bigwin: { vars: [inc('uscita', 3), inc('acqua', 1)], goto: floodGoto(`${K}-crocevia`) },
    },
  };

  /* ---- info-gated chamber: bigger loot, same water ---- */
  nodes[`${K}-camera`] = {
    id: `${K}-camera`,
    kind: 'check',
    title: N('camera').title,
    body: N('camera').body,
    stats: ['str'],
    risk: { wound: 8, death: 3 },
    failHint: N('camera').failHint,
    beat: 2,
    verdictTable: {
      epicfail: {
        vars: [inc('acqua', 3)],
        damage: 15,
        rollFlag: { flag: 'parete-cede', chance: 50 },
        goto: floodGoto(`${K}-crocevia`),
      },
      fail: { vars: [inc('acqua', 2)], damage: 10, goto: floodGoto(`${K}-crocevia`) },
      almost: {
        takeLoot: [kit.loot.cassa],
        vars: [inc('acqua', 1)],
        goto: floodGoto(`${K}-crocevia`),
      },
      win: {
        takeLoot: [kit.loot.cassa],
        vars: [inc('acqua', 1)],
        goto: floodGoto(`${K}-crocevia`),
      },
      bigwin: {
        takeLoot: [kit.loot.cassa],
        vars: [inc('acqua', 1)],
        goldDelta: 10,
        goto: floodGoto(`${K}-crocevia`),
      },
    },
  };

  /* ---- prudente option: the ONLY way to push the water back — the
   *  careful one buys time nobody else can. ---- */
  nodes[`${K}-puntella`] = {
    id: `${K}-puntella`,
    kind: 'check',
    title: N('puntella').title,
    body: N('puntella').body,
    stats: ['int'],
    risk: { wound: 4, death: 1 },
    failHint: N('puntella').failHint,
    beat: 2,
    verdictTable: {
      epicfail: { vars: [inc('acqua', 2)], damage: 8, goto: floodGoto(`${K}-crocevia`) },
      fail: { vars: [inc('acqua', 1)], goto: floodGoto(`${K}-crocevia`) },
      almost: { vars: [dec('acqua', 1)], goto: floodGoto(`${K}-crocevia`) },
      win: {
        vars: [dec('acqua', 2)],
        log: N('puntella').outcomeLog?.win,
        goto: floodGoto(`${K}-crocevia`),
      },
      bigwin: {
        vars: [dec('acqua', 3)],
        log: N('puntella').outcomeLog?.bigwin ?? N('puntella').outcomeLog?.win,
        goto: floodGoto(`${K}-crocevia`),
      },
    },
  };

  /* ---- the mother lode (twist option): the biggest take, the heaviest
   *  water — reachable only while 'cassa-madre' is armed. ---- */
  nodes[`${K}-madre`] = {
    id: `${K}-madre`,
    kind: 'check',
    title: N('madre').title,
    body: N('madre').body,
    stats: ['str'],
    risk: { wound: 15, death: 6 },
    risky: true,
    failHint: N('madre').failHint,
    beat: 2,
    verdictFlavor: N('madre').verdictFlavor,
    verdictTable: {
      epicfail: { vars: [inc('acqua', 3)], damage: 25, goto: floodGoto(`${K}-crocevia`) },
      fail: { vars: [inc('acqua', 3)], damage: 15, goto: floodGoto(`${K}-crocevia`) },
      almost: {
        takeLoot: [kit.loot.madre],
        vars: [inc('acqua', 2)],
        goto: floodGoto(`${K}-crocevia`),
      },
      win: {
        takeLoot: [kit.loot.madre],
        vars: [inc('acqua', 2)],
        log: N('madre').outcomeLog?.win,
        goto: floodGoto(`${K}-crocevia`),
      },
      bigwin: {
        takeLoot: [kit.loot.madre],
        vars: [inc('acqua', 1)],
        log: N('madre').outcomeLog?.bigwin ?? N('madre').outcomeLog?.win,
        goto: floodGoto(`${K}-crocevia`),
      },
    },
  };

  /* ---- F2 — LA PIENA: the water broke. The greed bill comes due:
   *  drop the sack and swim, or hold it and risk drowning with it. ---- */
  nodes[`${K}-piena`] = {
    id: `${K}-piena`,
    kind: 'choice',
    title: N('piena').title,
    body: N('piena').body,
    transit: N('piena').transit,
    beat: 3,
    options: [
      { id: `${K}-mollare`, label: N('nuoto').option!.label, detail: N('nuoto').option!.detail, next: `CHECK:${K}-nuoto` },
      { id: `${K}-tenere`, label: N('sacca').option!.label, detail: N('sacca').option!.detail, next: `CHECK:${K}-sacca` },
    ],
  };

  nodes[`${K}-nuoto`] = {
    id: `${K}-nuoto`,
    kind: 'check',
    title: N('nuoto').title,
    body: N('nuoto').body,
    stats: ['agi'],
    risk: { wound: 15, death: 5 },
    risky: true,
    beat: 3,
    verdictTable: {
      epicfail: { dropLoot: ALL_LOOT, damage: 30, goto: `${K}-fine` },
      fail: { dropLoot: ALL_LOOT, damage: 15, goto: `${K}-fine` },
      almost: { dropLoot: ALL_LOOT, goto: `${K}-fine` },
      win: { dropLoot: ALL_LOOT, goto: `${K}-fine` },
      bigwin: { dropLoot: ALL_LOOT, goto: `${K}-fine` },
    },
  };

  nodes[`${K}-sacca`] = {
    id: `${K}-sacca`,
    kind: 'check',
    title: N('sacca').title,
    body: N('sacca').body,
    stats: ['con'],
    risk: { wound: 20, death: 10 },
    risky: true,
    failHint: N('sacca').failHint,
    beat: 3,
    verdictFlavor: N('sacca').verdictFlavor,
    verdictTable: {
      epicfail: { dropLoot: ALL_LOOT, damage: 35, goto: `${K}-fine` },
      fail: { dropLoot: ALL_LOOT, damage: 25, goto: `${K}-fine` },
      almost: { damage: 15, goto: `${K}-fine` },
      win: {
        log: N('sacca').outcomeLog?.win,
        goto: `${K}-fine`,
      },
      bigwin: {
        log: N('sacca').outcomeLog?.bigwin ?? N('sacca').outcomeLog?.win,
        goto: `${K}-fine`,
      },
    },
  };

  /* ---- F3 — LO SBARRAMENTO: reached when uscita >= goal and the water
   *  hasn't broken yet. Break out — or grab one last piece. ---- */
  nodes[`${K}-sbarramento`] = {
    id: `${K}-sbarramento`,
    kind: 'choice',
    title: N('sbarramento').title,
    body: N('sbarramento').body,
    transit: N('sbarramento').transit,
    beat: 4,
    options: [
      { id: `${K}-sfonda`, label: N('diaframma').option!.label, detail: N('diaframma').option!.detail, next: `CHECK:${K}-diaframma` },
      { id: `${K}-ultimopezzo`, label: N('ultimo').option!.label, detail: N('ultimo').option!.detail, next: `CHECK:${K}-ultimo` },
    ],
  };

  nodes[`${K}-diaframma`] = {
    id: `${K}-diaframma`,
    kind: 'check',
    title: N('diaframma').title,
    body: N('diaframma').body,
    stats: ['con'],
    risk: { wound: 8, death: 3 },
    failHint: N('diaframma').failHint,
    beat: 4,
    verdictTable: {
      epicfail: { setObjective: 'done', damage: 20, dropLoot: [kit.loot.pezzo], goto: `${K}-fine` },
      fail: { setObjective: 'done', damage: 10, goto: `${K}-fine` },
      almost: { setObjective: 'done', goto: `${K}-fine` },
      win: {
        setObjective: 'done',
        log: N('diaframma').outcomeLog?.win,
        goto: `${K}-fine`,
      },
      bigwin: {
        setObjective: 'done',
        goldDelta: 10,
        log: N('diaframma').outcomeLog?.bigwin ?? N('diaframma').outcomeLog?.win,
        goto: `${K}-fine`,
      },
    },
  };

  /* ---- the last grab: greed right at the door — can flood the gallery
   *  with the exit already in sight. ---- */
  nodes[`${K}-ultimo`] = {
    id: `${K}-ultimo`,
    kind: 'check',
    title: N('ultimo').title,
    body: N('ultimo').body,
    stats: ['perc'],
    risk: { wound: 8, death: 3 },
    failHint: N('ultimo').failHint,
    beat: 4,
    verdictTable: {
      epicfail: {
        vars: [inc('acqua', 3)],
        damage: 15,
        goto: {
          branches: [{ when: { varGE: { var: 'acqua', value: p.limite } }, then: `${K}-piena` }],
          else: `${K}-sbarramento`,
        },
      },
      fail: {
        vars: [inc('acqua', 2)],
        goto: {
          branches: [{ when: { varGE: { var: 'acqua', value: p.limite } }, then: `${K}-piena` }],
          else: `${K}-sbarramento`,
        },
      },
      almost: {
        takeLoot: [kit.loot.lingotto],
        vars: [inc('acqua', 2)],
        goto: {
          branches: [{ when: { varGE: { var: 'acqua', value: p.limite } }, then: `${K}-piena` }],
          else: `${K}-sbarramento`,
        },
      },
      win: {
        takeLoot: [kit.loot.lingotto],
        vars: [inc('acqua', 2)],
        goto: {
          branches: [{ when: { varGE: { var: 'acqua', value: p.limite } }, then: `${K}-piena` }],
          else: `${K}-sbarramento`,
        },
      },
      bigwin: {
        takeLoot: [kit.loot.lingotto],
        vars: [inc('acqua', 1)],
        goto: {
          branches: [{ when: { varGE: { var: 'acqua', value: p.limite } }, then: `${K}-piena` }],
          else: `${K}-sbarramento`,
        },
      },
    },
  };

  /* ---- F4 — FINE ---- */
  nodes[`${K}-fine`] = {
    id: `${K}-fine`,
    kind: 'end',
    title: N('fine').title,
    body: N('fine').body,
    beat: 4,
  };

  return parseQuestScenario({
    id: `gen-flood-${kit.id}`,
    title: kit.title,
    flavour: kit.flavour,
    scenarioVersion: `gen-flood-${kit.id}-${p.limite}-${p.madreChance}`,
    startNode: `${K}-ingresso`,
    primaryStats: ['perc', 'con'] as LabStat[],
    beats: ['Ingresso', 'La vena', 'L’acqua', 'La piena', 'Il pozzo'],
    initialVars: { acqua: 0, uscita: 0 },
    armRolls: [
      { flag: 'cassa-madre', chance: p.madreChance, requiresTrait: 'avido' },
      { flag: 'parete-cede', chance: p.pareteChance },
    ],
    offer: {
      objective: kit.objective,
      tags: ['quest', 'la-volta-che-allaga', kit.id, 'gen'],
      slots: {
        required: [
          {
            id: `${K}-slot-leader`,
            label: 'Capo spedizione',
            role: 'leader',
            statFocus: ['perc'],
            requirement: { label: 'Capo spedizione', anyOf: ['precision', 'clarity'] },
          },
        ],
        optional: [
          {
            id: `${K}-slot-member-1`,
            label: 'Spaccapietre',
            role: 'member',
            statFocus: ['str'],
            requirement: { label: 'Spaccapietre', anyOf: ['edge', 'fortitude'] },
          },
          {
            id: `${K}-slot-member-2`,
            label: 'Caposquadra',
            role: 'member',
            statFocus: ['int', 'con'],
            requirement: { label: 'Caposquadra', anyOf: ['clarity', 'warden', 'fortitude'] },
          },
          {
            id: `${K}-slot-bodyguard`,
            label: 'Guardia del corpo',
            role: 'bodyguard',
            statFocus: ['con', 'agi'],
            requirement: { label: 'Guardia del corpo', anyOf: ['warden', 'fortitude'] },
          },
        ],
      },
      referenceParty: [
        { id: `${K}-leader`, name: 'Odra', role: 'leader', hp: 70, stats: { str: 40, con: 55, agi: 50, perc: 70, int: 55, cha: 45 } },
        { id: `${K}-m1`, name: 'Bram', role: 'member', hp: 80, stats: { str: 70, con: 60, agi: 40, perc: 35, int: 30, cha: 30 } },
        { id: `${K}-m2`, name: 'Nella', role: 'member', hp: 60, stats: { str: 35, con: 55, agi: 55, perc: 60, int: 65, cha: 40 } },
        { id: `${K}-bg`, name: 'Corr', role: 'bodyguard', hp: 90, stats: { str: 60, con: 75, agi: 45, perc: 30, int: 25, cha: 25 } },
      ],
      dangerBandRef: 'media',
      rewardBase: 50,
    },
    nodes,
  });
}
