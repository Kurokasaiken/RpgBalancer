/**
 * GameBootScreen — the /game title veil (PLAN-031 T-A1).
 *
 * A branded loading screen that covers the whole viewport while the world
 * preloads: the authored logo plaque floating on the HUD's sea-teal lacquer, a
 * thin gold rule, a determinate progress bar driven by the map's real boot
 * progress, and a phase caption. When `done` arrives it waits out the minimum
 * display time, fades, then calls `onExited` so the page can unmount it.
 *
 * The same component is the Suspense fallback in `App.tsx` (phase
 * `manifest`, indeterminate), so the first pixel the player sees is already
 * the title screen — never a grey "Loading…" text.
 */

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import type { PixiBootPhase } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import logoUrl from '@/assets/ui/idleVillage/wanderlust-logo.png';

/** Boot phases the veil can report; `manifest` covers everything before the Pixi map starts talking. */
export type GameBootPhase = 'manifest' | PixiBootPhase;

export interface GameBootScreenProps {
  phase: GameBootPhase;
  /** 0–1 fill for the progress bar. Ignored while `indeterminate`. */
  fraction?: number;
  /** No measurable unit yet (page chunk / world manifest still loading): the bar pulses instead of sitting at 0. */
  indeterminate?: boolean;
  /** Boot complete: the bar fills, the veil keeps `minDisplayMs` on screen, fades, then calls `onExited`. */
  done?: boolean;
  /** Boot failure: replaces the progress bar so the veil reports instead of hanging. */
  error?: string | null;
  /** Called once the exit fade has finished and the veil can be unmounted. */
  onExited?: () => void;
}

const BOOT_VEIL = DEFAULT_GAME_FRAME_CONFIG.bootVeil;

export function GameBootScreen({ phase, fraction = 0, indeterminate = false, done = false, error = null, onExited }: GameBootScreenProps) {
  const { t } = useTranslation('idleVillage');
  const reducedMotion = useRef(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false).current;
  const [leaving, setLeaving] = useState(false);
  const mountedAtRef = useRef(performance.now());
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;

  /* Exit sequence: `done` → wait out the minimum display time → fade →
   * unmount. Two separate effects: clearing the exit timer on the `leaving`
   * re-render would kill it the moment it is scheduled. Reduced motion skips
   * the fade and goes straight to unmount. */
  useEffect(() => {
    if (!done || leaving) return undefined;
    const remaining = Math.max(0, mountedAtRef.current + BOOT_VEIL.minDisplayMs - performance.now());
    const startTimer = window.setTimeout(() => setLeaving(true), remaining);
    return () => window.clearTimeout(startTimer);
  }, [done, leaving]);
  useEffect(() => {
    if (!leaving) return undefined;
    if (reducedMotion) {
      onExitedRef.current?.();
      return undefined;
    }
    // transitionend is unreliable when the tab is hidden: the timeout is the authority.
    const exitTimer = window.setTimeout(() => onExitedRef.current?.(), BOOT_VEIL.fadeMs + 80);
    return () => window.clearTimeout(exitTimer);
  }, [leaving, reducedMotion]);

  const colors = BOOT_VEIL.colors;
  const pct = Math.round(Math.min(1, Math.max(0, done ? 1 : fraction)) * 100);
  const fadeMs = reducedMotion ? 0 : BOOT_VEIL.fadeMs;

  const rootStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: DEFAULT_GAME_FRAME_CONFIG.zLayers.boot,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    background: `radial-gradient(ellipse 120% 90% at 50% 42%, ${colors.bgGlow} 0%, ${colors.bgDeep} 62%, ${colors.bgDeep} 100%)`,
    opacity: leaving ? 0 : 1,
    transition: `opacity ${fadeMs}ms ease`,
    pointerEvents: leaving ? 'none' : 'auto',
  };
  const logoStyle: CSSProperties = {
    width: `min(${BOOT_VEIL.logoWidthPx}px, 78vw)`,
    height: 'auto',
    // The plaque casts its own ambient light; the drop-shadow seats it on the lacquer.
    filter: 'drop-shadow(0 10px 34px rgba(0, 0, 0, 0.55))',
  };
  const ruleStyle: CSSProperties = {
    width: BOOT_VEIL.barWidthPx * 0.72,
    height: 1,
    margin: '18px 0 26px',
    background: `linear-gradient(90deg, transparent, ${colors.rule}, transparent)`,
  };
  const trackStyle: CSSProperties = {
    width: BOOT_VEIL.barWidthPx,
    height: BOOT_VEIL.barHeightPx,
    borderRadius: BOOT_VEIL.barHeightPx,
    background: colors.barTrack,
    overflow: 'hidden',
  };
  const fillStyle: CSSProperties = {
    height: '100%',
    borderRadius: 'inherit',
    background: `linear-gradient(90deg, ${colors.barFill}, ${colors.title})`,
    transition: 'width 140ms linear',
    ...(indeterminate && !done
      ? { width: '30%', animation: 'game-boot-indeterminate 1.4s ease-in-out infinite' }
      : { width: `${pct}%` }),
  };
  const captionStyle: CSSProperties = {
    marginTop: 14,
    fontFamily: "var(--font-body, 'Crimson Text', serif)",
    fontSize: 13,
    letterSpacing: '0.08em',
    color: colors.caption,
    minHeight: 18,
  };

  return (
    <div data-testid="game-boot-screen" data-boot-phase={phase} style={rootStyle} role="status" aria-live="polite">
      <style>{`@keyframes game-boot-indeterminate { 0% { transform: translateX(-110%); } 100% { transform: translateX(340%); } }`}</style>
      <img
        src={logoUrl}
        style={logoStyle}
        alt={t('gameFrame.boot.logoAlt', { defaultValue: 'Wanderlust: Triumph' })}
      />
      <div style={ruleStyle} aria-hidden="true" />
      {error ? (
        <p style={{ ...captionStyle, marginTop: 0, color: colors.error }} role="alert">
          {t('gameFrame.boot.error', { defaultValue: 'The world could not be prepared' })}
        </p>
      ) : (
        <div
          style={trackStyle}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={indeterminate && !done ? undefined : pct}
          aria-label={t('gameFrame.boot.progress', { defaultValue: 'Loading progress' })}
        >
          <div style={fillStyle} />
        </div>
      )}
      <p style={captionStyle}>
        {error
          ? error
          : indeterminate && !done
            ? t('gameFrame.boot.phase.manifest', { defaultValue: 'Preparing the world' })
            : t(`gameFrame.boot.phase.${phase}`, { defaultValue: 'Loading' })}
      </p>
    </div>
  );
}

export default GameBootScreen;
