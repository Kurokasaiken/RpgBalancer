/**
 * Dev-only performance readout for the World Surface map.
 *
 * Deliberately not internationalised and not skinned: this is an instrument,
 * not product UI, and it is stripped from production builds by its caller.
 *
 * The `over 4096px` row is the one to watch. WebKit refuses textures past that
 * edge and fails to blank without throwing, which is how a CSS 3D transform on
 * these layers could produce a correct transform in the DOM and no movement on
 * screen. Any layer counted there is a layer that cannot be safely composited.
 */

import { useFrameMetrics, useImageFootprint, TEXTURE_EDGE_LIMIT_PX } from '../hooks/useFrameMetrics';

export interface WorldSurfacePerfHudProps {
  /** Subtree whose <img> layers are measured. */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Layers currently toggled on, for context alongside the decoded count. */
  visibleLayerCount?: number;
  /** Current camera zoom, so a reading can be tied to what was on screen. */
  zoom?: number;
  /** Called when the close button is clicked. */
  onClose?: () => void;
}

/** Frame budget at 60fps, the ceiling WKWebView enforces on macOS regardless of display. */
const FRAME_BUDGET_MS = 1000 / 60;

function tone(value: number, warn: number, bad: number): string {
  if (value >= bad) return '#f87171';
  if (value >= warn) return '#fbbf24';
  return '#4ade80';
}

export const WorldSurfacePerfHud: React.FC<WorldSurfacePerfHudProps> = ({
  containerRef,
  visibleLayerCount,
  zoom,
  onClose,
}) => {
  const frame = useFrameMetrics(true);
  const footprint = useImageFootprint(containerRef, true);

  const row = (label: string, value: string, color?: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ opacity: 0.65 }}>{label}</span>
      <span style={{ color: color ?? '#e2e8f0', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: 8,
        top: 8,
        zIndex: 60,
        width: 232,
        padding: '8px 10px',
        borderRadius: 4,
        border: '1px solid rgba(148,163,184,0.35)',
        background: 'rgba(2,6,23,0.86)',
        backdropFilter: 'blur(4px)',
        color: '#e2e8f0',
        font: '11px ui-monospace, SFMono-Regular, Menlo, monospace',
        lineHeight: 1.55,
        userSelect: 'none',
      }}
      data-testid="world-surface-perf-hud"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ letterSpacing: '0.08em', opacity: 0.5 }}>PERF</div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0 2px',
              opacity: 0.6,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
          >
            ✕
          </button>
        )}
      </div>

      {row(
        'frame p50',
        `${frame.p50.toFixed(1)} ms`,
        tone(frame.p50, FRAME_BUDGET_MS, FRAME_BUDGET_MS * 2),
      )}
      {row(
        'frame p95',
        `${frame.p95.toFixed(1)} ms`,
        tone(frame.p95, FRAME_BUDGET_MS * 1.35, FRAME_BUDGET_MS * 2),
      )}
      {row('worst', `${frame.worst.toFixed(1)} ms`)}
      {row('fps (da p50)', frame.fps.toFixed(0))}
      {row('long frames', String(frame.longFrames), tone(frame.longFrames, 1, 10))}

      <div style={{ margin: '6px 0 4px', borderTop: '1px solid rgba(148,163,184,0.2)' }} />

      {row('layer decodificati', `${footprint.decoded}/${footprint.count}`)}
      {visibleLayerCount !== undefined && row('layer visibili', String(visibleLayerCount))}
      {row('RGBA in memoria', `${footprint.rgbaMb.toFixed(0)} MB`, tone(footprint.rgbaMb, 256, 512))}
      {row(
        'edge massimo',
        `${footprint.maxEdgePx} px`,
        tone(footprint.maxEdgePx, TEXTURE_EDGE_LIMIT_PX, TEXTURE_EDGE_LIMIT_PX + 1),
      )}
      {row(
        `oltre ${TEXTURE_EDGE_LIMIT_PX}px`,
        String(footprint.overTextureLimit),
        tone(footprint.overTextureLimit, 1, 1),
      )}

      <div style={{ margin: '6px 0 4px', borderTop: '1px solid rgba(148,163,184,0.2)' }} />

      {row('DPR', String(typeof window !== 'undefined' ? window.devicePixelRatio : 1))}
      {zoom !== undefined && row('zoom', zoom.toFixed(2))}
      {row('campioni', String(frame.samples))}
    </div>
  );
};

export default WorldSurfacePerfHud;
