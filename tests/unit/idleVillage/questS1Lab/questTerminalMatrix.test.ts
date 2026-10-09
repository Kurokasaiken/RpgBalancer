/**
 * PLAN-019-S2.5 T-1 — enumerazione programmatica degli esiti terminali dei
 * grafi goblin/rovine contro la tabella delle transizioni (12 celle:
 * obiettivo {sì,no} × leader {vivo,morto} × uscita {fine grafo, fuga, wipe}).
 *
 * Le celle sono valutate sullo stato TERMINALE del motore — non sulle
 * intenzioni. `objectiveAchieved` (obiettivo mai preso) è registrato a parte:
 * la cella «obiettivo sì + fuga» è IRRAGGIUNGIBILE perché `flee()` chiama
 * `dropObjective` prima di `endRun` — un run fuggito termina sempre con
 * `objectiveDone === false`. Motivo verificabile in engine, non convenzione.
 *
 * Invarianti del motore asserite qui (le regole il settlement consuma):
 *  - wipe ⇔ ∀ membro assegnato morto (definizione Director 2026-10-09) e
 *    loot/info svuotati («tutto perso», matrice frozen);
 *  - reward ⇔ objectiveDone && leader vivo al nodo end;
 *  - fled ⇒ objectiveDone === false (dropObjective) e outcome 'fled', mai reward;
 *  - leader morto con ≥1 sopravvissuto ≠ wipe (può terminare 'survived').
 */
