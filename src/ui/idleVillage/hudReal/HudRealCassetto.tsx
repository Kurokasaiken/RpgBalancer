/**
 * HudRealCassetto — PLAN-113/114 family B: the quest planner drawer (dossier on map).
 * Director rulings 2026-11-06 — form + internals signed against `cassetto-rich-0.png`:
 * thick carved gold frame with corner gem clusters; left seam = full-height filigree
 * volute + faceted emerald brooch + teardrop pendants; 6 rail buttons in one row; title
 * cartouche; every zone inside its own ornate frame block; journey = chevron band;
 * risk = skull medallion; CONFIRM = enamel cartouche plaque. The ghiera is the REAL
 * certified ResidentSlotRack/SlotV12Renderer mount (seat choreography untouched).
 * Ornament primitives are inline SVG (CassOrn*) — the carved nine-slice art pass is F3.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';
import { EngravedIcon } from '@/ui/idleVillage/components/gameFrame/engravedIcons';
import { StashItemTile } from '@/ui/idleVillage/components/gameFrame/stashItemFace';

const C = {
  field: '#0d1f1d', fieldHi: '#143229', navy: '#0a1a22', fieldDark: '#07121a',
  ink: '#f3e7c4', muted: '#8fb2a2',
  gold: '#c9a94e', goldDark: '#8a6f35', goldHi: '#f0d68a', goldDeep: '#5e4a20',
  emerald: '#1fb877', emeraldDark: '#0d5c40', emeraldGlow: '#2fd4a3',
  danger: '#c04f4f', shadow: '0 14px 50px rgba(0,0,0,.6)',
} as const;

/* ---------------- ornament primitives (inline SVG, no assets) ---------------- */

/** Faceted emerald — a small carved gem: bright facet + dark rim + gold bezel. */
const OrnGem: React.FC<{ size?: number; facet?: boolean }> = ({ size = 10, facet = true }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" style={{ display: 'block' }}>
    <defs>
      <radialGradient id={`gemg${size}`} cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#aef0cf" />
        <stop offset="40%" stopColor={C.emeraldGlow} />
        <stop offset="100%" stopColor={C.emeraldDark} />
      </radialGradient>
    </defs>
    <polygon points="10,1 18,7 15,19 5,19 2,7" fill={`url(#gemg${size})`} stroke={C.goldDark} strokeWidth="1.2" />
    {facet && <polygon points="10,4 14,8 10,15 6,8" fill="rgba(255,255,255,.22)" />}
  </svg>
);

/** Hanging teardrop pendant — emerald drop on a tiny gold stem. */
const OrnDrop: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg width={size} height={size * 1.6} viewBox="0 0 16 26" aria-hidden="true" style={{ display: 'block' }}>
    <path d="M8 0 L8 5" stroke={C.gold} strokeWidth="1.4" />
    <path d="M8 5 C13 12 14 17 8 24 C2 17 3 12 8 5 Z" fill={`url(#dropg)`} stroke={C.goldDark} strokeWidth="1" />
    <defs>
      <radialGradient id="dropg" cx="40%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#aef0cf" /><stop offset="50%" stopColor={C.emerald} /><stop offset="100%" stopColor={C.emeraldDark} />
      </radialGradient>
    </defs>
    <path d="M6 9 C7 8 8 7 8 7" stroke="rgba(255,255,255,.55)" strokeWidth="1" fill="none" />
  </svg>
);

/** Organic filigree scroll stroke — one sinuous carved volute for the seam. */
const OrnFiligree: React.FC<{ w: number; h: number; flip?: boolean }> = ({ w, h, flip }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block' }}>
    <g stroke={C.gold} strokeWidth="2.6" fill="none" strokeLinecap="round" transform={flip ? `scale(-1,1) translate(-${w},0)` : undefined}>
      <path d={`M${w * 0.5} 4 C${w * 0.08} ${h * 0.18}, ${w * 0.92} ${h * 0.30}, ${w * 0.5} ${h * 0.48} C${w * 0.08} ${h * 0.66}, ${w * 0.92} ${h * 0.78}, ${w * 0.5} ${h - 4}`} />
      <path d={`M${w * 0.5} ${h * 0.16} q${w * 0.22} -10 ${w * 0.22} -22`} strokeWidth="2" />
      <path d={`M${w * 0.5} ${h * 0.84} q${w * 0.22} 10 ${w * 0.22} 22`} strokeWidth="2" />
    </g>
  </svg>
);

