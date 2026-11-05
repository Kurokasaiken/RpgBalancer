/**
 * HudRealRoster — roster column of PLAN-110 C1, built from the Director-approved
 * Gemini pieces (ring g4, plaque g4) restored by scripts/hud-real/build-roster-assets.py.
 *
 * Interaction (Director ruling 2026-11-03): the column shows only the portrait rings;
 * the name plaque slides out from behind its ring on hover, keyboard focus or
 * selection (touch: first tap opens, second tap selects). Reduced motion: no slide,
 * just appear.
 *
 * Data contract is the production roster's: ResidentState[] from the engine, locked
 * ids, select callback. Mechanics untouched: this is a view.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { heroLevelView } from '@/ui/idleVillage/rosterV2/heroLevelViewModel';
import { zanaraRosterState } from '@/ui/idleVillage/zanara/zanaraRosterState';
import { C1_GEOMETRY as G } from './c1Geometry';
import { C1_BAND as B } from './c1BandGeometry';
import { C1_ROWMOD as RM } from './c1RowModGeometry';
import { C1_RAIL as RAIL } from './c1RailGeometry';

const ASSETS = {
  // row module (ring fused to the band, as in the mockup) — scripts/hud-real/build-rowmod-assets.py
  ring: '/assets/ui/hud-real/C1/ring.webp',
  plaque: '/assets/ui/hud-real/C1/plaque.webp',
  crest: '/assets/ui/hud-real/C1/crest.webp',
  bandTile: '/assets/ui/hud-real/C1/rail-tile.webp',
  bandJoint: '/assets/ui/hud-real/C1/band-joint.webp',
  railEnd: '/assets/ui/hud-real/C1/rail-end.webp',
} as const;

/** Layout choices on top of the measured geometry (design px). */
const L = {
  pitch: 96,            // mockup row pitch 94 src px x 1600/1672
  visibleRows: 5,
  slidePx: 46,          // how far the plaque travels out from behind the ring
  slideMs: 200,
  text: { nameSize: 17, nameSizeLong: 14, longName: 10, subSize: 12, barH: 3, barGap: 2 },
  textWidth: 0.7,       // of the enamel field: the text stops before the diamond socket
  // Anchors measured on the chosen mockup (zanara-v2, src px x 1600/1672), relative to the
  // column's top-left at the screen corner: spine x 17..46, ring centres x 83.1, first y 262.2.
  bandCx: 31.6,
  ringCx: 70,           // the portrait ring sits centred on the wide backbone (rail-tile ~140 px wide)
  firstRingCy: 262.2,
  jointH: 46,           // the clasp is an accent between rings, not a second medallion
  arrowH: 18,
} as const;
/* ring drawn 10% larger than generated so the portraits have presence on the wide backbone */
const RK = 1.1;
const R = { w: G.ring.w * RK, h: G.ring.h * RK, hole: { cx: G.ring.hole.cx * RK, cy: G.ring.hole.cy * RK, r: G.ring.hole.r * RK } };
const inset = L.ringCx - R.hole.cx;
const jointK = L.jointH / B.joint.h;
const bandCx = L.ringCx;
const bandX = bandCx - RAIL.w / 2;

const C = {
  name: '#f1e8cc',
  sub: '#b9d2c4',
  exception: '#f0c987',
  fallen: '#93a4ad',
  hpFill: 'linear-gradient(180deg, #45dcaa, #149a72)',
  staminaFill: 'linear-gradient(180deg, #ecd28a, #b38a3a)',
  barTrack: 'rgba(3, 26, 30, 0.75)',
  focus: '#e8c766',
  textShadow: '0 1px 2px rgba(3, 26, 30, 0.9)',
  portraitShade: 'inset 0 0 8px 2px rgba(3, 26, 30, 0.65)',
} as const;

