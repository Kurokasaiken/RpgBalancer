/**
 * QuestS1LabPage — isolated lab for PLAN-019-S1 «La cassa delle sementi».
 *
 * Route: /quest-s1-lab (dev only). Not wired to village/POI persistence:
 * state lives in React useState and resets freely.
 * Visual language mirrors QuestDetailPanel; party members render through the
 * canonical WanderlustRosterCard; checks show the baptized skill-check
 * component DestinyAstrolabeV62 (route /minimal-destiny-astrolabe-v6-2) with
 * config.mode forced to the resolved verdict (the engine decides, the
 * astrolabe shows it).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PARTY_PRESETS, PRIMARY_STATS, QUEST_BEATS, SCENARIO_NODES } from '@/ui/idleVillage/questS1Lab/questScenario';
import {
  applyChoice,
  availableOptions,
  createRun,
  flee,
  drinkPotion,
  previewOption,
} from '@/ui/idleVillage/questS1Lab/questRun';

import type { QuestRunState, ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import { WanderlustRosterCard } from '@/ui/idleVillage/roster';
import { DestinyAstrolabeV62Standalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit';
import { PgCardKitShell } from '@/ui/idleVillage/frozen/kits/pgcardKit';
import { WanderlustAmbientField } from '@/ui/wanderlust-surface/layout';

/* Painted Wanderlust assets (art_direction_plan.md — Wilderness pillar). */
const ART = {
  map: '/Map finale.jpg',
  mountains: '/assets/world/wanderlust/base/layers/Zona montana nord.webp',
  village: '/assets/world/wanderlust/base/layers/Villaggio.webp',
  goblinTotem: '/mockups/goblin-invasion-painted/goblin-invasion-hero.png',
  goblinMarch: '/goblin-march-trasparente.png',
} as const;

/** Scene art per quest node — the Passo, the goblin camp, the village. */
const NODE_ART: Record<string, { src: string; fit: 'contain' | 'cover' }> = {
  viaggio: { src: ART.mountains, fit: 'contain' },
  incidente: { src: ART.mountains, fit: 'contain' },
  avvistamento: { src: ART.mountains, fit: 'contain' },
  approccio: { src: ART.goblinTotem, fit: 'contain' },
  'check-ingresso-agi': { src: ART.goblinTotem, fit: 'contain' },
  'check-ingresso-cha': { src: ART.goblinTotem, fit: 'contain' },
  'check-ingresso-laterale': { src: ART.goblinTotem, fit: 'contain' },
  'check-ingresso-forza': { src: ART.goblinMarch, fit: 'contain' },
  perquisizione: { src: ART.goblinTotem, fit: 'contain' },
  torre: { src: ART.goblinTotem, fit: 'contain' },
  'check-gabbia': { src: ART.goblinTotem, fit: 'contain' },
  obiettivo: { src: ART.goblinMarch, fit: 'contain' },
  'rientra-o-rischi': { src: ART.goblinTotem, fit: 'contain' },
  'check-forziere': { src: ART.goblinTotem, fit: 'contain' },
  risveglio: { src: ART.goblinMarch, fit: 'contain' },
  ritorno: { src: ART.village, fit: 'contain' },
};

const OUTCOME_LABEL: Record<QuestRunState['outcome'], string> = {
  running: '',
  reward: 'VITTORIA — reward ottenuta',
  survived: 'Sopravvissuti — senza reward',
  fled: 'Fuga — quest fallita, bottino conservato',
  wipe: 'WIPE — si perde tutto',
};

const LOG_STYLE: Record<string, string> = {
  CHECK: 'text-sky-300',
  WOUND: 'text-amber-400',
  DEATH: 'text-red-400',
  DEATH_SAVE: 'text-emerald-300',
  INTERCEPT: 'text-purple-300',
  LOOT: 'text-yellow-300',
  INFO: 'text-teal-300',
  HARM: 'text-orange-400',
  QUEST_END: 'text-amber-200 font-bold',
  RETREAT: 'text-slate-300',
  CHOICE: 'text-slate-400',
  NODE: 'text-amber-100/80 font-semibold',
};

const ROLE_LABEL: Record<string, string> = {
  leader: 'Leader',
  bodyguard: 'Guardia del corpo',
  member: 'Membro',
};

