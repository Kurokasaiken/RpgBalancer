import React from 'react';
import {
  POI_ZANARA_CONFIG as CFG,
  POI_ZANARA_LAYERS,
  type PoiZanaraFamily,
} from '@/balancing/config/idleVillage/poiZanaraConfig';
import { PoiMagicCircle } from '@/ui/idleVillage/components/poi/PoiMagicCircle';

/**
 * PoiZanara — the painted POI marker (PLAN-117, Director rulings 2026-11-12).
 *
 * Composites the baptized webp layers straight onto the map as DOM:
 * magic-circle halo (under, runes pass behind the jewels) → family base
 * (frame + baked collar) → incision → top decoration → dome icon.
 * No gold glow, no navy outline, no channel fill (Director ruling
 * 2026-11-13): the rune ring IS the time display.
 *
 * Time grammar (ruling, not negotiable here):
 * - `job`: the halo writes CLOCKWISE from 12 with elapsed work time
 *   (empty → full).
 * - `quest`: the halo shows the deadline's remaining share and drains
 *   COUNTER-CLOCKWISE from 12 (full → empty). At equal fractions the two
 *   rings are specular (50% job = right half, 50% quest = left half).
 * - Urgency: ONLY a family→`urgentRed` colour shift on the residual ring
 *   once remaining < `urgentStartsAtRemaining` — no badge, no pulse.
 */

export interface PoiZanaraProps {
  /** Marker family — decides frame and enamel colour. */
  family: PoiZanaraFamily;
  /** Ring fraction 0..1: elapsed share for `job`, remaining share for `quest`. */
  fraction: number;
  /** Piece width in CSS px incl. punte (48 = the baptized reference size). */
  sizePx: number;
  /** Painted glyph for the dome (activity type, not place). */
  iconUrl?: string;
  /** Strabordante (Director ruling 2026-11-24): render the glyph at
   *  `iconOverflowFactor`× its dome size so the diorama crosses the ring. */
  iconOverflow?: boolean;
  /** Per-emblem overflow multiplier (Director ruling 2026-11-24: icons were
   *  «troppo grandi rispetto al POI» — each emblem gets its own proportion,
   *  e.g. forage 2.7 ≈ 75% of the sigillo, logs 2.2). */
  iconOverflowFactor?: number;
  /** Slow scale pulse — the «run ended, awaiting the player» beat. */
  pulse?: boolean;
  'data-testid'?: string;
}

const LAYER_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  userSelect: 'none',
};

const [CX, CY] = CFG.ringCentre;
/** Magic-circle square side in canvas px, per family: the sigillo halo lives
 *  in a 126-unit viewBox (-20..106, centre 43) whose outer rail is r=54 —
 *  scale so that rail lands on haloOuterRailPx[family]. */
const HALO_SIDE = (family: PoiZanaraFamily) => (CFG.haloOuterRailPx[family] / 54) * 126;