/** Plaque placed so its concave arc is concentric with the ring (measured arc centre). */
const ringCx = R.hole.cx;
const ringCy = R.hole.cy;
const plaqueLeft = ringCx - G.plaque.arc.cx;
const plaqueTop = ringCy - G.plaque.arc.cy;
const rowW = inset + plaqueLeft + G.plaque.w;
const ringTop = (L.pitch - R.h) / 2;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const SCOPED_CSS = `
[data-hudreal-roster] button { font: inherit; }
[data-hudreal-roster] [data-hr-ring][aria-pressed="true"] { filter: drop-shadow(0 0 7px rgba(240, 201, 135, 0.85)) drop-shadow(0 0 2px rgba(255, 232, 160, 0.9)); }
[data-hudreal-roster] [data-hr-row][data-open="true"] [data-hr-plaque] img { filter: none; }
[data-hudreal-roster] [data-hr-ring][aria-pressed="false"] ~ * { }
[data-hudreal-roster] button:focus { outline: none; }
[data-hudreal-roster] [data-hr-ring]:focus-visible { outline: 2px solid ${C.focus}; outline-offset: 2px; border-radius: 50%; }
[data-hudreal-roster] [data-hr-plaque] { transform: translateX(-${L.slidePx}px); opacity: 0; pointer-events: none; transition: transform ${L.slideMs}ms ease-out, opacity ${L.slideMs}ms ease-out; }
[data-hudreal-roster] [data-hr-row]:hover [data-hr-plaque],
[data-hudreal-roster] [data-hr-row]:focus-within [data-hr-plaque],
[data-hudreal-roster] [data-hr-row][data-open="true"] [data-hr-plaque] { transform: translateX(0); opacity: 1; pointer-events: auto; }
[data-hudreal-roster] [data-hr-list]::-webkit-scrollbar { display: none; }
[data-hudreal-roster] [data-hr-arrow] { opacity: .9; transition: opacity 150ms, transform 150ms; }
[data-hudreal-roster] [data-hr-arrow]:hover { opacity: 1; transform: scale(1.12); }
[data-hudreal-roster] [data-hr-arrow]:disabled { opacity: 0; pointer-events: none; }
[data-hudreal-roster] [data-hr-arrow]:focus-visible { outline: 2px solid ${C.focus}; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { [data-hudreal-roster] [data-hr-plaque] { transition: none; } }
`;

function Bar({ value, fill, label }: { value: number; fill: string; label: string }) {
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}
      style={{ height: L.text.barH, background: C.barTrack, borderRadius: L.text.barH / 2, overflow: 'hidden' }}>
      <div style={{ width: `${value * 100}%`, height: '100%', background: fill }} />
    </div>
  );
}

