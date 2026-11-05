/**
 * ZanaraRoster — closed roster column in the Zanara language (LINGUAGGIO-v1,
 * zanara-Z10: vertical column; KIT-ROSTER.md).
 *
 * Same data contract as the production roster (`ResidentRosterPanelV2`):
 * `ResidentState[]` from the engine, locked ids, select callback. Mechanics
 * are untouched: this is a view. Drag-to-slot stays in the open roster panel,
 * reached through the emblem (`onExpand`).
 *
 * Built from the approved kit pieces only (zanaraRosterKit): emblem K5, band
 * K3 + node, ring K1 ritratto, plaque K2 in three slices, state castone K4,
 * band end K6. Rows scroll past `visibleRows`; a fade on the list edge says
 * there is more.
 */
import { useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { heroLevelView } from '@/ui/idleVillage/rosterV2/heroLevelViewModel';
import { ZANARA_ROSTER_ASSETS as A, ZANARA_ROSTER_COLORS as C, ZANARA_ROSTER_GEOMETRY as G } from './zanaraRosterKit';
import { zanaraRosterState } from './zanaraRosterState';

export interface ZanaraRosterProps {
  residents: ResidentState[];
  lockedResidentIds?: string[];
  /** Label for locked residents (same prop as the production roster). */
  lockedStatusLabel?: string;
  onResidentSelect?: (residentId: string) => void;
  /** Opens the full roster panel (the emblem is the control). */
  onExpand?: () => void;
  visibleRows?: number;
}

const ringCx = G.ring.left + G.ring.outerD / 2;
const ringTop = (G.pitch - G.ring.size) / 2;
const ringImgLeft = G.ring.left - (G.ring.size - G.ring.outerD) / 2;
const plaqueTop = (G.pitch - G.plaque.h) / 2;
const listTop = G.emblem.size - G.emblem.overlap;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Scoped interaction styles (focus ring, hover) — values from the kit contract. */
const SCOPED_CSS = `
[data-zanara-roster] button { font: inherit; }
[data-zanara-roster] button:focus { outline: none; }
[data-zanara-roster] button:focus-visible { outline: 2px solid ${C.focus}; outline-offset: -2px; border-radius: 6px; }
[data-zanara-roster] [data-zanara-row]:hover [data-zanara-plaque] { filter: brightness(1.12); }
[data-zanara-roster] [data-zanara-list]::-webkit-scrollbar { display: none; }
`;

function Bar({ value, fill, label }: { value: number; fill: string; label: string }) {
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}
      style={{ width: G.text.barW, height: G.text.barH, background: C.barTrack, borderRadius: G.text.barH / 2, overflow: 'hidden' }}>
      <div style={{ width: `${value * 100}%`, height: '100%', background: fill }} />
    </div>
  );
}

function RosterRow({ resident, locked, lockedStatusLabel, onSelect }: {
  resident: ResidentState; locked: boolean; lockedStatusLabel?: string; onSelect?: (id: string) => void;
}) {
  const { t } = useTranslation('idleVillage');
  const view = zanaraRosterState(resident, locked);
  const { level } = heroLevelView(resident);
  const name = resident.displayName ?? resident.id;
  const stateLabel = view.labelKey ? t(view.labelKey) : view.state === 'locked' ? lockedStatusLabel ?? null : null;
  const hp = clamp01(resident.maxHp > 0 ? resident.currentHp / resident.maxHp : 0);
  const stamina = clamp01(1 - resident.fatigue / 100);
  const portraitFilter = view.portrait === 'fallen' ? 'grayscale(1) brightness(0.7)' : view.portrait === 'veiled' ? 'saturate(0.6) brightness(0.75)' : 'none';
  const levelText = level !== null ? t('gameFrame.heroLevel.badge', { n: level }) : null;
  const ariaLabel = [name, levelText, stateLabel].filter(Boolean).join(', ');

  return (
    <button type="button" data-zanara-row="" data-state={view.state} aria-label={ariaLabel}
      aria-disabled={!view.interactive || undefined}
      onClick={() => { if (view.interactive) onSelect?.(resident.id); }}
      style={{ position: 'relative', display: 'block', width: G.columnW, height: G.pitch, padding: 0, border: 0, background: 'none', cursor: view.interactive ? 'pointer' : 'default', textAlign: 'left' }}>
      {/* band node at the row's joint */}
      <img src={A.bandNode} alt="" draggable={false}
        style={{ position: 'absolute', left: G.band.x, top: (G.pitch - G.band.nodeH) / 2, width: G.band.w, height: G.band.nodeH }} />
      {/* plaque, three slices; its concave left end tucks under the ring */}
      <div data-zanara-plaque="" style={{ position: 'absolute', left: ringCx, top: plaqueTop, right: 0, height: G.plaque.h, display: 'flex' }}>
        <img src={A.plaqueLeft} alt="" draggable={false} style={{ width: G.plaque.leftW, height: G.plaque.h, flex: 'none' }} />
        <div style={{ flex: 1, backgroundImage: `url(${A.plaqueMid})`, backgroundRepeat: 'no-repeat', backgroundSize: '100% 100%' }} />
        <img src={A.plaqueRight} alt="" draggable={false} style={{ width: G.plaque.rightW, height: G.plaque.h, flex: 'none' }} />
      </div>
      {/* live portrait in the measured hole, under the ring */}
      <div style={{
        position: 'absolute', left: ringCx - G.ring.holeD / 2 - 1, top: G.pitch / 2 - G.ring.holeD / 2 - 1,
        width: G.ring.holeD + 2, height: G.ring.holeD + 2, borderRadius: '50%', overflow: 'hidden', boxShadow: C.portraitShade,
      }}>
        <img src={getResidentPortraitUrl(resident)} alt="" draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: portraitFilter }} />
      </div>
      <img src={A.ring} alt="" draggable={false}
        style={{ position: 'absolute', left: ringImgLeft, top: ringTop, width: G.ring.size, height: G.ring.size }} />
      {/* state castone over the ring's own emerald: lit = the ring's gem as is */}
      {view.gem !== 'lit' && (
        <img src={A.gemRoundDim} alt="" draggable={false} style={{
          position: 'absolute', left: ringImgLeft + G.ring.gemX - G.stateGem / 2, top: ringTop + G.ring.gemY - G.stateGem / 2,
          width: G.stateGem, height: G.stateGem, filter: view.gem === 'iron' ? 'grayscale(1) brightness(1.15)' : 'none',
        }} />
      )}
      {/* live text on the plaque body */}
      <div style={{ position: 'absolute', left: G.text.left, top: plaqueTop + G.text.top, height: G.plaque.h - 2 * G.text.top, right: G.plaque.rightW + 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0 }}>
        <span style={{
          fontFamily: 'var(--font-header, "Cinzel", serif)', fontSize: G.text.nameSize, lineHeight: '15px', color: C.name,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }} title={name}>{name}</span>
        <span style={{ fontFamily: '"EB Garamond", serif', fontSize: G.text.subSize, lineHeight: '12px', color: C.sub, whiteSpace: 'nowrap' }}>
          {levelText}
          {stateLabel && (
            <span style={{ color: view.state === 'dead' ? C.fallen : C.exception }}>{levelText ? ' · ' : ''}{stateLabel}</span>
          )}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: G.text.barGap, marginTop: 3 }}>
          <Bar value={hp} fill={C.hpFill} label={t('gameFrame.heroLevel.hp')} />
          <Bar value={stamina} fill={C.staminaFill} label={t('gameFrame.roster.zanara.stamina')} />
        </div>
      </div>
    </button>
  );
}

