/**
 * Goblin Lab v0.3 — laboratorio d'integrazione Wanderlust (R-174, Inc B).
 *
 * Incrementi applicati:
 * - Inc 0+A: `pop` scalare → `ResidentState` reali (identita', stat, HP,
 *   traits, fatigue, stato). Occupazione/esclusivita' via TimeEngine REALE:
 *   canScheduleActivity/scheduleActivity → membri 'away' fino a completamento.
 *   Perdite = morti permanenti nominative; difesa = solo addestrati presenti.
 * - Inc B: board quest = sessione metaLayer REALE (PLAN-030): offerte con
 *   gate a 4 stati (locked/underprepared/ready/over-qualified), doppio
 *   timer (acceptance + completion), capacity = leader, resolve graduato
 *   (epic-fail/fail/almost/win/big-win) con harmProfile wound/death.
 *   Migranti = offerte `people` (D3: reclutamento come opportunita', non
 *   recovery automatico). Re = offerta `king-assault` su clock:king +
 *   milestone `ms-end-siege`. Harm → targeting posizionale canonico
 *   (testa-coda 20/80) con ferita → 'injured' + recovery sweep TimeEngine.
 *
 * Riuso diretto (nessuna regola duplicata):
 * - src/engine/metaLayer: sessione, offer board, commit, resolve, clocks.
 * - TimeEngine: stato villaggio, scheduling attivita', avanzamento tempo,
 *   fatigue, sweep injured→available.
 * - mulberry32 (metaLayer rng) come PRNG lato lab.
 *
 * Adattatori isolati (PROPOSTA-lab, NON canonici):
 * - 1 tick metaLayer = 1 tick TimeEngine = 1 giorno lab.
 * - PartyCapability: leaders = eroe schedulabile (1|0), stats = FOR/AST/CAR
 *   eroe, capabilities = unione traits dei residenti VIVI (trait perso con
 *   la morte del portatore), explorerQuality = AST/12.
 * - Reward table LAB_REWARDS (conversion rewards posticipate in PLAN-030 →
 *   la conversione risorse vive nell'adapter, non nell'engine).
 * - Harm posizionale → profilo canonico [1:100][2:20/80][≥3:0/20/80].
 * - Invasioni: ancora modello v0.2 (minaccia/difesa/trappole) — nel gioco
 *   reale la risoluzione difesa non esiste ancora → PROPOSTA-lab, Inc E.
 * - Recovery +3/invasione RIMOSSO: la crescita passa solo da offerte
 *   `people` (D3).
 * - access:recruitment = quality adapter (slack pop>0) scritta dal lab.
 * - Eroe escluso dal pool vittime invasioni (parita' v0.2, PROPOSTA-lab).
 * - Inc F (R-179): economia per-persona canonica. Produzione = job
 *   ActivityDefinition (config lab) schedulati via TimeEngine sui villager
 *   disponibili e risolti via JobResolver → rewards in `vil.resources`
 *   bridged su `S.res` in advanceDay. Consumo cibo = engine canonico
 *   (tutti i residenti vivi, eroe e feriti inclusi). Lavoro/difesa/quest
 *   competono per gli stessi residenti 'available'. Rimossi prodPer/
 *   produzione piatta e consumo manuale. GAP residuo: tier infortuni
 *   gia' bridge nel lab, settlement flat 5gg del canonico non consumato;
 *   invasione ancora modello PROPOSTA-lab.
 *
 * Uso:
 *   npx tsx tools/goblin-lab/lab.ts --seed 1000 --policy rush
 *   npx tsx tools/goblin-lab/lab.ts --test
 */

import {
  createInitialVillageState,
  scheduleActivity,
  canScheduleActivity,
  advanceTime,
  type ResidentState,
  type TimeEngineDeps,
  type VillageState,
} from '../../src/engine/game/idleVillage/TimeEngine';
import { applyConsequenceToResidentState } from '../../src/engine/game/idleVillage/residentConsequences';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '../../src/balancing/config/idleVillage/defaultConfig';
import type {
  ActivityDefinition,
  IdleVillageConfig,
} from '../../src/balancing/config/idleVillage/types';
import { mulberry32 } from '../../src/engine/metaLayer/rng';
import {
  createSession,
  offerQuests,
  selectQuest,
  advanceSessionTime,
  freeLeaders,
  milestoneViews,
  type MetaSession,
} from '../../src/engine/metaLayer/harness';
import {
  evaluateGateState,
  partyPower,
  outcomeWrites,
  applyQualityDelta,
  type AdvanceReport,
  type PartyCapability,
} from '../../src/engine/metaLayer/engine';
import { LAB_META_CONFIG, type LabRewardEntry } from './labContent';
import { resolveJob } from '../../src/engine/game/idleVillage/JobResolver';
import { resolveMissionRun } from '../../src/engine/game/idleVillage/missionResolver';
import type {
  MissionPhaseSpec,
  MissionPlannerInput,
} from '../../src/engine/game/idleVillage/missionPlannerMath';
import { DEFAULT_QUEST_SKILL_CHECK_CONFIG } from '../../src/balancing/config/idleVillage/quests/questSkillCheckConfig';
import { applyScenario, SCENARIOS, type ResolvedScenario } from './scenario';
import { resolveVariant, variantFailChance, type ResolverModel } from './resolvers';

export type LabCfg = typeof CFG;

/** Persona = policy dichiarata versionata (S1, pattern DRIVER_POLICIES).
 *  kind 'threshold': policy a soglie (rush/turtle). kind 'optimizer':
 *  policy EV — sceglie l'azione col massimo valore atteso calcolato sui
 *  dati della board (reward table, harmProfile, failChance scouted),
 *  non su soglie cablate. */
export interface Persona {
  id: string;
  version: number;
  kind: 'threshold' | 'optimizer';
  /** Soglia P(win) per tentare il Re quando la finestra e' aperta. */
  kingP: number;
  /** Soglia P(win) piu' bassa consentita in finestra di disperazione. */
  desperateP: number;
  /** Giorni alla prossima invasione che aprono la disperazione. */
  desperateDays: number;
  /** Tetto palizzate (cap policy, non meccanica). */
  palCap: number;
  /** Oro minimo per allenare una stat eroe. */
  trainGold: number;
  /** Soglia offer-score per accettare una quest qualsiasi. */
  questScoreMin: number;
  /** Inc E: non commettere quest non-Re che risolverebbero oltre la
   *  prossima invasione — il party sarebbe away durante l'assedio. */
  holdForSiege: boolean;
  /* ---- params optimizer (ignorati dalle threshold) ---- */
  /** Valore in oro-equivalente di 1 unita' risorsa (valutazione persona). */
  resValue?: Record<string, number>;
  /** Valore di un residente (usato per migranti, morte in quest). */
  memberValue?: number;
  /** Valore dell'eroe (morte = fine run). */
  heroValue?: number;
  /** Valore terminale di una campagna vinta. */
  victoryValue?: number;
  /** Costo-opportunita' di un giorno-persona occupato. */
  wagePerDay?: number;
  /** Margine difesa target (est >= th·margin). */
  defenseMargin?: number;
  /** Orizzonte giorni su cui ammortizzare un edificio. */
  horizonDays?: number;
  /** R-179: policy di lavoro — quanti villager mandare ai job ogni giorno.
   *  Dati di policy (non meccanica): foodCover = produzione cibo target
   *  come multiplo del consumo giornaliero; woodKeep/ironKeep = scorte
   *  sotto cui assegnare taglialegna/minatori. */
  work: { foodCover: number; woodKeep: number; ironKeep: number };
}

export const PERSONAS: Record<string, Persona> = {
  rush: { id: 'rush', version: 1, kind: 'threshold', kingP: 0.5, desperateP: 0.28, desperateDays: 45, palCap: 10, trainGold: 90, questScoreMin: 0,
    holdForSiege: true,
    work: { foodCover: 1.15, woodKeep: 30, ironKeep: 15 } },
  /** Difensiva: palizzate alte, Re solo in disperazione o a quota alta. */
  turtle: { id: 'turtle', version: 1, kind: 'threshold', kingP: 0.65, desperateP: 0.3, desperateDays: 70, palCap: 14, trainGold: 130, questScoreMin: 0.6,
    holdForSiege: true,
    work: { foodCover: 1.5, woodKeep: 60, ironKeep: 40 } },
  /** Optimizer: nessuna soglia fissa — ogni giorno calcola l'EV di ogni
   *  azione possibile (quest con reward/harm attesi, difesa piu' economica
   *  per punto, training stat solo se sposta un gate, edifici su orizzonte)
   *  e sceglie l'argmax. Serve a misurare se il sistema premia decisioni
   *  informate o solo politiche cablate. */
  optimizer: {
    id: 'optimizer', version: 1, kind: 'optimizer',
    kingP: 0, desperateP: 0, desperateDays: 0, palCap: 0, trainGold: 0, questScoreMin: 0,
    holdForSiege: true,
    resValue: { legna: 1, ferro: 1.5, cibo: 0.6, oro: 1 },
    memberValue: 25, heroValue: 300, victoryValue: 500,
    wagePerDay: 0.5, defenseMargin: 1.0, horizonDays: 300,
    work: { foodCover: 1.3, woodKeep: 45, ironKeep: 30 },
  },
};

/** Contatori del RunReport (S1). */
export interface LabMetrics {
  offersGenerated: Record<string, number>;
  offersCommitted: Record<string, number>;
  offersExpired: number;
  questOutcomes: Record<string, number>;
  wounds: number;
  /** S2: ferite per tier canonico (light/moderate/severe). */
  woundsByTier: Record<string, number>;
  deaths: number;
  heroDeaths: number;
  personDaysAlive: number;
  personDaysBusy: number;
  /** R-179: giorni-persona spesi in job di produzione (lavoro assegnato). */
  jobDays: number;
  questsAttempted: Record<string, number>;
  /** S3: eventi quest-resolved in cui la variante diverge dal canonico. */
  resolverDivergences: number;
  /** Inc E: esiti assedio per tier canonico missionResolver + esito macro. */
  siegeTiers: Record<string, number>;
  siegesRepelled: number;
  siegesBreached: number;
}

export function mkMetrics(): LabMetrics {
  return {
    offersGenerated: {}, offersCommitted: {}, offersExpired: 0,
    questOutcomes: {}, wounds: 0, woundsByTier: {}, deaths: 0, heroDeaths: 0,
    personDaysAlive: 0, personDaysBusy: 0, jobDays: 0, questsAttempted: {},
    resolverDivergences: 0, siegeTiers: {}, siegesRepelled: 0, siegesBreached: 0,
  };
}

/* ------------------------------------------------------------------ */
/* Config del laboratorio (valori di v0.2 + semantica roster reale)    */
/* ------------------------------------------------------------------ */

export const CFG = {
  startVillagers: 20, // 1 eroe + 20 villager (v0.2 pop=21)
  startRes: { legna: 30, ferro: 20, cibo: 60, oro: 25 },
  startStats: { FOR: 3, AST: 2, CAR: 2 },
  firstInvasion: 120, // invasioni ogni 120 giorni (v0.2)
  eatPer: 0.3,
  /* R-179: produzione = lavoro assegnato (CANON-meccanica: activity 'job'
   * + resolveJob al completamento, come useActivityScheduler). Solo i
   * villager assegnati producono: away/injured/dead non producono.
   * `res` e' l'id in vil.resources (il consumo canonico legge 'food');
   * `labRes` e' la chiave in S.res. Rate = reward a giornata lavorata
   * (OBSERVED-ADAPTER dati: il lab non ha per-worker rates storici). */
  jobs: [
    { id: 'lab-job-cibo', label: 'Raccolta', res: 'food', labRes: 'cibo', rate: 1.5 },
    { id: 'lab-job-legna', label: 'Taglialegna', res: 'legna', labRes: 'legna', rate: 1.0 },
    { id: 'lab-job-ferro', label: 'Miniera', res: 'ferro', labRes: 'ferro', rate: 0.6 },
  ] as { id: string; label: string; res: string; labRes: string; rate: number }[],
  buildings: [
    { id: 'falegnameria', label: 'Falegnameria', res: 'legna', gives: 0.7, cost: { legna: 25, ferro: 8, oro: 15 }, t: 8, max: 2 },
    { id: 'fucina', label: 'Fucina', res: 'ferro', gives: 0.6, cost: { legna: 20, ferro: 15, oro: 20 }, t: 8, max: 2 },
    { id: 'orto', label: 'Orto', res: 'cibo', gives: 0.8, cost: { legna: 15, ferro: 5, oro: 10 }, t: 6, max: 2 },
    { id: 'emporio', label: 'Emporio', res: 'oro', gives: 0.5, cost: { legna: 30, ferro: 15, oro: 40 }, t: 10, max: 1 },
    { id: 'baraccamento', label: 'Baraccamento', res: null, gives: 0, cost: { legna: 40, ferro: 20, oro: 30 }, t: 10, max: 1 },
  ] as { id: string; label: string; res: string | null; gives: number; cost: Record<string, number>; t: number; max: number }[],
  acts: [
    { id: 'trn', label: 'Addestra', cost: { oro: 12, cibo: 6 }, t: 3 },
    { id: 'pal', label: 'Palizzata', cost: { legna: 20, ferro: 10 }, t: 4 },
    { id: 'trap', label: 'Trappole', cost: { legna: 10, ferro: 6, oro: 8 }, t: 2 },
    { id: 'oil', label: 'Olio bollente', cost: { ferro: 6, oro: 10 }, t: 3 },
  ] as { id: string; label: string; cost: Record<string, number>; t: number }[],
  // Costi crescita come PARAMETRI dati (la formula resta meccanica sigillata):
  //   trnCost(n)  = trnCostBase · trnCostGrowthⁿ        (v0.2: 12·1.13^n)
  //   trainCost(lv) = trainCostBase + trainCostPerLv·lv (v0.2: 15+8·lv)
  trnCostBase: 12, trnCostGrowth: 1.13,
  trainCostBase: 15, trainCostPerLv: 8,
  popCap: 30,
  /* ---- S2: tier ferite CANONICI (defaultConfig.injuryTiers: light 1gg,
   * moderate 3gg, severe 7gg — questEligibility none/limited). La durata e'
   * dato canonico; la MAPPA outcome→tier e' OBSERVED-ADAPTER: il metaLayer
   * emette solo wound/death, non severita'. Regola lab: epicFail→severe,
   * fail→moderate, almost→light. Ri-ferita su gia' ferito = max(recovery). */
  injuryTiers: { light: 1, moderate: 3, severe: 7 } as Record<string, number>,
  woundTierByOutcome: {
    'epic-fail': 'severe', fail: 'moderate', almost: 'light',
    win: 'light', 'big-win': 'light',
  } as Record<string, string>,
  /* ---- Reward adapter (da labContent, era LAB_REWARDS): spostata in cfg
   * perche' e' superficie di bilanciamento (S1.5 — patchabile via cfg.*). */
  rewards: {
    'forage-hunt': { win: { res: { cibo: 14 } }, bigWin: { res: { cibo: 21 } } },
    'forage-wood': { win: { res: { legna: 16 } }, bigWin: { res: { legna: 24 } } },
    'delve-ruins': {
      win: { res: { ferro: 12, oro: 6 } },
      bigWin: { res: { ferro: 18, oro: 9 }, item: 'oil' },
    },
    'caravan-escort': {
      win: { res: { oro: 18 } },
      bigWin: { res: { oro: 27 }, item: 'CAR' },
    },
    'scout-tracks': { win: { res: { cibo: 4 } } },
    'migrants-arrival': {
      win: { migrants: 3 },
      bigWin: { migrants: 5 },
      almost: { migrants: 1 },
    },
    'mercenary-hero': { win: { migrants: 1, migrantTrait: 'stealth' } },
    'king-assault': { win: { victory: true }, bigWin: { victory: true } },
  } as Record<string, { win: LabRewardEntry; bigWin?: LabRewardEntry; almost?: LabRewardEntry }>,
  /** Dimensione party per offerta (villager oltre l'eroe). */
  partySize: {
    'forage-hunt': 1, 'forage-wood': 1, 'delve-ruins': 2, 'caravan-escort': 2,
    'scout-tracks': 1, 'migrants-arrival': 0, 'mercenary-hero': 0,
    'king-assault': 3,
  } as Record<string, number>,
  /* ---- Inc E: assedio come missione canonica (resolveMissionRun).
   * La MECCANICA e' canonica (check di fase weakest-tag, rischio
   * per-membro, morti che escono dalle fasi successive, tier finale);
   * questi sono i DATI adapter del lab (PROPOSTA-dati, tutti patchabili):
   * threat→difficulty, fortificazioni→mitigazione, gap→rischio. */
  siege: {
    /** Ondate dell'assalto = fasi della missione. */
    phases: 2,
    /** FOR adapter di un villager addestrato (l'eroe usa S.st.FOR reale). */
    trnFor: 4,
    /** threat (curva v0.2) → difficolta' D100: diff = diffBase + th*diffScale. */
    diffBase: 25, diffScale: 0.08,
    /** Fortificazioni riducono la difficolta' di ogni fase (canale respinta). */
    palPp: 1.5, trapPp: 3, oilPp: 3, oilMax: 3,
    /** Rischio base per-membro per fase (pp): anche una vittoria sanguina. */
    baseInj: 6, baseDeath: 2,
    /** Gap threat−difesa stimata (formula v0.2) → pp rischio extra a tutti
     *  i difensori via emptySlotPenalty canonico. */
    gapInjPer: 0.12, gapDeathPer: 0.04, gapInjCap: 40, gapDeathCap: 15,
    /** Breccia: vittime civili presenti e distruzione edifici. */
    victimBase: 1, victimPerFailPhase: 1, gapVictimPer: 40, bldPer: 50,
    /** Esito missione → tier ferita per i difensori colpiti. */
    woundTierByTier: {
      perfect: 'light', success: 'light', partial: 'moderate',
      fail: 'moderate', deadly: 'severe',
    } as Record<string, string>,
  },
};

