/**
 * HudRealCassetto — PLAN-113/114 family B: the quest planner drawer (dossier on map).
 * Director rulings 2026-11-06 — form + internals signed against `cassetto-rich-0.png`.
 * F3 art pass (2026-11-09): `/assets/ui/hud-real/cassetto/frame.webp` (639×1613 RGBA)
 * is the cut-out, background-free, text-free frame asset extracted from the signed art
 * (`cassetto-rich-0.png` + clean navy wells from `internals-v2-0.png`).
 * Zero opaque cover patches: live i18n text, the REAL certified ResidentSlotRack mount,
 * the REAL village stash bag, and the live CONFIRM button sit directly inside the
 * clean painted enamel/navy wells.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';
import { StashItemTile } from '@/ui/idleVillage/components/gameFrame/stashItemFace';

const FRAME_SRC = '/assets/ui/hud-real/cassetto/frame.webp';
/** Cut-out RGBA asset dimensions (x=9..648, y=10..1623 of the 656×1632 signed source). */
const ART_W = 639;
const ART_H = 1613;

const C = {
  ink: '#f3e7c4',
  muted: '#8fb2a2',
  goldHi: '#f0d68a',
  emeraldGlow: '#2fd4a3',
  danger: '#e86a5e',
  shadow: '0 14px 44px rgba(0,0,0,.68)',
} as const;

export interface CassettoLeg { label: string; days: number | string }
export interface CassettoQuest {
  title: string;
  subtitle?: string;
  briefing: string;
  legs: CassettoLeg[];
  riskLabel: string;
  rewards: { icon: string; qty: string }[];
}
export interface LoadoutRow {
  id: string;
  icon: string;
  label?: string;
  qty?: number;
  packed?: boolean;
  disabled?: boolean;
  onToggle?: () => void;
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

/** A zone rect on the 639×1613 cut-out RGBA art (offset by -9, -10 from raw 656×1632). */
interface Zone { x: number; y: number; w: number; h: number }

const Z = {
  title: { x: 227, y: 176, w: 318, h: 42 },
  subtitle: { x: 216, y: 238, w: 340, h: 38 },
  briefing: { x: 215, y: 300, w: 342, h: 256 },
  partyLabel: { x: 225, y: 594, w: 322, h: 30 },
  slots: { x: 214, y: 632, w: 344, h: 156 },
  loadout: { x: 215, y: 800, w: 342, h: 64 },
  journeyLabel: { x: 260, y: 906, w: 252, h: 38 },
  journeyLegs: { x: 218, y: 980, w: 336, h: 38 },
  journeySubs: { x: 215, y: 1034, w: 342, h: 52 },
  riskLabel: { x: 250, y: 1144, w: 296, h: 38 },
  riskValue: { x: 244, y: 1298, w: 116, h: 74 },
  rewards: { x: 382, y: 1292, w: 172, h: 82 },
  confirm: { x: 224, y: 1450, w: 336, h: 78 },
} satisfies Record<string, Zone>;

const pct = (z: Zone): React.CSSProperties => ({
  position: 'absolute',
  left: `${(z.x / ART_W) * 100}%`,
  top: `${(z.y / ART_H) * 100}%`,
  width: `${(z.w / ART_W) * 100}%`,
  height: `${(z.h / ART_H) * 100}%`,
});

const cqw = (px: number) => `${(px / ART_W) * 100}cqw`;

/* Force the 4 detail slots onto a single evenly-spaced 4-column row inside the Party Slots well */
const RACK_SCOPED_CSS = `
[data-hudreal-cassetto] [data-testid="resident-slot-rack"] {
  --slot-rack-gap: 10px;
  display: grid !important;
  grid-template-columns: repeat(4, 72px) !important;
  gap: 8px !important;
  align-items: start !important;
  justify-items: center !important;
}
`;

export const HudRealCassetto: React.FC<HudRealCassettoProps> = ({
  quest, slots, onSlotClick, onSlotClear, suppressedResidentIds, loadoutRows = [], canSend = true, onConfirm,
}) => {
  const { t } = useTranslation('idleVillage');
  return (
    <div
      data-hudreal-cassetto=""
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        fontFamily: '"EB Garamond", serif', color: C.ink,
        filter: `drop-shadow(${C.shadow})`,
        pointerEvents: 'none',
      }}
    >
      <style>{RACK_SCOPED_CSS}</style>
      <div
        style={{
          position: 'relative',
          height: '100%',
          aspectRatio: `${ART_W} / ${ART_H}`,
          containerType: 'size',
          pointerEvents: 'auto',
        }}
      >
        <img
          src={FRAME_SRC}
          alt=""
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        />

