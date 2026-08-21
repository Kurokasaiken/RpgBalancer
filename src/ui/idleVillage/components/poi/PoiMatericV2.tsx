/**
 * PoiMatericV2 — the POI marker as an implementation of the shared Material
 * Recipe for a circular silhouette.
 *
 * WHERE THE NUMBERS COME FROM. The material stack is not re-authored: it is
 * WanderlustMedalOverlay's proven L1-L8 stack, inherited *verbatim* inside a
 * single transform group that maps the medal's own 86x86 / r42 space onto this
 * component's 120x120 / r37 space:
 *
 *     translate(60 60) scale(37/42) translate(-43 -43)
 *
 * That is deliberate. Re-typing radii and patina coordinates into a different
 * viewBox is how the first attempt at V2 failed: the blobs landed outside the
 * marker and the body gradient lost its direction. Inheriting the coordinate
 * space costs one <g> and removes the whole class of transcription bugs.
 *
 * WHAT IS NOT INHERITED. Three things are ours, drawn in this component's own
 * space on top of the material:
 *   - the hearth (off-centre inner glow) — the type colour lives here, not in
 *     the alloy, so quest/job/event share one metal and differ by their light;
 *   - the sculpted type glyph, where the medal has a portrait;
 *   - the summoned seal (two staggered glyph bands + cardinal flares), which
 *     hangs in the AIR around the object and is therefore outside its material.
 *
 * PALETTE. `materialPalette` swaps the colour bundle for one of the
 * WanderlustSurface presets (`materialPresets.ts`). It resolves in JS and feeds
 * the same gradients, so there is ONE code path — bronze and quest differ in
 * values, never in layers. It intentionally does NOT reference the global
 * `WanderlustSurfaceDefs` ids: those are authored for rectangles (`bevelEdge`
 * top/left/bottom/right has no meaning on a circle) and resolve against a
 * rectangular object bounding box.
 *
 * Same props as PoiMarker, plus `materialPalette`. Reference page:
 * src/ui/idleVillage/pages/PoiMarkerLabPage.tsx (route /poi-marker-lab)
 */
import React, { CSSProperties, useEffect, useId, useMemo, useState } from 'react';
import type { PoiMarkerProps, PoiType } from './PoiMarker';
import { MATERIAL_PRESETS, type MaterialPreset } from '@/ui/wanderlust-surface/materialPresets';

/** Type colour = the light in the seal and the tint in the stone, never the alloy. */
type Ember = { core: string; light: string; deep: string; patina: string };

const EMBERS: Record<PoiType, Ember> = {
  // Candle-lit honey.
  quest: { core: '#E3A93C', light: '#FFE9B0', deep: '#5E3A0F', patina: '#3A2A10' },
  // Oxidised copper lit from within — patina, not cyan.
  job: { core: '#5FC7A2', light: '#E2F0C6', deep: '#12463A', patina: '#13322C' },
  // Banked forge coal.
  event: { core: '#D64545', light: '#F4B4B4', deep: '#6B1F1F', patina: '#4A1A1A' },
};

const LABELS: Record<PoiType, string> = { quest: 'Quest', job: 'Job', event: 'Event' };

export interface PoiMatericV2Props extends PoiMarkerProps {
  /**
   * Optional colour bundle from the WanderlustSurface preset family. When set
   * it replaces the type-driven ember; the layer geometry is unchanged.
   */
  materialPalette?: MaterialPreset;
}

/* ── Medallion space constants (86x86, centre 43,43, outer r 42) ──────────── */
const MED_C = 43;
const MED_R = 42;
/* ── This component's space (120x120, centre 60,60, body r 37) ───────────── */
const V2_C = 60;
const V2_BODY_R = 37;
/** Maps medallion user space onto ours. */
const MED_SCALE = V2_BODY_R / MED_R;
const MED_TRANSFORM = `translate(${V2_C} ${V2_C}) scale(${MED_SCALE.toFixed(6)}) translate(${-MED_C} ${-MED_C})`;
/** The medal's field (r 30.5) expressed in our space — where the glyph sits. */
const FIELD_R = 30.5 * MED_SCALE;

const SEAL_RADIUS = 50;
const GLYPH_COUNT = 14;

/**
 * Inscription vocabulary — Maou Gakuin-inspired magical script.
 * Flowing, connected strokes with loops, diacritics and ligatures.
 */
