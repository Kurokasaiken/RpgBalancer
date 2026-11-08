/**
 * HudRealRosterColumn — the roster of blueprint B1 (PLAN-112 F4): a compact column of portrait
 * medallions (72 px, pitch 80) in the signed 88 px slot (G1, D5). At rest only the medallion shows:
 * the name plaque lives on hover/focus/touch only — never open by default, selection is halo + arc,
 * not plaque. States on the medallion (health arc on the hole rim + status gem, G2-3) come with the
 * "roster con stati" step; portrait treatment (veiled/fallen) and interactivity already follow
 * `zanaraRosterState`. Same pieces as C1 (approved ring + plaque), no rail, no crest.
 */
import { useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { heroLevelView } from '@/ui/idleVillage/rosterV2/heroLevelViewModel';
import { zanaraRosterState } from '@/ui/idleVillage/zanara/zanaraRosterState';
import { C1_GEOMETRY as G } from './c1Geometry';
import { HUD_TYPE } from './hudType';
import { ZANARA_ROSTER_ASSETS as ZA, ZANARA_ROSTER_GEOMETRY as ZG } from '@/ui/idleVillage/zanara/zanaraRosterKit';

const ASSETS = {
  ring: '/assets/ui/hud-real/C1/ring.webp',
  plaque: '/assets/ui/hud-real/voce/frame-200.webp',
} as const;

/** Blueprint medallion: 72 px wide (the approved 88 px ring scaled by K), row pitch 80. */
const K = 72 / G.ring.w;
const R = { w: G.ring.w * K, h: G.ring.h * K, hole: { cx: G.ring.hole.cx * K, cy: G.ring.hole.cy * K, r: G.ring.hole.r * K } };
const PITCH = 80;
const MEDAL_X = (88 - R.w) / 2;
const PLAQUE_W = 200;

/** Zanara band tile behind the medallions — the scrollable ribbon strip (scaled like the ribbon). */
const BAND_K = 1.25;
const BAND_W = ZG.band.w * BAND_K;
const BAND_X = (88 - BAND_W) / 2;
const BAND_TILE_H = ZG.band.tileH * BAND_K;

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

const SCOPED_CSS = `
[data-hudreal-rostercol] button { font: inherit; }
[data-hudreal-rostercol] [data-hr-ring]:focus { outline: none; }
[data-hudreal-rostercol] [data-hr-ring]:focus-visible { outline: 2px solid ${C.focus}; outline-offset: 2px; border-radius: 50%; }
[data-hudreal-rostercol] [data-hr-ring][aria-pressed="true"] { filter: drop-shadow(0 0 7px rgba(240, 201, 135, 0.85)) drop-shadow(0 0 2px rgba(255, 232, 160, 0.9)); }
[data-hudreal-rostercol] [data-hr-plaque] { transform: translateX(-30px); opacity: 0; pointer-events: none; transition: transform 200ms ease-out, opacity 200ms ease-out; }
[data-hudreal-rostercol] [data-hr-row]:hover [data-hr-plaque],
[data-hudreal-rostercol] [data-hr-row]:focus-within [data-hr-plaque],
[data-hudreal-rostercol] [data-hr-row][data-open="true"] [data-hr-plaque] { transform: translateX(0); opacity: 1; pointer-events: auto; }
[data-hudreal-rostercol] [data-hr-list]::-webkit-scrollbar { display: none; }
@media (prefers-reduced-motion: reduce) { [data-hudreal-rostercol] [data-hr-plaque] { transition: none; } }
`;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function Bar({ value, fill, label }: { value: number; fill: string; label: string }) {
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}
      style={{ height: 3, background: C.barTrack, borderRadius: 1.5, overflow: 'hidden' }}>
      <div style={{ width: `${value * 100}%`, height: '100%', background: fill }} />
    </div>
  );
}

