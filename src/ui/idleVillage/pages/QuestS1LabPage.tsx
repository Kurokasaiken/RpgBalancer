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
 *
 * i18n split: all UI chrome goes through `useTranslation('idleVillage')` under
 * the `questS1Lab.*` keys. Authored narrative (node titles/bodies, option
 * labels, chronicle text in questScenario/questRun) stays in the scenario
 * file as content data — quest content belongs to the content pipeline (S2),
 * not to the i18n string tables.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { INTEL_LABELS, QUEST_BEATS } from '@/ui/idleVillage/questS1Lab/questScenario';
import { ROVINE_BEATS, ROVINE_INTEL_LABELS } from '@/ui/idleVillage/questS1Lab/questScenarioRovine';
import { GOBLIN_BEATS } from '@/ui/idleVillage/questS1Lab/questScenarioGoblin';
import {
  applyChoice,
  availableOptions,
  createRun,
  flee,
  drinkPotion,
  useHealing,
  nodesFor,
  previewOption,
  QUESTS,
} from '@/ui/idleVillage/questS1Lab/questRun';

import type { QuestId, QuestRunState, ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import { STAT_ICONS } from '@/ui/idleVillage/questS1Lab/questRun';
import { getStatIconComponent } from '@/ui/shared/statIconUtils';
import { QuestSimulationPreview } from '@/ui/idleVillage/questS1Lab/QuestSimulationPreview';
import { QuestCheckPreview } from '@/ui/idleVillage/questS1Lab/QuestCheckPreview';
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
  /* ---- Le Rovine sotto il Fiume — downloaded scene art (public domain,
   *  one image per phase, per Director request 2026-10-04) --------------- */
  'rv-mercante': { src: '/assets/quest-robine/mercante.jpg', fit: 'cover' },
  'rv-check-osserva': { src: '/assets/quest-robine/mercante.jpg', fit: 'cover' },
  'rv-check-incalza': { src: '/assets/quest-robine/mercante.jpg', fit: 'cover' },
  'rv-fiume': { src: '/assets/quest-robine/fiume.jpg', fit: 'cover' },
  'rv-guardie': { src: '/assets/quest-robine/guardie.jpg', fit: 'cover' },
  'rv-check-sneak': { src: '/assets/quest-robine/guardie.jpg', fit: 'cover' },
  'rv-check-fight': { src: '/assets/quest-robine/guardie.jpg', fit: 'cover' },
  'rv-sala': { src: '/assets/quest-robine/tesoro.jpg', fit: 'cover' },
  'rv-check-trappola': { src: '/assets/quest-robine/tesoro.jpg', fit: 'cover' },
  'rv-tesoro-scelta': { src: '/assets/quest-robine/tesoro.jpg', fit: 'cover' },
  'rv-check-prendi': { src: '/assets/quest-robine/tesoro.jpg', fit: 'cover' },
  'rv-check-sicuro': { src: '/assets/quest-robine/tesoro.jpg', fit: 'cover' },
  'rv-checkpoint': { src: '/assets/quest-robine/rovine-hero.jpg', fit: 'cover' },
  'rv-attrito': { src: '/assets/quest-robine/crollo.jpg', fit: 'cover' },
  'rv-camera': { src: '/assets/quest-robine/camera.jpg', fit: 'cover' },
  'rv-ritorno-evento': { src: '/assets/quest-robine/strada.jpg', fit: 'cover' },
  'rv-fine': { src: ART.village, fit: 'contain' },
  /* ---- Sterminio dei goblin — one public-domain painting per phase
   *  (Director 2026-10-06; provenance in public/assets/quest-goblin/SOURCES.md) */
  'gob-inizio': { src: '/assets/quest-goblin/assegnazione.jpg', fit: 'cover' },
  'gob-esplora': { src: '/assets/quest-goblin/esplorazione.jpg', fit: 'cover' },
  'gob-tracce-per': { src: '/assets/quest-goblin/esplorazione.jpg', fit: 'cover' },
  'gob-tracce-perfor': { src: '/assets/quest-goblin/esplorazione.jpg', fit: 'cover' },
  'gob-bottino-scelta': { src: '/assets/quest-goblin/bottino.jpg', fit: 'cover' },
  'gob-bottino': { src: '/assets/quest-goblin/bottino.jpg', fit: 'cover' },
  'gob-accampamento': { src: '/assets/quest-goblin/accampamento.jpg', fit: 'cover' },
  'gob-stealth': { src: '/assets/quest-goblin/accampamento.jpg', fit: 'cover' },
  'gob-assalto': { src: '/assets/quest-goblin/accampamento.jpg', fit: 'cover' },
  'gob-combattimento': { src: '/assets/quest-goblin/combattimento.jpg', fit: 'cover' },
  'gob-incalzare': { src: '/assets/quest-goblin/incalzare.jpg', fit: 'cover' },
  'gob-incalza-check': { src: '/assets/quest-goblin/incalzare.jpg', fit: 'cover' },
  'gob-esplora-extra': { src: '/assets/quest-goblin/razzia.jpg', fit: 'cover' },
  'gob-cerca': { src: '/assets/quest-goblin/razzia.jpg', fit: 'cover' },
  'gob-ritorno': { src: '/assets/quest-goblin/ritorno.jpg', fit: 'cover' },
  'gob-agguato': { src: '/assets/quest-goblin/ritorno.jpg', fit: 'cover' },
  'gob-agguato-scelta': { src: '/assets/quest-goblin/ritorno.jpg', fit: 'cover' },
  'gob-ultimo-scontro': { src: '/assets/quest-goblin/ritorno.jpg', fit: 'cover' },
  'gob-fine': { src: ART.village, fit: 'contain' },
};