const LETTERS: string[] = [
  'M -1.2,-5 L -1.2,5 M -1.2,-1.8 Q 2,-2.8 2,-0.5 Q 2,1.5 -1.2,0.8',
  'M -1.5,-5 L -1.5,5 M -1.5,-2.2 Q 1.5,-2.2 1.5,0.2 Q 1.5,2 -0.8,2.8 M 1.8,3.2 A 0.9 0.9 0 1 1 1.8 4.9 A 0.9 0.9 0 1 1 1.8 3.2',
  'M -3,-5 L -3,5 M 3,-5 L 3,5 M -3,-3 Q 0,-5.2 3,-3',
  'M 0,-2.2 A 2 2 0 1 1 0 1.8 A 2 2 0 1 1 0 -2.2 M -1.6,0.6 Q -2.2,2.8 -2.8,4.5 M 1.6,0.6 Q 2.2,2.8 2.8,4.5',
  'M -2.8,-4.5 Q -0.8,-1.5 1.2,-2.5 Q 3.2,-3.5 2.8,-0.5 Q 2.4,2.5 -1.2,2.5 Q -3.2,2.5 -2.8,4.5',
  'M -0.5,2 L -0.5,5 M 0,-2 A 2.2 2.2 0 1 1 -0.1 -2 M -0.5,1.6 Q -2,0.5 -2,-1.5',
  'M -3,-4.5 L 3,-4.5 M 0,-4.5 L 0,5 M 0,0 Q 2,0.5 2,2.5',
  'M -3,-4 L 3,-4 Q 3.6,0 0,2 Q -3.6,4 -3,0.5 Q -2.6,-2.5 0,-2.5',
  'M -3,-5 Q 0,-1 3,-5 M -3,0 Q 0,3 3,0 M -3,0 L 3,0',
  'M -3,-5 Q 0,-2 3,0 Q 0,2 -3,5',
  'M -2.5,-5 L 2.5,5 M 2.5,-5 L -2.5,5 M -1.2,-2 A 0.8 0.8 0 1 1 -1.2 -0.4 A 0.8 0.8 0 1 1 -1.2 -2',
  'M -2.2,-1.5 L 2.2,-1.5 Q 2.2,3.5 0,3.5 Q -2.2,3.5 -2.2,-1.5 M -1,-4.2 A 0.7 0.7 0 1 1 -1 -2.8 A 0.7 0.7 0 1 1 -1 -4.2 M 1,-4.2 A 0.7 0.7 0 1 1 1 -2.8 A 0.7 0.7 0 1 1 1 -4.2',
];

/** Outer band is a continuous ring of 100 letters, one per percent. */
const LETTER_COUNT = 100;

const GLYPHS = [
  'M0 -3.6 L0 3.6 M0 -1.2 L2.2 -3.4 M0 -1.2 L-2.2 -3.4',
  'M-1.8 3.6 L-1.8 -3.6 L2 -1.2 L-1.8 0.9',
  'M-2 3.6 L0 -3.6 L2 3.6 M-1.2 0.9 L1.2 0.9',
  'M-2 -3.6 L2 3.6 M2 -3.6 L-2 3.6',
  'M-1.9 3.6 L-1.9 -3.6 L0 -0.5 L1.9 -3.6 L1.9 3.6',
  'M0 -3.6 L0 3.6 M0 0 L2.2 -2.2 M0 0 L2.2 2.2',
  'M-2 -3.6 L2 -3.6 M0 -3.6 L0 3.6',
  'M-1.8 -3.6 L1.8 -1.6 L-1.8 0.5 L1.8 2.5 L-1.8 3.6',
  'M0 -3.4 A3.4 3.4 0 1 1 -0.1 -3.4 M0 -1 L0 3',
  'M-2 0 L0 -3.4 L2 0 L0 3.4 Z',
];

/** Four-point flare, like the cardinal sparks on the reference seals. */
const FLARE = 'M0 -9 Q0.9 -1.4 8 0 Q0.9 1.4 0 9 Q-0.9 1.4 -8 0 Q-0.9 -1.4 0 -9 Z';

function clamp(v: number) {
  return Math.max(0, Math.min(1, v));
}

