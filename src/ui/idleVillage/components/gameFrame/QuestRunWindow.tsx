/**
 * QuestRunWindow — the running quest, as a floating HUD shell on /game
 * (R-106, R-196/PLAN-035).
 *
 * Reading order, top to bottom (Director 2026-10-08):
 *   title + icons (roster assigned to the quest, bag, chronicle, minimise, close)
 *   → flavour → cinema-scope theater → what happened + the scene → choices
 *   → time bar (game clock, start → return) → phase tiles (played + next).
 *
 * R-196 shell contract, revised by R-199 (Director 2026-10-15):
 * - ONE `[data-hud-panel]` wrapper carries the window and its companion
 *   columns (`[data-hud-companion="left|right|belt"]`) — the drag clamps the union
 *   (`useHudPanelDrag` + `resolveQuestShellLayout`, never the box alone).
 * - NO `overflow` on `HudPlaque`: the SVG drop-shadow would clip to the
 *   section's box (WebKit) and absolutely-placed companions would be cut off.
 * - Party roster LEFT, chronicle RIGHT, belt as a bottom strip near the
 *   choices (R-199 pt.13) — each independently toggleable
 *   (`aria-expanded`/`aria-controls`), CLOSED by default
 *   (`questWindow.companionsDefaultOpen`), auto-collapsed by the shared
 *   layout predicate on narrow viewports.
 * - Beats advance on click-anywhere or any key — there is NO skip button.
 * - Check beats hand the frozen `DestinyAstrolabeV62` to the external
 *   `QuestSkillCheckOverlay` (`#game-modal-root`, PLAN-040) — published
 *   through `questRunStore`'s bridge while the beat is held
 *   (engine-resolved verdict, presentation only); its options popover lives
 *   on the header.
 * - The end-of-run report is OUT of this window — `QuestRewardPopup`,
 *   mounted at page level (R-199 pt.14).
 * - «Abbandona quest» sits in the header icons, asks for an inline confirm,
 *   and routes through `useQuestRun.abandon` → engine `flee`.
 *
 * Material: `HudPlaque` panel, dragged by its title row (`useHudPanelDrag`) like
 * every HUD panel; colours only from `--skin-*` tokens; no text under 12px.
 * Minimising folds it into a small plaque that keeps the phase count and a mark
 * while a decision is waiting; closing keeps the run (the Panels menu reopens it).
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import * as Tooltip from '@radix-ui/react-tooltip';
import { EngravedIcon, type EngravedIconId } from './engravedIcons';
import { HudPlaque, SkinScope } from '@/ui/idleVillage/skins/primitives';
import {
  CenterApertureReveal,
  DamageFloater,
  EdgeFlash,
  JCutStage,
  KenBurnsDolly,
  Letterbox,
  PreVerdictBreath,
  StageImpactShake,
  TypewriterText,
  prefersReducedMotion,
  useBeatFx,
  type BeatFx,
} from '@/ui/idleVillage/skins/primitives';
import { cueHasTag, theatreCueForBeat } from '@/ui/idleVillage/questS1Lab/questTheatreSequencer';
import { DepthScene } from '@/ui/idleVillage/questS1Lab/render/DepthScene';
import { cinematicEntryForSrc } from '@/ui/idleVillage/questS1Lab/render/sceneManifest';
import { JOURNEY_LEG_ART } from '@/ui/idleVillage/questS1Lab/questArt';
import { documentClock, resolveShot } from '@/ui/idleVillage/questS1Lab/render/cameraEval';
import type { CameraShot } from '@/balancing/config/idleVillage/quests/questTheatreFx';
import { getQuestTheatreAudio } from '@/ui/idleVillage/audio/questTheatreAudio';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { DEFAULT_QUEST_THEATRE_FX, type QuestTheatreFxConfig } from '@/balancing/config/idleVillage/quests/questTheatreFx';
import { availableOptions, beltItemStatuses, currentExposure, nextCombatHits, nodesFor, previewArmedActionItems, previewOption, type QuestRunState, type ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { useBeatCursor, type BeatTiming, type HarmBeat, type QuestBeat } from '@/ui/idleVillage/questS1Lab/beatSequencer';
import { checkEventOf, isStaleCheckEvent, publishCheckBridge, type QuestCheckOverlayHandle } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { QuestCheckOptionsPanel, type QuestCheckOptions } from './QuestCheckOptionsPanel';
import { QuestJourneyPhaseStrip } from './QuestJourneyPhaseStrip';
import type { Verdict } from '@/ui/idleVillage/questS1Lab/questScenario';
import { hpLostByMember, phaseOutcome, type PhaseOutcome, type PhaseRecord } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import { questPhaseCheckpoints, type TimeBarCheckpoint } from '@/ui/idleVillage/questS1Lab/questSchedule';
import { HudChip, LOG_TONE, SCRIM, TONE, toneText } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import { questBagItems } from './questBag';
import { useHudPanelDrag } from './useHudPanelDrag';
import { getHudZoomFactor } from './hudScale';
import { resolveQuestShellLayout } from './questShellLayout';
import { BeltItemChips, QuestBeltPlaque } from './QuestBeltPlaque';
import { QuestPartyRosterPanel } from './QuestPartyRosterPanel';
import { QuestLogPanel } from './QuestLogPanel';

/** Verdict chip tone: the result reads at a glance, before its authored line. */
const VERDICT_TONE: Record<Verdict, 'ok' | 'warn' | 'danger'> = { bigwin: 'ok', win: 'ok', almost: 'warn', fail: 'danger', epicfail: 'danger' };

/** One glyph per authored phase (index = node `beat`). */
const PHASE_ICONS: EngravedIconId[] = ['ico-scroll', 'evt-expedition', 'ico-pouch', 'ico-axe', 'evt-combat', 'ico-gust', 'ico-chest', 'nav-village'];

const OUTCOME_TONE: Record<PhaseOutcome, keyof typeof TONE> = { death: 'death', hurt: 'warn', loot: 'label', clean: 'label' };

/** Shared "no items armed" set — the previews' consumable-free baseline. */
const NO_ARMED: ReadonlySet<string> = new Set();

/** Companion geometry fallback for harnesses — the canonical config values. */
const DEFAULT_COMPANIONS = {
  widthPx: DEFAULT_GAME_FRAME_CONFIG.questWindow.sidePanelWidthPx,
  gapPx: DEFAULT_GAME_FRAME_CONFIG.questWindow.sidePanelGapPx,
  minWidthPx: DEFAULT_GAME_FRAME_CONFIG.questWindow.minSidePanelWidthPx,
  edgeInsetPx: DEFAULT_GAME_FRAME_CONFIG.questWindow.edgeInsetPx,
};

const FONT = {
  display: 'var(--skin-font-display)',
  serif: 'var(--skin-font-serif)',
} as const;

export interface QuestRunWindowProps {
  run: QuestRunState;
  phases: PhaseRecord[];
  /** Phase names, indexed by node `beat`. */
  beats: readonly string[];
  /** Committed-but-unpresented moments (PLAN-025 T-008): the window replays
   *  them one at a time — click anywhere on the beat to continue. */
  queuedBeats: QuestBeat[];
  /** R-242: the queue owner's cursor ref (`useQuestRun.beatCursorRef`) — the
   *  presentation position survives a close→reopen remount, so the window
   *  resumes at the held beat instead of replaying consumed beats. Omit for
   *  harnesses that want the legacy per-mount cursor. */
  beatCursorRef?: { current: number };
  /** Per-beat on-stage durations, from `gameFrameConfig.questWindow.beats`. */
  beatTiming: BeatTiming;
  title: string;
  flavour: string;
  /** The authored scenario — kept on the props contract for harnesses; the
   *  end-of-run report that consumed it moved to the external
   *  `QuestRewardPopup` (R-199 pt.14), the window no longer renders it. */
  scenario?: QuestScenario;
  /** Scene art for a node id. */
  artFor: (nodeId: string) => string | undefined;
  /** 0..1 of the expedition's time on the game clock, plus its readout. */
  time: { progress: number; label: string; overrunFrom?: number };
  onChoose: (optionId: string) => void;
  /** R-199: current game-clock tick — gates options on the frontier's
   *  `readyAt` (a phase is visible the whole time but committable only once
   *  its slice of the time bar has passed). Omit for clock-less harnesses. */
  nowTick?: number;
  /** R-199: «abbandona quest» — `useQuestRun.abandon` → engine `flee`. */
  onAbandon?: () => void;
  /** R-199: the page learns when the beat queue is still presenting — the
   *  external `QuestRewardPopup` opens only after the last beat lands. */
  onPresentingChange?: (presenting: boolean) => void;
  /** R-239: the page learns the strip state — while minimised the cluster's
   *  wings have no window to dock to (the check column would orphan on the
   *  map at its last wing geometry) and the check falls back to the
   *  `QuestSkillCheckOverlay` surface. */
  onMinimisedChange?: (minimised: boolean) => void;
  /** R-196: the per-item armed selection of the belt (`useQuestRun`). Optional
   *  for harnesses that render the window without a live run — defaults to
   *  "nothing armed" (the R-106 contract). */
  armedFlags?: ReadonlySet<string>;
  onToggleArmedFlag?: (flag: string) => void;
  onClose: () => void;
  /** Anchored position (the drag offset applies on top). Ignored in cluster mode. */
  anchor?: { left: number; top: number };
  /** PLAN-043 WS-4: mounted inside `QuestStageCluster` — the shell fills its
   *  solved column rect, drag belongs to the cluster (the title row still
   *  carries `data-hud-drag-handle`), and the companion column paints at the
   *  solver's wing slot. */
  inCluster?: boolean;
  /** Controlled companion tab — Party/Bag/Log live in ONE left column
   *  (artifact-r003 §2). Undefined = the window manages it internally. */
  activePill?: 'party' | 'bag' | 'log' | null;
  onPillToggle?: (pill: 'party' | 'bag' | 'log' | null) => void;
  /** The cluster geometry folded the left companion (mutual exclusion /
   *  expanded stage / budget) — the roster tab paints instead. */
  companionFolded?: boolean;
  /** WS-4: the beat on stage carries the `expanded` tag — the theatre uses
   *  the wide aspect. */
  expandedStage?: boolean;
  /** WS-4: the window reports the live cue's `expanded` tag upward so the
   *  cluster solver can widen the stage rect (BV-11 — suppressed while a
   *  check is live). */
  onExpandedStageChange?: (expanded: boolean) => void;
  widthPx: number;
  theaterAspect: number;
  tooltipLines: number;
  /** R-199 pt.5: cap on the narrative stage's height — the "what is
   *  happening" column reads wide and tall, scrolling only past this.
   *  Defaults to `questWindow.stageMaxHeightPx`. */
  stageMaxHeightPx?: number;
  /** Companion geometry + the shell's clamp inset
   *  (`gameFrameConfig.questWindow.sidePanel*`/`edgeInsetPx`). Optional —
   *  defaults to the canonical config so lab/test harnesses can omit it. */
  companions?: { widthPx: number; gapPx: number; minWidthPx: number; edgeInsetPx: number };
  zIndex?: number;
  /** PLAN-053 T-006: POI `estimatedDurationTicks` for the `~Nd` svolgimento
   *  bar of the journey strip — journeys only; legacy runs never read it. */
  journeySvolgimentoTicks?: number;
}