/* ------------------------------------------------------------------ */
/* IdleVillageConfig lab: activity defs config-first per le durate usate */
/* ------------------------------------------------------------------ */

/** Definisce una lab-activity di durata N tick (activityId `lab-dN`). */
function labActivityDef(duration: number): ActivityDefinition {
  return {
    id: `lab-d${duration}`,
    label: `Lab work ${duration}d`,
    description: 'Goblin lab activity',
    tags: ['lab'],
    slotTags: ['lab'],
    resolutionEngineId: 'lab',
    durationFormula: `${duration}`,
  };
}

/** Tutte le durate usate dal lab (azioni, edifici, offerte). */
// Tutte le durate 1..60 pre-registrate: lo scenario puo' patchare le durate
// senza dover rigenerare le activity definitions.
const LAB_DURATIONS = new Set<number>(Array.from({ length: 60 }, (_, i) => i + 1));

/** Definisce una lab-activity `job` (R-179): reward unica a completamento,
 *  risolta da `resolveJob` — il percorso canonico usato da
 *  useActivityScheduler. NON continuousJob: il suo tick streaming legge
 *  `amountFormula` mentre `dailyRewardProfile` usa `amountPerDay` →
 *  produzione 0 (gap canonico documentato in FIDELITY.md). */
function labJobDef(job: LabCfg['jobs'][number]): ActivityDefinition {
  return {
    id: job.id,
    label: job.label,
    description: `Goblin lab job: ${job.label}`,
    tags: ['job', 'lab'],
    slotTags: ['lab'],
    resolutionEngineId: 'job',
    durationFormula: '1',
    rewards: [{ resourceId: job.res, amountFormula: String(job.rate) }],
  };
}

/** Config TimeEngine per-run (R-179): attivita' lab + job con rate dal
 *  cfg risolto (patchabili via `cfg.jobs.N.rate`), consumo cibo canonico
 *  per-residente. OBSERVED-ADAPTER unita': 1 tick lab = 1 giorno, ma il
 *  ciclo canonico giorno/notte e' 5+5 tick → il consumo engine-side e'
 *  rate/ticksPerDay solo nei tick "diurni" → rate = eatPer × 10 produce
 *  esattamente eatPer per residente vivo per giorno-lab in media di ciclo
 *  (mangiano anche eroe e feriti — semantica canonica `status !== 'dead'`). */
function buildLabConfig(cfg: LabCfg): IdleVillageConfig {
  return {
    ...DEFAULT_IDLE_VILLAGE_CONFIG,
    activities: {
      ...Object.fromEntries(
        [...LAB_DURATIONS].map((d) => [`lab-d${d}`, labActivityDef(d)]),
      ),
      ...Object.fromEntries(cfg.jobs.map((j) => [j.id, labJobDef(j)])),
    },
    globalRules: {
      ...DEFAULT_IDLE_VILLAGE_CONFIG.globalRules,
      foodConsumptionPerResidentPerDay: cfg.eatPer * 10,
    },
  };
}

const mkRng = (seed: number) => mulberry32(seed >>> 0);

/* ------------------------------------------------------------------ */
/* Stream splitting (S0 — WITNESS-01): ogni sottosistema del lab ha il  */
/* suo stream seeded: consumare draw in uno non sposta gli altri.      */
/* Child seed = seed XOR FNV-1a(label). Il metaLayer mantiene il suo    */
/* reseed-by-call-count interno (canonico, non toccato): qui si isola   */
/* solo il seed di ingresso della sessione.                            */
/* ------------------------------------------------------------------ */

