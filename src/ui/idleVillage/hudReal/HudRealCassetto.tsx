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
 * PLAN-119 T2: the interior is partitioned into the six named mockup blocks via
 * `display:contents` wrappers (`data-block` = quest-banner / party-slots /
 * bag-slots / journey-strip / risk-rewards / launch-cta) so the drawer's
 * structure is testable without moving a pixel of the signed zones.
 */
import React, { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameLayoutInsets } from '@/ui/idleVillage/store/useGameLayoutInsets';
import { ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';
import { StashItemTile } from '@/ui/idleVillage/components/gameFrame/stashItemFace';
import { EngravedIcon } from '@/ui/idleVillage/components/gameFrame/engravedIcons';
import type { ResourceReadoutItem } from '@/ui/idleVillage/components/gameFrame/ResourceReadout';
import { HUD_TONE_COLOR } from '@/ui/idleVillage/components/gameFrame/hudTones';
import { ZanaraTooltip } from '@/ui/idleVillage/zanara/ZanaraTooltip';
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';
import { CASSETTO_WIDE_BREAKPOINT, cassettoColumnSpec, cassettoColumnWidthFor } from './layout/cassettoColumn';
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
  /** R-339/PLAN-119 AC6: explicit total under the legs ("Total: N days"), from
   *  the same quest config — the "2D" glyph alone read as a label, not a count. */
  totalDays?: number;
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
  /** R-339/PLAN-119 AC4: why CONFIRM is muted, shown inline just above the
   *  plaque (stock detail parity — `quest-planner-reason-line`). Null/undefined
   *  renders nothing. */
  disabledReason?: string | null;
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
/** The live column spec for the current viewport width — shared with the
 *  T2 `ExpeditionDrawer` fold chip, which must sit at the column's left edge. */
export const useCassettoColumnSpec = () => {
  const wide = useSyncExternalStore(subscribeWide, readWide, () => true);
  return cassettoColumnSpec(wide ? 1440 : 1280);
};

/** Compact display for very large integers (123456 -> 123K) so a targhetta never overflows. */
function compactRes(v: string | number): string {
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(n) || Math.abs(n) < 100000) return String(v);
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/* R-339/PLAN-119 T1: the CONFIRM states read ONLY the skin tokens named in
 * `CASSETTO_LAYOUT_CONFIG.cta.vars` (values in BASE_SKIN_CSS_VARS) — no
 * literal color or opacity for the CTA anywhere in this component. */
const CTA_VARS = CASSETTO_LAYOUT_CONFIG.cta.vars;

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
   press sinks the text and darkens the plaque's face, focus gets a ring.
   Every value below is a var(--skin-cassetto-cta-*) token (T1/AC8). */
[data-hudreal-cassetto] [data-testid="cassetto-confirm"] .confirm-sheen {
  position: absolute; inset: 8% 6%; border-radius: 999px;
  background: ${CTA_VARS.sheen};
  box-shadow: ${CTA_VARS.sheenRing};
  opacity: 0; transition: opacity 160ms ease; pointer-events: none;
}
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:not(:disabled):hover .confirm-sheen { opacity: 1; }
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:not(:disabled):active .confirm-sheen {
  opacity: 1;
  background: ${CTA_VARS.pressSheen};
  box-shadow: ${CTA_VARS.pressRing};
}
/* Muted state (T1): the disabled CONFIRM dims to the skin token — the
   inline reason beside it is the component's job, the look is the token's. */
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:disabled { opacity: ${CTA_VARS.mutedOpacity}; }
[data-hudreal-cassetto] [data-testid="cassetto-confirm"] .confirm-text {
  color: ${CTA_VARS.text};
  text-shadow: ${CTA_VARS.textShadow};
  transition: transform 120ms cubic-bezier(0.25, 0.46, 0.45, 0.94), text-shadow 160ms ease;
}
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:not(:disabled):hover .confirm-text {
  text-shadow: ${CTA_VARS.hoverTextGlow};
}
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:not(:disabled):active .confirm-text { transform: ${CTA_VARS.pressTransform}; }
[data-hudreal-cassetto] [data-testid="cassetto-confirm"]:focus-visible { outline: 2px solid ${CTA_VARS.focusRing}; outline-offset: -5px; border-radius: 14px; }
/* Bag slots — pouch brightens on hover, packed tiles lift and glow. */
[data-hudreal-cassetto] [data-testid^="bag-slot-empty-"] svg { transition: opacity 160ms ease, filter 160ms ease; }
[data-hudreal-cassetto] [data-testid^="bag-slot-empty-"]:hover svg { opacity: 0.95 !important; filter: drop-shadow(0 0 6px rgba(223,184,87,0.6)); }
[data-hudreal-cassetto] [data-testid^="loadout-item-"] { transition: filter 160ms ease, transform 120ms ease; border-radius: 8px; }
[data-hudreal-cassetto] [data-testid^="loadout-item-"]:hover { filter: brightness(1.18) drop-shadow(0 0 5px rgba(223,184,87,0.45)); transform: translateY(-1px); }
[data-hudreal-cassetto] [data-testid^="loadout-item-"]:active { transform: translateY(0) scale(0.95); }
`;

export const HudRealCassetto: React.FC<HudRealCassettoProps> = ({
  quest, slots, resourceItems, onSlotClick, onSlotClear, suppressedResidentIds, loadout, canSend = true, disabledReason, onConfirm,
}) => {
  const { t } = useTranslation('idleVillage');
  const spec = useCassettoColumnSpec();
  const Z = spec.geo.zones;
  const { artW, artH } = spec.geo;
  const zp = (z: Zone) => pct(z, artW, artH);
  const fz = (px: number) => cqw(px, artW);

  /* R-339/PLAN-119 D4: the docked drawer publishes the screen width it occupies
   *  (`aspect × viewportHeight`) into the shared insets ledger; unmount restores
   *  0 so the free-map rect is always live. Wiring safeFit/pan-clamp on /game is
   *  the deferred step documented in the store file. */
  React.useEffect(() => {
    const publish = useGameLayoutInsets.getState().publish;
    const update = () => publish({ right: Math.round(cassettoColumnWidthFor(spec, window.innerHeight)) });
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      publish({ right: 0 });
    };
  }, [spec]);
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
          /* T1 clamp: `min(100%, widthMaxPx / aspect)` — above the cap the
           * column stops short of full height instead of stretching the art. */
          height: `min(100%, ${CASSETTO_LAYOUT_CONFIG.drawer.widthMaxPx / spec.aspect}px)`,
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

        {/* T2 block `quest-banner` — title + subtitle + briefing. The
         *  `display:contents` wrapper names the mockup block without
         *  generating a box: children still position against the art
         *  container (zero layout delta). Same convention for every block. */}
        <div data-block="quest-banner" style={{ display: 'contents' }}>
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
        </div>

        {/* T2 block `party-slots` — the well header + the REAL certified rack. */}
        <div data-block="party-slots" style={{ display: 'contents' }}>
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
        </div>

        {/* T2 block `bag-slots` — the quest bag wells (R-337), display-only
         *  assign is S2 per artifact-r004. */}
        <div data-block="bag-slots" style={{ display: 'contents' }}>
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
        </div>

        {/* T2 block `journey-strip` — header + 3 chevron legs + sub-labels +
         *  the explicit total (AC6). */}
        <div data-block="journey-strip" style={{ display: 'contents' }}>
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
                {typeof leg.days === 'number' ? t('gameFrame.cassetto.legDays', { count: leg.days }) : leg.days}
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

        {/* R-339/PLAN-119 AC6: explicit journey total — derived zone in the gap
         *  between journeySubs and riskLabel (no generated-geometry edit). */}
        {quest.totalDays != null && (
          <div
            data-testid="cassetto-journey-total"
            style={{
              ...zp({ x: Z.journeySubs.x, y: Z.journeySubs.y + Z.journeySubs.h + 4, w: Z.journeySubs.w, h: 30 }),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: fz(15), letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted }}>
              {t('gameFrame.cassetto.journeyTotal', { count: quest.totalDays })}
            </span>
          </div>
        )}
        </div>

        {/* T2 block `risk-rewards` — header + risk value + rewards + the
         *  reserved cost slot (artifact-r004: the future food-cost preview
         *  of S2 lands here; flagged placeholder, intentionally empty). */}
        <div data-block="risk-rewards" style={{ display: 'contents' }}>
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

        {/* T2 reserved cost slot (artifact-r004 "reserved cost slot"): the
         *  food-cost preview is S2 scope — this cell reserves its seat in the
         *  gap between risk and rewards (derived from the measured zones,
         *  variant-adaptive). Flagged placeholder, intentionally empty and
         *  non-interactive — nothing painted on the signed art. */}
        <div
          data-testid="cassetto-cost-slot"
          data-placeholder="cost-preview"
          aria-hidden="true"
          style={{
            ...zp({
              x: Z.riskValue.x + Z.riskValue.w + 12,
              y: Z.riskValue.y,
              w: Math.max(0, Z.rewards.x - Z.riskValue.x - Z.riskValue.w - 24),
              h: Z.riskValue.h,
            }),
            pointerEvents: 'none',
          }}
        />
        </div>

        {/* T2 block `launch-cta` — inline reason + the CONFIRM plaque. */}
        <div data-block="launch-cta" style={{ display: 'contents' }}>
        {/* R-339/PLAN-119 AC4: inline reason above the muted plaque — the stock
         *  detail carries `quest-planner-reason-line`; the drawer renders it in
         *  the free band right above CONFIRM (derived zone, no geometry edit). */}
        {!canSend && disabledReason && (
          <div
            id="cassetto-confirm-reason"
            data-testid="cassetto-confirm-reason"
            style={{
              ...zp({ x: Z.confirm.x, y: Z.confirm.y - 46, w: Z.confirm.w, h: 40 }),
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4%',
            }}
          >
            <span style={{ fontSize: fz(17), fontStyle: 'italic', color: C.muted, textShadow: '0 1px 2px rgba(0,0,0,.85)', textAlign: 'center', lineHeight: 1.2 }}>
              {disabledReason}
            </span>
          </div>
        )}

        {/* CONFIRM — transparent hit button directly over the clean painted emerald plaque */}
        <button
          type="button"
          data-testid="cassetto-confirm"
          onClick={onConfirm}
          disabled={!canSend}
          aria-label={t('gameFrame.cassetto.confirm', 'CONFIRM')}
          aria-describedby={!canSend && disabledReason ? 'cassetto-confirm-reason' : undefined}
          style={{
            ...zp(Z.confirm),
            padding: 0, border: 'none', background: 'transparent',
            cursor: canSend ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span className="confirm-sheen" aria-hidden />
          <span className="confirm-text" style={{
            fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: fz(30), fontWeight: 800,
            letterSpacing: '0.28em', textTransform: 'uppercase',
          }}>
            {t('gameFrame.cassetto.confirm', 'CONFIRM')}
          </span>
        </button>
        </div>
      </div>
    </div>
  );
};

export default HudRealCassetto;
