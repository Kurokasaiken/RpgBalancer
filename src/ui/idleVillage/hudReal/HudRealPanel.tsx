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
/* F.action: the free enamel of the button (after the medallion, before the tip), measured on the cropped button (2026-11-05) */
const CTA = F.action;
/* text column height minus kicker, a two-line title and margins, in 19 px lines */


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
  /* Text starts at the top of the alabaster field and runs beside the window; the free block below starts under the window.
   * The window is drawn only when an illustration exists (F2: never an empty glass window); without it the text uses the full field width. */
  const hasWindow = !!illustration;
  const textLeft = F.field.x + PAD;
  const textW = (hasWindow ? F.window.x - 8 : F.field.x + F.field.w - PAD) - textLeft;
  const textTop = F.field.y + 6;
  const belowTop = hasWindow ? F.window.y + F.window.h + 8 : textTop + 160;
  return (
    <section data-hudreal-panel="" aria-label={ariaLabel ?? title} style={{ position: 'relative', userSelect: 'none', width: F.w, height: F.h }}>
      <style>{SCOPED_CSS}</style>
      <img src={ASSET} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', left: textLeft, top: textTop, width: textW, height: belowTop - textTop - 8,
        overflow: 'hidden', fontFamily: '"EB Garamond", serif', color: C.ink,
      }}>
        {kicker && <div style={{ fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kicker}</div>}
        <div style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 21, fontWeight: 600, lineHeight: '23px', margin: '1px 0 3px', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{title}</div>
        {body && <div style={{ fontSize: 16, lineHeight: '21px', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: Math.max(2, Math.floor((belowTop - textTop - 8 - 16 - 46) / 21)), overflow: 'hidden' }}>{body}</div>}
      </div>
      {hasWindow && (
        <div data-hr-window="" style={{
          position: 'absolute', left: F.window.x, top: F.window.y, width: F.window.w, height: F.window.h,
          overflow: 'hidden', display: 'grid', placeItems: 'center', borderRadius: '30px 30px 18px 18px / 26px 26px 18px 18px',
        }}>{illustration}</div>
      )}
      {children && (
        <div style={{
          position: 'absolute', left: textLeft, right: F.w - (F.field.x + F.field.w) + PAD, top: belowTop,
          height: CTA.y - belowTop - 4, overflow: 'hidden', fontFamily: '"EB Garamond", serif', color: C.ink, fontSize: 16,
        }}>{children}</div>
      )}
      {action && (
        <button type="button" data-hr-cta="" disabled={action.disabled} onClick={action.onClick}
          style={{
            position: 'absolute', left: CTA.x, top: CTA.y, width: CTA.w, height: CTA.h, background: 'transparent',
            border: 0, padding: 0, cursor: action.disabled ? 'default' : 'pointer', opacity: action.disabled ? 0.55 : 1,
            fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 16, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', whiteSpace: 'nowrap',
            color: C.cta, textShadow: C.shadow,
          }}>{action.label}</button>
      )}
    </section>
  );
}
