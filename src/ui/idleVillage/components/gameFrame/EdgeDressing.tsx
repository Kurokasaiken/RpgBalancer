import type { CSSProperties } from 'react';

/**
 * Edge dressing — foliage and rolled maps that enter from outside the screen and
 * overlap the ribbons, so the chrome reads as objects in a world larger than the
 * viewport. PLACEHOLDER silhouettes: position and scale are final, the art is not
 * (swap each `<svg>` for a generated transparent webp). Never interactive.
 */

const LEAF = 'var(--hud-dressing-leaf, #2f4a2a)';
const LEAF_LIGHT = 'var(--hud-dressing-leaf-light, #4f6e3c)';
const PAPER = 'var(--hud-dressing-paper, #d9c7a0)';
const PAPER_SHADE = 'var(--hud-dressing-paper-shade, #a8915f)';

function LeafCluster({ flip = false, style }: { flip?: boolean; style: CSSProperties }) {
  return (
    <svg
      data-placeholder="foliage"
      viewBox="0 0 160 90"
      width={160}
      height={90}
      style={{ position: 'absolute', transform: flip ? 'scaleX(-1)' : undefined, ...style }}
    >
      <path d="M10 20 Q60 0 150 30" stroke={LEAF} strokeWidth="3" fill="none" />
      {[20, 42, 64, 86, 108, 130].map((x, i) => (
        <g key={x} transform={`translate(${x} ${14 + (i % 2) * 8}) rotate(${i % 2 ? 35 : -25})`}>
          <ellipse cx="0" cy="14" rx="8" ry="18" fill={i % 2 ? LEAF_LIGHT : LEAF} />
        </g>
      ))}
    </svg>
  );
}

function RolledMap({ flip = false, style }: { flip?: boolean; style: CSSProperties }) {
  return (
    <svg
      data-placeholder="rolled-map"
      viewBox="0 0 220 110"
      width={220}
      height={110}
      style={{ position: 'absolute', transform: flip ? 'scaleX(-1)' : undefined, ...style }}
    >
      <g transform="rotate(-14 110 55)">
        <rect x="10" y="40" width="200" height="34" rx="17" fill={PAPER} />
        <ellipse cx="210" cy="57" rx="10" ry="17" fill={PAPER_SHADE} />
        <ellipse cx="210" cy="57" rx="4" ry="8" fill={PAPER} />
        <rect x="90" y="40" width="10" height="34" fill={PAPER_SHADE} opacity="0.6" />
      </g>
    </svg>
  );
}

export function EdgeDressing() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 75% 70% at 50% 50%, transparent 62%, var(--hud-vignette, rgba(18,12,4,0.55)) 100%)',
        }}
      />
      {/* Each cluster overlaps the free end of a ribbon by ~50px, so it reads as growing over it. */}
      <LeafCluster style={{ top: 34, left: 196 }} />
      <LeafCluster flip style={{ top: 38, right: 290 }} />
      <LeafCluster style={{ bottom: 34, left: 'calc(50% + 170px)', transform: 'scaleY(-1)' }} />
      <LeafCluster flip style={{ bottom: 34, right: 'calc(50% + 170px)', transform: 'scale(-1, -1)' }} />
      <RolledMap style={{ bottom: -30, right: -40 }} flip />
      <RolledMap style={{ bottom: -46, left: 120 }} />
    </div>
  );
}

export default EdgeDressing;
