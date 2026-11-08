/**
 * HudRealRosterRibbon — the production roster ribbon (PLAN-112 C1, amend G1 #4): the zanara-v2
 * column — medallions with their resting plaques (RosterRow, ×1.25) running like a ribbon between
 * two gold rollers. Rows curl into the rods while scrolling (no straight clip edge is ever visible;
 * at rest only whole rows). A zanara band tile runs under the crest, ending in the band-end jewel.
 * Data: ResidentState[] from the existing contract. CSS rollers are stand-ins (mockup parity);
 * final rod assets pending quota ruling.
 */
import { useEffect, useRef } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { RosterRow } from '@/ui/idleVillage/zanara/ZanaraRoster';
import { ZANARA_ROSTER_ASSETS as ZA, ZANARA_ROSTER_GEOMETRY as ZG } from '@/ui/idleVillage/zanara/zanaraRosterKit';
import { RIBBON_COL_W, RIBBON_K, RIBBON_PAD, RIBBON_PITCH, RIBBON_RING_CX } from './rosterRibbonGeometry';

const BAND_X = ZG.band.x * RIBBON_K;
const BAND_W = ZG.band.w * RIBBON_K;

export interface HudRealRosterRibbonProps {
  residents: ResidentState[];
  /** Max whole rows visible between the rollers (computed by the caller from the resolved slot). */
  visible: number;
  selected?: string | null;
  onSelect?: (id: string) => void;
  /** px from the crest's vertical centre to the slot top — the band runs up into the crest. */
  bandTop?: number;
}

export function HudRealRosterRibbon({ residents, visible, selected, onSelect, bandTop = 0 }: HudRealRosterRibbonProps) {
  const vp = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rows = Math.max(1, Math.min(residents.length, visible));
  const viewH = rows * RIBBON_PITCH + 2 * RIBBON_PAD;

  /* rows curl into the rods: rotateX + shade grow as a row passes under a roller (scroll-driven, no rAF) */
  const roll = () => {
    const el = vp.current;
    if (!el) return;
        rowRefs.current.forEach((row, i) => {
      if (!row) return;
      const y = RIBBON_PAD + i * RIBBON_PITCH - el.scrollTop;
      const intoTop = Math.max(0, Math.min(1, (RIBBON_PAD - y) / RIBBON_PITCH));
      const intoBot = Math.max(0, Math.min(1, (y + RIBBON_PITCH - (viewH - RIBBON_PAD)) / RIBBON_PITCH));
      const t = Math.max(intoTop, intoBot);
      const ang = intoTop > 0 ? intoTop * 75 : -intoBot * 75;
      row.style.transformOrigin = intoTop > 0 ? '50% 100%' : '50% 0%';
      row.style.transform = t > 0 ? `perspective(520px) rotateX(${ang}deg)` : '';
      row.style.filter = t > 0 ? `brightness(${1 - 0.55 * t})` : '';
    });
  };
  useEffect(roll, [residents.length, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div data-hudreal-rosterribbon="" style={{ position: 'relative', width: RIBBON_COL_W }}>
      {/* zanara band under the crest, repeated tile, ending under the ribbon */}
      <div style={{
        position: 'absolute', left: BAND_X, top: -bandTop, width: BAND_W, height: bandTop + viewH,
        backgroundImage: `url(${ZA.bandTile})`, backgroundRepeat: 'repeat-y', backgroundSize: `${BAND_W}px ${ZG.band.tileH * RIBBON_K}px`,
      }} />
      <div ref={vp} data-hr-ribbon-viewport="" onScroll={roll}
        style={{
          position: 'relative', height: viewH, overflowY: residents.length > rows ? 'auto' : 'hidden', overflowX: 'hidden',
          scrollSnapType: 'y mandatory', scrollPaddingTop: RIBBON_PAD, scrollbarWidth: 'none', overscrollBehavior: 'contain',
          WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 18px, #000 calc(100% - 18px), transparent)', maskImage: 'linear-gradient(180deg, transparent, #000 18px, #000 calc(100% - 18px), transparent)',
        }}>
        <div style={{ height: RIBBON_PAD }} />
        {residents.map((r, i) => (
          <div key={r.id} ref={(el) => { rowRefs.current[i] = el; }} data-hr-ribbon-row={i}
            style={{ position: 'relative', height: RIBBON_PITCH, width: RIBBON_COL_W, scrollSnapAlign: 'start' }}>
            {selected === r.id && (
              <div style={{ position: 'absolute', left: RIBBON_RING_CX - 40, top: RIBBON_PITCH / 2 - 40, width: 80, height: 80, borderRadius: '50%', boxShadow: '0 0 14px 5px rgba(240,214,130,.55)', pointerEvents: 'none' }} />
            )}
            <div style={{ transform: `scale(${RIBBON_K})`, transformOrigin: '0 0', width: ZG.columnW, height: ZG.pitch }}>
              <RosterRow resident={r} locked={false} onSelect={(id) => onSelect?.(id)} />
            </div>
          </div>
        ))}
        <div style={{ height: RIBBON_PAD }} />
      </div>
      {/* band end jewel under the ribbon */}
      <img src={ZA.bandEnd} alt="" draggable={false}
        style={{ position: 'absolute', left: BAND_X - ZG.bandEnd.bandX * RIBBON_K, top: viewH - 4, width: ZG.bandEnd.w * RIBBON_K, height: ZG.bandEnd.h * RIBBON_K }} />
    </div>
  );
}
