/**
 * HudRealRosterOpen — the open company panel (PLAN-112 C1 step 2, amend G1 #4): the /game roster
 * panel in the HUD's emerald-and-gold language. Same real filter/sort functions as /game
 * (rosterFilterConfig, rosterSortConfig) on the same ResidentState data: tab counts, compact/full
 * density, sort select, stat filter. The list snaps by whole card rows — no card is ever cut.
 * CSS panel is the mockup stand-in; the 620 px panel frame asset is pending (same quota ruling).
 */
import { useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { heroLevelView } from '@/ui/idleVillage/rosterV2/heroLevelViewModel';
import { ZANARA_ROSTER_ASSETS as ZA } from '@/ui/idleVillage/zanara/zanaraRosterKit';
import { zanaraRosterState, type ZanaraRosterState } from '@/ui/idleVillage/zanara/zanaraRosterState';
import { sortResidents, ROSTER_SORT_MODES, type RosterSortMode } from '@/ui/idleVillage/config/rosterSortConfig';
import { filterResidents, FILTER_STAT_KEYS, STAT_DISPLAY_CONFIG, type FilterCriterion, type FilterOperator, type FilterStatKey } from '@/ui/idleVillage/config/rosterFilterConfig';

type Tab = 'all' | 'ready' | 'away' | 'hurt' | 'fallen';
const TABS: Array<{ id: Tab; label: string; match: (s: ZanaraRosterState) => boolean }> = [
  { id: 'all', label: 'Tutti', match: () => true },
  { id: 'ready', label: 'Pronti', match: (s) => s === 'available' },
  { id: 'away', label: 'In viaggio', match: (s) => s === 'away' || s === 'locked' },
  { id: 'hurt', label: 'Feriti · Stremati', match: (s) => s === 'injured' || s === 'exhausted' },
  { id: 'fallen', label: 'Caduti', match: (s) => s === 'dead' },
];
const CARD_H = 96;
const CARD_H_DENSE = 62;
const CARD_GAP = 8;
/** Panel height that is not the card list: padding, header, tabs, controls, footer, gaps (measured). */
const OPEN_CHROME_H = 206;
const STATE_LABEL: Record<ZanaraRosterState, string> = { available: 'Pronto', away: 'In viaggio', exhausted: 'Stremato', injured: 'Ferito', dead: 'Caduto', locked: 'Assegnato' };
const STATE_COLOR: Record<ZanaraRosterState, string> = { available: '#3fd6a4', away: '#9fc3d6', exhausted: '#f0c987', injured: '#f0a070', dead: '#93a4ad', locked: '#9fc3d6' };
const GOLD = '#d8b866';
const GOLD_DK = '#7a5a1c';
const INK = '#efe6c8';
const SUB = '#b9d2c4';

const ctl: CSSProperties = {
  height: 34, borderRadius: 17, border: `1.5px solid ${GOLD_DK}`, background: 'rgba(4,28,26,.85)', color: INK,
  fontFamily: '"EB Garamond", serif', fontSize: 16, padding: '0 12px',
};

function Meter({ v, fill }: { v: number; fill: string }) {
  return <div style={{ height: 5, borderRadius: 3, background: 'rgba(3,26,30,.8)', overflow: 'hidden' }}><div style={{ width: `${Math.max(0, Math.min(1, v)) * 100}%`, height: '100%', background: fill }} /></div>;
}

function HeroCard({ r, selected, dense, onSelect }: { r: ResidentState; selected: boolean; dense: boolean; onSelect: () => void }) {
  const { t } = useTranslation('idleVillage');
  const view = zanaraRosterState(r, false);
  const { level } = heroLevelView(r);
  const hp = r.maxHp > 0 ? r.currentHp / r.maxHp : 0;
  const st = 1 - r.fatigue / 100;
  const ring = dense ? 46 : 64;
  return (
    <button type="button" onClick={onSelect} data-hr-open-card="" style={{
      scrollSnapAlign: 'start', height: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: dense ? '6px 12px 6px 8px' : '10px 14px 10px 10px', textAlign: 'left', cursor: view.interactive ? 'grab' : 'default',
      borderRadius: 12, border: `1.5px solid ${selected ? '#f0d682' : 'rgba(216,184,102,.35)'}`,
      background: selected ? 'linear-gradient(180deg, #1b5a50, #0d3631)' : 'linear-gradient(180deg, rgba(22,76,69,.75), rgba(8,40,36,.85))',
      boxShadow: selected ? '0 0 12px rgba(240,214,130,.35)' : 'none', color: INK, minWidth: 0,
    }}>
      <div style={{ position: 'relative', width: ring, height: ring, flex: 'none' }}>
        <div style={{ position: 'absolute', inset: ring * 0.14, borderRadius: '50%', overflow: 'hidden' }}>
          <img src={getResidentPortraitUrl(r)} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: view.portrait === 'fallen' ? 'grayscale(1) brightness(.7)' : view.portrait === 'veiled' ? 'saturate(.6) brightness(.8)' : 'none' }} />
        </div>
        <img src={ZA.ring} alt="" draggable={false} style={{ position: 'absolute', inset: -ring * 0.035, width: ring * 1.07, height: ring * 1.07 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: dense ? 3 : 5 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: '"Cinzel", serif', fontSize: dense ? 16 : 19, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.displayName ?? r.id}</span>
          {level !== null && <span style={{ fontFamily: '"EB Garamond", serif', fontSize: 15, color: SUB, flex: 'none' }}>{t('gameFrame.heroLevel.badge', { n: level })}</span>}
          <span style={{ marginLeft: 'auto', fontFamily: '"EB Garamond", serif', fontSize: 15, color: STATE_COLOR[view.state], flex: 'none' }}>{STATE_LABEL[view.state]}</span>
        </div>
        {!dense && (
          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 64px', alignItems: 'center', columnGap: 8, rowGap: 4, fontFamily: '"EB Garamond", serif', fontSize: 14, color: SUB }}>
            <span>PV</span><Meter v={hp} fill="linear-gradient(180deg,#3fd6a4,#149a72)" /><span style={{ textAlign: 'right', color: INK }}>{r.currentHp}/{r.maxHp}</span>
            <span>Vig</span><Meter v={st} fill="linear-gradient(180deg,#ecd28a,#b38a3a)" /><span style={{ textAlign: 'right', color: INK }}>{Math.round(st * 100)}%</span>
          </div>
        )}
        {dense && <Meter v={hp} fill="linear-gradient(180deg,#3fd6a4,#149a72)" />}
      </div>
    </button>
  );
}

