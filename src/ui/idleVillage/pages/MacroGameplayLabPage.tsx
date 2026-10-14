/**
 * MacroGameplayLabPage — UI interattiva del Goblin Lab (R-190).
 *
 * Guida il simulatore d'integrazione `tools/goblin-lab/lab.ts` con pulsanti
 * in stile v0.2 (`/invasione-goblin-v02.html`), ma sui motori canonici:
 * metaLayer (board offerte/milestone), TimeEngine (residenti, fatigue,
 * ferite, esclusivita' away), missionResolver (assedi per-membro),
 * residentConsequences (kernel morti/ferite R-186).
 *
 * Modalita': manuale (il giocatore clicca le azioni e avanza i giorni)
 * oppure "Auto (persona)" che applica la policy dichiarata della persona
 * selezionata prima di avanzare il giorno — stesso loop della run CLI.
 *
 * Stato: il LabState e' mutabile in place (come da contratto del lab) e
 * vive in un ref; ogni azione forza un re-render via contatore.
 */

import React, { useCallback, useReducer, useRef, useState } from 'react';
import {
  act, advanceDay, aliveResidents, assignWorkers, build,
  CFG, clearsSiege, commitOfferToLab, day, endFidelity, freeVillagers,
  has, hero, init, nextInvasionEst, PERSONAS, policy, pop,
  report, scoutedFail, train, trainCost, trainedPresent, trnCost, trnCount,
  TAG_TRAINED,
  type LabState,
} from '../../../../tools/goblin-lab/lab';
import { LAB_META_CONFIG } from '../../../../tools/goblin-lab/labContent';
import { applyScenario, SCENARIOS } from '../../../../tools/goblin-lab/scenario';
import type { ResolverModel } from '../../../../tools/goblin-lab/resolvers';
import { offerQuests, milestoneViews } from '@/engine/metaLayer/harness';

const GATE_STYLE: Record<string, string> = {
  locked: 'bg-slate-700/60 text-slate-300',
  underprepared: 'bg-amber-800/60 text-amber-200',
  ready: 'bg-emerald-800/60 text-emerald-200',
  'over-qualified': 'bg-sky-800/60 text-sky-200',
};

const STATUS_STYLE: Record<string, string> = {
  available: 'bg-emerald-900/60 text-emerald-200',
  away: 'bg-sky-900/60 text-sky-200',
  injured: 'bg-amber-900/60 text-amber-200',
  exhausted: 'bg-orange-900/60 text-orange-200',
  dead: 'bg-red-900/60 text-red-300 line-through',
};

const btn =
  'rounded-lg border border-amber-700/40 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold ' +
  'text-amber-100 transition hover:bg-amber-900/50 disabled:cursor-not-allowed ' +
  'disabled:opacity-40 disabled:hover:bg-slate-800/80';
const btnAccent =
  'rounded-lg border border-emerald-600/50 bg-emerald-900/60 px-3 py-1.5 text-xs font-bold ' +
  'text-emerald-100 transition hover:bg-emerald-800/70 disabled:cursor-not-allowed disabled:opacity-40';

const fmtCost = (c: Record<string, number>) =>
  Object.entries(c).map(([k, v]) => `${v} ${k}`).join(', ');

/**
 * Pagina test "Macro Gameplay": gioca una campagna completa del Goblin Lab.
 */