/** Compact stat line — stats drive approach choice, so they must be readable. */
const statLine = (m: { stats: Record<string, number> }) =>
  `F${m.stats.str} · C${m.stats.con} · A${m.stats.agi} · P${m.stats.perc} · I${m.stats.int} · H${m.stats.cha}`;

const STAT_SHORT: Record<string, string> = {
  str: 'FOR', con: 'COS', agi: 'AGI', perc: 'PER', int: 'INT', cha: 'CAR',
};

/**
 * Party card: roster visual + per-stat values as readable chips.
 * The stat chips show who is strong at what — no mental math needed.
 */
const PartyStrip: React.FC<{
  member: QuestRunState['party'][number];
  hasPotion?: boolean;
  onUsePotion?: () => void;
}> = ({ member, hasPotion, onUsePotion }) => {
  const state = member.dead ? 'Morto' : member.wounded ? 'Ferito' : null;
  const subtitle = [ROLE_LABEL[member.role], state].filter(Boolean).join(' · ');
  const best = Math.max(...Object.values(member.stats));
  return (
    <div
      className={[
        'rounded-2xl',
        member.dead ? 'opacity-45 grayscale' : '',
        member.wounded && !member.dead ? 'ring-1 ring-amber-400/60' : '',
      ].join(' ')}
    >
      <WanderlustRosterCard
        workerId={member.id}
        label={member.name}
        subtitle={subtitle}
        hp={member.hp}
        maxHp={member.maxHp}
        fatigue={member.wounded ? 50 : 0}
        portraitUrl={member.portrait}
        isInteractive={false}
        statusLabel={state ?? 'In forze'}
      />
      <div className="flex flex-wrap gap-1 px-2 pb-1.5">
        {Object.entries(member.stats).map(([k, v]) => (
          <span
            key={k}
            className={[
              'rounded px-1 py-px font-mono text-[9px] tracking-wider',
              v === best ? 'bg-amber-400/15 text-amber-300' : 'bg-slate-800/60 text-slate-500',
            ].join(' ')}
            title={k}
          >
            {STAT_SHORT[k]} {v}
          </span>
        ))}
      </div>
      {hasPotion && member.wounded && !member.dead && onUsePotion && (
        <button
          onClick={onUsePotion}
          className="mx-2 mb-2 w-[calc(100%-1rem)] rounded-lg border border-teal-400/60 bg-teal-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300 transition hover:bg-teal-500/30"
        >
          ⚗ Pozione → cura {member.name}
        </button>
      )}
    </div>
  );
};

const Kicker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[10px] uppercase tracking-[0.3em] text-amber-200/80">{children}</div>
);

/** Quest progress — POI-quest pattern (desiderata v4): when full, the quest is done. */
const QuestProgress: React.FC<{ beat: number; ended: boolean }> = ({ beat, ended }) => (
  <div className="flex items-center gap-1.5">
    {QUEST_BEATS.map((label, i) => {
      const done = ended || i < beat;
      const active = !ended && i === beat;
      return (
        <div key={label} className="flex items-center gap-1.5" title={label}>
          <div
            className={[
              'h-2.5 w-2.5 rotate-45 border transition-all duration-500',
              done
                ? 'border-amber-300 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]'
                : active
                  ? 'animate-pulse border-amber-300/80 bg-amber-500/30'
                  : 'border-slate-700 bg-slate-900',
            ].join(' ')}
          />
          {i < QUEST_BEATS.length - 1 && (
            <div className={`h-px w-4 transition-colors duration-500 ${done ? 'bg-amber-500/60' : 'bg-slate-800'}`} />
          )}
        </div>
      );
    })}
  </div>
);