function Row({ resident, locked, lockedStatusLabel, selected, onSelect, joint, onKey, plaqueAtRest }: {
  resident: ResidentState; locked: boolean; lockedStatusLabel?: string; selected: boolean; onSelect?: (id: string) => void;
  /** draw the band clasp at the top of the row (every row but the first) */
  joint: boolean;
  onKey: (e: KeyboardEvent<HTMLButtonElement>) => void;
  /** keep the name plaque out at rest (mockup reference) instead of revealing it on hover */
  plaqueAtRest: boolean;
}) {
  const { t } = useTranslation('idleVillage');
  const [touchOpen, setTouchOpen] = useState(false);
  const view = zanaraRosterState(resident, locked);
  const { level } = heroLevelView(resident);
  const name = resident.displayName ?? resident.id;
  const stateLabel = view.labelKey ? t(view.labelKey) : view.state === 'locked' ? lockedStatusLabel ?? null : null;
  const levelText = level !== null ? t('gameFrame.heroLevel.badge', { n: level }) : null;
  const hp = clamp01(resident.maxHp > 0 ? resident.currentHp / resident.maxHp : 0);
  const stamina = clamp01(1 - resident.fatigue / 100);
  const portraitFilter = view.portrait === 'fallen' ? 'grayscale(1) brightness(0.7)' : view.portrait === 'veiled' ? 'saturate(0.6) brightness(0.75)' : 'none';
  const open = selected || touchOpen || plaqueAtRest;
  const f = G.plaque.field;
  const hole = R.hole;

  return (
    <div role="listitem" data-hr-row="" data-state={view.state} data-open={open ? 'true' : 'false'}
      style={{ position: 'relative', width: rowW, height: L.pitch, pointerEvents: 'none', scrollSnapAlign: 'start' }}>
      {joint && (
        <img src={ASSETS.bandJoint} alt="" draggable={false}
          style={{ position: 'absolute', left: L.bandCx - B.joint.bandCx * jointK, top: -L.jointH / 2, width: B.joint.w * jointK, height: L.jointH, zIndex: 0 }} />
      )}
      {/* plaque: behind the ring, slides out to the right */}
      <div data-hr-plaque="" aria-hidden={!open}
        style={{ position: 'absolute', left: inset + plaqueLeft, top: ringTop + plaqueTop, width: G.plaque.w, height: G.plaque.h }}>
        <img src={ASSETS.plaque} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', left: f.x + 6, top: f.y - 2, width: f.w * L.textWidth, height: f.h + 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0 }}>
          <span title={name} style={{
            fontFamily: '"EB Garamond", serif', fontWeight: 600, fontSize: name.length > L.text.longName ? L.text.nameSizeLong : L.text.nameSize,
            lineHeight: '18px', flexShrink: 0, color: C.name,
            textShadow: C.textShadow, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{name}</span>
          <span style={{ fontFamily: '"EB Garamond", serif', fontSize: L.text.subSize, lineHeight: '13px', flexShrink: 0, color: C.sub, whiteSpace: 'nowrap', textShadow: C.textShadow }}>
            {levelText}
            {stateLabel && <span style={{ color: view.state === 'dead' ? C.fallen : C.exception }}>{levelText ? ' · ' : ''}{stateLabel}</span>}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: L.text.barGap, marginTop: 1, flexShrink: 0, width: '100%' }}>
            <Bar value={hp} fill={C.hpFill} label={t('gameFrame.heroLevel.hp')} />
            <Bar value={stamina} fill={C.staminaFill} label={t('gameFrame.roster.zanara.stamina')} />
          </div>
        </div>
      </div>
      {/* ring + live portrait: the always-visible, interactive part */}
      <button type="button" data-hr-ring="" aria-label={[name, levelText, stateLabel].filter(Boolean).join(', ')}
        aria-pressed={selected} aria-disabled={!view.interactive || undefined}
        onPointerDown={(e) => { if (e.pointerType === 'touch' && !touchOpen) { setTouchOpen(true); e.preventDefault(); } }}
        onClick={() => { if (view.interactive) onSelect?.(resident.id); }}
        onBlur={() => setTouchOpen(false)}
        onKeyDown={onKey}
        style={{
          position: 'absolute', left: inset, top: ringTop, width: R.w, height: R.h, padding: 0, border: 0,
          background: 'none', cursor: view.interactive ? 'pointer' : 'default', pointerEvents: 'auto', borderRadius: '50%', zIndex: 1,
        }}>
        <span style={{
          position: 'absolute', left: hole.cx - hole.r - 1, top: hole.cy - hole.r - 1, width: hole.r * 2 + 2, height: hole.r * 2 + 2,
          borderRadius: '50%', overflow: 'hidden', boxShadow: C.portraitShade, display: 'block',
        }}>
          <img src={getResidentPortraitUrl(resident)} alt="" draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: portraitFilter }} />
        </span>
        <img src={ASSETS.ring} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      </button>
    </div>
  );
}

export interface HudRealRosterProps {
  residents: ResidentState[];
  lockedResidentIds?: string[];
  lockedStatusLabel?: string;
  selectedResidentId?: string | null;
  onResidentSelect?: (residentId: string) => void;
  visibleRows?: number;
  /** 'rest' (default, as the mockup): name plaques always out. 'hover': revealed on hover/focus/selection. */
  plaques?: 'rest' | 'hover';
  /** 'none': no built-in crest, the caller puts its own emblem on top (e.g. the brand lockup) and the band starts at the top edge. */
  crest?: 'built-in' | 'none';
}

/**
 * C1 roster column: winged crest on top, a band that ties every ring together (with a
 * clasp at each joint), portrait rings whose plaque slides out on hover/focus/selection,
 * band end with pendant. Any number of residents: the list scrolls by whole rows
 * (wheel, arrows on the band, ArrowUp/ArrowDown between rings); faded edge = more rows.
 */