/** Corner filigree cluster — two carved curls + a gem, placed on the frame corners. */
const OrnCorner: React.FC<{ corner: 'tl' | 'tr' | 'bl' | 'br' }> = ({ corner }) => {
  const rot = { tl: 0, tr: 90, br: 180, bl: 270 }[corner];
  const pos: React.CSSProperties = {
    tl: { top: -6, left: -6 }, tr: { top: -6, right: -6 },
    br: { bottom: -6, right: -6 }, bl: { bottom: -6, left: -6 },
  }[corner];
  return (
    <div aria-hidden="true" style={{ position: 'absolute', width: 34, height: 34, transform: `rotate(${rot}deg)`, ...pos }}>
      <svg width="34" height="34" viewBox="0 0 34 34">
        <path d="M2 18 Q2 2 18 2 M4 22 Q4 8 20 4" stroke={C.gold} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <polygon points="17,4 22,9 17,14 12,9" fill={C.emerald} stroke={C.goldDark} strokeWidth="1.2" />
      </svg>
    </div>
  );
};

/** Ornate frame block — the signed "every zone in its own carved frame" wrapper. */
const CassBlock: React.FC<{ label?: string; children: React.ReactNode; pad?: string }> = ({ label, children, pad = '8px 12px 10px' }) => (
  <div
    style={{
      position: 'relative', margin: '6px 12px',
      border: `1.5px solid ${C.gold}`, borderRadius: 10,
      background: `linear-gradient(180deg, #0e2226 0%, ${C.fieldDark} 100%)`,
      boxShadow: `inset 0 0 0 1px ${C.goldDeep}, inset 0 2px 10px rgba(0,0,0,.5), 0 2px 6px rgba(0,0,0,.3)`,
      padding: pad,
    }}
  >
    {['tl', 'tr', 'bl', 'br'].map((c) => <OrnCorner key={c} corner={c as 'tl'} />)}
    {label && (
      <div style={{ textAlign: 'center', fontSize: 11, letterSpacing: 2.4, color: C.goldHi, textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,.7)', marginBottom: 6, fontWeight: 600 }}>
        {label}
      </div>
    )}
    {children}
  </div>
);

/** The carved seam — full-height filigree volute + big brooch + teardrop pendants. */
const SeamOrnament: React.FC = () => (
  <div aria-hidden="true" style={{ position: 'absolute', left: -26, top: 0, bottom: 0, width: 30, pointerEvents: 'none' }}>
    {/* gold rail */}
    <div style={{ position: 'absolute', left: 18, top: 8, bottom: 8, width: 8, borderRadius: 4, background: `linear-gradient(90deg, ${C.goldDark}, ${C.gold}, ${C.goldHi} 50%, ${C.gold}, ${C.goldDark})`, boxShadow: 'inset 0 0 4px rgba(0,0,0,.55)' }} />
    {/* filigree volutes down the seam */}
    <div style={{ position: 'absolute', left: 4, top: 26 }}>
      {[0, 1, 2, 3].map((i) => (
        <OrnFiligree key={i} w={26} h={120} flip={i % 2 === 1} />
      ))}
    </div>
    {/* the big faceted brooch */}
    <div
      style={{
        position: 'absolute', left: -4, top: '42%', width: 44, height: 44, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, #aef0cf 0%, ${C.emeraldGlow} 32%, ${C.emerald} 58%, ${C.emeraldDark} 92%)`,
        border: `3px solid ${C.gold}`,
        boxShadow: `0 0 0 3px ${C.goldDark}, 0 0 16px 4px rgba(31,184,119,.5), 0 4px 10px rgba(0,0,0,.65)`,
      }}
    />
    <div style={{ position: 'absolute', left: 8, top: 'calc(42% + 10px)', width: 20, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,.35)', filter: 'blur(1px)' }} />
    {/* teardrop pendants under the brooch */}
    <div style={{ position: 'absolute', left: 12, top: 'calc(42% + 48px)', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <OrnDrop size={12} /><OrnDrop size={10} /><OrnDrop size={8} />
    </div>
  </div>
);

/** Title cartouche — pointed gold plaque with gem accents + thin divider above. */
const TitleCartouche: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div style={{ margin: '4px 12px 0', textAlign: 'center' }}>
    <div style={{ height: 1, margin: '0 10px 6px', background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />
    <div
      style={{
        position: 'relative', display: 'inline-block', padding: '5px 34px',
        border: `1.5px solid ${C.gold}`,
        borderRadius: '18px 2px 18px 2px',
        background: `linear-gradient(180deg, #0f2a26, ${C.navy})`,
        boxShadow: `inset 0 0 0 1px ${C.goldDeep}, 0 2px 8px rgba(0,0,0,.45)`,
      }}
    >
      <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }}><OrnGem size={8} /></div>
      <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}><OrnGem size={8} /></div>
      <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1.6, color: C.goldHi, textShadow: '0 1px 3px rgba(0,0,0,.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
        {title}
      </div>
    </div>
    <div style={{ marginTop: 5, fontSize: 12, fontStyle: 'italic', color: C.ink, textShadow: '0 1px 2px rgba(0,0,0,.5)' }}>{subtitle}</div>
  </div>
);

/** One chevron leg of the journey band — clip-path arrow shape. */
const ChevronLeg: React.FC<{ label: string; days: number; active?: boolean; first?: boolean; last?: boolean }> = ({ label, days, active, first, last }) => (
  <div
    style={{
      flex: 1, position: 'relative', padding: '6px 8px 4px', textAlign: 'center',
      background: active
        ? `linear-gradient(180deg, ${C.emeraldGlow} -30%, ${C.emeraldDark} 110%)`
        : `linear-gradient(180deg, #1a3a30, ${C.navy})`,
      border: `1.5px solid ${C.gold}`,
      clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)',
      marginLeft: first ? 0 : -6,
      filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.5))',
    }}
  >
    <div style={{ fontSize: 8.5, letterSpacing: 1, color: active ? '#eafff3' : C.muted, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 800, color: active ? '#ffffff' : C.goldHi }}>{typeof days === 'number' ? `${days}d` : days}</div>
  </div>
);

