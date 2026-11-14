/**
 * HudRealCassetto — PLAN-113/114 family B: the quest planner drawer (dossier on map).
 * Director rulings 2026-11-06 — form + internals signed against `cassetto-rich-0.png`.
 * F3 art pass (2026-11-09) + PLAN-116 F1 column pass (2026-11-14): the frame is
 * the widened column art from `scripts/hud-real/build-cassetto-column.py`
 * (`column-1440.webp` / `column-1280.webp` — ruling R-323 "Dentro la cornice",
 * 420px @1440×900 / 400px @1280×800; ornaments never stretched, seams only in
 * neutral fields). Zone rects come from the generated `cassettoColumnGeometry`.
 * Zero opaque cover patches: live i18n text, the REAL certified ResidentSlotRack mount,
 * the REAL village stash bag, and the live CONFIRM button sit directly inside the
 * clean painted enamel/navy wells.
 */
import React, { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';
import { StashItemTile } from '@/ui/idleVillage/components/gameFrame/stashItemFace';
import { EngravedIcon } from '@/ui/idleVillage/components/gameFrame/engravedIcons';
import type { ResourceReadoutItem } from '@/ui/idleVillage/components/gameFrame/ResourceReadout';
import { HUD_TONE_COLOR } from '@/ui/idleVillage/components/gameFrame/hudTones';
import { ZanaraTooltip } from '@/ui/idleVillage/zanara/ZanaraTooltip';
import { CASSETTO_WIDE_BREAKPOINT, cassettoColumnSpec } from './layout/cassettoColumn';
import type { CassettoZone } from './cassettoColumnGeometry';

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
export interface CassettoLoadoutSlot {
  id: string;
  icon?: string;
  label: string;
  qty?: number;
}

/**
 * The quest bag as SLOT FRAMES (R-337): `bagSlots` wells in order, `null` =
 * empty pouch. The cassetto never lists the stash catalogue — filling happens
 * by clicking items inside the bound warehouse (`VillageStashPanel`, the
 * magazzino), exactly like the stock planner's `QuestBagSlot` contract:
 * empty slot → `onOpenStash` (opens the bound magazzino), packed slot →
 * `onReleaseItem` returns the item to the shared pool.
 */
export interface CassettoLoadout {
  slots: (CassettoLoadoutSlot | null)[];
  onReleaseItem: (itemId: string) => void;
  onOpenStash: (trigger: HTMLElement) => void;
}

export interface HudRealCassettoProps {
  quest: CassettoQuest;
  /** The REAL rack view models — the session's `controller.slots`, never lab fabrications. */
  slots: ResidentSlotViewModel[];
  /** The REAL village resource readout — mounted inside the empty navy well the
   *  signed frame paints at the top interior (Director 2026-11-14: «il mockup
   *  aveva il componente risorse in alto al suo interno»). Without it the
   *  drawer's body covers the page's own resources slot and the readout
   *  "scompare" whenever the cassetto is open. */
  resourceItems?: ResourceReadoutItem[];
  onSlotClick?: (slotId: string) => void;
  onSlotClear?: (slotId: string) => void;
  suppressedResidentIds?: readonly string[];
  loadout?: CassettoLoadout;
  canSend?: boolean;
  onConfirm?: () => void;
}

type Zone = CassettoZone;

const pct = (z: Zone, artW: number, artH: number): React.CSSProperties => ({
  position: 'absolute',
  left: `${(z.x / artW) * 100}%`,
  top: `${(z.y / artH) * 100}%`,
  width: `${(z.w / artW) * 100}%`,
  height: `${(z.h / artH) * 100}%`,
});

const cqw = (px: number, artW: number) => `${(px / artW) * 100}cqw`;

/** Viewport-wide variant switch: ≥1360px → the '1440' column art (R-323 ruling
 *  420px @1440×900 / 400px @1280×800). matchMedia keeps it live on resize. */
const WIDE_MQ = `(min-width: ${CASSETTO_WIDE_BREAKPOINT}px)`;
const subscribeWide = (cb: () => void) => {
  const mq = window.matchMedia(WIDE_MQ);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const readWide = () => window.matchMedia(WIDE_MQ).matches;
const useColumnSpec = () => {
  const wide = useSyncExternalStore(subscribeWide, readWide, () => true);
  return cassettoColumnSpec(wide ? 1440 : 1280);
};

/** Compact display for very large integers (123456 -> 123K) so a targhetta never overflows. */
function compactRes(v: string | number): string {
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(n) || Math.abs(n) < 100000) return String(v);
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

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
/* CONFIRM — the plaque is baked into the column art, so the feedback lives
   on an invisible sheen + the text layer: hover ignites an emerald glow,
   press sinks the text and darkens the plaque's face, focus gets a ring. */
[data-hudreal-cassetto] [data-testid="cassetto-confirm"] .confirm-sheen {
  position: absolute; inset: 8% 6%; border-radius: 999px;
  background: radial-gradient(ellipse at 50% 40%, rgba(170,255,214,0.55), rgba(90,225,150,0.22) 55%, transparent 78%);
  box-shadow: inset 0 0 0 1.5px rgba(214,255,234,0.6), inset 0 -8px 18px rgba(0,42,20,0.4), 0 0 30px rgba(96,232,164,0.45);
  opacity: 0; transition: opacity 160ms ease; pointer-events: none;
}
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:not(:disabled):hover .confirm-sheen { opacity: 1; }
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:not(:disabled):active .confirm-sheen {
  opacity: 1;
  background: radial-gradient(ellipse at 50% 58%, rgba(0,34,17,0.5), rgba(0,22,10,0.2) 60%, transparent 80%);
  box-shadow: inset 0 0 0 1.5px rgba(126,222,172,0.4), inset 0 9px 20px rgba(0,26,13,0.7);
}
[data-hudreal-cassetto] [data-testid="cassetto-confirm"] .confirm-text {
  transition: transform 120ms cubic-bezier(0.25, 0.46, 0.45, 0.94), text-shadow 160ms ease;
}
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:not(:disabled):hover .confirm-text {
  text-shadow: 0 0 12px rgba(152,255,202,0.6), 0 1px 4px rgba(0,0,0,0.9);
}
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:not(:disabled):active .confirm-text { transform: translateY(1px) scale(0.965); }
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:focus-visible { outline: 2px solid rgba(196,255,224,0.75); outline-offset: -5px; border-radius: 14px; }
/* Bag slots — pouch brightens on hover, packed tiles lift and glow. */
[data-hudreal-cassetto] [data-testid^="bag-slot-empty-"] svg { transition: opacity 160ms ease, filter 160ms ease; }
[data-hudreal-cassetto] [data-testid^="bag-slot-empty-"]:hover svg { opacity: 0.95 !important; filter: drop-shadow(0 0 6px rgba(223,184,87,0.6)); }
[data-hudreal-cassetto] [data-testid^="loadout-item-"] { transition: filter 160ms ease, transform 120ms ease; border-radius: 8px; }
[data-hudreal-cassetto] [data-testid^="loadout-item-"]:hover { filter: brightness(1.18) drop-shadow(0 0 5px rgba(223,184,87,0.45)); transform: translateY(-1px); }
[data-hudreal-cassetto] [data-testid^="loadout-item-"]:active { transform: translateY(0) scale(0.95); }
`;

export const HudRealCassetto: React.FC<HudRealCassettoProps> = ({
  quest, slots, resourceItems, onSlotClick, onSlotClear, suppressedResidentIds, loadout, canSend = true, onConfirm,
}) => {
  const { t } = useTranslation('idleVillage');
  const spec = useColumnSpec();
  const Z = spec.geo.zones;
  const { artW, artH } = spec.geo;
  const zp = (z: Zone) => pct(z, artW, artH);
  const fz = (px: number) => cqw(px, artW);
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
          aspectRatio: `${artW} / ${artH}`,
          containerType: 'size',
          pointerEvents: 'auto',
        }}
      >
        <img
          src={spec.src}
          alt=""
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        />

        {/* REAL resources targhette inside the cleaned header band — the
            approved fork look (ruling "Dentro la cornice"): one dark-glass
            plaque per resource, not the corner bar scaled down. */}
        {resourceItems && (
          <div
            data-cassetto-resources=""
            style={{ ...zp(Z.resources), display: 'flex', alignItems: 'stretch', gap: fz(9), padding: `${fz(5)} ${fz(7)}` }}
          >
            {resourceItems.map((item) => {
              const danger = item.tone === 'danger';
              const toneColor = item.tone ? HUD_TONE_COLOR[item.tone] : C.muted;
              const description = item.description ?? `${item.label}: ${item.value}`;
              const hint = [description !== item.label ? description : null, item.detail ? `${item.detail}` : null]
                .filter(Boolean)
                .join(' — ');
              return (
                <ZanaraTooltip key={item.id} label={item.label} hint={hint || undefined}>
                  <div
                    role="group"
                    aria-label={description}
                    tabIndex={0}
                    data-cassetto-res={item.id}
                    data-tone={item.tone}
                    style={{
                      flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: fz(9),
                      padding: `0 ${fz(9)}`, borderRadius: fz(9), cursor: 'default',
                      background: 'rgba(6, 20, 18, 0.66)',
                      boxShadow: danger
                        ? `inset 0 0 0 1px ${HUD_TONE_COLOR.danger}b8, inset 0 0 10px ${HUD_TONE_COLOR.danger}33, inset 0 0 0 1px rgba(240,214,138,.22)`
                        : 'inset 0 0 0 1px rgba(240, 214, 138, 0.30), inset 0 -6px 12px rgba(0,0,0,.35)',
                    }}
                  >
                    {/* brass socket — same grammar as the nav round buttons */}
                    <div
                      aria-hidden="true"
                      style={{
                        width: fz(58), height: fz(58), flex: 'none', borderRadius: '50%',
                        display: 'grid', placeItems: 'center',
                        background: 'radial-gradient(circle at 34% 26%, #33514a 0%, #14302b 55%, #0a1f1c 100%)',
                        boxShadow: [
                          'inset 0 1px 1px rgba(255, 236, 180, 0.22)',
                          'inset 0 -2px 3px rgba(0, 0, 0, 0.6)',
                          '0 0 0 1.5px #7a6230',
                          '0 0 0 3px rgba(20, 12, 4, 0.9)',
                          '0 1px 3px rgba(0, 0, 0, 0.75)',
                        ].join(', '),
                      }}
                    >
                      <div style={{ width: fz(36), height: fz(36), display: 'grid', placeItems: 'center', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.8))' }}>
                        {item.icon}
                      </div>
                    </div>
                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      <span
                        style={{
                          fontFamily: '"EB Garamond", serif', fontSize: fz(26), fontWeight: danger ? 700 : 600,
                          lineHeight: 1.05, fontVariantNumeric: 'tabular-nums',
                          color: danger ? HUD_TONE_COLOR.danger : '#f7efd8',
                          textShadow: '0 1px 0 rgba(255,240,200,.16), 0 1px 2px rgba(3,26,30,.9)',
                          whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline', gap: fz(4),
                        }}
                      >
                        {compactRes(item.value)}
                        {item.max !== undefined && String(item.value).length <= 3 && (
                          <span style={{ fontSize: fz(17), fontWeight: 500, color: C.muted, opacity: 0.85 }}>/{item.max}</span>
                        )}
                      </span>
                      <span
                        style={{
                          fontFamily: '"EB Garamond", serif', fontSize: fz(16), lineHeight: 1.15, color: toneColor,
                          textShadow: '0 1px 2px rgba(3,26,30,.9)', whiteSpace: 'nowrap', overflow: 'hidden',
                          textOverflow: 'ellipsis', letterSpacing: '0.06em',
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  </div>
                </ZanaraTooltip>
              );
            })}
          </div>
        )}

        {/* Title inside the clean emerald cartouche */}
        <div style={{ ...zp(Z.title), display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2%' }}>
          <span style={{
            fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: fz(27), fontWeight: 700,
            letterSpacing: '0.05em', textTransform: 'uppercase', color: C.goldHi,
            textShadow: '0 1px 3px rgba(0,0,0,.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {quest.title}
          </span>
        </div>

        {/* Subtitle on the emerald band */}
        <div style={{ ...zp(Z.subtitle), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontStyle: 'italic', fontSize: fz(21), color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {quest.subtitle}
          </span>
        </div>

        {/* Briefing well */}
        <div style={{ ...zp(Z.briefing), padding: '3.5% 4.5%', overflow: 'hidden' }}>
          <p style={{ margin: 0, fontSize: fz(23), lineHeight: 1.42, color: C.ink }}>
            {quest.briefing}
          </p>
        </div>

        {/* Party Slots well header */}
        <div style={{ ...zp(Z.partyLabel), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: fz(22), fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.goldHi }}>
            {t('gameFrame.cassetto.party', 'Party Slots')}
          </span>
        </div>

        {/* REAL certified ResidentSlotRack — all 4 seats fit cleanly inside the upper Party Slots well */}
        <div
          data-cassetto-rack=""
          style={{ ...zp(Z.slots), display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}
        >
          {/* R-335: the draghi bezels paint wider than their 44 px token boxes —
           *  the painted band must stay clear of the well's margins on every side. */}
          <div style={{ transform: 'scale(0.62)', transformOrigin: 'center center' }}>
            <ResidentSlotRack
              slots={slots}
              layout="detail"
              slotSize={42}
              slotMaterial="hud-gold"
              slotVariant="hud64"
              bezelPreset="draghi"
              onSlotClick={onSlotClick}
              onSlotClear={onSlotClear}
              suppressedResidentIds={suppressedResidentIds}
            />
          </div>
        </div>

        {/* Quest bag — empty slot frames inside the lower Party Slots well
            (R-337). Items arrive ONLY by clicking rows in the bound magazzino
            (`VillageStashPanel` → `assign` on this POI's ledger bag): an empty
            pouch opens it, a packed tile releases its item back to the pool —
            same contract as the stock planner's `QuestBagSlot`/`PackedBagItem`,
            including the `loadout-item-*` test id the shelf focuses after an
            assign. */}
        {loadout && (
          <div data-cassetto-bag="" style={{ ...zp(Z.loadout), display: 'flex', gap: fz(14), justifyContent: 'center', alignItems: 'center' }}>
            {loadout.slots.map((slot, i) => (
              <span
                key={i}
                data-testid={`bag-slot-${i}`}
                style={{
                  width: fz(56), height: fz(56), flexShrink: 0, borderRadius: fz(14),
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  border: slot ? 'none' : '1px solid rgba(240, 214, 138, 0.35)',
                  background: slot ? 'none' : 'rgba(4, 22, 28, 0.55)',
                }}
              >
                {slot ? (
                  <button
                    type="button"
                    data-testid={`loadout-item-${slot.id}`}
                    data-bag-slot-index={i}
                    aria-label={t('questExpedition.bag.removeSlot', { item: slot.label })}
                    title={slot.label}
                    onClick={() => loadout.onReleaseItem(slot.id)}
                    style={{ padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex' }}
                  >
                    <StashItemTile icon={slot.icon} qty={slot.qty} size={46} iconSize={26} />
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid={`bag-slot-empty-${i}`}
                    aria-label={t('questExpedition.bag.emptySlot', { index: i + 1 })}
                    onClick={(e) => loadout.onOpenStash(e.currentTarget)}
                    style={{
                      width: '100%', height: '100%', padding: 0, border: 'none', background: 'transparent',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <EngravedIcon id="ico-pouch" size={26} style={{ opacity: 0.45, color: C.goldHi }} aria-hidden />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Journey header + 3 chevron legs + localized sub-labels */}
        <div style={{ ...zp(Z.journeyLabel), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: fz(22), fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.goldHi }}>
            {t('gameFrame.cassetto.journey', 'Journey')}
          </span>
        </div>
        <div style={{ ...zp(Z.journeyLegs), display: 'flex' }}>
          {quest.legs.map((leg, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: fz(25), fontWeight: 700, color: i === 1 ? '#eafff5' : C.goldHi, textShadow: '0 1px 3px rgba(0,0,0,.9)' }}>
                {leg.days}{typeof leg.days === 'number' ? 'd' : ''}
              </span>
            </div>
          ))}
        </div>
        <div style={{ ...zp(Z.journeySubs), display: 'flex' }}>
          {quest.legs.map((leg, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px' }}>
              <span style={{ fontSize: fz(16), letterSpacing: '0.13em', textTransform: 'uppercase', color: C.muted, textAlign: 'center', lineHeight: 1.15 }}>
                {leg.label}
              </span>
            </div>
          ))}
        </div>

        {/* Risk & Rewards header + live values */}
        <div style={{ ...zp(Z.riskLabel), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: fz(22), fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.goldHi }}>
            {t('gameFrame.cassetto.riskRewards', 'Risk & Rewards')}
          </span>
        </div>
        <div style={{ ...zp(Z.riskValue), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: fz(15), letterSpacing: '0.14em', textTransform: 'uppercase', color: C.muted }}>
            {t('gameFrame.cassetto.risk', 'Risk')}
          </span>
          <span style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: fz(26), fontWeight: 800, color: C.danger, textTransform: 'uppercase' }}>
            {quest.riskLabel}
          </span>
        </div>
        <div style={{ ...zp(Z.rewards), display: 'flex', gap: fz(10), alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          {quest.rewards.map((r) => (
            <span key={r.icon} style={{ display: 'inline-flex', alignItems: 'center', gap: fz(6), fontSize: fz(24), fontWeight: 700, color: C.goldHi }}>
              <img src={`/assets/ui/resources/res-${r.icon}-64.webp`} alt="" style={{ width: fz(32), height: fz(32) }} draggable={false} />
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
            ...zp(Z.confirm),
            padding: 0, border: 'none', background: 'transparent',
            cursor: canSend ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: canSend ? 1 : 0.55,
          }}
        >
          <span className="confirm-sheen" aria-hidden />
          <span className="confirm-text" style={{
            fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: fz(30), fontWeight: 800,
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