const MacroGameplayLabPage: React.FC = () => {
  const [seedInput, setSeedInput] = useState('1000');
  const [scenarioId, setScenarioId] = useState<string>('base');
  const [personaId, setPersonaId] = useState<string>('rush');
  const [resolverId, setResolverId] = useState<ResolverModel>('A');
  const stateRef = useRef<LabState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [, bump] = useReducer((x: number) => x + 1, 0);

  const S = stateRef.current;

  const newRun = useCallback(() => {
    const resolved = applyScenario(
      SCENARIOS[scenarioId] ?? SCENARIOS.base,
      LAB_META_CONFIG,
      CFG as unknown as Record<string, unknown>,
    );
    stateRef.current = init(
      Number(seedInput) || 1000,
      resolved,
      PERSONAS[personaId] ?? PERSONAS.rush,
      resolverId,
    );
    setNotice(null);
    bump();
  }, [seedInput, scenarioId, personaId, resolverId]);

  const doAct = (fn: () => boolean | { ok: boolean; err?: string } | number | void) => {
    if (!S || S.end) return;
    const r = fn();
    setNotice(typeof r === 'object' && r && 'ok' in r && !r.ok ? `Errore: ${r.err}` : null);
    bump();
  };

  const step = (auto: boolean, n: number) => {
    if (!S || S.end) return;
    for (let i = 0; i < n && !S.end; i++) {
      if (auto) policy(S);
      advanceDay(S);
    }
    bump();
  };

  const sel =
    'rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-amber-100';

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-amber-100 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-amber-200">Test Macro Gameplay</h1>
            <p className="mt-1 text-xs text-slate-400">
              Goblin Lab sui motori canonici — metaLayer + TimeEngine + missionResolver.
              Gioca una campagna: prepara la difesa, manda quest, sopravvivi alle invasioni, uccidi il Re.
            </p>
          </div>
          <a href="/test-hub" className="text-xs text-sky-300 underline hover:text-sky-200">
            ← Test Hub
          </a>
        </header>

        {/* ---- Setup run ---- */}
        <section className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
          <label className="text-xs text-slate-300">
            Seed
            <input
              className="ml-2 w-24 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-amber-100"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-300">
            Scenario
            <select className={`ml-2 ${sel}`} value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
              {Object.keys(SCENARIOS).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-300">
            Persona (Auto)
            <select className={`ml-2 ${sel}`} value={personaId} onChange={(e) => setPersonaId(e.target.value)}>
              {Object.keys(PERSONAS).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-300">
            Resolver
            <select className={`ml-2 ${sel}`} value={resolverId} onChange={(e) => setResolverId(e.target.value as ResolverModel)}>
              {(['A', 'B', 'C'] as const).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <button className={btnAccent} onClick={newRun}>Nuova run</button>
        </section>

        {notice && (
          <div className="mb-4 rounded-lg border border-red-700/50 bg-red-950/50 px-4 py-2 text-xs text-red-200">
            {notice}
          </div>
        )}

        {!S && (
          <p className="text-sm text-slate-400">
            Scegli seed/scenario/persona/resolver e premi <b>Nuova run</b>. Deterministica: stesso seed → stessa storia.
          </p>
        )}

        {S && (
          <>
            {S.end && (
              <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-bold ${
                S.end.kind === 'win'
                  ? 'border-emerald-600/60 bg-emerald-950/60 text-emerald-200'
                  : 'border-red-700/60 bg-red-950/60 text-red-200'
              }`}>
                {S.end.kind === 'win' ? 'VITTORIA' : 'SCONFITTA'} — {S.end.why} (giorno {S.end.day})
                <span className="ml-3 font-normal text-xs opacity-80">
                  fedeltà causa: {endFidelity(S.end.why)}
                </span>
              </div>
            )}

            {/* ---- Stato villaggio ---- */}
            <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-400">Giorno / invasione</div>
                <div className="text-lg font-bold">g{day(S)}</div>
                <div className="text-xs text-slate-300">
                  prossima invasione tra {Math.max(0, S.nI - day(S))}g
                  {(() => { const e = nextInvasionEst(S); return (
                    <span className={e.defenseEst >= e.threat ? 'text-emerald-300' : 'text-red-300'}>
                      {' '}· threat ~{e.threat} vs difesa ~{Math.round(e.defenseEst)}
                    </span>
                  ); })()}
                </div>
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-400">Villaggio</div>
                <div className="text-lg font-bold">{pop(S)} villager · {trnCount(S)} milizia</div>
                <div className="text-xs text-slate-300">
                  liberi {freeVillagers(S).length} · feriti {aliveResidents(S).filter((r) => r.status === 'injured').length}
                  {' '}· pal {S.pal} trap {S.trap} olio {S.items.oil}
                </div>
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-400">Risorse</div>
                <div className="text-sm font-semibold">
                  🪵 {Math.floor(S.res.legna)} · ⛏ {Math.floor(S.res.ferro)} · 🍞 {Math.floor(S.res.cibo)} · 🪙 {Math.floor(S.res.oro)}
                </div>
                <div className="text-xs text-slate-300">fame se cibo &lt; 1 a fine giorno</div>
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-400">Eroe {hero(S).displayName ?? ''}</div>
                <div className="text-sm font-semibold">FOR {S.st.FOR} · AST {S.st.AST} · CAR {S.st.CAR}</div>
                <div className="text-xs">
                  <span className={`rounded px-1.5 py-0.5 ${STATUS_STYLE[hero(S).status]}`}>{hero(S).status}</span>
                  <span className="ml-2 text-slate-300">fatigue {Math.round(hero(S).fatigue)}</span>
                </div>
              </div>
            </section>

            {/* ---- Azioni ---- */}
            <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-300">Difesa & edifici</h2>
                <div className="flex flex-wrap gap-2">
                  {S.cfg.acts.map((a) => {
                    // 'trn' costa trnCost(n) crescente, non il cost base in cfg.acts.
                    const cost = a.id === 'trn' ? { oro: trnCost(S), cibo: 6 } : a.cost;
                    return (
                      <button key={a.id} className={btn} disabled={!!S.end || !has(S, cost)}
                        title={`${fmtCost(cost)} · ${a.t}g`}
                        onClick={() => doAct(() => act(S, a.id))}>
                        {a.label} <span className="opacity-70">({fmtCost(cost)})</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {S.cfg.buildings.map((b) => (
                    <button key={b.id} className={btn}
                      disabled={!!S.end || !has(S, b.cost) || S.buildings[b.id].n >= b.max}
                      title={`${fmtCost(b.cost)} · ${b.t}g · max ${b.max}`}
                      onClick={() => doAct(() => build(S, b.id))}>
                      {b.label} {S.buildings[b.id].n}/{b.max} <span className="opacity-70">({fmtCost(b.cost)})</span>
                    </button>
                  ))}
                </div>
                <h3 className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-amber-300/80">Addestramento eroe</h3>
                <div className="flex flex-wrap gap-2">
                  {(['FOR', 'AST', 'CAR'] as const).map((k) => (
                    <button key={k} className={btn}
                      disabled={!!S.end || hero(S).status !== 'available' || !has(S, { oro: trainCost(S, S.st[k]), cibo: 8 })}
                      title={`${trainCost(S, S.st[k])} oro + 8 cibo · l'eroe e' impegnato 4g`}
                      onClick={() => doAct(() => train(S, k))}>
                      +{k} <span className="opacity-70">({trainCost(S, S.st[k])} oro)</span>
                    </button>
                  ))}
                </div>
                <h3 className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-amber-300/80">Lavoro (giorni-persona)</h3>
                <div className="flex flex-wrap gap-2">
                  {S.cfg.jobs.map((j) => (
                    <button key={j.id} className={btn}
                      disabled={!!S.end || freeVillagers(S).length === 0}
                      title={`1 villager → ${j.rate}/giorno di ${j.labRes}`}
                      onClick={() => doAct(() => assignWorkers(S, j.id, 1))}>
                      {j.label} +1
                    </button>
                  ))}
                  <button className={btn} disabled={!!S.end || freeVillagers(S).length === 0}
                    onClick={() => doAct(() => S.cfg.jobs.forEach((j) => assignWorkers(S, j.id, 1)))}>
                    Tutti i liberi al lavoro
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-slate-500">
                  Addestra costa {trnCost(S)} oro + 6 cibo e occupa villager liberi per 3g.
                  Le azioni occupano i villager via TimeEngine: chi lavora non difende.
                </p>
              </section>

              {/* ---- Board quest ---- */}
              <section className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-300">Board quest</h2>
                <div className="space-y-2">
                  {offerQuests(S.meta).length === 0 && (
                    <p className="text-xs text-slate-500">Nessuna offerta sulla board.</p>
                  )}
                  {offerQuests(S.meta).map((o) => (
                    <div key={o.instanceId}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/40 bg-slate-800/60 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold">
                          {o.def.id}
                          <span className="ml-2 rounded bg-slate-700/70 px-1.5 py-0.5 text-[10px] text-slate-300">
                            {o.def.family} · t{o.def.tier}
                          </span>
                          {clearsSiege(S, o) && (
                            <span className="ml-2 rounded bg-red-800/60 px-1.5 py-0.5 text-[10px] text-red-200">RE</span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-400">
                          <span className={`rounded px-1.5 py-0.5 ${GATE_STYLE[o.gate.state]}`}>{o.gate.state}</span>
                          <span className="ml-2">fail ~{Math.round(scoutedFail(S, o.instanceId) * 100)}%</span>
                          <span className="ml-2">durata {o.def.durationTicks}g</span>
                          <span className="ml-2">scade tra {o.ticksToExpiry}g</span>
                          {o.gate.willExceedCompletion && <span className="ml-2 text-red-300">oltre deadline</span>}
                        </div>
                      </div>
                      <button className={btnAccent}
                        disabled={!!S.end || o.gate.state === 'locked' || hero(S).status !== 'available'}
                        onClick={() => doAct(() => commitOfferToLab(S, o.instanceId))}>
                        Accetta
                      </button>
                    </div>
                  ))}
                </div>

                {S.liveQuests.length > 0 && (
                  <>
                    <h3 className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-amber-300/80">Quest in corso</h3>
                    <div className="space-y-1">
                      {S.liveQuests.map((q) => (
                        <div key={q.instanceId} className="text-[11px] text-slate-300">
                          {q.defId} — risolve g{q.resolvesAt} · membri {q.members.join(', ')}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <h3 className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-amber-300/80">Milestone</h3>
                <div className="space-y-1">
                  {milestoneViews(S.meta).map((m) => (
                    <div key={m.id} className="text-[11px] text-slate-300">
                      {m.label}: {m.openApproachIndexes.length}/{m.approaches.length} approcci aperti
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* ---- Avanzamento + roster ---- */}
            <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-300">Tempo</h2>
                <div className="flex flex-wrap gap-2">
                  <button className={btnAccent} disabled={!!S.end} onClick={() => step(false, 1)}>
                    Avanza 1 giorno
                  </button>
                  <button className={btn} disabled={!!S.end} onClick={() => step(true, 1)}
                    title="Applica la policy della persona selezionata, poi avanza">
                    Auto 1g ({S.persona.id})
                  </button>
                  <button className={btn} disabled={!!S.end} onClick={() => step(true, 10)}>
                    Auto 10g
                  </button>
                  <button className={btn} disabled={!!S.end} onClick={() => step(true, 50)}>
                    Auto 50g
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-slate-500">
                  In "Auto" la persona {S.persona.id} v{S.persona.version} decide (soglie o EV);
                  "Avanza 1 giorno" applica solo le tue scelte. L'invasione scatta a g{S.nI}.
                </p>
              </section>

              <section className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-300">Roster</h2>
                <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
                  {aliveResidents(S).map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate">
                        {r.isHero ? '★ ' : ''}{r.displayName ?? r.id}
                        {(r.traits ?? []).includes(TAG_TRAINED) && (
                          <span className="ml-1 rounded bg-amber-800/50 px-1 text-[9px] text-amber-200">milizia</span>
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-slate-500">fat {Math.round(r.fatigue)}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-slate-500">
                  trained presenti oggi: {trainedPresent(S).length} · vittime {S.metrics.deaths} · ferite {S.metrics.wounds}
                </p>
              </section>
            </div>

            {/* ---- Log + report ---- */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-300">Log</h2>
                <div className="max-h-64 space-y-0.5 overflow-y-auto font-mono text-[11px] text-slate-300">
                  {S.log.slice(-60).map((l, i) => <div key={i}>{l}</div>)}
                  {S.log.length === 0 && <div className="text-slate-600">— nessun evento —</div>}
                </div>
              </section>
              <section className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-300">Report</h2>
                <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap font-mono text-[10px] text-slate-300">
                  {JSON.stringify(report(S), null, 2)}
                </pre>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MacroGameplayLabPage;