function Row({ resident, locked, lockedStatusLabel, selected, onSelect, onKey }: {
  resident: ResidentState; locked: boolean; lockedStatusLabel?: string; selected: boolean;
  onSelect?: (id: string) => void; onKey: (e: KeyboardEvent<HTMLButtonElement>) => void;
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
  const open = touchOpen;
  const long = name.length > 10;

  return (
    <div role="listitem" data-hr-row="" data-state={view.state} data-open={open ? 'true' : 'false'}
      style={{ position: 'relative', width: 88 + PLAQUE_W, height: PITCH, pointerEvents: 'none', scrollSnapAlign: 'start', flex: 'none' }}>
      {/* plaque behind the medallion, slides out to the right (over the map, outside the slot):
          the SAME delicate frame as Voce (voce/frame-200), its left end tucked under the ring edge */}
      <div data-hr-plaque="" aria-hidden={!open}
        style={{ position: 'absolute', left: Math.round(MEDAL_X + R.w) - 40, top: (PITCH - 72) / 2, width: PLAQUE_W, height: 72 }}>
        <img src={ASSETS.plaque} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', left: 48, top: 4, width: 140, height: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span title={name} style={{
            fontFamily: '"EB Garamond", serif', fontWeight: 600, fontSize: long ? HUD_TYPE.nameLong : HUD_TYPE.name, lineHeight: '20px',
            color: C.name, textShadow: C.textShadow, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{name}</span>
          <span style={{ fontFamily: '"EB Garamond", serif', fontSize: HUD_TYPE.secondary, lineHeight: '15px', color: C.sub, whiteSpace: 'nowrap', textShadow: C.textShadow }}>
            {levelText}
            {stateLabel && <span style={{ color: view.state === 'dead' ? C.fallen : C.exception }}>{levelText ? ' · ' : ''}{stateLabel}</span>}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 1 }}>
            <Bar value={hp} fill={C.hpFill} label={t('gameFrame.heroLevel.hp')} />
            <Bar value={stamina} fill={C.staminaFill} label={t('gameFrame.roster.zanara.stamina')} />
          </div>
        </div>
      </div>
      {/* medallion: the always-visible interactive part */}
      <button type="button" data-hr-ring="" aria-label={[name, levelText, stateLabel, `${t('gameFrame.heroLevel.hp')} ${Math.round(hp * 100)}%`].filter(Boolean).join(', ')}
        aria-pressed={selected} aria-disabled={!view.interactive || undefined}
        onPointerDown={(e) => { if (e.pointerType === 'touch' && !touchOpen) { setTouchOpen(true); e.preventDefault(); } }}
        onClick={() => { if (view.interactive) onSelect?.(resident.id); }}
        onBlur={() => setTouchOpen(false)}
        onKeyDown={onKey}
        style={{ position: 'absolute', left: MEDAL_X, top: (PITCH - R.h) / 2, width: R.w, height: R.h, padding: 0, border: 0, background: 'none', cursor: view.interactive ? 'pointer' : 'default', pointerEvents: 'auto', borderRadius: '50%', zIndex: 1 }}>
        <span style={{
          position: 'absolute', left: R.hole.cx - R.hole.r - 1, top: R.hole.cy - R.hole.r - 1,
          width: R.hole.r * 2 + 2, height: R.hole.r * 2 + 2, borderRadius: '50%', overflow: 'hidden', boxShadow: C.portraitShade, display: 'block',
        }}>
          <img src={getResidentPortraitUrl(resident)} alt="" draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: portraitFilter }} />
        </span>
        <img src={ASSETS.ring} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      </button>
    </div>
  );
}

export interface HudRealRosterColumnProps {
  residents: ResidentState[];
  lockedResidentIds?: string[];
  lockedStatusLabel?: string;
  selectedResidentId?: string | null;
  onResidentSelect?: (residentId: string) => void;
  /** Resolved slot height in px: rows beyond it scroll by whole rows (faded edge = more rows). */
  height: number;
}

/**
 * The B1 roster column: medallions only at rest (D5), name plaque on hover/focus/touch,
 * scrolls by whole rows when heroes exceed the resolved slot height.
 */
export function HudRealRosterColumn({ residents, lockedResidentIds = [], lockedStatusLabel, selectedResidentId = null, onResidentSelect, height }: HudRealRosterColumnProps) {
  const { t } = useTranslation('idleVillage');
  const listRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(false);
  const locked = new Set(lockedResidentIds);
  const scrolls = residents.length * PITCH > height + 1;
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const rings = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('[data-hr-ring]') ?? [])];
    const next = rings[rings.indexOf(e.currentTarget) + (e.key === 'ArrowDown' ? 1 : -1)];
    if (next) { e.preventDefault(); next.focus(); next.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  };
  const fade = scrolls && !atBottom
    ? 'linear-gradient(180deg, #000 0, #000 calc(100% - 26px), transparent 100%)'
    : undefined;
  return (
    <section data-hudreal-rostercol="" aria-label={t('gameFrame.roster.ariaLabel')}
      style={{ position: 'relative', userSelect: 'none', width: 88, height, pointerEvents: 'none' }}>
      <style>{SCOPED_CSS}</style>
      {/* CSS forces overflow-x to clip whenever overflow-y is auto/hidden: the list must be wide enough
          for the slide-out plaque, with pointer-events off so only the medallions intercept clicks. */}
      {/* zanara band under the medallions — the scrollable strip that used to be the ribbon */}
      <div aria-hidden="true" style={{
        position: 'absolute', left: BAND_X, top: 0, width: BAND_W, height, zIndex: 0,
        backgroundImage: `url(${ZA.bandTile})`, backgroundRepeat: 'repeat-y', backgroundSize: `${BAND_W}px ${BAND_TILE_H}px`,
      }} />
      <div ref={listRef} data-hr-list="" role="list" aria-label={t('gameFrame.roster.zanara.listLabel')}
        onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 1)}
        style={{
          position: 'absolute', left: 0, top: 0, width: 88 + PLAQUE_W, height,
          overflowY: scrolls ? 'auto' : 'hidden', overflowX: 'hidden',
          scrollbarWidth: 'none', scrollSnapType: scrolls ? 'y mandatory' : undefined, pointerEvents: 'auto',
          WebkitMaskImage: fade, maskImage: fade, display: 'flex', flexDirection: 'column',
        }}>
        {residents.map((r) => (
          <Row key={r.id} resident={r} locked={locked.has(r.id)} lockedStatusLabel={lockedStatusLabel}
            selected={selectedResidentId === r.id} onSelect={onResidentSelect} onKey={onKey} />
        ))}
      </div>
    </section>
  );
}
