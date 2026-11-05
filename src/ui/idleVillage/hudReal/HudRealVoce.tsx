/**
 * HudRealVoce — the narrator's voice (PLAN-110 C10): portrait bust medallion with an empty emerald
 * plaque (scripts/hud-real/build-plate-assets.py). Title and text are live content in code.
 * A view only; the caller owns when it appears (toast, quest line, world event).
 */
import { useEffect, useState, type ReactNode } from 'react';
import { VOCE_PIECE as P } from './vocePieceGeometry';

const ASSET = '/assets/ui/hud-real/voce/piece.webp';
const C = { title: '#f0d58c', text: '#f3ead0', shadow: '0 1px 2px rgba(3, 26, 30, 0.9)' } as const;
const GROW = 5;

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
  const dismiss = () => { if (leaving) return; setLeaving(true); window.setTimeout(() => onDismiss?.(), 240); };
  useEffect(() => {
    if (!autoCloseMs || held || expanded) return;
    const id = window.setTimeout(dismiss, autoCloseMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCloseMs, held, expanded]);
  return (
    <section data-hudreal-voce="" data-leaving={leaving ? 'true' : 'false'} data-expanded={expanded ? 'true' : 'false'} aria-live="polite" tabIndex={0}
      onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}
      onKeyDown={(e) => { if (e.key === 'Escape') dismiss(); else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((v) => !v); } }} style={{ position: 'relative', userSelect: 'none', width: P.w, height: P.h }}>
      <style>{SCOPED_CSS}</style>
      <img src={ASSET} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', left: f.x - GROW, top: f.y - GROW, width: f.w + GROW * 2, height: f.h + GROW * 2, boxSizing: 'border-box',
        padding: '0 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: expanded ? 'visible' : 'hidden',
        ...(expanded ? { height: 'auto', minHeight: f.h + GROW * 2, top: 'auto', bottom: P.h - (f.y + f.h + GROW), background: 'linear-gradient(180deg, rgba(9, 52, 40, 0.97), rgba(7, 40, 32, 0.97))', borderRadius: 8, boxShadow: '0 4px 18px rgba(0, 0, 0, 0.55)', paddingTop: 8, paddingBottom: 8 } : {}),
        fontFamily: '"EB Garamond", serif', color: C.text, textShadow: C.shadow,
      }}>
        {title && <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 13, lineHeight: '16px', letterSpacing: 1, color: C.title, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>}
        <span data-hr-voce-text="" style={{ fontSize: 14, lineHeight: '16px', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: expanded ? 12 : title ? 3 : 4, overflow: 'hidden' }}>{children}</span>
      </div>
      <div style={{ position: 'absolute', left: f.x + f.w - 92, top: f.y + f.h + GROW + 2, display: 'flex', gap: 6 }}>
        <button type="button" data-hr-voce-expand="" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}
          style={{ font: '600 12px \"EB Garamond\", serif', color: C.title, background: 'rgba(5, 32, 26, 0.85)', border: '1px solid rgba(240, 213, 140, 0.5)', borderRadius: 10, padding: '1px 9px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{expanded ? labels.collapse : labels.expand}</button>
        <button type="button" data-hr-voce-close="" aria-label={labels.dismiss} onClick={dismiss}
          style={{ font: '700 12px \"EB Garamond\", serif', color: C.title, background: 'rgba(5, 32, 26, 0.85)', border: '1px solid rgba(240, 213, 140, 0.5)', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', padding: 0 }}>×</button>
      </div>
    </section>
  );
}