/* ---------------- component ---------------- */

export interface CassettoQuest {
  title: string;
  subtitle: string;
  briefing: string;
  legs: Array<{ label: string; days: number | string }>;
  riskLabel: string;
  rewards: Array<{ icon: string; qty: string }>;
}

export interface LoadoutRow {
  id: string;
  icon: string;
  label: string;
  qty?: number;
  packed: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export interface HudRealCassettoProps {
  quest: CassettoQuest;
  /** The REAL rack view models — the session's `controller.slots`, never lab fabrications. */
  slots: ResidentSlotViewModel[];
  onSlotClick?: (slotId: string) => void;
  onSlotClear?: (slotId: string) => void;
  suppressedResidentIds?: readonly string[];
  loadoutRows?: LoadoutRow[];
  canSend?: boolean;
  onConfirm?: () => void;
}

const RailBtn: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <button
    type="button" aria-label={label} title={label}
    style={{
      width: 27, height: 27, borderRadius: '50%', border: `1.6px solid ${C.gold}`,
      background: `radial-gradient(circle at 36% 30%, #1b3a30 0%, ${C.navy} 70%)`,
      boxShadow: `inset 0 0 0 1px ${C.goldDeep}, 0 2px 6px rgba(0,0,0,.55), inset 0 -2px 5px rgba(0,0,0,.45), inset 0 1px 2px rgba(255,255,255,.12)`,
      color: C.goldHi, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', padding: 0, flex: '0 0 auto',
    }}
  >
    <EngravedIcon icon={icon} size={13} />
  </button>
);