export const PoiZanara: React.FC<PoiZanaraProps> = ({ family, fraction, sizePx, iconUrl, iconOverflow = false, iconOverflowFactor, pulse = false, 'data-testid': testId }) => {
  const f = Math.min(1, Math.max(0, fraction));
  const familyColor = CFG.familyColor[family];
  /* Urgency applies to the countdown grammar (the draining residual): the
   *  whole rune ring lands in vermilion — no ramp, urgency lands once. */
  const urgent = family === 'quest' && f > 0 && f < CFG.urgentStartsAtRemaining;

  const iconD = CFG.iconDiameterFactor * CFG.ringRadius * (iconOverflow ? (iconOverflowFactor ?? CFG.iconOverflowFactor) : 1);
  /* Cameo stays dome-sized even for overflow emblems: it lights the glyph's
   *  core, the spill-over part crosses the ring uncovered. */
  const cameoD = CFG.iconDiameterFactor * CFG.ringRadius;
  /* Emblem keyline (Director ruling 2026-11-24): the icon wears the same
   *  navy «riga attorno» as the piece silhouette — a hard 4-directional
   *  drop-shadow stroke plus the soft grounding shadow, scaled to the
   *  rendered size. Replaces the former warm ivory halo. */
  const ks = sizePx / CFG.pieceWidthPx;
  const kp = (CFG.outlinePx * ks).toFixed(2);
  const iconKeyline =
    `drop-shadow(${kp}px 0 0 ${CFG.outlineColor}) ` +
    `drop-shadow(-${kp}px 0 0 ${CFG.outlineColor}) ` +
    `drop-shadow(0 ${kp}px 0 ${CFG.outlineColor}) ` +
    `drop-shadow(0 -${kp}px 0 ${CFG.outlineColor}) ` +
    `drop-shadow(0 ${(1.5 * ks).toFixed(2)}px ${(3 * ks).toFixed(2)}px rgba(6,10,20,.6))`;
  const iconImg = iconUrl ? (
    <>
      {/* Cameo backing: a soft ivory disc under the glyph — the painted icons
       *  are dark-on-navy at map size and read as blobs without it. */}
      <div
        style={{
          position: 'absolute',
          left: `${(((CX - cameoD * 0.62) / CFG.canvasWidth) * 100).toFixed(3)}%`,
          top: `${(((CY - cameoD * 0.62) / CFG.canvasHeight) * 100).toFixed(3)}%`,
          width: `${(((cameoD * 1.24) / CFG.canvasWidth) * 100).toFixed(3)}%`,
          aspectRatio: '1',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,236,200,0.5) 0%, rgba(255,236,200,0.22) 55%, rgba(255,236,200,0) 74%)',
          pointerEvents: 'none',
        }}
      />
    <img
      src={iconUrl}
      alt=""
      draggable={false}
      style={{
        position: 'absolute',
        left: `${(((CX - iconD / 2) / CFG.canvasWidth) * 100).toFixed(3)}%`,
        top: `${(((CY - iconD / 2) / CFG.canvasHeight) * 100).toFixed(3)}%`,
        width: `${((iconD / CFG.canvasWidth) * 100).toFixed(3)}%`,
        pointerEvents: 'none',
        userSelect: 'none',
        /* Navy silhouette keyline — same treatment as the piece outline. */
        filter: iconKeyline,
      }}
    />
    </>
  ) : null;

  return (
    <div
      data-testid={testId}
      data-poi-zanara={family}
      style={{
        position: 'relative',
        width: (sizePx * CFG.canvasWidth) / CFG.pieceWidthPx,
        height: (sizePx * CFG.canvasHeight) / CFG.pieceWidthPx,
        animation: pulse ? 'poi-zanara-pulse 1.6s ease-in-out infinite' : undefined,
      }}
    >
      <style>{`@keyframes poi-zanara-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.07); } }
/* Zoom LOD (Director ruling 2026-11-14): the map anchor is tagged
 *  data-poi-zoom="far" below the fit-zoom threshold — there the halo band
 *  swaps to the luminous family tone (legible at distance) and the runes
 *  hide, since they would be illegible noise anyway. All CSS, no re-render. */
/* Band colour swap (Director ruling 2026-11-21): far = the thick dark
 *  family band («quella spessa»), near = the luminous tone («sfumata»).
 *  Urgency still lands vermilion on both via the per-mode vars. */
[data-poi-zoom='far'] .poi-band { stroke: var(--poi-band-far); }
[data-poi-zoom='near'] .poi-band { stroke: var(--poi-band-near); }
[data-poi-zoom='far'] .poi-rune { opacity: 0; }
/* Far LOD of the piece itself (Director 2026-11-21): below the fit-zoom
 *  threshold the detailed layers hide and a flattened "light" piece shows —
 *  same footprint, solid ring, identical dome/gems. */
.poi-light { display: none; }
[data-poi-zoom='far'] .poi-light { display: block;
  /* The navy silhouette keyline is baked into the light assets (Director
   *  2026-11-21); here only the grounding shadow stays. */
  filter: drop-shadow(0 1.5px 3px rgba(6,10,20,.6)); }
[data-poi-zoom='far'] .poi-detail { display: none; }
/* Luminous pool BEHIND the piece — near LOD only (Director 2026-11-21):
 *  the zoomed marker wears the soft annular glow; the far marker keeps
 *  just the thick dark family band. */
.poi-glow { display: none; position: absolute; inset: -18%; border-radius: 50%; pointer-events: none;
  /* Annular glow (Director 2026-11-21): light emanates FROM the medallion —
   *  the ramp peaks just under the silhouette edge so the pool attaches to
   *  the metal and falls off outward, no detached ring floating away.
   *  Dark core kept: a filled disc would wash through the enamel gaps. */
  background: radial-gradient(closest-side,
    transparent 0%,
    transparent 42%,
    color-mix(in srgb, var(--poi-glow) 30%, transparent) 58%,
    color-mix(in srgb, var(--poi-glow) 62%, transparent) 72%,
    color-mix(in srgb, var(--poi-glow) 30%, transparent) 84%,
    transparent 97%); }
[data-poi-zoom='near'] .poi-glow { display: block; }`}</style>
      {/* Magic-circle halo (sigillo language): time writes a solid band of
       *  runes hugging the frame's outer edge FROM OUTSIDE — one track,
       *  cardinal sparks, liquid head bead — tinted in the family colour,
       *  vermilion once the deadline is urgent. Rendered UNDER the whole
       *  piece: the base silhouette is opaque, so the band is occluded
       *  pixel-perfect under the punte/jewels and surfaces only in the open
       *  arcs between them — no angular gaps, no occluder layer (Director
       *  ruling 2026-11-14: «l'halo sotto e basta»). */}
      {CFG.haloOuterRailPx[family] > 0 && f > 0 ? (
        <div
          className="poi-halo"
          style={{
            /* Band tones per zoom LOD (ruling 2026-11-21): far carries the
             *  dark family band, near the luminous one, the annular glow stays
             *  luminous — urgency flips every channel to vermilion. */
            /* Far band = 55% luminous into the dark family tone (Director
             *  eye-pick 2026-11-24): readable at distance, not a neon ring. */
            ['--poi-band-far' as string]: urgent
              ? CFG.urgentRed
              : `color-mix(in srgb, ${familyColor} 45%, ${CFG.haloFarColor[family]} 55%)`,
            ['--poi-band-near' as string]: urgent ? CFG.urgentRed : CFG.haloFarColor[family],
            ['--poi-glow' as string]: urgent ? CFG.urgentRed : CFG.haloFarColor[family],
            position: 'absolute',
            left: `${((((CX - HALO_SIDE(family) / 2) / CFG.canvasWidth) * 100)).toFixed(3)}%`,
            top: `${((((CY - HALO_SIDE(family) / 2) / CFG.canvasHeight) * 100)).toFixed(3)}%`,
            width: `${((HALO_SIDE(family) / CFG.canvasWidth) * 100).toFixed(3)}%`,
            height: `${((HALO_SIDE(family) / CFG.canvasHeight) * 100).toFixed(3)}%`,
            pointerEvents: 'none',
          }}
        >
          <div className="poi-glow" />
          <PoiMagicCircle
            progress={f}
            sweep={family === 'job' ? 1 : -1}
            tone={familyColor}
            runeColor={CFG.haloRuneColor}
            urgent={urgent}
            urgentTone={CFG.urgentRed}
            keylineColor={CFG.outlineColor}
          />
        </div>
      ) : null}
      <img className="poi-light" src={`${CFG.assetBase}${POI_ZANARA_LAYERS.light[family]}`} alt="" draggable={false} style={LAYER_STYLE} />
      <img className="poi-detail" src={`${CFG.assetBase}${POI_ZANARA_LAYERS.base[family]}`} alt="" draggable={false} style={LAYER_STYLE} />
      <img className="poi-detail" src={`${CFG.assetBase}${POI_ZANARA_LAYERS.incision}`} alt="" draggable={false} style={LAYER_STYLE} />
      <img className="poi-detail" src={`${CFG.assetBase}${POI_ZANARA_LAYERS.top[family]}`} alt="" draggable={false} style={LAYER_STYLE} />
      {iconImg}
    </div>
  );
};

export default PoiZanara;