/** FNV-1a 32-bit — hash stabile per derivare i seed figli per label. */
function hashLabel(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Seed figlio deterministico per sottosistema. */
const childSeed = (seed: number, subsystem: string) =>
  (seed ^ hashLabel(subsystem)) >>> 0;

type StreamName = 'roster' | 'vil' | 'world' | 'harm' | 'resolve';

function mkStreams(seed: number): Record<StreamName, () => number> {
  return {
    roster: mkRng(childSeed(seed, 'roster')), // tratti residenti/migranti
    vil: mkRng(childSeed(seed, 'vil')),       // TimeEngine (schedule/advance)
    world: mkRng(childSeed(seed, 'world')),   // invasioni: olio, vittime, edifici
    harm: mkRng(childSeed(seed, 'harm')),     // targeting posizionale harm
    resolve: mkRng(childSeed(seed, 'resolve')), // S3: re-roll dei resolver-variante
  };
}

const depsOf = (S: LabState): TimeEngineDeps => ({ config: S.vilConfig, rng: S.streams.vil });

/* ------------------------------------------------------------------ */
/* Roster                                                              */
/* ------------------------------------------------------------------ */

/** Tag capability del catalogo metaLayer assegnabili ai residenti. */
const MIGRANT_TRAIT_POOL = [
  'tracking', 'survival', 'diplomacy', 'stealth',
  'sabotage', 'lockpick', 'arcana', 'disguise',
];

export const TAG_TRAINED = 'trained';

function mkResident(id: string, name: string, hero: boolean, rng: () => number): ResidentState {
  const r: ResidentState = {
    id,
    displayName: name,
    status: 'available',
    fatigue: 0,
    // statSnapshot usa il combat StatBlock canonico; il lab non lo
    // consulta (le stat eroe vivono in S.st, i trait in traits[]).
    statSnapshot: {},
    traits: hero ? ['leader'] : [],
    currentHp: hero ? 30 : 15,
    maxHp: hero ? 30 : 15,
    isHero: hero,
    isInjured: false,
    survivalCount: 0,
    survivalScore: 0,
  };
  if (!hero && rng() < 0.3) {
    r.traits!.push(MIGRANT_TRAIT_POOL[Math.floor(rng() * MIGRANT_TRAIT_POOL.length)]);
  }
  return r;
}

export const residentsOf = (S: LabState) => Object.values(S.vil.residents);
export const aliveResidents = (S: LabState) => residentsOf(S).filter((r) => r.status !== 'dead');
export const aliveVillagers = (S: LabState) => aliveResidents(S).filter((r) => !r.isHero);
export const hero = (S: LabState) => residentsOf(S).find((r) => r.isHero)!;
export const pop = (S: LabState) => aliveVillagers(S).length;

/* ------------------------------------------------------------------ */
/* PartyCapability → metaLayer (adapter)                               */
/* ------------------------------------------------------------------ */

/**
 * Il party visto dal meta-layer (adapter, PROPOSTA-lab):
 * - leaders = 1 se l'eroe e' schedulabile (status 'available'), altrimenti 0
 *   — una sola quest alla volta, e solo se l'eroe non e' impegnato altrove;
 * - stats = statistiche eroe (for/ast/car);
 * - capabilities = unione dei trait dei residenti PRESENTI E ASSEGNABILI
 *   (status 'available'): chi e' away in missione/lavoro, ferito o morto non
 *   puo' prestare la sua capacita' a una spedizione che partirebbe ora
 *   (R-184 — disponibilita' reale, niente capability fantasma);
 * - explorerQuality = AST/12 (lo scout e' l'eroe).
 */
function partyOf(S: LabState): PartyCapability {
  const h = hero(S);
  const caps = new Set<string>();
  for (const r of residentsOf(S)) {
    if (r.status !== 'available') continue;
    for (const t of r.traits ?? []) {
      if (MIGRANT_TRAIT_POOL.includes(t)) caps.add(t);
    }
  }
  return {
    leaders: h.status === 'available' ? 1 : 0,
    stats: { for: S.st.FOR, ast: S.st.AST, car: S.st.CAR },
    capabilities: [...caps],
    explorerQuality: Math.min(1, S.st.AST / 12),
  };
}

function updateParty(S: LabState) {
  S.meta.party = partyOf(S);
}

/** quality adapter: spazio nel villaggio → offerte people possono apparire. */
function updateSlackQuality(S: LabState) {
  S.meta.state.world.qualities['access:recruitment'] = pop(S) < S.cfg.popCap ? 1 : 0;
}

/* ------------------------------------------------------------------ */
/* Stato del laboratorio                                               */
/* ------------------------------------------------------------------ */

export interface LabState {
  vil: VillageState;
  /** Config TimeEngine risolta dallo scenario (R-179: rate job + eatPer). */
  vilConfig: IdleVillageConfig;
  meta: MetaSession;
  seed: number;
  /** Stream RNG separati per sottosistema (S0 stream splitting). */
  streams: Record<StreamName, () => number>;
  /** Config lab risolta dallo scenario (S1). */
  cfg: LabCfg;
  /** Persona della run (S1, policy dichiarata versionata). */
  persona: Persona;
  /** Resolver dell'esperimento S3: A canonico / B continuo / C ibrido. */
  resolver: ResolverModel;
  scenarioId: string;
  configHash: string;
  /** Contatori metriche accumulati durante la run (RunReport S1). */
  metrics: LabMetrics;
  res: Record<'legna' | 'ferro' | 'cibo' | 'oro', number>;
  buildings: Record<string, { n: number }>;
  items: { oil: number };

  st: { FOR: number; AST: number; CAR: number };
  /** Quest in corso: istanza metaLayer → membri reali impegnati. */
  liveQuests: { instanceId: string; defId: string; resolvesAt: number; members: string[] }[];
  /** Contatore monotono per id migranti (R-184: identita' stabile, no collisioni). */
  migrantSeq: number;
  /** Istanze quest gia' risolte (R-184: un evento non applica due volte). */
  resolvedInstances: Set<string>;
  inv: number;
  trap: number;
  /** Palizzate costruite (contatore difesa v0.2, distinto dagli edifici). */
  pal: number;
  /** Giorno della prossima invasione (modello v0.2, PROPOSTA-lab). */
  nI: number;
  log: string[];
  hist: string[];
  qOk: number;
  qFail: number;
  win: number;
  end?: { kind: 'win' | 'lose'; day: number; why: string };
}

export function init(seed: number, resolved?: ResolvedScenario, persona?: Persona,
  resolver: ResolverModel = 'A'): LabState {
  const rs = resolved ?? applyScenario(SCENARIOS.base, LAB_META_CONFIG, CFG as unknown as Record<string, unknown>);
  const cfg = rs.cfg as unknown as LabCfg;
  const streams = mkStreams(seed);
  const vil = createInitialVillageState({});
  vil.residents['hero-1'] = mkResident('hero-1', 'Eroe', true, streams.roster);
  for (let i = 1; i <= cfg.startVillagers; i++) {
    vil.residents[`v-${i}`] = mkResident(`v-${i}`, `Villager ${i}`, false, streams.roster);
  }
  const S: LabState = {
    vil,
    vilConfig: buildLabConfig(cfg),
    meta: createSession(rs.meta, {
      leaders: 1, stats: { for: 3, ast: 2, car: 2 },
      capabilities: [], explorerQuality: 0,
    }, childSeed(seed, 'meta')),
    seed, streams,
    cfg, persona: persona ?? PERSONAS.rush, resolver,
    scenarioId: rs.scenarioId, configHash: rs.configHash,
    metrics: mkMetrics(),
    res: { ...(cfg.startRes as LabCfg['startRes']) },
    buildings: Object.fromEntries(cfg.buildings.map((b) => [b.id, { n: 0 }])),
    items: { oil: 0 }, st: { ...cfg.startStats },
    liveQuests: [], migrantSeq: 0, resolvedInstances: new Set(),
    inv: 0, trap: 0, pal: 0,
    nI: cfg.firstInvasion,
    log: [], hist: [], qOk: 0, qFail: 0, win: 0,
  };
  updateParty(S);
  updateSlackQuality(S);
  pushResources(S); // R-179: vil.resources allineato a S.res fin da g0
  return S;
}

export const day = (S: LabState) => S.vil.currentTime;
function slog(S: LabState, s: string) { S.log.push(`g${day(S)} ${s}`); }
export const has = (S: LabState, c: Record<string, number>) =>
  Object.entries(c).every(([k, v]) => S.res[k as keyof LabState['res']] >= v);
function pay(S: LabState, c: Record<string, number>): boolean {
  if (!has(S, c)) return false;
  Object.entries(c).forEach(([k, v]) => { S.res[k as keyof LabState['res']] -= v; });
  return true;
}
function refund(S: LabState, c: Record<string, number>) {
  Object.entries(c).forEach(([k, v]) => { S.res[k as keyof LabState['res']] += v; });
}
/** Costo addestramento villager (formula sigillata, parametri in cfg). */
export const trnCost = (S: LabState) =>
  Math.round(S.cfg.trnCostBase * Math.pow(S.cfg.trnCostGrowth, trnCount(S)));
/** Costo training stat eroe al livello lv (formula sigillata). */
export const trainCost = (S: LabState, lv: number) =>
  Math.round(S.cfg.trainCostBase + S.cfg.trainCostPerLv * lv);

/* ------------------------------------------------------------------ */
/* Disponibilita' (TimeEngine reale)                                   */
/* ------------------------------------------------------------------ */

/** La persona puo' essere assegnata? = regola canonica canScheduleActivity. */
export function canAssign(S: LabState, residentId: string): boolean {
  return canScheduleActivity(S.vil, {
    activityId: 'lab-d1' in S.vilConfig.activities ? 'lab-d1' : Object.keys(S.vilConfig.activities)[0],
    characterIds: [residentId],
    slotId: 'lab',
  });
}

/** Villager liberi (status 'available'), opz. filtrati per tag. */
export function freeVillagers(S: LabState, tag?: string): ResidentState[] {
  return residentsOf(S).filter((r) =>
    !r.isHero &&
    r.status === 'available' &&
    (!tag || (r.traits ?? []).includes(tag)));
}

/** Addestrati fisicamente presenti (canon: away/injured/exhausted → no). */
export function trainedPresent(S: LabState): ResidentState[] {
  return freeVillagers(S, TAG_TRAINED);
}

/** Numero di addestrati VIVI — il tag muore con la persona (morte = capacita' persa). */
export function trnCount(S: LabState): number {
  return aliveVillagers(S).filter((r) => (r.traits ?? []).includes(TAG_TRAINED)).length;
}

/* ------------------------------------------------------------------ */
/* Scheduling via TimeEngine reale                                     */
/* ------------------------------------------------------------------ */

function schedule(S: LabState, label: string, members: string[], duration: number, _tags: string[]): boolean {
  const r = scheduleActivity(depsOf(S), S.vil, {
    activityId: `lab-d${duration}`,
    characterIds: members,
    slotId: 'lab',
  });
  if (r.error || !r.scheduledActivity) {
    slog(S, `${label}: assegnazione rifiutata (${r.error ?? '?'})`);
    return false;
  }
  S.vil = r.state;
  return true;
}

/** Assegna un lavoro di villaggio a un villager libero. */
function doVillageJob(S: LabState, label: string, duration: number): boolean {
  const v = freeVillagers(S)[0];
  if (!v) { slog(S, `${label}: nessun villager libero`); return false; }
  return schedule(S, label, [v.id], duration, []);
}

/* ---- R-179: lavoro produttivo via job canonici ----------------------- */

/** Assegna un residente a un job di produzione (activity 'job', durata 1).
 *  Reward applicata da `resolveJob` al completamento in advanceDay —
 *  la stessa orchestrazione di useActivityScheduler. */
export function scheduleJob(S: LabState, jobId: string, residentId: string): boolean {
  const r = scheduleActivity(depsOf(S), S.vil, {
    activityId: jobId,
    characterIds: [residentId],
    slotId: 'lab',
  });
  if (r.error || !r.scheduledActivity) return false;
  S.vil = r.state;
  S.metrics.jobDays += 1;
  return true;
}

/** Assegna fino a `n` villager a un job. Preferenza ai NON addestrati (i
 *  trained sono la milizia: away → non contano in trainedPresent), poi ai
 *  meno affaticati — rotazione naturale che evita l'esaurimento
 *  (la rotazione resta utile anche dopo il fix R-190: 'exhausted' ora
 *  recupera a riposo notturno sotto il cap, ma evitare di raggiungerlo
 *  mantiene i villager produttivi). Se i non
 *  addestrati non bastano per il cibo (sopravvivenza), usa anche trained. */
export function assignWorkers(S: LabState, jobId: string, n: number, allowTrained = false): number {
  const byFatigue = (a: ResidentState, b: ResidentState) => a.fatigue - b.fatigue;
  const untrained = freeVillagers(S).filter((r) => !(r.traits ?? []).includes(TAG_TRAINED)).sort(byFatigue);
  const trained = allowTrained ? freeVillagers(S, TAG_TRAINED).sort(byFatigue) : [];
  let assigned = 0;
  for (const v of [...untrained, ...trained]) {
    if (assigned >= n) break;
    if (scheduleJob(S, jobId, v.id)) assigned += 1;
  }
  return assigned;
}

/** Allocazione lavoro giornaliera della persona (R-179): cibo prima
 *  (sopravvivenza — permette fallback sui trained), poi scorte legna/ferro
 *  sotto soglia. I lavoratori sono 'away' per il giorno: non possono
 *  questare, allenarsi o difendere — il trade-off lavoro/difesa e' reale. */
function assignWorkforce(S: LabState): void {
  const wp = S.persona.work;
  const dailyNeed = aliveResidents(S).length * S.cfg.eatPer;
  const foodJob = S.cfg.jobs.find((j) => j.labRes === 'cibo')!;
  const foodWorkers = Math.ceil((dailyNeed * wp.foodCover) / foodJob.rate);
  const got = assignWorkers(S, foodJob.id, foodWorkers);
  if (got < foodWorkers) {
    // crisi cibo: attingi anche ai trained (meglio fame che difesa)
    assignWorkers(S, foodJob.id, foodWorkers - got, true);
  }
  const woodJob = S.cfg.jobs.find((j) => j.labRes === 'legna');
  if (woodJob && S.res.legna < wp.woodKeep) assignWorkers(S, woodJob.id, 2);
  const ironJob = S.cfg.jobs.find((j) => j.labRes === 'ferro');
  if (ironJob && S.res.ferro < wp.ironKeep) assignWorkers(S, ironJob.id, 1);
}

export function act(S: LabState, id: string): boolean {
  const def = S.cfg.acts.find((a) => a.id === id);
  if (!def) return false;
  switch (id) {
    case 'trn': {
      const pool = freeVillagers(S).filter((v) => !(v.traits ?? []).includes(TAG_TRAINED));
      const cap = Math.min(pop(S) - 2, pool.length);
      if (cap <= 0) { slog(S, 'Addestra fallita: nessun villager addestrabile'); return false; }
      const c = { oro: trnCost(S), cibo: 6 };
      if (!pay(S, c)) return false;
      const n = Math.min(3, cap);
      const recruits = pool.slice(0, n);
      if (!schedule(S, 'Addestra', recruits.map((r) => r.id), def.t, [TAG_TRAINED])) {
        refund(S, c);
        return false;
      }
      recruits.forEach((r) => { (S.vil.residents[r.id].traits ??= []).push(TAG_TRAINED); });
      slog(S, `Addestramento avviato (+${n} → trn ${trnCount(S)})`);
      S.hist.push(`g${day(S)} trn`);
      return true;
    }
    case 'pal': {
      if (pop(S) < 12) { slog(S, 'Palizzata: troppi pochi abitanti'); return false; }
      if (!pay(S, def.cost)) return false;
      if (!doVillageJob(S, 'Palizzata', def.t)) { refund(S, def.cost); return false; }
      S.pal++;
      S.hist.push(`g${day(S)} pal`); return true;
    }
    case 'trap': {
      if (!pay(S, def.cost)) return false;
      if (!doVillageJob(S, 'Trappole', def.t)) { refund(S, def.cost); return false; }
      S.trap++;
      S.hist.push(`g${day(S)} trap`); return true;
    }
    case 'oil': {
      if (!pay(S, def.cost)) return false;
      if (!doVillageJob(S, 'Olio bollente', def.t)) { refund(S, def.cost); return false; }
      S.items.oil++;
      S.hist.push(`g${day(S)} oil`); return true;
    }
  }
  return false;
}

/** Compra un edificio (occupa 1 villager per la costruzione). */
export function build(S: LabState, id: string): boolean {
  const b = S.cfg.buildings.find((x) => x.id === id);
  if (!b || S.buildings[id].n >= b.max || !pay(S, b.cost)) return false;
  if (!doVillageJob(S, `Costruisci ${b.label}`, b.t)) { refund(S, b.cost); return false; }
  S.buildings[id].n++;
  slog(S, `Costruita ${b.label}`);
  S.hist.push(`g${day(S)} ${id}`);
  return true;
}

/** Training stat eroe: occupa L'EROE per 4 giorni (esclusivita' reale). */
export function train(S: LabState, key: 'FOR' | 'AST' | 'CAR'): boolean {
  const lv = S.st[key];
  const c = { oro: trainCost(S, lv), cibo: 8 };
  if (!pay(S, c)) return false;
  if (!schedule(S, `Allenamento ${key}`, [hero(S).id], 4, [`stat:${key}`])) {
    refund(S, c);
    return false;
  }
  S.st[key]++;
  slog(S, `Training ${key} → ${S.st[key]}`);
  S.hist.push(`g${day(S)} tr${key}`);
  return true;
}

/* ------------------------------------------------------------------ */
/* Quest = offerte metaLayer + party reale (Inc B)                      */
/* ------------------------------------------------------------------ */

/** Sceglie i villager per il party: trained preferiti, poi gli altri —
 *  la coda del party e' quella esposta al danno (targeting posizionale). */
function pickCrew(S: LabState, need: number): ResidentState[] {
  const trained = freeVillagers(S, TAG_TRAINED);
  const untrained = freeVillagers(S).filter((r) => !(r.traits ?? []).includes(TAG_TRAINED));
  return [...trained, ...untrained].slice(0, need);
}

/**
 * Committa un'offerta live: gate non-locked, eroe schedulabile, crew
 * completa → commitOffer (consuma il leader) + scheduleActivity (membri
 * away per la durata reale). L'eroe e' sempre membro (slot 0 = testa).
 */
export function commitOfferToLab(S: LabState, instanceId: string): { ok: boolean; err?: string } {
  updateParty(S);
  const view = offerQuests(S.meta).find((v) => v.instanceId === instanceId);
  if (!view) return { ok: false, err: 'offerta non sulla board' };
  const def = view.def;
  if (view.gate.state === 'locked') {
    return { ok: false, err: `gate locked (serve ${view.gate.unlockRoute?.key ?? 'requisiti'})` };
  }
  const h = hero(S);
  if (h.status !== 'available') return { ok: false, err: 'eroe impegnato' };
  if (freeLeaders(S.meta) <= 0) return { ok: false, err: 'nessun leader libero' };
  const need = S.cfg.partySize[def.id] ?? 1;
  const crew = [h, ...pickCrew(S, need)];
  if (crew.length < need + 1) {
    return { ok: false, err: `party incompleto (${crew.length}/${need + 1})` };
  }
  const r = selectQuest(S.meta, instanceId);
  if (!r.ok) return { ok: false, err: r.reason };
  if (!schedule(S, def.id, crew.map((c) => c.id), def.durationTicks, [`quest:${instanceId}`])) {
    // non dovrebbe accadere (crew verificata): se accade e' un bug di adapter
    throw new Error(`schedule-failed-post-commit ${instanceId}`);
  }
  S.liveQuests.push({
    instanceId, defId: def.id,
    resolvesAt: r.quest.resolvesAt,
    members: crew.map((c) => c.id),
  });
  S.metrics.offersCommitted[def.id] = (S.metrics.offersCommitted[def.id] ?? 0) + 1;
  S.metrics.questsAttempted[def.id] = (S.metrics.questsAttempted[def.id] ?? 0) + 1;
  S.hist.push(`g${day(S)} go:${def.id}`);
  slog(S, `Quest accettata: ${def.id} [gate ${view.gate.state}, party ${crew.length}, risolve g${r.quest.resolvesAt}]`);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Harm → persone (targeting posizionale canonico 20/80 coda)           */
/* ------------------------------------------------------------------ */

/**
 * Profilo posizionale canonico (questRun): la coda del party assorbe il
 * rischio — 1 membro: 100%; 2: 20/80; ≥3: …0/20/80 sulla coda.
 */
function positionalIndex(n: number, rng: () => number): number {
  if (n <= 1) return 0;
  const w = n === 2 ? [0.2, 0.8]
    : Array.from({ length: n }, (_, i) => (i === n - 1 ? 0.8 : i === n - 2 ? 0.2 : 0));
  const roll = rng();
  let acc = 0;
  for (let i = 0; i < w.length; i++) {
    acc += w[i];
    if (roll < acc) return i;
  }
  return w.length - 1;
}

/** Defaults del kernel condiviso (R-186): la durata ferita e' sempre
 *  passata per-effetto via durationTicks (tier S2); il fallback usa il
 *  tier light — mai raggiunto perche' ogni caller lab passa days. */
const labConsequenceDefaults = (S: LabState) => ({ woundTicks: S.cfg.injuryTiers.light });

/** Applica harm a un membro del crew. S2: la ferita ha TIER canonico
 *  (light 1gg / moderate 3gg / severe 7gg, da cfg.injuryTiers — stessi
 *  valori di globalRules.injuryTiers); outcome→tier e' OBSERVED-ADAPTER
 *  (il metaLayer emette wound/death, non severita'). R-186: la mutazione
 *  di ResidentState delega al kernel condiviso `applyConsequenceToResidentState`
 *  (morte terminale pulisce i campi ferita; ri-ferita = max dei recovery,
 *  stessa semantica di questSettlement/MinimalResident). */
function applyHarm(S: LabState, members: string[], harm: 'wound' | 'death',
  outcome?: string): void {
  const idx = positionalIndex(members.length, S.streams.harm);
  const target = S.vil.residents[members[idx]];
  if (!target || target.status === 'dead') return;
  if (harm === 'death') {
    S.metrics.deaths++;
    if (target.isHero) S.metrics.heroDeaths++;
    S.vil.residents[target.id] = applyConsequenceToResidentState(
      target, { kind: 'death' }, day(S), labConsequenceDefaults(S));
    slog(S, `☠ ${target.displayName} e' morto in missione`);
    // Regola lab: l'eroe e' l'unico leader — la sua morte chiude la run
    // (in v0.2 l'eroe era immortale; ora e' mortale e leader-capacity=1).
    if (target.isHero) {
      S.end = { kind: 'lose', day: day(S), why: 'eroe caduto in missione' };
      slog(S, 'L\'eroe e\' caduto: nessuno puo\' piu\' guidare le missioni');
    }
    return;
  }
  const tier = S.cfg.woundTierByOutcome[outcome ?? 'fail'] ?? 'light';
  const days = S.cfg.injuryTiers[tier] ?? S.cfg.injuryTiers.light;
  S.metrics.wounds++;
  S.metrics.woundsByTier[tier] = (S.metrics.woundsByTier[tier] ?? 0) + 1;
  const next = applyConsequenceToResidentState(
    target, { kind: 'wound', durationTicks: days }, day(S), labConsequenceDefaults(S));
  S.vil.residents[target.id] = next;
  slog(S, `⚕ ${target.displayName} ferito [${tier}] (recupero g${next.injuryRecoveryTime})`);
}

/* ------------------------------------------------------------------ */
/* Risoluzione quest: eventi metaLayer → effetti villaggio              */
/* ------------------------------------------------------------------ */

function applyReward(S: LabState, defId: string, outcome: string): void {
  const table = S.cfg.rewards[defId];
  if (!table) return;
  const e = outcome === 'big-win' ? (table.bigWin ?? table.win)
    : outcome === 'almost' ? table.almost
    : outcome === 'win' ? table.win
    : undefined;
  if (!e) return;
  if (e.res) {
    Object.entries(e.res).forEach(([k, v]) => {
      S.res[k as keyof LabState['res']] += v ?? 0;
    });
    slog(S, `Ricompensa ${defId}: ${Object.entries(e.res).map(([k, v]) => `${k}+${v}`).join(' ')}`);
  }
  if (e.item === 'oil') { S.items.oil++; slog(S, 'Trovato olio bollente (+1)'); }
  else if (e.item === 'FOR' || e.item === 'AST' || e.item === 'CAR') { S.st[e.item]++; }
  else if (e.item === 'trn') {
    const t = freeVillagers(S).filter((v) => !(v.traits ?? []).includes(TAG_TRAINED)).slice(0, 2);
    t.forEach((r) => { (r.traits ??= []).push(TAG_TRAINED); });
  }
  if (e.migrants) {
    let n = 0;
    // R-184: id da contatore monotono — due arrivi lo stesso giorno (o da
    // offerte diverse) non possono collidere e sovrascrivere un residente.
    for (let i = 0; i < e.migrants && pop(S) < S.cfg.popCap; i++) {
      const id = `m-${S.migrantSeq++}`;
      const r = mkResident(id, `Migrante ${id}`, false, S.streams.roster);
      if (e.migrantTrait) r.traits = [e.migrantTrait];
      S.vil.residents[id] = r;
      n++;
    }
    slog(S, `+${n} migranti arrivano (pop ${pop(S)})`);
  }
  if (e.victory) {
    S.win = 1;
    S.end = { kind: 'win', day: day(S), why: 'Re dei Goblin sconfitto' };
    slog(S, '★ IL RE DEI GOBLIN E\' CADUTO — ASSEDIO SPEZZATO');
  }
}

/** Smista gli eventi del report metaLayer nel mondo del villaggio. */
function applyMetaEvents(S: LabState, rep: AdvanceReport): void {
  for (const ev of rep.events) {
    switch (ev.kind) {
      case 'offer-generated': {
        S.metrics.offersGenerated[ev.defId] = (S.metrics.offersGenerated[ev.defId] ?? 0) + 1;
        const short = ev.defId === 'king-assault' ? ' ★ RE AVVISTATO' : '';
        slog(S, `Offerta: ${ev.defId}${short}`);
        break;
      }
      case 'offer-expired':
        S.metrics.offersExpired++;
        slog(S, `Offerta scaduta: ${ev.defId}`);
        if (ev.defId === 'king-assault') {
          slog(S, 'L\'occasione di colpire il Re e\' passata');
        }
        break;
      case 'clock-tick':
        if (ev.key === 'clock:king') {
          slog(S, 'Corpi goblin avvistati: il Re si avvicina');
        }
        break;
      case 'quest-resolved': {
        // Match per instanceId (R-184): due quest omonime non si scambiano
        // i membri; un evento gia' consumato non riapplica le conseguenze.
        if (S.resolvedInstances.has(ev.instanceId)) {
          slog(S, `⚠ quest-resolved duplicato ignorato (${ev.instanceId})`);
          break;
        }
        S.resolvedInstances.add(ev.instanceId);
        const lq = S.liveQuests.findIndex((q) => q.instanceId === ev.instanceId);
        if (lq < 0) {
          slog(S, `⚠ quest-resolved senza liveQuest (${ev.defId}/${ev.instanceId}): harm non applicato`);
        }
        const members = lq >= 0 ? S.liveQuests[lq].members : [];
        if (lq >= 0) S.liveQuests.splice(lq, 1);
        let outcome = ev.outcome;
        let harm = ev.harm;
        // S3: resolver-variante. La sessione canonica ha gia' risolto (draw
        // consumati, writes applicate). Per B/C il lab ri-risolve sullo
        // stream 'resolve', annulla le writes canoniche e applica quelle
        // della variante. OBSERVED-ADAPTER: il canonico non e' toccato; le
        // divergenze sono contate come metrica dell'esperimento.
        if (S.resolver !== 'A') {
          const def = S.meta.cfg.offers.find((o) => o.id === ev.defId);
          if (def) {
            const gate = evaluateGateState(def, S.meta.party, S.meta.state.world, S.meta.cfg.tuning);
            const power = partyPower(S.meta.party, S.meta.cfg.tuning);
            const v = resolveVariant(def, gate, S.meta.cfg.tuning, power, S.resolver, S.streams.resolve);
            if (v.outcome !== outcome) {
              S.metrics.resolverDivergences++;
              for (const w of ev.writes ?? []) {
                applyQualityDelta(S.meta.state.world, { key: w.key, delta: -w.delta });
              }
              for (const w of outcomeWrites(def, v.outcome)) {
                applyQualityDelta(S.meta.state.world, w);
              }
            } else if (v.harm !== harm) {
              S.metrics.resolverDivergences++;
            }
            outcome = v.outcome;
            harm = v.harm;
          }
        }
        const ok = outcome === 'win' || outcome === 'big-win' || outcome === 'almost';
        S.metrics.questOutcomes[outcome] = (S.metrics.questOutcomes[outcome] ?? 0) + 1;
        if (ok) S.qOk++; else S.qFail++;
        slog(S, `Quest ${ev.defId} → ${outcome}${harm !== 'none' ? ` (harm: ${harm})` : ''}${S.resolver !== 'A' && outcome !== ev.outcome ? ` [${S.resolver}: canon=${ev.outcome}]` : ''}`);
        applyReward(S, ev.defId, outcome);
        if (harm === 'wound' || harm === 'death') {
          applyHarm(S, members, harm, outcome);
        }
        break;
      }
      case 'quest-deadline-fail': {
        S.qFail++;
        // R-184: la liveQuest fallita va rimossa — un'entry zombie ruberebbe
        // l'harm della prossima risoluzione omonima ai suoi membri reali.
        const lq = S.liveQuests.findIndex((q) => q.instanceId === ev.instanceId);
        if (lq >= 0) S.liveQuests.splice(lq, 1);
        slog(S, `Quest ${ev.defId} fallita per deadline`);
        break;
      }
      case 'offer-window-closed':
        break;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Invasioni (Inc E — missione canonica per-membro via missionResolver) */
/* ------------------------------------------------------------------ */

/** Applica l'esito per-membro di un assedio a un ResidentState reale.
 *  Morte permanente; ferita con tier da `siege.woundTierByTier` (mappa
 *  OBSERVED-ADAPTER: il tier missione non esporta severita' ferita).
 *  R-186: mutazione via kernel condiviso `applyConsequenceToResidentState`. */
function applySiegeOutcome(S: LabState, residentId: string,
  state: 'alive' | 'injured' | 'dead', woundTier: string): void {
  const r = S.vil.residents[residentId];
  if (!r || r.status === 'dead') return;
  if (state === 'dead') {
    S.metrics.deaths++;
    if (r.isHero) S.metrics.heroDeaths++;
    S.vil.residents[residentId] = applyConsequenceToResidentState(
      r, { kind: 'death' }, day(S), labConsequenceDefaults(S));
    slog(S, `☠ ${r.displayName} e' morto difendendo il villaggio`);
    if (r.isHero && !S.end) {
      S.end = { kind: 'lose', day: day(S), why: 'eroe caduto in difesa' };
      slog(S, 'L\'eroe e\' caduto in difesa: nessuno puo\' piu\' guidare le missioni');
    }
    return;
  }
  if (state === 'injured') {
    const days = S.cfg.injuryTiers[woundTier] ?? S.cfg.injuryTiers.light;
    S.metrics.wounds++;
    S.metrics.woundsByTier[woundTier] = (S.metrics.woundsByTier[woundTier] ?? 0) + 1;
    const next = applyConsequenceToResidentState(
      r, { kind: 'wound', durationTicks: days }, day(S), labConsequenceDefaults(S));
    S.vil.residents[residentId] = next;
    slog(S, `⚕ ${r.displayName} ferito in difesa [${woundTier}] (recupero g${next.injuryRecoveryTime})`);
  }
}

/**
 * Invasione come missione canonica (Inc E): i difensori sono i residenti
 * DAVVERO disponibili (eroe se `available` + milizia `trainedPresent` —
 * away/injured/lavoratori non difendono). `resolveMissionRun` risolve le
 * fasi con il modello MP-06: check weakest-tag sul FOR del gruppo
 * (difensori morti escono dalle fasi successive), rischio wound/death
 * per-membro per fase, tier finale da classifyTier.
 * Adattatori dichiarati (dati in cfg.siege): threat→difficolta',
 * fortificazioni→sconto difficolta'/bonus gap, gap→emptySlotPenalty,
 * tier→severita' ferita, breccia→vittime civili presenti + edifici.
 */
/** Stima della PROSSIMA invasione per la UI (curva threat v0.2 + difesa
 *  stimata senza RNG — l'olio usa il valor medio 12.5/unita').
 *  Single-source con `invade`: la formula threat e' la stessa
 *  (in `invade` il contatore S.inv e' gia' stato incrementato). */
export function nextInvasionEst(S: LabState): { threat: number; defenseEst: number } {
  const sz = S.cfg.siege;
  const th = Math.round(70 * Math.pow(1.2, S.inv) * (1 + 0.08 * S.inv ** 2));
  const present = trainedPresent(S).length;
  const oilN = Math.min(S.items.oil, sz.oilMax);
  const est = trnCount(S) * 2 + present * 4 + S.pal * 14 + S.trap * 30 + oilN * 12.5;
  return { threat: th, defenseEst: est };
}

function invade(S: LabState): void {
  const th = nextInvasionEst(S).threat; // threat della ondata S.inv+1 (pre-incremento)
  S.inv++;
  const sz = S.cfg.siege;

  // Difensori reali: l'eroe solo se presente e schedulabile, la milizia
  // solo se addestrata E disponibile oggi (non away/injured/in missione).
  const defenders: ResidentState[] = [];
  const h = hero(S);
  if (h.status === 'available') defenders.push(h);
  for (const v of trainedPresent(S)) defenders.push(v);

  // Scalare difesa v0.2 (PROPOSTA-dati): guida il gap→rischio, non decide
  // piu' direttamente respinta/breccia — quello lo fa il check di fase.
  const present = trainedPresent(S).length;
  const oilN = Math.min(S.items.oil, sz.oilMax);
  const oilBonus = Array.from({ length: oilN }, () => S.streams.world()).reduce((a, r) => a + 25 * r, 0);
  const estV2 = trnCount(S) * 2 + present * 4 + S.pal * 14 + S.trap * 30 + oilBonus;
  const gap = Math.max(0, th - estV2);
  const fortPp = S.pal * sz.palPp + S.trap * sz.trapPp + oilN * sz.oilPp;
  const diff = Math.min(95, Math.max(10, sz.diffBase + th * sz.diffScale - fortPp));

  slog(S, `INVASIONE ${S.inv}: difensori ${defenders.length} (eroe ${h.status === 'available' ? 'si' : h.status}) threat ${th} diff ${Math.round(diff)} est ${Math.round(estV2)} gap ${Math.round(gap)}`);

  const phases: MissionPhaseSpec[] = Array.from({ length: sz.phases }, (_, i) => ({
    phaseId: `siege-w${i + 1}`,
    difficulty: diff,
    checkStatTags: ['for'],
    baseInjuryChance: sz.baseInj,
    baseDeathChance: sz.baseDeath,
    durationUnits: 1,
  }));
  const input: MissionPlannerInput = {
    members: defenders.map((r, i) => ({
      residentId: r.id,
      slotIndex: i,
      stats: { for: r.isHero ? S.st.FOR : sz.trnFor },
    })),
    phases,
    partyStatMult: 4,
    durationMin: 1,
    emptySlotPenalty: {
      injuryChanceDelta: Math.min(sz.gapInjCap, gap * sz.gapInjPer),
      deathChanceDelta: Math.min(sz.gapDeathCap, gap * sz.gapDeathPer),
    },
  };
  const run = resolveMissionRun(input, DEFAULT_QUEST_SKILL_CHECK_CONFIG, S.streams.world);
  S.metrics.siegeTiers[run.tier] = (S.metrics.siegeTiers[run.tier] ?? 0) + 1;

  // Esiti membri: morti/ferite reali e persistenti (ResidentState).
  const woundTier = sz.woundTierByTier[run.tier] ?? 'light';
  for (const [rid, st] of Object.entries(run.memberOutcomes)) {
    applySiegeOutcome(S, rid, st, woundTier);
  }
  S.items.oil = 0;
  S.trap = 0;

  const repelled = run.tier === 'perfect' || run.tier === 'success';
  if (repelled) {
    S.metrics.siegesRepelled++;
    slog(S, `Respinta [${run.tier}] — fasi ${run.passedPhases}/${run.playedPhases}`);
    return;
  }
  S.metrics.siegesBreached++;
  const failedPhases = run.playedPhases - run.passedPhases;
  slog(S, `BRECCIA [${run.tier}${run.wiped ? ' wipe' : ''}] — fasi ${run.passedPhases}/${run.playedPhases}`);

  // Vittime civili: solo villager PRESENTI e non in prima linea — i
  // difensori hanno gia' pagato via memberOutcomes, gli away sono
  // fisicamente fuori dal villaggio (missione/lavoro fuori porta).
  const defenderIds = new Set(defenders.map((d) => d.id));
  const civPool = aliveVillagers(S).filter(
    (v) => !defenderIds.has(v.id) && v.status !== 'away');
  const loss = Math.min(civPool.length,
    sz.victimBase + failedPhases * sz.victimPerFailPhase + Math.floor(gap / sz.gapVictimPer));
  const victims = [...civPool]
    .sort(() => S.streams.world() - 0.5)
    .slice(0, loss);
  for (const v of victims) {
    S.metrics.deaths++;
    S.vil.residents[v.id] = applyConsequenceToResidentState(
      v, { kind: 'death' }, day(S), labConsequenceDefaults(S));
  }
  if (victims.length) {
    slog(S, `Vittime civili: -${victims.length} (${victims.map((v) => v.displayName).join(', ')})`);
  }

  // Danni strutturali proporzionali al gap (v0.2: pal prima, poi edifici).
  const bLost = Math.floor(gap / sz.bldPer);
  for (let i = 0; i < bLost; i++) {
    if (S.pal > 0) { S.pal--; slog(S, 'Palizzata crollata'); continue; }
    const ids = S.cfg.buildings.filter((b) => S.buildings[b.id].n > 0).map((b) => b.id);
    if (!ids.length) break;
    const pick = ids[Math.floor(S.streams.world() * ids.length)];
    S.buildings[pick].n--;
    slog(S, `Edificio crollato: ${pick}`);
  }
  const remaining = Object.values(S.buildings).reduce((a, b) => a + b.n, 0) + S.pal;
  if (remaining <= 0) {
    S.end = { kind: 'lose', day: day(S), why: `collasso strutturale (invasione ${S.inv})` };
    slog(S, 'VILLAGGIO CROLLATO: tutti gli edifici distrutti');
  }
}

/* ------------------------------------------------------------------ */
/* Avanzamento giornaliero                                             */
/* ------------------------------------------------------------------ */

/** R-179 bridge risorse S.res ↔ vil.resources (OBSERVED-ADAPTER): il
 *  consumo canonico legge la chiave 'food', il lab usa 'cibo'. */
const pushResources = (S: LabState) => {
  S.vil = {
    ...S.vil,
    resources: {
      legna: S.res.legna, ferro: S.res.ferro, oro: S.res.oro, food: S.res.cibo,
    },
  };
};
const pullResources = (S: LabState) => {
  const r = S.vil.resources;
  S.res = {
    legna: r.legna ?? 0, ferro: r.ferro ?? 0, oro: r.oro ?? 0, cibo: r.food ?? 0,
  };
};

export function advanceDay(S: LabState): void {
  /* R-179: bridge risorse — il TimeEngine consuma `resources.food` per
   * residente vivo nei tick diurni (canonico: mangiano eroe e feriti) e i
   * job completati pagano via resolveJob in vil.resources. */
  pushResources(S);
  // Tempo villaggio reale: completamenti, fatigue, sweep injured→available.
  const adv = advanceTime(depsOf(S), S.vil, 1);
  S.vil = adv.state;
  // Orchestrazione canonica (useActivityScheduler.resolveCompletedActivities):
  // per ogni activity completata con tag 'job' → resolveJob applica la reward.
  for (const actId of adv.completedActivityIds ?? []) {
    const scheduled = S.vil.activities[actId];
    const def = scheduled && S.vilConfig.activities[scheduled.activityId];
    if (!def?.tags?.includes('job')) continue;
    const jr = resolveJob(depsOf(S), S.vil, scheduled);
    S.vil = { ...S.vil, resources: jr.updatedResources };
  }
  pullResources(S);
  const rs = aliveResidents(S);
  S.metrics.personDaysAlive += rs.length;
  S.metrics.personDaysBusy += rs.filter((r) => r.status === 'away' || r.status === 'injured').length;
  // Fame (regola di fine-run lab, PROPOSTA — il canonico non uccide di fame,
  // SurvivalEngine ha starvationDeathChancePerDay ma non e' collegato qui).
  if (S.res.cibo <= 0) {
    S.res.cibo = 0;
    S.end = { kind: 'lose', day: day(S), why: 'fame' };
    slog(S, 'CIBO FINITO: il villaggio muore di fame');
    return;
  }
  // Edifici: bonus infrastruttura flat (PROPOSTA-dati, non richiedono lavoro).
  S.res.legna += S.cfg.buildings[0].gives * S.buildings.falegnameria.n;
  S.res.ferro += S.cfg.buildings[1].gives * S.buildings.fucina.n;
  S.res.cibo += S.cfg.buildings[2].gives * S.buildings.orto.n;
  S.res.oro += S.cfg.buildings[3].gives * S.buildings.emporio.n;
  // Layer opportunita' reale: clock, scadenze offerte, resolve quest.
  updateParty(S);
  updateSlackQuality(S);
  const rep = advanceSessionTime(S.meta, 1);
  applyMetaEvents(S, rep);
  // Invasione (modello v0.2)
  if (S.vil.currentTime === S.nI) {
    invade(S);
    S.nI = S.vil.currentTime + 120;
  }
  if (pop(S) < 1 && !S.end) {
    S.end = { kind: 'lose', day: day(S), why: 'villager estinti (solo l\'eroe resta)' };
    slog(S, 'Gli ultimi villager sono morti: resta solo l\'eroe');
  }
  updateSlackQuality(S);
}

/* ------------------------------------------------------------------ */
/* Policy rush (adattata al layer offerte)                              */
/* ------------------------------------------------------------------ */

/**
 * failChance "da card" per la persona: sotto resolver A/C e' la formula
 * canonica (mid raw band + gate discreto); sotto B interpola la banda via
 * power — la card riflette il modello del mondo in cui vive la persona.
 */
export function scoutedFail(S: LabState, instanceId: string): number {
  const view = offerQuests(S.meta).find((v) => v.instanceId === instanceId);
  if (!view) return 1;
  const power = partyPower(S.meta.party, S.meta.cfg.tuning);
  return variantFailChance(view.def, view.gate, S.meta.cfg.tuning, power, S.resolver);
}

/** Inc E (policy, non meccanica): la quest si chiude prima dell'assedio?
 *  Una quest con resolvesAt oltre S.nI lascia eroe e milizia fuori dal
 *  villaggio durante l'invasione — i difensori away non contano. Il Re
 *  e' esente: la vittoria chiude la run prima di qualunque assedio. */
export function clearsSiege(S: LabState, v: { def: { id: string; durationTicks: number } }): boolean {
  if (!S.persona.holdForSiege) return true;
  if (v.def.id === 'king-assault') return true;
  return day(S) + v.def.durationTicks <= S.nI;
}

export function policy(S: LabState): void {
  if (S.end) return;
  if (S.persona.kind === 'optimizer') { policyOptimizer(S); return; }
  policyThreshold(S);
}

/** Policy a soglie (rush/turtle): priorita' fisse dichiarate nella persona. */
function policyThreshold(S: LabState): void {
  if (S.end) return;
  updateParty(S);
  assignWorkforce(S);
  const board = offerQuests(S.meta);
  const commit = (id: string) => commitOfferToLab(S, id).ok;

  // 1) Assalto al Re: se l'offerta e' aperta e la banda e' decente, o se
  //    la prossima invasione e' vicina e non c'e' alternativa.
  const king = board.find((v) => v.def.id === 'king-assault');
  if (king && king.gate.state !== 'locked') {
    const p = 1 - scoutedFail(S, king.instanceId);
    const daysToInv = S.nI - day(S);
    if (p >= S.persona.kingP || (daysToInv <= S.persona.desperateDays && p >= S.persona.desperateP)) {
      if (commit(king.instanceId)) return;
    }
  }
  // 2) Crescita: migranti/mercenari quando possibile (D3 — l'unico canale
  //    di reclutamento ora sono le offerte).
  const mig = board.find((v) => v.def.family === 'people');
  if (mig && mig.gate.state !== 'locked' && clearsSiege(S, mig) && commit(mig.instanceId)) return;
  // 3) Difesa contro la prossima invasione (modello v0.2)
  const th = Math.round(70 * Math.pow(1.2, S.inv) * (1 + 0.08 * S.inv ** 2));
  const d = S.nI - day(S);
  const est = () => trnCount(S) * 2 + trainedPresent(S).length * 4 + S.pal * 14 + S.trap * 30;
  const halfPal = pop(S) >= 12;
  const palC = { legna: 20, ferro: 10 };
  const pal2 = has(S, { legna: 40, ferro: 20 });
  let xPal = 0;
  const would = (n: number) => est() + n * 14;
  if (d <= 60) { while (would(xPal) < th * 0.9 && xPal < 4) xPal++; }
  else { const y = Math.min(S.res.legna - 60, S.res.ferro - 30); if (y >= 30 && xPal < 2) xPal = 1; }
  // cap policy (non meccanica): evita pal spam degenere
  if (xPal && S.pal < S.persona.palCap && halfPal && (xPal > 1 ? pal2 : has(S, palC))) { act(S, 'pal'); return; }
  // 4) Trap se vicino all'invasione e difesa corta
  if (d <= 55 && est() < th * 0.8 && S.trap < 3 && has(S, { legna: 10, ferro: 6, oro: 8 })) { act(S, 'trap'); return; }
  // 5) Addestra (trn) — keystone difesa
  if (freeVillagers(S).filter((v) => !(v.traits ?? []).includes(TAG_TRAINED)).length && has(S, { oro: trnCost(S), cibo: 6 })) {
    if (act(S, 'trn')) return;
  }
  // 6) Training stat eroe se lontano dall'invasione e oro alto
  if (d > 50 && S.res.oro > S.persona.trainGold) {
    const key: 'FOR' | 'AST' | 'CAR' = S.st.FOR <= S.st.AST && S.st.FOR <= S.st.CAR ? 'FOR' : S.st.AST <= S.st.CAR ? 'AST' : 'CAR';
    if (S.st[key] < 15 && train(S, key)) return;
  }
  // 7) Edifici (oro passivo)
  const emp = S.cfg.buildings.find((b) => b.id === 'emporio')!;
  if (S.buildings.emporio.n < emp.max && has(S, emp.cost) && build(S, 'emporio')) return;
  // 8) Altrimenti migliore offerta disponibile (reward/giorno × prob.)
  const open = board.filter((v) => v.gate.state !== 'locked' && v.def.id !== 'king-assault');
  let best: (typeof open)[0] | undefined;
  let bestScore = 0;
  for (const v of open) {
    const rw = S.cfg.rewards[v.def.id]?.win;
    const val = (rw?.res ? Object.values(rw.res).reduce((a, b) => a + (b ?? 0), 0) : 0)
      + (rw?.migrants ? rw.migrants * 20 : 0);
    const score = ((1 - scoutedFail(S, v.instanceId)) * val) / v.def.durationTicks;
    if (score > bestScore) { bestScore = score; best = v; }
  }
  if (best && bestScore >= S.persona.questScoreMin && clearsSiege(S, best) && commit(best.instanceId)) return;
  // 9) Olio se difesa molto corta
  if (d <= 40 && est() < th && has(S, { ferro: 6, oro: 10 })) { act(S, 'oil'); }
}

/* ------------------------------------------------------------------ */
/* Persona optimizer (S1.5): argmax EV su dati di board, non soglie.    */
/* EURISTICA dichiarata — non un solver ottimo: usa solo cio' che la    */
/* card vede (scoutedFail, gate) + la reward table pubblica del lab.    */
/* ------------------------------------------------------------------ */

/** Valore in oro-eq di una reward entry secondo la persona optimizer. */
function entryEV(S: LabState, e?: LabRewardEntry): number {
  if (!e) return 0;
  const p = S.persona;
  let v = 0;
  if (e.res) {
    for (const [k, x] of Object.entries(e.res)) v += (x ?? 0) * (p.resValue?.[k] ?? 1);
  }
  if (e.migrants) v += e.migrants * (p.memberValue ?? 0);
  if (e.item === 'oil') v += 20;
  else if (e.item === 'trn') v += 15;
  else if (e.item === 'FOR' || e.item === 'AST' || e.item === 'CAR') v += 30;
  else if (e.item === 'pal') v += 14;
  if (e.victory) v += p.victoryValue ?? 0;
  return v;
}

/**
 * EV di un'offerta: E[reward] − E[harm cost] − costo opportunita' crew.
 * E[harm]: condizionato al fail (harmProfile e' "cosa costa il fallimento")
 * con targeting posizionale — l'eroe in testa prende ~1/crew dell'esposizione.
 */
function offerEV(S: LabState, v: ReturnType<typeof offerQuests>[number]): number {
  const p = S.persona;
  const f = scoutedFail(S, v.instanceId);
  const rw = S.cfg.rewards[v.def.id] ?? {};
  const winV = entryEV(S, rw.win);
  const bigV = entryEV(S, rw.bigWin ?? rw.win);
  const almostV = entryEV(S, rw.almost);
  const t = S.meta.cfg.tuning.outcomeTable;
  // approssimazione outcome mix: win-side split su bigWinAbove,
  // almostBelow su fail-side (soglie canoniche, euristica persona).
  const expReward = (1 - f) * ((1 - t.bigWinAbove / 2) * winV + (t.bigWinAbove / 2) * bigV)
    + f * t.almostBelow * almostV;
  const crewSize = (S.cfg.partySize[v.def.id] ?? 1) + 1;
  const heroShare = 1 / crewSize;
  const hp = v.def.harmProfile;
  const woundDays = S.cfg.injuryTiers[S.cfg.woundTierByOutcome.fail ?? 'moderate'] ?? 3;
  const harmCost = f * (
    hp.wound * (woundDays * (p.wagePerDay ?? 0))
    + hp.death * ((p.memberValue ?? 0) + (p.heroValue ?? 0) * heroShare)
  );
  const oppCost = v.def.durationTicks * crewSize * (p.wagePerDay ?? 0);
  return expReward - harmCost - oppCost;
}

/** Policy optimizer: ogni giorno calcola l'EV di ogni azione fattibile
 *  e sceglie l'argmax; se tutto e' <= 0, idle. */
function policyOptimizer(S: LabState): void {
  updateParty(S);
  assignWorkforce(S);
  const p = S.persona;
  const board = offerQuests(S.meta);
  const d = S.nI - day(S);
  const th = Math.round(70 * Math.pow(1.2, S.inv) * (1 + 0.08 * S.inv ** 2));
  const est = () => trnCount(S) * 2 + trainedPresent(S).length * 4 + S.pal * 14 + S.trap * 30;
  const margin = p.defenseMargin ?? 1;

  type Cand = { ev: number; go: () => boolean };
  const cands: Cand[] = [];

  // Offerte sulla board (incluso il Re — victory entra in EV). Inc E:
  // le quest che non rientrano prima dell'assedio non sono fattibili
  // (la milizia sarebbe fuori — holdForSiege e' dato di policy).
  for (const v of board) {
    if (v.gate.state === 'locked') continue;
    if (!clearsSiege(S, v)) continue;
    const ev = offerEV(S, v);
    if (ev > 0) cands.push({ ev, go: () => commitOfferToLab(S, v.instanceId).ok });
  }

  // Difesa: se entro l'orizzonte di minaccia, ogni azione vale
  // (gap coperto · valore-sopravvivenza proxy) / costo oro-eq.
  const gap = Math.max(0, th * margin - est());
  if (gap > 0 && d <= 120) {
    const survW = (p.memberValue ?? 0) * Math.min(pop(S), 4) / th; // valore dei villager a rischio proporzionale al gap
    const defCand = (defPts: number, cost: Record<string, number>, go: () => boolean) => {
      const costGold = Object.entries(cost).reduce((a, [k, x]) => a + x * (p.resValue?.[k] ?? 1), 0);
      const ev = Math.min(defPts, gap) * survW - costGold;
      if (ev > 0) cands.push({ ev, go });
    };
    if (pop(S) >= 12) defCand(14, { legna: 20, ferro: 10 }, () => act(S, 'pal'));
    if (S.trap < 3) defCand(30, { legna: 10, ferro: 6, oro: 8 }, () => act(S, 'trap'));
    defCand(37.5, { ferro: 6, oro: 10 }, () => act(S, 'oil'));
    // trn: +2 def per addestrato (x3 max) + presenza futura
    const pool = freeVillagers(S).filter((v) => !(v.traits ?? []).includes(TAG_TRAINED));
    if (pool.length && pop(S) > 2) {
      defCand(Math.min(3, pool.length) * 6, { oro: trnCost(S), cibo: 6 }, () => act(S, 'trn'));
    }
  }

  // Training stat eroe: vale SOLO se sposta un gate — under canonical
  // discrete gate questo e' quasi sempre EV≈0 (dead zone misurata);
  // qui diventa comportamento osservabile: l'optimizer allena solo quando
  // lo stat mancante blocca un'offerta (requires) o sblocca il gate Re.
  // S3: resolver-aware — sotto B ogni stat riduce f in modo continuo
  // (slope = ampiezza banda / soglia tier); sotto C migliora la qualita'
  // dell'esito. L'optimizer conosce il modello del mondo in cui gioca.
  const power = S.st.FOR + S.st.AST + S.st.CAR;
  const t3 = S.meta.cfg.tuning.overQualifiedPower.t3;
  const kingDef = S.meta.cfg.offers.find((o) => o.id === 'king-assault');
  for (const k of ['FOR', 'AST', 'CAR'] as const) {
    const key = k.toLowerCase() as 'for' | 'ast' | 'car';
    let ev = 0;
    if (k === 'FOR' && S.st.FOR < 8) {
      // for>=8 e' un requires del Re (severity cost): sbloccarlo toglie
      // la penalita' underprepared → EV = Δf · victoryValue.
      ev += 0.15 * (p.victoryValue ?? 0);
    }
    if (power + 1 >= t3 && power < t3) ev += 0.1 * (p.victoryValue ?? 0);
    if (kingDef && S.resolver === 'B') {
      const slope = (kingDef.riskBand[1] - kingDef.riskBand[0]) / t3;
      ev += slope * (p.victoryValue ?? 0);
    }
    if (kingDef && S.resolver === 'C') {
      const n = Math.min(1, partyPower(S.meta.party, S.meta.cfg.tuning) / t3);
      ev += 0.05 * (1 - n) * (p.victoryValue ?? 0);
    }
    for (const v of board) {
      if (v.gate.state !== 'locked') continue;
      const statReq = v.def.requires.find((r) => r.kind === 'stat' && r.key === key && (r.min ?? 0) > S.st[k]);
      if (statReq) ev += Math.max(0, offerEV(S, v)) + entryEV(S, S.cfg.rewards[v.def.id]?.win) * 0.3;
    }
    const cost = trainCost(S, S.st[k]) * (p.resValue?.oro ?? 1) + 8 * (p.resValue?.cibo ?? 1);
    ev -= cost;
    if (ev > 0) cands.push({ ev, go: () => train(S, k) });
  }

  // Edifici: EV = produzione sull'orizzonte - costo - giorni operaio.
  for (const b of S.cfg.buildings) {
    if (S.buildings[b.id].n >= b.max || !b.res) continue;
    const gain = b.gives * (p.resValue?.[b.res] ?? 1) * (p.horizonDays ?? 300);
    const cost = Object.entries(b.cost).reduce((a, [k, x]) => a + x * (p.resValue?.[k] ?? 1), 0)
      + b.t * (p.wagePerDay ?? 0);
    const ev = gain - cost;
    if (ev > 0) cands.push({ ev, go: () => build(S, b.id) });
  }

  cands.sort((a, b) => b.ev - a.ev);
  for (const c of cands) if (c.go()) return;
}

/* ------------------------------------------------------------------ */
/* Runner                                                              */
/* ------------------------------------------------------------------ */

export function run(seed: number, maxDays = 2000, verbose = false,
  resolved?: ResolvedScenario, persona?: Persona,
  resolver: ResolverModel = 'A'): LabState {
  const S = init(seed, resolved, persona, resolver);
  while (!S.end && day(S) < maxDays) {
    policy(S);
    advanceDay(S);
  }
  if (!S.end) S.end = { kind: 'lose', day: day(S), why: 'timeout' };
  if (verbose) S.log.forEach((l) => console.log(l));
  return S;
}

/** Stato normalizzato per confronto determinismo (id attivita' esclusi —
 *  TimeEngine genera id con Date.now()/Math.random(), noto non-determinismo
 *  dell'engine: il lab confronta stato, non handle). */
function normalize(S: LabState) {
  return JSON.stringify({
    residents: Object.values(S.vil.residents).map((r) => ({
      id: r.id, st: r.status, traits: r.traits, hp: r.currentHp,
    })),
    meta: {
      board: S.meta.state.board.map((o) => o.defId),
      committed: S.meta.state.committed.map((q) => q.defId),
      qualities: S.meta.state.world.qualities,
      rngCalls: S.meta.state.rngCalls,
    },
    res: S.res, trn: trnCount(S), st: S.st, inv: S.inv, pal: S.pal,
    hist: S.hist, qOk: S.qOk, qFail: S.qFail,
    end: S.end, win: S.win, day: day(S),
  });
}

/** Tag di fedeltà della causa di fine run (r003: esito taggato per meccanica). */
export function endFidelity(why: string): 'CANON' | 'OBSERVED-ADAPTER' | 'PROPOSTA' {
  if (why.includes('eroe caduto')) return 'CANON'; // harmProfile+resolve metaLayer
  if (why.includes('Re dei Goblin')) return 'OBSERVED-ADAPTER'; // milestone canon, reward lab
  return 'PROPOSTA'; // invasione/fame/estinzione: meccaniche lab proposte
}

/** RunReport (r003 S1): identità completa + metriche per-causa. */
export function report(S: LabState) {
  const alive = pop(S);
  const milestones = milestoneViews(S.meta).map((m) =>
    `${m.id}:${m.openApproachIndexes.length}/${m.approaches.length}`);
  const generated = Object.values(S.metrics.offersGenerated).reduce((a, b) => a + b, 0);
  const committed = Object.values(S.metrics.offersCommitted).reduce((a, b) => a + b, 0);
  return {
    // identità
    scenarioId: S.scenarioId, configHash: S.configHash,
    persona: { id: S.persona.id, version: S.persona.version },
    /** S3: resolver usato — A canonico / B continuo / C ibrido. */
    resolver: S.resolver,
    seed: S.seed,
    // esito con tag fedeltà della causa
    end: S.end ? { ...S.end, fidelity: endFidelity(S.end.why) } : undefined,
    day: day(S),
    // roster
    villagerAlive: alive, totalAlive: aliveResidents(S).length,
    injured: aliveResidents(S).filter((r) => r.status === 'injured').length,
    res: Object.fromEntries(Object.entries(S.res).map(([k, v]) => [k, Math.round(v)])),
    trn: trnCount(S), stats: S.st, inv: S.inv, pal: S.pal,
    // funnel offerte: generate → commesse → risolte; ignorate = generate−commesse−scadute
    offerFunnel: {
      generated, committed, expired: S.metrics.offersExpired,
      ignored: generated - committed - S.metrics.offersExpired,
      byOffer: {
        generated: S.metrics.offersGenerated,
        committed: S.metrics.offersCommitted,
        attempted: S.metrics.questsAttempted,
      },
    },
    questOutcomes: S.metrics.questOutcomes,
    /** Inc E: assedi per tier canonico missionResolver + esito macro. */
    sieges: {
      repelled: S.metrics.siegesRepelled,
      breached: S.metrics.siegesBreached,
      tiers: S.metrics.siegeTiers,
    },
    /** S3: n. resolve dove la variante diverge dal canone. */
    resolverDivergences: S.metrics.resolverDivergences,
    qOk: S.qOk, qFail: S.qFail,
    harm: { wounds: S.metrics.wounds, woundsByTier: S.metrics.woundsByTier,
      deaths: S.metrics.deaths, heroDeaths: S.metrics.heroDeaths },
    personDays: { alive: S.metrics.personDaysAlive, busy: S.metrics.personDaysBusy,
      /** R-179: giorni-persona in job produttivi (lavoro assegnato). */
      jobs: S.metrics.jobDays },
    buildings: S.buildings, milestones,
  };
}

export const summary = report;

/* ------------------------------------------------------------------ */
/* Test di accettazione                                                */
/* ------------------------------------------------------------------ */

const noop = () => undefined;

function runTests() {
  console.debug = noop;
  console.warn = noop; // engine starvation log per-tick: rumore su scenari letali
  const results: { name: string; pass: boolean; note?: string }[] = [];
  const t = (name: string, fn: () => boolean | string) => {
    try {
      const r = fn();
      results.push({ name, pass: r === true, note: typeof r === 'string' ? r : undefined });
    } catch (e) {
      results.push({ name, pass: false, note: String(e) });
    }
  };

  // A1: doppia assegnazione rifiutata (TimeEngine reale)
  t('A1 doppia assegnazione rifiutata', () => {
    const S = init(1);
    const v = freeVillagers(S)[0];
    if (!schedule(S, 'test', [v.id], 3, [])) return 'schedule fallita';
    return canAssign(S, v.id) === false || 'canAssign ancora true';
  });

  // A2: membro quest → 'away', non riassegnabile
  t('A2 quest → away, non riassegnabile', () => {
    const S = init(2);
    const v = offerQuests(S.meta).find((o) => o.def.id === 'forage-hunt');
    if (!v) return 'forage-hunt non in board';
    const r = commitOfferToLab(S, v.instanceId);
    if (!r.ok) return `commit: ${r.err}`;
    const crew = S.liveQuests[0]?.members ?? [];
    if (crew.length < 2) return 'crew incompleta';
    const member = S.vil.residents[crew[1]];
    return (member.status === 'away' && !canAssign(S, member.id)) ||
      `status=${member.status}`;
  });

  // A3: morto permanente e non schedulabile
  t('A3 morto permanente', () => {
    const S = init(3);
    const v = freeVillagers(S)[0];
    S.vil.residents[v.id] = { ...v, status: 'dead' };
    if (canAssign(S, v.id)) return 'morto schedulabile';
    const adv = advanceTime(depsOf(S), S.vil, 40);
    S.vil = adv.state;
    return S.vil.residents[v.id].status === 'dead' || 'status cambiato';
  });

  // A4: addestrati away non contano in difesa
  t('A4 difesa esclude away', () => {
    const S = init(4);
    const vs = freeVillagers(S).slice(0, 3);
    vs.forEach((r) => { (S.vil.residents[r.id].traits ??= []).push(TAG_TRAINED); });
    if (trainedPresent(S).length !== 3) return 'setup fallito';
    if (!schedule(S, 'quest-test', [vs[0].id], 10, [])) return 'schedule fallita';
    return trainedPresent(S).length === 2 || 'ancora 3 presenti';
  });

  // B1: leader-capacity reale — 1 leader → una quest alla volta
  t('B1 no-leader-available su secondo commit', () => {
    const S = init(5);
    const board = offerQuests(S.meta);
    const two = board.filter((o) => o.def.family !== 'people' && o.def.id !== 'king-assault');
    if (two.length < 2) return 'board povera';
    if (!commitOfferToLab(S, two[0].instanceId).ok) return 'primo commit fallito';
    updateParty(S);
    const r = selectQuest(S.meta, two[1].instanceId);
    return (r.ok === false && r.reason === 'no-leader-available') ||
      `reason=${r.ok ? 'committed!' : r.reason}`;
  });

  // B2: king-assault non appare prima di clock:king (appearsWhen)
  t('B2 Re appare solo a clock:king', () => {
    const S = init(6);
    const early = offerQuests(S.meta).some((o) => o.def.id === 'king-assault');
    if (early) return 'Re sulla board a tick 0';
    let appeared = -1;
    for (let i = 0; i < 300 && appeared < 0; i++) {
      advanceSessionTime(S.meta, 1);
      if (offerQuests(S.meta).some((o) => o.def.id === 'king-assault')) {
        appeared = S.meta.state.world.tick;
      }
    }
    return appeared >= 60 || `apparso a tick ${appeared} (<60)`;
  });

  // B3: underprepared e' "tentabile a rischio", non locked
  t('B3 Re underprepared committabile', () => {
    const S = init(7);
    let king;
    for (let i = 0; i < 300 && !king; i++) {
      advanceSessionTime(S.meta, 1);
      updateParty(S);
      king = offerQuests(S.meta).find((o) => o.def.id === 'king-assault');
    }
    if (!king) return 'Re non appare';
    if (king.gate.state === 'locked') return 'Re locked invece di underprepared';
    const r = commitOfferToLab(S, king.instanceId);
    return r.ok || `commit: ${r.err}`;
  });

  // B4: migranti = offerta people → +residenti a risoluzione
  t('B4 migranti via offerta', () => {
    const S = init(8);
    let inst: string | undefined;
    for (let i = 0; i < 300 && !inst; i++) {
      inst = offerQuests(S.meta).find((o) => o.def.id === 'migrants-arrival')?.instanceId;
      if (!inst) advanceSessionTime(S.meta, 1);
    }
    if (!inst) return 'offerta migranti mai generata';
    const before = pop(S);
    const r = commitOfferToLab(S, inst);
    if (!r.ok) return `commit: ${r.err}`;
    const rep = advanceSessionTime(S.meta, 1);
    applyMetaEvents(S, rep);
    return pop(S) > before || `pop ${before} → ${pop(S)}`;
  });

  // B5: ferita → injured + recovery reale via sweep engine
  t('B5 wound → injured → recovery', () => {
    const S = init(9);
    const crew = [hero(S).id, freeVillagers(S)[0].id];
    S.streams.harm = () => 0.99; // forza l'ultimo slot (villager)
    applyHarm(S, crew, 'wound', 'almost');
    const v = S.vil.residents[crew[1]];
    if (v.status !== 'injured') return `status=${v.status}`;
    const adv = advanceTime(depsOf(S), S.vil, S.cfg.injuryTiers.light + 1);
    S.vil = adv.state;
    return S.vil.residents[crew[1]].status === 'available' ||
      `dopo recovery: ${S.vil.residents[crew[1]].status}`;
  });

  // B6: offerta scaduta → commit rifiutato
  t('B6 offerta scaduta rifiutata', () => {
    const S = init(10);
    const v = offerQuests(S.meta)[0];
    advanceSessionTime(S.meta, v.ticksToExpiry + 1);
    const r = selectQuest(S.meta, v.instanceId);
    return r.ok === false || 'commit su offerta scaduta riuscito';
  });

  // S0-C1: le chiamate read-only del metaLayer non consumano draw
  // (precondizione per matched-seed: ispezionare la board non deve
  // perturbare il flusso RNG della run).
  t('S0-C1 read-only calls: zero draw', () => {
    const S = init(11);
    const before = S.meta.state.rngCalls;
    offerQuests(S.meta);
    freeLeaders(S.meta);
    milestoneViews(S.meta);
    return S.meta.state.rngCalls === before ||
      `rngCalls ${before} → ${S.meta.state.rngCalls}`;
  });

  // S0-C2: stream separati — stesso seed+label → identico; label diversi →
  // sequenze diverse; consumare uno stream non sposta gli altri.
  t('S0-C2 stream splitting', () => {
    const a = mkStreams(42);
    const b = mkStreams(42);
    // stesso label → stessa sequenza
    for (let i = 0; i < 8; i++) {
      if (a.harm() !== b.harm()) return 'stesso label diverge';
    }
    // label diversi → stream diversi (collisione ~1/2^64, trascurabile)
    const w = Array.from({ length: 8 }, () => a.world());
    const h = Array.from({ length: 8 }, () => a.harm());
    if (w.join() === h.join()) return 'world == harm';
    // consumare world non sposta harm
    const c = mkStreams(42);
    const expected = mkStreams(42).harm();
    c.world(); c.world(); c.world();
    if (c.harm() !== expected) return 'harm spostato dai draw di world';
    return true;
  });

  // S1-D1: patch invalide → reject (target inesistente, campo non whitelist,
  // risultato che viola lo schema Zod canonico, type mismatch su cfg).
  t('S1-D1 patch invalide rifiutate', () => {
    const bad: [string, { target: string; mul?: number; set?: unknown }][] = [
      ['target inesistente', { target: 'offer.non-esiste.weight', mul: 2 }],
      ['campo non whitelist', { target: 'offer.forage-hunt.id', set: 'x' }],
      ['type mismatch cfg', { target: 'cfg.popCap', set: 'trenta' }],
      ['requires non valido', { target: 'offer.forage-hunt.requires', set: [1] }],
    ];
    for (const [name, op] of bad) {
      try {
        applyScenario({ id: 'x', description: '', ops: [op] }, LAB_META_CONFIG, CFG as unknown as Record<string, unknown>);
        return `${name}: non ha lanciato`;
      } catch { /* atteso */ }
    }
    // schema-invalido: wound+death > 1 viola lo Zod canonico
    try {
      applyScenario({ id: 'x', description: '', ops: [
        { target: 'offer.king-assault.harmProfile.death', set: 0.9 },
        { target: 'offer.king-assault.harmProfile.wound', set: 0.9 },
      ] }, LAB_META_CONFIG, CFG as unknown as Record<string, unknown>);
      return 'harmProfile>1 accettato';
    } catch { /* atteso: Zod reject */ }
    return true;
  });

  // S1.5-D5: le nuove superfici sono raggiungibili e verificate —
  // reward/partySize/costi come dati, requires[i].min, repeatable, clock,
  // familydef, meta.* escape hatch. Senza queste il confronto S3 non copre
  // le dimensioni richieste dalla desiderata.
  t('S1.5-D5 copertura patch estesa', () => {
    const rs = applyScenario({ id: 'cov', description: '', ops: [
      { target: 'cfg.rewards.forage-hunt.win.res.cibo', mul: 2 },
      { target: 'cfg.partySize.delve-ruins', set: 3 },
      { target: 'cfg.trnCostBase', mul: 1.5 },
      { target: 'cfg.injuryTiers.severe', set: 9 },
      { target: 'offer.king-assault.requires.0.min', set: 10 },
      { target: 'offer.king-assault.repeatable', set: false },
      { target: 'clock.clock:king.periodTicks', set: 30 },
      { target: 'familydef.assault.stopCondition.value', set: 5 },
      { target: 'meta.tuning.boardSize', set: 7 },
    ] }, LAB_META_CONFIG, CFG as unknown as Record<string, unknown>);
    const cfg = rs.cfg as LabCfg;
    const king = rs.meta.offers.find((o) => o.id === 'king-assault')!;
    const checks: [string, boolean][] = [
      ['reward cibo', cfg.rewards['forage-hunt'].win.res?.cibo === 28],
      ['partySize', cfg.partySize['delve-ruins'] === 3],
      ['trnCostBase', cfg.trnCostBase === 18],
      ['injuryTiers.severe', cfg.injuryTiers.severe === 9],
      ['requires.0.min', king.requires[0].min === 10],
      ['repeatable', king.repeatable === false],
      ['clock period', rs.meta.clocks[0].periodTicks === 30],
      ['familydef stop', rs.meta.families.find((f) => f.id === 'assault')!.stopCondition.value === 5],
      ['meta.boardSize', rs.meta.tuning.boardSize === 7],
    ];
    const bad = checks.filter(([, ok]) => !ok).map(([n]) => n);
    return bad.length === 0 || `falliti: ${bad.join(', ')}`;
  });

  // S1-D2: patch valida → config risolta con campo cambiato + hash diverso
  t('S1-D2 patch valida cambia config+hash', () => {
    const a = applyScenario(SCENARIOS.base, LAB_META_CONFIG, CFG as unknown as Record<string, unknown>);
    const b = applyScenario(SCENARIOS.deadly, LAB_META_CONFIG, CFG as unknown as Record<string, unknown>);
    if (a.configHash === b.configHash) return 'hash identici';
    const kingA = a.meta.offers.find((o) => o.id === 'king-assault')!;
    const kingB = b.meta.offers.find((o) => o.id === 'king-assault')!;
    return (kingB.riskBand[0] === 0.5 && kingA.riskBand[0] === 0.35) ||
      `riskBand non patchato: ${kingB.riskBand}`;
  });

  // S1-D3: stesso scenario+persona+seed → report identico (riproducibilità)
  t('S1-D3 replay scenario+persona identico', () => {
    const rs = applyScenario(SCENARIOS.deadly, LAB_META_CONFIG, CFG as unknown as Record<string, unknown>);
    const a = JSON.stringify(report(run(555, 900, false, rs, PERSONAS.turtle)));
    const b = JSON.stringify(report(run(555, 900, false, rs, PERSONAS.turtle)));
    return a === b || 'report divergenti';
  });

  // S1-D4: matrice ≥2 scenari × ≥3 persona end-to-end senza errori
  t('S1-D4 matrice scenario×persona', () => {
    for (const sid of ['base', 'scarce']) {
      for (const pid of ['rush', 'turtle', 'optimizer']) {
        const rs = applyScenario(SCENARIOS[sid], LAB_META_CONFIG, CFG as unknown as Record<string, unknown>);
        const S = run(42 + sid.length * 7 + pid.length, 500, false, rs, PERSONAS[pid]);
        if (!S.end) return `no end @ ${sid}/${pid}`;
        const rep = report(S);
        if (rep.scenarioId !== sid || rep.persona.id !== pid) return 'identity mismatch';
      }
    }
    return true;
  });

  // S3-E1: modello B — failChance continua e monotona nel power.
  t('S3-E1 B: failChance monotona nel power', () => {
    const king = LAB_META_CONFIG.offers.find((o) => o.id === 'king-assault')!;
    const gate = {
      state: 'ready' as const, scoutBand: [...king.riskBand] as [number, number],
      missing: [], missingAbsolute: [], willExceedCompletion: false,
    };
    const f = (pw: number) =>
      variantFailChance(king, gate, LAB_META_CONFIG.tuning, pw, 'B');
    const f0 = f(0); const f34 = f(34); const f40 = f(40);
    if (!(f0 > f(13) && f(13) > f34 && f34 >= f40)) {
      return `non monotona: f0=${f0.toFixed(2)} f13=${f(13).toFixed(2)} f34=${f34.toFixed(2)} f40=${f40.toFixed(2)}`;
    }
    if (Math.abs(f0 - king.riskBand[1]) > 1e-9) return `power0=${f0} != bandHi ${king.riskBand[1]}`;
    return true;
  });

  // S3-E2: modello C — failChance identica al canonico, ma a power pieno
  // la coda epic-fail sparisce (campionamento, stessi draw).
  t('S3-E2 C: failChance canonica, epic-fail annullata a power max', () => {
    const king = LAB_META_CONFIG.offers.find((o) => o.id === 'king-assault')!;
    const gate = {
      state: 'ready' as const, scoutBand: [...king.riskBand] as [number, number],
      missing: [], missingAbsolute: [], willExceedCompletion: false,
    };
    const fcA = variantFailChance(king, gate, LAB_META_CONFIG.tuning, 40, 'A');
    const fcC = variantFailChance(king, gate, LAB_META_CONFIG.tuning, 40, 'C');
    if (fcA !== fcC) return `C cambia failChance: ${fcA} vs ${fcC}`;
    let epic = 0;
    const rng = mkRng(7);
    for (let i = 0; i < 500; i++) {
      if (resolveVariant(king, gate, LAB_META_CONFIG.tuning, 40, 'C', rng).outcome === 'epic-fail') epic++;
    }
    return epic === 0 || `epic-fail=${epic} a power 40 sotto C`;
  });

  // S3-E3: replay deterministico sotto resolver B e divergenze registrate.
  t('S3-E3 replay deterministico sotto B + divergenze contate', () => {
    const na = normalize(run(777, 2000, false, undefined, undefined, 'B'));
    const nb = normalize(run(777, 2000, false, undefined, undefined, 'B'));
    if (na !== nb) return 'replay B divergente';
    const S = run(777, 2000, false, undefined, undefined, 'B');
    const rep = report(S);
    if (rep.resolver !== 'B') return 'resolver non riportato';
    return typeof rep.resolverDivergences === 'number' || 'divergenze non contate';
  });

  // A5+B7: replay deterministico (villaggio + metaLayer)
  t('A5/B7 replay deterministico', () => {
    const a = normalize(run(777));
    const b = normalize(run(777));
    return a === b || 'replay divergente';
  });

  /* ---- R-179: economia per-persona canonica ------------------------- */

  // F1: un villager assegnato al job cibo produce rate a completamento —
  // la produzione richiede assegnazione reale, non e' piu' passiva.
  t('F1 produzione = lavoro assegnato (job canonico)', () => {
    const S = init(11);
    const v = freeVillagers(S)[0];
    const rate = S.cfg.jobs.find((j) => j.labRes === 'cibo')!.rate;
    // Consumo canonico: 21 residenti vivi × eatPer (rate engine eatPer×10,
    // tick diurno 0 → consumo = alive × eatPer×10/5 = alive × eatPer×2).
    const consumed = aliveResidents(S).length * S.cfg.eatPer * 2;
    if (!scheduleJob(S, 'lab-job-cibo', v.id)) return 'job non assegnato';
    advanceDay(S);
    const expected = S.cfg.startRes.cibo - consumed + rate;
    return Math.abs(S.res.cibo - expected) < 0.05 ||
      `cibo=${S.res.cibo} atteso≈${expected}`;
  });

  // F2: senza lavoratori il cibo cala e basta — niente produzione passiva.
  t('F2 nessun lavoro → nessuna produzione', () => {
    const S = init(11);
    const consumed = aliveResidents(S).length * S.cfg.eatPer * 2;
    advanceDay(S);
    const expected = S.cfg.startRes.cibo - consumed;
    return Math.abs(S.res.cibo - expected) < 0.05 ||
      `cibo=${S.res.cibo} atteso≈${expected}`;
  });

  // F3: ferito/away non puo' essere assegnato a un job (disponibilita' reale).
  t('F3 injured non lavora', () => {
    const S = init(11);
    const v = freeVillagers(S)[0];
    S.vil.residents[v.id] = { ...v, status: 'injured', injuryRecoveryTime: 5 };
    if (scheduleJob(S, 'lab-job-cibo', v.id)) return 'job assegnato a ferito';
    const crew = [freeVillagers(S)[0]];
    if (!schedule(S, 'quest-x', crew.map((c) => c.id), 3, [])) return 'setup quest fallito';
    return !scheduleJob(S, 'lab-job-cibo', crew[0].id) || 'job assegnato ad away';
  });

  // F4: lavoratore 'away' non conta in difesa — il trade-off lavoro/difesa.
  t('F4 lavoratore away non difende', () => {
    const S = init(11);
    const v = freeVillagers(S)[0];
    (S.vil.residents[v.id].traits ??= []).push(TAG_TRAINED);
    const before = trainedPresent(S).length;
    if (!scheduleJob(S, 'lab-job-legna', v.id)) return 'job non assegnato';
    return trainedPresent(S).length === before - 1 || 'ancora presente';
  });

  // F5: fame a zero → fine run (regola lab dichiarata PROPOSTA).
  t('F5 fame → fine run', () => {
    const S = init(11);
    S.res.cibo = 0;
    advanceDay(S);
    return S.end?.kind === 'lose' && S.end.why === 'fame' || `end=${S.end?.why}`;
  });

  // F6: il motore consuma ANCHE l'eroe e i feriti (status !== 'dead').
  t('F6 consumo conta tutti i vivi (eroe incluso)', () => {
    const S = init(11);
    const v = freeVillagers(S)[0];
    S.vil.residents[v.id] = { ...v, status: 'injured', injuryRecoveryTime: 50 };
    advanceDay(S);
    const alive = 21; // eroe + 20 villager, il ferito mangia
    const expected = S.cfg.startRes.cibo - alive * S.cfg.eatPer * 2;
    return Math.abs(S.res.cibo - expected) < 0.05 ||
      `cibo=${S.res.cibo} atteso≈${expected} (ferito mangia)`;
  });

  // F7: rate dei job patchabili via scenario (cfg.jobs.N.rate).
  t('F7 cfg.jobs.N.rate patchabile', () => {
    const rs = applyScenario({ id: 'x', description: '', ops: [
      { target: 'cfg.jobs.0.rate', mul: 2 },
    ] }, LAB_META_CONFIG, CFG as unknown as Record<string, unknown>);
    return (rs.cfg as LabCfg).jobs[0].rate === 3.0 || `rate=${(rs.cfg as LabCfg).jobs[0].rate}`;
  });

  /* ---- Inc E: invasione come missione canonica per-membro ------------ */

  // I1: zero difensori (eroe ferito, nessun addestrato) → nessuna fase
  // giocata → tier 'fail' → breccia deterministica.
  t('I1 zero difensori → breccia', () => {
    const S = init(21);
    const h = hero(S);
    S.vil.residents[h.id] = { ...h, status: 'injured', injuryRecoveryTime: 50 };
    invade(S);
    return S.metrics.siegesBreached === 1 && S.metrics.siegeTiers.fail === 1 ||
      `tiers=${JSON.stringify(S.metrics.siegeTiers)}`;
  });

  // I2: nessuna struttura + breccia → collasso strutturale (fine run).
  t('I2 breccia senza strutture → collasso', () => {
    const S = init(21);
    const h = hero(S);
    S.vil.residents[h.id] = { ...h, status: 'injured', injuryRecoveryTime: 50 };
    invade(S);
    return S.end?.kind === 'lose' && S.end.why.includes('collasso') || `end=${S.end?.why}`;
  });

  // I3: milizia 'away' (in quest) e ferita non conta come difensori —
  // disponibilita' reale, non ownership del trait.
  t('I3 milizia away/injured non difende', () => {
    const S = init(21);
    const vs = freeVillagers(S).slice(0, 3);
    vs.forEach((v) => { (S.vil.residents[v.id].traits ??= []).push(TAG_TRAINED); });
    // 2 away in quest, 1 ferita: zero difensori villager.
    if (!schedule(S, 'quest-x', [vs[0].id, vs[1].id], 5, [])) return 'setup fallito';
    S.vil.residents[vs[2].id] = { ...vs[2], status: 'injured', injuryRecoveryTime: 50 };
    const h = hero(S);
    S.vil.residents[h.id] = { ...h, status: 'injured', injuryRecoveryTime: 50 };
    invade(S);
    return S.metrics.siegeTiers.fail === 1 ||
      `atteso fail (0 difensori), tiers=${JSON.stringify(S.metrics.siegeTiers)}`;
  });

  // I4: ferita da assedio persiste in ResidentState e il recovery sweep
  // canonico la risolve (ritorna available dopo i giorni del tier).
  t('I4 ferita assedio → injured → recovery canonico', () => {
    const S = init(21);
    const v = freeVillagers(S)[0];
    applySiegeOutcome(S, v.id, 'injured', 'moderate');
    if (S.vil.residents[v.id].status !== 'injured') return 'non ferito';
    const adv = advanceTime(depsOf(S), S.vil, S.cfg.injuryTiers.moderate + 1);
    S.vil = adv.state;
    return S.vil.residents[v.id].status === 'available' || 'mai recuperato';
  });

  // I5: civili 'away' sono fisicamente fuori → zero vittime civili in
  // breccia (i difensori assenti non muoiono neppure come membri).
  t('I5 civili away non sono vittime', () => {
    const S = init(21);
    const all = freeVillagers(S).map((v) => v.id);
    if (!schedule(S, 'quest-x', all, 5, [])) return 'setup fallito';
    const h = hero(S);
    S.vil.residents[h.id] = { ...h, status: 'injured', injuryRecoveryTime: 50 };
    const deathsBefore = S.metrics.deaths;
    invade(S);
    return S.metrics.deaths === deathsBefore ||
      `${S.metrics.deaths - deathsBefore} vittime con villaggio vuoto`;
  });

  // I6: difesa forte respinge piu' di difesa nulla su seed accoppiati —
  // il canale stat/fortificazioni influenza il tier canonico.
  t('I6 difesa reale aumenta le respinte (matched seeds)', () => {
    let repStrong = 0; let repWeak = 0;
    for (let i = 0; i < 30; i++) {
      const mk = (strong: boolean) => {
        const S = init(500 + i);
        if (strong) {
          freeVillagers(S).slice(0, 10).forEach((v) => {
            (S.vil.residents[v.id].traits ??= []).push(TAG_TRAINED);
          });
          S.pal = 6; S.trap = 2;
        }
        invade(S);
        return S.metrics.siegesRepelled;
      };
      repStrong += mk(true); repWeak += mk(false);
    }
    return repStrong > repWeak || `strong=${repStrong} weak=${repWeak}`;
  });

  // I7: report espone il blocco sieges con tier canonici.
  t('I7 report sieges', () => {
    const S = init(21);
    invade(S);
    const rep = report(S);
    const total = rep.sieges.repelled + rep.sieges.breached;
    return total === 1 && Object.keys(rep.sieges.tiers).length >= 1 || 'sieges assente';
  });

  // I8: holdForSiege — la persona non commette quest non-Re che
  // risolverebbero oltre la prossima invasione (Re esente).
  t('I8 holdForSiege blocca quest oltre l\'invasione', () => {
    const S = init(21);
    S.nI = day(S) + 10;
    const long = { def: { id: 'forage-hunt', durationTicks: 15 } };
    const short = { def: { id: 'forage-hunt', durationTicks: 9 } };
    const king = { def: { id: 'king-assault', durationTicks: 30 } };
    if (clearsSiege(S, long)) return 'quest lunga ammessa';
    if (!clearsSiege(S, short)) return 'quest breve bloccata';
    return clearsSiege(S, king) || 'Re non esente';
  });

  /* ---------- R-184: invarianti ciclo di vita dei residenti ---------- */

  // V1: identita' stabile — due arrivi migranti nello stesso giorno non
  // collidono: nessun id duplicato, nessun residente sovrascritto.
  t('V1 id migranti univoci (no collisione stesso giorno)', () => {
    const S = init(21);
    const before = Object.keys(S.vil.residents).length;
    applyReward(S, 'migrants-arrival', 'win');       // +3
    applyReward(S, 'mercenary-hero', 'win');         // +1 (stesso giorno)
    const ids = Object.keys(S.vil.residents);
    const unique = new Set(ids);
    const migrants = ids.filter((i) => i.startsWith('m-'));
    return (unique.size === ids.length && ids.length === before + 4 &&
      migrants.length === 4) ||
      `ids=${ids.length} unici=${unique.size} migranti=${migrants.length}`;
  });

  // V2: morte terminale — un morto non torna available, non e' assegnabile
  // e non viene resuscitato dal completamento di un'attivita'.
  t('V2 morto: non assegnabile, non resuscita', () => {
    const S = init(21);
    const v = freeVillagers(S)[0];
    applyHarm(S, [v.id], 'death');
    if (S.vil.residents[v.id].status !== 'dead') return 'non morto';
    if (canAssign(S, v.id)) return 'morto assegnabile';
    const adv = advanceTime(depsOf(S), S.vil, 5);
    S.vil = adv.state;
    return S.vil.residents[v.id].status === 'dead' || 'resuscitato';
  });

  // V3: ferita rispetta le regole canoniche — non assegnabile mentre
  // injured; recovery sweep lo riporta available e pulisce isInjured.
  t('V3 ferito: non assegnabile, recovery canonico completo', () => {
    const S = init(21);
    const v = freeVillagers(S)[0];
    applyHarm(S, [v.id], 'wound', 'fail');
    const r = S.vil.residents[v.id];
    if (r.status !== 'injured') return 'non ferito';
    if (canAssign(S, v.id)) return 'ferito assegnabile';
    const adv = advanceTime(depsOf(S), S.vil, (r.injuryRecoveryTime ?? 0) - day(S) + 1);
    S.vil = adv.state;
    const h = S.vil.residents[v.id];
    return (h.status === 'available' && !h.isInjured && h.injuryRecoveryTime === undefined) ||
      `status=${h.status} isInjured=${h.isInjured}`;
  });

  // V4: esclusivita' — un residente away non puo' essere impegnato su una
  // seconda attivita' incompatibile (gate canonico scheduleActivity).
  t('V4 away non riassegnabile', () => {
    const S = init(21);
    const v = freeVillagers(S)[0];
    if (!schedule(S, 'quest-x', [v.id], 5, [])) return 'setup fallito';
    if (canAssign(S, v.id)) return 'away assegnabile';
    return !schedule(S, 'quest-y', [v.id], 3, []) || 'seconda attivita schedulata';
  });

  // V5: deadline-fail non lascia zombie — l'entry liveQuest sparisce e
  // una risoluzione successiva non puo' attribuire harm ai suoi membri.
  t('V5 deadline-fail rimuove liveQuest (no zombie)', () => {
    const S = init(21);
    const members = freeVillagers(S).slice(0, 2).map((v) => v.id);
    S.liveQuests.push({ instanceId: 'inst-z', defId: 'forage-hunt', resolvesAt: 99, members });
    applyMetaEvents(S, { events: [
      { kind: 'quest-deadline-fail', defId: 'forage-hunt', instanceId: 'inst-z', tick: 10 },
    ], expiredOffers: [], resolved: [] });
    if (S.liveQuests.length !== 0) return 'liveQuest zombie';
    // Ora arriva una risoluzione sconosciuta: l'harm non deve cadere su
    // membri estranei (niente fallback sull'eroe).
    const w = S.metrics.wounds + S.metrics.deaths;
    applyMetaEvents(S, { events: [
      { kind: 'quest-resolved', defId: 'forage-hunt', instanceId: 'inst-x',
        outcome: 'fail', harm: 'wound', writes: [], tick: 10 },
    ], expiredOffers: [], resolved: [] });
    return (S.metrics.wounds + S.metrics.deaths) === w || 'harm su membri sbagliati';
  });

  // V6: un evento risolto non applica due volte — la seconda emissione del
  // medesimo quest-resolved (reward + harm) e' ignorata.
  t('V6 nessuna doppia applicazione', () => {
    const S = init(21);
    const members = [hero(S).id, ...freeVillagers(S).slice(0, 1).map((v) => v.id)];
    S.liveQuests.push({ instanceId: 'inst-dup', defId: 'forage-hunt', resolvesAt: 5, members });
    const rep = { events: [
      { kind: 'quest-resolved' as const, defId: 'forage-hunt', instanceId: 'inst-dup',
        outcome: 'win' as const, harm: 'none' as const, writes: [], tick: 5 },
    ], expiredOffers: [] as string[], resolved: [] as { defId: string; outcome: 'win'; harm: 'none' }[] };
    applyMetaEvents(S, rep);
    const cibo1 = S.res.cibo;
    const out1 = { ...S.metrics.questOutcomes };
    applyMetaEvents(S, rep);
    const cibo2 = S.res.cibo;
    return (cibo2 === cibo1 && S.metrics.questOutcomes.win === out1.win) ||
      `seconda applicazione: cibo ${cibo1}→${cibo2}`;
  });

  // V7: capability reale — il trait di un residente away/injured/morto non
  // sblocca gate: la capability segue la disponibilita', non la vita.
  t('V7 niente capability fantasma da away', () => {
    const S = init(21);
    const v = freeVillagers(S)[0];
    (S.vil.residents[v.id].traits ??= []).push('stealth');
    updateParty(S);
    if (!S.meta.party.capabilities.includes('stealth')) return 'setup: stealth assente';
    S.vil.residents[v.id] = { ...S.vil.residents[v.id], status: 'away' };
    updateParty(S);
    if (S.meta.party.capabilities.includes('stealth')) return 'stealth da away';
    S.vil.residents[v.id] = { ...S.vil.residents[v.id], status: 'injured', injuryRecoveryTime: 50 };
    updateParty(S);
    return !S.meta.party.capabilities.includes('stealth') || 'stealth da injured';
  });

  // V8: coerenza aggregati — popolazione, roster e metriche non divergono:
  // vivi + morti = residenti totali; metrics.deaths = morti nel roster.
  t('V8 aggregati coerenti dopo morti/arrivi', () => {
    const S = init(21);
    applyReward(S, 'migrants-arrival', 'bigWin');    // +5 migranti
    const vs = freeVillagers(S).slice(0, 3);
    applySiegeOutcome(S, vs[0].id, 'dead', 'light');
    applyHarm(S, [vs[1].id], 'death');
    applyHarm(S, [vs[2].id], 'wound', 'epic-fail');
    const all = Object.values(S.vil.residents);
    const dead = all.filter((r) => r.status === 'dead').length;
    const alive = aliveResidents(S).length;
    if (alive + dead !== all.length) return `vivi ${alive}+morti ${dead} != ${all.length}`;
    if (S.metrics.deaths !== dead) return `metriche ${S.metrics.deaths} != morti ${dead}`;
    if (pop(S) !== aliveVillagers(S).length) return 'pop divergente';
    return true;
  });

  // V9: R-186 — il kernel condiviso governa harm/assedio/breccia: morte
  // pulisce i campi ferita; ferita su membro away in attivita' multi-giorno
  // non guarisce (e non e' riassegnabile) finche' l'attivita' non termina.
  t('V9 kernel condiviso: morte pulita + ferita mid-activity non schedulabile', () => {
    const S = init(21);
    const [w1, w2] = freeVillagers(S).slice(0, 2);
    // Morte su residente ferito: kernel azzera isInjured/injuryRecoveryTime.
    S.vil.residents[w1.id] = {
      ...S.vil.residents[w1.id],
      status: 'injured', isInjured: true, injuryRecoveryTime: day(S) + 3,
    };
    applyHarm(S, [w1.id], 'death');
    const d = S.vil.residents[w1.id];
    if (d.status !== 'dead' || d.isInjured || d.injuryRecoveryTime !== undefined || d.currentHp !== 0) {
      return `morte non pulita: ${JSON.stringify({ s: d.status, i: d.isInjured, r: d.injuryRecoveryTime, hp: d.currentHp })}`;
    }
    // Ferita mid-activity: away su job da 5g, ferita da 1g → resta injured
    // fino al completamento, mai schedulabile, poi guarisce a riposo.
    if (!schedule(S, 'quest-long', [w2.id], 5, [])) return 'schedule fallita';
    applyHarm(S, [w2.id], 'wound', 'fail'); // duration via tier fail
    const mid = advanceTime(depsOf(S), S.vil, 2).state;
    S.vil = mid;
    const r2 = S.vil.residents[w2.id];
    if (r2.status !== 'injured' || canAssign(S, w2.id)) {
      return `mid-activity: status=${r2.status}`;
    }
    // L'attivita' termina (g5): il membro torna a casa ferito, non heal mid-flight.
    S.vil = advanceTime(depsOf(S), S.vil, 3).state;
    const r3 = S.vil.residents[w2.id];
    if (r3.status === 'away') return 'ancora away dopo completamento';
    // A riposo, recovery gia' scaduto → guarisce allo sweep successivo.
    S.vil = advanceTime(depsOf(S), S.vil, (r3.injuryRecoveryTime ?? 0) - day(S) + 1).state;
    const r4 = S.vil.residents[w2.id];
    return (!r4.isInjured && (r4.status === 'available' || r4.status === 'exhausted')) ||
      `dopo riposo: status=${r4.status} isInjured=${r4.isInjured}`;
  });

  let pass = 0;
  for (const r of results) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.name}${r.note ? ` — ${r.note}` : ''}`);
    if (r.pass) pass++;
  }
  console.log(`\n${pass}/${results.length} test superati`);
  return pass === results.length ? 0 : 1;
}

/* ------------------------------------------------------------------ */

/* Tail CLI: eseguito solo quando il file e' lanciato direttamente
 * (`npx tsx tools/goblin-lab/lab.ts --...`), mai all'import del modulo
 * (vitest, pagina /macro-gameplay). `process` e' letto via globalThis per
 * restare typecheck-pulito senza @types/node in scope (vite browser). */
const cliProc = (globalThis as {
  process?: { argv?: string[]; exit?(code?: number): void };
}).process;
const isCliMain = typeof cliProc?.argv?.[1] === 'string' && /lab\.ts$/.test(cliProc.argv[1]);

if (isCliMain && cliProc) {
  const args = Object.fromEntries(
    cliProc.argv!.slice(2).filter((a) => a.startsWith('--')).map((a) => {
      const [k, v] = a.slice(2).split('=');
      return [k, v ?? true];
    }),
  );

  if (args.test) {
    cliProc.exit?.(runTests());
  } else {
    const orig = console.debug;
    console.debug = noop;
    const scenario = SCENARIOS[String(args.scenario ?? 'base')];
    if (!scenario) { console.error(`scenario sconosciuto: ${args.scenario}`); cliProc.exit?.(2); }
    else {
      const persona = PERSONAS[String(args.persona ?? 'rush')];
      if (!persona) { console.error(`persona sconosciuta: ${args.persona}`); cliProc.exit?.(2); }
      else {
        const resolver = String(args.resolver ?? 'A') as ResolverModel;
        if (!['A', 'B', 'C'].includes(resolver)) { console.error(`resolver sconosciuto: ${args.resolver}`); cliProc.exit?.(2); }
        else {
          const resolved = applyScenario(scenario, LAB_META_CONFIG, CFG as unknown as Record<string, unknown>);
          const S = run(Number(args.seed ?? 1000), Number(args.days ?? 2000), Boolean(args.verbose), resolved, persona, resolver);
          console.debug = orig;
          console.log('\n=== SUMMARY ===');
          console.log(JSON.stringify(summary(S), null, 2));
        }
      }
    }
  }
}