/** Camp alertness — the accumulating danger meter. 3 ticks = the thing wakes. */
const NoiseMeter: React.FC<{ noise: number }> = ({ noise }) => {
  const labels = ['QUIETO', 'SOSPETTO', 'ALLARME', 'RISVEGLIO'];
  // The threat must be felt BEFORE it fires: name what is stirring under the
  // meter so cautious players see what they avoided and reckless ones see it
  // coming.
  const threat =
    noise >= 3 ? '◈ si è svegliata' : noise === 2 ? '◈ si sta svegliando' : noise === 1 ? '◈ si agita nel sonno' : null;
  return (
    <div
      className="rounded-lg border border-white/10 bg-slate-950/50 px-2.5 py-1.5"
      title="Il rumore accumula: ogni fallimento dentro il campo lo fa salire. A 3 tacche qualcosa si sveglia."
    >
      <div className="flex items-center gap-2">
        <span className="text-[9px] uppercase tracking-[0.25em] text-slate-400">Rumore</span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={[
                'h-2 w-5 rounded-full transition-all duration-500',
                i < noise
                  ? noise >= 3 || i === 2
                    ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                    : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                  : 'bg-slate-800',
              ].join(' ')}
            />
          ))}
        </div>
        <span
          className={[
            'text-[9px] font-semibold uppercase tracking-[0.2em]',
            noise >= 2 ? 'text-red-300' : noise === 1 ? 'text-amber-300' : 'text-slate-400',
          ].join(' ')}
        >
          {labels[Math.min(noise, 3)]}
        </span>
      </div>
      {threat && (
        <div className={`mt-1 text-[9px] uppercase tracking-[0.2em] ${noise >= 3 ? 'text-red-400' : 'text-slate-500'}`}>
          {threat} — la torre
        </div>
      )}
    </div>
  );
};

/** Random seed for a new run — lab only, called from event handlers. */
const rollSeed = () => Math.floor(Math.random() * 100000);