export const HudRealCassetto: React.FC<HudRealCassettoProps> = ({
  quest, slots, onSlotClick, onSlotClear, suppressedResidentIds, loadoutRows = [], canSend = true, onConfirm,
}) => {
  const { t } = useTranslation('idleVillage');

  const railButtons = [
    ['ico-banner', t('gameFrame.cassetto.rail.party', 'Gruppo')],
    ['ico-pouch', t('gameFrame.cassetto.rail.bag', 'Zaino')],
    ['ico-scroll', t('gameFrame.cassetto.rail.log', 'Log')],
    ['cmd-speed', t('gameFrame.cassetto.rail.check', 'Skill check')],
    ['cmd-minimize', t('gameFrame.cassetto.rail.minimize', 'Riduci')],
    ['cmd-close', t('gameFrame.cassetto.rail.close', 'Chiudi')],
  ] as const;

  return (
    <div
      data-hudreal-cassetto=""
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        borderRadius: '18px 0 0 18px',
        background: `linear-gradient(175deg, ${C.fieldHi} 0%, ${C.field} 38%, ${C.navy} 100%)`,
        border: `3px solid ${C.gold}`,
        boxShadow: `${C.shadow}, inset 0 0 0 1.5px ${C.goldDark}, inset 0 0 0 3px ${C.fieldDark}, inset 0 0 70px rgba(20,90,66,.4)`,
        fontFamily: '"EB Garamond", serif', color: C.ink,
        overflow: 'visible',
      }}
    >
      {/* corner gem clusters on the outer frame */}
      <OrnCorner corner="tl" /><OrnCorner corner="tr" /><OrnCorner corner="br" /><OrnCorner corner="bl" />
      {/* the carved seam with brooch + pendants */}
      <SeamOrnament />

      {/* header — 6 rail buttons in ONE row */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 7, padding: '10px 14px 2px', flex: '0 0 auto' }}>
        {railButtons.map(([icon, label]) => <RailBtn key={icon} icon={icon} label={label} />)}
      </div>

      {/* title cartouche + subtitle */}
      <TitleCartouche title={quest.title} subtitle={quest.subtitle} />

      {/* briefing — framed block (fixed) */}
      <CassBlock pad="10px 14px">
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: C.ink }}>{quest.briefing}</p>
      </CassBlock>

      {/* scroll region — the middle zones scroll inside the drawer when the
          party/journey/risk stack is taller than the frame (production parity). */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}>

      {/* party slots — framed block, REAL ghiera rack fed by the expedition session */}
      <CassBlock label={t('gameFrame.cassetto.party', 'Party Slots')}>
        <ResidentSlotRack
          slots={slots}
          layout="detail"
          slotSize={50}
          slotMaterial="hud-gold"
          slotVariant="hud64"
          bezelPreset="b"
          onSlotClick={onSlotClick}
          onSlotClear={onSlotClear}
          suppressedResidentIds={suppressedResidentIds}
        />
        <div style={{ fontSize: 9.5, color: C.muted, fontStyle: 'italic', marginTop: 4, textAlign: 'center' }}>
          {t('gameFrame.cassetto.slotHint', 'Click per assegnare · tieni premuto per togliere')}
        </div>
      </CassBlock>

      {/* loadout — framed block, REAL village stash bag (packed slots / shelf tiles) */}
      <CassBlock label={t('gameFrame.cassetto.loadout', 'Carico')}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {loadoutRows.map((row) => (
            <button
              key={row.id} type="button" title={row.label}
              data-testid={`cassetto-loadout-${row.id}`} data-packed={row.packed}
              onClick={row.onToggle}
              disabled={row.disabled}
              style={{
                padding: 0, border: 'none', background: 'transparent', cursor: row.disabled ? 'default' : 'pointer',
                borderRadius: 8, outline: row.packed ? `2px solid ${C.emerald}` : 'none',
                boxShadow: row.packed ? `0 0 8px rgba(31,184,119,.5)` : 'none',
                opacity: row.disabled ? .3 : row.packed ? 1 : .65, transition: 'opacity .15s, box-shadow .15s',
              }}
            >
              <StashItemTile icon={row.icon} qty={row.packed ? row.qty : undefined} size={32} iconSize={20} />
            </button>
          ))}
        </div>
      </CassBlock>

      {/* journey — chevron band (signed A) */}
      <CassBlock label={t('gameFrame.cassetto.journey', 'Journey')}>
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {quest.legs.map((leg, i) => (
            <ChevronLeg key={leg.label} label={leg.label} days={leg.days} active={i === 1} first={i === 0} last={i === quest.legs.length - 1} />
          ))}
        </div>
      </CassBlock>

      {/* risk & rewards — framed block, skull medallion */}
      <CassBlock label={t('gameFrame.cassetto.riskRewards', 'Risk & Rewards')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: '0 0 auto' }}>
            <span
              aria-hidden="true"
              style={{
                width: 34, height: 34, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: `radial-gradient(circle at 38% 30%, #4a2a1a, #160a05)`,
                border: `2px solid ${C.gold}`, boxShadow: `inset 0 0 8px rgba(0,0,0,.65), 0 0 0 1px ${C.goldDeep}, 0 0 8px rgba(192,79,79,.45)`,
                fontSize: 17,
              }}
            >☠</span>
            <div style={{ fontSize: 10, letterSpacing: 1, color: C.muted, textTransform: 'uppercase' }}>{t('gameFrame.cassetto.risk', 'RISK')}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.danger, letterSpacing: .8 }}>{quest.riskLabel}</div>
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: `linear-gradient(180deg, transparent, ${C.gold}, transparent)` }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {quest.rewards.map((r) => (
              <span key={r.icon} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: C.goldHi }}>
                <img src={`/assets/ui/resources/res-${r.icon}-64.webp`} alt="" width={22} height={22} draggable={false} />{r.qty}
              </span>
            ))}
          </div>
        </div>
      </CassBlock>
      </div>{/* end scroll region */}

      {/* CONFIRM — ornate enamel cartouche plaque with pointed filigree ends */}
      <div style={{ marginTop: 'auto', padding: '4px 12px 14px', flex: '0 0 auto', position: 'relative' }}>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canSend}
          style={{
            position: 'relative', width: '100%', padding: '11px 0', border: 'none', cursor: canSend ? 'pointer' : 'default',
            opacity: canSend ? 1 : .45, filter: canSend ? 'none' : 'grayscale(.5)',
            borderRadius: '24px 4px 24px 4px',
            background: `linear-gradient(180deg, ${C.emeraldGlow} -40%, ${C.emerald} 30%, ${C.emeraldDark} 100%)`,
            boxShadow: `0 0 0 2px ${C.gold}, 0 0 0 4px ${C.goldDeep}, 0 8px 20px rgba(0,0,0,.6), inset 0 1px 4px rgba(255,255,255,.45), inset 0 -4px 10px rgba(0,0,0,.4)`,
            color: '#f4fff8', fontSize: 16, fontWeight: 800, letterSpacing: 3.5, textTransform: 'uppercase',
            fontFamily: 'inherit', textShadow: '0 1px 3px rgba(0,0,0,.7)',
          }}
        >
          {t('gameFrame.cassetto.confirm', 'CONFIRM')}
        </button>
        <div aria-hidden="true" style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)' }}><OrnGem size={13} /></div>
        <div aria-hidden="true" style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)' }}><OrnGem size={13} /></div>
      </div>
    </div>
  );
};

export default HudRealCassetto;
