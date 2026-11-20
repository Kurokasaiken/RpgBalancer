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

export const PoiZanara: React.FC<PoiZanaraProps> = ({ family, fraction, sizePx, iconUrl, pulse = false, 'data-testid': testId }) => {
  const f = Math.min(1, Math.max(0, fraction));
  const familyColor = CFG.familyColor[family];
  /* Urgency applies to the countdown grammar (the draining residual): the
   *  whole rune ring lands in vermilion — no ramp, urgency lands once. */
  const urgent = family === 'quest' && f > 0 && f < CFG.urgentStartsAtRemaining;

  const iconD = CFG.iconDiameterFactor * CFG.ringRadius;
  const iconImg = iconUrl ? (
    <>
      {/* Cameo backing: a soft ivory disc under the glyph — the painted icons
       *  are dark-on-navy at map size and read as blobs without it. */}
      <div
        style={{
          position: 'absolute',
          left: `${(((CX - iconD * 0.62) / CFG.canvasWidth) * 100).toFixed(3)}%`,
          top: `${(((CY - iconD * 0.62) / CFG.canvasHeight) * 100).toFixed(3)}%`,
          width: `${(((iconD * 1.24) / CFG.canvasWidth) * 100).toFixed(3)}%`,
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
        /* The dome is dark navy: a warm halo around the glyph's silhouette is
         *  what makes the icon readable at 30 px on the map. */
        filter: 'drop-shadow(0 0 3px rgba(255,232,190,0.85)) drop-shadow(0 0 7px rgba(255,232,190,0.35))',
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
[data-poi-zoom='far'] .poi-band { stroke: var(--poi-band-far); }
[data-poi-zoom='far'] .poi-rune { opacity: 0; }
/* Far LOD of the piece itself (Director 2026-11-21): below the fit-zoom
 *  threshold the detailed layers hide and a flattened "light" piece shows —
 *  same footprint, solid ring, identical dome/gems. */
.poi-light { display: none; }
[data-poi-zoom='far'] .poi-light { display: block; }
[data-poi-zoom='far'] .poi-detail { display: none; }
/* Halo reads BEHIND the piece in far LOD (Director 2026-11-21): a soft
 *  radial glow sits under the whole marker and the crisp band is diffused,
 *  so the marker is planted on a pool of light instead of wearing a neon
 *  ring pasted on the map. */
.poi-glow { display: none; position: absolute; inset: -18%; border-radius: 50%; pointer-events: none;
  background: radial-gradient(closest-side,
    color-mix(in srgb, var(--poi-band-far) 55%, transparent) 0%,
    color-mix(in srgb, var(--poi-band-far) 22%, transparent) 52%,
    transparent 78%); }
[data-poi-zoom='far'] .poi-glow { display: block; }
[data-poi-zoom='far'] .poi-halo { opacity: 0.55; filter: blur(1.6px); }`}</style>
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
            /* --poi-band-far: luminous LOD tone — urgent overrides it so the
             *  countdown still lands vermilion even at resting fit. */
            ['--poi-band-far' as string]: urgent ? CFG.urgentRed : CFG.haloFarColor[family],
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
          />
        </div>
      ) : null}
      {family === 'quest' && (
        <img className="poi-light" src={`${CFG.assetBase}${POI_ZANARA_LAYERS.light.quest}`} alt="" draggable={false} style={LAYER_STYLE} />
      )}
      <img className="poi-detail" src={`${CFG.assetBase}${POI_ZANARA_LAYERS.base[family]}`} alt="" draggable={false} style={LAYER_STYLE} />
      <img className="poi-detail" src={`${CFG.assetBase}${POI_ZANARA_LAYERS.incision}`} alt="" draggable={false} style={LAYER_STYLE} />
      <img className="poi-detail" src={`${CFG.assetBase}${POI_ZANARA_LAYERS.top[family]}`} alt="" draggable={false} style={LAYER_STYLE} />
      {iconImg}
    </div>
  );
};

export default PoiZanara;
