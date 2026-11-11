// src/ui/idleVillage/components/C1Medallion.tsx
// The baptized C1 medallion (PLAN-116): ring-fused.webp — the signed ring with
// its fused crescent ornament (the file Director approved as 'medaglione
// battezzato') — with the resident portrait mounted inside its circular hole.
// Drop-in replacement for WanderlustMedalOverlay at the production call sites
// (planner slot rack, drag overlay, return flight proxy): identical props
// contract so drag, swap and ghost paths keep working untouched.
//
// Centering: the fused asset is asymmetric — the crescent extends to the left,
// so the portrait hole sits left of the asset's bounding box. The component
// centres the HOLE (the visual centre of the medallion), not the asset bounds.

import React from 'react';
import { getMedalPortraitUrl } from '@/balancing/config/idleVillage/medalPortraitAssets';
import { C1_ROWMOD } from '@/ui/idleVillage/hudReal/c1RowModGeometry';

const C1_RING = '/assets/ui/hud-real/C1/ring-fused.webp';

export interface C1MedallionProps {
  /** Full resident portrait URL (resolved via getMedalPortraitUrl like the old overlay). */
  portraitUrl?: string;
  /** Accepted for parity with WanderlustMedalOverlay: enables GPU-friendly hints while dragging. */
  isDragging?: boolean;
  /** Rendered medallion size in css px — the box is centred on the portrait hole. */
  sizePx?: number;
  className?: string;
  /**
   * Accepted for drop-in parity with WanderlustMedalOverlay. The signed C1
   * ring bakes its pendant into the asset, so there is nothing to toggle —
   * kept so existing call sites compile unchanged.
   */
  gemPendant?: boolean;
}

export const C1Medallion: React.FC<C1MedallionProps> = ({
  portraitUrl,
  isDragging = false,
  sizePx = 64,
  className,
}) => {
  const medalUrl = portraitUrl ? getMedalPortraitUrl(portraitUrl) : undefined;
  const R = C1_ROWMOD.ring;
  // The ring's visible circle is the asset height (the extra width is the
  // crescent extension); the box is a square centred on the portrait hole.
  const scale = sizePx / R.h;
  const imgLeft = (R.h / 2 - R.hole.cx) * scale;
  const imgTop = (R.h / 2 - R.hole.cy) * scale;
  const holeD = R.hole.r * 2 * scale;
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        willChange: isDragging ? 'transform' : 'auto',
        transform: isDragging ? 'translateZ(0)' : 'none',
        backfaceVisibility: isDragging ? 'hidden' : 'visible',
      }}
    >
      {medalUrl && (
        <span
          style={{
            position: 'absolute',
            left: `${sizePx / 2 - R.hole.r * scale}px`,
            top: `${sizePx / 2 - R.hole.r * scale}px`,
            width: `${holeD}px`,
            height: `${holeD}px`,
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 8px 2px rgba(3, 26, 30, 0.65)',
            display: 'block',
          }}
        >
          <img
            src={medalUrl}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </span>
      )}
      <img
        src={C1_RING}
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          left: `${imgLeft}px`,
          top: `${imgTop}px`,
          width: `${R.w * scale}px`,
          height: `${R.h * scale}px`,
          maxWidth: 'none',
        }}
      />
    </div>
  );
};
