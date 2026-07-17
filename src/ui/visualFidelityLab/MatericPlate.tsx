import React, { useContext, useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { MaterialPreset } from '@/ui/wanderlust-surface/materialPresets';
import { WanderlustMaterialContext } from '@/ui/wanderlust-surface/WanderlustMaterialContext';
import './matericPlate.css';

/**
 * MatericPlate — LAB-LOCAL, FIRST material-primitive extraction (Phase 1).
 *
 * CLEAN hard-chisel state. Honours the LAW "one physical geometry" via a single
 * rounded-rect outline: obsidian floor + azure leak + one contact AO, then two
 * hard chisel lines (warm-black top-left shadow, old-gold bottom-right lip). On
 * palette, no grey artifacts, no mud. It is deliberately UNDERSTATED — a clean
 * secondary well, not a dramatic carved hole.
 *
 * NOTE: a richer, geometry-derived depth via SVG `feDiffuseLighting`/
 * `feSpecularLighting` was attempted and abandoned after several iterations —
 * it did not converge (flat-interior wash / grey artifacts) in a reasonable
 * budget. Per the "implementations are swappable" law, the premium carved look
 * is deferred to a painted / normal-map / 9-slice asset when we commit to it;
 * this clean chisel is the current procedural baseline.
 *
 * STATIC — no motion/particles (Life Layer switched on later).
 */
const RX = 9;

export interface MatericPlateProps {
  material?: MaterialPreset;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  'data-testid'?: string;
}

export const MatericPlate: React.FC<MatericPlateProps> = ({
  material,
  children,
  className,
  style,
  'data-testid': testId,
}) => {
  const contextMaterial = useContext(WanderlustMaterialContext);
  const p = material ?? contextMaterial ?? 'bronze';

  const rootRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 300, h: 120 });

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  const uid = useId().replace(/:/g, '');
  const clip = `mp-clip-${uid}`;
  const azure = `mp-azure-${uid}`;
  const ao = `mp-ao-${uid}`;

  // Two chisel paths, inset 1px, following the same rounded-rect geometry.
  const tl = `M 1,${h - RX} L 1,${RX} Q 1,1 ${RX},1 L ${w - RX},1`;
  const br = `M ${w - 1},${RX} L ${w - 1},${h - RX} Q ${w - 1},${h - 1} ${w - RX},${h - 1} L ${RX},${h - 1}`;

  return (
    <div
      ref={rootRef}
      className={`mp-root ${className ?? ''}`.trim()}
      data-mp-material={p}
      data-testid={testId}
      style={style}
    >
      <svg
        className="mp-svg"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clip}>
            <rect x="0" y="0" width={w} height={h} rx={RX} />
          </clipPath>
          <radialGradient id={azure} cx="50%" cy="0%" r="88%">
            <stop offset="0%" stopColor="rgba(0,229,255,0.10)" />
            <stop offset="45%" stopColor="rgba(0,150,255,0.03)" />
            <stop offset="80%" stopColor="rgba(0,150,255,0)" />
          </radialGradient>
          <radialGradient id={ao} cx="50%" cy="46%" r="70%">
            <stop offset="52%" stopColor="rgba(2,8,12,0)" />
            <stop offset="88%" stopColor="rgba(1,5,9,0.45)" />
            <stop offset="100%" stopColor="rgba(0,3,6,0.7)" />
          </radialGradient>
        </defs>

        <g clipPath={`url(#${clip})`}>
          <rect x="0" y="0" width={w} height={h} fill="#060f16" />
          <rect x="0" y="0" width={w} height={h} fill={`url(#${azure})`} />
          <rect x="0" y="0" width={w} height={h} fill={`url(#${ao})`} />
        </g>

        {/* Hard chisel: two clean lines, no blur, no grey */}
        <path d={tl} fill="none" stroke="#050403" strokeWidth="1.5" strokeLinecap="round" />
        <path d={br} fill="none" stroke="rgba(224,178,66,0.4)" strokeWidth="1" strokeLinecap="round" />
      </svg>

      <div className="mp-content">{children}</div>
    </div>
  );
};

export default MatericPlate;
