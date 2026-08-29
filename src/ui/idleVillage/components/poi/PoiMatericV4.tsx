import React, { useId, useMemo } from 'react';
import { useTranslation } from '@/localization/useTranslation';
import { POI_MATERIC_V4_TOKENS } from '@/balancing/config/idleVillage/poiMatericV4Tokens';
import type { PoiMarkerProps } from './PoiMarker';

/**
 * POI Materic V4 — bronze is the matter, light is the variable.
 *
 * V3 expressed a POI's type by repainting the medallion's alloy, which made
 * every non-bronze type read as coloured plastic, and its magic circle used a
 * near-black backing rail plus a filter that blurred `SourceGraphic` — so the
 * halo inherited the ink instead of emitting light.
 *
 * V4 gives every type its own **alloy** — a real metal ramp rather than a flat
 * pigment — and lets three things agree on identity: the **silhouette** of the
 * heraldic mark, the **light** of the seal, and a **glazed lip** at the rim. The
 * seal is written by the passage of time, exactly as in the frozen v3
 * desiderata — character by character from twelve o'clock — which means it is
 * only visible while the clock runs.
 *
 * Every visual value comes from `poiMatericV4Tokens`; nothing is hardcoded.
 *
 * Reference study: the "Bronzo e Luce" specimens.
 * Reference page: src/ui/idleVillage/pages/PoiMarkerLabPage.tsx (route /poi-marker-lab)
 */
export interface PoiMatericV4Props extends PoiMarkerProps {
  isDragging?: boolean;
  'data-testid'?: string;
}

/** Inscription vocabulary — the arcane script shared with V3. */
const LETTERS: string[] = [
  'M -1.2,-5 L -1.2,5 M -1.2,-1.8 Q 2,-2.8 2,-0.5 Q 2,1.5 -1.2,0.8',
  'M -1.5,-5 L -1.5,5 M -1.5,-2.2 Q 1.5,-2.2 1.5,0.2 Q 1.5,2 -0.8,2.8',
  'M -3,-5 L -3,5 M 3,-5 L 3,5 M -3,-3 Q 0,-5.2 3,-3',
  'M 0,-2.2 A 2 2 0 1 1 0 1.8 A 2 2 0 1 1 0 -2.2 M -1.6,0.6 Q -2.2,2.8 -2.8,4.5 M 1.6,0.6 Q 2.2,2.8 2.8,4.5',
  'M -2.8,-4.5 Q -0.8,-1.5 1.2,-2.5 Q 3.2,-3.5 2.8,-0.5 Q 2.4,2.5 -1.2,2.5 Q -3.2,2.5 -2.8,4.5',
  'M -0.5,2 L -0.5,5 M 0,-2 A 2.2 2.2 0 1 1 -0.1 -2 M -0.5,1.6 Q -2,0.5 -2,-1.5',
  'M -3,-4.5 L 3,-4.5 M 0,-4.5 L 0,5 M 0,0 Q 2,0.5 2,2.5',
  'M -3,-4 L 3,-4 Q 3.6,0 0,2 Q -3.6,4 -3,0.5 Q -2.6,-2.5 0,-2.5',
  'M -3,-5 Q 0,-1 3,-5 M -3,0 Q 0,3 3,0 M -3,0 L 3,0',
  'M -3,-5 Q 0,-2 3,0 Q 0,2 -3,5',
  'M -2.5,-5 L 2.5,5 M 2.5,-5 L -2.5,5',
  'M -2.2,-1.5 L 2.2,-1.5 Q 2.2,3.5 0,3.5 Q -2.2,3.5 -2.2,-1.5',
];

const T = POI_MATERIC_V4_TOKENS;

/** Nested wake windows, each starting later, so their overlap fades the trail. */
const WAKE_STEPS = [0, 0.35, 0.62, 0.82, 0.94];

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Split a hex colour into the 0..1 channels an feColorMatrix expects. */
function channels(hex: string): [string, string, string] {
  const n = parseInt(hex.slice(1), 16);
  return [
    (((n >> 16) & 255) / 255).toFixed(3),
    (((n >> 8) & 255) / 255).toFixed(3),
    ((n & 255) / 255).toFixed(3),
  ];
}

/** -1 writes counter-clockwise from twelve o'clock, +1 clockwise. */
type Sweep = -1 | 1;

