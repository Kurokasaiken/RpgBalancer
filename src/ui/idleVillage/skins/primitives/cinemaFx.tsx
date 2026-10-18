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
/* DamageFloater — the -HP rising over the hit member (T-010)          */
/* ------------------------------------------------------------------ */

export interface DamageFloaterProps {
  /** Beat id — a new key re-fires the rise. */
  floatKey: string;
  /** HP lost — rendered as `-N`. */
  amount: number;
  /** Text/glow colour — caller passes a skin/toned value. */
  color: string;
  durationMs: number;
  risePx: number;
  reducedMotion?: boolean;
}

/** One-shot floater anchored at the top-right of its (relative) parent:
 *  WAAPI so the element's own style resolves even in a frozen tab. */
export const DamageFloater: React.FC<DamageFloaterProps> = ({ floatKey, amount, color, durationMs, risePx, reducedMotion }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el?.animate || reducedMotion) return undefined;
    const anim = el.animate(
      [
        { transform: 'translateY(0)', opacity: 1 },
        { transform: `translateY(-${risePx}px)`, opacity: 0 },
      ],
      { duration: durationMs, easing: 'ease-out', fill: 'forwards' },
    );
    return () => anim.cancel();
  }, [floatKey, durationMs, risePx, reducedMotion]);
  if (reducedMotion) return null;
  return (
    <span
      ref={ref}
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        right: 2,
        fontFamily: 'var(--skin-font-display)',
        fontSize: 13,
        fontVariantNumeric: 'tabular-nums',
        color,
        textShadow: `0 0 6px ${color}`,
        pointerEvents: 'none',
        zIndex: 3,
      }}
    >
      -{amount}
    </span>
  );
};

/**
 * Text variant of `DamageFloater` (PLAN-032 SP-5): same module, same WAAPI
 * lifecycle — a text payload keyed by `floatKey` so a newer event re-fires the
 * rise. Supersede is the caller's job (render the newest key only); floaters
 * never merge or stack.
 */
export const TextFloater: React.FC<{
  /** Event id — a new key re-fires the rise. */
  floatKey: string;
  text: string;
  /** Text/glow colour — caller passes a skin/toned value. */
  color: string;
  durationMs: number;
  risePx: number;
  reducedMotion?: boolean;
}> = ({ floatKey, text, color, durationMs, risePx, reducedMotion }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el?.animate || reducedMotion) return undefined;
    const anim = el.animate(
      [
        { transform: 'translateY(0)', opacity: 1 },
        { transform: `translateY(-${risePx}px)`, opacity: 0 },
      ],
      { duration: durationMs, easing: 'ease-out', fill: 'forwards' },
    );
    return () => anim.cancel();
  }, [floatKey, durationMs, risePx, reducedMotion]);
  if (reducedMotion) return null;
  return (
    <span
      ref={ref}
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        fontFamily: 'var(--skin-font-display)',
        fontSize: 13,
        fontVariantNumeric: 'tabular-nums',
        color,
        textShadow: `0 0 6px ${color}`,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 3,
      }}
    >
      {text}
    </span>
  );
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

/* ==================================================================== */
/* PLAN-043 WS-4 (artifact-r003 §4) — the cinema layer system.           */
/* One primitive per ratified tag; each renders `data-fx` so the         */
/* zero-overlap / timing probes can observe which layers are on stage.   */
/* All primitives honour I-5: reduced motion renders no animation (the   */
/* reveal degrades to a short fade — it is the cut itself).              */
/* ==================================================================== */

/* ------------------------------------------------------------------ */
/* reveal — CenterApertureReveal: the scene opens through an aperture    */
/* ------------------------------------------------------------------ */

export interface CenterApertureRevealProps {
  /** Beat key — re-fires the aperture only when the beat changes. */
  cueKey: string;
  /** Aperture open duration (normal motion). */
  durationMs: number;
  /** Reduced-motion fallback: a plain fade of this length (BV-09). */
  fadeMs: number;
  /** The veil colour — caller passes the lacquer-deep token. */
  color: string;
  reducedMotion?: boolean;
}