        {/* Title inside the clean emerald cartouche */}
        <div style={{ ...pct(Z.title), display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2%' }}>
          <span style={{
            fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: cqw(17.5), fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase', color: C.goldHi,
            textShadow: '0 1px 3px rgba(0,0,0,.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {quest.title}
          </span>
        </div>

        {/* Subtitle on the emerald band */}
        <div style={{ ...pct(Z.subtitle), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontStyle: 'italic', fontSize: cqw(14), color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {quest.subtitle}
          </span>
        </div>

        {/* Briefing well */}
        <div style={{ ...pct(Z.briefing), padding: '3.5% 4.5%', overflow: 'hidden' }}>
          <p style={{ margin: 0, fontSize: cqw(14.5), lineHeight: 1.42, color: C.ink }}>
            {quest.briefing}
          </p>
        </div>

        {/* Party Slots well header */}
        <div style={{ ...pct(Z.partyLabel), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: cqw(14.5), fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.goldHi }}>
            {t('gameFrame.cassetto.party', 'Party Slots')}
          </span>
        </div>

        {/* REAL certified ResidentSlotRack — all 4 seats fit cleanly inside the upper Party Slots well */}
        <div
          data-cassetto-rack=""
          style={{ ...pct(Z.slots), display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}
        >
          <div style={{ transform: 'scale(0.56)', transformOrigin: 'center center' }}>
            <ResidentSlotRack
              slots={slots}
              layout="detail"
              slotSize={42}
              slotMaterial="hud-gold"
              slotVariant="hud64"
              bezelPreset="b"
              onSlotClick={onSlotClick}
              onSlotClear={onSlotClear}
              suppressedResidentIds={suppressedResidentIds}
            />
          </div>
        </div>

        {/* Loadout row — REAL village stash bag inside the lower Party Slots well */}
        <div style={{ ...pct(Z.loadout), display: 'flex', gap: 5, justifyContent: 'center', alignItems: 'center' }}>
          {loadoutRows.map((row) => (
            <button
              key={row.id}
              type="button"
              title={row.label}
              data-testid={`cassetto-loadout-${row.id}`}
              data-packed={row.packed}
              onClick={row.onToggle}
              disabled={row.disabled}
              style={{
                padding: 0, border: 'none', background: 'transparent',
                cursor: row.disabled ? 'default' : 'pointer',
                borderRadius: 6,
                outline: row.packed ? `1.5px solid ${C.emeraldGlow}` : 'none',
                boxShadow: row.packed ? '0 0 8px rgba(31,184,119,.5)' : 'none',
                opacity: row.disabled ? 0.3 : row.packed ? 1 : 0.72,
              }}
            >
              <StashItemTile icon={row.icon} qty={row.packed ? row.qty : undefined} size={24} iconSize={15} />
            </button>
          ))}
        </div>

        {/* Journey header + 3 chevron legs + localized sub-labels */}
        <div style={{ ...pct(Z.journeyLabel), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: cqw(15), fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.goldHi }}>
            {t('gameFrame.cassetto.journey', 'Journey')}
          </span>
        </div>
        <div style={{ ...pct(Z.journeyLegs), display: 'flex' }}>
          {quest.legs.map((leg, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: cqw(15), fontWeight: 700, color: i === 1 ? '#eafff5' : C.goldHi, textShadow: '0 1px 3px rgba(0,0,0,.9)' }}>
                {leg.days}{typeof leg.days === 'number' ? 'd' : ''}
              </span>
            </div>
          ))}
        </div>
        <div style={{ ...pct(Z.journeySubs), display: 'flex' }}>
          {quest.legs.map((leg, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px' }}>
              <span style={{ fontSize: cqw(10.5), letterSpacing: '0.13em', textTransform: 'uppercase', color: C.muted, textAlign: 'center', lineHeight: 1.15 }}>
                {leg.label}
              </span>
            </div>
          ))}
        </div>

        {/* Risk & Rewards header + live values */}
        <div style={{ ...pct(Z.riskLabel), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: cqw(15), fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.goldHi }}>
            {t('gameFrame.cassetto.riskRewards', 'Risk & Rewards')}
          </span>
        </div>
        <div style={{ ...pct(Z.riskValue), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: cqw(10.5), letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted }}>
            {t('gameFrame.cassetto.risk', 'Risk')}
          </span>
          <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: cqw(15), fontWeight: 800, color: C.danger, textTransform: 'uppercase' }}>
            {quest.riskLabel}
          </span>
        </div>
        <div style={{ ...pct(Z.rewards), display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          {quest.rewards.map((r) => (
            <span key={r.icon} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: cqw(14), fontWeight: 700, color: C.goldHi }}>
              <img src={`/assets/ui/resources/res-${r.icon}-64.webp`} alt="" width={18} height={18} draggable={false} />
              {r.qty}
            </span>
          ))}
        </div>

        {/* CONFIRM — transparent hit button directly over the clean painted emerald plaque */}
        <button
          type="button"
          data-testid="cassetto-confirm"
          onClick={onConfirm}
          disabled={!canSend}
          aria-label={t('gameFrame.cassetto.confirm', 'CONFIRM')}
          style={{
            ...pct(Z.confirm),
            padding: 0, border: 'none', background: 'transparent',
            cursor: canSend ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: canSend ? 1 : 0.55,
          }}
        >
          <span style={{
            fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: cqw(17), fontWeight: 800,
            letterSpacing: '0.28em', textTransform: 'uppercase', color: '#eafff5',
            textShadow: '0 1px 4px rgba(0,0,0,.9)',
          }}>
            {t('gameFrame.cassetto.confirm', 'CONFIRM')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default HudRealCassetto;
