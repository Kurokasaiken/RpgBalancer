/**
 * QuestRunWindow — the running quest, as a floating HUD shell on /game
 * (R-106, R-196/PLAN-035).
 *
 * Reading order, top to bottom (Director 2026-10-08):
 *   title + icons (roster assigned to the quest, bag, chronicle, minimise, close)
 *   → flavour → cinema-scope theater → what happened + the scene → choices
 *   → time bar (game clock, start → return) → phase tiles (played + next).
 *
 * R-196 shell contract:
 * - ONE `[data-hud-panel]` wrapper carries the window and its companion
 *   columns (`[data-hud-companion="left|right"]`) — the drag clamps the union
 *   (`useHudPanelDrag` + `resolveQuestShellLayout`, never the 640px box alone).
 * - NO `overflow` on `HudPlaque`: the SVG drop-shadow would clip to the
 *   section's box (WebKit) and absolutely-placed companions would be cut off.
 * - Party roster + belt stack LEFT, chronicle RIGHT — each independently
 *   toggleable (`aria-expanded`/`aria-controls`), all open together by
 *   default, auto-collapsed by the shared layout predicate on narrow
 *   viewports.
 *
 * Material: `HudPlaque` panel, dragged by its title row (`useHudPanelDrag`) like
 * every HUD panel; colours only from `--skin-*` tokens; no text under 12px.
 * Minimising folds it into a small plaque that keeps the phase count and a mark
 * while a decision is waiting; closing keeps the run (the Panels menu reopens it).
 */

