/**
 * HudRealPanel — contextual information panel of PLAN-110 C4, built from the generated frame
 * (scripts/hud-real/build-panel-assets.py): ivory alabaster field, a tall dark-glass window on
 * the right (illustration slot) and an emerald enamel plaque at the bottom (call-to-action).
 *
 * A generic shell for any "detail + action" panel (quest, expedition, building, POI): the caller
 * supplies kicker, title, text, an optional illustration, free rows below, and the action.
 * Text, illustration and label are live content in code, never in the image. A view only.
 */
import type { ReactNode } from 'react';
import { PANEL_FRAME as F } from './panelFrameGeometry';

const ASSET = '/assets/ui/hud-real/panel/frame.webp';
const C = { ink: '#2b2118', muted: '#6b5a3e', cta: '#f3ead0', focus: '#e8c766', shadow: '0 1px 2px rgba(3, 26, 30, 0.85)' } as const;
const PAD = 12;
/* the measured plaque box is the eroded green only: the real enamel is about twice as tall, centre the label on it */
const CTA = { x: F.plaque.x, y: F.plaque.y, w: F.plaque.w, h: Math.max(F.plaque.h, 40) };
/* text column height minus kicker, a two-line title and margins, in 19 px lines */
const BODY_LINES = Math.max(2, Math.floor((F.window.h - 15 - 44 - 14) / 19));

const SCOPED_CSS = `
[data-hudreal-panel] [data-hr-cta]:focus { outline: none; }
[data-hudreal-panel] [data-hr-cta]:focus-visible { outline: 2px solid ${C.focus}; outline-offset: 2px; border-radius: 10px; }
[data-hudreal-panel] [data-hr-cta]:not(:disabled):hover { filter: brightness(1.15); }
`;

export interface HudRealPanelProps {
  kicker?: string;
  title: string;
  /** Paragraph(s) beside the illustration. */
  body?: ReactNode;
  /** Fills the dark-glass window (an <img> or any node). Empty when omitted. */
  illustration?: ReactNode;
  /** Free content under the text/illustration (rewards, requirements...). */
  children?: ReactNode;
  action?: { label: string; onClick?: () => void; disabled?: boolean };
  /** Accessible name of the panel region. */
  ariaLabel?: string;
}

export function HudRealPanel({ kicker, title, body, illustration, children, action, ariaLabel }: HudRealPanelProps) {
  const textRight = F.window.x - 8;
  const belowTop = F.window.y + F.window.h + 2;
  return (
    <section data-hudreal-panel="" aria-label={ariaLabel ?? title} style={{ position: 'relative', userSelect: 'none', width: F.w, height: F.h }}>
      <style>{SCOPED_CSS}</style>
      <img src={ASSET} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', left: F.field.x + PAD, top: F.window.y, width: textRight - F.field.x - PAD, height: F.window.h,
        overflow: 'hidden', fontFamily: '"EB Garamond", serif', color: C.ink,
      }}>
        {kicker && <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kicker}</div>}
        <div style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 18, fontWeight: 600, lineHeight: '22px', margin: '2px 0 6px', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{title}</div>
        {body && <div style={{ fontSize: 13.5, lineHeight: '19px', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: BODY_LINES, overflow: 'hidden' }}>{body}</div>}
      </div>
      <div data-hr-window="" style={{
        position: 'absolute', left: F.window.x, top: F.window.y, width: F.window.w, height: F.window.h,
        overflow: 'hidden', display: 'grid', placeItems: 'center', borderRadius: '36px 36px 22px 22px / 30px 30px 22px 22px',
      }}>{illustration}</div>
      {children && (
        <div style={{
          position: 'absolute', left: F.field.x + PAD, right: F.w - (F.field.x + F.field.w) + PAD, top: belowTop,
          height: CTA.y - belowTop - 2, overflow: 'hidden', fontFamily: '"EB Garamond", serif', color: C.ink, fontSize: 13.5,
        }}>{children}</div>
      )}
      {action && (
        <button type="button" data-hr-cta="" disabled={action.disabled} onClick={action.onClick}
          style={{
            position: 'absolute', left: CTA.x, top: CTA.y, width: CTA.w, height: CTA.h, background: 'transparent',
            border: 0, padding: 0, cursor: action.disabled ? 'default' : 'pointer', opacity: action.disabled ? 0.55 : 1,
            fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 16, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
            color: C.cta, textShadow: C.shadow,
          }}>{action.label}</button>
      )}
    </section>
  );
}