/** Intel labels merged across quests — state.info keys are unique per quest. */
const ALL_INTEL_LABELS: Record<string, string> = { ...INTEL_LABELS, ...ROVINE_INTEL_LABELS };

/** Per-quest beats for the progress indicator. */
const QUEST_BEATS_BY_ID: Record<QuestId, readonly string[]> = {
  cassa: QUEST_BEATS,
  rovine: ROVINE_BEATS,
  goblin: GOBLIN_BEATS,
};

/** Quest cards on the lab's entry screen. Only the authored S1 goblin quest
 *  stays here (Director 2026-10-06: «le altre quest devono essere eliminate
 *  da questo lab»); copy keys live under questS1Lab.quests.*. */
const QUEST_CARDS: { id: QuestId; art: string; riskKey: string }[] = [
  { id: 'goblin', art: '/assets/quest-goblin/quest-card.jpg', riskKey: 'high' },
];

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
  const { t } = useTranslation('idleVillage');
  const state = member.dead
    ? t('questS1Lab.memberState.dead')
    : member.wounded
      ? t('questS1Lab.memberState.wounded')
      : null;
  const subtitle = [t(`questS1Lab.role.${member.role}`), state].filter(Boolean).join(' · ');
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
        statusLabel={state ?? t('questS1Lab.memberState.fit')}
      />
      <div className="flex flex-wrap gap-1 px-2 pb-1.5">
        {Object.entries(member.stats).map(([k, v]) => {
          const Icon = getStatIconComponent(STAT_ICONS[k as keyof typeof STAT_ICONS]);
          return (
            <span
              key={k}
              className={[
                'flex items-center gap-0.5 rounded px-1 py-px font-mono text-[9px] tracking-wider',
                v === best ? 'bg-amber-400/15 text-amber-300' : 'bg-slate-800/60 text-slate-500',
              ].join(' ')}
              title={k}
            >
              {Icon && <Icon className="h-2.5 w-2.5" aria-hidden />}
              {STAT_SHORT[k]} {v}
            </span>
          );
        })}
      </div>
      {hasPotion && member.wounded && !member.dead && onUsePotion && (
        <button
          onClick={onUsePotion}
          className="mx-2 mb-2 w-[calc(100%-1rem)] rounded-lg border border-teal-400/60 bg-teal-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300 transition hover:bg-teal-500/30"
        >
          {t('questS1Lab.item.usePotion', { name: member.name })}
        </button>
      )}
    </div>
  );
};

const Kicker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[10px] uppercase tracking-[0.3em] text-amber-200/80">{children}</div>
);