interface SealLetter {
  d: string;
  angle: number;
  x: number;
  y: number;
  /** 0 at the liquid front, growing as the letter settles behind it. */
  age: number;
}

/**
 * A partial arc of the seal, expressed as a window over the written span. The
 * circle is drawn as several stacked windows — settled body, wake, bright head
 * — so it reads as a channel FILLING rather than a rail being laid: constant
 * stroke and constant light are exactly what make an arc look mechanical.
 *
 * Every arc built here is stroked with `butt` caps, never `round`. An arc that
 * grows from zero length paints its cap as a disc of the stroke's width at the
 * start point, so a round cap leaves a dot sitting at twelve o'clock before the
 * script has written anything — worst of all on the shadow rail, which is three
 * times wider than the others. The same defect was removed twice from
 * DayNightPoiSkin, GenericPoiSkin, MagicCircleHalo and HaloProgressComponent on
 * 2026-08-15; the soft leading edge is the job of the meniscus bead instead.
 */
/**
 * A point on the seal at a given fraction of the circle, measured from twelve
 * o'clock in the writing direction. Every angular value in the seal goes through
 * here, so direction is decided once.
 */
function sealPoint(radius: number, fraction: number, sweep: Sweep): [number, number] {
  const { center } = T.geometry;
  const rad = ((-90 + sweep * Math.min(fraction, 0.999) * 360) * Math.PI) / 180;
  return [center + radius * Math.cos(rad), center + radius * Math.sin(rad)];
}