/** An opaque veil whose clip-path opens from a thin center slit to full
 *  transparency — the classic aperture cut between scenes. Under reduced
 *  motion the veil simply fades out over `fadeMs`. */
export const CenterApertureReveal: React.FC<CenterApertureRevealProps> = ({
  cueKey,
  durationMs,
  fadeMs,
  color,
  reducedMotion,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el?.animate) return undefined;
    const anim = reducedMotion
      ? el.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: fadeMs,
          easing: 'linear',
          fill: 'forwards',
        })
      : el.animate(
          [
            { clipPath: 'inset(46% 0% 46% 0%)', opacity: 1 },
            { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, offset: 0.55 },
            { clipPath: 'inset(0% 0% 0% 0%)', opacity: 0 },
          ],
          { duration: durationMs, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' },
        );
    return () => anim.cancel();
  }, [cueKey, durationMs, fadeMs, reducedMotion]);
  return (
    <div
      ref={ref}
      data-fx="reveal"
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        background: color,
        pointerEvents: 'none',
        zIndex: 4,
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
/* impact — StageImpactShake: the stage frame jolts on the verdict       */
/* ------------------------------------------------------------------ */

export interface StageImpactShakeProps {
  /** Beat key — re-fires the jolt per beat. */
  cueKey: string;
  active: boolean;
  ampPx: number;
  durationMs: number;
  reducedMotion?: boolean;
  children: React.ReactNode;
}

/** Wraps the stage frame; on each keyed beat with `active` it plays a short
 *  decaying shake (WAAPI, so a frozen tab resolves to the rest pose). */
export const StageImpactShake: React.FC<StageImpactShakeProps> = ({
  cueKey,
  active,
  ampPx,
  durationMs,
  reducedMotion,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el?.animate || !active || reducedMotion) return undefined;
    const a = ampPx;
    const anim = el.animate(
      [
        { transform: 'translate(0,0)' },
        { transform: `translate(${-a}px, ${a * 0.4}px)`, offset: 0.2 },
        { transform: `translate(${a * 0.8}px, ${-a * 0.3}px)`, offset: 0.45 },
        { transform: `translate(${-a * 0.5}px, ${a * 0.2}px)`, offset: 0.7 },
        { transform: 'translate(0,0)' },
      ],
      { duration: durationMs, easing: 'ease-out' },
    );
    return () => anim.cancel();
  }, [cueKey, active, ampPx, durationMs, reducedMotion]);
  /* NOTE: a real box is required — `display:contents` generates none and
   * the WAAPI transform would silently do nothing. */
  return (
    <div ref={ref} data-fx={active && !reducedMotion ? 'impact' : undefined} style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* breath — PreVerdictBreath: a pulse on the frame before the verdict    */
/* ------------------------------------------------------------------ */

export interface PreVerdictBreathProps {
  /** Beat key — the pulse plays once per beat. */
  cueKey: string;
  active: boolean;
  durationMs: number;
  /** When false (BV-14 fallback) the pulse uses an inset-shadow overlay
   *  instead of animating `filter` — engines where the filter costs more
   *  than a frame still read the beat. */
  usesFilter: boolean;
  reducedMotion?: boolean;
  children: React.ReactNode;
}

/** Wraps the theatre; a single saturate/contrast breath while `active`
 *  (pre-verdict tension). `usesFilter:false` swaps the filter animation
 *  for a cheap inset glow — same read, no filter cost. */
export const PreVerdictBreath: React.FC<PreVerdictBreathProps> = ({
  cueKey,
  active,
  durationMs,
  usesFilter,
  reducedMotion,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active || reducedMotion) return undefined;
    const el = ref.current;
    if (usesFilter && el?.animate) {
      const anim = el.animate(
        [
          { filter: 'saturate(1) contrast(1)' },
          { filter: 'saturate(1.25) contrast(1.08)', offset: 0.5 },
          { filter: 'saturate(1) contrast(1)' },
        ],
        { duration: durationMs, easing: 'ease-in-out' },
      );
      return () => anim.cancel();
    }
    const veil = veilRef.current;
    if (!veil?.animate) return undefined;
    const anim = veil.animate([{ opacity: 0 }, { opacity: 0.5, offset: 0.5 }, { opacity: 0 }], {
      duration: durationMs,
      easing: 'ease-in-out',
    });
    return () => anim.cancel();
  }, [cueKey, active, durationMs, usesFilter, reducedMotion]);
  return (
    <div ref={ref} data-fx={active && !reducedMotion ? 'breath' : undefined} style={{ position: 'relative' }}>
      {children}
      {!usesFilter && active && !reducedMotion && (
        <div
          ref={veilRef}
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 26px rgba(255, 238, 200, 0.45)',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* push — KenBurnsDolly: the slow push-in on the scene                   */
/* ------------------------------------------------------------------ */

export interface KenBurnsDollyProps {
  /** Beat key — the dolly restarts per beat. */
  cueKey: string;
  active: boolean;
  scaleTo: number;
  durationMs: number;
  reducedMotion?: boolean;
  children: React.ReactNode;
}

/** Wraps the theatre scene; pushes scale 1 → `scaleTo` over the beat so a
 *  still frame breathes. The element's own style is the end state — a
 *  frozen tab resolves zoomed, never mid-flight. */
export const KenBurnsDolly: React.FC<KenBurnsDollyProps> = ({
  cueKey,
  active,
  scaleTo,
  durationMs,
  reducedMotion,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el?.animate || !active || reducedMotion) return undefined;
    const anim = el.animate([{ transform: 'scale(1)' }, { transform: `scale(${scaleTo})` }], {
      duration: durationMs,
      easing: 'linear',
      fill: 'forwards',
    });
    return () => anim.cancel();
  }, [cueKey, active, scaleTo, durationMs, reducedMotion]);
  /* Transform-only wrapper — no layout role: the child's own sizing (the
   *  theatre's aspect-ratio) still drives the box; the scale overscan is
   *  clipped by the caller's overflow boundary. */
  return (
    <div
      ref={ref}
      data-fx={active && !reducedMotion ? 'push' : undefined}
      style={{
        transformOrigin: '50% 50%',
        transform: active && !reducedMotion ? `scale(${scaleTo})` : undefined,
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        minHeight: 0,
      }}
    >
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* j-cut — JCutStage: the beat's audio leads its visual cut              */
/* ------------------------------------------------------------------ */

export interface JCutStageProps {
  /** Beat key — the lead fires once per beat. */
  cueKey: string;
  active: boolean;
  /** How many ms the audio leads the perceived cut (config). */
  leadMs: number;
  /** Fire the beat's audio cue — called at mount (`leadMs` before the cut
   *  is marked landed). Reduced motion never fires audio. */
  onLead?: () => void;
  reducedMotion?: boolean;
  children: React.ReactNode;
}

/** The J-cut contract: when a tagged beat mounts, its audio fires
 *  immediately — `leadMs` before the cut is marked landed — so the sound of
 *  the incoming moment precedes its image. Exposes `data-audio-state`
 *  (`lead` → `cut`) for the probe; children render throughout. */
export const JCutStage: React.FC<JCutStageProps> = ({
  cueKey,
  active,
  leadMs,
  onLead,
  reducedMotion,
  children,
}) => {
  const [cut, setCut] = useState(false);
  useEffect(() => {
    if (!active) {
      setCut(false);
      return undefined;
    }
    setCut(false);
    if (!reducedMotion) onLead?.();
    const id = window.setTimeout(() => setCut(true), leadMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cueKey, active, leadMs, reducedMotion]);
  return (
    <div
      data-fx={active ? 'j-cut' : undefined}
      data-audio-state={active ? (cut ? 'cut' : 'lead') : undefined}
      style={{ display: 'contents' }}
    >
      {children}
    </div>
  );
};