const QuestS1LabPage: React.FC = () => {
  const [seed, setSeed] = useState<number>(rollSeed);
  const [run, setRun] = useState<QuestRunState | null>(null);
  // Every check resolved by the last action gets its own astrolabe beat —
  // the queue preserves the order so chained checks all get the cinematic.
  const [checkQueue, setCheckQueue] = useState<{ id: string; check: ResolvedCheck }[]>([]);
  const [checkIdx, setCheckIdx] = useState(0);
  const [checkResolved, setCheckResolved] = useState(false);
  // Burst counter: every action's queue gets unique ids so the astrolabe
  // remounts per check instead of reusing the previous burst's mount.
  const burstRef = useRef(0);
  // Commit surface: a check option expands into spend-consumable / commit /
  // retreat choices before resolving. Consumable is armed by default.
  const [commitOptionId, setCommitOptionId] = useState<string | null>(null);
  const [useConsumable, setUseConsumable] = useState(true);
  // Phase timing: beats resolve one at a time with real time between (v4 pattern).
  const [shownNodeId, setShownNodeId] = useState<string | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!run) {
      setShownNodeId(null);
      return;
    }
    if (shownNodeId === run.nodeId || shownNodeId === null) {
      setShownNodeId(run.nodeId);
      return;
    }
    setCommitOptionId(null);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => setShownNodeId(run.nodeId), 900);
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, [run, shownNodeId]);

  const startRun = (id: string) => {
    const s = rollSeed();
    setSeed(s);
    setCheckQueue([]);
    setRun(createRun(id, s));
  };

  const reset = () => {
    setRun(null);
    setCheckQueue([]);
  };

  const choose = (optionId: string, spendConsumable = true) => {
    // The engine mutates run state in place; call it outside the updater so
    // React StrictMode's double-invoked updaters can't double-apply effects.
    if (!run) return;
    const next = applyChoice(run, optionId, { useConsumable: spendConsumable });
    if (next.checkQueue.length > 0) {
      burstRef.current += 1;
      const burst = burstRef.current;
      setCheckQueue(next.checkQueue.map((check, i) => ({ id: `b${burst}-${i}`, check })));
      setCheckIdx(0);
      setCheckResolved(false);
    }
    setCommitOptionId(null);
    setRun({ ...next });
  };

  const currentNode = useMemo(
    () => (run ? SCENARIO_NODES[shownNodeId ?? run.nodeId] : null),
    [run, shownNodeId],
  );

  const activeCheck = checkQueue[checkIdx]?.check;
  /* The engine already resolved verdict AND harm; the astrolabe only paints it.
   * A fail that actually hurt someone lands the ball in the wound/death zones;
   * the wound/dead band widths are the check's real per-slot risk. */
  const activeMode =
    activeCheck?.verdict === 'fail' && activeCheck.harm === 'death'
      ? 'fail_dead'
      : activeCheck?.verdict === 'fail' && activeCheck.harm === 'wound'
        ? 'fail_wound'
        : activeCheck?.verdict;

  /* ---------------- Preset selection ---------------- */
  if (!run) {
    return (
      <WanderlustAmbientField className="min-h-screen bg-[#0a0d12] text-ivory" fireflyCount={5}>
        {/* Cinematic header — the painted Wanderlust world map */}
        <div className="relative h-44 overflow-hidden md:h-56">
          <img
            src={ART.map}
            alt=""
            className="h-full w-full object-cover opacity-70"
            style={{ objectPosition: '50% 30%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0a0d12]" />
          <div className="absolute bottom-4 left-6 md:left-10">
            <Kicker>Lab isolato · S1</Kicker>
            <h1 className="text-3xl font-semibold text-amber-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              La cassa delle sementi
            </h1>
          </div>
        </div>
        <div className="p-6 md:p-10">
        <p className="mb-3 max-w-2xl text-sm text-slate-400">
          Obiettivo: riportare la cassa delle sementi dal Passo del Corvo. Il leader deve sopravvivere
          per ottenere la reward. Scegli la spedizione:
        </p>
        {/* Declared primary stats — the player must know a priori which
            party solves this quest. Every mandatory check uses these. */}
        <div className="mb-8 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-sky-300">
          <span className="rounded-md border border-sky-400/50 bg-sky-950/40 px-2 py-0.5">
            ★ Prova di infiltrazione — {PRIMARY_STATS.map((s) => STAT_SHORT[s]).join(' + ')}
          </span>
          <span className="normal-case tracking-normal text-slate-500">
            quasi tutti i check si risolvono con queste stat
          </span>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {PARTY_PRESETS.map((p) => (
            <section
              key={p.id}
              className="rounded-3xl border border-amber-400/40 bg-black/75 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.65)] backdrop-blur"
            >
              <header className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <Kicker>Spedizione</Kicker>
                  <div className="mt-1 text-lg font-semibold text-ivory">{p.label}</div>
                  <div className="text-xs text-slate-400">{p.description}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="rounded-full border border-amber-300/60 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-amber-200">
                    {p.gold} gold
                  </span>
                  <span className="rounded-full border border-sky-400/40 bg-sky-950/40 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-sky-300">
                    ★ {PRIMARY_STATS.map((s) => `${STAT_SHORT[s]} ${Math.max(...p.members.map((m) => m.stats[s]))}`).join(' · ')}
                  </span>
                </div>
              </header>
              <div className="space-y-2">
                {p.members.map((m) => (
                  <div key={m.id} className="rounded-lg">
                    <WanderlustRosterCard
                      workerId={m.id}
                      label={m.name}
                      subtitle={`${ROLE_LABEL[m.role]} · ${statLine(m)}`}
                      hp={10}
                      maxHp={10}
                      fatigue={0}
                      portraitUrl={m.portrait}
                      isInteractive={false}
                      compact
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => startRun(p.id)}
                  className="rounded-xl border border-amber-300/60 bg-amber-500/10 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200 transition hover:bg-amber-500/20"
                >
                  Parti
                </button>
              </div>
            </section>
          ))}
        </div>
        </div>
      </WanderlustAmbientField>
    );
  }

  const options = availableOptions(run);
  const hasPotion = run.flags.includes('hasPozione');
  const sceneArt = run ? NODE_ART[shownNodeId ?? run.nodeId] : undefined;
  const inTransition = !run.ended && shownNodeId !== null && shownNodeId !== run.nodeId;
  const currentBeat = currentNode?.beat ?? 0;

  /* ---------------- Run view ---------------- */
  return (
    <WanderlustAmbientField className="min-h-screen bg-[#0a0d12] text-ivory" fireflyCount={4}>
      <div className="p-6 md:p-10">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <Kicker>Lab isolato · S1 · seed {seed}</Kicker>
          <h1 className="text-2xl font-semibold text-amber-100">La cassa delle sementi</h1>
          <div className="mt-2">
            <QuestProgress beat={currentBeat} ended={run.ended} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!run.ended && (
            <button
              onClick={() => setRun({ ...flee(run) })}
              className="rounded-xl border border-red-400/50 bg-red-950/30 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-red-300 transition hover:bg-red-950/60"
            >
              Ritirati
            </button>
          )}
          <button
            onClick={reset}
            className="rounded-xl border border-slate-600/60 bg-slate-900/50 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-slate-300 transition hover:bg-slate-800"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Party */}
        <section className="space-y-3">
          <Kicker>Spedizione</Kicker>
          {run.party.map((m) => (
            <PartyStrip
              key={m.id}
              member={m}
              hasPotion={hasPotion}
              onUsePotion={() => setRun({ ...drinkPotion(run, 'hasPozione') })}
            />
          ))}
          <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs text-slate-300">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-amber-300/60 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-amber-200">
                {run.gold} gold
              </span>
              <NoiseMeter noise={run.noise} />
              {run.objectiveDone && (
                <span className="rounded-full border border-emerald-400/60 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-emerald-300">
                  Cassa recuperata
                </span>
              )}
            </div>
            {/* Consumables owned — visibility matters (Director feedback) */}
            {run.flags.some((f) => f.startsWith('has')) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {run.flags.includes('hasPozione') && (
                  <span className="rounded-md border border-teal-400/40 bg-teal-950/40 px-2 py-0.5 text-[10px] text-teal-300">
                    ⚗ Pozione — cura un ferito
                  </span>
                )}
                {run.flags.includes('hasFumogeno') && (
                  <span className="rounded-md border border-teal-400/40 bg-teal-950/40 px-2 py-0.5 text-[10px] text-teal-300">
                    ✦ Fumogeno — +15 infiltrazione
                  </span>
                )}
                {run.flags.includes('hasCorda') && (
                  <span className="rounded-md border border-teal-400/40 bg-teal-950/40 px-2 py-0.5 text-[10px] text-teal-300">
                    🪢 Corda — +15 arrampicata
                  </span>
                )}
              </div>
            )}
            {run.loot.length > 0 && <div className="mt-2">Bottino: {run.loot.join(', ')}</div>}
            {run.info.length > 0 && <div className="mt-1 text-slate-400">Info: {run.info.join(', ')}</div>}
          </div>
        </section>

        {/* Situation + choices */}
        <section className="rounded-3xl border border-amber-400/40 bg-black/75 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.65)] backdrop-blur">
          {/* Scene art — painted Wanderlust layer for the current node */}
          {sceneArt && (
            <div className="relative mb-4 flex h-28 items-end justify-center overflow-hidden rounded-2xl border border-white/10">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse 70% 90% at 50% 80%, rgba(216,177,62,0.14), transparent 70%), linear-gradient(180deg, rgba(10,13,18,0.4), rgba(10,13,18,0.9))',
                }}
              />
              <img
                src={sceneArt.src}
                alt=""
                className="relative h-full w-auto max-w-full object-contain object-bottom drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
              />
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}
          <header className="mb-3">
            <Kicker>Situazione</Kicker>
            <div className="mt-1 text-lg font-semibold text-ivory">{currentNode?.title}</div>
          </header>
          <p className="mb-3 text-sm text-slate-300">{currentNode?.body}</p>
          <p className="mb-4 rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm italic text-amber-200/80">
            {run.lastEvent}
          </p>
          {run.ended ? (
            <div className="rounded-2xl border border-amber-400/60 bg-amber-950/30 p-4 text-center text-sm font-bold uppercase tracking-[0.2em] text-amber-200">
              {OUTCOME_LABEL[run.outcome]}
            </div>
          ) : inTransition ? (
            <div className="flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 text-[11px] uppercase tracking-[0.3em] text-slate-500">
              La spedizione avanza…
            </div>
          ) : (
            <div className="space-y-2">
              {options.map((o) => {
                const committed = commitOptionId === o.id;
                const pv = previewOption(run, o.id, {
                  useConsumable: committed ? useConsumable : true,
                });
                return (
                  <div
                    key={o.id}
                    className={[
                      'w-full rounded-2xl border bg-slate-900/60 transition',
                      committed
                        ? 'border-amber-300/80 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
                        : 'border-amber-300/30 hover:border-amber-300/60 hover:bg-slate-800',
                      o.disabled ? 'cursor-not-allowed opacity-40' : '',
                    ].join(' ')}
                  >
                  <button
                    disabled={o.disabled}
                    onClick={() => {
                      if (!pv) {
                        choose(o.id);
                        return;
                      }
                      setCommitOptionId(committed ? null : o.id);
                      setUseConsumable(true);
                    }}
                    className="w-full px-4 py-3 text-left disabled:cursor-not-allowed"
                  >
                    <span className="block text-sm font-medium text-ivory">
                      {o.label}
                      {o.costGold ? <span className="ml-2 text-xs text-amber-300">({o.costGold} gold)</span> : null}
                      {pv && !committed && (
                        <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                          ▸ valuta
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-slate-400">{o.detail}</span>
                    {pv && (
                      <span className="mt-2 block space-y-1.5">
                        {/* Who carries the roll — one chip per stat with the best member */}
                        <span className="flex flex-wrap gap-1.5">
                          {pv.contributors.map((c) => (
                            <span
                              key={c.stat}
                              className={[
                                'rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider',
                                (PRIMARY_STATS as readonly string[]).includes(c.stat)
                                  ? 'border-amber-300/60 bg-amber-950/40 text-amber-200'
                                  : 'border-sky-400/30 bg-sky-950/40 text-sky-200',
                              ].join(' ')}
                            >
                              {(PRIMARY_STATS as readonly string[]).includes(c.stat) && '★ '}
                              {c.label} <b className="text-sky-100">{c.bestValue}</b>
                              <span className="ml-1 text-sky-400/80 normal-case tracking-normal">
                                {c.bestName}
                              </span>
                            </span>
                          ))}
                        </span>
                        {/* Success bar + risk */}
                        <span className="flex items-center gap-3">
                          <span className="flex-1">
                            <span className="block h-1.5 overflow-hidden rounded-full bg-slate-800">
                              <span
                                className="block h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500"
                                style={{ width: `${pv.successPct}%` }}
                              />
                            </span>
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-emerald-300">
                            ~{pv.successPct}% riuscita
                          </span>
                          {(pv.woundPct > 0 || pv.deathPct > 0) && (
                            <span className="flex gap-1.5">
                              {pv.woundPct > 0 && (
                                <span className="rounded-md border border-amber-500/40 bg-amber-950/40 px-1.5 py-0.5 text-[10px] text-amber-300">
                                  ferita {pv.woundPct}%
                                </span>
                              )}
                              {pv.deathPct > 0 && (
                                <span className="rounded-md border border-red-500/40 bg-red-950/40 px-1.5 py-0.5 text-[10px] text-red-300">
                                  morte {pv.deathPct}%
                                </span>
                              )}
                            </span>
                          )}
                        </span>
                        {pv.interceptor && (pv.woundPct > 0 || pv.deathPct > 0) && (
                          <span className="block rounded-md border border-purple-400/40 bg-purple-950/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-purple-300">
                            🛡 {pv.interceptor.name} copre i colpi — ferita {pv.interceptor.woundPct}%,
                            morte {pv.interceptor.deathPct}% per lui
                          </span>
                        )}
                        {pv.intelLabel && (
                          <span className="block rounded-md border border-emerald-400/40 bg-emerald-950/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300">
                            ✧ Info: {pv.intelLabel} (+{pv.intelBonus})
                          </span>
                        )}
                        {pv.consumableLabel && !committed && (
                          <span className="block rounded-md border border-teal-400/40 bg-teal-950/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-teal-300">
                            ✦ {pv.consumableLabel} disponibile: +{pv.consumableBonus} al tiro
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                  {/* Commit surface — spend the consumable or not, or walk away */}
                  {committed && pv && (
                    <div className="space-y-2 border-t border-amber-300/20 px-4 pb-3 pt-2">
                      {pv.consumableLabel && (
                        <button
                          onClick={() => setUseConsumable(!useConsumable)}
                          className={[
                            'flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] transition',
                            useConsumable
                              ? 'border-teal-300/70 bg-teal-500/15 text-teal-200'
                              : 'border-slate-600/60 bg-slate-900/50 text-slate-400',
                          ].join(' ')}
                        >
                          <span>
                            ✦ {pv.consumableLabel} {useConsumable ? `— armato (+${pv.consumableBonus})` : '— resta nella sacca'}
                          </span>
                          <span className={useConsumable ? 'text-teal-300' : 'text-slate-500'}>
                            {useConsumable ? '◉' : '○'}
                          </span>
                        </button>
                      )}
                      {/* Per-slot risk — chi è esposto e chi è coperto.
                          Il bodyguard assorbe i colpi altrui: gli altri
                          restano esposti solo ai rischi non intercettabili. */}
                      {pv.perSlot.some((m) => m.woundPct > 0 || m.deathPct > 0) && (
                        <div className="flex flex-wrap gap-1.5">
                          {pv.perSlot.map((m) => (
                            <span
                              key={m.id}
                              className={[
                                'rounded-md border px-2 py-0.5 text-[10px] tracking-wider',
                                pv.interceptor?.name === m.name
                                  ? 'border-purple-400/50 bg-purple-950/40 text-purple-200'
                                  : m.wounded
                                    ? 'border-red-400/50 bg-red-950/40 text-red-300'
                                    : 'border-slate-500/40 bg-slate-900/50 text-slate-300',
                              ].join(' ')}
                              title={m.wounded ? 'già ferito: rischio maggiorato' : m.role}
                            >
                              {pv.interceptor?.name === m.name && '🛡 '}
                              {m.name} F{m.woundPct}% · M{m.deathPct}%
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => choose(o.id, useConsumable)}
                          className="flex-1 rounded-xl border border-amber-300/70 bg-amber-500/15 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200 transition hover:bg-amber-500/30"
                        >
                          Affronta il check · ~{pv.successPct}%
                        </button>
                        <button
                          onClick={() => setRun({ ...flee(run) })}
                          className="rounded-xl border border-red-400/50 bg-red-950/30 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-red-300 transition hover:bg-red-950/60"
                          title="Abbandoni la quest: tieni il bottino ma niente reward"
                        >
                          Ritirati
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Chronicle */}
        <section className="rounded-3xl border border-slate-800/70 bg-black/75 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.65)] backdrop-blur">
          <Kicker>Cronaca</Kicker>
          <div className="mt-3 max-h-[70vh] space-y-1 overflow-y-auto font-mono text-xs">
            {run.log.map((e, i) => (
              <div key={i} className={LOG_STYLE[e.kind] ?? 'text-slate-400'}>
                <span className="text-slate-600">[{e.kind}]</span> {e.text}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Check cinematics — the engine already resolved; each check in the
          burst gets its own astrolabe beat, played in order. */}
      {checkQueue.length > 0 && checkQueue[checkIdx] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative h-[70vh] w-[70vw] overflow-hidden rounded-3xl border border-amber-400/40">
            {checkQueue.length > 1 && (
              <div className="absolute left-4 top-4 z-10 rounded-full border border-amber-300/50 bg-black/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-amber-200">
                Tiro {checkIdx + 1} di {checkQueue.length}
              </div>
            )}
            <DestinyAstrolabeV62Standalone
              key={checkQueue[checkIdx].id}
              skills={[{ name: activeCheck?.title ?? '', stat: activeCheck?.score ?? 50, difficulty: 50 }]}
              config={{
                mode: activeMode,
                wound: activeCheck?.woundPct ?? 0,
                dead: activeCheck?.deathPct ?? 0,
                harm: activeCheck?.harm ?? 'none',
              }}
              onResolve={() => setCheckResolved(true)}
              autoStart
            />
            {checkResolved && (
              <button
                className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-amber-300/60 bg-black/80 px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200 transition hover:bg-amber-950/60"
                onClick={() => {
                  if (checkIdx + 1 >= checkQueue.length) {
                    setCheckQueue([]);
                    setCheckIdx(0);
                  } else {
                    setCheckIdx(checkIdx + 1);
                  }
                  setCheckResolved(false);
                }}
              >
                {checkQueue[checkIdx].check.verdict} — continua
              </button>
            )}
          </div>
        </div>
      )}
      </div>
    </WanderlustAmbientField>
  );
};

const WrappedQuestS1LabPage: React.FC = () => (
  <PgCardKitShell>
    <QuestS1LabPage />
  </PgCardKitShell>
);

export default WrappedQuestS1LabPage;