import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import * as Tooltip from '@radix-ui/react-tooltip';
import { EngravedIcon, type EngravedIconId } from './engravedIcons';
import { HudPlaque, SkinScope } from '@/ui/idleVillage/skins/primitives';
import { DamageFloater, EdgeFlash, Letterbox, TypewriterText, prefersReducedMotion, useBeatFx, type BeatFx } from '@/ui/idleVillage/skins/primitives';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { DEFAULT_QUEST_THEATRE_FX, type QuestTheatreFxConfig } from '@/balancing/config/idleVillage/quests/questTheatreFx';
import { availableOptions, beltItemStatuses, currentExposure, nextCombatHits, nodesFor, previewArmedActionItems, previewOption, type QuestRunState, type ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { QuestEpilogue } from './QuestEpilogue';
import { useBeatCursor, type BeatTiming, type HarmBeat, type QuestBeat } from '@/ui/idleVillage/questS1Lab/beatSequencer';
import type { Verdict } from '@/ui/idleVillage/questS1Lab/questScenario';
import { hpLostByMember, phaseOutcome, type PhaseOutcome, type PhaseRecord } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import { HudChip, LOG_TONE, SCRIM, TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import { questBagItems } from './questBag';
import { useHudPanelDrag } from './useHudPanelDrag';
import { resolveQuestShellLayout } from './questShellLayout';
import { QuestBeltPlaque } from './QuestBeltPlaque';
import { QuestPartyRosterPanel } from './QuestPartyRosterPanel';
import { QuestLogPanel } from './QuestLogPanel';

/** Verdict chip tone: the result reads at a glance, before its authored line. */
const VERDICT_TONE: Record<Verdict, 'ok' | 'warn' | 'danger'> = { bigwin: 'ok', win: 'ok', almost: 'warn', fail: 'danger', epicfail: 'danger' };

/** One glyph per authored phase (index = node `beat`). */
const PHASE_ICONS: EngravedIconId[] = ['ico-scroll', 'evt-expedition', 'ico-pouch', 'ico-axe', 'evt-combat', 'ico-gust', 'ico-chest', 'nav-village'];

const OUTCOME_TONE: Record<PhaseOutcome, keyof typeof TONE> = { death: 'death', hurt: 'warn', loot: 'label', clean: 'ok' };

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
  /** Per-beat on-stage durations, from `gameFrameConfig.questWindow.beats`. */
  beatTiming: BeatTiming;
  title: string;
  flavour: string;
  /** The authored scenario — feeds the epilogue's intel labels and grant
   *  seams (titles/diseases/lore). Optional on lab paths. */
  scenario?: QuestScenario;
  /** Scene art for a node id. */
  artFor: (nodeId: string) => string | undefined;
  /** 0..1 of the expedition's time on the game clock, plus its readout. */
  time: { progress: number; label: string };
  onChoose: (optionId: string) => void;
  /** R-196: the per-item armed selection of the belt (`useQuestRun`). Optional
   *  for harnesses that render the window without a live run — defaults to
   *  "nothing armed" (the R-106 contract). */
  armedFlags?: ReadonlySet<string>;
  onToggleArmedFlag?: (flag: string) => void;
  onClose: () => void;
  /** Anchored position (the drag offset applies on top). */
  anchor: { left: number; top: number };
  widthPx: number;
  theaterAspect: number;
  tooltipLines: number;
  /** Companion geometry + the shell's clamp inset
   *  (`gameFrameConfig.questWindow.sidePanel*`/`edgeInsetPx`). Optional —
   *  defaults to the canonical config so lab/test harnesses can omit it. */
  companions?: { widthPx: number; gapPx: number; minWidthPx: number; edgeInsetPx: number };
  zIndex?: number;
}

export const QuestRunWindow: React.FC<QuestRunWindowProps> = ({
  run,
  phases,
  beats,
  queuedBeats,
  beatTiming,
  title,
  flavour,
  scenario,
  artFor,
  time,
  onChoose,
  armedFlags = NO_ARMED,
  onToggleArmedFlag,
  onClose,
  anchor,
  widthPx,
  theaterAspect,
  tooltipLines,
  companions = DEFAULT_COMPANIONS,
  zIndex,
}) => {
  const { t } = useTranslation('idleVillage');
  const shellRef = useRef<HTMLDivElement | null>(null);
  /* R-196: three companion panels, each independently toggleable — all open
   * by default (the Director's "everything visible at once" preference). The
   * shared layout predicate decides whether they MAY mount at this viewport. */
  const [partyOpen, setPartyOpen] = useState(true);
  const [beltOpen, setBeltOpen] = useState(true);
  const [logOpen, setLogOpen] = useState(true);
  const partyToggleRef = useRef<HTMLButtonElement | null>(null);
  const beltToggleRef = useRef<HTMLButtonElement | null>(null);
  const logToggleRef = useRef<HTMLButtonElement | null>(null);
  /* Live viewport width — the companions fit/collapse on the SAME predicate
   * the drag clamps against (WITNESS-01: no divergence between render and
   * clamp). */
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const layout = useMemo(
    () =>
      resolveQuestShellLayout(vw, {
        widthPx,
        sidePanelWidthPx: companions.widthPx,
        sidePanelGapPx: companions.gapPx,
        minSidePanelWidthPx: companions.minWidthPx,
        edgeInsetPx: companions.edgeInsetPx,
      }),
    [vw, widthPx, companions],
  );
  const companionsFit = layout.companionsFit;
  const sideWidth = layout.effectiveSideWidth;
  const { panelStyle, handleProps } = useHudPanelDrag({
    shellRef,
    edgeInsetPx: companions.edgeInsetPx,
    reclampDeps: [partyOpen, beltOpen, logOpen, companionsFit, sideWidth],
  });
  const [minimised, setMinimised] = useState(false);
  const allNodes = nodesFor(run);
  const node = allNodes[run.nodeId];
  const options = useMemo(() => availableOptions(run), [run]);
  /* Beat replay (T-008): while committed beats are still on stage the window
   *  presents them one at a time and blocks input — the frontier has already
   *  committed, choices must not fire mid-beat. Click/Enter/Space skips. */
  const reducedMotion = prefersReducedMotion();
  const beatCursor = useBeatCursor(queuedBeats, beatTiming, { reducedMotion });
  const presenting = beatCursor.current !== null;
  // Cinema FX (T-009): the configured beat→fx mapping for the beat on stage.
  const beatFx = useBeatFx(beatCursor.current, DEFAULT_QUEST_THEATRE_FX);
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
  // The scene's own title, unless it only repeats the quest's: then the phase name.
  const caption = node && !node.title.toLowerCase().includes(title.toLowerCase()) ? node.title : beats[currentBeat] ?? '';
  const captionHidden = !!node?.hidden && caption === node.title;

  // 1–9 pick a choice, as in a dialogue list; never while typing, minimised,
  // or while a beat is still on stage.
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
        onChoose(option.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [minimised, waiting, presenting, options, onChoose]);

  // While a beat plays, Enter/Space advances it (same as clicking anywhere).
  useEffect(() => {
    if (!presenting) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        beatCursor.skip();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presenting, beatCursor]);

  const shell: CSSProperties = { position: 'fixed', left: anchor.left, top: anchor.top, pointerEvents: 'auto', ...panelStyle, zIndex: panelStyle.zIndex ?? zIndex };
  const plaqueMaxH = `calc(100vh - ${anchor.top}px - ${companions.edgeInsetPx}px)`;
  const uid = React.useId();
  const partyPanelId = `${uid}-party`;
  const beltPanelId = `${uid}-belt`;
  const logPanelId = `${uid}-log`;
  /* Panel close → focus returns to its header toggle (WITNESS-04). */
  const closeParty = () => {
    setPartyOpen(false);
    partyToggleRef.current?.focus();
  };
  const closeBelt = () => {
    setBeltOpen(false);
    beltToggleRef.current?.focus();
  };
  const closeLog = () => {
    setLogOpen(false);
    logToggleRef.current?.focus();
  };
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
      (shell.querySelector<HTMLElement>('[data-testid="quest-window-beat-continue"]') ??
        shell.querySelector<HTMLElement>('[data-testid="quest-window-stage"]'))?.focus({ preventScroll: true });
    } else if (ended && shell.contains(document.activeElement)) {
      shell.querySelector<HTMLElement>('[data-testid="quest-window-stage"]')?.focus({ preventScroll: true });
    }
  }, [presenting]);

  const leftOpen = companionsFit && (partyOpen || beltOpen);
  const rightOpen = companionsFit && logOpen;

  if (minimised) {
    return (
      <SkinScope>
        <div data-hud-panel="quest" ref={shellRef} style={shell}>
          <HudPlaque
            shape="hang"
            as="section"
            aria-label={title}
            data-testid="quest-window-minimised"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }}
          >
            <div {...handleProps} style={{ ...handleProps.style, display: 'flex', alignItems: 'center', gap: 10 }}>
              <EngravedIcon id="evt-combat" size={18} style={{ color: TONE.accent }} />
              <span style={{ fontFamily: FONT.display, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--skin-title-color)' }}>
                {title}
              </span>
              <span style={{ fontFamily: FONT.display, fontSize: 12, color: TONE.secondary }}>
                {Math.min(currentBeat + 1, beats.length)}/{beats.length}
              </span>
              {waiting && <span aria-label={t('gameFrame.questWindow.waiting')} title={t('gameFrame.questWindow.waiting')} style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--skin-title-color)', boxShadow: '0 0 8px var(--skin-title-color)' }} />}
              <span data-hud-controls="" style={{ display: 'inline-flex' }}>
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
        {leftOpen && (
          <div
            data-hud-companion="left"
            data-testid="quest-companion-left"
            style={{ position: 'absolute', right: `calc(100% + ${companions.gapPx}px)`, top: 0, bottom: 0, width: sideWidth, display: 'flex', flexDirection: 'column', gap: companions.gapPx, minHeight: 0 }}
          >
            {partyOpen && <QuestPartyRosterPanel panelId={partyPanelId} run={run} healDeltas={actionPreview.memberDeltas} onClose={closeParty} />}
            {beltOpen && <QuestBeltPlaque panelId={beltPanelId} items={bag} statuses={beltStatuses} armedFlags={armedFlags} onToggleFlag={onToggleArmedFlag ?? (() => undefined)} onClose={closeBelt} />}
          </div>
        )}
        <HudPlaque
          shape="panel"
          as="section"
          aria-label={title}
          data-testid="quest-window"
          style={{ width: widthPx, maxHeight: plaqueMaxH, display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px 14px' }}
        >
        {/* ── Title row = drag handle; every icon lives on its right ── */}
        <div {...handleProps} title={t('gameFrame.panel.dragHint')} style={{ ...handleProps.style, display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ flex: 1, margin: 0, minWidth: 0, fontFamily: FONT.display, fontSize: 16, lineHeight: 1.2, letterSpacing: '0.06em', color: 'var(--skin-title-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </h2>
          {/* Companion toggles (R-196): Party Roster left, Belt left, Chronicle
              right — icon-only, `aria-expanded`/`aria-controls`, each opens and
              closes its own plaque and stays independent of the others. */}
          <div data-hud-controls style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              ref={partyToggleRef}
              aria-label={t('gameFrame.questWindow.roster')}
              title={t('gameFrame.questWindow.roster')}
              aria-expanded={partyOpen}
              aria-controls={partyPanelId}
              onClick={() => setPartyOpen((v) => !v)}
            >
              <EngravedIcon id="nav-company" />
              <PartyPips run={run} />
            </button>
            <button
              type="button"
              ref={beltToggleRef}
              aria-label={t('gameFrame.questWindow.bag')}
              title={t('gameFrame.questWindow.bag')}
              aria-expanded={beltOpen}
              aria-controls={beltPanelId}
              data-testid="quest-belt-toggle"
              onClick={() => setBeltOpen((v) => !v)}
            >
              <EngravedIcon id="nav-bag" />
            </button>
            <button
              type="button"
              ref={logToggleRef}
              aria-label={t('gameFrame.questWindow.chronicle')}
              title={t('gameFrame.questWindow.chronicle')}
              aria-expanded={logOpen}
              aria-controls={logPanelId}
              data-testid="quest-log-toggle"
              onClick={() => setLogOpen((v) => !v)}
            >
              <EngravedIcon id="ico-scroll" />
            </button>
            <button type="button" data-keep="" aria-label={t('gameFrame.questWindow.minimise')} title={t('gameFrame.questWindow.minimise')} onClick={() => setMinimised(true)}>
              <EngravedIcon id="cmd-minimize" />
            </button>
            <button type="button" data-keep="" aria-label={t('gameFrame.panels.close')} title={t('gameFrame.panels.close')} onClick={onClose}>
              <EngravedIcon id="cmd-close" />
            </button>
          </div>
        </div>

        {/* ── Flavour: the quest's one line, above the picture ── */}
        <p style={{ margin: 0, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 14, lineHeight: 1.4, color: TONE.secondary }}>{flavour}</p>

        {/* ── Theater — a scene beat cuts the picture to its node; cinematic
            beats close the letterbox over it (T-009). ── */}
        <Theater src={artFor(beatCursor.current?.kind === 'scene' ? beatCursor.current.nodeId : run.nodeId)} caption={caption} hidden={captionHidden} aspect={theaterAspect}>
          <Letterbox
            active={presenting && beatFx.letterbox}
            heightPct={DEFAULT_QUEST_THEATRE_FX.letterbox.heightPct}
            inMs={DEFAULT_QUEST_THEATRE_FX.letterbox.inMs}
            outMs={DEFAULT_QUEST_THEATRE_FX.letterbox.outMs}
            color="var(--skin-hud-lacquer-deep)"
            reducedMotion={reducedMotion}
          />
        </Theater>

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
            one moment at a time — click anywhere on it to continue (D-8). ── */}
        {presenting && beatCursor.current ? (
          <BeatStage
            beat={beatCursor.current}
            hidden={beatCursor.current.kind === 'scene' ? !!allNodes[beatCursor.current.nodeId]?.hidden : false}
            remaining={beatCursor.remaining}
            onSkip={beatCursor.skip}
            fx={beatFx}
            fxConfig={DEFAULT_QUEST_THEATRE_FX}
            reducedMotion={reducedMotion}
          />
        ) : (
        <div
          className="quest-s1-scroll"
          data-testid="quest-window-stage"
          aria-live="polite"
          tabIndex={-1}
          style={{ maxHeight: 168, minHeight: 0, flexShrink: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, outline: 'none' }}
        >
          {resolved.map((c) => (
            <div key={c.id} data-testid="quest-window-verdict" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <HudChip tone={VERDICT_TONE[c.verdict]}>{t(`questS1Lab.verdict.${c.verdict}`)}</HudChip>
                <span style={{ fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.06em', color: TONE.secondary }}>{c.title}</span>
              </div>
              {c.flavor && <p style={{ margin: 0, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 14, lineHeight: 1.45, color: TONE.label }}>{c.flavor}</p>}
              {c.harmLines.map((line, i) => (
                <Line key={i} tone={c.deathLines?.includes(line) ? 'death' : 'warn'}>{line}</Line>
              ))}
              {c.authoredText && <Line tone="secondary">{c.authoredText}</Line>}
            </div>
          ))}
          {showLastEvent && (
            <p style={{ margin: 0, fontFamily: FONT.serif, fontSize: 13, lineHeight: 1.45, color: TONE.label }}>{run.lastEvent}</p>
          )}
          {node?.body && !run.ended && (
            <p style={{ margin: 0, fontFamily: FONT.serif, fontSize: 14, lineHeight: 1.5, color: TONE.text }}>{node.body}</p>
          )}
          {/* v27 pending frontier: the node is maturing — show the authored transit as the breath before the consequences land. */}
          {!run.ended && run.frontier.status === 'pending' && node?.transit && (
            <p style={{ margin: 0, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 13, lineHeight: 1.45, color: TONE.secondary }}>{node.transit}</p>
          )}
          {run.ended && (
            <p style={{ margin: 0, fontFamily: FONT.display, fontSize: 14, letterSpacing: '0.06em', color: run.outcome === 'wipe' ? TONE.death : TONE.label }}>
              {t(`questS1Lab.outcome.${run.outcome}`)}
            </p>
          )}
          {/* S4 T-2: the mandatory return report — the settlement's own
           *  numbers (cost first, yield after), shown once the run's last
           *  beat has played. */}
          {run.ended && !presenting && <QuestEpilogue run={run} scenario={scenario} />}
        </div>
        )}

        {/* ── Choices: a numbered dialogue list (BG3 / Disco Elysium idiom) — the
            bag's belt lives in the LEFT companion plaque (R-196), never inline ── */}
        {!presenting && (waiting || run.ended) && (
          <div data-hud-choices style={{ display: 'flex', flexDirection: 'column', margin: '0 -4px' }}>
            {waiting &&
              options.map((o, i) => {
                const { pv, base } = previews[o.id] ?? { pv: null, base: null };
                return (
                  <button key={o.id} type="button" data-skin="choice" data-testid="quest-window-choice" data-option-id={o.id} disabled={o.disabled} onClick={() => onChoose(o.id)}>
                    <span data-choice-index style={{ fontFamily: FONT.display, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{i + 1}.</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ fontFamily: FONT.display, fontSize: 15, color: 'var(--skin-text-primary)' }}>{o.label}</span>
                      {o.detail && <span style={{ fontFamily: FONT.serif, fontSize: 13, lineHeight: 1.35, color: TONE.secondary }}>{o.detail}</span>}
                      {pv && (
                        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 3 }}>
                          <HudChip tone="ok" title={base && pv.consumableLabel ? `${pv.consumableLabel} +${pv.consumableBonus}` : undefined}>
                            {base ? `${base.successPct}% → ${pv.successPct}%` : t('questS1Lab.successPct', { pct: pv.successPct })}
                          </HudChip>
                          {pv.woundPct > 0 && <HudChip tone="warn">{t('questS1Lab.woundPct', { pct: pv.woundPct })}</HudChip>}
                          {pv.deathPct > 0 && <HudChip tone="danger">{t('questS1Lab.deathPct', { pct: pv.deathPct })}</HudChip>}
                        </span>
                      )}
                    </span>
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
        )}

        {/* ── Time: start of the expedition → its return, on the game clock ── */}
        <TimeBar progress={time.progress} label={time.label} phase={t('gameFrame.questWindow.phaseOf', { n: Math.min(currentBeat + 1, beats.length), total: beats.length })} />

        {/* ── Phases: every one played, the current one, then the next as a question mark ── */}
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
        </HudPlaque>
        {rightOpen && (
          <div
            data-hud-companion="right"
            data-testid="quest-companion-right"
            style={{ position: 'absolute', left: `calc(100% + ${companions.gapPx}px)`, top: 0, bottom: 0, width: sideWidth, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          >
            {logOpen && <QuestLogPanel panelId={logPanelId} run={run} onClose={closeLog} />}
          </div>
        )}
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

/** The stage while committed beats replay (T-008): one moment at a time. The
 *  Continue button → next beat (R-196: a real `<button>`, never a div wearing
 *  `role="button"` — no nested interactives, `aria-live` announces the beat).
 *  Deaths get the muted/dark register and a skull (D-8) — the weight is in the
 *  colour, never in a forced wait. T-009 adds the cinema accents: verdict edge
 *  flash + typewriter where the config earns them. */
const BeatStage: React.FC<{
  beat: QuestBeat;
  /** The beat's node is authored `hidden` — a marker asks for the eye-off glyph. */
  hidden?: boolean;
  remaining: number;
  onSkip: () => void;
  fx: BeatFx;
  fxConfig: QuestTheatreFxConfig;
  reducedMotion: boolean;
}> = ({ beat, hidden, remaining, onSkip, fx, fxConfig, reducedMotion }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <div data-testid="quest-window-beat" aria-live="polite" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 96 }}>
      {fx.flashTone && (
        <EdgeFlash
          flashKey={beat.id}
          color={TONE[fx.flashTone as keyof typeof TONE] ?? TONE.label}
          durationMs={fxConfig.edgeFlash.durationMs}
          reducedMotion={reducedMotion}
        />
      )}
      {beat.kind === 'scene' && (
        <>
          <span style={{ fontFamily: FONT.display, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: TONE.secondary }}>
            {hidden && <HiddenMark />}
            {beat.title}
          </span>
          {beat.body && (
            <p style={{ margin: 0, fontFamily: FONT.serif, fontSize: 14, lineHeight: 1.5, color: TONE.text }}>
              {fx.typewriter === 'body' ? (
                <TypewriterText text={beat.body} charsPerSecond={fxConfig.typewriter.charsPerSecond} textKey={beat.id} reducedMotion={reducedMotion} />
              ) : (
                beat.body
              )}
            </p>
          )}
        </>
      )}
      {beat.kind === 'check' && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
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
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT.display, fontSize: 13, letterSpacing: '0.06em', color: beat.harm.kind === 'death' ? TONE.death : TONE.warn }}>
            {beat.harm.kind === 'death' && <EngravedIcon id="status-fallen" size={13} />}
            {beat.memberName}
          </span>
          {beat.line && <span style={{ fontFamily: FONT.serif, fontSize: 13, lineHeight: 1.4, color: beat.harm.kind === 'death' ? TONE.death : TONE.label }}>{beat.line}</span>}
        </div>
      )}
      {beat.kind === 'end' && (
        <>
          <p style={{ margin: 0, fontFamily: FONT.display, fontSize: 14, letterSpacing: '0.06em', color: beat.outcome === 'wipe' ? TONE.death : TONE.label }}>
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
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
        <span style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 12, color: TONE.muted }}>
          {remaining > 0 ? t('gameFrame.questWindow.beats.more', { count: remaining + 1 }) : t('gameFrame.questWindow.beats.clickHint')}
        </span>
        {/* R-196: a real Continue pill — the only beat control; the "Skip to
            the frontier" button is gone (Director call). */}
        <span data-hud-controls="" style={{ display: 'inline-flex' }}>
          <button type="button" data-testid="quest-window-beat-continue" onClick={onSkip}>
            {t('gameFrame.questWindow.beats.continue')}
          </button>
        </span>
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
        <EngravedIcon id="evt-combat" size={13} style={{ color: TONE.danger }} />
        <span data-testid="combat-enemy-pips" aria-label={t('gameFrame.questWindow.combat.enemiesLeft', { count: run.goblinLeft })} style={{ display: 'inline-flex', gap: 3 }}>
          {Array.from({ length: spec.enemies }, (_, i) => (
            <span
              key={i}
              aria-hidden
              data-filled={i < run.goblinLeft}
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: i < run.goblinLeft ? TONE.danger : 'transparent',
                border: `1px solid ${i < run.goblinLeft ? TONE.danger : 'color-mix(in srgb, var(--skin-text-muted) 55%, transparent)'}`,
              }}
            />
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
                    color: ex >= maxExposure ? TONE.danger : TONE.muted,
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
                  color={hitBeat.harm.kind === 'death' ? TONE.death : TONE.danger}
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

/** Cinema-scope picture: cross-fades on a new scene and drifts slowly (Ken Burns). */
const Theater: React.FC<{ src?: string; caption: string; hidden?: boolean; aspect: number; children?: React.ReactNode }> = ({ src, caption, hidden, aspect, children }) => {
  const img = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // Web Animations, not rAF: the element's own style is the end state, so a frozen
    // (hidden) tab still shows the picture.
    const el = img.current;
    if (!el?.animate) return undefined;
    const fade = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'ease-out' });
    const drift = el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }], { duration: 16000, easing: 'ease-in-out', fill: 'forwards' });
    return () => {
      fade.cancel();
      drift.cancel();
    };
  }, [src]);
  return (
    <div style={{ position: 'relative', aspectRatio: String(aspect), overflow: 'hidden', borderRadius: 6, border: '1px solid color-mix(in srgb, var(--skin-surface-border) 60%, transparent)', background: 'var(--skin-hud-lacquer-deep)' }}>
      {src && <img ref={img} key={src} src={src} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%' }} />}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 95% at 50% 40%, transparent 55%, color-mix(in srgb, var(--skin-hud-lacquer-deep) 70%, transparent))' }} />
      <div aria-hidden style={{ position: 'absolute', insetInline: 0, bottom: 0, height: '55%', background: SCRIM.bottom }} />
      {children}
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 8, fontFamily: FONT.display, fontSize: 14, letterSpacing: '0.06em', color: 'var(--skin-title-color)', textShadow: 'var(--skin-incision-label)' }}>
        {hidden && <HiddenMark />}
        {caption}
      </div>
    </div>
  );
};

const TimeBar: React.FC<{ progress: number; label: string; phase: string }> = ({ progress, label, phase }) => {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label}
        style={{ position: 'relative', height: 4, borderRadius: 2, overflow: 'hidden', background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 85%, transparent)', border: '1px solid color-mix(in srgb, var(--skin-surface-border) 45%, transparent)' }}
      >
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

const PhaseTile: React.FC<{ phase: PhaseRecord; name: string; current: boolean; run: QuestRunState; tooltipLines: number }> = ({ phase, name, current, run, tooltipLines }) => {
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
            {played && outcome === 'clean' && <EngravedIcon id="role-bodyguard" size={12} style={{ position: 'absolute', right: 2, bottom: 2, color: TONE.ok }} />}
            {outcome === 'death' && <EngravedIcon id="status-fallen" size={12} style={{ position: 'absolute', right: 2, bottom: 2, color: TONE.death }} />}
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

export default QuestRunWindow;