/** Quest progress — POI-quest pattern (desiderata v4): when full, the quest is done. */
const QuestProgress: React.FC<{ beat: number; ended: boolean; beats: readonly string[] }> = ({ beat, ended, beats }) => (
  <div className="flex items-center gap-1.5">
    {beats.map((label, i) => {
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
          {i < beats.length - 1 && (
            <div className={`h-px w-4 transition-colors duration-500 ${done ? 'bg-amber-500/60' : 'bg-slate-800'}`} />
          )}
        </div>
      );
    })}
  </div>
);

/** Camp alertness badge — named states, not a meter (Director 2026-10-03:
 *  noise removed). Nothing renders while the camp is quiet; one fumble shows
 *  "allertato", a second (or a loud entry) shows "sveglio". */
const CampAlertBadge: React.FC<{ flags: string[] }> = ({ flags }) => {
  const { t } = useTranslation('idleVillage');
  const sveglio = flags.includes('campoSveglio');
  const allertato = flags.includes('campoAllertato');
  if (!sveglio && !allertato) return null;
  return (
    <span
      className={[
        'rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em]',
        sveglio
          ? 'border-red-400/60 text-red-300'
          : 'border-amber-400/50 text-amber-300/80',
      ].join(' ')}
      title={t('questS1Lab.camp.tooltip')}
    >
      {t(sveglio ? 'questS1Lab.camp.awake' : 'questS1Lab.camp.alerted')}
    </span>
  );
};

/** Random seed for a new run — lab only, called from event handlers. */
const rollSeed = () => Math.floor(Math.random() * 100000);