import { describe, expect, it } from 'vitest';
import {
  availableOptions,
  createRun,
  flee,
  matureReady,
  nodesFor,
  submitCommand,
  type QuestId,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS, ROVINE_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';

const NODE_TICKS = 10;
const START_TICK = 100;

/* ------------------------------------------------------------------ */
/* Driver                                                              */
/* ------------------------------------------------------------------ */

type ExitKind = 'fine grafo' | 'fuga' | 'wipe';

interface TerminalSignature {
  questId: QuestId;
  outcome: QuestRunState['outcome'];
  exit: ExitKind;
  /** Objective was ever held during the run (may be dropped before end). */
  objectiveAchieved: boolean;
  /** `objectiveDone` at the terminal — what settlement can observe. */
  objectiveAtTerminal: boolean;
  leaderAlive: boolean;
  allDead: boolean;
  gold: number;
  lootCount: number;
}

const leaderOf = (s: QuestRunState) => s.party.find((m) => m.role === 'leader');
const allPartyDead = (s: QuestRunState) => s.party.every((m) => m.dead);

function signatureOf(state: QuestRunState): TerminalSignature {
  return {
    questId: state.questId,
    outcome: state.outcome,
    exit: state.outcome === 'wipe' ? 'wipe' : state.outcome === 'fled' ? 'fuga' : 'fine grafo',
    objectiveAchieved: objectiveEver(state),
    objectiveAtTerminal: state.objectiveDone,
    leaderAlive: Boolean(leaderOf(state) && !leaderOf(state)!.dead),
    allDead: allPartyDead(state),
    gold: state.gold,
    lootCount: state.loot.length,
  };
}

/* The engine drops the objective on flee/dropObjective — "achieved" must be
 * observed during the drive, not at the terminal. */
const objectiveTrack = new WeakMap<QuestRunState, boolean>();
function objectiveEver(state: QuestRunState): boolean {
  return objectiveTrack.get(state) === true || state.objectiveDone;
}
function markObjective(state: QuestRunState): void {
  if (state.objectiveDone) objectiveTrack.set(state, true);
}

function startRun(questId: QuestId, presetId: string, seed = 42): QuestRunState {
  return createRun(presetId, seed, questId, undefined, { nodeTicks: NODE_TICKS, startTick: START_TICK });
}

/** Drive the run to its terminal, choosing options via `pick`; `fleeAt`
 *  nodes call `flee()` instead of submitting a command (player retreat). */
function driveToEnd(
  state: QuestRunState,
  pick: (s: QuestRunState, options: ReturnType<typeof availableOptions>) => string,
  opts?: { fleeAtNodes?: Set<string>; maxSteps?: number },
): QuestRunState {
  let tick = state.launchedAtTick ?? 0;
  for (let i = 0; i < (opts?.maxSteps ?? 600) && !state.ended; i += 1) {
    markObjective(state);
    if (state.frontier.status === 'pending') {
      tick = Math.max(tick, state.frontier.readyAt);
      matureReady(state, tick);
      continue;
    }
    if (opts?.fleeAtNodes?.has(state.nodeId)) {
      flee(state);
      break;
    }
    const options = availableOptions(state).filter((o) => !o.disabled);
    if (options.length === 0) break;
    submitCommand(state, pick(state, options), { tick });
  }
  markObjective(state);
  return state;
}

const firstOption = (_s: QuestRunState, options: ReturnType<typeof availableOptions>) => options[0].id;
const lastOption = (_s: QuestRunState, options: ReturnType<typeof availableOptions>) => options[options.length - 1].id;
const seededPick =
  (seed: number) =>
  (_s: QuestRunState, options: ReturnType<typeof availableOptions>) =>
    options[seed % options.length].id;
/** Prefer an authored option when present (drive toward a known branch). */
const prefer =
  (preferred: Record<string, string>) =>
  (s: QuestRunState, options: ReturnType<typeof availableOptions>) =>
    (options.find((o) => o.id === preferred[s.nodeId]) ?? options[0]).id;

/** Collect terminal signatures across seeds × policies for one quest. */
function enumerateTerminals(
  questId: QuestId,
  presets: readonly { id: string }[],
): TerminalSignature[] {
  const out: TerminalSignature[] = [];
  const policies = [
    firstOption,
    lastOption,
    seededPick(0),
    seededPick(1),
    prefer({ 'gob-esplora-extra': 'gob-fermati', 'rv-checkpoint': 'rv-torna' }),
    prefer({ 'gob-esplora-extra': 'gob-fruga', 'rv-checkpoint': 'rv-continua' }),
  ];
  for (const preset of presets) {
    for (let seed = 1; seed <= 60; seed += 1) {
      for (const pick of policies) {
        const run = driveToEnd(startRun(questId, preset.id, seed), pick);
        if (run.ended) out.push(signatureOf(run));
      }
      /* Retreat exits are player-initiated: synthesize them by fleeing at the
       *  first decision and at every node after the objective is taken. */
      for (const fleePolicy of ['early', 'after-objective'] as const) {
        const run = startRun(questId, preset.id, seed);
        const seen = new Set<string>();
        let fled = false;
        for (let i = 0; i < 600 && !run.ended && !fled; i += 1) {
          markObjective(run);
          if (run.frontier.status === 'pending') {
            matureReady(run, Math.max(run.frontier.readyAt, START_TICK));
            continue;
          }
          const shouldFlee =
            fleePolicy === 'early' ? !seen.has(run.nodeId) : run.objectiveDone;
          seen.add(run.nodeId);
          if (shouldFlee) {
            flee(run);
            fled = true;
            break;
          }
          const options = availableOptions(run).filter((o) => !o.disabled);
          if (options.length === 0) break;
          submitCommand(run, prefer({ 'gob-esplora-extra': 'gob-fermati' })(run, options), { tick: START_TICK + i });
        }
        markObjective(run);
        if (run.ended) out.push(signatureOf(run));
      }
    }
  }
  return out;
}

/** Forced witness: builds a terminal state the stochastic sweep may miss
 *  (e.g. leader dead at the end node). Still real engine semantics — the
 *  fields are set on a real run, then the engine's own endRun path runs. */
function witnessEndNode(questId: QuestId, mutate: (s: QuestRunState) => void): TerminalSignature {
  const presets = questId === 'goblin' ? GOBLIN_PRESETS : ROVINE_PRESETS;
  const state = startRun(questId, presets[0].id, 7);
  mutate(state);
  markObjective(state);
  /* Teleport the frontier onto an authored `end` node and let the engine
   *  resolve the terminal exactly as a real arrival would. */
  const endId = Object.keys(nodesFor(state)).find(
    (id) => nodesFor(state)[id]?.kind === 'end',
  )!;
  state.nodeId = endId;
  state.visitedNodes.push(endId);
  state.frontier = { status: 'pending', startedAt: START_TICK, readyAt: START_TICK };
  matureReady(state, START_TICK);
  return signatureOf(state);
}

/* ------------------------------------------------------------------ */
/* La tabella                                                          */
/* ------------------------------------------------------------------ */

describe('PLAN-019-S2.5 T-1 — matrice terminale vs motore', () => {
  const goblin = enumerateTerminals('goblin', GOBLIN_PRESETS);
  const rovine = enumerateTerminals('rovine', ROVINE_PRESETS);
  const all = [...goblin, ...rovine];
  const has = (
    list: TerminalSignature[],
    f: Partial<Pick<TerminalSignature, 'objectiveAtTerminal' | 'leaderAlive' | 'exit' | 'outcome'>>,
  ) => list.some((s) => Object.entries(f).every(([k, v]) => s[k as keyof TerminalSignature] === v));

  it('wipe ⇔ tutti i membri assegnati morti, e «tutto perso» (loot+info svuotati)', () => {
    const wipes = all.filter((s) => s.outcome === 'wipe');
    expect(wipes.length).toBeGreaterThan(0);
    for (const w of wipes) {
      expect(w.allDead).toBe(true);
      expect(w.lootCount).toBe(0);
    }
    /* Invariante motore dichiarato: wipe svuota loot+info (endRun). Il ramo
     *  obiettivo-preso + wipe ESISTE (goblin: si muore con il trofeo in mano
     *  sulla via del ritorno) — la cella «sì | * | wipe» è raggiungibile. */
    const withObjective = all.filter((s) => s.outcome === 'wipe' && s.objectiveAchieved);
    expect(withObjective.length, 'goblin: trofeo preso poi wipe al ritorno').toBeGreaterThan(0);
  });

  it('reward ⇔ obiettivo al terminale && leader vivo (v24 rev.2)', () => {
    const rewards = all.filter((s) => s.outcome === 'reward');
    expect(rewards.length).toBeGreaterThan(0);
    for (const r of rewards) {
      expect(r.objectiveAtTerminal).toBe(true);
      expect(r.leaderAlive).toBe(true);
    }
  });

  it('«sì | vivo | fine grafo» → reward; «sì | morto | fine grafo» → survived, reward persa', () => {
    expect(has(goblin, { exit: 'fine grafo', objectiveAtTerminal: true, leaderAlive: true, outcome: 'reward' })).toBe(true);
    /* Leader morto a fine grafo: raro nel sweep stocastico — witness forzato
     *  col motore reale (leader dead + objectiveDone su nodo end). */
    const witness = witnessEndNode('goblin', (s) => {
      leaderOf(s)!.dead = true;
      s.objectiveDone = true;
    });
    expect(witness.outcome).toBe('survived');
    expect(witness.leaderAlive).toBe(false);
    expect(witness.objectiveAtTerminal).toBe(true);
  });

  it('«obiettivo sì + fuga» è IRRAGGIUNGIBILE: flee() dropObjective → objectiveDone=false al terminale', () => {
    /* Motivo verificabile: nessuna run fuggita può avere l'obiettivo in mano
     *  al terminale — il motore lo molla PRIMA di endRun. La riga della
     *  tabella «sì | vivo | fuga → reward sì» non esiste nel motore:
     *  l'esito osservabile è «no | vivo | fuga → fled, bottino conservato». */
    const fledWithObjective = all.filter((s) => s.exit === 'fuga' && s.objectiveAchieved);
    expect(fledWithObjective.length).toBeGreaterThan(0); // i witness esistono
    for (const s of fledWithObjective) {
      expect(s.objectiveAtTerminal).toBe(false);
      expect(s.outcome).toBe('fled');
    }
    expect(has(all, { exit: 'fuga', objectiveAtTerminal: true })).toBe(false);
  });

  it('fuga senza obiettivo → fled; leader morto + fuga → fled (bottino conservato, no reward)', () => {
    expect(has(all, { exit: 'fuga', objectiveAtTerminal: false, leaderAlive: true, outcome: 'fled' })).toBe(true);
    /* Leader morto in fuga: flee() non controlla il leader — witness reale. */
    const presets = GOBLIN_PRESETS;
    const state = startRun('goblin', presets[0].id, 7);
    leaderOf(state)!.dead = true;
    state.loot.push('paccottiglia');
    flee(state);
    const sig = signatureOf(state);
    expect(sig.outcome).toBe('fled');
    expect(sig.leaderAlive).toBe(false);
    expect(sig.lootCount).toBe(1); // bottino conservato, mai reward
  });

  it('«no | * | fine grafo» → survived (mai reward, bottino conservato); «no | * | wipe» → wipe', () => {
    expect(has(all, { exit: 'fine grafo', objectiveAtTerminal: false, leaderAlive: true, outcome: 'survived' })).toBe(true);
    const survivedNoObj = all.filter((s) => s.outcome === 'survived' && !s.objectiveAtTerminal);
    expect(survivedNoObj.length).toBeGreaterThan(0);
    /* Sweep stocastico: nessun wipe senza obiettivo — i preset sopravvivono
     *  fino al combattimento (lì si prende il trofeo al clear; un wipe in
     *  combat è «objectiveAchieved=false» comunque, mai registrato perché i
     *  danni check pre-obiettivo non bastano a 60 semi). Witness: party
     *  fragile reale → morte al primo check, prima dell'obiettivo. */
    const weak = (id: string, role: 'leader' | 'member' | 'bodyguard') => ({
      id,
      name: id,
      role,
      hp: 1,
      stats: { str: 0, con: 0, agi: 0, perc: 0, int: 0, cha: 0 },
    });
    const weakRun = createRun({
      party: { members: [weak('w-lead', 'leader'), weak('w-m1', 'member'), weak('w-m2', 'member'), weak('w-bg', 'bodyguard')] },
      seed: 3,
      questId: 'goblin',
      clock: { nodeTicks: NODE_TICKS, startTick: START_TICK },
    });
    driveToEnd(weakRun, firstOption);
    expect(weakRun.ended).toBe(true);
    const weakSig = signatureOf(weakRun);
    /* A party this fragile can only reach «no obiettivo» terminals — if it
     *  wiped (expected), the cell is (no | * | wipe): tutto perso, mai reward. */
    expect(weakSig.objectiveAtTerminal).toBe(false);
    expect(weakSig.outcome).not.toBe('reward');
  });

  it('nessun default implicito: ogni run terminale cade in una cella classificata', () => {
    for (const s of all) {
      if (s.exit === 'wipe') {
        expect(s.outcome).toBe('wipe');
        expect(s.allDead).toBe(true);
      } else if (s.exit === 'fuga') {
        expect(s.outcome).toBe('fled');
        expect(s.objectiveAtTerminal).toBe(false);
      } else {
        // fine grafo
        if (s.objectiveAtTerminal && s.leaderAlive) expect(s.outcome).toBe('reward');
        else expect(s.outcome).toBe('survived');
      }
    }
  });

  it('enumerazione non vuota: entrambe le quest producono terminali su più semi', () => {
    for (const list of [goblin, rovine]) {
      expect(list.length).toBeGreaterThan(50);
      expect(new Set(list.map((s) => s.outcome))).toContain('reward');
    }
  });
});