export interface HudRealRosterOpenProps {
  residents: ResidentState[];
  selected?: string | null;
  onSelect?: (id: string) => void;
  onClose?: () => void;
  /** Max panel height = ribbon height; the card list never shows a cut row. */
  height: number;
}

export function HudRealRosterOpen({ residents, selected, onSelect, onClose, height }: HudRealRosterOpenProps) {
  const [tab, setTab] = useState<Tab>('all');
  const [sort, setSort] = useState<RosterSortMode>('name-asc');
  const [dense, setDense] = useState(false);
  const [stat, setStat] = useState<FilterStatKey | ''>('');
  const [op, setOp] = useState<FilterOperator>('>=');
  const [thr, setThr] = useState(10);
  const cardH = dense ? CARD_H_DENSE : CARD_H;
  const counts = Object.fromEntries(TABS.map((tb) => [tb.id, residents.filter((r) => tb.match(zanaraRosterState(r, false).state)).length])) as Record<Tab, number>;
  const shown = useMemo(() => {
    const criteria: FilterCriterion[] = stat ? [{ stat, operator: op, threshold: thr }] : [];
    return sortResidents(filterResidents(residents, criteria), sort)
      .filter((r) => TABS.find((x) => x.id === tab)!.match(zanaraRosterState(r, false).state));
  }, [residents, stat, op, thr, sort, tab]);
  /* panel = its content, capped at the ribbon's height: rows needed (2 per line), never empty rows */
  const rowsNeeded = Math.max(1, Math.ceil(shown.length / 2));
  const rowsFit = Math.max(1, Math.floor((height - OPEN_CHROME_H + CARD_GAP) / (cardH + CARD_GAP)));
  const listH = Math.min(rowsNeeded, rowsFit) * (cardH + CARD_GAP) - CARD_GAP;

  return (
    <section data-hudreal-rosteropen="" aria-label="Compagnia" style={{
      position: 'relative', width: '100%', height: OPEN_CHROME_H + listH, display: 'flex', flexDirection: 'column', gap: 12, padding: '18px 20px 16px', boxSizing: 'border-box',
      borderRadius: 18, background: 'linear-gradient(180deg, rgba(18,66,60,.96), rgba(7,34,31,.97))',
      border: `2.5px solid ${GOLD}`, boxShadow: `inset 0 0 0 1.5px ${GOLD_DK}, inset 0 0 30px rgba(0,0,0,.45), 0 6px 18px rgba(1,14,18,.75)`,
    }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0, fontFamily: '"Cinzel", serif', fontSize: 24, color: INK, fontWeight: 600, letterSpacing: 1 }}>Compagnia</h2>
        <span style={{ fontFamily: '"EB Garamond", serif', fontSize: 16, color: SUB }}>{counts.ready} pronti su {residents.length}</span>
        <button type="button" onClick={() => setDense((d) => !d)} style={{ ...ctl, marginLeft: 'auto', cursor: 'pointer' }}>{dense ? 'Schede' : 'Compatto'}</button>
        {onClose && <button type="button" onClick={onClose} aria-label="Chiudi" style={{ ...ctl, width: 34, padding: 0, cursor: 'pointer', fontSize: 18 }}>✕</button>}
      </header>
      <nav role="tablist" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {TABS.map((tb) => (
          <button key={tb.id} role="tab" aria-selected={tab === tb.id} type="button" onClick={() => setTab(tb.id)} style={{
            ...ctl, cursor: 'pointer', borderColor: tab === tb.id ? '#f0d682' : GOLD_DK,
            background: tab === tb.id ? 'linear-gradient(180deg,#1f6a5c,#0e3d37)' : ctl.background, color: counts[tb.id] === 0 ? '#6f8a84' : INK,
          }}>{tb.label} <span style={{ color: SUB }}>{counts[tb.id]}</span></button>
        ))}
      </nav>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontFamily: '"EB Garamond", serif', fontSize: 15, color: SUB }}>
        <span>Ordina</span>
        <select value={sort} onChange={(e) => setSort(e.target.value as RosterSortMode)} style={{ ...ctl, cursor: 'pointer' }}>
          {Object.values(ROSTER_SORT_MODES).map((m) => <option key={m.mode} value={m.mode}>{m.label}</option>)}
        </select>
        <span style={{ marginLeft: 10 }}>Filtra</span>
        <select value={stat} onChange={(e) => setStat(e.target.value as FilterStatKey | '')} style={{ ...ctl, cursor: 'pointer', maxWidth: 150 }}>
          <option value="">— statistica —</option>
          {FILTER_STAT_KEYS.map((k) => <option key={k} value={k}>{STAT_DISPLAY_CONFIG[k]?.label ?? k}</option>)}
        </select>
        <select value={op} onChange={(e) => setOp(e.target.value as FilterOperator)} disabled={!stat} style={{ ...ctl, cursor: 'pointer', width: 62 }}>
          {(['>=', '>', '=', '<', '<='] as FilterOperator[]).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <input type="number" value={thr} onChange={(e) => setThr(Number(e.target.value))} disabled={!stat} style={{ ...ctl, width: 70 }} />
      </div>
      {/* list height = whole card rows only, scroll snaps per row: no card is ever cut at the edge */}
      <div style={{ height: listH }}>
        <div data-hr-open-list="" style={{
          height: listH, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: cardH, gap: CARD_GAP, alignContent: 'start',
          scrollSnapType: 'y mandatory', paddingRight: 4, scrollbarWidth: 'thin', scrollbarColor: `${GOLD_DK} transparent`,
        }}>
          {shown.map((r) => <HeroCard key={r.id} r={r} dense={dense} selected={selected === r.id} onSelect={() => onSelect?.(r.id)} />)}
          {shown.length === 0 && <p style={{ gridColumn: '1 / -1', color: SUB, fontFamily: '"EB Garamond", serif', fontSize: 16 }}>Nessun eroe con questi filtri.</p>}
        </div>
      </div>
      <footer style={{ fontFamily: '"EB Garamond", serif', fontSize: 14, color: SUB, opacity: 0.85 }}>Trascina un eroe su uno slot per assegnarlo · R apre e chiude</footer>
    </section>
  );
}