export const QuestRunWindow: React.FC<QuestRunWindowProps> = ({
  run,
  phases,
  beats,
  queuedBeats,
  beatCursorRef,
  beatTiming,
  title,
  flavour,
  artFor,
  time,
  onChoose,
  nowTick,
  onAbandon,
  onPresentingChange,
  onMinimisedChange,
  armedFlags = NO_ARMED,
  onToggleArmedFlag,
  onClose,
  anchor,
  inCluster = false,
  activePill: activePillProp,
  onPillToggle,
  companionFolded = false,
  expandedStage = false,
  onExpandedStageChange,
  widthPx,
  theaterAspect,
  tooltipLines,
  stageMaxHeightPx = DEFAULT_GAME_FRAME_CONFIG.questWindow.stageMaxHeightPx,
  companions = DEFAULT_COMPANIONS,
  zIndex,
  journeySvolgimentoTicks,
}) => {
  const { t } = useTranslation('idleVillage');
  const shellRef = useRef<HTMLDivElement | null>(null);
  /* R-199 pt.4 + WS-4: the companions start CLOSED — the player opens one
   * from its header pill. Party/Bag/Log live in ONE left column
   * (artifact-r003 §2: tabbed CompanionLeft, supersedes the R-196 split).
   * Controlled (`activePill`/`onPillToggle`) when the cluster owns the wing
   * state; standalone mounts keep the internal state. */
  const companionsDefault = DEFAULT_GAME_FRAME_CONFIG.questWindow.companionsDefaultOpen;
  type CompanionPill = 'party' | 'bag' | 'log';
  const [pillInternal, setPillInternal] = useState<CompanionPill | null>(companionsDefault ? 'party' : null);
  const activePill: CompanionPill | null = onPillToggle ? (activePillProp ?? null) : pillInternal;
  const setPill = useCallback(
    (pill: CompanionPill | null) => (onPillToggle ? onPillToggle(pill) : setPillInternal(pill)),
    [onPillToggle],
  );
  const partyOpen = activePill === 'party';
  const beltOpen = activePill === 'bag';
  const logOpen = activePill === 'log';
  /* R-199 pt.9: the per-check presentation options popover (skip intro /
   * skip the astrolabe entirely — the verdict still lands as a beat). */
  const checkCfg = DEFAULT_GAME_FRAME_CONFIG.questWindow.skillCheck;
  /* PLAN-040 T-001: the window's vertical budget — stage floor, choices cap
   *  and theatre shrink floor all live in config (config-first). */
  const questWindow = DEFAULT_GAME_FRAME_CONFIG.questWindow;
  const [checkOptsOpen, setCheckOptsOpen] = useState(false);
  const [checkOpts, setCheckOpts] = useState<QuestCheckOptions>({ skipIntro: false, skipCheck: false });
  /* R-199 pt.12: «abbandona quest» asks inline before committing (WS-4: the
   *  affordance lives in the collapsible footer, not the header). */
  const [abandonAsked, setAbandonAsked] = useState(false);
  /* WS-4 footer C1: the time/phase strip folds to a thin seam. */
  const [footerOpen, setFooterOpen] = useState(true);
  const partyToggleRef = useRef<HTMLButtonElement | null>(null);
  const beltToggleRef = useRef<HTMLButtonElement | null>(null);
  const logToggleRef = useRef<HTMLButtonElement | null>(null);
  const checkOptsToggleRef = useRef<HTMLButtonElement | null>(null);
  /* Live viewport width — the companions fit/collapse on the SAME predicate
   * the drag clamps against (WITNESS-01: no divergence between render and
   * clamp). */
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));
  const [vh, setVh] = useState(() => (typeof window === 'undefined' ? 800 : window.innerHeight));
  /* PLAN-043 WS-5 DEF-06: `vw`/`vh` hold device px (resize listener); every
   *  layout consumer below works in chrome-layer units — `vwU`/`vhU` are the
   *  unit-space size (factor 1 when unzoomed or natively zoomed). */
  const hudZoom = getHudZoomFactor();
  const vwU = vw / hudZoom;
  const vhU = vh / hudZoom;
  useEffect(() => {
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const layout = useMemo(
    () =>
      resolveQuestShellLayout(vwU, {
        widthPx,
        sidePanelWidthPx: companions.widthPx,
        sidePanelGapPx: companions.gapPx,
        minSidePanelWidthPx: companions.minWidthPx,
        edgeInsetPx: companions.edgeInsetPx,
      }),
    [vw, widthPx, companions],
  );
  const clusterCfg = DEFAULT_GAME_FRAME_CONFIG.questWindow.cluster;
  /* In cluster mode the solver decides whether the left wing may unfold —
   * the window never second-guesses it (`companionFolded` is already the
   * effective state). Standalone keeps the R-196 fit predicate. */
  const companionsFit = inCluster ? true : layout.companionsFit;
  const sideWidth = inCluster
    ? vwU >= clusterCfg.companionLeft.wideAtPx
      ? clusterCfg.companionLeft.wideWidthPx
      : clusterCfg.companionLeft.widthPx
    : layout.effectiveSideWidth;
  const companionGap = inCluster ? clusterCfg.gapPx : companions.gapPx;
  const { panelStyle, handleProps: dragHandleProps } = useHudPanelDrag({
    shellRef,
    edgeInsetPx: companions.edgeInsetPx,
    reclampDeps: [partyOpen, beltOpen, logOpen, companionsFit, sideWidth],
    /* The cluster owns position + drag — this hook must never observe or
     * transform the shell in cluster mode. */
    disabled: inCluster,
  });
  /* Cluster mode: the group-level drag owns the gesture — the title row only
   *  carries the claim marker, no per-panel hook listeners. */
  const handleProps = inCluster
    ? ({ 'data-hud-drag-handle': '', style: { cursor: 'grab' } } as typeof dragHandleProps)
    : dragHandleProps;
  const [minimised, setMinimised] = useState(false);
  /* R-239: report the strip state upward — while minimised the cluster's
   *  wings must unmount (no window to dock to) and the check falls back to
   *  the overlay surface. Ref-held so a caller identity change never
   *  re-reports; unmount reports `false`. */
  const onMinimisedChangeRef = useRef(onMinimisedChange);
  onMinimisedChangeRef.current = onMinimisedChange;
  useEffect(() => { onMinimisedChangeRef.current?.(minimised); }, [minimised]);
  useEffect(() => () => onMinimisedChangeRef.current?.(false), []);
  const allNodes = nodesFor(run);
  const node = allNodes[run.nodeId];
  /* R-199 pt.11: `nowTick` marks options locked while their frontier's slot
   *  on the time bar has not arrived — visible, not yet committable. */
  const options = useMemo(() => availableOptions(run, nowTick), [run, nowTick]);
  const frontierLocked = !run.ended && run.frontier.status === 'waiting' && nowTick !== undefined && nowTick < run.frontier.readyAt;
  /* Beat replay (T-008): while committed beats are still on stage the window
   *  presents them one at a time and blocks input — the frontier has already
   *  committed, choices must not fire mid-beat. Click or ANY key skips
   *  (R-199 pt.1: there is no skip button at all). */
  const reducedMotion = prefersReducedMotion();
  /* R-199 pt.10: check beats dock the frozen astrolabe over the theatre —
   *  it paints the engine-resolved verdict (presentation only). The beat is
   *  HELD while it spins (`hold` → cursor parks at `checkHoldMs` as a
   *  leak-guard); resolve → verdict dwell → advance. `skipCheck` opts out
   *  of the theatre entirely and lets the normal text beat run. */
  const [astroSettledIds, setAstroSettledIds] = useState<ReadonlySet<string>>(new Set());
  const astroSettledRef = useRef<ReadonlySet<string>>(new Set());
  astroSettledRef.current = astroSettledIds;
  /* PLAN-040 T-003b: the astrolabe lives in `QuestSkillCheckOverlay` now —
   *  a sibling under `#game-modal-root`. This slot is the imperative channel
   *  it fills on mount (skipToResult / throwNow). */
  const checkHandleRef = useRef<QuestCheckOverlayHandle | null>(null);
  const astroShownFor = useCallback(
    (b: QuestBeat | null | undefined) => {
      if (!b || b.kind !== 'check' || checkOpts.skipCheck) return false;
      /* Presenter parity: both astrolabe presenters (right-wing column and
       * centred overlay) mount ONLY for a live check event — the same
       * `checkEventOf`/`isStaleCheckEvent` gate. A check the run already
       * dismissed (`checkSeq <= run.dismissedUpTo` — hydration reabsorbs
       * settled checks, a mid-run outcome dismissal raises the mark) can
       * never paint a presenter, so holding its beat would deadlock the
       * cursor until `checkHoldMs` with `progress()` no-op on a null handle.
       * Let it flow as an ordinary timed beat instead. */
      const evt = checkEventOf(run, b.check);
      return Boolean(evt) && !isStaleCheckEvent(evt, run);
    },
    [checkOpts.skipCheck, run],
  );
  const beatCursor = useBeatCursor(queuedBeats, beatTiming, { reducedMotion, hold: astroShownFor, cursorRef: beatCursorRef });
  const presenting = beatCursor.current !== null;
  const currentBeat_ = beatCursor.current;
  const astroActive = astroShownFor(currentBeat_);
  const astroSettled = currentBeat_ ? astroSettledIds.has(currentBeat_.id) : false;
  /* The engine already resolved verdict AND harm; the astrolabe only paints
   *  it — same forced-mode contract as the S1 lab. */
  const astroCheck = astroActive && currentBeat_.kind === 'check' ? currentBeat_.check : null;
  const astroMode = astroCheck
    ? astroCheck.verdict === 'fail' && astroCheck.harm === 'death'
      ? 'fail_dead'
      : astroCheck.verdict === 'fail' && astroCheck.harm === 'wound'
        ? 'fail_wound'
        : astroCheck.verdict
    : undefined;

  /* Read-through ref for the imperative handlers (resolve → dismiss → skip). */
  const cursorRef = useRef(beatCursor);
  cursorRef.current = beatCursor;

  /** Astrolabe resolved → the verdict is painted; the beat stays held until
   *  the player dismisses the overlay (`onDismiss` → `cursor.skip()`) or the
   *  `checkHoldMs` leak-guard fires. PLAN-040 T-003b: no more timed dwell —
   *  the verdict lives on the overlay, dismissed by click. */
  const handleAstroResolve = useCallback((beatId: string) => {
    setAstroSettledIds((prev) => (prev.has(beatId) ? prev : new Set(prev).add(beatId)));
  }, []);

  /* PLAN-040 T-003a: while a check beat is held the window publishes the
   *  presentation bridge — `questOverlays` (sibling under `#game-modal-root`)
   *  paints the astrolabe from it and reports resolve/dismiss back. Cleared
   *  the moment the beat is no longer a held check. */
  useEffect(() => {
    if (!astroActive || !astroCheck || !currentBeat_ || !astroMode) return;
    const beatId = currentBeat_.id;
    publishCheckBridge(run.questId, {
      beatId,
      check: astroCheck,
      mode: astroMode,
      autoThrow: checkOpts.skipIntro,
      handle: checkHandleRef,
      onResolved: (id) => handleAstroResolve(id),
      /* Dismiss settles the held beat — idempotent on any other beat id. */
      onDismiss: (id) => {
        if (cursorRef.current.current?.id === id) cursorRef.current.skip();
      },
    });
    return () => publishCheckBridge(run.questId, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [astroActive, astroCheck, currentBeat_?.id, astroMode, checkOpts.skipIntro, run.questId, handleAstroResolve]);

  /** Progressive skip — the ONLY fast-forward affordance (R-199 pt.1: no
   *  button). During the astrolabe's spin it settles the verdict (through the
   *  overlay's imperative handle); after resolve the overlay's own dismiss
   *  path settles the beat; anywhere else it ends the beat. */
  const advancePresentation = useCallback(() => {
    const c = cursorRef.current;
    const beat = c.current;
    /* BV-08: a skip silences the outgoing beat's audio before the cursor
     *  moves — no orphaned oscillators across rapid skips. */
    getQuestTheatreAudio().cancelCurrentBeatAudio();
    if (beat && astroShownFor(beat) && !astroSettledRef.current.has(beat.id)) {
      /* R-241 B3 (INV-3): the click PROGRESSES the astrolabe — the
       *  presenter's `progress()` throws the ball while the spin has not
       *  started and only skips to the verdict once the ball is flying.
       *  A bare `skipToResult()` killed the throw animation on the first
       *  click. */
      checkHandleRef.current?.progress();
      return;
    }
    c.skip();
  }, [astroShownFor]);
  // Cinema FX (T-009): the configured beat→fx mapping for the beat on stage.
  const beatFx = useBeatFx(beatCursor.current, DEFAULT_QUEST_THEATRE_FX);
  /* WS-4 cinema layer cue (artifact-r003 §4): authored `stageDirection.cut`
   *  on the beat's node overrides the `cutOn[kind]` defaults. Keyed on
   *  `beat.id` so layers re-fire only on a beat change. */
  const nodeForBeat = useCallback(
    (b: QuestBeat) => (b.kind === 'scene' ? allNodes[b.nodeId] : undefined),
    [allNodes],
  );
  const theatreCue = useMemo(
    () => theatreCueForBeat(beatCursor.current, nodeForBeat, DEFAULT_QUEST_THEATRE_FX),
    [beatCursor.current, nodeForBeat],
  );
  /* PLAN-050 §7 + R-231 #9 — ingresso × posa + post-entrance continuity:
   *  the scene's resolved camera shot and its epoch key are LATCHED per
   *  scene arrival (`sceneVisitKey`) so that when `presenting` flips from
   *  `true` to `false` (or the player clicks/presses a key to skip the
   *  typewriter mid-entrance), the camera NEVER snaps back to `idleDrift`
   *  or resets `shotEpoch`. Instead it continues its entrance glide through
   *  `shot.durMs` and smoothly enters `postSettle` 2.5D breathing. */
  /* R-241 B1 (quest-run-window.INV-1): the stage scene is LATCHED. While a
   *  non-scene beat (check, harm, end) is on stage `run.nodeId` has already
   *  committed the ARRIVAL node — reading it would cut the theatre's art
   *  under the spinning astrolabe. The shown scene only moves when
   *  a scene beat mounts or the queue drains to the frontier; for a window
   *  remounted mid-queue (ref empty) the last scene beat still pending
   *  behind the cursor is the fallback, then the frontier. */
  const stageSceneNodeRef = useRef<string | null>(null);
  const heldBeat = beatCursor.current;
  let heldSceneNodeId: string | null = null;
  if (heldBeat && heldBeat.kind !== 'scene') {
    const idx = queuedBeats.indexOf(heldBeat);
    for (let i = idx - 1; i >= 0 && heldSceneNodeId === null; i -= 1) {
      const b = queuedBeats[i];
      if (b?.kind === 'scene') heldSceneNodeId = b.nodeId;
    }
    heldSceneNodeId ??= stageSceneNodeRef.current;
  }
  const activeSceneNodeId =
    heldBeat?.kind === 'scene'
      ? heldBeat.nodeId
      : heldBeat === null
        ? run.nodeId
        : (heldSceneNodeId ?? run.nodeId);
  stageSceneNodeRef.current = activeSceneNodeId;
  /* T-A3 (R-239): the art must show the node whose scene beat is on stage —
   *  `run.nodeId` moves the moment a choice commits while the beat queue
   *  still replays the previous node's beats. R-245 (Director): NOTHING is
   *  painted over the artwork — the diegetic caption is gone, so the latch
   *  below only feeds `artFor`. */
  /* PLAN-053/R-263 journey legs: a travel fase owns no scenario node —
   *  `run.nodeId` still points at the last arrived node, so without an
   *  override the theatre would sit on stale art for the whole leg
   *  (goblin andata = 2 days on sentiero-tracce). While the beat queue is
   *  drained (frontier travel or a parked road beat) the stage shows the
   *  leg painting — andata → the open gate, ritorno → the valley home.
   *  A mounted scene beat always wins (authored art), and once the run
   *  ends (`gob-fine` village) the leg override disengages. */
  const journeyLegArt =
    heldBeat === null && run.journey && !run.ended && run.journey.journal.currentFase !== 'svolgimento'
      ? JOURNEY_LEG_ART[run.journey.journal.currentFase]
      : undefined;
  const theaterArtSrc = journeyLegArt?.src ?? artFor(activeSceneNodeId);
  const cineForBeat = useMemo(() => cinematicEntryForSrc(theaterArtSrc), [theaterArtSrc]);
  const lastArtRef = useRef<string | undefined>(undefined);
  const sceneVisitKey = `scene:${activeSceneNodeId}:${theaterArtSrc ?? ''}`;
  const sceneCameraLatchRef = useRef<{ key: string; changed: boolean; shot: CameraShot | null }>({
    key: '',
    changed: false,
    shot: null,
  });
  if (sceneCameraLatchRef.current.key !== sceneVisitKey) {
    const changed = theaterArtSrc !== lastArtRef.current;
    const activeNode = allNodes[activeSceneNodeId];
    const resolvedSceneShot = resolveShot(
      { kind: 'scene' },
      activeNode,
      theatreCue?.tags ?? DEFAULT_QUEST_THEATRE_FX.cinema.cutOn.scene,
      DEFAULT_QUEST_THEATRE_FX.camera,
      {
        artChanged: changed,
        entrance: cineForBeat?.entrance,
        pose: cineForBeat?.pose,
      },
    );
    sceneCameraLatchRef.current = {
      key: sceneVisitKey,
      changed,
      shot: resolvedSceneShot,
    };
  }
  const artChanged = sceneCameraLatchRef.current.changed;
  useEffect(() => {
    lastArtRef.current = theaterArtSrc;
  }, [sceneVisitKey, theaterArtSrc]);
  /* PLAN-046 + R-231 #9: non-scene beats (`check`/`harm`/`end`) resolve
   *  their own shot; scene beats AND the post-presentation waiting state keep
   *  the latched scene shot + key so the timeline is continuous. */
  const isNonSceneBeat = Boolean(beatCursor.current && beatCursor.current.kind !== 'scene');
  const activeShotKey = isNonSceneBeat ? (theatreCue?.key ?? sceneVisitKey) : sceneVisitKey;
  const cameraShot = useMemo(
    () =>
      isNonSceneBeat
        ? resolveShot(
            beatCursor.current,
            beatCursor.current ? nodeForBeat(beatCursor.current) : null,
            theatreCue?.tags ?? [],
            DEFAULT_QUEST_THEATRE_FX.camera,
            {
              artChanged,
              entrance: cineForBeat?.entrance,
              pose: cineForBeat?.pose,
            },
          )
        : (sceneCameraLatchRef.current.shot ?? DEFAULT_QUEST_THEATRE_FX.camera.idleDrift),
    [isNonSceneBeat, beatCursor.current, nodeForBeat, theatreCue, artChanged, cineForBeat, sceneVisitKey],
  );
  /* WS-4 audio choreography: one cue per beat, scheduled against the shared
   *  AudioContext — `j-cut` beats fire through JCutStage's lead hook instead
   *  (the audio leads the visual by `jCutLeadMs`). Reduced motion silences
   *  the stage (BV-09). The continuous riser starts under the spin and ducks
   *  on beat end via the effect cleanup. */
  useEffect(() => {
    const cue = theatreCue;
    if (!cue?.audio || reducedMotion) return undefined;
    const audio = getQuestTheatreAudio();
    if (cue.tags.includes('j-cut')) return undefined;
    if (cue.audio === 'tension_riser') {
      audio.startRiser();
      return () => audio.stopRiser();
    }
    audio.play(cue.audio);
    /* PLAN-050 §6 — entrance shots get the landing hit at `settleAt` of
     *  their duration (the whoosh is the beat's own `cut_*` cue). */
    if (cameraShot.durMs > 0 && (cameraShot.blurFrom > 0 || cameraShot.zoomFrom > cameraShot.zoomTo)) {
      audio.play('shot_settle', { delayMs: Math.round(DEFAULT_QUEST_THEATRE_FX.cinema.settleAt * cameraShot.durMs) });
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theatreCue?.key]);
  /* Pre-warm the shared context on mount (idle tick — never inside a beat
   *  handler, T-10); the choice commit gesture calls `resume()`. */
  useEffect(() => {
    if (reducedMotion) return;
    getQuestTheatreAudio().prewarm();
  }, [reducedMotion]);
  /* The solver owns the wide-stage geometry — the window reports the live
   *  cue's `expanded` tag upward (the `astroActive` suppression lives in the
   *  solver's `wings.rightOpen` precedence, not here). */
  const cueExpanded = cueHasTag(theatreCue, 'expanded') && presenting;
  useEffect(() => {
    onExpandedStageChange?.(cueExpanded);
  }, [cueExpanded, onExpandedStageChange]);
  /** Choice commit — the gesture unlocks WebAudio (`resume()` inside the
   *  click, autoplay gate) and the brass click lands the commit. PLAN-050
   *  §6: the press locks the row for `choiceCommitLockMs` before the
   *  consequence — the tactile "committed" beat (camera stays still;
   *  agency is UI-side). Under reduced motion the whole audio path stays
   *  dormant (BV-09): no context is instantiated for a cue that would
   *  never play. */
  const [commitLock, setCommitLock] = useState<string | null>(null);
  const handleChoose = useCallback(
    (optionId: string) => {
      if (commitLock) return;
      if (!reducedMotion) {
        const audio = getQuestTheatreAudio();
        audio.resume();
        audio.play('choice_commit');
        const lockMs = DEFAULT_QUEST_THEATRE_FX.cinema.choiceCommitLockMs;
        if (lockMs > 0) {
          setCommitLock(optionId);
          window.setTimeout(() => {
            onChoose(optionId);
            setCommitLock(null);
          }, lockMs);
          return;
        }
      }
      onChoose(optionId);
    },
    [onChoose, reducedMotion, commitLock],
  );
  /* R-196 previews: the armed per-item set is the source of truth — check
   *  items light their winner, action items pre-mutate a clone. `base` is the
   *  same preview with an empty armed set (the "nothing spent" column). */
  const previews = useMemo(
    () =>
      Object.fromEntries(
        options.map((o) => {
          const pv = previewOption(run, o.id, { armedFlags });
          const base = pv && pv.consumableFlag ? previewOption(run, o.id, { armedFlags: NO_ARMED }) : null;
          return [o.id, { pv, base }];
        }),
      ),
    [run, options, armedFlags],
  );
  /* The checks every option on stage can reach — the belt's winner/shadowed/
   * inert marking is computed against exactly this frontier (never a guess). */
  const reachableChecks = useMemo(() => {
    /* `availableOptions` drops `next` — join the visible, enabled option ids
     * back to the node's option table to reach the check nodes. */
    const byId = new Map((node?.options ?? []).map((o) => [o.id, o]));
    return options
      .filter((o) => !o.disabled)
      .map((o) => byId.get(o.id)?.next)
      .filter((n): n is string => !!n && n.startsWith('CHECK:'))
      .map((n) => allNodes[n.slice(6)])
      .filter((n): n is NonNullable<typeof n> => !!n);
  }, [options, node, allNodes]);
  const bag = useMemo(() => questBagItems(run.flags), [run.flags]);
  const beltStatuses = useMemo(() => beltItemStatuses(run, reachableChecks, armedFlags), [run, reachableChecks, armedFlags]);
  /* Action-item preview: the same deterministic step, on a clone — the
   * roster's +HP chips read `memberDeltas`, the log stays clean. */
  const actionPreview = useMemo(() => previewArmedActionItems(run, armedFlags), [run, armedFlags]);
  const waiting = !run.ended && options.length > 0;
  /* T-A5 (R-239): the fold must land on a row boundary. A fixed pixel cap
   *  cuts the straddling row in half — round `choicesMaxHeightPx` DOWN to a
   *  multiple of the measured row pitch (`offsetTop` delta covers margins
   *  and gaps). Re-measures when the row set changes; never clips a row. */
  const choicesListRef = useRef<HTMLDivElement>(null);
  const [choicesCapPx, setChoicesCapPx] = useState(questWindow.choicesMaxHeightPx);
  useLayoutEffect(() => {
    const list = choicesListRef.current;
    if (!list) return undefined;
    const measure = () => {
      const rows = list.querySelectorAll<HTMLElement>(
        '[data-testid="quest-window-choice"], [data-testid="quest-window-close-report"]',
      );
      const r0 = rows[0];
      const r1 = rows[1];
      const pitch = r0 ? (r1 ? r1.offsetTop - r0.offsetTop : r0.offsetHeight) : 0;
      const cap = pitch > 0
        ? Math.max(pitch, Math.floor(questWindow.choicesMaxHeightPx / pitch) * pitch)
        : questWindow.choicesMaxHeightPx;
      setChoicesCapPx((prev) => (prev === cap ? prev : cap));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [questWindow.choicesMaxHeightPx, options.length, waiting, run.ended, presenting]);
  // What just happened: this action's checks speak through their authored verdict
  // lines; `lastEvent` only when it adds something (not the check summary, the
  // scene body or the quest's own flavour line again).
  const resolved: ResolvedCheck[] = run.log.length > 1 ? run.checkQueue : [];
  const lastTitle = resolved[resolved.length - 1]?.title;
  const showLastEvent =
    run.log.length > 1 &&
    !!run.lastEvent &&
    run.lastEvent !== node?.body &&
    run.lastEvent !== flavour &&
    !(lastTitle && run.lastEvent.startsWith(`${lastTitle} —`));
  const currentBeat = phases[phases.length - 1]?.beat ?? 0;

  // 1–9 pick a choice, as in a dialogue list; never while typing, minimised,
  // or while a beat is still on stage. CAPTURE phase: this listener must run
  // before the frame-level speed keys (bubble), which honor defaultPrevented —
  // speed changes only when no selection is pending (R-231 ruling).
  useEffect(() => {
    if (minimised || !waiting || presenting) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName))) return;
      const index = Number(event.key) - 1;
      const option = Number.isInteger(index) ? options[index] : undefined;
      if (option && !option.disabled) {
        event.preventDefault();
        handleChoose(option.id);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [minimised, waiting, presenting, options, handleChoose]);

  // R-199 pt.1: while a beat plays, ANY key advances it — same as clicking
  // on the presentation. Interactive surfaces (buttons, inputs, links) keep
  // their own keys; plain presses route through `advancePresentation`.
  useEffect(() => {
    if (!presenting || minimised) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) {
        // window/document target (nothing focused) — still advances.
        event.preventDefault();
        advancePresentation();
        return;
      }
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName))) return;
      if (target.closest('button, a[href]')) return;
      event.preventDefault();
      advancePresentation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [presenting, minimised, advancePresentation]);

  // The page learns when beats are on stage — the external reward popup
  // waits for the last beat to land before it opens.
  useEffect(() => {
    onPresentingChange?.(presenting);
  }, [presenting, onPresentingChange]);

  const anchorTop = anchor?.top ?? 0;
  const shell: CSSProperties = inCluster
    ? /* `absolute` resolves against the positioned cluster slot — NOT `100%`
       * of the shell's parent, which is `skin-scope`'s auto-height div (a
       * `height:100%` there would resolve to content height and unbind the
       * plaque from the solver's vertical budget). */
      { position: 'absolute', inset: 0, pointerEvents: 'auto' }
    : { position: 'fixed', left: anchor?.left ?? 0, top: anchorTop, pointerEvents: 'auto', ...panelStyle, zIndex: panelStyle.zIndex ?? zIndex };
  /* `vhU` is chrome units: inside the CSS-zoomed layer `100vh` would resolve
   *  to viewport×zoom — the unit-space height is `vhU` (DEF-06). */
  const plaqueMaxH = inCluster ? '100%' : `${Math.max(0, vhU - anchorTop - companions.edgeInsetPx)}px`;
  /* PLAN-040 T-001: on short viewports the theatre floor lowers so a choice
   * row + the phase tiles stay reachable above the scroll fold —
   * `min(theaterMinHeightPx, max(theaterMinHeightShortPx, cap*share))`. The
   * cap mirrors `plaqueMaxH` numerically (same anchor + edge inset). */
  const plaqueCapPx = Math.max(0, vhU - anchorTop - companions.edgeInsetPx);
  const theatreMinH = Math.min(
    questWindow.theaterMinHeightPx,
    Math.max(questWindow.theaterMinHeightShortPx, Math.floor(plaqueCapPx * questWindow.theaterMaxShareOfPlaque)),
  );
  const uid = React.useId();
  const partyPanelId = `${uid}-party`;
  const beltPanelId = `${uid}-belt`;
  const logPanelId = `${uid}-log`;
  const checkOptsPanelId = `${uid}-checkopts`;
  const abandonPanelId = `${uid}-abandon`;
  /* Panel close → focus returns to its header pill (WITNESS-04). */
  const pillRefOf = (pill: CompanionPill) =>
    pill === 'party' ? partyToggleRef : pill === 'bag' ? beltToggleRef : logToggleRef;
  const closePill = (pill: CompanionPill) => {
    setPill(null);
    pillRefOf(pill).current?.focus();
  };
  const closeParty = () => closePill('party');
  const closeBelt = () => closePill('bag');
  const closeLog = () => closePill('log');
  /* Focus hand-off (WITNESS-04): a choice commit takes focus to the beat
   * stage's Continue button (or the live region); when the stage empties and
   * focus was inside the shell, it settles on the narrative live region. */
  const wasPresenting = useRef(false);
  useEffect(() => {
    const became = presenting && !wasPresenting.current;
    const ended = !presenting && wasPresenting.current;
    wasPresenting.current = presenting;
    const shell = shellRef.current;
    if (!shell) return;
    if (became) {
      // R-199: no Continue button — the beat stage itself is the live region.
      shell.querySelector<HTMLElement>('[data-testid="quest-window-beat"]')?.focus({ preventScroll: true });
    } else if (ended && shell.contains(document.activeElement)) {
      shell.querySelector<HTMLElement>('[data-testid="quest-window-stage"]')?.focus({ preventScroll: true });
    }
  }, [presenting]);

  /* WS-4: ONE left companion column hosts the three tabs; the folded roster
   *  tab paints when the cluster geometry says the wing is folded (mutual
   *  exclusion at <1440 with a live check, expanded stage, tiny viewport). */
  const leftOpen = activePill !== null && (inCluster ? !companionFolded : companionsFit);
  const leftTabVisible = inCluster && activePill !== null && companionFolded;

  if (minimised) {
    return (
      <SkinScope>
        <div data-hud-panel="quest" ref={shellRef} style={shell}>
          <HudPlaque
            shape="hang"
            as="section"
            aria-label={title}
            data-testid="quest-window-minimised"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 18px' }}
          >
            <div {...handleProps} style={{ ...handleProps.style, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, paddingLeft: 4, minWidth: 0 }}>
                <EngravedIcon id="evt-combat" size={18} style={{ color: TONE.accent, flexShrink: 0 }} />
                <span style={{ fontFamily: FONT.display, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--skin-title-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {title}
                </span>
                <span style={{ fontFamily: FONT.display, fontSize: 12, color: TONE.secondary, flexShrink: 0 }}>
                  {Math.min(currentBeat + 1, beats.length)}/{beats.length}
                </span>
                {waiting && <span aria-label={t('gameFrame.questWindow.waiting')} title={t('gameFrame.questWindow.waiting')} style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--skin-title-color)', boxShadow: '0 0 8px var(--skin-title-color)', flexShrink: 0 }} />}
              </span>
              <span data-hud-controls="" style={{ display: 'inline-flex', marginLeft: 'auto', flexShrink: 0 }}>
                <button type="button" aria-label={t('gameFrame.questWindow.restore')} title={t('gameFrame.questWindow.restore')} onClick={() => setMinimised(false)}>
                  <EngravedIcon id="ico-scroll" />
                </button>
              </span>
            </div>
          </HudPlaque>
        </div>
      </SkinScope>
    );
  }

  /* R-196: the belt lives in the LEFT companion column (under the party
   * roster); the strip/belt slot inside the window is gone. */
  return (
    <SkinScope>
      <div data-hud-panel="quest" ref={shellRef} style={shell}>
        {/* WS-4: ONE tabbed left column — the header pills switch its content.
            In cluster mode this slot lands exactly on the solver's leftWing
            rect (`clampedLeft` — gap `companionGap` left of the window). */}
        {leftOpen && (
          <div
            data-hud-companion="left"
            data-testid="quest-companion-left"
            style={{ position: 'absolute', right: `calc(100% + ${companionGap}px)`, top: 0, bottom: 0, width: sideWidth, display: 'flex', flexDirection: 'column', gap: companionGap, minHeight: 0 }}
          >
            {partyOpen && <QuestPartyRosterPanel panelId={partyPanelId} run={run} healDeltas={actionPreview.memberDeltas} onClose={closeParty} />}
            {beltOpen && (
              <QuestBeltPlaque panelId={beltPanelId} items={bag} statuses={beltStatuses} armedFlags={armedFlags} onToggleFlag={onToggleArmedFlag ?? (() => undefined)} onClose={closeBelt} />
            )}
            {logOpen && <QuestLogPanel panelId={logPanelId} run={run} onClose={closeLog} />}
          </div>
        )}
        {/* WS-4 folded roster tab — `ROSTER X/Y ▸`, the 40px marker the solver
            reserves when the left wing is folded. Clicking keeps the tab
            intent alive (the solver unfolds it as soon as space returns). */}
        {leftTabVisible && (
          <button
            type="button"
            data-hud-companion="left-tab"
            data-testid="quest-companion-tab"
            aria-expanded={false}
            aria-controls={partyPanelId}
            title={t('gameFrame.questWindow.partyStatus', { alive: run.party.filter((m) => !m.dead).length, total: run.party.length })}
            onClick={() => setPill('party')}
            style={{
              position: 'absolute',
              right: `calc(100% + ${companionGap}px)`,
              top: 0,
              width: clusterCfg.companionLeft.foldedTabWidthPx,
              height: 120,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 0',
              borderRadius: 8,
              border: '1px solid color-mix(in srgb, var(--skin-surface-border) 70%, transparent)',
              background: 'var(--skin-hud-lacquer-deep)',
              color: 'var(--skin-title-color)',
              fontFamily: FONT.display,
              fontSize: 12,
              letterSpacing: '0.14em',
              cursor: 'pointer',
              writingMode: 'vertical-rl' as const,
            }}
          >
            {t('gameFrame.questWindow.rosterFolded', { alive: run.party.filter((m) => !m.dead).length, total: run.party.length })} ▸
          </button>
        )}
        <HudPlaque
          shape="panel"
          as="section"
          aria-label={title}
          data-testid="quest-window"
          /* Cluster mode: the solver's slot owns the width — a self-sized
           * plaque would overflow into the right wing's reserved column
           * (BV-01 measured this: plaque 820 in a 760 slot). */
          /* R-239 T-B3(d): the plaque is game chrome — text must never become
           * selectable while dragging or clicking through the theatre. */
          style={{ width: inCluster ? '100%' : widthPx, maxHeight: plaqueMaxH, display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px 14px', userSelect: 'none' }}
        >
        {/* ── Title row = drag handle; every icon lives on its right ── */}
        <div {...handleProps} title={t('gameFrame.panel.dragHint')} style={{ ...handleProps.style, display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ flex: 1, margin: 0, minWidth: 0, fontFamily: FONT.display, fontSize: 16, lineHeight: 1.2, letterSpacing: '0.06em', color: 'var(--skin-title-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </h2>
          {/* Companion + option toggles (R-196, rev. R-199): Party Roster left,
              Chronicle right, check options popover, «abbandona» — icon-only,
              `aria-expanded`/`aria-controls`, each opens its own plaque. */}
          <div data-hud-controls style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* WS-4 three-pill header — labeled pills open the ONE tabbed
                left column (Party / Bag / Log). Party shows the live health
                pips; Bag carries the armed dot. */}
            <HeaderPill
              refEl={partyToggleRef}
              icon="nav-company"
              label={t('gameFrame.questWindow.roster')}
              active={partyOpen}
              ariaControls={partyPanelId}
              testId="quest-party-toggle"
              onClick={() => setPill(partyOpen ? null : 'party')}
            >
              <PartyPips run={run} />
            </HeaderPill>
            <HeaderPill
              refEl={beltToggleRef}
              icon="nav-bag"
              label={t('gameFrame.questWindow.bag')}
              active={beltOpen}
              ariaControls={beltPanelId}
              testId="quest-belt-toggle"
              onClick={() => setPill(beltOpen ? null : 'bag')}
            >
              {armedFlags.size > 0 && (
                <span aria-hidden style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 999, background: 'var(--skin-title-color)' }} />
              )}
            </HeaderPill>
            <HeaderPill
              refEl={logToggleRef}
              icon="ico-scroll"
              label={t('gameFrame.questWindow.chronicle')}
              active={logOpen}
              ariaControls={logPanelId}
              testId="quest-log-toggle"
              onClick={() => setPill(logOpen ? null : 'log')}
            />
            {checkCfg.optionsPanel && !run.ended && (
              <HudTooltip label={t('gameFrame.questWindow.checkOptions')}>
                <button
                  type="button"
                  ref={checkOptsToggleRef}
                  aria-label={t('gameFrame.questWindow.checkOptions')}
                  aria-expanded={checkOptsOpen}
                  aria-controls={checkOptsPanelId}
                  data-testid="quest-check-options-toggle"
                  onClick={() => setCheckOptsOpen((v) => !v)}
                >
                  <EngravedIcon id="ico-spark" />
                </button>
              </HudTooltip>
            )}
            <HudTooltip label={t('gameFrame.questWindow.minimise')}>
              <button type="button" data-keep="" aria-label={t('gameFrame.questWindow.minimise')} onClick={() => setMinimised(true)}>
                <EngravedIcon id="cmd-minimize" />
              </button>
            </HudTooltip>
            {/* R-239: while a check beat is held the check owns this window —
                closing would evaporate the presentation (the bridge dies with
                the window and no fallback can mount). The button stays put,
                disabled, and its tooltip says why. */}
            <HudTooltip label={astroActive ? t('gameFrame.questWindow.checkInProgress') : t('gameFrame.panels.close')} disabled={astroActive}>
              <button
                type="button"
                data-keep=""
                aria-label={t('gameFrame.panels.close')}
                /* While disabled the Radix trigger wraps a span — keep the
                 * reason on the button itself for SR users (INV:R-239-check-held-window). */
                title={astroActive ? t('gameFrame.questWindow.checkInProgress') : undefined}
                disabled={astroActive}
                onClick={onClose}
              >
                <EngravedIcon id="cmd-close" />
              </button>
            </HudTooltip>
          </div>
        </div>

        {/* R-199 pt.9+12: two small popovers hang off the header — the check
            presentation options and the inline abandon confirm (non-modal:
            no backdrop, `Escape`/icon dismiss, focus returns to its toggle). */}
        {checkOptsOpen && checkCfg.optionsPanel && (
          <div data-hud-companion="opts" style={{ position: 'absolute', top: 44, right: 14, zIndex: 6 }}>
            <QuestCheckOptionsPanel
              panelId={checkOptsPanelId}
              options={checkOpts}
              allowSkipIntro={checkCfg.allowSkipIntro}
              allowSkipCheck={checkCfg.allowSkipCheck}
              onToggle={(key) => setCheckOpts((o) => ({ ...o, [key]: !o[key] }))}
              onClose={() => {
                setCheckOptsOpen(false);
                checkOptsToggleRef.current?.focus();
              }}
            />
          </div>
        )}
        {/* ── Content column: everything under the pinned title row lives in
            ONE region that NEVER scrolls (R-259 — no component scrollbar:
            only the narrative text box may scroll internally). On a
            height-capped plaque the theatre yields first via its min-height
            floor, then the text box shrinks and scrolls inside. ── */}
        <div className="quest-s1-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>

        {/* ── R-259: art + text + choices form ONE vertically-centred stack —
            the choices glue to the end of the text and the slack splits
            above/below the block instead of pooling between text and
            buttons («allinea i pulsanti alla fine del testo … tutto il più
            centrato possibile»). The footer stays pinned outside. ── */}
        <div style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>

        {/* ── Flavour: the quest's one line, above the picture ── */}
        <p style={{ margin: 0, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 14, lineHeight: 1.4, color: TONE.secondary }}>{flavour}</p>

        {/* ── Theater — a scene beat cuts the picture to its node; cinematic
            beats close the letterbox over it (T-009). R-199 pt.10: a check
            beat docks the frozen astrolabe over the whole frame — it paints
            the engine-resolved verdict, never decides it. Clicking it is the
            same progressive skip as clicking the stage. ── */}
        {/* PLAN-040 T-001: the theatre is the plaque's shrink reservoir —
            when the window is height-capped it compresses down to
            `theaterMinHeightPx` before anything else gives. The inner frame
            keeps its aspect normally and clamps to the wrapper when shrunk. */}
        <div
          data-testid="quest-theatre"
          onClick={
            presenting
              ? (e) => {
                  // The astrolabe's own TIRA button must throw, not advance.
                  if ((e.target as HTMLElement).closest('button')) return;
                  advancePresentation();
                }
              : undefined
          }
          /* R-259: NO `flexGrow` — the art keeps its authored aspect and the
             centred stack distributes the slack above/below the whole block.
             `theatreMinH` still floors the shrink on short viewports. */
          style={{ display: 'flex', flexDirection: 'column', minHeight: theatreMinH, flexShrink: 1, overflow: 'hidden', ...(presenting ? { cursor: 'pointer' } : {}) }}
        >
        {/* WS-4 cinema layers (artifact-r003 §4): the cue's tags each mount
            their primitive, keyed on the beat id — a new beat re-fires, a
            skipped beat unmounts mid-flight (no stacking). Order: the j-cut
            lead owns audio → impact shake owns transform → breath owns the
            filter → the dolly owns the art → reveal owns the aperture. */}
        <JCutStage
          cueKey={theatreCue?.key ?? ''}
          active={presenting && cueHasTag(theatreCue, 'j-cut')}
          leadMs={DEFAULT_QUEST_THEATRE_FX.cinema.jCutLeadMs}
          onLead={() => theatreCue?.audio && getQuestTheatreAudio().play(theatreCue.audio)}
          reducedMotion={reducedMotion}
        >
        <StageImpactShake
          cueKey={theatreCue?.key ?? ''}
          /* PLAN-050 §4: depth scenes shake through the trauma channel
           *  (depth-weighted, FG>BG) — the flat DOM shake would double. */
          active={cueHasTag(theatreCue, 'impact') && DEFAULT_QUEST_THEATRE_FX.cinema.impact.enabled && !cineForBeat}
          ampPx={DEFAULT_QUEST_THEATRE_FX.cinema.impact.ampPx}
          durationMs={DEFAULT_QUEST_THEATRE_FX.cinema.impact.durationMs}
          reducedMotion={reducedMotion}
        >
        <PreVerdictBreath
          cueKey={theatreCue?.key ?? ''}
          active={cueHasTag(theatreCue, 'breath') && DEFAULT_QUEST_THEATRE_FX.cinema.breath.enabled}
          durationMs={DEFAULT_QUEST_THEATRE_FX.cinema.breath.durationMs}
          usesFilter={DEFAULT_QUEST_THEATRE_FX.cinema.breath.usesFilter}
          reducedMotion={reducedMotion}
        >
        <KenBurnsDolly
          cueKey={theatreCue?.key ?? ''}
          active={presenting && cueHasTag(theatreCue, 'push') && DEFAULT_QUEST_THEATRE_FX.cinema.push.enabled}
          scaleTo={DEFAULT_QUEST_THEATRE_FX.cinema.push.scaleTo}
          durationMs={DEFAULT_QUEST_THEATRE_FX.cinema.push.durationMs}
          reducedMotion={reducedMotion}
        >
        <Theater
          src={theaterArtSrc}
          aspect={expandedStage || cueHasTag(theatreCue, 'expanded') ? clusterCfg.expandedTheaterAspect : theaterAspect}
          shot={cameraShot}
          shotKey={activeShotKey}
          traumaStrength={
            reducedMotion
              ? 0
              : beatCursor.current?.kind === 'harm'
                ? beatCursor.current.harm.kind === 'death'
                  ? 1
                  : 0.75
                : cueHasTag(theatreCue, 'impact')
                  ? 0.6
                  : 0
          }
          reducedMotion={reducedMotion}
        >
          {/* WS-4: a `reveal` cut opens the frame through the aperture —
              reduced motion degrades it to the config's 150ms fade. */}
          {cueHasTag(theatreCue, 'reveal') && (
            <CenterApertureReveal
              cueKey={theatreCue?.key ?? ''}
              durationMs={DEFAULT_QUEST_THEATRE_FX.cinema.revealMs}
              fadeMs={DEFAULT_QUEST_THEATRE_FX.cinema.reducedMotionFadeMs}
              startInsetPct={DEFAULT_QUEST_THEATRE_FX.cinema.revealStartInsetPct}
              color="var(--skin-hud-lacquer-deep)"
              reducedMotion={reducedMotion}
            />
          )}
          <Letterbox
            active={presenting && (beatFx.letterbox || cueHasTag(theatreCue, 'bars'))}
            heightPct={DEFAULT_QUEST_THEATRE_FX.letterbox.heightPct}
            inMs={DEFAULT_QUEST_THEATRE_FX.letterbox.inMs}
            outMs={DEFAULT_QUEST_THEATRE_FX.letterbox.outMs}
            color="var(--skin-hud-lacquer-deep)"
            reducedMotion={reducedMotion}
          />
          {/* PLAN-043 WS-4 / T5.5: the astrolabe left the theatre AND the
              modal portal — `QuestSkillCheckColumn` paints it in the
              cluster's right wing (`skipCheck` keeps the toast fallback). */}
        </Theater>
        </KenBurnsDolly>
        </PreVerdictBreath>
        </StageImpactShake>
        </JCutStage>
        </div>

        {/* ── Combat legibility (T-010, E7): horde + who the goblins will most
            likely hit — read before committing to "Combatti". The harm beat's
            floater lands on the member's own cell. ── */}
        {!run.ended && node?.kind === 'combat' && (
          <CombatStrip
            run={run}
            hitBeat={beatCursor.current?.kind === 'harm' ? beatCursor.current : null}
            fxConfig={DEFAULT_QUEST_THEATRE_FX}
            reducedMotion={reducedMotion}
          />
        )}

        {/* ── What just happened: while committed beats replay, the stage shows
            one moment at a time — click anywhere on it to continue (D-8).
            R-199 pt.5: the stage keeps the current scene generous (config
            `stageMaxHeightPx`); the RUNNING record of esiti lives in the
            chronicle companion (pt.8) and the end report in the external
            `QuestRewardPopup` (pt.14) — no more verdict pile-up here. ── */}
        {presenting && beatCursor.current ? (
          <BeatStage
            beat={beatCursor.current}
            hidden={beatCursor.current.kind === 'scene' ? !!allNodes[beatCursor.current.nodeId]?.hidden : false}
            remaining={beatCursor.remaining}
            onAdvance={advancePresentation}
            checkSpinning={astroActive && !astroSettled}
            verdictInColumn={inCluster && astroActive}
            fx={beatFx}
            fxConfig={DEFAULT_QUEST_THEATRE_FX}
            reducedMotion={reducedMotion}
            maxHeightPx={stageMaxHeightPx}
          />
        ) : (
        <div
          data-testid="quest-window-stage"
          aria-live="polite"
          tabIndex={-1}
          /* R-259 (Director ruling — supersedes R-241 B2 fixed height and
             R-253 top-flow): the text box hugs its copy so the choices glue
             to the end of the text («allinea i pulsanti alla fine del
             testo»). `maxHeight: stageMaxHeightPx` is the only cap; long
             copy scrolls INSIDE this box — the only scrollable surface in
             the component (`overflowX` always hidden). `flexShrink: 1` lets
             the box yield under short-viewport pressure instead of pushing
             siblings around. */
          style={{ maxHeight: stageMaxHeightPx, flexShrink: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', outline: 'none' }}
        >
        <div
          className="quest-s1-scroll"
          style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {/* PLAN-040 T-005: the resolved-check verdict block left the stage —
              the outcome surfaces in the external `QuestOutcomeToast` (all
              text at once, click to dismiss) and stays readable in the
              chronicle companion. The stage keeps scene and flavour only. */}
          {showLastEvent && (
            <p style={{ margin: 0, fontFamily: FONT.serif, fontSize: 13, lineHeight: 1.45, color: TONE.label }}>{run.lastEvent}</p>
          )}
          {node?.body && !run.ended && (
            <p style={{ margin: 0, fontFamily: FONT.serif, fontSize: 15, lineHeight: 1.55, color: TONE.text }}>{node.body}</p>
          )}
          {/* v27 pending frontier: the node is maturing — show the authored transit as the breath before the consequences land. */}
          {!run.ended && run.frontier.status === 'pending' && node?.transit && (
            <p style={{ margin: 0, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 13, lineHeight: 1.45, color: TONE.secondary }}>{node.transit}</p>
          )}
          {run.ended && (
            <p style={{ margin: 0, fontFamily: FONT.display, fontSize: 14, letterSpacing: '0.06em', color: run.outcome === 'wipe' ? toneText('death') : TONE.label }}>
              {t(`questS1Lab.outcome.${run.outcome}`)}
            </p>
          )}
        </div>
        </div>
        )}

        {/* ── Decisions: the inline Micro-Belt sits directly above the
            choice rows (WS-4 dual-affordance bag: header pill opens the left
            column's Bag tab; this strip arms items right where the preview
            chips react — BV-06). Each choice is ONE tactical row: index,
            label (+detail truncated), preview chips right-aligned — the list
            never scrolls at 1280×720. ── */}
        {!presenting && (waiting || run.ended) && (
          /* flexShrink: 0 — BV-07: the choice rows never compress mid-item;
           * a height deficit is absorbed by the theatre down to its
           * configured floor, then by the outer scroll column. */
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0, flexShrink: 0 }}>
          {waiting && bag.length > 0 && (
            <div data-testid="quest-micro-belt" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px 6px', flexWrap: 'wrap' }}>
              <EngravedIcon id="nav-bag" size={12} style={{ color: TONE.muted, flexShrink: 0 }} />
              <BeltItemChips items={bag} statuses={beltStatuses} armedFlags={armedFlags} onToggleFlag={onToggleArmedFlag ?? (() => undefined)} size={24} />
            </div>
          )}
          {/* T-A5: the lock strip is NOT a choice row — pinned above the
              scrollable so the rounded cap lands on a row boundary. */}
          {waiting && frontierLocked && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px 2px' }} data-testid="quest-window-locked">
              <span data-testid="quest-phase-locked" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 12, color: TONE.muted }}>
                <EngravedIcon id="cmd-lock" size={12} />
                {t('gameFrame.questWindow.phaseLocked')}
              </span>
            </div>
          )}
          <div ref={choicesListRef} data-hud-choices className="quest-s1-scroll" style={{ display: 'flex', flexDirection: 'column', margin: '0 -4px', padding: '0 4px', maxHeight: choicesCapPx, minHeight: 0, overflowY: 'auto' }}>
            {waiting &&
              options.map((o, i) => {
                const { pv, base } = previews[o.id] ?? { pv: null, base: null };
                return (
                  <button
                    key={o.id}
                    type="button"
                    data-skin="choice"
                    data-testid="quest-window-choice"
                    data-option-id={o.id}
                    disabled={o.disabled || !!commitLock}
                    onClick={() => handleChoose(o.id)}
                    style={
                      commitLock === o.id
                        ? { transform: 'scale(0.975)', filter: 'brightness(0.85)', transition: 'transform 90ms ease-out, filter 90ms ease-out' }
                        : undefined
                    }
                  >
                    <span data-choice-index style={{ fontFamily: FONT.display, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{i + 1}.</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                      <span style={{ fontFamily: FONT.display, fontSize: 15, color: 'var(--skin-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0, maxWidth: '55%' }}>{o.label}</span>
                      {o.detail && <span style={{ fontFamily: FONT.serif, fontSize: 12, color: TONE.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1 }}>{o.detail}</span>}
                    </span>
                    {pv && (
                      <span style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                        <HudChip tone="ok" title={base && pv.consumableLabel ? `${pv.consumableLabel} +${pv.consumableBonus}` : undefined}>
                          {base ? `${base.successPct}% → ${pv.successPct}%` : t('questS1Lab.successPct', { pct: pv.successPct })}
                        </HudChip>
                        {pv.woundPct > 0 && <HudChip tone="warn">{t('questS1Lab.woundPct', { pct: pv.woundPct })}</HudChip>}
                        {pv.deathPct > 0 && <HudChip tone="danger">{t('questS1Lab.deathPct', { pct: pv.deathPct })}</HudChip>}
                      </span>
                    )}
                  </button>
                );
              })}
            {run.ended && (
              <button type="button" data-skin="choice" data-testid="quest-window-close-report" onClick={onClose}>
                <span data-choice-index style={{ fontFamily: FONT.display, fontSize: 14 }}>→</span>
                <span style={{ fontFamily: FONT.display, fontSize: 15, color: 'var(--skin-text-primary)' }}>{t('gameFrame.questWindow.close')}</span>
              </button>
            )}
          </div>
          </div>
        )}

        </div>
        {/* ── end of the centred stack (R-259) ── */}

        {/* ── Footer C1 (WS-4): collapsible strip — TimeBar on top, then the
            engraved phase track (visited + current + the next as a question
            mark) and the inline red abandon affordance. Collapsed it folds
            to a ~4px seam (BV-07 ≤8px). ── */}
        <QuestWindowFooter
          run={run}
          phases={phases}
          beats={beats}
          currentBeat={currentBeat}
          time={time}
          journeySvolgimentoTicks={journeySvolgimentoTicks}
          tooltipLines={tooltipLines}
          open={footerOpen}
          onToggle={() => setFooterOpen((v) => !v)}
          onAbandon={onAbandon}
          abandonAsked={abandonAsked}
          onAbandonAsk={setAbandonAsked}
          abandonPanelId={abandonPanelId}
        />
        </div>
        </HudPlaque>
      </div>
    </SkinScope>
  );
};

/* ------------------------------------------------------------------ */

/** One micro bar per party member inside the roster pill: the party's state without opening anything. */
const PartyPips: React.FC<{ run: QuestRunState }> = ({ run }) => (
  <span aria-hidden style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
    {run.party.map((m) => {
      const pct = m.dead ? 0 : Math.max(0, m.hp) / m.maxHp;
      const tone = m.dead ? TONE.death : pct < 0.35 ? TONE.danger : pct < 0.7 ? TONE.warn : TONE.ok;
      return (
        <span key={m.id} style={{ position: 'relative', width: 4, height: 14, borderRadius: 1, background: 'color-mix(in srgb, var(--skin-text-muted) 30%, transparent)', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', insetInline: 0, bottom: 0, height: m.dead ? '100%' : `${pct * 100}%`, background: m.dead ? 'color-mix(in srgb, var(--skin-status-death) 45%, transparent)' : tone, transition: 'height 400ms ease-out' }} />
        </span>
      );
    })}
  </span>
);

const Line: React.FC<{ tone: keyof typeof TONE; children: React.ReactNode }> = ({ tone, children }) => (
  <div style={{ fontFamily: FONT.serif, fontSize: 13, lineHeight: 1.4, color: TONE[tone] }}>{children}</div>
);

/** The stage while committed beats replay (T-008): one moment at a time.
 *  R-199 pt.1: the whole card is the continue affordance — clicking it (or
 *  pressing any key, handled window-level) advances; there is NO skip
 *  button. `aria-live` announces the beat, `tabIndex` lets the keyboard
 *  land on it for focus hand-off. Deaths get the muted/dark register and a
 *  skull (D-8); T-009 adds the cinema accents (verdict edge flash +
 *  typewriter where the config earns them). R-199 pt.10: while the docked
 *  astrolabe spins (`checkSpinning`) the check beat shows only the
 *  attempt's transit — the verdict text lands once the roll resolves. */
const BeatStage: React.FC<{
  beat: QuestBeat;
  /** The beat's node is authored `hidden` — a marker asks for the eye-off glyph. */
  hidden?: boolean;
  remaining: number;
  onAdvance: () => void;
  /** A docked astrolabe is still presenting this check — hide the verdict. */
  checkSpinning?: boolean;
  /** PLAN-067 T-A4 (guide §1): the cluster's right-wing Verdict Card says the
   *  verdict — the check beat keeps only the attempt, never a second copy. */
  verdictInColumn?: boolean;
  fx: BeatFx;
  fxConfig: QuestTheatreFxConfig;
  reducedMotion: boolean;
  /** Height cap for the narrative box (config `stageMaxHeightPx`) —
   *  R-259: the box hugs its copy (`maxHeight`, never a fixed `height`) so
   *  the choices glue to the end of the text; long copy scrolls inside. */
  maxHeightPx?: number;
}> = ({ beat, hidden, remaining, onAdvance, checkSpinning, verdictInColumn = false, fx, fxConfig, reducedMotion, maxHeightPx }) => {
  const { t } = useTranslation('idleVillage');
  /* PLAN-050 §6 — verdict slam: the verdict row mounts the moment the roll
   *  resolves (checkSpinning flips) — it lands WITH the stinger, a quick
   *  scale-punch rather than a fade. Reduced motion keeps the plain swap. */
  const verdictRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = verdictRef.current;
    if (!el?.animate || reducedMotion || beat.kind !== 'check' || checkSpinning) return undefined;
    const anim = el.animate(
      [
        { transform: 'scale(1.22) translateY(-4px)', opacity: 0 },
        { transform: 'scale(1) translateY(0)', opacity: 1, offset: 0.55 },
        { transform: 'scale(0.97)', offset: 0.75 },
        { transform: 'scale(1)' },
      ],
      { duration: 240, easing: 'ease-out' },
    );
    return () => anim.cancel();
  }, [beat.id, beat.kind, checkSpinning, reducedMotion]);
  return (
    <div
      data-testid="quest-window-beat"
      aria-live="polite"
      tabIndex={-1}
      onClick={onAdvance}
      /* R-259 (Director ruling — supersedes R-241 B2 and R-253 top-flow):
         `maxHeight` cap, never a fixed height — the box hugs its copy so
         the choices glue to the end of the text; long copy scrolls inside
         (`overflowX` always hidden). `flexShrink: 1` yields under
         short-viewport pressure instead of pushing siblings. */
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: maxHeightPx, overflowY: 'auto', overflowX: 'hidden', flexShrink: 1, minHeight: 0, outline: 'none', cursor: 'pointer' }}
    >
      {fx.flashTone && (
        <EdgeFlash
          flashKey={beat.id}
          color={TONE[fx.flashTone as keyof typeof TONE] ?? TONE.label}
          durationMs={fxConfig.edgeFlash.durationMs}
          reducedMotion={reducedMotion}
        />
      )}
      <div
        className="quest-s1-scroll"
        style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
      >
      {beat.kind === 'scene' && (
        <>
          <span style={{ fontFamily: FONT.display, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: TONE.secondary }}>
            {hidden && <HiddenMark />}
            {beat.title}
          </span>
          {beat.body && (
            <p style={{ margin: 0, fontFamily: FONT.serif, fontSize: 15, lineHeight: 1.55, color: TONE.text }}>
              {fx.typewriter === 'body' ? (
                <TypewriterText text={beat.body} charsPerSecond={fxConfig.typewriter.charsPerSecond} textKey={beat.id} reducedMotion={reducedMotion} />
              ) : (
                beat.body
              )}
            </p>
          )}
        </>
      )}
      {beat.kind === 'check' && (checkSpinning || verdictInColumn) && (
        <>
          <span style={{ fontFamily: FONT.display, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: TONE.secondary }}>
            {beat.check.title}
          </span>
          {beat.check.transit && (
            <p style={{ margin: 0, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 14, lineHeight: 1.45, color: TONE.secondary }}>{beat.check.transit}</p>
          )}
        </>
      )}
      {beat.kind === 'check' && !checkSpinning && !verdictInColumn && (
        <>
          <div ref={verdictRef} style={{ display: 'flex', alignItems: 'baseline', gap: 6, transformOrigin: 'left center' }}>
            <HudChip tone={VERDICT_TONE[beat.check.verdict]}>{t(`questS1Lab.verdict.${beat.check.verdict}`)}</HudChip>
            <span style={{ fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.06em', color: TONE.secondary }}>{beat.check.title}</span>
          </div>
          {beat.check.flavor && (
            <p style={{ margin: 0, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 14, lineHeight: 1.45, color: TONE.label }}>
              {fx.typewriter === 'flavor' ? (
                <TypewriterText text={beat.check.flavor} charsPerSecond={fxConfig.typewriter.charsPerSecond} textKey={beat.id} reducedMotion={reducedMotion} />
              ) : (
                beat.check.flavor
              )}
            </p>
          )}
          {beat.check.authoredText && <Line tone="secondary">{beat.check.authoredText}</Line>}
        </>
      )}
      {beat.kind === 'harm' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            padding: '8px 10px',
            borderRadius: 6,
            background: beat.harm.kind === 'death' ? 'color-mix(in srgb, var(--skin-status-death) 10%, transparent)' : 'transparent',
            borderLeft: beat.harm.kind === 'death' ? `2px solid ${TONE.death}` : `2px solid ${TONE.warn}`,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT.display, fontSize: 13, letterSpacing: '0.06em', color: beat.harm.kind === 'death' ? toneText('death') : TONE.warn }}>
            {beat.harm.kind === 'death' && <EngravedIcon id="status-fallen" size={13} />}
            {beat.memberName}
          </span>
          {beat.line && <span style={{ fontFamily: FONT.serif, fontSize: 13, lineHeight: 1.4, color: beat.harm.kind === 'death' ? toneText('death') : TONE.label }}>{beat.line}</span>}
        </div>
      )}
      {beat.kind === 'end' && (
        <>
          <p style={{ margin: 0, fontFamily: FONT.display, fontSize: 14, letterSpacing: '0.06em', color: beat.outcome === 'wipe' ? toneText('death') : TONE.label }}>
            {t(`questS1Lab.outcome.${beat.outcome}`)}
          </p>
          <Line tone="secondary">{beat.text}</Line>
        </>
      )}
      {beat.kind === 'recap' && (
        <Line tone="secondary">
          {t('gameFrame.questWindow.beats.recap', { scenes: beat.scenes, checks: beat.checks, deaths: beat.deaths, wounds: beat.wounds })}
        </Line>
      )}
      </div>
      {/* No control here — R-199 pt.1: the whole card is the affordance,
          the hint says so (click or any key). */}
      <span style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 12, color: TONE.muted, marginTop: 'auto' }}>
        {remaining > 0 ? t('gameFrame.questWindow.beats.more', { count: remaining + 1 }) : t('gameFrame.questWindow.beats.clickHint')}
      </span>
    </div>
  );
};

/** The combat strip (T-010, E7): two compact rows under the theater — the
 *  horde still standing plus the hits coming back, and per living member the
 *  chance of taking the next hit. While a harm beat is on stage the hit
 *  member's cell marks red and the -HP floater rises on it — who paid is
 *  visible, not buried in a line of text. One block, no expanded surface (D-7). */
const CombatStrip: React.FC<{
  run: QuestRunState;
  hitBeat: HarmBeat | null;
  fxConfig: QuestTheatreFxConfig;
  reducedMotion: boolean;
}> = ({ run, hitBeat, fxConfig, reducedMotion }) => {
  const { t } = useTranslation('idleVillage');
  const node = nodesFor(run)[run.nodeId];
  const spec = node?.kind === 'combat' ? node.combat : null;
  if (!spec) return null;
  const exposure = currentExposure(run);
  const incoming = nextCombatHits(run);
  const maxExposure = Math.max(1, ...Object.values(exposure));
  const alive = run.party.filter((m) => !m.dead);
  return (
    <div
      data-testid="quest-combat-strip"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        padding: '6px 8px',
        borderRadius: 6,
        border: '1px solid color-mix(in srgb, var(--skin-surface-border) 60%, transparent)',
        background: SCRIM.chipBg,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <EngravedIcon id="evt-combat" size={13} style={{ color: toneText('danger') }} />
        <span data-testid="combat-enemy-pips" title={t('gameFrame.questWindow.combat.enemiesLeft', { count: run.goblinLeft })} aria-label={t('gameFrame.questWindow.combat.enemiesLeft', { count: run.goblinLeft })} style={{ display: 'inline-flex', gap: 3 }}>
          {Array.from({ length: spec.enemies }, (_, i) => (
            /* ● standing · ✕ downed — the mark contrast is the legend. */
            <span
              key={i}
              aria-hidden
              data-filled={i < run.goblinLeft}
              style={{
                width: 9,
                height: 9,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                background: i < run.goblinLeft ? TONE.danger : 'transparent',
                border: `1px solid ${i < run.goblinLeft ? TONE.danger : 'color-mix(in srgb, var(--skin-text-muted) 55%, transparent)'}`,
                color: 'color-mix(in srgb, var(--skin-text-muted) 70%, transparent)',
              }}
            >
              {i < run.goblinLeft ? null : <EngravedIcon id="cmd-close" size={7} />}
            </span>
          ))}
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.04em', color: TONE.secondary }}>
          {t('gameFrame.questWindow.combat.incoming', { count: incoming })}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {alive.map((m) => {
          const ex = exposure[m.id] ?? 0;
          const hit = hitBeat?.harm.memberId === m.id;
          const hpPct = m.maxHp > 0 ? Math.max(0, m.hp) / m.maxHp : 0;
          const hpTone = hpPct < 0.35 ? TONE.danger : m.wounded ? TONE.warn : TONE.ok;
          return (
            <div
              key={m.id}
              data-testid={`combat-member-${m.id}`}
              title={t('gameFrame.questWindow.combat.exposureHint')}
              style={{
                position: 'relative',
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                padding: '4px 6px',
                borderRadius: 5,
                border: `1px solid ${hit ? (hitBeat?.harm.kind === 'death' ? TONE.death : TONE.danger) : 'color-mix(in srgb, var(--skin-surface-border) 45%, transparent)'}`,
                background: hit ? 'color-mix(in srgb, var(--skin-status-death) 14%, transparent)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 4 }}>
                <span style={{ fontFamily: FONT.display, fontSize: 12, color: hit ? TONE.text : TONE.secondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</span>
                <span
                  data-testid={`combat-exposure-${m.id}`}
                  style={{
                    fontFamily: FONT.display,
                    fontSize: 12,
                    fontVariantNumeric: 'tabular-nums',
                    color: ex >= maxExposure ? toneText('danger') : TONE.muted,
                  }}
                >
                  {Math.round(ex)}%
                </span>
              </div>
              <span aria-hidden style={{ height: 4, borderRadius: 2, background: 'color-mix(in srgb, var(--skin-text-muted) 25%, transparent)', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${hpPct * 100}%`, background: hpTone, transition: 'width 400ms ease-out' }} />
              </span>
              {hit && hitBeat && (
                <DamageFloater
                  floatKey={hitBeat.id}
                  amount={hitBeat.harm.amount}
                  color={hitBeat.harm.kind === 'death' ? toneText('death') : toneText('danger')}
                  durationMs={fxConfig.damageFloater.durationMs}
                  risePx={fxConfig.damageFloater.risePx}
                  reducedMotion={reducedMotion || !fxConfig.damageFloater.enabled}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** A marker saying «this scene was avoidable — you found the hidden thing»
 *  (authored `node.hidden`, Director 2026-10-10). Eye-off glyph + tooltip. */
const HiddenMark: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  const label = t('gameFrame.questWindow.hiddenEvent');
  return (
    <EngravedIcon id="cmd-eye-off" size={12} label={label} title={label} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 5, opacity: 0.9 }} />
  );
};

/** Cinema-scope picture: cross-fades on a new scene and drifts slowly (Ken Burns).
 *  PLAN-046: scenes with a baked depth map render through DepthScene (Pixi
 *  depth-parallax + beat-directed camera); the DOM img stays underneath as
 *  the always-mounted fallback. Scenes without depth keep the legacy path. */
const Theater: React.FC<{
  src?: string;
  aspect: number;
  children?: React.ReactNode;
  shot?: CameraShot;
  shotKey?: string;
  /** PLAN-050 §4 — trauma shake amplitude at this beat's epoch (0 = off). */
  traumaStrength?: number;
  reducedMotion?: boolean;
}> = ({ src, aspect, children, shot, shotKey = 'idle', traumaStrength = 0, reducedMotion = false }) => {
  const img = useRef<HTMLImageElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const cine = useMemo(() => cinematicEntryForSrc(src), [src]);
  /* Shot epoch on the shared clock — resets when a new beat lands on stage.
   *  R-242: on a REMOUNT the epoch seeds at now (not 0) — the aperture/push
   *  layers always re-fire on mount, so a `t:0` epoch would leave the GPU
   *  camera already landed under a replaying cut (the frame sits still while
   *  the veil opens over it). Seeding now replays the shot coherently. */
  const epochRef = useRef<{ key: string; t: number }>({ key: shotKey, t: documentClock() });
  if (epochRef.current.key !== shotKey) {
    epochRef.current = { key: shotKey, t: documentClock() };
  }
  /* R-245 (Director, 2026-10-21): NO text is ever painted over the artwork —
   *  the PLAN-050 §6 diegetic caption is removed; the frame renders art and
   *  fx layers only. Node identity lives in the scene text below. */
  /* Dev-only manifest warning — production falls back silently (OB-3). */
  useEffect(() => {
    if (import.meta.env.DEV && src && !cine && DEFAULT_QUEST_THEATRE_FX.depth.enabled) {
      // eslint-disable-next-line no-console
      console.warn(`[theater] no depth manifest entry for ${src} — DOM path`);
    }
  }, [src, cine]);
  useEffect(() => {
    // Web Animations, not rAF: the element's own style is the end state, so a frozen
    // (hidden) tab still shows the picture.
    const el = (cine ? wrap.current : img.current);
    if (!el?.animate) return undefined;
    const fade = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'ease-out' });
    /* Depth scenes drive their own camera (DepthScene, same clock); only the
     *  legacy path keeps the fixed 16s Ken Burns drift. */
    const drift = cine
      ? null
      : el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }], { duration: 16000, easing: 'ease-in-out', fill: 'forwards' });
    return () => {
      fade.cancel();
      drift?.cancel();
    };
  }, [src, cine]);
  return (
    <div data-testid="quest-theatre-frame" style={{ position: 'relative', aspectRatio: String(aspect), flexShrink: 1, minHeight: 0, overflow: 'hidden', borderRadius: 6, border: '1px solid color-mix(in srgb, var(--skin-surface-border) 60%, transparent)', background: 'var(--skin-hud-lacquer-deep)' }}>
      {src && cine && shot ? (
        <div ref={wrap} key={src} style={{ position: 'absolute', inset: 0 }}>
          <DepthScene
            src={src}
            depthSrc={cine.depth}
            imgAspect={cine.imgAspect}
            viewAspect={aspect}
            ampMul={cine.ampMul}
            shot={shot}
            shotEpoch={epochRef.current.t}
            cfg={DEFAULT_QUEST_THEATRE_FX.depth}
            reducedMotion={reducedMotion}
            ambient
            ambientFx={cine.ambient}
            atmosphere={cine.atmosphere}
            traumaEpoch={epochRef.current.t}
            traumaStrength={traumaStrength}
          />
        </div>
      ) : (
        src && <img ref={img} key={src} src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%' }} />
      )}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 95% at 50% 40%, transparent 55%, color-mix(in srgb, var(--skin-hud-lacquer-deep) 70%, transparent))' }} />
      <div aria-hidden style={{ position: 'absolute', insetInline: 0, bottom: 0, height: '55%', background: SCRIM.bottom }} />
      {children}
    </div>
  );
};

export const TimeBar: React.FC<{ progress: number; label: string; phase: string; checkpoints?: TimeBarCheckpoint[]; overrunFrom?: number }> = ({
  progress,
  label,
  phase,
  checkpoints = [],
  overrunFrom,
}) => {
  /* QW-1 = B (R-234): the bar never goes backwards. The scale can stretch under it, but what is
   * already shown stays shown — only a finished run (1) or a new run resets it. */
  const shown = useRef(0);
  const next = Math.min(1, Math.max(0, progress));
  shown.current = next >= 1 ? 1 : Math.max(shown.current, next);
  const pct = Math.round(shown.current * 100);
  /* Checkpoints sit on the real phase boundaries of the DECLARED estimate; once the run outlives it
   * they compress to the left of the ember overrun. */
  const spread = overrunFrom !== undefined ? overrunFrom : 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label}
        style={{ position: 'relative', height: 6, borderRadius: 3, overflow: 'visible', background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 85%, transparent)', border: '1px solid color-mix(in srgb, var(--skin-surface-border) 70%, transparent)' }}
      >
        <div style={{ position: 'absolute', inset: 0, borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: 'left center',
              transform: `scaleX(${pct / 100})`,
              transition: 'transform 600ms linear',
              background: 'linear-gradient(90deg, color-mix(in srgb, var(--skin-title-color) 55%, transparent), var(--skin-title-color))',
            }}
          />
          {overrunFrom !== undefined && (
            <div
              data-testid="quest-timebar-overrun"
              aria-hidden
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${overrunFrom * 100}%`,
                right: 0,
                background: 'repeating-linear-gradient(135deg, color-mix(in srgb, var(--skin-event-danger) 85%, transparent) 0 4px, color-mix(in srgb, var(--skin-event-danger) 45%, var(--skin-hud-lacquer-deep)) 4px 8px)',
              }}
            />
          )}
        </div>
        {checkpoints.map((cp) => (
          <span
            key={cp.beat}
            data-testid="quest-timebar-checkpoint"
            data-reached={cp.reached}
            data-current={cp.current}
            title={cp.label}
            aria-label={cp.label}
            style={{
              position: 'absolute',
              left: `${Math.min(100, Math.max(0, cp.fraction * spread * 100))}%`,
              top: -2,
              bottom: -2,
              width: 2,
              transform: 'translateX(-50%)',
              borderRadius: 1,
              background: cp.reached || cp.current ? 'var(--skin-title-color)' : 'color-mix(in srgb, var(--skin-surface-border) 85%, transparent)',
              boxShadow: cp.current ? '0 0 6px var(--skin-title-color)' : undefined,
              pointerEvents: 'auto',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.06em', color: TONE.secondary }}>
        <span>{label}</span>
        <span>{phase}</span>
      </div>
    </div>
  );
};

const tileBox = (borderTone: string, current: boolean): CSSProperties => ({
  width: 40,
  height: 40,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 8,
  border: `1px solid ${borderTone}`,
  background: current ? 'color-mix(in srgb, var(--skin-title-color) 16%, var(--skin-hud-lacquer-deep))' : 'var(--skin-hud-lacquer-deep)',
  boxShadow: current ? '0 0 10px color-mix(in srgb, var(--skin-title-color) 45%, transparent)' : undefined,
});

export const PhaseTile: React.FC<{ phase: PhaseRecord; name: string; current: boolean; run: QuestRunState; tooltipLines: number }> = ({ phase, name, current, run, tooltipLines }) => {
  const { t } = useTranslation('idleVillage');
  const iconId = PHASE_ICONS[phase.beat] ?? 'cmd-help';
  const outcome = phaseOutcome(phase);
  const played = phase.choices.length > 0 || phase.lines.length > 0;
  const tone = played ? TONE[OUTCOME_TONE[outcome]] : TONE.label;
  const lost = hpLostByMember(phase);
  const nameOf = (id: string) => run.party.find((m) => m.id === id)?.name ?? id;
  const dead = lost.filter((l) => l.died);
  const hp = lost.reduce((sum, l) => sum + l.amount, 0);
  const mark = !played
    ? t('gameFrame.questWindow.inProgressShort')
    : dead.length
      ? `† ${dead.map((d) => nameOf(d.memberId)).join(', ')}`
      : hp > 0
        ? t('gameFrame.questWindow.hpLost', { hp })
        : phase.lootGained.length
          ? t('gameFrame.questWindow.loot', { count: phase.lootGained.length })
          : t('gameFrame.questWindow.clean');
  const lines = phase.lines.slice(0, tooltipLines);
  const more = phase.lines.length - lines.length;

  return (
    <li style={{ width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <Tooltip.Root delayDuration={120}>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label={`${name}: ${mark}`}
            aria-current={current ? 'step' : undefined}
            style={{ ...tileBox(current ? 'var(--skin-title-color)' : `color-mix(in srgb, ${tone} 60%, transparent)`, current), position: 'relative', padding: 0, cursor: 'help', color: current ? 'var(--skin-title-color)' : tone }}
          >
            <EngravedIcon id={iconId} size={18} />
            {outcome === 'death' && <EngravedIcon id="status-fallen" size={12} style={{ position: 'absolute', right: 2, bottom: 2, color: toneText('death') }} />}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="top" sideOffset={6} style={{ zIndex: 2000, maxWidth: 300, padding: '9px 11px', borderRadius: 8, border: '1px solid color-mix(in srgb, var(--skin-surface-border) 70%, transparent)', background: 'var(--skin-hud-lacquer-deep)', boxShadow: '0 10px 24px color-mix(in srgb, var(--skin-hud-lacquer-deep) 80%, transparent)' }}>
            <div style={{ fontFamily: FONT.display, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--skin-title-color)', marginBottom: 4 }}>{name}</div>
            {phase.choices.map((c, i) => (
              <Line key={`c${i}`} tone="muted">→ {c}</Line>
            ))}
            {phase.verdicts.length > 0 && <Line tone="accent">{phase.verdicts.map((v) => t(`questS1Lab.verdict.${v}`)).join(' · ')}</Line>}
            {lost.map((l) => (
              <Line key={l.memberId} tone={l.died ? 'death' : 'warn'}>
                {nameOf(l.memberId)} {l.died ? `— ${t('gameFrame.questWindow.dead')}` : t('gameFrame.questWindow.hpLost', { hp: l.amount })}
              </Line>
            ))}
            {phase.lootGained.map((item) => (
              <Line key={`l-${item}`} tone="label">+ {item}</Line>
            ))}
            {phase.itemsSpent.map((flag) => {
              const item = QUEST_STASH.items.find((i) => i.flag === flag);
              return <Line key={`s-${flag}`} tone="secondary">− {item ? t(item.labelKey) : flag}</Line>;
            })}
            {lines.length > 0 && <div style={{ height: 1, margin: '6px 0', background: 'color-mix(in srgb, var(--skin-surface-border) 40%, transparent)' }} />}
            {lines.map((e, i) => (
              <Line key={i} tone={LOG_TONE[e.kind] ?? 'secondary'}>{e.text}</Line>
            ))}
            {more > 0 && <Line tone="muted">{t('gameFrame.questWindow.moreLines', { count: more })}</Line>}
            {!played && <Line tone="muted">{t('gameFrame.questWindow.inProgress')}</Line>}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
      <span style={{ maxWidth: 56, fontFamily: FONT.display, fontSize: 12, lineHeight: 1.15, textAlign: 'center', color: tone, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mark}</span>
    </li>
  );
};

const NextTile: React.FC<{ label: string }> = ({ label }) => (
  <li style={{ width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }} aria-label={label} title={label}>
    <span style={{ ...tileBox('color-mix(in srgb, var(--skin-text-muted) 45%, transparent)', false), borderStyle: 'dashed', color: TONE.muted }}>
      <EngravedIcon id="cmd-help" size={18} />
    </span>
    <span style={{ fontFamily: FONT.display, fontSize: 12, color: TONE.muted }}>?</span>
  </li>
);

/** R-239 T-B4 — one Radix tooltip skin shared by every header control, same
 *  chrome as the timeline tiles. `disabled`: a disabled button swallows
 *  pointer events, so the hint wraps it in a span to stay reachable — the
 *  player still learns why the control is off (e.g. close during a check). */
const HudTooltip: React.FC<{ label: string; disabled?: boolean; children: React.ReactNode }> = ({ label, disabled, children }) => (
  <Tooltip.Root delayDuration={120}>
    <Tooltip.Trigger asChild>
      {disabled ? (
        <span tabIndex={0} aria-label={label} style={{ display: 'inline-flex', cursor: 'not-allowed' }}>{children}</span>
      ) : (
        children
      )}
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content side="bottom" sideOffset={6} style={{ zIndex: 2000, maxWidth: 260, padding: '6px 9px', borderRadius: 8, border: '1px solid color-mix(in srgb, var(--skin-surface-border) 70%, transparent)', background: 'var(--skin-hud-lacquer-deep)', boxShadow: '0 10px 24px color-mix(in srgb, var(--skin-hud-lacquer-deep) 80%, transparent)' }}>
        <span style={{ fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--skin-title-color)' }}>{label}</span>
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
);

/** R-231 #3 header pill — icon-only toggle (with status pips/dot + tooltip)
 *  opening the left companion column on its tab. */
const HeaderPill: React.FC<{
  refEl: React.RefObject<HTMLButtonElement | null>;
  icon: EngravedIconId;
  label: string;
  active: boolean;
  ariaControls: string;
  onClick: () => void;
  testId?: string;
  children?: React.ReactNode;
}> = ({ refEl, icon, label, active, ariaControls, onClick, testId, children }) => (
  <HudTooltip label={label}>
    <button
      type="button"
      ref={refEl}
      aria-label={label}
      aria-expanded={active}
      aria-controls={ariaControls}
      data-testid={testId}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 8px',
        borderRadius: 999,
        border: `1px solid ${active ? 'var(--skin-title-color)' : 'color-mix(in srgb, var(--skin-surface-border) 60%, transparent)'}`,
        background: active ? 'color-mix(in srgb, var(--skin-title-color) 14%, transparent)' : 'transparent',
        color: active ? 'var(--skin-title-color)' : TONE.label,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      <EngravedIcon id={icon} size={15} />
      {children}
    </button>
  </HudTooltip>
);

/** WS-4 footer C1 — the collapsible time/phase strip. Open: TimeBar on top,
 *  then the engraved phase track (every visited tile, the current lit, the
 *  next as a question mark) and the inline red abandon affordance. Closed:
 *  a ~4px seam the player clicks to reopen (BV-07 ≤8px). */
const QuestWindowFooter: React.FC<{
  run: QuestRunState;
  phases: PhaseRecord[];
  beats: readonly string[];
  currentBeat: number;
  time: { progress: number; label: string; overrunFrom?: number };
  /** POI `estimatedDurationTicks` for the journey `~Nd` svolgimento bar. */
  journeySvolgimentoTicks?: number;
  tooltipLines: number;
  open: boolean;
  onToggle: () => void;
  onAbandon?: () => void;
  abandonAsked: boolean;
  onAbandonAsk: (asked: boolean) => void;
  abandonPanelId: string;
}> = ({ run, phases, beats, currentBeat, time, journeySvolgimentoTicks, tooltipLines, open, onToggle, onAbandon, abandonAsked, onAbandonAsk, abandonPanelId }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <div data-testid="quest-window-footer" style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? t('gameFrame.questWindow.footer.collapse') : t('gameFrame.questWindow.footer.expand')}
        title={open ? t('gameFrame.questWindow.footer.collapse') : t('gameFrame.questWindow.footer.expand')}
        data-testid="quest-footer-toggle"
        onClick={onToggle}
        style={{
          display: 'block',
          width: '100%',
          height: 4,
          padding: 0,
          border: 'none',
          borderRadius: 999,
          background: open ? 'color-mix(in srgb, var(--skin-title-color) 30%, transparent)' : 'color-mix(in srgb, var(--skin-surface-border) 55%, transparent)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      />
      {open && (
        <>
          <TimeBar
            progress={time.progress}
            overrunFrom={time.overrunFrom}
            label={time.label}
            /* R-253 #4: the total adapts — a phase authored beyond
             * `beats.length` grows the denominator the moment the path
             * reaches it (same rule as the checkpoint markers). */
            phase={t('gameFrame.questWindow.phaseOf', { n: currentBeat + 1, total: Math.max(beats.length, currentBeat + 1) })}
            checkpoints={questPhaseCheckpoints(run, beats, currentBeat, time.progress)}
          />
          {/* PLAN-053 T-006: journey legs — andata/svolgimento/ritorno
              sub-bars, parked chip, return-loot count chip. Renders nothing
              on legacy or settled runs. */}
          <QuestJourneyPhaseStrip run={run} svolgimentoEstimateTicks={journeySvolgimentoTicks} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
              {phases.map((phase, i) => (
                <PhaseTile
                  key={`${phase.beat}-${i}`}
                  phase={phase}
                  name={beats[phase.beat] ?? ''}
                  current={!run.ended && i === phases.length - 1}
                  run={run}
                  tooltipLines={tooltipLines}
                />
              ))}
              {!run.ended && currentBeat + 1 < beats.length && <NextTile label={t('gameFrame.questWindow.nextPhase')} />}
            </ol>
            {onAbandon && !run.ended && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                {!abandonAsked ? (
                  <Tooltip.Root delayDuration={180}>
                    <Tooltip.Trigger asChild>
                      <button
                        type="button"
                        aria-label={t('gameFrame.questWindow.abandon')}
                        title={t('gameFrame.questWindow.abandon')}
                        aria-expanded={false}
                        aria-controls={abandonPanelId}
                        data-testid="quest-abandon-toggle"
                        onClick={() => onAbandonAsk(true)}
                        style={{
                          width: 34,
                          height: 34,
                          display: 'inline-grid',
                          placeItems: 'center',
                          padding: 0,
                          borderRadius: 8,
                          border: '1px solid color-mix(in srgb, var(--skin-surface-border) 65%, transparent)',
                          background: 'var(--skin-hud-lacquer-deep)',
                          color: TONE.secondary,
                          cursor: 'pointer',
                        }}
                      >
                        <EngravedIcon id="ico-banner" size={16} />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        side="top"
                        sideOffset={6}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--skin-surface-border)',
                          background: 'var(--skin-hud-lacquer-deep)',
                          color: TONE.text,
                          fontFamily: FONT.serif,
                          fontSize: 12,
                          zIndex: 9999,
                        }}
                      >
                        {t('gameFrame.questWindow.abandon')}
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                ) : (
                  <div id={abandonPanelId} role="alertdialog" aria-label={t('gameFrame.questWindow.abandon')} data-testid="quest-abandon-confirm" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <span style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 12, color: TONE.label, textAlign: 'right', maxWidth: 220 }}>
                      {t('gameFrame.questWindow.abandonConfirm')}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" data-testid="quest-abandon-stay" onClick={() => onAbandonAsk(false)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid color-mix(in srgb, var(--skin-surface-border) 70%, transparent)', background: 'transparent', color: TONE.label, fontFamily: FONT.display, fontSize: 12, cursor: 'pointer' }}>
                        {t('gameFrame.questWindow.abandonStay')}
                      </button>
                      <button type="button" data-testid="quest-abandon-yes" onClick={() => { onAbandonAsk(false); onAbandon(); }} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${TONE.danger}`, background: 'color-mix(in srgb, var(--skin-status-death) 16%, transparent)', color: toneText('death'), fontFamily: FONT.display, fontSize: 12, cursor: 'pointer' }}>
                        {t('gameFrame.questWindow.abandonYes')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default QuestRunWindow;
