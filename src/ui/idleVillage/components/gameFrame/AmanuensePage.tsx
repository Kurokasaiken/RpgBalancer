/**
 * AmanuensePage — the transient scribal folio (PLAN-085, R-279,
 * VF-AMAN-001 option A: floating vellum sheet on the dark lacquer HUD).
 *
 * Pure presentation: the long-form content arrives resolved via props
 * (`LongForm` config + i18n-resolved strings); layout semantics (swap with
 * CompanionLeft, sheet degrade) live in the cluster integration (T-003).
 * All visual values come from `getAmanuenseSkinConfig()` — no hardcoded
 * palette/typography; a11y contract: role=complementary, labelledby the
 * incipit, scrollable region reachable by keyboard, wax-seal close in
 * every mode.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from '@/ui/idleVillage/hooks/useReducedMotion';
import { useTranslation } from 'react-i18next';
import { getAmanuenseSkinConfig } from '@/ui/idleVillage/skins/amanuenseSkinConfig';
import {
  amanuenseInitialLetter,
  parseAmanuenseMarkup,
  type AmanuenseSegment,
} from '@/ui/idleVillage/quests/amanuenseMarkup';
import type { LongFormSchemaType } from '@/balancing/config/idleVillage/quests/questScenario.schema';

export interface AmanuensePageProps {
  /** The authored long-form block for the current quest node. */
  longForm: LongFormSchemaType;
  /** Called by the wax-seal close control and Esc scoping. */
  onClose: () => void;
  /** Lore-drop title when variant is 'lore' (seal emblem source). */
  loreCategory?: string;
  /** Stable identity for the one-shot ceremony (default: first paragraph key). */
  pageKey?: string;
}

const NOISE_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 .8 0 0 0 0 .7 0 0 0 0 .5 0 0 0 .06 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E";

