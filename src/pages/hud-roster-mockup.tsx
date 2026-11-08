import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { PixiWorldMap } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { useRosterKitData } from '@/ui/idleVillage/frozen/kits/rosterKit';
import type { ResidentState, ResidentStatus } from '@/engine/game/idleVillage/TimeEngine';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { heroLevelView } from '@/ui/idleVillage/rosterV2/heroLevelViewModel';
import { RosterRow } from '@/ui/idleVillage/zanara/ZanaraRoster';
import { ZANARA_ROSTER_ASSETS as ZA, ZANARA_ROSTER_GEOMETRY as ZG } from '@/ui/idleVillage/zanara/zanaraRosterKit';
import { zanaraRosterState, type ZanaraRosterState } from '@/ui/idleVillage/zanara/zanaraRosterState';
import { sortResidents, ROSTER_SORT_MODES, type RosterSortMode } from '@/ui/idleVillage/config/rosterSortConfig';
import { filterResidents, FILTER_STAT_KEYS, STAT_DISPLAY_CONFIG, type FilterCriterion, type FilterOperator, type FilterStatKey } from '@/ui/idleVillage/config/rosterFilterConfig';
import { HudRealTimeConnected } from '@/ui/idleVillage/hudReal/HudRealTimeConnected';
import { HudRealResources } from '@/ui/idleVillage/hudReal/HudRealResources';
import { HudRealNav } from '@/ui/idleVillage/hudReal/HudRealNav';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { selectResourceOutlook, useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { buildResourceReadoutItems } from '@/ui/idleVillage/components/gameFrame';
import { HudRealCrest as Crest } from '@/ui/idleVillage/hudReal/HudRealCrest';
import { frameFor, M, resolveAll, resolveSlots, zoomFor, type Rect } from '@/ui/idleVillage/hudReal/layout/hudLayoutB';

/**
 * MOCKUP (PLAN-112, roster redesign) — not a contract, not production.
 * Closed state = the Director's chosen zanara-v2 column: a collection of medallions and nothing else,
 * running like a ribbon between two gold rollers (rows curl into the rods: no straight clip edge is ever
 * visible, at rest only whole rows). Crest = phoenix + Sol Invictus in a circular instrument whose corona
 * is live (lit rays = share of heroes ready). Open state = panel derived from the /game roster: the same
 * real filter/sort functions (rosterFilterConfig, rosterSortConfig) on the same data.
 * Frames and rods are CSS/SVG stand-ins: the real assets come only after approval (quota, PLAN-112 F3 rules).
 * Query: ?n=1|5|14 heroes (copies for test), ?open=1, ?study=crest.
 */

const MAP_MANIFEST = '/assets/world/mappa2/base/manifest.json';
const K = 1.25; // zanara kit is in 1600x900 design px; HUD type floor (body 16) needs x1.25
const PITCH = ZG.pitch * K;
const COL_W = ZG.columnW * K;
const BAND_X = ZG.band.x * K;
const BAND_W = ZG.band.w * K;
const RING_CX = (ZG.ring.left + ZG.ring.outerD / 2) * K;
const ROD_H = 16;
const CREST = 156; // crest box (corona included)
const GOLD = '#d8b866';
const GOLD_DK = '#7a5a1c';
const ENAMEL = '#0f3d38';
const ENAMEL_DK = '#082824';
const INK = '#efe6c8';
const SUB = '#b9d2c4';

const DEMO: Array<{ status: ResidentStatus; injured?: boolean }> = [
  { status: 'available' }, { status: 'away' }, { status: 'available' }, { status: 'exhausted' }, { status: 'injured', injured: true },
  { status: 'available' }, { status: 'dead' }, { status: 'available' }, { status: 'away' }, { status: 'available' },
  { status: 'available' }, { status: 'exhausted' }, { status: 'available' }, { status: 'away' },
];

function useDemoResidents(n: number): ResidentState[] {
  const { residents } = useRosterKitData();
  return useMemo(() => {
    if (residents.length === 0) return residents;
    return Array.from({ length: n }, (_, i) => {
      const r = residents[i % residents.length];
      const s = DEMO[i % DEMO.length];
      return {
        ...r, id: `${r.id}#${i}`, displayName: i < residents.length ? r.displayName : `${r.displayName ?? r.id} ${['II', 'III', 'IV'][Math.floor(i / residents.length) - 1] ?? ''}`.trim(),
        status: s.status, isInjured: Boolean(s.injured), fatigue: s.status === 'exhausted' ? 92 : (i * 17) % 60,
        currentHp: s.status === 'dead' ? 0 : s.injured ? Math.round(r.maxHp * 0.3) : Math.round(r.maxHp * (0.55 + ((i * 13) % 45) / 100)),
      };
    });
  }, [residents, n]);
}

/* ───────────────────────── Ribbon: medallions between two rollers ───────────────────────── */

function Rod({ width, children, testId }: { width: number; children?: React.ReactNode; testId: string }) {
  return (
    <div data-mock-rod={testId} style={{ position: 'relative', width, height: ROD_H }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: ROD_H / 2,
        background: 'linear-gradient(180deg, #5a4313 0%, #f6e3a1 28%, #d2a84f 52%, #8a6522 78%, #4a360f 100%)',
        boxShadow: '0 2px 4px rgba(1,14,18,.8), 0 -1px 2px rgba(1,14,18,.5)',
      }} />
      <div style={{ position: 'absolute', left: 10, right: 10, top: ROD_H / 2 - 1.5, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #0a3a33, #17775f 50%, #0a3a33)', opacity: 0.85 }} />
      {/* end caps: gold knobs with emerald */}
      {[0, 1].map((e) => (
        <div key={e} style={{
          position: 'absolute', top: -3, [e ? 'right' : 'left']: -6, width: ROD_H + 6, height: ROD_H + 6, borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, #6dffcf, #12a77a 45%, #054330 75%)', boxShadow: `0 0 0 2.5px ${GOLD}, 0 0 0 3.5px ${GOLD_DK}, 0 2px 4px rgba(1,14,18,.8)`,
        } as CSSProperties} />
      ))}
      {children}
    </div>
  );
}

function RodCount({ n, dir, onClick }: { n: number; dir: 'up' | 'down'; onClick: () => void }) {
  if (n <= 0) return null;
  return (
    <button type="button" onClick={onClick} aria-label={dir === 'up' ? `${n} eroi sopra` : `${n} eroi sotto`}
      style={{
        position: 'absolute', right: 34, top: dir === 'up' ? -14 : 2, height: 26, minWidth: 54, padding: '0 10px', borderRadius: 13,
        background: `linear-gradient(180deg, #164c45, ${ENAMEL_DK})`, border: `1.5px solid ${GOLD}`, color: INK, cursor: 'pointer',
        fontFamily: '"Cinzel", serif', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(1,14,18,.8)',
      }}>
      <span style={{ fontSize: 10, color: GOLD }}>{dir === 'up' ? '▲' : '▼'}</span>{n}
    </button>
  );
}

function MedallionRibbon({ residents, visible, selected, onSelect }: {
  residents: ResidentState[]; visible: number; selected: string | null; onSelect: (id: string) => void;
}) {
  const vp = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [top, setTop] = useState(0);
  const rows = Math.max(1, Math.min(residents.length, visible));
  const viewH = rows * PITCH + 2 * ROD_H;
  const above = Math.round(top / PITCH);
  const below = Math.max(0, residents.length - rows - above);

  /* rows curl into the rods: rotateX + shade grow as a row passes under a roller (scroll-driven, no rAF) */
  const roll = () => {
    const el = vp.current;
    if (!el) return;
    setTop(el.scrollTop);
    rowRefs.current.forEach((row, i) => {
      if (!row) return;
      const y = ROD_H + i * PITCH - el.scrollTop; // row top in viewport px
      const intoTop = Math.max(0, Math.min(1, (ROD_H - y) / PITCH));
      const intoBot = Math.max(0, Math.min(1, (y + PITCH - (viewH - ROD_H)) / PITCH));
      const t = Math.max(intoTop, intoBot);
      const ang = intoTop > 0 ? intoTop * 75 : -intoBot * 75;
      row.style.transformOrigin = intoTop > 0 ? '50% 100%' : '50% 0%';
      row.style.transform = t > 0 ? `perspective(520px) rotateX(${ang}deg)` : '';
      row.style.filter = t > 0 ? `brightness(${1 - 0.55 * t})` : '';
    });
  };
  useEffect(roll, [residents.length, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const step = (d: number) => vp.current?.scrollBy({ top: d * PITCH, behavior: 'smooth' });

  return (
    <div data-mock-ribbon="" style={{ position: 'relative', width: COL_W }}>
      <div ref={vp} data-mock-viewport="" onScroll={roll}
        style={{
          position: 'relative', height: viewH, overflowY: residents.length > rows ? 'auto' : 'hidden', overflowX: 'hidden',
          scrollSnapType: 'y mandatory', scrollPaddingTop: ROD_H, scrollbarWidth: 'none', overscrollBehavior: 'contain',
        }}>
        <div style={{ height: ROD_H }} />
        {residents.map((r, i) => (
          <div key={r.id} ref={(el) => { rowRefs.current[i] = el; }} data-mock-row={i}
            style={{ position: 'relative', height: PITCH, width: COL_W, scrollSnapAlign: 'start' }}>
            {selected === r.id && (
              <div style={{ position: 'absolute', left: RING_CX - 40, top: PITCH / 2 - 40, width: 80, height: 80, borderRadius: '50%', boxShadow: '0 0 14px 5px rgba(240,214,130,.55)', pointerEvents: 'none' }} />
            )}
            <div style={{ transform: `scale(${K})`, transformOrigin: '0 0', width: ZG.columnW, height: ZG.pitch }}>
              <RosterRow resident={r} locked={false} onSelect={onSelect} />
            </div>
          </div>
        ))}
        <div style={{ height: ROD_H }} />
      </div>
      {/* rollers sit exactly on the viewport's cut lines: the cut is never visible */}
      <div style={{ position: 'absolute', left: BAND_X - 6, top: 0, zIndex: 3 }}>
        <Rod width={COL_W - BAND_X + 2} testId="top"><RodCount n={above} dir="up" onClick={() => step(-1)} /></Rod>
      </div>
      <div style={{ position: 'absolute', left: BAND_X - 6, top: viewH - ROD_H, zIndex: 3 }}>
        <Rod width={COL_W - BAND_X + 2} testId="bottom"><RodCount n={below} dir="down" onClick={() => step(1)} /></Rod>
      </div>
    </div>
  );
}

/* ───────────────────────── Open state: derived from the /game roster ───────────────────────── */

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
/** Open panel height that is not the card list: padding, header, tabs, controls, footer, gaps (measured). */
const OPEN_CHROME_H = 206;
const STATE_LABEL: Record<ZanaraRosterState, string> = { available: 'Pronto', away: 'In viaggio', exhausted: 'Stremato', injured: 'Ferito', dead: 'Caduto', locked: 'Assegnato' };
const STATE_COLOR: Record<ZanaraRosterState, string> = { available: '#3fd6a4', away: '#9fc3d6', exhausted: '#f0c987', injured: '#f0a070', dead: '#93a4ad', locked: '#9fc3d6' };

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
    <button type="button" onClick={onSelect} data-mock-card="" style={{
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

function OpenRoster({ residents, selected, onSelect, onClose, height }: {
  residents: ResidentState[]; selected: string | null; onSelect: (id: string) => void; onClose: () => void; height: number;
}) {
  const [tab, setTab] = useState<Tab>('all');
  const [sort, setSort] = useState<RosterSortMode>('name-asc');
  const [dense, setDense] = useState(false);
  const [stat, setStat] = useState<FilterStatKey | ''>('');
  const [op, setOp] = useState<FilterOperator>('>=');
  const [thr, setThr] = useState(10);
  const cardH = dense ? CARD_H_DENSE : CARD_H;
  const criteria: FilterCriterion[] = stat ? [{ stat, operator: op, threshold: thr }] : [];
  const counts = Object.fromEntries(TABS.map((tb) => [tb.id, residents.filter((r) => tb.match(zanaraRosterState(r, false).state)).length])) as Record<Tab, number>;
  const shown = sortResidents(filterResidents(residents, criteria), sort).filter((r) => TABS.find((x) => x.id === tab)!.match(zanaraRosterState(r, false).state));
  /* panel = its content, capped at the ribbon's height: rows needed (2 per line), never empty rows */
  const rowsNeeded = Math.max(1, Math.ceil(shown.length / 2));
  const rowsFit = Math.max(1, Math.floor((height - OPEN_CHROME_H + CARD_GAP) / (cardH + CARD_GAP)));
  const listH = Math.min(rowsNeeded, rowsFit) * (cardH + CARD_GAP) - CARD_GAP;

  return (
    <section data-mock-open="" aria-label="Compagnia" style={{
      position: 'relative', width: 620, height: OPEN_CHROME_H + listH, display: 'flex', flexDirection: 'column', gap: 12, padding: '18px 20px 16px',
      borderRadius: 18, background: `linear-gradient(180deg, rgba(18,66,60,.96), rgba(7,34,31,.97))`,
      border: `2.5px solid ${GOLD}`, boxShadow: `inset 0 0 0 1.5px ${GOLD_DK}, inset 0 0 30px rgba(0,0,0,.45), 0 6px 18px rgba(1,14,18,.75)`,
    }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0, fontFamily: '"Cinzel", serif', fontSize: 24, color: INK, fontWeight: 600, letterSpacing: 1 }}>Compagnia</h2>
        <span style={{ fontFamily: '"EB Garamond", serif', fontSize: 16, color: SUB }}>{counts.ready} pronti su {residents.length}</span>
        <button type="button" onClick={() => setDense((d) => !d)} style={{ ...ctl, marginLeft: 'auto', cursor: 'pointer' }}>{dense ? 'Schede' : 'Compatto'}</button>
        <button type="button" onClick={onClose} aria-label="Chiudi" style={{ ...ctl, width: 34, padding: 0, cursor: 'pointer', fontSize: 18 }}>✕</button>
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
        <div data-mock-open-list="" style={{
          height: listH, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: cardH, gap: CARD_GAP, alignContent: 'start',
          scrollSnapType: 'y mandatory', paddingRight: 4, scrollbarWidth: 'thin', scrollbarColor: `${GOLD_DK} transparent`,
        }}>
          {shown.map((r) => <HeroCard key={r.id} r={r} dense={dense} selected={selected === r.id} onSelect={() => onSelect(r.id)} />)}
          {shown.length === 0 && <p style={{ gridColumn: '1 / -1', color: SUB, fontFamily: '"EB Garamond", serif', fontSize: 16 }}>Nessun eroe con questi filtri.</p>}
        </div>
      </div>
      <footer style={{ fontFamily: '"EB Garamond", serif', fontSize: 14, color: SUB, opacity: 0.85 }}>Trascina un eroe su uno slot per assegnarlo · R apre e chiude</footer>
    </section>
  );
}

/* ───────────────────────── Page ───────────────────────── */

const LABEL: CSSProperties = {
  fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: 1, color: '#cfe6f0',
  background: 'rgba(3,14,24,0.85)', borderRadius: 4, padding: '4px 9px', border: '1px solid transparent', cursor: 'pointer',
};

export default function HudRosterMockupPage() {
  const params = new URLSearchParams(window.location.search);
  const { t } = useTranslation('idleVillage');
  const { state, config } = useMinimalGameplayWithIdleVillageConfig();
  const [n, setN] = useState(Number(params.get('n') ?? 14));
  const [open, setOpen] = useState(params.get('open') === '1');
  const [selected, setSelected] = useState<string | null>(null);
  const residents = useDemoResidents(n);
  const [win, setWin] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setWin({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    const key = (e: KeyboardEvent) => { if (e.key === 'r' || e.key === 'R') setOpen((o) => !o); };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('keydown', key); };
  }, []);
  const f = useMemo(() => frameFor(win.w, win.h, zoomFor('auto', win.w, win.h)), [win]);
  const rects = useMemo(() => resolveAll(resolveSlots(f).slots, f), [f]);
  const ready = residents.filter((r) => zanaraRosterState(r, false).state === 'available').length;

  const colLeft = M + CREST / 2 - RING_CX;
  const ribbonTop = M + CREST - 22;
  const reserve = 54 * K + M + 96; // band end + margin + room for Voce/toast (bottom-left stack)
  const visible = Math.max(1, Math.min(6, Math.floor((f.H - ribbonTop - 2 * ROD_H - reserve) / PITCH)));
  const rows = Math.max(1, Math.min(residents.length, visible));
  const ribbonH = rows * PITCH + 2 * ROD_H;

  if (params.get('study') === 'crest') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a1f22', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 80 }}>
        <style>{SPIN_CSS}</style>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Crest size={CREST * 2.5} ready={ready} total={residents.length} open={false} onToggle={() => undefined} />
        </div>
        <div style={{ transform: 'scale(2)', transformOrigin: 'center' }}>
          <HudRealNav navItems={DEFAULT_GAME_FRAME_CONFIG.navItems} activeNavId="map" onNavSelect={() => undefined} onRecenter={() => undefined} />
        </div>
      </div>
    );
  }

  return (
    <div data-hudreal-lift="" style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <style>{`[data-hudslot]{filter:drop-shadow(0 2px 5px rgba(1,14,18,.7)) drop-shadow(0 0 1px rgba(1,14,18,.9))}${SPIN_CSS}`}</style>
      <PixiWorldMap manifestPath={MAP_MANIFEST} stageColor="#1675ad" />
      <div style={{ position: 'absolute', left: 0, top: 0, width: f.W, height: f.H, transform: `scale(${f.scale})`, transformOrigin: 'top left' }}>
        {/* closed roster: band, ribbon, crest, plaque */}
        <div data-hudslot="roster" style={{ position: 'absolute', left: 0, top: 0, width: colLeft + COL_W + 240, height: ribbonTop + ribbonH + 90, zIndex: 6 }}>
          <div style={{
            position: 'absolute', left: colLeft + BAND_X, top: M + CREST / 2, width: BAND_W, height: ribbonTop - (M + CREST / 2) + ribbonH,
            backgroundImage: `url(${ZA.bandTile})`, backgroundRepeat: 'repeat-y', backgroundSize: `${BAND_W}px ${ZG.band.tileH * K}px`,
          }} />
          <div style={{ position: 'absolute', left: colLeft, top: ribbonTop }}>
            <MedallionRibbon residents={residents} visible={visible} selected={selected} onSelect={(id) => setSelected(id)} />
          </div>
          <img src={ZA.bandEnd} alt="" draggable={false} style={{ position: 'absolute', left: colLeft + BAND_X - ZG.bandEnd.bandX * K, top: ribbonTop + ribbonH - 4, width: ZG.bandEnd.w * K, height: ZG.bandEnd.h * K }} />
          <div style={{ position: 'absolute', left: M + CREST / 2, top: M + CREST / 2 - 28, zIndex: 1 }}>
            <div style={{ marginLeft: CREST / 2 - 8 }}><CompanyPlaque ready={ready} total={residents.length} /></div>
          </div>
          <div style={{ position: 'absolute', left: M, top: M, zIndex: 4 }}>
            <Crest ready={ready} total={residents.length} open={open} onToggle={() => setOpen((o) => !o)} />
          </div>
        </div>

        {open && (
          <div style={{ position: 'absolute', left: colLeft + COL_W + 18, top: M + 56 + 24, zIndex: 7 }}>
            <OpenRoster residents={residents} selected={selected} onSelect={setSelected} onClose={() => setOpen(false)} height={ribbonTop + ribbonH - (M + 56 + 24)} />
          </div>
        )}

        <div data-hudslot="time" style={{ position: 'absolute', left: rects.time.x + (rects.time.w - 419.5) / 2, top: rects.time.y, zIndex: 5 }}><HudRealTimeConnected /></div>
        <div data-hudslot="resources" style={{ position: 'absolute', left: rects.resources.x + (rects.resources.w - 360) / 2, top: rects.resources.y - 1, zIndex: 5 }}>
          <HudRealResources items={buildResourceReadoutItems(selectResourceOutlook(state, config), t)} />
        </div>
        <div data-hudslot="nav" style={{ ...place(rects.nav), zIndex: 5 }}>
          <HudRealNav navItems={DEFAULT_GAME_FRAME_CONFIG.navItems} activeNavId="map" onNavSelect={() => undefined} onRecenter={() => undefined} />
        </div>

        <div data-mock-controls="" style={{ position: 'absolute', right: M, top: rects.panel.y, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, zIndex: 9 }}>
          {[1, 5, 14].map((k) => (
            <button key={k} type="button" data-mock-n={k} onClick={() => setN(k)} style={{ ...LABEL, borderColor: n === k ? '#d4af37' : 'transparent' }}>{k} eroi</button>
          ))}
          <button type="button" data-mock-toggle="" onClick={() => setOpen((o) => !o)} style={LABEL}>{open ? 'chiudi' : 'apri'} (R)</button>
          <span style={{ ...LABEL, cursor: 'default' }}>MOCKUP · cornici CSS provvisorie</span>
        </div>
      </div>
    </div>
  );
}

const place = (r: Rect): CSSProperties => ({ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h });
const SPIN_CSS = `@keyframes mockBezel{to{transform:rotate(360deg)}} .mock-bezel-spin{animation:mockBezel 240s linear infinite} @media (prefers-reduced-motion: reduce){.mock-bezel-spin{animation:none}}`;
