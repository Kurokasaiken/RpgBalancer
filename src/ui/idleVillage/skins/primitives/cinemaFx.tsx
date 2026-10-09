/**
 * Cinema FX primitives (PLAN-025 T-009) — the cinematic accents the quest
 * window earns on tone-changing beats: letterbox bars over the theater, a
 * verdict-coloured edge flash, and a typewriter reveal.
 *
 * Presentation only: every duration/ratio arrives via props from
 * `questTheatreFx` config; colours are skin tokens passed by the caller;
 * `reducedMotion` renders NO effect (I-5 — the accent simply doesn't exist).
 * Animations use the Web Animations API like `Theater`'s Ken Burns: the
 * element's own style is the end state, so a frozen tab still resolves.
 */

import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { QuestBeat } from '@/ui/idleVillage/questS1Lab/beatSequencer';
import type { QuestTheatreFxConfig } from '@/balancing/config/idleVillage/quests/questTheatreFx';

/* ------------------------------------------------------------------ */
/* Letterbox — black bars closing in over the theater image            */
/* ------------------------------------------------------------------ */

export interface LetterboxProps {
  /** True while the cinematic beat is on stage: bars close in / slide out. */
  active: boolean;
  /** Each bar's height as % of the container's height. */
  heightPct: number;
  inMs: number;
  outMs: number;
  /** Bar colour — the caller passes a skin/toned value. */
  color: string;
  /** No animation and no bars at all under reduced motion (I-5). */
  reducedMotion?: boolean;
}

export const Letterbox: React.FC<LetterboxProps> = ({ active, heightPct, inMs, outMs, color, reducedMotion }) => {
  if (reducedMotion) return null;
  const bar: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    height: `${heightPct}%`,
    background: color,
    transitionProperty: 'transform',
    transitionTimingFunction: 'ease-out',
    zIndex: 2,
    pointerEvents: 'none',
  };
  const ms = active ? inMs : outMs;
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
      <div style={{ ...bar, top: 0, transform: active ? 'translateY(0)' : 'translateY(-101%)', transitionDuration: `${ms}ms` }} />
      <div style={{ ...bar, bottom: 0, transform: active ? 'translateY(0)' : 'translateY(101%)', transitionDuration: `${ms}ms` }} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* EdgeFlash — a one-shot coloured frame fading over the stage         */
/* ------------------------------------------------------------------ */

export interface EdgeFlashProps {
  /** Change the key to re-fire the flash (per beat id — stable beats don't
   *  re-flash on unrelated re-renders). */
  flashKey: string;
  color: string;
  durationMs: number;
  reducedMotion?: boolean;
}

export const EdgeFlash: React.FC<EdgeFlashProps> = ({ flashKey, color, durationMs, reducedMotion }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el?.animate || reducedMotion) return undefined;
    const anim = el.animate(
      [
        { opacity: 0 },
        { opacity: 0.55, offset: 0.25 },
        { opacity: 0 },
      ],
      { duration: durationMs, easing: 'ease-out' },
    );
    return () => anim.cancel();
  }, [flashKey, durationMs, reducedMotion]);
  if (reducedMotion) return null;
  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 6,
        boxShadow: `inset 0 0 0 1px ${color}, inset 0 0 22px ${color}`,
        opacity: 0,
        pointerEvents: 'none',
        zIndex: 3,
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
/* TypewriterText — the authored line reveals character by character    */
/* ------------------------------------------------------------------ */

export interface TypewriterTextProps {
  text: string;
  /** Reveal speed from config — never invented per call site. */
  charsPerSecond: number;
  reducedMotion?: boolean;
  /** Key that restarts the reveal (beat id). */
  textKey?: string;
  style?: CSSProperties;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({ text, charsPerSecond, reducedMotion, textKey, style }) => {
  const [shown, setShown] = useState(() => (reducedMotion ? text.length : 0));
  useEffect(() => {
    if (reducedMotion) {
      setShown(text.length);
      return undefined;
    }
    setShown(0);
    const stepMs = 40;
    const perStep = Math.max(1, Math.round((charsPerSecond * stepMs) / 1000));
    const id = window.setInterval(() => {
      setShown((n) => {
        if (n >= text.length) {
          window.clearInterval(id);
          return n;
        }
        return Math.min(text.length, n + perStep);
      });
    }, stepMs);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, textKey, charsPerSecond, reducedMotion]);
  return <span style={style}>{text.slice(0, shown)}</span>;
};

/* ------------------------------------------------------------------ */
/* fxForBeat — the configured beat→fx mapping                          */
/* ------------------------------------------------------------------ */

export interface BeatFx {
  /** Letterbox bars over the theater while this beat is on stage. */
  letterbox: boolean;
  /** Edge flash tone (skin key resolved by the caller) — null = no flash. */
  flashTone: string | null;
  /** Which authored string earns the typewriter — 'body' | 'flavor' | null. */
  typewriter: 'body' | 'flavor' | null;
}

const NO_FX: BeatFx = { letterbox: false, flashTone: null, typewriter: null };

/** Pure beat→fx mapping (config-driven, I-2: the sequencer never invents —
 *  it only maps what the engine committed). */
export function fxForBeat(beat: QuestBeat, fx: QuestTheatreFxConfig): BeatFx {
  switch (beat.kind) {
    case 'scene': {
      const box =
        (beat.nodeKind === 'harm' && fx.letterbox.on.harmScene) ||
        (beat.nodeKind === 'combat' && fx.letterbox.on.combatScene);
      return {
        letterbox: fx.letterbox.enabled && box,
        flashTone: null,
        typewriter: fx.typewriter.enabled && fx.typewriter.on.sceneBody && beat.body ? 'body' : null,
      };
    }
    case 'check': {
      const isCombatTurn = beat.check.kills !== undefined;
      return {
        letterbox: fx.letterbox.enabled && isCombatTurn && fx.letterbox.on.combatTurn,
        flashTone: fx.edgeFlash.enabled
          ? (fx.edgeFlash.verdictTones[beat.check.verdict] ?? null)
          : null,
        typewriter:
          fx.typewriter.enabled && fx.typewriter.on.checkFlavor && beat.check.flavor ? 'flavor' : null,
      };
    }
    case 'harm':
      return {
        ...NO_FX,
        letterbox: fx.letterbox.enabled && beat.harm.kind === 'death' && fx.letterbox.on.death,
      };
    case 'end':
      return { ...NO_FX, letterbox: fx.letterbox.enabled && fx.letterbox.on.end };
    default:
      return NO_FX;
  }
}

/* ------------------------------------------------------------------ */
/* Reduced motion helper — one canonical read for fx consumers          */
/* ------------------------------------------------------------------ */

/** Live read of `prefers-reduced-motion`, safe where matchMedia is absent
 *  (jsdom): missing API counts as "no preference". */
export const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Memoised fx for the current beat — stable object while the beat id holds. */
export function useBeatFx(beat: QuestBeat | null, fx: QuestTheatreFxConfig): BeatFx {
  return useMemo(() => (beat ? fxForBeat(beat, fx) : NO_FX), [beat, fx]);
}