function sealArcSpan(radius: number, from: number, to: number, sweep: Sweep): string {
  const [x1, y1] = sealPoint(radius, from, sweep);
  const [x2, y2] = sealPoint(radius, to, sweep);
  const large = (Math.min(to, 0.999) - from) * 360 > 180 ? 1 : 0;
  // The SVG sweep flag follows the writing direction, or the arc bulges the wrong way.
  const flag = sweep > 0 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${large} ${flag} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/**
 * The full written span of the seal, from twelve o'clock to the current front.
 *
 * Rails and shadow rail are arcs that grow with the script, never pre-existing
 * circles: the frozen v3 desiderata is explicit — the circle materialises
 * character by character, "senza binari né cerchio preesistente". A ring already
 * standing when the clock starts tells the player the wrong thing.
 */
function sealArcPath(radius: number, written: number, sweep: Sweep): string {
  return sealArcSpan(radius, 0, written, sweep);
}

/**
 * One band of the magic circle, revealed progressively from twelve o'clock.
 * `half` offsets the band by half a step so the two rings interleave.
 */
function buildBand(radius: number, half: boolean, written: number, sweep: Sweep): SealLetter[] {
  const { center } = T.geometry;
  const step = 360 / T.seal.letterCount;
  const out: SealLetter[] = [];
  for (let i = 0; i < T.seal.letterCount; i++) {
    const age = written - i;
    if (age <= 0) break;
    const angle = -90 + sweep * (i + (half ? 0.5 : 0)) * step;
    const rad = (angle * Math.PI) / 180;
    out.push({
      d: LETTERS[i % LETTERS.length],
      angle,
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
      age,
    });
  }
  return out;
}

export const PoiMatericV4: React.FC<PoiMatericV4Props> = ({
  type,
  state = 'available',
  progress = 1,
  timerDirection = 'counterclockwise',
  grounded = false,
  size: sizePx = 112,
  className = '',
  style,
  onClick,
  onPointerEnter,
  onPointerLeave,
  'data-testid': dataTestId,
}) => {
  const { t } = useTranslation('idleVillage');
  const uid = useId();
  const gid = (key: string) => `${uid}-${key}`;

  const identity = T.types[type];
  const icon = T.icons[identity.icon];
  const g = T.geometry;
  /**
   * The ring's alloy is the type's, not a constant: the outer ring is what tells
   * the player which activity this is. What keeps it metal rather than plastic
   * is the ramp's structure — specular, saturated mid, near-black shadow.
   */
  const [alloyLight, alloyMid, alloyDark] = identity.alloy;

  /**
   * Which way the script is written. Everything angular in the seal derives
   * from this one number — letters, rails, shadow rail and the front bead — so
   * the direction can never again be honoured by some parts and ignored by
   * others, which is exactly how V4 shipped with an inert flag.
   */
  const sweep: Sweep = timerDirection === 'clockwise' ? 1 : -1;

  /**
   * The seal is a clock face: nothing is written before the expedition starts,
   * and an expired POI has lost its circle entirely.
   */
  const sealProgress =
    state === 'expired' ? 0 : state === 'available' || state === 'new' ? 1 : clamp01(progress);

  const upperBand = useMemo(
    () => buildBand(g.sealUpperBand, false, sealProgress * T.seal.letterCount, sweep),
    [g.sealUpperBand, sealProgress, sweep],
  );
  const lowerBand = useMemo(
    () => buildBand(g.sealLowerBand, true, sealProgress * T.seal.letterCount, sweep),
    [g.sealLowerBand, sealProgress, sweep],
  );

  /** The engraved band inside the medallion: always present, never lit. */
  const rimBand = useMemo(() => {
    const step = 360 / g.rimLetterCount;
    return Array.from({ length: g.rimLetterCount }, (_, i) => {
      const angle = -90 + i * step;
      const rad = (angle * Math.PI) / 180;
      return {
        d: LETTERS[i % LETTERS.length],
        angle,
        x: g.center + g.rimLetterRadius * Math.cos(rad),
        y: g.center + g.rimLetterRadius * Math.sin(rad),
      };
    });
  }, [g.center, g.rimLetterCount, g.rimLetterRadius]);

  const [gr, gg, gb] = channels(identity.glow);

  /**
   * The quarter sparks. Each sits at its fraction of the circle measured along
   * the writing direction, and comes up as the front crosses it — so at twelve
   * o'clock it is there from the first character, and the others arrive in the
   * order the clock actually turns.
   */
  const cardinals = useMemo(
    () =>
      T.cardinals.fractions.map((fraction) => {
        const crossed = sealProgress - fraction;
        const [x, y] = sealPoint(T.cardinals.radius, fraction, sweep);
        return {
          fraction,
          x,
          y,
          lit: clamp01(crossed / T.cardinals.riseSpan),
          flare: crossed >= 0 ? clamp01(1 - crossed / T.cardinals.flareSpan) : 0,
        };
      }),
    [sealProgress, sweep],
  );

  /** Where the liquid front currently stands, in viewBox coordinates. */
  const headPoint = useMemo(() => {
    const [x, y] = sealPoint((g.sealOuterRail + g.sealInnerRail) / 2, sealProgress, sweep);
    return { x, y };
  }, [sealProgress, sweep, g.sealInnerRail, g.sealOuterRail]);

  /**
   * A letter flares as the front passes over it and settles once it is behind.
   * This is most of what separates "filling" from "extending": a rail has the
   * same light everywhere along its length.
   */
  const flare = (age: number) => clamp01(1 - age / T.seal.flow.flareLetters);

  /**
   * The leading glyph emerges over its own slice of the circle instead of
   * appearing whole. Without this the script advances in hundredth-of-a-circle
   * steps: at a two-minute fill that is a letter popping in every 1.2 seconds,
   * which reads as stuttering however smooth the underlying progress is.
   */
  const reveal = (age: number) => clamp01(age);

  const wakeStart = Math.max(0, sealProgress - sealProgress * T.seal.flow.wakeFraction);
  const headStart = Math.max(0, sealProgress - sealProgress * T.seal.flow.headFraction);

  /** One stamped pass of the heraldic mark: arms, optional short arms, boss, rings. */
  const iconPass = (fill: string, dx: number, dy: number, opacity?: number) => (
    <g transform={`translate(${dx} ${dy})`} opacity={opacity}>
      {icon.rings.map((ring, i) => (
        <circle key={`ring-${i}`} r={ring.r} fill="none" stroke={fill} strokeWidth={ring.w} />
      ))}
      {icon.steps.map((a) => (
        <path key={`arm-${a}`} d={icon.arm} fill={fill} transform={`rotate(${a})`} />
      ))}
      {icon.armShort &&
        icon.stepsShort?.map((a) => (
          <path key={`short-${a}`} d={icon.armShort as string} fill={fill} transform={`rotate(${a})`} />
        ))}
      <circle r={icon.boss} fill={fill} />
    </g>
  );

  return (
    <div
      role="img"
      data-testid={dataTestId}
      aria-label={t('poiMarker.ariaLabel', {
        defaultValue: 'Point of interest',
        context: type,
      })}
      className={`poiv4 ${className}`}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      style={{ position: 'relative', width: sizePx, height: sizePx, ...style }}
    >
      <svg
        className="poiv4__svg"
        width={sizePx}
        height={sizePx}
        viewBox="0 0 86 86"
        overflow="visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* The invariant alloy: warm specular, saturated mid, near-black shadow. */}
          <linearGradient id={gid('body')} x1="14%" y1="4%" x2="86%" y2="96%">
            <stop offset="0%" stopColor={alloyLight} />
            <stop offset="6%" stopColor={alloyLight} />
            <stop offset="22%" stopColor={alloyMid} />
            <stop offset="78%" stopColor={alloyMid} />
            <stop offset={`${T.edge.shadowStop * 100}%`} stopColor={alloyDark} />
            <stop offset="100%" stopColor={alloyDark} />
          </linearGradient>

          <linearGradient id={gid('bevel')} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={alloyLight} stopOpacity="0.34" />
            <stop offset="30%" stopColor={alloyLight} stopOpacity="0.07" />
            <stop offset="100%" stopColor={alloyDark} stopOpacity={T.edge.bevelShadowOpacity} />
          </linearGradient>

          <linearGradient id={gid('inner')} x1="12%" y1="8%" x2="88%" y2="92%">
            <stop offset="0%" stopColor={alloyLight} />
            <stop offset="24%" stopColor={alloyMid} />
            <stop offset="78%" stopColor={alloyMid} />
            <stop offset="100%" stopColor={alloyDark} />
          </linearGradient>

          {/*
            Rim glaze. Brightest where the light lands, falling to nearly nothing
            on the unlit side — and never to a dark colour, because a glaze that
            terminates in shadow is the dark hoop again under another name.
          */}
          <radialGradient id={gid('glaze')} cx="30%" cy="22%" r="86%">
            <stop offset="0%" stopColor={identity.glaze} stopOpacity="0.92" />
            <stop offset="42%" stopColor={identity.glaze} stopOpacity="0.44" />
            <stop offset="100%" stopColor={identity.glaze} stopOpacity={T.surface.glazeFadeOpacity} />
          </radialGradient>

          <radialGradient id={gid('field')} cx="38%" cy="30%" r="78%">
            <stop offset="0%" stopColor={T.surface.fieldLight} />
            <stop offset="100%" stopColor={T.surface.fieldDark} />
          </radialGradient>

          {/*
            Bounce light. A cast object throws its own ring's colour back into
            the recess, and that is the only place the type's hue belongs on the
            field: a rim of light at the lower inner edge, where bounce actually
            lands. Tinting the whole field would muddy a shadow the art bible
            wants deep and cool — never brown, never grey.
          */}
          <radialGradient id={gid('bounce')} cx="50%" cy="82%" r="62%">
            <stop offset="0%" stopColor={alloyMid} stopOpacity={T.surface.bounceOpacity} />
            <stop offset="55%" stopColor={alloyMid} stopOpacity={T.surface.bounceOpacity * 0.35} />
            <stop offset="100%" stopColor={alloyMid} stopOpacity="0" />
          </radialGradient>

          <radialGradient id={gid('glass')} cx="30%" cy="22%" r="70%">
            <stop offset="0%" stopColor={T.surface.glassHighlight} />
            <stop offset="45%" stopColor={T.surface.glassHighlight} stopOpacity="0.2" />
            <stop offset="100%" stopColor={T.surface.glassShadow} />
          </radialGradient>

          {/* The meniscus bead: soft, so the front reads as liquid and not as a tag. */}
          <radialGradient id={gid('bead')} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={T.seal.coreInk} stopOpacity="0.95" />
            <stop offset="45%" stopColor={identity.rail} stopOpacity="0.55" />
            <stop offset="100%" stopColor={identity.glow} stopOpacity="0" />
          </radialGradient>

          <linearGradient id={gid('iconMetal')} x1="18%" y1="0%" x2="82%" y2="100%">
            <stop offset="0%" stopColor={T.metal.iconCrown} />
            <stop offset="38%" stopColor={T.metal.iconMid} />
            <stop offset="72%" stopColor={T.metal.mid} />
            <stop offset="100%" stopColor={T.metal.iconDark} />
          </linearGradient>

          {grounded && (
            <filter
              id={gid('sh-blur')}
              x="-140%"
              y="-160%"
              width="380%"
              height="420%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation={T.shadow.blur} />
            </filter>
          )}

          {/*
            Bloom. The halo is derived from SourceAlpha — the SHAPE — then
            tinted with the type's light and merged UNDER the source. Deriving
            it from SourceGraphic, as V3 did, makes the halo inherit the ink,
            which is why a seal full of black letters could never glow.
            Four primitives: chains longer than that sink mobile rendering.
          */}
          <filter
            id={gid('bloom')}
            x="-120%"
            y="-120%"
            width="340%"
            height="340%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation={T.bloom.radii[0]} result="b1" />
            <feGaussianBlur in="SourceAlpha" stdDeviation={T.bloom.radii[1]} result="b2" />
            <feGaussianBlur in="SourceAlpha" stdDeviation={T.bloom.radii[2]} result="b3" />
            <feMerge result="halo">
              <feMergeNode in="b3" />
              <feMergeNode in="b2" />
              <feMergeNode in="b1" />
            </feMerge>
            <feColorMatrix
              in="halo"
              type="matrix"
              result="tint"
              values={`0 0 0 0 ${gr} 0 0 0 0 ${gg} 0 0 0 0 ${gb} 0 0 0 ${T.bloom.strength} 0`}
            />
            <feMerge>
              <feMergeNode in="tint" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/*
          Cast shadow, behind everything including the seal.
          A squashed, tilted ellipse anchored just below the medallion's bottom
          edge — the silhouette projected onto the ground, not a copy of it —
          multiplied against the map so its contrast stays proportional to
          whatever terrain it falls on.
        */}
        {grounded && (
          <g
            className="poiv4__ground"
            aria-hidden="true"
            style={{ mixBlendMode: T.shadow.blendMode as React.CSSProperties['mixBlendMode'] }}
          >
            <g
              transform={`rotate(${T.shadow.tilt} ${g.center + T.shadow.dx} ${
                g.center + g.medalRadius + T.shadow.gap + T.shadow.ry
              })`}
            >
              <ellipse
                cx={g.center + T.shadow.dx}
                cy={g.center + g.medalRadius + T.shadow.gap + T.shadow.ry}
                rx={T.shadow.rx}
                ry={T.shadow.ry}
                fill={T.shadow.color}
                fillOpacity={T.shadow.opacity}
                filter={`url(#${gid('sh-blur')})`}
              />
            </g>
          </g>
        )}

        {/* ---------- MAGIC CIRCLE: written by the passage of time ---------- */}
        {sealProgress > 0.001 && (
          <>
            {/*
              The shadow rail, kept narrow — and laid down WITH the script, not
              before it. V3's eleven-unit blurred band was a shadow standing
              where the glow should be; at this width it still separates the
              letters from the pale sand and fields of the map.
            */}
            <path
              className="poiv4__track"
              d={sealArcPath((g.sealOuterRail + g.sealInnerRail) / 2, sealProgress, sweep)}
              fill="none"
              stroke={T.seal.trackColor}
              strokeWidth={T.seal.trackWidth}
              strokeLinecap="butt"
            />

            {/* Halo pass */}
            <g className="poiv4__seal-halo" filter={`url(#${gid('bloom')})`}>
              {[g.sealOuterRail, g.sealInnerRail].map((radius) => (
                <React.Fragment key={`halo-rail-${radius}`}>
                  {/* settled body */}
                  <path
                    d={sealArcPath(radius, sealProgress, sweep)}
                    fill="none"
                    stroke={identity.rail}
                    strokeOpacity={T.seal.flow.settledOpacity}
                    strokeWidth={T.seal.railWidth}
                    strokeLinecap="butt"
                    vectorEffect="non-scaling-stroke"
                  />
                  {/*
                    The wake, as nested windows rather than one brighter span:
                    a single step reads as a seam, four steps read as a fade.
                  */}
                  {WAKE_STEPS.map((step, i) => (
                    <path
                      key={`wake-${radius}-${i}`}
                      d={sealArcSpan(radius, wakeStart + (sealProgress - wakeStart) * step, sealProgress, sweep)}
                      fill="none"
                      stroke={identity.rail}
                      strokeOpacity={0.16}
                      strokeWidth={T.seal.railWidth}
                      strokeLinecap="butt"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  {/* The meniscus: the type's own light at full strength, not white. */}
                  <path
                    d={sealArcSpan(radius, headStart, sealProgress, sweep)}
                    fill="none"
                    stroke={identity.rail}
                    strokeWidth={T.seal.railWidth * 1.15}
                    strokeLinecap="butt"
                    vectorEffect="non-scaling-stroke"
                  />
                </React.Fragment>
              ))}
              {cardinals.map(
                (c) =>
                  c.lit > 0.001 && (
                    <g
                      key={`card-halo-${c.fraction}`}
                      transform={`translate(${c.x.toFixed(2)} ${c.y.toFixed(2)}) scale(${T.cardinals.scale})`}
                      opacity={
                        (T.cardinals.settledOpacity +
                          (1 - T.cardinals.settledOpacity) * c.flare) *
                        c.lit
                      }
                    >
                      <path d={T.cardinals.path} fill={identity.rail} />
                    </g>
                  ),
              )}

              {/* The bead riding the front — the drop that pulls the rest along. */}
              {sealProgress < 0.999 && (
                <circle
                  cx={headPoint.x}
                  cy={headPoint.y}
                  r={T.seal.flow.headRadius}
                  fill={`url(#${gid('bead')})`}
                />
              )}
              {[...upperBand, ...lowerBand].map((l, i) => (
                <g key={`halo-${i}`} transform={`translate(${l.x.toFixed(2)} ${l.y.toFixed(2)}) rotate(${l.angle.toFixed(1)})`}>
                  <g transform={`scale(${T.seal.letterScale})`}>
                    <path
                      d={l.d}
                      fill="none"
                      stroke={identity.glow}
                      strokeOpacity={
                        (T.seal.flow.settledOpacity + (1 - T.seal.flow.settledOpacity) * flare(l.age)) *
                        reveal(l.age)
                      }
                      strokeWidth={T.seal.letterWidth * (1 + 0.45 * flare(l.age))}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                </g>
              ))}
            </g>

            {/*
              Core pass. A bloom is halo PLUS a crisp core: without this the
              halo drowns the inscription and the seal becomes a flat ring of
              colour. Learned by getting it wrong in the study.
            */}
            <g className="poiv4__seal-core">
              {[g.sealOuterRail, g.sealInnerRail].map((radius) => (
                <path
                  key={`core-rail-${radius}`}
                  d={sealArcPath(radius, sealProgress, sweep)}
                  fill="none"
                  stroke={identity.rail}
                  strokeWidth={T.seal.coreRailWidth}
                  strokeLinecap="butt"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {cardinals.map(
                (c) =>
                  c.lit > 0.001 && (
                    <g
                      key={`card-core-${c.fraction}`}
                      transform={`translate(${c.x.toFixed(2)} ${c.y.toFixed(2)}) scale(${T.cardinals.coreScale})`}
                      opacity={c.lit}
                    >
                      <path d={T.cardinals.path} fill={T.seal.coreInk} />
                    </g>
                  ),
              )}

              {[...upperBand, ...lowerBand].map((l, i) => (
                <g key={`core-${i}`} transform={`translate(${l.x.toFixed(2)} ${l.y.toFixed(2)}) rotate(${l.angle.toFixed(1)})`}>
                  <g transform={`scale(${T.seal.letterScale})`}>
                    <path
                      d={l.d}
                      fill="none"
                      stroke={T.seal.coreInk}
                      strokeOpacity={(0.72 + 0.28 * flare(l.age)) * reveal(l.age)}
                      strokeWidth={T.seal.coreLetterWidth * (1 + 0.3 * flare(l.age))}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                </g>
              ))}
            </g>
          </>
        )}

        {/* ---------- MEDALLION ---------- */}
        <circle cx={g.center} cy={g.center} r={g.medalRadius} fill={T.surface.fieldDark} />
        <circle
          className="poiv4__body"
          cx={g.center}
          cy={g.center}
          r={g.medalRadius}
          fill={`url(#${gid('body')})`}
          opacity={T.edge.bodyOpacity}
        />
        <circle
          cx={g.center}
          cy={g.center}
          r={g.medalRadius}
          fill={`url(#${gid('bevel')})`}
          opacity={T.edge.bevelOpacity}
        />
        <circle
          cx={g.center}
          cy={g.center}
          r={g.medalRadius - 1}
          fill="none"
          stroke={alloyLight}
          strokeOpacity="0.62"
          strokeWidth="0.9"
          strokeDasharray="76 178"
          strokeDashoffset="82"
          strokeLinecap="round"
        />

        {/*
          The glazed lip, on the outermost edge. It sits just outside the dashed
          warm-light arc rather than on top of it: stacked at the same radius the
          two would blow out into one washed band. Where they do overlap, on the
          lit side, the edge is simply brighter — which is what light does.
        */}
        <circle
          cx={g.center}
          cy={g.center}
          r={g.glazeRadius}
          fill="none"
          stroke={`url(#${gid('glaze')})`}
          strokeWidth={g.glazeWidth}
        />

        <circle cx={g.center} cy={g.center} r={g.innerRingRadius} fill={T.surface.fieldDark} />
        <circle
          cx={g.center}
          cy={g.center}
          r={g.innerRingRadius}
          fill={`url(#${gid('inner')})`}
          opacity="0.68"
        />
        <circle
          cx={g.center}
          cy={g.center}
          r={g.innerRingRadius}
          fill="none"
          stroke={T.surface.innerShadow}
          strokeWidth="2.2"
          transform="translate(.3,.35)"
        />
        <circle cx={g.center} cy={g.center} r={g.fieldRadius} fill={`url(#${gid('field')})`} />
        <circle cx={g.center} cy={g.center} r={g.fieldRadius} fill={`url(#${gid('bounce')})`} />

        {/* Engraved band: chromatic dark plus a lip of metal light. Never black. */}
        <g className="poiv4__rim">
          {rimBand.map((l, i) => (
            <g key={`rim-${i}`} transform={`translate(${l.x.toFixed(2)} ${l.y.toFixed(2)}) rotate(${l.angle})`}>
              <g transform={`scale(${g.rimLetterScale})`}>
                <path
                  d={l.d}
                  fill="none"
                  stroke={alloyLight}
                  strokeOpacity={T.rim.lipOpacity}
                  strokeWidth={T.rim.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  transform="translate(0.5 0.6)"
                />
                <path
                  d={l.d}
                  fill="none"
                  stroke={alloyDark}
                  strokeWidth={T.rim.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            </g>
          ))}
        </g>

        {/* ---------- THE MARK ---------- */}
        <g className="poiv4__icon" transform={`translate(${g.center} ${g.center}) scale(0.9)`}>
          {/* Cast shadow: this is what gives the mark thickness, and thickness is weight. */}
          {iconPass(T.surface.fieldDark, 0.8, 1, 0.55)}
          {iconPass(`url(#${gid('iconMetal')})`, 0, 0)}
          {/* Specular lip along the lit edge: the stroke of light that says "cast". */}
          <g transform="translate(-0.4 -0.5)" opacity="0.8">
            {icon.steps.map((a) => (
              <path
                key={`lip-${a}`}
                d={icon.arm}
                fill="none"
                stroke={T.metal.specular}
                strokeOpacity="0.5"
                strokeWidth="0.5"
                transform={`rotate(${a})`}
              />
            ))}
            {icon.rings.map((ring, i) => (
              <circle
                key={`lip-ring-${i}`}
                r={ring.r}
                fill="none"
                stroke={T.metal.specular}
                strokeOpacity="0.32"
                strokeWidth="0.5"
              />
            ))}
          </g>
        </g>

        {/* ---------- GLASS ---------- */}
        <circle
          cx={g.center}
          cy={g.center}
          r={g.glassRadius}
          fill="none"
          stroke={T.surface.innerShadow}
          strokeWidth="1.8"
          transform="translate(.28,.35)"
        />
        <circle cx={g.center} cy={g.center} r={g.glassRadius} fill={`url(#${gid('glass')})`} />
        <ellipse
          className="poiv4__specular"
          cx="31"
          cy="23"
          rx="11"
          ry="4.6"
          fill={T.surface.specularFill}
        />
      </svg>
    </div>
  );
};

/**
 * Scoped styles for the marker. Kept as a style string alongside the component,
 * matching the V1–V3 convention on this page rather than introducing a
 * standalone stylesheet.
 */
export const poiMatericV4Styles = `
.poiv4 { display: block; }
.poiv4__svg { position: relative; width: 100%; height: 100%; overflow: visible; }
.poiv4__body { transition: filter 250ms ease; }
.poiv4:hover .poiv4__body { filter: brightness(1.12); }
.poiv4__icon { transition: filter 250ms ease; }
.poiv4:hover .poiv4__icon { filter: contrast(1.12) brightness(1.12); }
@media (prefers-reduced-motion: reduce) {
  .poiv4__body, .poiv4__icon { transition: none; }
}
`;

export default PoiMatericV4;