const CORNER_SVG = (vine: string, rubric: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 56'><g fill='none' stroke='${vine}' stroke-width='1.8'><path d='M4 52 C4 26 26 4 52 4'/><path d='M12 52 C12 32 32 12 52 12'/><path d='M4 44 q10-2 14 8' fill='${vine}'/><path d='M44 4 q-2 10 8 14' fill='${vine}'/><circle cx='20' cy='20' r='3.5' fill='${rubric}'/></g></svg>`,
  )}`;

const VINE_TILE = (vine: string, horizontal: boolean) =>
  `data:image/svg+xml,${encodeURIComponent(
    horizontal
      ? `<svg xmlns='http://www.w3.org/2000/svg' width='52' height='16'><g fill='none' stroke='${vine}' stroke-width='1.5'><path d='M0 8 C10 2 16 14 26 8 C36 2 42 14 52 8'/></g></svg>`
      : `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='52'><g fill='none' stroke='${vine}' stroke-width='1.6'><path d='M10 0 C2 10 18 16 10 26 C2 36 18 42 10 52'/><path d='M10 8 q-5 3 0 6' fill='${vine}'/><path d='M10 34 q5 3 0 6' fill='${vine}'/></g></svg>`,
  )}`;

function MarkupText({ text, rubric, ink, gold }: { text: string; rubric: string; ink: string; gold: string }) {
  const segs = useMemo(() => parseAmanuenseMarkup(text), [text]);
  if (!segs) return <>{text}</>;
  return (
    <>
      {segs.map((s: AmanuenseSegment, i: number) =>
        s.kind === 'rubric' ? (
          <span key={i} style={{ color: rubric }}>{s.text}</span>
        ) : s.kind === 'gilt' ? (
          <span key={i} style={{ color: ink, borderBottom: `2px solid ${gold}` }}>{s.text}</span>
        ) : s.kind === 'gloss' ? (
          <span key={i} style={{ color: rubric, borderBottom: `1px dotted ${rubric}` }}>{s.text}</span>
        ) : (
          <React.Fragment key={i}>{s.text}</React.Fragment>
        ),
      )}
    </>
  );
}

/* Pages whose one-shot ceremony this session already painted — a remount
 *  hydrates straight to `resolved` (deepseek r003: repeat opens = fade). */
const seenPages = new Set<string>();

const CEREMONY_CSS = `
@keyframes amanu-frame-draw { from { opacity:0; clip-path: inset(0 0 100% 0); } to { opacity:1; clip-path: inset(0); } }
@keyframes amanu-ink { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: none; } }
`;

export const AmanuensePage: React.FC<AmanuensePageProps> = ({ longForm, onClose, loreCategory, pageKey }) => {
  const skin = getAmanuenseSkinConfig();
  const { t } = useTranslation('idleVillage');
  const { palette: P, fonts: F, type: T } = skin;
  const isLore = longForm.variant === 'lore';
  const reducedMotion = useReducedMotion();
  const key = pageKey ?? longForm.paragraphKeys[0] ?? 'amanuense';
  const ceremonyRef = useRef(false);
  const [ceremony, setCeremony] = React.useState(() => !reducedMotion && !seenPages.has(key));
  useEffect(() => {
    if (!ceremonyRef.current && ceremony) {
      ceremonyRef.current = true;
      seenPages.add(key);
    }
  }, [ceremony, key]);
  const anim = (delayMs: number): React.CSSProperties =>
    ceremony ? { animation: `amanu-ink 400ms ease-out ${delayMs}ms backwards` } : {};
  const parchment = isLore ? P.loreParchment : P.parchment;

  const paragraphs = longForm.paragraphKeys.map((k) => t(k, k));
  const initial = amanuenseInitialLetter(paragraphs[0] ?? '');
  const glosses = longForm.marginalia.filter((m) => m.kind === 'gloss' || m.kind === 'nota');
  const glossFor = (idx: number) => glosses.filter((g) => g.afterParagraph === idx);

  return (
    <aside
      role="complementary"
      aria-labelledby="amanuense-incipit"
      data-testid="amanuense-page"
      data-ceremony={ceremony ? 'play' : 'skip'}
      style={{ position: 'relative', width: '100%', height: '100%', color: P.ink }}
    >
      {ceremony && <style>{CEREMONY_CSS}</style>}
      {/* Vellum surface — option A: floating sheet, no bound cover. */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(140% 100% at 50% 0%, #f6ead0 0%, ${parchment} 55%, ${P.parchmentEdge} 100%)`,
          boxShadow: 'inset 0 0 60px rgba(120,80,20,.25), inset 0 0 12px rgba(90,60,15,.3)',
        }}
      />
      <div
        aria-hidden
        style={{ position: 'absolute', inset: 0, opacity: 0.55, mixBlendMode: 'multiply', backgroundImage: `url("${NOISE_SVG}")` }}
      />
      {/* Composed frame: corners + vine edges + gold rules (never 9-slice). */}
      {longForm.tier >= 2 && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...(ceremony ? { animation: `amanu-frame-draw 600ms ease-out backwards` } : {}) }}>
          {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
            <img
              key={c}
              src={CORNER_SVG(P.vine, P.rubric)}
              alt=""
              style={{
                position: 'absolute', width: 56, height: 56,
                top: c.startsWith('t') ? 6 : undefined, bottom: c.startsWith('b') ? 6 : undefined,
                left: c.endsWith('l') ? 6 : undefined, right: c.endsWith('r') ? 6 : undefined,
                transform: `${c === 'tr' ? 'scaleX(-1)' : ''}${c === 'bl' ? 'scaleY(-1)' : ''}${c === 'br' ? 'scale(-1)' : ''}`,
              }}
            />
          ))}
          {(['l', 'r'] as const).map((s) => (
            <div
              key={s}
              style={{
                position: 'absolute', [s]: 10, top: 64, bottom: 64, width: 20,
                backgroundImage: `url("${VINE_TILE(P.vine, false)}")`, backgroundRepeat: 'repeat',
                transform: s === 'r' ? 'scaleX(-1)' : undefined,
              } as React.CSSProperties}
            />
          ))}
          {(['t', 'b'] as const).map((s) => (
            <div
              key={s}
              style={{
                position: 'absolute', [s === 't' ? 'top' : 'bottom']: 10, left: 64, right: 64, height: 16,
                backgroundImage: `url("${VINE_TILE(P.vine, true)}")`, backgroundRepeat: 'repeat-x',
              } as React.CSSProperties}
            />
          ))}
          <div style={{ position: 'absolute', top: 34, left: 36, right: 36, borderTop: `1px solid ${P.gold}`, opacity: 0.8 }} />
          <div style={{ position: 'absolute', bottom: 34, left: 36, right: 36, borderTop: `1px solid ${P.gold}`, opacity: 0.8 }} />
        </div>
      )}

      <span
        aria-hidden
        style={{
          position: 'absolute', top: 14, right: 20, fontSize: 12,
          fontVariant: 'small-caps', color: P.marginalia, letterSpacing: '0.08em',
        }}
      >
        fol. ij r
      </span>

      {/* Wax-seal close control — present in every mode (WITNESS-01). */}
      <button
        type="button"
        data-testid="amanuense-close"
        aria-label={t('gameFrame.amanuense.close', 'Close the scribe page')}
        onClick={onClose}
        style={{
          position: 'absolute', top: 10, right: 44, width: 44, height: 44,
          display: 'grid', placeItems: 'center', padding: 0,
          background: 'none', border: 'none', cursor: 'pointer', zIndex: 5,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 24, height: 24, borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, #b03028, #7a1710 60%, #4d0d08)`,
            boxShadow: '0 2px 5px rgba(0,0,0,.45), inset 0 -2px 4px rgba(0,0,0,.4)',
            display: 'grid', placeItems: 'center', fontSize: 11, color: '#f0d5a0',
          }}
        >
          ✕
        </span>
      </button>

      {/* Scrollable folio body — keyboard-reachable region. */}
      <div
        role="region"
        aria-label={t('gameFrame.amanuense.scrollRegion', 'Scribe page text')}
        tabIndex={0}
        style={{
          position: 'absolute', inset: 0, overflowY: 'auto',
          padding: '64px 46px 40px',
        }}
      >
        {longForm.incipitKey && (
          <h2
            id="amanuense-incipit"
            style={{
              margin: '0 0 4px', textAlign: 'center',
              fontFamily: F.incipit, fontSize: T.incipitPx,
              color: P.rubric, letterSpacing: '0.05em', fontWeight: 500,
            }}
          >
            {t(longForm.incipitKey, longForm.incipitKey)}
          </h2>
        )}
        <div aria-hidden style={{ height: 1, margin: '6px 0 12px', background: `linear-gradient(90deg, transparent, ${P.gold}, transparent)` }} />

        {paragraphs.map((ptext, i) => (
          <React.Fragment key={i}>
            <p
              style={{
                ...anim(600 + i * 60),
                margin: '0 0 10px', fontFamily: F.body,
                fontSize: T.bodyPx, lineHeight: T.lineHeight,
                textAlign: 'justify', hyphens: 'auto', color: P.ink,
              } as React.CSSProperties}
            >
              {i === 0 && (
                <span
                  aria-hidden
                  style={{
                    ...(ceremony ? { animation: 'amanu-ink 500ms ease-out 300ms backwards' } : {}),
                    float: 'left', width: 86, height: 86, marginRight: 10, marginBottom: 4,
                    position: 'relative', border: `2px solid ${P.goldLo}`,
                    background: `linear-gradient(135deg,#3a4a6a 0%,${P.ultramarine} 55%,#14284f 100%)`,
                    boxShadow: `inset 0 0 0 3px ${P.gold}, inset 0 0 14px rgba(0,0,0,.5)`,
                    display: 'grid', placeItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: F.lombardic, fontSize: 58, lineHeight: 1,
                      background: `linear-gradient(160deg,${P.goldHi},${P.gold} 55%,${P.goldLo})`,
                      WebkitBackgroundClip: 'text', backgroundClip: 'text',
                      color: 'transparent', textShadow: '0 1px 0 rgba(0,0,0,.35)',
                    }}
                  >
                    {initial}
                  </span>
                </span>
              )}
              <span style={{ fontFamily: F.body }}>
                {i === 0
                  ? /* first paragraph: the initial letter is the painted cap — render text minus its first glyph */
                    <MarkupText text={ptext.replace(/^[\p{L}\p{N}]/u, '')} rubric={P.rubric} ink={P.ink} gold={P.gold} />
                  : <MarkupText text={ptext} rubric={P.rubric} ink={P.ink} gold={P.gold} />}
              </span>
            </p>
            {glossFor(i).map((g, gi) => (
              <div
                key={gi}
                style={{
                  ...anim(1500 + gi * 100),
                  margin: '8px 0 10px 26px', paddingLeft: 22, position: 'relative',
                  fontStyle: 'italic', fontSize: T.glossPx, color: P.rubric,
                  fontFamily: F.body,
                }}
              >
                <span aria-hidden style={{ position: 'absolute', left: 0, top: 0, fontSize: 15 }}>☞</span>
                {g.kind === 'nota' ? 'NB: ' : ''}
                {g.lemma ? <em style={{ color: P.ink, borderBottom: `1px dotted ${P.rubric}` }}>{g.lemma}</em> : null}
                {g.lemma && g.textKey ? ' — ' : ''}
                {g.textKey ? t(g.textKey, g.textKey) : null}
              </div>
            ))}
          </React.Fragment>
        ))}

        {longForm.explicitKey && (
          <p style={{ margin: '14px 0 0', textAlign: 'center', color: P.rubric, fontSize: T.colophonPx, fontVariant: 'small-caps' }}>
            {t(longForm.explicitKey, longForm.explicitKey)}
          </p>
        )}
        {longForm.colophon && (
          <p style={{ margin: '16px 0 0', textAlign: 'center', color: '#6a4a2a', fontSize: T.colophonPx, fontVariant: 'small-caps', letterSpacing: '0.06em' }}>
            {t(longForm.colophon.scribeKey, longForm.colophon.scribeKey)}
            {longForm.colophon.placeKey ? `, ${t(longForm.colophon.placeKey, longForm.colophon.placeKey)}` : ''}
            {longForm.colophon.dateKey ? `, ${t(longForm.colophon.dateKey, longForm.colophon.dateKey)}` : ''}
            {longForm.colophon.complaintKey ? ` — ${t(longForm.colophon.complaintKey, longForm.colophon.complaintKey)}` : ''}
          </p>
        )}
      </div>

      {isLore && loreCategory && (
        <div
          aria-hidden
          style={{
            position: 'absolute', right: 22, bottom: 26, width: 46, height: 46,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #b03028, #7a1710 60%, #4d0d08)',
            boxShadow: '0 3px 8px rgba(0,0,0,.5), inset 0 -2px 5px rgba(0,0,0,.4)',
            display: 'grid', placeItems: 'center', fontSize: 19, color: '#f0d5a0',
          }}
        >
          {loreCategory.slice(0, 1).toUpperCase()}
        </div>
      )}
    </aside>
  );
};

export default AmanuensePage;
