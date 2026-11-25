/**
 * HudRealVoce — the narrator's voice (PLAN-110 C10): portrait bust medallion with an empty emerald
 * plaque (scripts/hud-real/build-plate-assets.py). Title and text are live content in code.
 * A view only; the caller owns when it appears (toast, quest line, world event).
 *
 * R-338 (Director): the bust is the persistent part — always mounted. The plaque (bandiera) only
 * exists while there is a current message (`children` non-null); a new `messageKey` while open
 * replaces the text with an exit/enter pass (never a queue); a click on the bust reopens the
 * current message after a dismiss.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  children?: ReactNode;
  /** Identity of the current message: a change while the plaque is open swaps the text with an
   *  exit/enter pass (Director R-338 — replace, never queue); same key with fresher text updates in place. */
  messageKey?: string;
  /** Close after this many ms (default: stays until dismissed). Hover and focus hold it open. */
  autoCloseMs?: number;
  /** Called after the exit animation, or on Escape / the close control. */
  onDismiss?: () => void;
  /** Called when the bust reopens the plaque over a still-current message. */
  onReopen?: () => void;
  /** Labels (i18n owned by the caller). */
  labels?: { expand: string; collapse: string; dismiss: string; bust?: string };
}

export function HudRealVoce({ title, children, messageKey, autoCloseMs, onDismiss, onReopen, labels = { expand: 'Leggi tutto', collapse: 'Riduci', dismiss: 'Chiudi' } }: HudRealVoceProps) {
  const f = P.field;
  const msgKey = messageKey ?? '';
  const [expanded, setExpanded] = useState(false);
  const [held, setHeld] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [entering, setEntering] = useState(false);
  const [plaqueOpen, setPlaqueOpen] = useState(children != null);
  const [displayed, setDisplayed] = useState<{ title?: string; children?: ReactNode; key: string }>({ title, children, key: msgKey });
  /* The pending leave lives in refs, not in an effect cleanup — a re-render must never cancel it.
   *  `nextRef` always holds the latest incoming message so a mid-leave change lands correctly;
   *  `foldRef` marks a leave that should end plaque-closed (dismiss / feed gone silent). */
  const leaveTimer = useRef<number | null>(null);
  const nextRef = useRef({ title, children, key: msgKey });
  const foldRef = useRef(false);
  useEffect(() => { nextRef.current = { title, children, key: msgKey }; });
  useEffect(() => () => { if (leaveTimer.current != null) window.clearTimeout(leaveTimer.current); }, []);
  const startLeave = () => {
    if (leaveTimer.current != null) window.clearTimeout(leaveTimer.current);
    setLeaving(true);
    leaveTimer.current = window.setTimeout(() => {
      leaveTimer.current = null;
      const fold = foldRef.current;
      foldRef.current = false;
      setDisplayed(nextRef.current);
      setLeaving(false);
      if (fold || nextRef.current.children == null) { setPlaqueOpen(false); if (fold) onDismiss?.(); }
    }, 240);
  };
  /* Director: closing hides ONLY the plaque (bandiera) — the bust stays; clicking the bust reopens it. */
  const dismiss = () => {
    if (leaving || !plaqueOpen) return;
    foldRef.current = true;
    startLeave();
  };
  /* Feed-driven lifecycle (R-338): silence folds the plaque away; a new message opens it — swapping
   *  the text under one open plaque via the leave transition; a fresher text for the same message
   *  updates in place without re-animating. While a leave animates, the pending timer applies the
   *  latest message on completion (nextRef), so arrivals mid-leave are never dropped nor doubled. */
  useEffect(() => {
    if (leaving) return;
    const has = children != null;
    const isNew = has && displayed.key !== msgKey;
    if (!has) {
      if (plaqueOpen) startLeave();
      else if (displayed.children != null) setDisplayed({ children: null, key: msgKey });
      return;
    }
    if (!isNew) {
      setDisplayed((d) => (d.title === title && d.children === children ? d : { title, children, key: msgKey }));
      return;
    }
    if (plaqueOpen) startLeave();
    else { setDisplayed(nextRef.current); setPlaqueOpen(true); setEntering(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgKey, title, children, plaqueOpen, leaving]);
  /* The re-open slides the plaque in from the left — one rAF so the transition actually plays. */
  useEffect(() => {
    if (!entering) return;
    const id = window.requestAnimationFrame(() => setEntering(false));
    return () => window.cancelAnimationFrame(id);
  }, [entering]);
  useEffect(() => {
    if (!autoCloseMs || held || expanded || !plaqueOpen || leaving) return;
    const id = window.setTimeout(dismiss, autoCloseMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCloseMs, held, expanded, plaqueOpen, leaving]);
  return (
    <section data-hudreal-voce="" data-expanded={expanded ? 'true' : 'false'} aria-live="polite"
      onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}
      onKeyDown={(e) => { if (e.key === 'Escape') dismiss(); }}
      style={{ position: 'relative', userSelect: 'none', width: P.w, height: P.h }}>
      <style>{SCOPED_CSS}</style>
      {/* bust: the persistent part — never leaves; a click reopens the plaque over a live message.
       *  Second-level chrome (HUD critique run 2026-11-24, Director pick B2+H2): the bust runs at
       *  78% brightness so day/resources/nav lead the hierarchy; the gold drop-shadow follows the
       *  painted silhouette (affordance) and the brass ↻ chip appears only while a dismissed
       *  message can actually be reopened. The plaque stays full-bright — it is live content. */}
      <button type="button" data-hr-voce-bust="" aria-expanded={plaqueOpen} aria-label={plaqueOpen ? undefined : displayed.children != null ? `${displayed.title ?? ''} — ${labels.expand}` : labels.bust ?? `${labels.expand}`}
        onClick={() => { if (!plaqueOpen && displayed.children != null) { setPlaqueOpen(true); setEntering(true); onReopen?.(); } }}
        style={{ position: 'absolute', left: 0, width: BUST_W, height: BUST_H, top: 0, padding: 0, border: 0, background: 'none', cursor: !plaqueOpen && displayed.children != null ? 'pointer' : 'default', filter: 'brightness(.78)' }}>
        <img src={BUST_ASSET} alt="" draggable={false} style={{ display: 'block', width: BUST_W, height: BUST_H, filter: 'drop-shadow(0 0 10px rgba(240,201,135,.75)) drop-shadow(0 0 3px rgba(20,12,4,.9))' }} />
        {!plaqueOpen && displayed.children != null && (
          <span aria-hidden="true" style={{
            position: 'absolute', left: '50%', top: '66.7%', transform: 'translate(-50%,-50%)', width: 30, height: 30, borderRadius: '50%',
            background: 'radial-gradient(circle at 42% 32%, #f6e3a4, #8a6a2a 82%)', boxShadow: '0 0 0 1.5px rgba(20,12,4,.85), 0 0 8px rgba(240,201,135,.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#241a08', font: '700 16px Georgia', pointerEvents: 'none',
          }}>↻</span>
        )}
      </button>
      {/* plaque: the dismissible bandiera — mounted only while a message is current */}
      {plaqueOpen && (
      <div data-hr-voce-plaque="" aria-hidden={!plaqueOpen}
        style={{ position: 'absolute', left: PLAQUE_X, top: 0, width: P.w - PLAQUE_X, height: P.h, overflow: 'hidden' }}>
        <div data-hr-voce-plaque-anim="" style={{
          position: 'absolute', left: -PLAQUE_X, top: 0, width: P.w, height: P.h,
          transform: leaving || entering ? 'translateX(-24px)' : undefined, opacity: leaving || entering ? 0 : 1,
          transition: 'transform 240ms ease-in, opacity 240ms ease-in',
        }}>
          <img src={ASSET} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
          <div style={{
            position: 'absolute', left: f.x - GROW, top: f.y - GROW, width: f.w + GROW * 2, height: f.h + GROW * 2, boxSizing: 'border-box',
            padding: '0 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: expanded ? 'visible' : 'hidden',
            ...(expanded ? { height: 'auto', minHeight: f.h + GROW * 2, top: 'auto', bottom: P.h - (f.y + f.h + GROW), background: 'linear-gradient(180deg, rgba(9, 52, 40, 0.97), rgba(7, 40, 32, 0.97))', borderRadius: 8, boxShadow: '0 4px 18px rgba(0, 0, 0, 0.55)', paddingTop: 8, paddingBottom: 8 } : {}),
            fontFamily: '"Cardo", serif', color: C.text, textShadow: C.shadow,
          }}>
            {displayed.title && <span style={{ fontFamily: 'Marcellus, "Cardo", serif', fontSize: 14, lineHeight: '16px', letterSpacing: 1, color: C.title, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayed.title}</span>}
            <span data-hr-voce-text="" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((v) => !v); } }}
              style={{ fontSize: 15, lineHeight: '17px', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: expanded ? 12 : displayed.title ? 3 : 4, overflow: 'hidden' }}>{displayed.children}</span>
          </div>
          <div style={{ position: 'absolute', left: f.x + f.w - 92, top: f.y + f.h + GROW + 2, display: 'flex', gap: 6 }}>
            <button type="button" data-hr-voce-expand="" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}
              style={{ font: '600 12px "Cardo", serif', color: C.title, background: 'rgba(5, 32, 26, 0.85)', border: '1px solid rgba(240, 213, 140, 0.5)', borderRadius: 10, padding: '1px 9px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{expanded ? labels.collapse : labels.expand}</button>
            <button type="button" data-hr-voce-close="" aria-label={labels.dismiss} onClick={dismiss}
              style={{ font: '700 12px "Cardo", serif', color: C.title, background: 'rgba(5, 32, 26, 0.85)', border: '1px solid rgba(240, 213, 140, 0.5)', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', padding: 0 }}>×</button>
          </div>
        </div>
      </div>
      )}
    </section>
  );
}
