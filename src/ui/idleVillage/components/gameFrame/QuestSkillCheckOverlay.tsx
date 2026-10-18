/**
 * QuestSkillCheckOverlay — PLAN-040 T-003b: the skill check painted OUTSIDE
 * the quest window, in front of it, inside `#game-modal-root` (mounted by
 * `questOverlays`, a React sibling of the window — no synthetic-bubbling
 * suppression, no drag-transform trap).
 *
 * Contract with the beat-cursor owner (`QuestRunWindow`, via the store's
 * `QuestCheckBridge`):
 * - the engine has already resolved verdict AND harm — this overlay only
 *   paints (`mode` forced, same as the old in-theatre dock);
 * - spin → click on the board = `skipToResult()` (progressive skip);
 * - resolve → `bridge.onResolved(beatId)` (the owner starts the verdict
 *   dwell); the beat stays held until dismissal;
 * - post-verdict click anywhere on the plaque (or Escape when topmost, or
 *   its X) = `bridge.onDismiss(beatId)` — the owner settles the held beat;
 * - `bridge.autoThrow` (skipIntro) fires `throw()` right after mount — the
 *   command is deferred to the confirmed mount (debate W-08).
 *
 * Sizing is layout-driven (debate2 W-06): the plaque is a flex column capped
 * at `100dvh − 2·overlayMarginPx`; the board is `aspect-ratio:1`,
 * `min-height: boardMinPx`, main-size capped at `boardSizePx` (compact rule
 * `min(50vh, 90vw)` under `compactBelowPx`) — i18n wrapping, 200% zoom and a
 * 1280×400 viewport are absorbed by real layout, not by estimates. Under the
 * floor the plaque scrolls internally.
 *
 * Dismiss arming (debate W-12): the post-verdict dismiss arms only once the
 * verdict is painted AND `dismissArmDelayMs` elapsed — a skip-click landing
 * with the verdict cannot erase it unseen. Double-clicks (`detail > 1`) and
 * drag-release tails (|Δpointer| > 4px) are ignored. Resume mid-hold: a
 * check the overlay already painted survives a host remount as
 * `resolved-held` (verdict up, no spin) via the module-level seen set.
 */

import React, { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { EngravedIcon } from './engravedIcons';
import { HudPlaque, SkinCloseButton, SkinScope, prefersReducedMotion } from '@/ui/idleVillage/skins/primitives';
import { HudChip } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import { DestinyAstrolabeV62Standalone, type DestinyAstrolabeV62Handle } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { runIdOf } from '@/ui/idleVillage/quests/questSettlement';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestCheckBridge } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { useHudPanelDrag } from './useHudPanelDrag';
import { useOverlayEscape } from './overlayStack';

const FONT = {
  display: 'var(--skin-font-display)',
  serif: 'var(--skin-font-serif)',
} as const;

/** Checks whose verdict this session already painted — remounts of the same
 *  run's held check hydrate straight to `resolved-held` (no second spin). */
const seenCheckKeys = new Set<string>();

/** Max pointer travel (px) a click may carry before it counts as a drag tail. */
const CLICK_DRAG_TOLERANCE_PX = 4;

/** The frozen kit's presentation baseline (`engine.ts` defaults to
 *  `{stat:60, difficulty:50}`): `check.score` is the success bound after
 *  clamps, the kit paints `<title>:score/difficulty` — one constant for the
 *  skills prop and the title-row chip so they can never drift apart. */
const ASTROLABE_DIFFICULTY_BASELINE = 50;

/** The check is the scene's main character (PLAN-043 T3.2): the screen behind it dims, softly and without blocking
 *  input (the check is not modal — v4), and the plaque arrives instead of popping in. */
const STAGE_CSS = `
@keyframes questCheckScrimIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes questCheckPlaqueIn {
  from { opacity: 0; transform: translateY(14px) scale(0.965); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}`;
const SCRIM_BACKGROUND =
  'radial-gradient(ellipse at 50% 52%, color-mix(in srgb, var(--skin-hud-lacquer-deep, #060f16) 28%, transparent) 0%, color-mix(in srgb, var(--skin-hud-lacquer-deep, #060f16) 62%, transparent) 100%)';