/** Closed Zanara roster column: emblem (expand), scrolling hero rows, band end. */
export function ZanaraRoster({ residents, lockedResidentIds = [], lockedStatusLabel, onResidentSelect, onExpand, visibleRows = G.visibleRows }: ZanaraRosterProps) {
  const { t } = useTranslation('idleVillage');
  const [atEnd, setAtEnd] = useState(false);
  const rows = Math.min(residents.length, visibleRows);
  const scrolls = residents.length > visibleRows;
  const locked = new Set(lockedResidentIds);
  const listH = rows * G.pitch;
  const fade: CSSProperties = scrolls && !atEnd ? { WebkitMaskImage: C.fade, maskImage: C.fade } : {};

  return (
    <section data-zanara-roster="" aria-label={t('gameFrame.roster.ariaLabel')}
      style={{ position: 'relative', width: G.columnW, height: listTop + listH + G.bandEnd.h - 6 }}>
      <style>{SCOPED_CSS}</style>
      {/* continuous band behind the rows */}
      <div style={{
        position: 'absolute', left: G.band.x, top: G.emblem.size * 0.6, width: G.band.w, height: listTop - G.emblem.size * 0.6 + listH,
        backgroundImage: `url(${A.bandTile})`, backgroundRepeat: 'repeat-y', backgroundSize: `${G.band.w}px ${G.band.tileH}px`,
      }} />
      <button type="button" onClick={onExpand} aria-label={t('gameFrame.roster.zanara.expand')} title={t('gameFrame.roster.zanara.expand')}
        style={{ position: 'absolute', left: 0, top: 0, width: G.emblem.size, height: G.emblem.size, padding: 0, border: 0, background: 'none', cursor: 'pointer', zIndex: 2 }}>
        <img src={A.emblem} alt="" draggable={false} style={{ width: G.emblem.size, height: G.emblem.size, display: 'block' }} />
      </button>
      <div data-zanara-list="" role="list" aria-label={t('gameFrame.roster.zanara.listLabel')}
        onScroll={(e) => { const el = e.currentTarget; setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 2); }}
        style={{ position: 'absolute', left: 0, top: listTop, width: G.columnW, height: listH, overflowY: scrolls ? 'auto' : 'hidden', overflowX: 'hidden', scrollbarWidth: 'none', ...fade }}>
        {residents.map((r) => (
          <div role="listitem" key={r.id}>
            <RosterRow resident={r} locked={locked.has(r.id)} lockedStatusLabel={lockedStatusLabel} onSelect={onResidentSelect} />
          </div>
        ))}
      </div>
      <img src={A.bandEnd} alt="" draggable={false}
        style={{ position: 'absolute', left: G.band.x - G.bandEnd.bandX, top: listTop + listH - 6, width: G.bandEnd.w, height: G.bandEnd.h }} />
    </section>
  );
}