/** Arc starting at 12 o'clock; direction-aware. */
function arcPath(cx: number, cy: number, r: number, progress: number, ccw: boolean) {
  const p = clamp(progress);
  if (p <= 0.0001) return '';
  if (p >= 0.9999) {
    const sweep = ccw ? 0 : 1;
    return [
      `M ${cx} ${cy - r}`,
      `A ${r} ${r} 0 1 ${sweep} ${cx} ${cy + r}`,
      `A ${r} ${r} 0 1 ${sweep} ${cx} ${cy - r}`,
    ].join(' ');
  }
  const start = -Math.PI / 2;
  const delta = (Math.PI * 2 - 0.0001) * p * (ccw ? -1 : 1);
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(start + delta);
  const y2 = cy + r * Math.sin(start + delta);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${p > 0.5 ? 1 : 0} ${ccw ? 0 : 1} ${x2} ${y2}`;
}

/** One heraldic arm, repeated by rotation into a cross fleury. */
const CROSS_ARM =
  'M-3 -5 L-3 -17 L-6.4 -21 L-3.4 -22.2 L0 -18.4 L3.4 -22.2 L6.4 -21 L3 -17 L3 -5 Z';

function burstStarPath(points: number, rOuter: number, rInner: number) {
  const step = Math.PI / points;
  const parts: string[] = [];
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = -Math.PI / 2 + i * step;
    parts.push(`${i === 0 ? 'M' : 'L'} ${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`);
  }
  return `${parts.join(' ')} Z`;
}

const BURST = burstStarPath(8, 20, 6.5);

/** Type glyph as a filled shape, centred on the origin. */
function glyphFor(type: PoiType) {
  if (type === 'quest') {
    return (
      <>
        {[0, 90, 180, 270].map((a) => (
          <path key={a} d={CROSS_ARM} transform={`rotate(${a})`} />
        ))}
        <circle cx="0" cy="0" r="4" />
      </>
    );
  }
  if (type === 'job') {
    // Anvil: reads as "work available here" and survives down to 32px.
    return (
      <>
        <path d="M-19 -13 L19 -13 L19 -7.5 L10 -7.5 L6.5 -1 L10 3.5 L10 7 L-10 7 L-10 3.5 L-6.5 -1 L-15.5 -7.5 L-19 -7.5 Z" />
        <path d="M-11.5 7 L11.5 7 L14.5 14 L-14.5 14 Z" />
      </>
    );
  }
  return (
    <>
      <path d={BURST} />
      <circle cx="0" cy="0" r="3.2" />
    </>
  );
}

/**
 * Resolve the colour bundle. A WanderlustSurface preset wins over the type,
 * but either way the result is the same four roles feeding the same gradients.
 */
function resolveEmber(type: PoiType, materialPalette?: MaterialPreset): Ember {
  const preset = materialPalette ? MATERIAL_PRESETS[materialPalette] : undefined;
  if (!preset) return EMBERS[type];
  return {
    core: `rgb(${preset.specularRGB})`,
    light: `rgb(${preset.rimBrightRGB})`,
    deep: preset.fieldFill,
    patina: preset.insetFill,
  };
}

export const PoiMatericV2: React.FC<PoiMatericV2Props> = ({
  type,
  state = 'available',
  progress = 1,
  durationMs,
  autoStart = true,
  onExpire,
  timerDirection = 'counterclockwise',
  importance = 'normal',
  size = 112,
  disabled = false,
  className = '',
  style,
  onClick,
  onPointerEnter,
  onPointerLeave,
  materialPalette,
}) => {
  const reactId = useId();
  const id = `poiv2-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const ember = resolveEmber(type, materialPalette);

  const [currentProgress, setCurrentProgress] = useState(clamp(progress));
  const [rimProgress, setRimProgress] = useState(0);
  const [isRimHovered, setIsRimHovered] = useState(false);

  useEffect(() => {
    setCurrentProgress(clamp(progress));
  }, [progress]);

  // One clockwise pass over the medallion rim glyphs, starting at 12 o'clock.
  useEffect(() => {
    if (!isRimHovered) {
      setRimProgress(0);
      return;
    }
    const start = performance.now();
    const duration = 1600;
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min(1, (now - start) / duration);
      setRimProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isRimHovered]);

  useEffect(() => {
    if (!autoStart || !durationMs) return;
    if (state !== 'assigned' && state !== 'expiring') return;

    const startedAt = performance.now();
    const initial = clamp(progress);
    let frame = 0;

    const tick = (now: number) => {
      const next = clamp(initial - (now - startedAt) / durationMs);
      setCurrentProgress(next);
      if (next <= 0) {
        cancelAnimationFrame(frame);
        onExpire?.();
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // A new countdown starts only when the duration or the state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, durationMs, state]);

  const isExpired =
    state === 'expired' || (state !== 'available' && state !== 'new' && currentProgress <= 0);
  const ccw = timerDirection === 'counterclockwise';
  const sealProgress = isExpired ? 0 : state === 'available' || state === 'new' ? 1 : currentProgress;

  const letterStep = 360 / LETTER_COUNT;
  const outerRingRadius = 54;
  const innerRingRadius = 45;
  const upperBandRadius = 51.5;
  const lowerBandRadius = 47.5;

  function ringSegmentPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }

  const outerBand = useMemo(() => {
    const litCount = Math.floor(sealProgress * LETTER_COUNT);
    const stepRad = (letterStep * Math.PI) / 180;
    const halfStep = stepRad / 2;
    let letterCursor = 0;
    return Array.from({ length: LETTER_COUNT }, (_, i) => {
      const a = -90 + i * letterStep;
      const rad = (a * Math.PI) / 180;
      const lit = i < litCount ? 1 : 0;
      const d = LETTERS[letterCursor++ % LETTERS.length];
      return {
        d,
        a,
        lit,
        x: V2_C + upperBandRadius * Math.cos(rad),
        y: V2_C + upperBandRadius * Math.sin(rad),
        outerD: ringSegmentPath(V2_C, V2_C, outerRingRadius, rad - halfStep, rad + halfStep),
        innerD: ringSegmentPath(V2_C, V2_C, innerRingRadius, rad - halfStep, rad + halfStep),
      };
    }).filter((g) => g.lit > 0.001);
  }, [sealProgress]);

  // Lower strip: same letters, half a step ahead (staggered).
  const lowerBand = useMemo(() => {
    const litCount = Math.floor(sealProgress * LETTER_COUNT);
    let letterCursor = 0;
    return Array.from({ length: LETTER_COUNT }, (_, i) => {
      const a = -90 + (i + 0.5) * letterStep;
      const rad = (a * Math.PI) / 180;
      const lit = i < litCount ? 1 : 0;
      const d = LETTERS[letterCursor++ % LETTERS.length];
      return {
        d,
        a,
        lit,
        x: V2_C + lowerBandRadius * Math.cos(rad),
        y: V2_C + lowerBandRadius * Math.sin(rad),
      };
    }).filter((g) => g.lit > 0.001);
  }, [sealProgress]);

  // Medallion rim script — lights up under the cursor.
  const RIM_LETTER_COUNT = 24;
  const rimBand = useMemo(() => {
    const rimStep = 360 / RIM_LETTER_COUNT;
    const rimRadius = 33.5 * MED_SCALE;
    const t = isRimHovered ? rimProgress * RIM_LETTER_COUNT : -2 * RIM_LETTER_COUNT;
    let letterCursor = 0;
    return Array.from({ length: RIM_LETTER_COUNT }, (_, i) => {
      const a = -90 + i * rimStep;
      const rad = (a * Math.PI) / 180;
      const d = LETTERS[letterCursor++ % LETTERS.length];
      const lit = clamp(1.5 - 2 * Math.abs(i - t));
      return {
        d,
        a,
        lit,
        x: V2_C + rimRadius * Math.cos(rad),
        y: V2_C + rimRadius * Math.sin(rad),
      };
    });
  }, [rimProgress, isRimHovered]);

  // Four cardinal starbursts that grow stronger as the ring reaches them.
  const cardinals = useMemo(() => {
    const flareRadius = 54;
    return [
      { x: V2_C, y: V2_C - flareRadius, lit: clamp(sealProgress * 4) },
      { x: V2_C + flareRadius, y: V2_C, lit: clamp((sealProgress - 0.25) * 4) },
      { x: V2_C, y: V2_C + flareRadius, lit: clamp((sealProgress - 0.5) * 4) },
      { x: V2_C - flareRadius, y: V2_C, lit: clamp((sealProgress - 0.75) * 4) },
    ];
  }, [sealProgress]);

  const cssVars = {
    '--poiv2-core': ember.core,
    '--poiv2-light': ember.light,
    '--poiv2-deep': ember.deep,
    '--poiv2-size': `${size}px`,
  } as CSSProperties;

  return (
    <button
      type="button"
      aria-label={`${LABELS[type]} ${isExpired ? 'expired' : 'available'}`}
      className={[
        'poiv2',
        `poiv2--${type}`,
        `poiv2--${state}`,
        importance !== 'normal' ? `poiv2--${importance}` : '',
        disabled ? 'poiv2--disabled' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...cssVars, ...style }}
      onClick={onClick}
      onPointerEnter={(e) => {
        setIsRimHovered(true);
        onPointerEnter?.(e);
      }}
      onPointerLeave={(e) => {
        setIsRimHovered(false);
        onPointerLeave?.(e);
      }}
      disabled={disabled}
    >
      <svg className="poiv2__svg" viewBox="0 0 120 120" role="img" aria-hidden="true">
        <defs>
          {/* ── L1 Body. Distribution inherited from the medal: the gold is a
              sliver on the top-left EDGE and the object is near-black from 52%
              outward. Inverting this (a bright centre) is what washed V2 out on
              the first attempt. Direction, not just colour, carries the metal. */}
          <linearGradient id={`${id}-body`} x1="14%" y1="4%" x2="86%" y2="96%">
            <stop offset="0%" stopColor="#f0cf6a" />
            <stop offset="9%" stopColor="#dfb857" />
            <stop offset="28%" stopColor="#8a5a20" />
            <stop offset="52%" stopColor="#060f16" />
            <stop offset="76%" stopColor="#060f16" />
            <stop offset="100%" stopColor="#060f16" />
          </linearGradient>

          {/* L3 Bevel: lit plane / shadow plane along the extrusion diagonal. */}
          <linearGradient id={`${id}-bevel`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,240,165,.30)" />
            <stop offset="22%" stopColor="rgba(255,225,135,.09)" />
            <stop offset="58%" stopColor="rgba(255,210,100,.02)" />
            <stop offset="100%" stopColor="rgba(0,0,0,.62)" />
          </linearGradient>

          {/* L5 Inner ring, same alloy, one notch darker. */}
          <linearGradient id={`${id}-ring`} x1="12%" y1="8%" x2="88%" y2="92%">
            <stop offset="0%" stopColor="#f0cf6a" />
            <stop offset="16%" stopColor="#dfb857" />
            <stop offset="46%" stopColor="#8a5a20" />
            <stop offset="80%" stopColor="#060f16" />
            <stop offset="100%" stopColor="#060f16" />
          </linearGradient>

          {/* L6 Field: the recess. Type colour enters only as a tint at the
              centre — the stone is near-black, like the medal's. */}
          <radialGradient id={`${id}-field`} cx="44%" cy="39%" r="70%">
            <stop offset="0%" stopColor={ember.patina} />
            <stop offset="38%" stopColor="#060f16" />
            <stop offset="72%" stopColor="#060f16" />
            <stop offset="100%" stopColor="#050a0d" />
          </radialGradient>

          {/* L7 Specular: soft top-left hotspot, coherent with the rim. */}
          <radialGradient id={`${id}-specular`} cx="26%" cy="20%" r="56%">
            <stop offset="0%" stopColor="rgba(255,245,200,.22)" />
            <stop offset="42%" stopColor="rgba(255,232,168,.05)" />
            <stop offset="100%" stopColor="rgba(255,220,140,0)" />
          </radialGradient>

          {/* Hearth: OUR layer. A fire inside a volume, so the focus is
              off-centre; a centred one reads as an emissive disc glued on top. */}
          <radialGradient id={`${id}-hearth`} cx="45%" cy="42%" r="74%">
            <stop offset="0%" stopColor={ember.light} stopOpacity="0.55" />
            <stop offset="30%" stopColor={ember.core} stopOpacity="0.34" />
            <stop offset="65%" stopColor={ember.core} stopOpacity="0.14" />
            <stop offset="100%" stopColor={ember.core} stopOpacity="0" />
          </radialGradient>

          {/* Field vignette: darkens the stone's edge into the groove. */}
          <radialGradient id={`${id}-vignette`} cx="50%" cy="44%" r="54%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="48%" stopColor="rgba(0,0,0,.12)" />
            <stop offset="100%" stopColor="rgba(0,0,0,.72)" />
          </radialGradient>

          {/* Glass dome over the field — the shape-specific layer that sits
              ABOVE the recipe on a curved object. */}
          <radialGradient id={`${id}-glass`} cx="50%" cy="48%" r="52%">
            <stop offset="0%" stopColor="rgba(220,235,255,0)" />
            <stop offset="60%" stopColor="rgba(200,220,255,.028)" />
            <stop offset="100%" stopColor="rgba(180,210,255,.065)" />
          </radialGradient>
          <radialGradient id={`${id}-glass-hl`} cx="28%" cy="22%" r="38%">
            <stop offset="0%" stopColor="rgba(255,255,255,.26)" />
            <stop offset="35%" stopColor="rgba(255,255,255,.08)" />
            <stop offset="70%" stopColor="rgba(255,255,255,.02)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Hover glint: a narrow band of light, transparent at both ends.
              Rotated a full turn on pointer-enter and composited in
              color-dodge, so where it crosses the gold the gold blows out
              instead of being merely lightened. Same recipe as the POIs on
              /minimal-poi (GenericPoiSkin). */}
          <linearGradient id={`${id}-glint`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="65%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* Glyph relief: the type colour as struck metal. */}
          <linearGradient id={`${id}-relief`} x1="22%" y1="0%" x2="72%" y2="100%">
            <stop offset="0%" stopColor={ember.light} />
            <stop offset="40%" stopColor={ember.core} />
            <stop offset="100%" stopColor={ember.deep} />
          </linearGradient>

          {/* ── L2 Micro-texture: coarse for the metal, fine for the stone. */}
          <filter id={`${id}-nm`} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.52" numOctaves={4} seed="3" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 .020  0 0 0 0 .030  0 0 0 0 .040  0 0 0 .25 0" result="c" />
            <feBlend in="SourceGraphic" in2="c" mode="overlay" />
          </filter>
          <filter id={`${id}-fs`} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.90" numOctaves={5} seed="11" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 .020  0 0 0 0 .030  0 0 0 0 .040  0 0 0 .18 0" result="c" />
            <feBlend in="SourceGraphic" in2="c" mode="overlay" />
          </filter>

          {/* Bevel warp — keeps the lit plane from reading as a clean sweep. */}
          <filter id={`${id}-dp`} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="turbulence" baseFrequency="0.030" numOctaves={3} seed="7" result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          {/* L8 Patina warp — makes the oxidation blobs irregular. */}
          <filter id={`${id}-patina`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves={3} seed="42" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          {/* Rim bloom on the lit arc. */}
          <filter id={`${id}-gl`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Airborne light for the seal: a tight blur plus a separately-tinted
              wide halo, so the halo takes the ember colour instead of
              bleaching toward white. */}
          <filter id={`${id}-seal-glow`} x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.0" result="blurTight" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="7.5" result="blurWide" />
            <feFlood floodColor={ember.core} result="warmFlood" />
            <feComposite in="warmFlood" in2="blurWide" operator="in" result="warmHalo" />
            <feComponentTransfer in="warmHalo" result="warmHaloSoft">
              <feFuncA type="linear" slope="0.75" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="warmHaloSoft" />
              <feMergeNode in="blurTight" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Unlit rim script sits INSIDE the metal. */}
          <filter id={`${id}-engrave`} x="-40%" y="-40%" width="180%" height="180%">
            <feOffset in="SourceAlpha" dx="0" dy="0.7" result="off" />
            <feGaussianBlur in="off" stdDeviation="0.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id={`${id}-drop`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4.2" />
          </filter>

          {/* Clip in MEDALLION space: everything in the material group is
              bounded by the object, so patina and wear can never paint on the
              map. Its absence was the stray blob outside the first V2. */}
          <clipPath id={`${id}-clip`}>
            <circle cx={MED_C} cy={MED_C} r={MED_R} />
          </clipPath>
        </defs>

        {/* Contact shadow: what stops it floating above the map. */}
        <ellipse cx={V2_C} cy="103" rx="24" ry="4.4" fill="#000" opacity="0.5" filter={`url(#${id}-drop)`} />

        {/* ── The summoned circle, hanging in the air ────────────────────────
            Two staggered rows of 100 glyphs, ring segments, and four cardinal
            starbursts — all wrapped in a warm, mystical glow. */}
        {sealProgress > 0.001 && (
          <g className="poiv2__seal" filter={`url(#${id}-seal-glow)`}>
            {outerBand.map((g, i) => (
              <g key={`s-${i}`}>
                <path d={g.outerD} fill="none" stroke={ember.light} strokeWidth="2.4" strokeLinecap="butt" vectorEffect="non-scaling-stroke" />
                <path d={g.innerD} fill="none" stroke={ember.light} strokeWidth="2.4" strokeLinecap="butt" vectorEffect="non-scaling-stroke" />
              </g>
            ))}
            {outerBand.map((g, i) => (
              <g key={`u-${i}`} transform={`translate(${g.x.toFixed(2)} ${g.y.toFixed(2)}) rotate(${g.a})`}>
                <g transform="scale(0.28)">
                  <path d={g.d} fill="none" stroke={ember.light} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                </g>
              </g>
            ))}
            {lowerBand.map((g, i) => (
              <g key={`o-${i}`} transform={`translate(${g.x.toFixed(2)} ${g.y.toFixed(2)}) rotate(${g.a})`}>
                <g transform="scale(0.28)">
                  <path d={g.d} fill="none" stroke={ember.light} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                </g>
              </g>
            ))}
            {cardinals.map((c, i) => (
              <g key={`c-${i}`} transform={`translate(${c.x} ${c.y}) scale(0.7)`} opacity={c.lit}>
                <path d={FLARE} fill={ember.light} />
              </g>
            ))}
          </g>
        )}

        {/* ══ THE PHYSICAL MEDALLION ═════════════════════════════════════════
            Everything below is in MEDALLION user space (centre 43,43, r 42),
            mapped into ours by MED_TRANSFORM. Radii and coordinates are the
            medal's own numbers — do not "simplify" them into this component's
            space, that is exactly the transcription that broke V2 v1. */}
        <g transform={MED_TRANSFORM} className="poiv2__material">
          <g clipPath={`url(#${id}-clip)`}>
            {/* L1 Body + L2 micro-texture + L3 bevel */}
            <circle cx={MED_C} cy={MED_C} r={MED_R} fill="#060f16" />
            <circle cx={MED_C} cy={MED_C} r={MED_R} fill={`url(#${id}-body)`} filter={`url(#${id}-nm)`} opacity=".90" className="poiv2__body" />
            <circle cx={MED_C} cy={MED_C} r={MED_R} fill={`url(#${id}-bevel)`} filter={`url(#${id}-dp)`} opacity=".48" />

            {/* L4 Rim: a warm arc of light on the top-left only — this is what
                DEFINES the light. Wide + faint = diffusion, thin + strong = edge. */}
            <circle cx={MED_C} cy={MED_C} r="40.5" fill="none" stroke="rgba(240,207,106,.26)" strokeWidth="3.5"
              strokeDasharray="108 148" strokeDashoffset="72" strokeLinecap="round" filter={`url(#${id}-gl)`} />
            <circle cx={MED_C} cy={MED_C} r="41" fill="none" stroke="rgba(240,207,106,.68)" strokeWidth=".9"
              strokeDasharray="76 178" strokeDashoffset="82" strokeLinecap="round" />
            {/* Bounce light on the lower-right rim. The key arc lights the
                upper-left; without a faint counterweight the object has a lit
                side and a missing side, and the eye places its centre in the
                lit half. This is fill, not a second key: it stays under .18. */}
            <circle cx={MED_C} cy={MED_C} r="41" fill="none" stroke="rgba(240,207,106,.17)" strokeWidth="1.6"
              strokeDasharray="52 206" strokeDashoffset="-6" strokeLinecap="round" />

            {/* L5 Inner ring + groove, in LETTERPRESS POLARITY.
                Not a dark ring all the way round: a hard dark crease on the
                TOP-inside edge and a lit warm lip on the BOTTOM-inside edge.
                That is what makes a recess read as cut rather than drawn, and
                on a near-black floor the lit lip is the only cue with any
                contrast headroom — a shadow there has ~1.09:1 to give and dies.
                It is also the only layer putting light BELOW the centre, which
                is what stops the whole object reading as top-heavy. */}
            <circle cx={MED_C} cy={MED_C} r="34" fill="#060f16" />
            <circle cx={MED_C} cy={MED_C} r="34" fill={`url(#${id}-ring)`} filter={`url(#${id}-nm)`} opacity=".68" />
            {/* dark crease — upper half only, offset by a fraction for the cut */}
            <circle cx={MED_C} cy={MED_C} r="34" fill="none" stroke="rgba(0,0,0,.78)" strokeWidth="2.2"
              strokeDasharray="106.8 106.8" strokeDashoffset="-106.8" transform="translate(.3,.35)" />
            {/* lit lip — lower half, the cut edge catching light */}
            <circle cx={MED_C} cy={MED_C} r="33.2" fill="none" stroke="rgba(240,207,106,.52)" strokeWidth="1.1"
              strokeDasharray="104.3 104.3" strokeDashoffset="0" strokeLinecap="round" />
            <circle cx={MED_C} cy={MED_C} r="33.4" fill="none" stroke="rgba(240,207,106,.14)" strokeWidth=".8" />

            {/* Rim script, in the metal until the cursor lights it. */}
            <g className="poiv2__rim">
              {rimBand.map((g, i) => (
                <g key={`r-${i}`}
                  transform={`translate(${((g.x - V2_C) / MED_SCALE + MED_C).toFixed(2)} ${((g.y - V2_C) / MED_SCALE + MED_C).toFixed(2)}) rotate(${g.a})`}
                  opacity={0.7 + 0.3 * g.lit}
                  filter={g.lit > 0 ? `url(#${id}-seal-glow)` : `url(#${id}-engrave)`}
                >
                  <g transform="scale(0.62)">
                    <path d={g.d} fill="none" stroke={g.lit > 0 ? ember.light : '#4A3B22'}
                      strokeWidth={2.1 + 1.1 * g.lit} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  </g>
                </g>
              ))}
            </g>

            {/* L6 Field: the excavated stone. */}
            <circle cx={MED_C} cy={MED_C} r="30.5" fill={`url(#${id}-field)`} />
            <circle cx={MED_C} cy={MED_C} r="30.5" fill={`url(#${id}-field)`} filter={`url(#${id}-fs)`} opacity=".56" />

            {/* Faceted stone: apex off-centre so the facets don't converge into
                a solid black point directly under the hearth. */}
            <g fill="#000" opacity="0.20">
              {Array.from({ length: 7 }, (_, i) => {
                const a = -Math.PI / 2 + (i * Math.PI * 2) / 7;
                const b = a + 0.72;
                const r0 = 7;
                const r1 = 30;
                const r2 = 12 + (i % 3) * 4;
                return (
                  <path key={i} d={`M ${MED_C + r0 * Math.cos(a)} ${MED_C + r0 * Math.sin(a)} L ${MED_C + r1 * Math.cos(a)} ${MED_C + r1 * Math.sin(a)} L ${MED_C + r2 * Math.cos(b)} ${MED_C + r2 * Math.sin(b)} Z`} />
                );
              })}
            </g>

            {/* L7 Specular on the field. */}
            <circle cx={MED_C} cy={MED_C} r="30.5" fill={`url(#${id}-specular)`} />

            {/* L8 Patina — the object's story. Medal coordinates, kept verbatim
                and clipped, so they land on the metal instead of the map. */}
            <circle cx="16" cy="22" r="5.5" fill="rgba(34,18,8,.40)" filter={`url(#${id}-patina)`} />
            <circle cx="13" cy="25" r="3.2" fill="rgba(28,14,6,.32)" filter={`url(#${id}-patina)`} />
            <circle cx="11" cy="32" r="2.5" fill="rgba(26,12,5,.28)" filter={`url(#${id}-patina)`} />
            <circle cx="71" cy="22" r="5" fill="rgba(32,16,8,.36)" filter={`url(#${id}-patina)`} />
            <circle cx="69" cy="19" r="2.8" fill="rgba(28,14,6,.30)" filter={`url(#${id}-patina)`} />
            <circle cx="75" cy="30" r="2" fill="rgba(26,12,5,.24)" filter={`url(#${id}-patina)`} />
            <circle cx="21" cy="67" r="4.2" fill="rgba(32,16,8,.34)" filter={`url(#${id}-patina)`} />
            <circle cx="67" cy="65" r="3.5" fill="rgba(28,14,6,.30)" filter={`url(#${id}-patina)`} />
            <circle cx="43" cy="7" r="3" fill="rgba(36,20,8,.22)" filter={`url(#${id}-patina)`} />

            {/* L9 Wear — the object's history. */}
            <line x1="9" y1="46" x2="16" y2="54" stroke="rgba(0,0,0,.44)" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="72" y1="50" x2="79" y2="58" stroke="rgba(0,0,0,.36)" strokeWidth="1" strokeLinecap="round" />
            <line x1="26" y1="76" x2="34" y2="80" stroke="rgba(0,0,0,.32)" strokeWidth=".9" strokeLinecap="round" />
            <line x1="54" y1="75" x2="61" y2="79" stroke="rgba(0,0,0,.28)" strokeWidth=".8" strokeLinecap="round" />
            <path d="M4,44 C3.0,47.5 3.4,51 4,54" fill="none" stroke="rgba(0,0,0,.50)" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M82,38 C83.0,41.5 82.6,45 82,48" fill="none" stroke="rgba(0,0,0,.40)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7" y1="28" x2="13" y2="36" stroke="rgba(72,92,52,.20)" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="75" y1="56" x2="81" y2="63" stroke="rgba(72,92,52,.16)" strokeWidth="1.1" strokeLinecap="round" />

            {/* L10 AO — Uniform Contact Occlusion. No dasharray: AO is neither
                light nor gravity, so it must not favour a side. (The medal's
                bottom-heavy arc is its glass meniscus, a shape-specific
                artifact, explicitly NOT a precedent for a directional AO.) */}
            <circle cx={MED_C} cy={MED_C} r="30.5" fill="none" stroke="rgba(0,0,0,.52)" strokeWidth="4" />
          </g>
        </g>

        {/* ══ OUR LAYERS, in this component's space ═══════════════════════════ */}

        {/* Hover glint: one full turn around the metal, then gone. The return
            to 0deg is deliberately instant (`transform 0s` when not hovered) —
            animating it backwards reads as the light retracing its steps,
            which no real highlight does. */}
        <g className="poiv2__glint">
          <circle cx={V2_C} cy={V2_C} r="33.5" fill="none" stroke={`url(#${id}-glint)`} strokeWidth="3.2" />
        </g>

        {/* Hearth: the type's light, burning inside the stone. */}
        <circle cx={V2_C} cy={V2_C} r={FIELD_R} fill={`url(#${id}-hearth)`} className="poiv2__hearth" />

        {/* Sculpted glyph: four stacked layers give the icon its own mass. */}
        <g transform={`translate(${V2_C} ${V2_C}) scale(1.15)`} className="poiv2__emblem">
          <g fill="#100804" stroke="#070402" strokeWidth="1.3" strokeLinejoin="round" transform="translate(1.35 1.65)">
            {glyphFor(type)}
          </g>
          <g fill={ember.deep} stroke="#2A1607" strokeWidth="1.1" strokeLinejoin="round" transform="translate(0.55 0.7)">
            {glyphFor(type)}
          </g>
          <g fill={`url(#${id}-relief)`} stroke={ember.deep} strokeWidth="0.95" strokeLinejoin="round">
            {glyphFor(type)}
          </g>
          <g fill="none" stroke="#FFE7A2" strokeWidth="0.7" strokeLinejoin="round" opacity="0.42" transform="translate(-0.38 -0.52)">
            {glyphFor(type)}
          </g>
        </g>

        {/* Glass dome + field vignette: the curved-object layer above the recipe. */}
        <circle cx={V2_C} cy={V2_C} r={FIELD_R} fill={`url(#${id}-vignette)`} />
        <circle cx={V2_C} cy={V2_C} r={FIELD_R} fill={`url(#${id}-glass)`} />
        <circle cx={V2_C} cy={V2_C} r={FIELD_R} fill={`url(#${id}-glass-hl)`} />
        <circle cx={V2_C} cy={V2_C} r={FIELD_R - 0.3} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth=".6"
          strokeDasharray="52 116" strokeDashoffset="56" strokeLinecap="round" />
      </svg>
    </button>
  );
};

/** Component-scoped material. Any theming still belongs in skinConfigRegistry. */
export const poiMatericV2Styles = `
.poiv2 {
  --poiv2-size: 112px;
  position: relative;
  display: inline-flex;
  width: var(--poiv2-size);
  height: var(--poiv2-size);
  padding: 0; margin: 0; border: 0;
  background: transparent;
  appearance: none;
  cursor: pointer;
  touch-action: manipulation;
  isolation: isolate;
  transition: transform 180ms ease;
}
.poiv2:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--poiv2-light); border-radius: 50%; }
/* Lift + overall gain, same pair as the /minimal-poi POIs. The brightness is
   what makes the glint land on an already-hotter object. */
.poiv2:hover:not(:disabled) { transform: scale(1.05); filter: brightness(1.15); }
.poiv2:active:not(:disabled) { transform: scale(.985); }
.poiv2 { transition: transform 180ms ease, filter 300ms ease; }

.poiv2__svg { width: 100%; height: 100%; overflow: visible; }

/* Hover glint — one full turn of the rim on enter, instant reset on leave.
   Driven by :hover rather than React state so it cannot desync from the
   pointer. The asymmetric transition is the point: 0.8s out, 0s back, because
   a highlight that retraces its path backwards reads as a rewind. */
.poiv2__glint {
  opacity: 0;
  mix-blend-mode: color-dodge;
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center;
  transition: opacity .3s ease-in-out;
}
/* A keyframe, NOT a transition. rotate(0deg) and rotate(360deg) both resolve
   to the identity matrix, so a transition between them has equal start and end
   and can collapse to no motion at all — verified here, it did. A keyframe
   interpolates the rotate() function itself, so the full turn always plays.
   Dropping the animation on pointer-leave also gives the instant reset for
   free: a highlight that retraced its path backwards would read as a rewind. */
.poiv2:hover:not(:disabled) .poiv2__glint {
  opacity: .95;
  animation: poiv2-glint-sweep .8s ease-out;
}
@keyframes poiv2-glint-sweep {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.poiv2__material { transform-origin: 60px 60px; }
.poiv2__body { transform-origin: 43px 43px; animation: poiv2-breathe 8s ease-in-out infinite; }
.poiv2__seal { transform-origin: 60px 60px; }

.poiv2--new .poiv2__material { animation: poiv2-arrive 720ms cubic-bezier(.2,.9,.2,1) both; }
.poiv2--new .poiv2__seal { animation: poiv2-summon 900ms ease-out both; }

.poiv2--disabled, .poiv2--expired { cursor: default; filter: saturate(.55) brightness(.8); }

@keyframes poiv2-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.008); } }
@keyframes poiv2-arrive { 0% { opacity: 0; } 100% { opacity: 1; } }
@keyframes poiv2-summon { 0% { opacity: 0; } 100% { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .poiv2, .poiv2 * { animation: none !important; transition: none !important; }
}
`;

export default PoiMatericV2;