export function HudRealRoster({ residents, lockedResidentIds = [], lockedStatusLabel, selectedResidentId = null, onResidentSelect, visibleRows = L.visibleRows, plaques = 'hover', crest = 'built-in' }: HudRealRosterProps) {
  const { t } = useTranslation('idleVillage');
  const listRef = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ top: true, bottom: true });
  const locked = new Set(lockedResidentIds);
  const rows = Math.min(residents.length, visibleRows);
  const scrolls = residents.length > visibleRows;
  const listH = rows * L.pitch;
  const headerH = L.firstRingCy - ringTop - R.hole.cy;
  const width = Math.max(rowW, L.bandCx + B.crest.w / 2, B.crest.w);

  const update = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setEdge({ top: el.scrollTop <= 1, bottom: el.scrollTop + el.clientHeight >= el.scrollHeight - 1 });
  }, []);
  useEffect(update, [update, residents.length]);
  const step = (dir: 1 | -1) => listRef.current?.scrollBy({ top: dir * L.pitch, behavior: 'smooth' });
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const rings = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('[data-hr-ring]') ?? [])];
    const next = rings[rings.indexOf(e.currentTarget) + (e.key === 'ArrowDown' ? 1 : -1)];
    if (next) { e.preventDefault(); next.focus(); next.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  };
  const fade = scrolls
    ? `linear-gradient(180deg, ${edge.top ? '#000' : 'transparent'} 0, #000 ${edge.top ? 0 : 26}px, #000 calc(100% - ${edge.bottom ? 0 : 26}px), ${edge.bottom ? '#000' : 'transparent'} 100%)`
    : undefined;
  const bandBg = {
    backgroundImage: `url(${ASSETS.bandTile})`, backgroundRepeat: 'repeat-y' as const,
    backgroundSize: `${RAIL.w}px ${RAIL.tileH}px`, backgroundPosition: `${bandCx - RAIL.w / 2}px 0`,
  };
  const arrow = (dir: 1 | -1, disabled: boolean) => (
    <button type="button" data-hr-arrow="" disabled={disabled} onClick={() => step(dir)}
      aria-label={t(dir < 0 ? 'gameFrame.roster.zanara.scrollUp' : 'gameFrame.roster.zanara.scrollDown')}
      style={{ position: 'absolute', left: bandCx - 13, width: 26, height: L.arrowH, padding: 0, border: 0, background: 'none', cursor: 'pointer', pointerEvents: 'auto', zIndex: 3,
        ...(dir < 0 ? { top: headerH - L.arrowH - 2 } : { top: headerH + listH + 2 }) }}>
      <svg viewBox="0 0 26 18" width="26" height="18" aria-hidden="true" style={{ transform: dir > 0 ? 'rotate(180deg)' : undefined, filter: 'drop-shadow(0 1px 1px rgba(3,26,30,.9))' }}>
        <path d="M3 15 L13 4 L23 15" fill="none" stroke="#f3d27a" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 15 L13 4 L23 15" fill="none" stroke="#7a5714" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  return (
    <section data-hudreal-roster="" aria-label={t('gameFrame.roster.ariaLabel')}
      style={{ position: 'relative', userSelect: 'none', width, height: headerH + listH + RAIL.endH, pointerEvents: 'none' }}>
      <style>{SCOPED_CSS}</style>
      {/* band from under the crest down to the list */}
      <div aria-hidden="true" style={{ position: 'absolute', left: 0, top: crest === 'none' ? 0 : B.crest.h * 0.6, width: bandX + RAIL.w, height: headerH - (crest === 'none' ? 0 : B.crest.h * 0.6), ...bandBg }} />
      {crest === 'built-in' && <img src={ASSETS.crest} alt="" draggable={false}
        style={{ position: 'absolute', left: Math.max(0, L.bandCx - B.crest.w / 2), top: Math.max(0, headerH - B.crest.h + 20), width: B.crest.w, height: B.crest.h, zIndex: 2 }} />}
      <div ref={listRef} data-hr-list="" role="list" aria-label={t('gameFrame.roster.zanara.listLabel')} onScroll={update}
        style={{
          position: 'absolute', left: 0, top: headerH, height: listH, width: rowW, overflowY: scrolls ? 'auto' : 'hidden', overflowX: 'hidden',
          scrollbarWidth: 'none', scrollSnapType: scrolls ? 'y mandatory' : undefined, pointerEvents: 'none',
          ...bandBg, backgroundAttachment: 'local', WebkitMaskImage: fade, maskImage: fade, zIndex: 1,
        }}>
        {residents.map((r) => (
          <Row key={r.id} resident={r} locked={locked.has(r.id)} lockedStatusLabel={lockedStatusLabel}
            selected={selectedResidentId === r.id} onSelect={onResidentSelect} joint={false} onKey={onKey} plaqueAtRest={plaques === 'rest'} />
        ))}
      </div>
      <img src={ASSETS.railEnd} alt="" draggable={false} style={{ position: 'absolute', left: bandCx - RAIL.w / 2, top: headerH + listH, width: RAIL.w, height: RAIL.endH, pointerEvents: 'none' }} />
      {scrolls && arrow(-1, edge.top)}
      {scrolls && arrow(1, edge.bottom)}
    </section>
  );
}
