/**
 * HudRealVoce — the narrator's voice (PLAN-110 C10): portrait bust medallion with an empty emerald
 * plaque (scripts/hud-real/build-plate-assets.py). Title and text are live content in code.
 * A view only; the caller owns when it appears (toast, quest line, world event).
 */
import { useEffect, useState, type ReactNode } from 'react';
import { VOCE_PIECE as P } from './vocePieceGeometry';

const ASSET = '/assets/ui/hud-real/voce/piece.webp';
const BUST_ASSET = '/assets/ui/hud-real/voce/bust.webp';
const C = { title: '#f0d58c', text: '#f3ead0', shadow: '0 1px 2px rgba(3, 26, 30, 0.9)' } as const;
const GROW = 5;
/** The bust half of the piece (voce/bust.webp, cut left of the plaque) in design px. */
const BUST_W = 260;
const BUST_H = 230.5;
/** The plaque half of the piece inside the same 440 design px. */
const PLAQUE_X = 192.5;

const SCOPED_CSS = `
@keyframes hrVoceIn { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
@keyframes hrVoceOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-24px); } }
[data-hudreal-voce] { animation: hrVoceIn 320ms cubic-bezier(.2,.8,.25,1) both; }
[data-hudreal-voce][data-leaving="true"] { animation: hrVoceOut 240ms ease-in both; }
[data-hudreal-voce]:focus { outline: none; }
[data-hudreal-voce]:focus-visible { outline: 2px solid #e8c766; outline-offset: 2px; border-radius: 10px; }
@media (prefers-reduced-motion: reduce) { [data-hudreal-voce], [data-hudreal-voce][data-leaving="true"] { animation: none; } }
`;

export interface HudRealVoceProps {
  title?: string;
  children: ReactNode;
  /** Close after this many ms (default: stays until dismissed). Hover and focus hold it open. */
  autoCloseMs?: number;
  /** Called after the exit animation, or on Escape / the close control. */
  onDismiss?: () => void;
  /** Labels (i18n owned by the caller). */
  labels?: { expand: string; collapse: string; dismiss: string };
}

export function HudRealVoce({ title, children, autoCloseMs, onDismiss, labels = { expand: 'Leggi tutto', collapse: 'Riduci', dismiss: 'Chiudi' } }: HudRealVoceProps) {
  const f = P.field;
  const [expanded, setExpanded] = useState(false);
  const [held, setHeld] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [plaqueOpen, setPlaqueOpen] = useState(true);
  /* Director: closing hides ONLY the plaque (bandiera) — the bust stays; clicking the bust reopens it. */
  const dismiss = () => {
    if (leaving || !plaqueOpen) return;
    setLeaving(true);
    window.setTimeout(() => { setPlaqueOpen(false); setLeaving(false); onDismiss?.(); }, 240);
  };
  useEffect(() => {
    if (!autoCloseMs || held || expanded || !plaqueOpen) return;
    const id = window.setTimeout(dismiss, autoCloseMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCloseMs, held, expanded, plaqueOpen]);
  return (
    <section data-hudreal-voce="" data-expanded={expanded ? 'true' : 'false'} aria-live="polite"
      onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}
      onKeyDown={(e) => { if (e.key === 'Escape') dismiss(); }}
      style={{ position: 'relative', userSelect: 'none', width: P.w, height: P.h }}>
      <style>{SCOPED_CSS}</style>
      {/* bust: the persistent part — never leaves; a click reopens the plaque */}
      <button type="button" data-hr-voce-bust="" aria-expanded={plaqueOpen} aria-label={plaqueOpen ? undefined : `${title ?? ''} — ${labels.expand}`}
        onClick={() => { if (!plaqueOpen) setPlaqueOpen(true); }}
        style={{ position: 'absolute', left: 0, width: BUST_W, height: BUST_H, top: 0, padding: 0, border: 0, background: 'none', cursor: plaqueOpen ? 'default' : 'pointer' }}>
        <img src={BUST_ASSET} alt="" draggable={false} style={{ display: 'block', width: BUST_W, height: BUST_H }} />
      </button>
      {/* plaque: the dismissible bandiera — only this part leaves when closed */}
      <div data-hr-voce-plaque="" aria-hidden={!plaqueOpen}
        style={{ position: 'absolute', left: PLAQUE_X, top: 0, width: P.w - PLAQUE_X, height: P.h, overflow: 'hidden', display: plaqueOpen ? 'block' : 'none' }}>
        <div data-hr-voce-plaque-anim="" style={{
          position: 'absolute', left: -PLAQUE_X, top: 0, width: P.w, height: P.h,
          transform: leaving ? 'translateX(-24px)' : undefined, opacity: leaving ? 0 : 1,
          transition: 'transform 240ms ease-in, opacity 240ms ease-in',
        }}>
          <img src={ASSET} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
          <div style={{
            position: 'absolute', left: f.x - GROW, top: f.y - GROW, width: f.w + GROW * 2, height: f.h + GROW * 2, boxSizing: 'border-box',
            padding: '0 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: expanded ? 'visible' : 'hidden',
            ...(expanded ? { height: 'auto', minHeight: f.h + GROW * 2, top: 'auto', bottom: P.h - (f.y + f.h + GROW), background: 'linear-gradient(180deg, rgba(9, 52, 40, 0.97), rgba(7, 40, 32, 0.97))', borderRadius: 8, boxShadow: '0 4px 18px rgba(0, 0, 0, 0.55)', paddingTop: 8, paddingBottom: 8 } : {}),
            fontFamily: '"EB Garamond", serif', color: C.text, textShadow: C.shadow,
          }}>
            {title && <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 14, lineHeight: '16px', letterSpacing: 1, color: C.title, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>}
            <span data-hr-voce-text="" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((v) => !v); } }}
              style={{ fontSize: 15, lineHeight: '17px', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: expanded ? 12 : title ? 3 : 4, overflow: 'hidden' }}>{children}</span>
          </div>
          <div style={{ position: 'absolute', left: f.x + f.w - 92, top: f.y + f.h + GROW + 2, display: 'flex', gap: 6 }}>
            <button type="button" data-hr-voce-expand="" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}
              style={{ font: '600 12px "EB Garamond", serif', color: C.title, background: 'rgba(5, 32, 26, 0.85)', border: '1px solid rgba(240, 213, 140, 0.5)', borderRadius: 10, padding: '1px 9px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{expanded ? labels.collapse : labels.expand}</button>
            <button type="button" data-hr-voce-close="" aria-label={labels.dismiss} onClick={dismiss}
              style={{ font: '700 12px "EB Garamond", serif', color: C.title, background: 'rgba(5, 32, 26, 0.85)', border: '1px solid rgba(240, 213, 140, 0.5)', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', padding: 0 }}>×</button>
          </div>
        </div>
      </div>
    </section>
  );
}