const QuestS1LabPage: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  const [seed, setSeed] = useState<number>(rollSeed);
  const [questId, setQuestId] = useState<QuestId | null>(null);
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
    setRun(createRun(id, s, questId ?? 'cassa'));
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
    () => (run ? nodesFor(run)[shownNodeId ?? run.nodeId] : null),
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

  /* ---------------- Quest selection ---------------- */
  if (!questId) {
    return (
      <WanderlustAmbientField className="h-screen bg-[#0a0d12] text-ivory" fireflyCount={5}>
        {/* The lab owns its scroll: overflow-y keeps a dedicated scrollbar
            visible instead of relying on the page-level auto-hidden one. */}
        <div className="quest-s1-scroll h-screen overflow-y-auto">
        <div className="relative h-44 overflow-hidden md:h-56">
          <img
            src={ART.map}
            alt=""
            className="h-full w-full object-cover opacity-70"
            style={{ objectPosition: '50% 30%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0a0d12]" />
          <div className="absolute bottom-4 left-6 md:left-10">
            <Kicker>{t('questS1Lab.kicker')}</Kicker>
            <h1 className="text-3xl font-semibold text-amber-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {t('questS1Lab.labTitle')}
            </h1>
          </div>
        </div>
        <div className="p-6 md:p-10">
          <p className="mb-8 max-w-2xl text-sm text-slate-400">{t('questS1Lab.pickQuest')}</p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {QUEST_CARDS.map((q) => (
              <button
                key={q.id}
                onClick={() => setQuestId(q.id)}
                className="group overflow-hidden rounded-3xl border border-amber-400/40 bg-black/75 text-left shadow-[0_18px_60px_rgba(0,0,0,0.65)] backdrop-blur transition hover:border-amber-300/80"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={q.art}
                    alt=""
                    className="h-full w-full object-cover opacity-80 transition group-hover:scale-105"
                    style={{ objectPosition: '50% 80%' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <div className="text-lg font-semibold text-ivory drop-shadow">
                      {t(`questS1Lab.quests.${q.id}.title`)}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-sm text-slate-300">{t(`questS1Lab.quests.${q.id}.desc`)}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em]">
                    <span className="rounded-full border border-sky-400/40 bg-sky-950/40 px-2 py-0.5 text-sky-300">
                      ★ {QUESTS[q.id].primaryStats.map((s) => STAT_SHORT[s]).join(' + ')}
                    </span>
                    <span className="rounded-full border border-amber-400/40 bg-amber-950/40 px-2 py-0.5 text-amber-300">
                      {t(`questS1Lab.risk.${q.riskKey}`)}
                    </span>
                    <span className="rounded-full border border-slate-500/40 bg-slate-900/60 px-2 py-0.5 text-slate-300">
                      {t(`questS1Lab.quests.${q.id}.duration`)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        </div>
      </WanderlustAmbientField>
    );
  }

  /* ---------------- Preset selection ---------------- */
  const activeQuest = QUESTS[questId];
  const activePrimary = activeQuest.primaryStats;
  if (!run) {
    return (
      <WanderlustAmbientField className="h-screen bg-[#0a0d12] text-ivory" fireflyCount={5}>
        <div className="quest-s1-scroll h-screen overflow-y-auto">
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
            <Kicker>{t('questS1Lab.kicker')}</Kicker>
            <h1 className="text-3xl font-semibold text-amber-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {t(`questS1Lab.quests.${questId}.title`)}
            </h1>
          </div>
        </div>
        <div className="p-6 md:p-10">
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={() => setQuestId(null)}
            className="rounded-lg border border-slate-600/60 bg-slate-900/50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-400 transition hover:bg-slate-800"
          >
            ← {t('questS1Lab.backToQuests')}
          </button>
        </div>
        <p className="mb-3 max-w-2xl text-sm text-slate-400">
          {t(`questS1Lab.quests.${questId}.objective`)}
        </p>
        {/* Declared primary stats — the player must know a priori which
            party solves this quest. Every mandatory check uses these. */}
        <div className="mb-8 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-sky-300">
          <span className="rounded-md border border-sky-400/50 bg-sky-950/40 px-2 py-0.5">
            {t(`questS1Lab.quests.${questId}.trial`, { stats: activePrimary.map((s) => STAT_SHORT[s]).join(' + ') })}
          </span>
          <span className="normal-case tracking-normal text-slate-500">
            {t('questS1Lab.primaryNote')}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {activeQuest.presets.map((p) => (
            <section
              key={p.id}
              className="rounded-3xl border border-amber-400/40 bg-black/75 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.65)] backdrop-blur"
            >
              <header className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <Kicker>{t('questS1Lab.partyKicker')}</Kicker>
                  <div className="mt-1 text-lg font-semibold text-ivory">{p.label}</div>
                  <div className="text-xs text-slate-400">{p.description}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="rounded-full border border-amber-300/60 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-amber-200">
                    {p.gold} {t('questS1Lab.gold')}
                  </span>
                  <span className="rounded-full border border-sky-400/40 bg-sky-950/40 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-sky-300">
                    ★ {activePrimary.map((s) => `${STAT_SHORT[s]} ${Math.max(...p.members.map((m) => m.stats[s]))}`).join(' · ')}
                  </span>
                </div>
              </header>
              <div className="space-y-2">
                {p.members.map((m) => (
                  <div key={m.id} className="rounded-lg">
                    <WanderlustRosterCard
                      workerId={m.id}
                      label={m.name}
                      subtitle={`${t(`questS1Lab.role.${m.role}`)} · ${statLine(m)}`}
                      hp={m.hp ?? 10}
                      maxHp={m.hp ?? 10}
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
                  {t('questS1Lab.depart')}
                </button>
              </div>
            </section>
          ))}
        </div>
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
    <WanderlustAmbientField className="h-screen bg-[#0a0d12] text-ivory" fireflyCount={4}>
      <div className="quest-s1-scroll h-screen overflow-y-auto">
      <div className="p-6 md:p-10">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <Kicker>{t('questS1Lab.kickerRun', { seed })}</Kicker>
          <h1 className="text-2xl font-semibold text-amber-100">{t(`questS1Lab.quests.${questId}.title`)}</h1>
          <div className="mt-2">
            <QuestProgress beat={currentBeat} ended={run.ended} beats={QUEST_BEATS_BY_ID[questId]} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!run.ended && (
            <button
              onClick={() => setRun({ ...flee(run) })}
              className="rounded-xl border border-red-400/50 bg-red-950/30 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-red-300 transition hover:bg-red-950/60"
            >
              {t('questS1Lab.retreat')}
            </button>
          )}
          <button
            onClick={reset}
            className="rounded-xl border border-slate-600/60 bg-slate-900/50 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-slate-300 transition hover:bg-slate-800"
          >
            {t('questS1Lab.reset')}
          </button>
        </div>
      </div>

      {/* Quest X-ray — Monte Carlo forecast of the run from here to the end
          (R-082). Collapsed by default; the bench's what-if edits never
          touch the live run state. */}
      {!run.ended && (
        <div className="mb-6">
          <QuestSimulationPreview run={run} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Party */}
        <section className="space-y-3">
          <Kicker>{t('questS1Lab.partyKicker')}</Kicker>
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
                {run.gold} {t('questS1Lab.gold')}
              </span>
              {questId === 'rovine' && (
                <span className="rounded-full border border-sky-400/50 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-sky-300">
                  {t('questS1Lab.days', { days: run.days })}
                </span>
              )}
              {questId === 'rovine' && run.bottinoOro > 0 && (
                <span className="rounded-full border border-emerald-400/50 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-emerald-300">
                  {t('questS1Lab.treasureValue', { value: run.bottinoOro })}
                </span>
              )}
              <CampAlertBadge flags={run.flags} />
              {run.objectiveDone && (
                <span
                  className={[
                    'rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em]',
                    run.ended
                      ? 'border-emerald-400/60 text-emerald-300'
                      : 'border-amber-400/60 text-amber-300',
                  ].join(' ')}
                >
                  {t(run.ended ? 'questS1Lab.chestRecovered' : 'questS1Lab.chestTaken')}
                </span>
              )}
              {run.flags.includes('cassaPersa') && (
                <span className="rounded-full border border-red-400/60 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-red-300">
                  {t('questS1Lab.chestLost')}
                </span>
              )}
            </div>
            {/* Consumables owned — visibility matters (Director feedback) */}
            {run.flags.some((f) => f.startsWith('has')) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {run.flags.includes('hasPozione') && (
                  <span className="rounded-md border border-teal-400/40 bg-teal-950/40 px-2 py-0.5 text-[10px] text-teal-300">
                    {t('questS1Lab.item.potion')}
                  </span>
                )}
                {run.flags.includes('hasFumogeno') && (
                  <span className="rounded-md border border-teal-400/40 bg-teal-950/40 px-2 py-0.5 text-[10px] text-teal-300">
                    {t('questS1Lab.item.smoke')}
                  </span>
                )}
                {run.flags.includes('hasCorda') && (
                  <span className="rounded-md border border-teal-400/40 bg-teal-950/40 px-2 py-0.5 text-[10px] text-teal-300">
                    {t('questS1Lab.item.rope')}
                  </span>
                )}
                {run.flags.includes('hasBonusForza') && (
                  <span className="rounded-md border border-teal-400/40 bg-teal-950/40 px-2 py-0.5 text-[10px] text-teal-300">
                    {t('questS1Lab.item.bonusForza')}
                  </span>
                )}
                {run.flags.includes('hasBonusPerc') && (
                  <span className="rounded-md border border-teal-400/40 bg-teal-950/40 px-2 py-0.5 text-[10px] text-teal-300">
                    {t('questS1Lab.item.bonusPerc')}
                  </span>
                )}
                {run.flags.includes('hasHealing') && (
                  <button
                    type="button"
                    onClick={() => setRun({ ...useHealing(run) })}
                    className="rounded-md border border-teal-400/60 bg-teal-950/40 px-2 py-0.5 text-[10px] text-teal-200 transition hover:border-teal-300"
                  >
                    {t('questS1Lab.item.healing')}
                  </button>
                )}
              </div>
            )}
            {run.loot.length > 0 && <div className="mt-2">{t('questS1Lab.loot', { items: run.loot.join(', ') })}</div>}
            {run.info.length > 0 && <div className="mt-1 text-slate-400">{t('questS1Lab.intel', { items: run.info.map((key) => ALL_INTEL_LABELS[key] ?? key).join(', ') })}</div>}
          </div>
        </section>

        {/* Situation + choices */}
        <section className="rounded-3xl border border-amber-400/40 bg-black/75 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.65)] backdrop-blur">
          {/* Scene art — representative painting for the current phase */}
          {sceneArt && (
            <div className="relative mb-4 flex h-36 items-end justify-center overflow-hidden rounded-2xl border border-white/10">
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
                className={[
                  'relative drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]',
                  sceneArt.fit === 'cover'
                    ? 'h-full w-full object-cover object-bottom'
                    : 'h-full w-auto max-w-full object-contain object-bottom',
                ].join(' ')}
              />
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}
          <header className="mb-3">
            <Kicker>{t('questS1Lab.situation')}</Kicker>
            <div className="mt-1 text-lg font-semibold text-ivory">{currentNode?.title}</div>
          </header>
          <p className="mb-3 text-sm text-slate-300">{currentNode?.body}</p>
          {!run.ended && (
            <p className="mb-4 rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm italic text-amber-200/80">
              {run.lastEvent}
            </p>
          )}
          {run.ended ? (
            <div className="rounded-2xl border border-amber-400/60 bg-amber-950/30 p-4 text-center">
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-amber-200">
                {run.outcome === 'running' ? '' : t(`questS1Lab.outcome.${run.outcome}`)}
              </div>
              {/* Epilogue: lastEvent carries the composed cost — deaths by name,
                  crate lost, prisoner saved, loot brought home. */}
              <p className="mt-2 text-sm normal-case tracking-normal text-amber-100/80">{run.lastEvent}</p>
            </div>
          ) : inTransition ? (
            <div className="flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 text-[11px] uppercase tracking-[0.3em] text-slate-500">
              {t('questS1Lab.advancing')}
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
                      {o.costGold ? <span className="ml-2 text-xs text-amber-300">({o.costGold} {t('questS1Lab.gold')})</span> : null}
                      {pv && !committed && (
                        <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                          {t('questS1Lab.evaluate')}
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-slate-400">{o.detail}</span>
                    {pv && (
                      <span className="mt-2 block space-y-1.5">
                        {/* Who carries the roll — one chip per stat with the best member */}
                        <span className="flex flex-wrap gap-1.5">
                          {pv.contributors.map((c) => {
                            const Icon = getStatIconComponent(STAT_ICONS[c.stat as keyof typeof STAT_ICONS]);
                            return (
                              <span
                                key={c.stat}
                                className={[
                                  'flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider',
                                  (activePrimary as readonly string[]).includes(c.stat)
                                    ? 'border-amber-300/60 bg-amber-950/40 text-amber-200'
                                    : 'border-sky-400/30 bg-sky-950/40 text-sky-200',
                                ].join(' ')}
                              >
                                {Icon && <Icon className="h-3 w-3" aria-hidden />}
                                {(activePrimary as readonly string[]).includes(c.stat) && '★ '}
                                {c.label} <b className="text-sky-100">{c.bestValue}</b>
                                <span className="ml-1 text-sky-400/80 normal-case tracking-normal">
                                  {c.bestName}
                                </span>
                              </span>
                            );
                          })}
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
                            {t('questS1Lab.successPct', { pct: pv.successPct })}
                          </span>
                          {(pv.woundPct > 0 || pv.deathPct > 0) && (
                            <span className="flex gap-1.5">
                              {pv.woundPct > 0 && (
                                <span className="rounded-md border border-amber-500/40 bg-amber-950/40 px-1.5 py-0.5 text-[10px] text-amber-300">
                                  {t('questS1Lab.woundPct', { pct: pv.woundPct })}
                                </span>
                              )}
                              {pv.deathPct > 0 && (
                                <span className="rounded-md border border-red-500/40 bg-red-950/40 px-1.5 py-0.5 text-[10px] text-red-300">
                                  {t('questS1Lab.deathPct', { pct: pv.deathPct })}
                                </span>
                              )}
                            </span>
                          )}
                        </span>
                        {pv.failHint && (
                          <span className="block rounded-md border border-red-400/30 bg-red-950/20 px-2 py-0.5 text-[10px] text-red-300/90">
                            {t('questS1Lab.onFail', { text: pv.failHint })}
                          </span>
                        )}
                        {pv.interceptor && (pv.woundPct > 0 || pv.deathPct > 0) && (
                          <span className="block rounded-md border border-purple-400/40 bg-purple-950/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-purple-300">
                            {t('questS1Lab.bodyguardCovers', {
                              name: pv.interceptor.name,
                              wound: pv.interceptor.woundPct,
                              death: pv.interceptor.deathPct,
                            })}
                          </span>
                        )}
                        {pv.intelLabel && (
                          <span className="block rounded-md border border-emerald-400/40 bg-emerald-950/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300">
                            {t('questS1Lab.intelBonus', { label: pv.intelLabel, bonus: pv.intelBonus })}
                          </span>
                        )}
                        {pv.consumableLabel && !committed && (
                          <span className="block rounded-md border border-teal-400/40 bg-teal-950/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-teal-300">
                            {t('questS1Lab.consumableAvailable', { label: pv.consumableLabel, bonus: pv.consumableBonus })}
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
                            {useConsumable
                              ? t('questS1Lab.consumableArmed', { label: pv.consumableLabel, bonus: pv.consumableBonus })
                              : t('questS1Lab.consumableStowed', { label: pv.consumableLabel })}
                          </span>
                          <span className={useConsumable ? 'text-teal-300' : 'text-slate-500'}>
                            {useConsumable ? '◉' : '○'}
                          </span>
                        </button>
                      )}
                      {/* Pre-check forecast — exact analytic X-ray of THIS
                          check: verdict distribution, consequences, the
                          consumable counterfactual and per-member exposure
                          (R-082). Reacts live to the consumable toggle. */}
                      <QuestCheckPreview run={run} optionId={o.id} useConsumable={useConsumable} />
                      <div className="flex gap-2">
                        <button
                          onClick={() => choose(o.id, useConsumable)}
                          className="flex-1 rounded-xl border border-amber-300/70 bg-amber-500/15 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200 transition hover:bg-amber-500/30"
                        >
                          {t('questS1Lab.faceCheck', { pct: pv.successPct })}
                        </button>
                        <button
                          onClick={() => setRun({ ...flee(run) })}
                          className="rounded-xl border border-red-400/50 bg-red-950/30 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-red-300 transition hover:bg-red-950/60"
                          title={t('questS1Lab.retreatTitle')}
                        >
                          {t('questS1Lab.retreat')}
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
          <Kicker>{t('questS1Lab.chronicle')}</Kicker>
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
          burst gets its own astrolabe beat, played in order. Full-bleed: the
          suite sizes its stage on the real viewport (min(63.75vh, 69.7%)) and
          the bronze bezel overflows it by 80px — an inner box was clipping
          the frame and pushing the disc off-center (scene-col is 65% to make
          room for a panel that no longer exists → widened to 100% here).
          removeSounds: the lab is a silent preview surface. */}
      {checkQueue.length > 0 && checkQueue[checkIdx] && (
        <div className="quest-s1-scroll fixed inset-0 z-50 overflow-y-auto bg-black/85 [&_.scene-col]:[flex:1_1_100%]">
          {checkQueue.length > 1 && (
            <div className="absolute left-4 top-4 z-10 rounded-full border border-amber-300/50 bg-black/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-amber-200">
              {t('questS1Lab.throwCounter', { current: checkIdx + 1, total: checkQueue.length })}
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
            removeSounds
          />
          {checkResolved && (
            /* Bottom bar: the verdict's consequence sentence above the
               continue button — the player reads WHAT the outcome did. */
            <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 bg-gradient-to-t from-black via-black/80 to-transparent px-6 pb-6 pt-12">
              {activeCheck?.outcomeText && (
                <p className="max-w-2xl text-center text-sm italic leading-relaxed text-amber-100/90">
                  {activeCheck.outcomeText}
                </p>
              )}
              <button
                className="rounded-xl border border-amber-300/60 bg-black/80 px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200 transition hover:bg-amber-950/60"
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
                {t('questS1Lab.verdictContinue', {
                  verdict: t(`questS1Lab.verdict.${activeMode ?? checkQueue[checkIdx].check.verdict}`),
                })}
              </button>
            </div>
          )}
        </div>
      )}
      </div>
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