export interface QuestSkillCheckOverlayProps {
  bridge: QuestCheckBridge;
  run: QuestRunState;
}

export const QuestSkillCheckOverlay: React.FC<QuestSkillCheckOverlayProps> = ({ bridge, run }) => {
  const { t } = useTranslation('idleVillage');
  const cfg = DEFAULT_GAME_FRAME_CONFIG.questWindow.skillCheck;
  const zIndex = DEFAULT_GAME_FRAME_CONFIG.zLayers.questCheck;
  const { beatId, check, mode } = bridge;
  const checkKey = `${runIdOf(run)}#${check.checkSeq}`;

  /* `resolved` = the astrolabe painted the verdict (not merely mounted);
   * `armed` = post-verdict dismiss accepts input (arm delay elapsed). A
   * check re-mounted after its verdict was already seen starts resolved —
   * the hydrated "resolved-held" state. */
  const [resolved, setResolved] = useState(() => seenCheckKeys.has(checkKey));
  const [armed, setArmed] = useState(false);
  const plaqueRef = useRef<HTMLDivElement | null>(null);
  const astroRef = useRef<DestinyAstrolabeV62Handle | null>(null);
  const armTimer = useRef<number | null>(null);
  const autoDismissTimer = useRef<number | null>(null);
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  /* Double-dismiss guard (debate r007): the settle is keyed to THIS check —
   *  a second click between dismiss and unmount can neither re-fire
   *  telemetry nor advance the cursor a second time. */
  const dismissedFor = useRef<string | null>(null);

  /* Live viewport width — the compact board rule keys on it. */
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 1440 : window.innerWidth));
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const compact = vw < cfg.compactBelowPx;

  const { panelStyle, handleProps } = useHudPanelDrag({
    shellRef: plaqueRef,
    edgeInsetPx: cfg.overlayMarginPx,
    reclampDeps: [resolved, compact],
  });

  /** The only valid dismiss: verdict painted + arm delay elapsed, once. */
  const dismiss = useCallback(() => {
    if (!armed || dismissedFor.current === checkKey) return;
    dismissedFor.current = checkKey;
    trackTelemetryEvent('quest_check_dismissed', {
      runId: runIdOf(run),
      checkSeq: check.checkSeq,
      visitSeq: check.visitSeq,
      beatIndex: check.beatIndex,
      outcome: check.verdict,
    });
    bridge.onDismiss(beatId);
  }, [armed, bridge, beatId, run, check, checkKey]);

  const overlayId = `quest-check:${beatId}`;
  /* Escape reaches only the topmost overlay; mid-spin it is a no-op. */
  useOverlayEscape(overlayId, dismiss);

  /* Fill the imperative slot: the owner's click-to-skip reaches the astrolabe
   * through `bridge.handle` (skipToResult / throwNow). */
  useEffect(() => {
    bridge.handle.current = {
      skipToResult: () => astroRef.current?.skipToResult(),
      throwNow: () => astroRef.current?.throw(),
    };
    return () => {
      if (bridge.handle.current) bridge.handle.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridge.handle]);

  /* Focus choreography: remember who had focus, hand it back on unmount —
   * opener if still connected, else the quest window, else the body. */
  useEffect(() => {
    restoreFocusTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      const prev = restoreFocusTo.current;
      if (prev?.isConnected) prev.focus();
      else document.querySelector<HTMLElement>('[data-hud-panel="quest"]')?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* T-004 measurement: the first real check mount is the paired-delta the
   *  warm gate is judged on — `__gamePerf.measure('questCheckMount',
   *  'quest-check-mount:begin', 'quest-check-mount:end')`. The probe only
   *  exists on dev/playwright builds; elsewhere this is a no-op. */
  useEffect(() => {
    const perf = (window as unknown as { __gamePerf?: { mark: (n: string) => void } }).__gamePerf;
    if (!perf) return undefined;
    perf.mark('quest-check-mount:begin');
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => perf.mark('quest-check-mount:end'));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  /* skipIntro: throw right after the mount has confirmed (debate W-08).
   * Resolved-held hydration skips the spin via skipToResult on the same
   * deferred path — the astrolabe's own arm must exist first. */
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (seenCheckKeys.has(checkKey)) astroRef.current?.skipToResult();
      else if (bridge.autoThrow) astroRef.current?.throw();
    }, 0);
    return () => window.clearTimeout(id);
    /* `bridge.autoThrow` is a live toggle — flipping «skip intro» mid-spin
     * throws immediately (the deferred 0ms keeps the arm-order guarantee). */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkKey, bridge.autoThrow]);

  /* Arm the dismiss once the verdict is painted + the configured delay; the
   * optional auto-dismiss rides the same moment. */
  useEffect(() => {
    if (!resolved) return;
    armTimer.current = window.setTimeout(() => setArmed(true), cfg.dismissArmDelayMs);
    if (cfg.verdictAutoDismissMs > 0) {
      autoDismissTimer.current = window.setTimeout(() => {
        setArmed(true);
        /* Dismiss needs `armed` true — the state above lands next render;
         * the owner's settle is idempotent, so call it directly here. */
        bridge.onDismiss(beatId);
      }, cfg.dismissArmDelayMs + cfg.verdictAutoDismissMs);
    }
    /* Verdict painted → the dialog takes focus so keyboard dismissal works. */
    plaqueRef.current?.focus();
    return () => {
      if (armTimer.current !== null) window.clearTimeout(armTimer.current);
      if (autoDismissTimer.current !== null) window.clearTimeout(autoDismissTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved]);

  /** Astrolabe painted the verdict → tell the owner (dwell) and arm up. */
  const handleAstroResolve = useCallback(() => {
    seenCheckKeys.add(checkKey);
    setResolved(true);
    bridge.onResolved(beatId);
  }, [bridge, beatId, checkKey]);

  const titleId = `${overlayId}-title`;
  const verdictLabel = t(`questS1Lab.verdict.${mode}`);
  /* The board's WIDTH is explicit (PLAN-043 T3.2): left to the plaque's content width it collapsed to `boardMinPx`
   * (240 px at every screen size) and the kit — drawn larger — was clipped on three sides. It now grows with the
   * screen (`boardVh` % of the height, between `boardSizePx` and `boardMaxPx`) and is always limited by what fits:
   * the viewport height minus the margins and the title bar, and the viewport width. Compact screens keep their rule. */
  const fitH = `calc(100dvh - ${cfg.overlayMarginPx * 2 + 96}px)`;
  const fitW = `calc(100vw - ${cfg.overlayMarginPx * 2 + 24}px)`;
  const boardWidth = compact
    ? `min(50vh, 90vw)`
    : `min(clamp(${cfg.boardSizePx}px, ${cfg.boardVh}dvh, ${cfg.boardMaxPx}px), ${fitH}, ${fitW})`;

  /* Click policy: during the spin only the BOARD settles the verdict; after
   * resolve (and the arm delay) the whole plaque dismisses — except real
   * buttons, double-clicks and drag tails. */
  const onPlaqueClick = (event: React.MouseEvent<HTMLElement>) => {
    if (event.detail > 1) return;
    if ((event.target as HTMLElement).closest('button')) return;
    if (!resolved || !armed) return;
    const down = pointerDownAt.current;
    if (down && Math.abs(event.clientX - down.x) + Math.abs(event.clientY - down.y) > CLICK_DRAG_TOLERANCE_PX) return;
    dismiss();
  };
  const onBoardClick = (event: React.MouseEvent<HTMLElement>) => {
    if (resolved) return;
    if ((event.target as HTMLElement).closest('button')) return;
    astroRef.current?.skipToResult();
    event.stopPropagation();
  };

  return (
    <SkinScope>
      {/* The grid shell does the centring — the plaque itself stays
          transform-free so `useHudPanelDrag` can translate it. */}
      <div
        data-quest-owned
        data-testid="quest-check-overlay-shell"
        style={{ position: 'fixed', inset: 0, zIndex, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}
      >
        <style>{STAGE_CSS}</style>
        <div
          aria-hidden
          data-testid="quest-check-scrim"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: SCRIM_BACKGROUND,
            animation: prefersReducedMotion() ? undefined : 'questCheckScrimIn 260ms ease-out both',
          }}
        />
        {/* Drag/focus host — HudPlaque forwards no ref, so the wrapper carries
            `data-hud-panel` (the transform lands here) and the dialog a11y. */}
        <div
          ref={plaqueRef}
          data-hud-panel="quest-check"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          tabIndex={-1}
          onPointerDown={(e) => {
            pointerDownAt.current = { x: e.clientX, y: e.clientY };
          }}
          onClick={onPlaqueClick}
          style={{
            ...panelStyle,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            maxHeight: `calc(100dvh - ${cfg.overlayMarginPx * 2}px)`,
            maxWidth: `calc(100vw - ${cfg.overlayMarginPx * 2}px)`,
            outline: 'none',
            cursor: resolved && armed ? 'pointer' : undefined,
          }}
        >
        <HudPlaque
          shape="panel"
          data-quest-owned
          data-testid="quest-check-overlay"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 10,
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            animation: prefersReducedMotion() ? undefined : 'questCheckPlaqueIn 240ms cubic-bezier(0.22, 1, 0.36, 1) both',
          } as CSSProperties}
        >
          {/* Title bar = drag handle; the close X dismisses once armed. */}
          <div
            {...handleProps}
            style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 26 }}
          >
            <EngravedIcon id="ico-spark" size={16} />
            <div id={titleId} style={{ flex: 1, fontFamily: FONT.display, fontSize: 14, letterSpacing: '0.08em', color: 'var(--skin-title-color)', textTransform: 'uppercase' }}>
              {check.title}
              <span style={{ fontFamily: FONT.serif, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, color: 'var(--skin-text-muted)', marginLeft: 8, fontSize: 12 }}>
                {t('gameFrame.questWindow.checkOverlay.titleSuffix')}
              </span>
            </div>
            {/* Stat/difficulty chip — the same pair the board paints. */}
            <HudChip tone="label" title={t('gameFrame.questWindow.checkOverlay.scoreTitle', { score: check.score, difficulty: ASTROLABE_DIFFICULTY_BASELINE })}>
              {check.score}/{ASTROLABE_DIFFICULTY_BASELINE}
            </HudChip>
            {resolved && (
              <HudChip tone={mode.startsWith('fail') || mode === 'epicfail' ? 'danger' : mode === 'almost' ? 'warn' : 'ok'}>
                {verdictLabel}
              </HudChip>
            )}
            <SkinCloseButton
              aria-label={t('gameFrame.questWindow.checkOverlay.dismiss')}
              disabled={!armed}
              onClick={dismiss}
            />
          </div>
          {/* The board square: flex item, aspect-ratio keeps it square while
              the column's leftover height decides its size (layout-driven). */}
          <div
            data-testid="quest-check-board"
            onClick={onBoardClick}
            style={{
              flex: '0 0 auto',
              width: boardWidth,
              minHeight: cfg.boardMinPx,
              aspectRatio: '1 / 1',
              alignSelf: 'center',
              maxWidth: '100%',
              overflow: 'hidden',
              cursor: resolved ? 'default' : 'pointer',
            }}
          >
            <DestinyAstrolabeV62Standalone
              key={beatId}
              ref={astroRef}
              skills={[{ name: check.title, stat: check.score, difficulty: ASTROLABE_DIFFICULTY_BASELINE }]}
              config={{ mode, wound: check.woundPct, dead: check.deathPct, harm: check.harm }}
              onResolve={handleAstroResolve}
              autoStart
              removeSounds
            />
          </div>
          {resolved && (
            <div style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 12, color: 'var(--skin-text-muted)', textAlign: 'center' }}>
              {t('gameFrame.questWindow.checkOverlay.dismissHint')}
            </div>
          )}
          {/* Verdict announcement for assistive tech — the visible chip is
              glanceable, the live region carries it. */}
          <div aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>
            {resolved ? `${check.title}: ${verdictLabel}` : ''}
          </div>
        </HudPlaque>
        </div>
      </div>
    </SkinScope>
  );
};

export default QuestSkillCheckOverlay;
