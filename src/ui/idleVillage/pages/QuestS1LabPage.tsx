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
  currentExposure,
  nextCombatHits,
  QUESTS,
} from '@/ui/idleVillage/questS1Lab/questRun';

import type { HarmEvent, QuestId, QuestRunState, ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import type { LabStat } from '@/ui/idleVillage/questS1Lab/questScenario';
import { STAT_ICONS } from '@/ui/idleVillage/questS1Lab/questRun';
import { getStatIconComponent } from '@/ui/shared/statIconUtils';
import { QuestSimulationPreview } from '@/ui/idleVillage/questS1Lab/QuestSimulationPreview';
import { QuestCheckPreview } from '@/ui/idleVillage/questS1Lab/QuestCheckPreview';
import { usePresentationTimeline } from '@/ui/idleVillage/questS1Lab/presentationTimeline';
import type { PresentationPhase } from '@/ui/idleVillage/questS1Lab/presentationTimeline';
import { WanderlustRosterCard } from '@/ui/idleVillage/roster';
import { DestinyAstrolabeV62Standalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit';
import type { DestinyAstrolabeV62Handle } from '@/ui/idleVillage/components/destinyAstrolabeV62/DestinyAstrolabeV62';
import { PgCardKitShell } from '@/ui/idleVillage/frozen/kits/pgcardKit';
import { WanderlustAmbientField } from '@/ui/wanderlust-surface/layout';
import { DEFAULT_QUEST_LAB_PACING } from '@/balancing/config/idleVillage/quests/questLabPacing';
import { DEFAULT_QUEST_LAB_PRESENTATION as PRES } from '@/balancing/config/idleVillage/quests/questLabPresentation';
import { QUEST_STASH, loadoutCoverage } from '@/balancing/config/idleVillage/quests/questStash';

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

/** Mount-triggered fade-in for narrative text — opacity transition only,
 *  no standalone CSS (skin invariant); remount via `key` restarts it. */
const FadeIn: React.FC<{ children: React.ReactNode; delayMs?: number }> = ({ children, delayMs = 0 }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className="transition-opacity ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transitionDuration: `${DEFAULT_QUEST_LAB_PACING.fadeMs}ms`,
        transitionDelay: `${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Transition beat between phases — the destination node's `transit` line over
 * its scene art, holding for `pacing.transitMs`. In the real game this sits
 * under the party's movement animation; here it IS the animation.
 * Falls back to the plain «advancing» strip when the node has no transit.
 */
const TransitView: React.FC<{
  transit?: string;
  art?: { src: string; fit: 'contain' | 'cover' };
}> = ({ transit, art }) => {
  const { t } = useTranslation('idleVillage');
  if (!transit) {
    return (
      <div className="flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 text-[11px] uppercase tracking-[0.3em] text-slate-500">
        {t('questS1Lab.advancing')}
      </div>
    );
  }
  return (
    <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
      {art && (
        <img
          src={art.src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          style={{ objectPosition: '50% 60%' }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/70" />
      <FadeIn>
        <p className="relative max-w-md px-6 text-center font-serif text-base italic leading-relaxed text-amber-100/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          {transit}
        </p>
      </FadeIn>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* PLAN-023 cockpit pieces — formation, horde, harm channel, verdict.  */
/* ------------------------------------------------------------------ */

/** Lucide icon for a chance-per-hit % via the config's tier table. */
const exposureIcon = (pct: number) => {
  const tier = PRES.formation.exposureTiers.find((ti) => pct <= ti.maxPct) ??
    PRES.formation.exposureTiers[PRES.formation.exposureTiers.length - 1];
  return getStatIconComponent(tier.icon);
};

/** Transient floater: mounts, rises, fades — transition-only (skin-safe,
 *  no standalone CSS). Lives only while its harm phase is on stage. */
const DamageFloater: React.FC<{ amount: number; kind: HarmEvent['kind'] }> = ({ amount, kind }) => {
  const [up, setUp] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setUp(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <span
      className={[
        'pointer-events-none absolute -top-3 right-1 z-20 font-mono text-sm font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]',
        kind === 'death' ? 'text-red-300' : 'text-orange-300',
      ].join(' ')}
      style={{
        transform: up ? 'translateY(-26px)' : 'translateY(4px)',
        opacity: up ? 0 : 1,
        transition: `transform ${PRES.damage.floatLifeMs}ms ease-out, opacity ${PRES.damage.floatLifeMs}ms ease-in`,
      }}
    >
      −{amount}
    </span>
  );
};

/** Chance-per-hit readout: tier icon + decile pips + exact % (artifact §5 —
 *  the three channels are complementary, never stacked into a cone). */
const ExposureBadge: React.FC<{ pct: number }> = ({ pct }) => {
  const { t } = useTranslation('idleVillage');
  const Icon = exposureIcon(pct);
  const lit = Math.round((pct / 100) * PRES.formation.exposurePips);
  return (
    <div
      className="flex items-center gap-1"
      title={t('questS1Lab.exposureTitle', { pct })}
    >
      {Icon && (
        <Icon
          className={pct >= 50 ? 'h-3 w-3 text-red-400' : pct > 0 ? 'h-3 w-3 text-amber-400' : 'h-3 w-3 text-slate-600'}
          aria-hidden
        />
      )}
      <span className="flex gap-px">
        {Array.from({ length: PRES.formation.exposurePips }).map((_, i) => (
          <span
            key={i}
            className={`h-1 w-1 rounded-full transition-colors ${
              i < lit ? (pct >= 50 ? 'bg-red-400/80' : 'bg-amber-400/70') : 'bg-slate-700/60'
            }`}
            style={{ transitionDuration: `${PRES.formation.exposureRetweenMs}ms` }}
          />
        ))}
      </span>
      <span className={`font-mono text-[9px] ${pct >= 50 ? 'text-red-300' : pct > 0 ? 'text-amber-300/90' : 'text-slate-600'}`}>
        {pct}%
      </span>
    </div>
  );
};

/** One formation slot: compact roster visual + HP ghost bar + exposure badge
 *  + the harm channel (floater while its beat plays, durable chip after).
 *  Slots render in physical order, living closing ranks toward the horde. */
const FormationSlot: React.FC<{
  member: QuestRunState['party'][number];
  presentedHp: number;
  exposurePct: number | null;
  activeHarm: HarmEvent | null;
  deltaAmount: number;
  spent: boolean;
}> = ({ member, presentedHp, exposurePct, activeHarm, deltaAmount, spent }) => {
  const { t } = useTranslation('idleVillage');
  const hit = !!activeHarm;
  return (
    <div
      className={[
        'relative w-24 shrink-0 rounded-xl border p-1 transition-all',
        member.dead
          ? 'border-slate-800 bg-slate-950/60 opacity-40 grayscale'
          : hit
            ? 'border-red-400/70 bg-red-950/20'
            : 'border-white/10 bg-slate-950/50',
      ].join(' ')}
      style={{ transitionDuration: `${PRES.damage.hitMarkerMs}ms` }}
    >
      {member.dead ? (
        <div className="flex h-16 flex-col items-center justify-center gap-0.5">
          <span className="text-lg text-slate-500">✝</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-500">{member.name}</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-[10px] font-semibold text-ivory">{member.name}</span>
            {spent && (
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400/80" title={t('questS1Lab.spent')} />
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1 font-mono text-[9px] text-slate-400">
            <span className={member.wounded ? 'text-amber-400' : ''}>{presentedHp}/{member.maxHp}</span>
          </div>
          {/* HP bar: presented value drains (transition) while the ghost
              segment marks the hit's hpBefore until the beat ends. */}
          <div className="relative mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
            {activeHarm && activeHarm.hpBefore > presentedHp && (
              <div
                className="absolute inset-y-0 left-0 bg-red-300/40"
                style={{
                  width: `${(activeHarm.hpBefore / member.maxHp) * 100}%`,
                  transition: `width ${PRES.damage.ghostDrainMs}ms ease-out ${PRES.damage.ghostHoldMs}ms`,
                }}
              />
            )}
            <div
              className={[
                'absolute inset-y-0 left-0 rounded-full',
                presentedHp / member.maxHp > 0.5
                  ? 'bg-emerald-500/80'
                  : presentedHp / member.maxHp > 0.25
                    ? 'bg-amber-500/80'
                    : 'bg-red-500/80',
              ].join(' ')}
              style={{
                width: `${(Math.max(0, presentedHp) / member.maxHp) * 100}%`,
                transition: `width ${PRES.damage.ghostDrainMs}ms ease-out`,
              }}
            />
          </div>
          {exposurePct !== null && <div className="mt-1"><ExposureBadge pct={exposurePct} /></div>}
          {/* Durable harm chip — pinned until the next action's harms. */}
          {deltaAmount > 0 && (
            <span className="absolute -bottom-1.5 right-1 rounded-md border border-red-400/60 bg-red-950/90 px-1 font-mono text-[9px] font-bold text-red-200">
              −{deltaAmount}
            </span>
          )}
          {activeHarm && <DamageFloater amount={activeHarm.amount} kind={activeHarm.kind} />}
        </>
      )}
    </div>
  );
};

/** Anonymous horde: tokens only (no invented per-goblin data) + the honest
 *  pre-click intent ⚔×k — hit count is spec-constant, knowable pre-click. */
const HordePanel: React.FC<{ shown: number; total: number; dying: number; intent: number }> = ({
  shown,
  total,
  dying,
  intent,
}) => {
  const { t } = useTranslation('idleVillage');
  const cap = PRES.formation.maxHordeTokens;
  const tokens = Math.min(shown, cap);
  return (
    <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-2">
      <div className="flex items-center gap-1 rounded-md border border-red-400/50 bg-red-950/30 px-2 py-0.5 font-mono text-[10px] text-red-300"
           title={t('questS1Lab.horde.intentTitle')}>
        ⚔×{intent}
      </div>
      <div className="flex flex-wrap-reverse justify-center gap-1">
        {Array.from({ length: tokens }).map((_, i) => {
          const isDying = i >= tokens - dying;
          return (
            <span
              key={i}
              className={[
                'h-3.5 w-3.5 rounded-sm border transition-all',
                isDying
                  ? 'scale-75 border-red-400/80 bg-red-500/20 opacity-50'
                  : 'border-red-400/50 bg-red-950/40',
              ].join(' ')}
              style={{ transitionDuration: `${PRES.timeline.killsMs}ms` }}
            />
          );
        })}
      </div>
      {shown > cap && (
        <span className="font-mono text-[10px] text-red-300/80">×{shown}</span>
      )}
      <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
        {t('questS1Lab.horde.remaining', { shown, total })}
      </span>
    </div>
  );
};

/** Verdict card — replaces the Action Zone content while a resolution is
 *  presented (artifact §4): badge + authored flavor + non-HP consequence
 *  chips. HP harms live on the formation slots, never duplicated here. */
const VerdictCard: React.FC<{
  check: ResolvedCheck;
  phase: string;
  onAck: () => void;
}> = ({ check, phase, onAck }) => {
  const { t } = useTranslation('idleVillage');
  const mode =
    check.verdict === 'fail' && check.harm === 'death'
      ? 'fail_dead'
      : check.verdict === 'fail' && check.harm === 'wound'
        ? 'fail_wound'
        : check.verdict;
  const tone =
    mode === 'bigwin' || mode === 'win'
      ? 'border-emerald-400/60 text-emerald-200'
      : mode === 'almost'
        ? 'border-amber-400/60 text-amber-200'
        : 'border-red-400/60 text-red-200';
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <div className={`rounded-full border px-4 py-1 text-[11px] font-bold uppercase tracking-[0.3em] ${tone}`}>
        {t(`questS1Lab.verdict.${mode}`)}
      </div>
      {check.flavor && (
        <p className="max-w-2xl font-serif text-base italic leading-relaxed text-amber-100">
          {check.flavor}
        </p>
      )}
      {check.authoredText && (
        <p className="max-w-2xl text-sm leading-relaxed text-amber-100/75">{check.authoredText}</p>
      )}
      {phase === 'verdict' && (
        <button
          onClick={onAck}
          className="mt-1 rounded-xl border border-amber-300/60 bg-amber-500/10 px-6 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200 transition hover:bg-amber-500/25"
        >
          {t('questS1Lab.verdictAck')}
        </button>
      )}
      {phase === 'harm' && (
        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
          {t('questS1Lab.harmInProgress')}
        </p>
      )}
    </div>
  );
};

/** Consumable belt (artifact §7b): arm a check consumable BEFORE choosing —
 *  the option tooltips then show base → armed delta. Healing stays its own
 *  action (auto-targets the most hurt living member). */
const ConsumableBelt: React.FC<{
  flags: string[];
  armed: boolean;
  onToggleArmed: () => void;
  onUseHealing: () => void;
  onDrinkPotion: () => void;
}> = ({ flags, armed, onToggleArmed, onUseHealing, onDrinkPotion }) => {
  const { t } = useTranslation('idleVillage');
  const checkFlags = flags.filter((f) => f !== 'hasPozione' && f !== 'hasHealing');
  if (!checkFlags.length && !flags.includes('hasPozione') && !flags.includes('hasHealing')) return null;
  const FLAG_LABEL: Record<string, string> = {
    hasBonusForza: t('questS1Lab.item.bonusForza'),
    hasBonusPerc: t('questS1Lab.item.bonusPerc'),
    hasFumogeno: t('questS1Lab.item.smoke'),
    hasCorda: t('questS1Lab.item.rope'),
  };
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-2">
      <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500">
        {t('questS1Lab.belt.label')}
      </span>
      {checkFlags.length > 0 && (
        <button
          type="button"
          onClick={onToggleArmed}
          title={t('questS1Lab.belt.armTitle')}
          className={[
            'rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider transition',
            armed
              ? 'border-teal-300/70 bg-teal-500/15 text-teal-200'
              : 'border-slate-600/60 bg-slate-900/50 text-slate-400',
          ].join(' ')}
        >
          {armed ? '◉' : '○'} {checkFlags.map((f) => FLAG_LABEL[f] ?? f).join(' · ')}
        </button>
      )}
      {flags.includes('hasPozione') && (
        <button
          type="button"
          onClick={onDrinkPotion}
          className="rounded-md border border-teal-400/50 bg-teal-950/40 px-2 py-0.5 text-[10px] text-teal-200 transition hover:border-teal-300"
        >
          {t('questS1Lab.item.potion')}
        </button>
      )}
      {flags.includes('hasHealing') && (
        <button
          type="button"
          onClick={onUseHealing}
          className="rounded-md border border-teal-400/50 bg-teal-950/40 px-2 py-0.5 text-[10px] text-teal-200 transition hover:border-teal-300"
        >
          {t('questS1Lab.item.healing')}
        </button>
      )}
    </div>
  );
};

/** Stash picker (R-102): pack consumables into the bag before departing.
 *  One shared bag for whichever preset the player launches — cap is
 *  `QUEST_STASH.bagSlots`; chips toggle, the coverage hint compares the pick
 *  against the quest's declared primary stats. */
const StashPicker: React.FC<{
  loadout: string[];
  onToggle: (flag: string) => void;
  primaryStats: LabStat[];
}> = ({ loadout, onToggle, primaryStats }) => {
  const { t } = useTranslation('idleVillage');
  const coverage = loadoutCoverage(loadout);
  return (
    <div className="mb-8 rounded-2xl border border-slate-700/60 bg-black/60 p-4 backdrop-blur">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.3em] text-amber-200/90">
          {t('questS1Lab.stash.title')}
        </span>
        <span className="rounded-full border border-slate-600/60 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-400">
          {t('questS1Lab.stash.hint', {
            used: loadout.length,
            slots: QUEST_STASH.bagSlots,
          })}
        </span>
        {primaryStats.length > 0 && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
            {t('questS1Lab.stash.coverage')}:{' '}
            {primaryStats
              .map((s) => `${STAT_SHORT[s]} ${coverage.includes(s) ? '✓' : '—'}`)
              .join(' · ')}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {QUEST_STASH.items.map((item) => {
          const packed = loadout.includes(item.flag);
          const full = !packed && loadout.length >= QUEST_STASH.bagSlots;
          return (
            <button
              key={item.flag}
              type="button"
              disabled={full}
              onClick={() => onToggle(item.flag)}
              title={t(item.descKey)}
              className={[
                'rounded-lg border px-3 py-1.5 text-[11px] transition',
                packed
                  ? 'border-teal-300/70 bg-teal-500/15 text-teal-200'
                  : full
                    ? 'cursor-not-allowed border-slate-800 bg-slate-950/40 text-slate-600'
                    : 'border-slate-600/60 bg-slate-900/50 text-slate-300 hover:border-slate-400',
              ].join(' ')}
            >
              {packed ? '◉' : '○'} {t(item.labelKey).split('—')[0].trim()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** Phases gated on the astrolabe/player: checks wait on resolve + verdict
 *  ack; ambient harm beats flow on their own timers. Module constants so the
 *  hook's effect deps stay stable across renders. */
const GATE_WHEN_CHECK: PresentationPhase[] = ['cinematic', 'verdict'];
const GATE_NONE: PresentationPhase[] = [];

const QuestS1LabPage: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  const [seed, setSeed] = useState<number>(rollSeed);
  const [questId, setQuestId] = useState<QuestId | null>(null);
  const [run, setRun] = useState<QuestRunState | null>(null);
  // R-102 loadout: the bag packed on the preset screen, shared across presets.
  const [loadout, setLoadout] = useState<string[]>([...QUEST_STASH.defaultLoadout]);
  // Every check resolved by the last action gets its own astrolabe beat —
  // the queue preserves the order so chained checks all get the cinematic.
  // Burst entries remember whether their check resolved on a combat node —
  // combat cinematics dock into the stage band, narrative ones go full-screen.
  const [checkQueue, setCheckQueue] = useState<{ id: string; check: ResolvedCheck; combat: boolean }[]>([]);
  const [checkIdx, setCheckIdx] = useState(0);
  // Burst counter: every action's queue gets unique ids so the astrolabe
  // remounts per check instead of reusing the previous burst's mount.
  const burstRef = useRef(0);
  const astroRef = useRef<DestinyAstrolabeV62Handle>(null);
  // Consumable belt (Director D1 + artifact §7b): armed before the check —
  // every option tooltip shows the live delta. Engine picks the matching flag.
  const [armConsumable, setArmConsumable] = useState(true);
  // Pace chosen BEFORE the check (Director D1): full cinematic or fast beats.
  const [paceFast, setPaceFast] = useState(false);
  // Chronicle is a drawer, not a column (artifact §2).
  const [logOpen, setLogOpen] = useState(false);
  // Durable harm chips survive the settle beat until the next action's harms.
  const [pinnedHarms, setPinnedHarms] = useState<HarmEvent[]>([]);
  // Phase timing: beats resolve one at a time with real time between (v4 pattern).
  const [shownNodeId, setShownNodeId] = useState<string | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeEntry = checkQueue[checkIdx];
  const activeCheck = activeEntry?.check ?? null;
  const speed = paceFast ? PRES.timeline.fastSpeed : 1;
  const committedHp = useMemo(
    () => (run ? Object.fromEntries(run.party.map((m) => [m.id, m.hp])) : {}),
    [run],
  );

  /* The ONE presentation pipeline (artifact §3): the engine commits, this
     replays — skip/flush/unmount all funnel through the same reducer. */
  const gatePhases = useMemo(
    () => (activeCheck ? GATE_WHEN_CHECK : GATE_NONE),
    [!!activeCheck], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const timeline = usePresentationTimeline({
    resolution: activeCheck,
    committedHp,
    ambientHarms: run?.recentHarms,
    speed,
    enabled: !!run,
    gatePhases,
  });
  const presenting = timeline.state.key !== 'idle' && timeline.state.phase !== 'settled';

  /* On settle, the burst advances — the astrolabe remounts on the next id. */
  useEffect(() => {
    if (!activeEntry) return;
    if (timeline.state.key !== activeEntry.check.id || timeline.state.phase !== 'settled') return;
    const id = setTimeout(() => {
      if (checkIdx + 1 >= checkQueue.length) {
        setCheckQueue([]);
        setCheckIdx(0);
      } else {
        setCheckIdx((i) => i + 1);
      }
    }, PRES.input.inputGuardMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline.state.phase, timeline.state.key, activeEntry?.check.id]);

  /* Durable chip lifecycle: a new presentation clears the pins; on settle the
     final shown set is pinned on the formation slots until the next action. */
  useEffect(() => {
    setPinnedHarms([]);
  }, [timeline.state.key]);
  useEffect(() => {
    if (timeline.state.phase === 'settled' && timeline.shownHarms.length) {
      setPinnedHarms(timeline.shownHarms);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline.state.phase]);

  useEffect(() => {
    if (!run) {
      setShownNodeId(null);
      return;
    }
    if (shownNodeId === run.nodeId || shownNodeId === null) {
      setShownNodeId(run.nodeId);
      return;
    }
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    // A node with a transit line holds the beat long enough to be read —
    // scaled to its word count (reading speed is a pacing config value);
    // in the real game this window is the movement animation's duration.
    const destTransit = nodesFor(run)[run.nodeId]?.transit;
    const hold = destTransit
      ? Math.min(
          DEFAULT_QUEST_LAB_PACING.transitMaxMs,
          Math.max(
            DEFAULT_QUEST_LAB_PACING.transitMinMs,
            Math.round(
              (destTransit.split(/\s+/).filter(Boolean).length /
                DEFAULT_QUEST_LAB_PACING.transitWordsPerSecond) *
                1000,
            ),
          ),
        )
      : DEFAULT_QUEST_LAB_PACING.transitionMs;
    transitionTimer.current = setTimeout(() => setShownNodeId(run.nodeId), hold);
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, [run, shownNodeId]);

  const startRun = (id: string) => {
    const s = rollSeed();
    setSeed(s);
    setCheckQueue([]);
    setRun(createRun(id, s, questId ?? 'cassa', loadout));
  };

  const toggleStashItem = (flag: string) => {
    setLoadout((cur) =>
      cur.includes(flag)
        ? cur.filter((f) => f !== flag)
        : cur.length < QUEST_STASH.bagSlots
          ? [...cur, flag]
          : cur,
    );
  };

  const reset = () => {
    setRun(null);
    setCheckQueue([]);
  };

  const choose = (optionId: string) => {
    // The engine mutates run state in place; call it outside the updater so
    // React StrictMode's double-invoked updaters can't double-apply effects.
    if (!run) return;
    const wasCombat = nodesFor(run)[run.nodeId]?.kind === 'combat';
    const next = applyChoice(run, optionId, { useConsumable: armConsumable });
    if (next.checkQueue.length > 0) {
      burstRef.current += 1;
      const burst = burstRef.current;
      setCheckQueue(
        next.checkQueue.map((check, i) => ({ id: `b${burst}-${i}`, check, combat: wasCombat })),
      );
      setCheckIdx(0);
    }
    setArmConsumable(true);
    setRun({ ...next });
  };

  const currentNode = useMemo(
    () => (run ? nodesFor(run)[shownNodeId ?? run.nodeId] : null),
    [run, shownNodeId],
  );

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
        <StashPicker
          loadout={loadout}
          onToggle={toggleStashItem}
          primaryStats={activePrimary}
        />
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
  const sceneArt = run ? NODE_ART[shownNodeId ?? run.nodeId] : undefined;
  /* Transit also plays on the final hop: the closing line lands BEFORE the
   *  outcome card, so the epilogue arrives after the world, not instead of it. */
  const inTransition = shownNodeId !== null && shownNodeId !== run.nodeId;
  const currentBeat = currentNode?.beat ?? 0;
  const inCombat = !!currentNode && currentNode.kind === 'combat' && !run.ended;
  /* Engine-provided snapshots — the UI NEVER recomputes positionalWeights. */
  const exposure = currentExposure(run);
  const intentHits = nextCombatHits(run);
  /* Horde count stays pre-kills until the kills beat plays (presented vs
   *  committed — the tokens shatter on stage, not in the data). */
  const kills = activeCheck?.kills ?? 0;
  const hordeShown = run.goblinLeft + (!timeline.state.killsShown ? kills : 0);
  const hordeTotal = currentNode?.combat?.enemies ?? Math.max(run.goblinLeft, hordeShown);
  /* Harm channel: during the beat the shown set grows event by event; after
   *  settle the pinned set keeps the delta chips alive until the next action. */
  const visibleHarms =
    timeline.state.phase === 'settled' && timeline.state.key !== 'idle'
      ? pinnedHarms
      : timeline.shownHarms;
  const deltaByMember = visibleHarms.reduce<Record<string, number>>((acc, h) => {
    acc[h.memberId] = (acc[h.memberId] ?? 0) + h.amount;
    return acc;
  }, {});
  const spentIds = new Set(visibleHarms.map((h) => h.memberId));
  const presentedHpOf = (m: QuestRunState['party'][number]) =>
    timeline.state.key === 'idle' ? m.hp : (timeline.state.hp[m.id] ?? m.hp);
  /* The astrolabe has two homes (artifact §6): docked in the stage gap on
   *  combat turns, full-screen overlay on narrative checks. Either way it
   *  exists only while the cinematic beat plays. */
  const astroDocked = !!activeCheck && timeline.state.phase === 'cinematic' && !!activeEntry?.combat;
  const astroOverlay = !!activeCheck && timeline.state.phase === 'cinematic' && !activeEntry?.combat;

  /** Progressive skip — the ONLY fast-forward affordance (artifact §8):
   *  during the cinematic it settles the astrolabe; afterwards it flushes
   *  the remaining consequence beats. Same reducer path as every fast-forward. */
  const handleSkip = () => {
    if (timeline.state.phase === 'cinematic') {
      if (activeCheck) astroRef.current?.skipToResult();
      else timeline.advance();
    } else {
      timeline.flush();
    }
  };

  /* ---------------- Run view — three-region cockpit, zero scroll ------- */
  return (
    <WanderlustAmbientField className="h-screen bg-[#0a0d12] text-ivory" fireflyCount={4}>
      <div
        className="mx-auto flex h-screen w-full flex-col overflow-hidden"
        style={{ maxWidth: PRES.layout.maxWidthPx }}
      >
        {/* CONTEXT STRIP — location, beat, objective, affordances */}
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
          <div className="flex min-w-0 items-center gap-4">
            <div className="shrink-0">
              <Kicker>{t('questS1Lab.kickerRun', { seed })}</Kicker>
              <h1 className="truncate text-lg font-semibold text-amber-100">
                {t(`questS1Lab.quests.${questId}.title`)}
              </h1>
            </div>
            <QuestProgress beat={currentBeat} ended={run.ended} beats={QUEST_BEATS_BY_ID[questId]} />
            <span className="hidden shrink-0 items-center gap-2 md:flex">
              <span className="rounded-full border border-amber-300/60 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] text-amber-200">
                {run.gold} {t('questS1Lab.gold')}
              </span>
              <CampAlertBadge flags={run.flags} />
              {inCombat && (
                <span className="rounded-full border border-red-400/50 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] text-red-300">
                  {t('questS1Lab.combatTurn', { turn: run.combatTurn, turns: currentNode.combat?.turns ?? 0 })}
                </span>
              )}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {/* Pace chosen BEFORE the check (Director D1) — one factor scales
                every beat; locked while a resolution is on stage. */}
            <div
              className={`flex rounded-lg border border-slate-700/80 p-0.5 ${presenting ? 'opacity-40' : ''}`}
              title={t('questS1Lab.pace.title')}
            >
              {(['full', 'fast'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={presenting}
                  onClick={() => setPaceFast(p === 'fast')}
                  className={[
                    'rounded-md px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] transition',
                    (p === 'fast') === paceFast
                      ? 'bg-amber-500/20 text-amber-200'
                      : 'text-slate-500 hover:text-slate-300',
                  ].join(' ')}
                >
                  {t(`questS1Lab.pace.${p}`)}
                </button>
              ))}
            </div>
            {presenting && (
              <button
                type="button"
                onClick={handleSkip}
                className="rounded-lg border border-amber-300/60 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200 transition hover:bg-amber-500/25"
              >
                {t('questS1Lab.skip')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setLogOpen((v) => !v)}
              className={[
                'rounded-lg border px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition',
                logOpen
                  ? 'border-sky-300/60 bg-sky-500/15 text-sky-200'
                  : 'border-slate-600/60 bg-slate-900/50 text-slate-400 hover:text-slate-200',
              ].join(' ')}
            >
              {t('questS1Lab.logToggle')}
            </button>
            {!run.ended && (
              <button
                onClick={() => setRun({ ...flee(run) })}
                className="rounded-lg border border-red-400/50 bg-red-950/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-red-300 transition hover:bg-red-950/60"
              >
                {t('questS1Lab.retreat')}
              </button>
            )}
            <button
              onClick={reset}
              className="rounded-lg border border-slate-600/60 bg-slate-900/50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300 transition hover:bg-slate-800"
            >
              {t('questS1Lab.reset')}
            </button>
          </div>
        </header>

        {/* Quest X-ray — Monte Carlo forecast (R-082), collapsed by default */}
        {!run.ended && (
          <div className="shrink-0 px-4 pt-1">
            <QuestSimulationPreview run={run} />
          </div>
        )}

        {/* STAGE BAND — formation vs horde (or scene art when peaceful) */}
        <section className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4">
          {/* Formation — physical order; the living close ranks toward the
              horde (justify-end), the fallen leave tombstones at the rear. */}
          <div className="flex items-center justify-end gap-2 self-center">
            {[...run.party.filter((m) => m.dead), ...run.party.filter((m) => !m.dead)].map((m) => (
              <FormationSlot
                key={m.id}
                member={m}
                presentedHp={presentedHpOf(m)}
                exposurePct={inCombat && !m.dead ? (exposure[m.id] ?? 0) : null}
                activeHarm={timeline.activeHarm?.memberId === m.id ? timeline.activeHarm : null}
                deltaAmount={deltaByMember[m.id] ?? 0}
                spent={spentIds.has(m.id)}
              />
            ))}
          </div>
          {/* Center — docked astrolabe on combat turns, scene art otherwise */}
          <div className="relative flex h-full min-w-0 items-center justify-center overflow-hidden rounded-2xl">
            {astroDocked && activeEntry ? (
              /* The suite sizes on the viewport — dock it by giving it a real
                 box and scaling the whole thing down (zoom, no CSS file). */
              <div
                className="pointer-events-auto h-[780px] w-[780px] shrink-0 [&_.scene-col]:[flex:1_1_100%]"
                style={{ zoom: 0.44 } as React.CSSProperties}
              >
                <DestinyAstrolabeV62Standalone
                  ref={astroRef}
                  key={activeEntry.id}
                  skills={[{ name: activeCheck?.title ?? '', stat: activeCheck?.score ?? 50, difficulty: 50 }]}
                  config={{
                    mode: activeMode,
                    wound: activeCheck?.woundPct ?? 0,
                    dead: activeCheck?.deathPct ?? 0,
                    harm: activeCheck?.harm ?? 'none',
                  }}
                  onResolve={() => timeline.advance()}
                  autoStart
                  removeSounds
                  speed={speed}
                />
              </div>
            ) : (
              sceneArt && (
                <img
                  src={sceneArt.src}
                  alt=""
                  className={[
                    'max-h-full max-w-full rounded-2xl border border-white/10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]',
                    sceneArt.fit === 'cover' ? 'h-full w-full object-cover' : 'object-contain',
                  ].join(' ')}
                />
              )
            )}
          </div>
          {/* Horde — anonymous tokens + honest intent, combat only */}
          <div className="flex items-center justify-start self-center">
            {inCombat ? (
              <HordePanel
                shown={hordeShown}
                total={hordeTotal}
                dying={timeline.state.killsShown ? 0 : kills}
                intent={intentHits}
              />
            ) : (
              <div className="w-28 shrink-0" />
            )}
          </div>
        </section>

        {/* ACTION ZONE — stateful: options ⟷ verdict, same real estate */}
        <section
          className="shrink-0 border-t border-amber-400/25 px-4 py-2"
          style={{ height: `${PRES.layout.actionZoneVh}vh` }}
        >
          <div className="quest-s1-scroll mx-auto flex h-full w-full max-w-3xl flex-col overflow-y-auto">
            {inTransition ? (
              <TransitView transit={nodesFor(run)[run.nodeId]?.transit} art={NODE_ART[run.nodeId]} />
            ) : presenting && activeCheck ? (
              timeline.state.phase === 'cinematic' ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                    {t('questS1Lab.resolving')}
                  </div>
                  <div className="text-lg font-semibold text-ivory">{activeCheck.title}</div>
                  {activeCheck.transit && (
                    <p className="max-w-xl font-serif text-sm italic text-amber-100/80">
                      {activeCheck.transit}
                    </p>
                  )}
                  {checkQueue.length > 1 && (
                    <span className="rounded-full border border-amber-300/50 bg-black/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-amber-200">
                      {t('questS1Lab.throwCounter', { current: checkIdx + 1, total: checkQueue.length })}
                    </span>
                  )}
                </div>
              ) : (
                <VerdictCard
                  check={activeCheck}
                  phase={timeline.state.phase}
                  onAck={timeline.advance}
                />
              )
            ) : presenting || checkQueue.length > 0 ? (
              /* Ambient harm beat — no owning check (ambush, attrition), or
                 the inter-check gap inside a burst. The damage plays on the
                 formation; options unlock only when the pipeline drains. */
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <p className="max-w-xl text-sm italic text-amber-100/80">{run.lastEvent}</p>
                <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  {t('questS1Lab.harmInProgress')}
                </span>
              </div>
            ) : run.ended ? (
              <div className="flex h-full items-center justify-center">
                <div className="w-full max-w-lg rounded-2xl border border-amber-400/60 bg-amber-950/30 p-4 text-center">
                  <div className="text-sm font-bold uppercase tracking-[0.2em] text-amber-200">
                    {run.outcome === 'running' ? '' : t(`questS1Lab.outcome.${run.outcome}`)}
                  </div>
                  <p className="mt-2 text-sm normal-case tracking-normal text-amber-100/80">
                    {run.lastEvent}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <header className="mb-1 flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <Kicker>{t('questS1Lab.situation')}</Kicker>
                    <div className="truncate text-base font-semibold text-ivory">
                      {currentNode?.title}
                    </div>
                  </div>
                  {run.lastEvent && (
                    <p className="max-w-[45%] truncate text-right text-[11px] italic text-amber-200/70">
                      {run.lastEvent}
                    </p>
                  )}
                </header>
                <p className="mb-2 line-clamp-2 text-xs text-slate-400">{currentNode?.body}</p>
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                  {options.map((o) => {
                    const pv = previewOption(run, o.id, { useConsumable: armConsumable });
                    const pvBase =
                      pv && armConsumable && pv.consumableFlag
                        ? previewOption(run, o.id, { useConsumable: false })
                        : null;
                    return (
                      <div key={o.id} className="group relative">
                        <button
                          disabled={o.disabled}
                          onClick={() => choose(o.id)}
                          className={[
                            'w-full rounded-2xl border border-amber-300/30 bg-slate-900/60 px-4 py-2.5 text-left transition',
                            'hover:border-amber-300/60 hover:bg-slate-800',
                            o.disabled ? 'cursor-not-allowed opacity-40' : '',
                          ].join(' ')}
                        >
                          <span className="block text-sm font-medium text-ivory">
                            {o.label}
                            {o.costGold ? (
                              <span className="ml-2 text-xs text-amber-300">
                                ({o.costGold} {t('questS1Lab.gold')})
                              </span>
                            ) : null}
                          </span>
                          <span className="block text-xs text-slate-400">{o.detail}</span>
                          {/* Compact stakes on the option itself (Director D1):
                              stat icons + success bound + wound/death risk. */}
                          {pv && (
                            <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              {pv.contributors.map((c) => {
                                const Icon = getStatIconComponent(
                                  STAT_ICONS[c.stat as keyof typeof STAT_ICONS],
                                );
                                return (
                                  <span
                                    key={c.stat}
                                    className="flex items-center gap-1 rounded-md border border-sky-400/30 bg-sky-950/40 px-1.5 py-px text-[10px] text-sky-200"
                                    title={`${c.label} — ${c.bestName} ${c.bestValue}`}
                                  >
                                    {Icon && <Icon className="h-3 w-3" aria-hidden />}
                                    {c.bestValue}
                                  </span>
                                );
                              })}
                              <span className="rounded-md border border-emerald-400/40 bg-emerald-950/40 px-1.5 py-px text-[10px] text-emerald-300">
                                ≤{pv.successPct}
                              </span>
                              {pvBase && pvBase.successPct !== pv.successPct && (
                                <span className="rounded-md border border-teal-400/50 bg-teal-950/40 px-1.5 py-px text-[10px] text-teal-300">
                                  {t('questS1Lab.consumableDelta', {
                                    base: pvBase.successPct,
                                    armed: pv.successPct,
                                  })}
                                </span>
                              )}
                              {pv.woundPct > 0 && (
                                <span className="rounded-md border border-amber-500/40 bg-amber-950/40 px-1.5 py-px text-[10px] text-amber-300">
                                  {t('questS1Lab.woundPct', { pct: pv.woundPct })}
                                </span>
                              )}
                              {pv.deathPct > 0 && (
                                <span className="rounded-md border border-red-500/40 bg-red-950/40 px-1.5 py-px text-[10px] text-red-300">
                                  {t('questS1Lab.deathPct', { pct: pv.deathPct })}
                                </span>
                              )}
                            </span>
                          )}
                        </button>
                        {/* Stakes tooltip — the full analytic X-ray on
                            hover/focus, not a separate phase (Director D1). */}
                        {pv && (
                          <div className="pointer-events-none absolute bottom-full left-0 z-30 mb-1 hidden w-[22rem] group-hover:block group-focus-within:block">
                            <div className="quest-s1-scroll max-h-80 overflow-y-auto rounded-xl border border-amber-300/30 bg-slate-950/95 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
                              <QuestCheckPreview run={run} optionId={o.id} useConsumable={armConsumable} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <ConsumableBelt
                  flags={run.flags}
                  armed={armConsumable}
                  onToggleArmed={() => setArmConsumable((v) => !v)}
                  onDrinkPotion={() => setRun({ ...drinkPotion(run, 'hasPozione') })}
                  onUseHealing={() => setRun({ ...useHealing(run) })}
                />
                {/* Party inventory — loot/intel readout kept inline, tiny */}
                {(run.loot.length > 0 || run.info.length > 0) && (
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-500">
                    {run.loot.length > 0 && (
                      <span>{t('questS1Lab.loot', { items: run.loot.join(', ') })}</span>
                    )}
                    {run.info.length > 0 && (
                      <span>
                        {t('questS1Lab.intel', {
                          items: run.info.map((k) => ALL_INTEL_LABELS[k] ?? k).join(', '),
                        })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* LOG DRAWER — overlay, never a column */}
        {logOpen && (
          <div className="fixed inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-slate-700/80 bg-[#0a0d12]/95 backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <Kicker>{t('questS1Lab.chronicle')}</Kicker>
              <button
                type="button"
                onClick={() => setLogOpen(false)}
                className="rounded-md px-2 py-0.5 text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="quest-s1-scroll flex-1 space-y-1 overflow-y-auto p-3 font-mono text-xs">
              {run.log.map((e, i) => (
                <div key={i} className={LOG_STYLE[e.kind] ?? 'text-slate-400'}>
                  <span className="text-slate-600">[{e.kind}]</span> {e.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Narrative astrolabe — full-screen cinematic for non-combat checks.
          Exists only during the cinematic beat; the verdict card replaces it
          in the Action Zone (artifact §4: verdict is a state, not a band). */}
      {astroOverlay && activeEntry && (
        <div className="quest-s1-scroll fixed inset-0 z-50 overflow-y-auto bg-black/85 [&_.scene-col]:[flex:1_1_100%]">
          {checkQueue.length > 1 && (
            <div className="absolute left-4 top-4 z-10 rounded-full border border-amber-300/50 bg-black/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-amber-200">
              {t('questS1Lab.throwCounter', { current: checkIdx + 1, total: checkQueue.length })}
            </div>
          )}
          {activeCheck?.transit && (
            <div className="pointer-events-none absolute inset-x-0 top-12 z-10 flex justify-center px-6">
              <FadeIn key={activeEntry.id}>
                <p className="max-w-xl text-center font-serif text-base italic leading-relaxed text-amber-100/85 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                  {activeCheck.transit}
                </p>
              </FadeIn>
            </div>
          )}
          <DestinyAstrolabeV62Standalone
            ref={astroRef}
            key={activeEntry.id}
            skills={[{ name: activeCheck?.title ?? '', stat: activeCheck?.score ?? 50, difficulty: 50 }]}
            config={{
              mode: activeMode,
              wound: activeCheck?.woundPct ?? 0,
              dead: activeCheck?.deathPct ?? 0,
              harm: activeCheck?.harm ?? 'none',
            }}
            onResolve={() => timeline.advance()}
            autoStart
            removeSounds
            speed={speed}
          />
          <button
            type="button"
            onClick={handleSkip}
            className="absolute bottom-6 right-6 z-10 rounded-xl border border-amber-300/60 bg-black/80 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200 transition hover:bg-amber-950/60"
          >
            {t('questS1Lab.skip')}
          </button>
        </div>
      )}
    </WanderlustAmbientField>
  );
};


const WrappedQuestS1LabPage: React.FC = () => (
  <PgCardKitShell>
    <QuestS1LabPage />
  </PgCardKitShell>
);

export default WrappedQuestS1LabPage;
