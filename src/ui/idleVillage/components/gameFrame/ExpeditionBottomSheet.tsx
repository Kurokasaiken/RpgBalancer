/**
 * ExpeditionBottomSheet — the mobile/narrow form of the expedition surface
 * (R-339 / PLAN-119 T8, mw-debate artifact-r004 D5).
 *
 * At viewports at or below `cassettoLayoutConfig.bottomSheet.maxWidthPx`
 * (1100, boundary inclusive — tested at 1024 and 1100) the expedition
 * surface exists ONLY as this non-modal bottom sheet: the docked column,
 * its chips and the right-edge tab never mount (mutual exclusion of the
 * lateral surfaces, AC10). `ExpeditionDrawer` mounts this component in
 * that band, so `/game` and the `/hud-compose` lab share the same rule.
 *
 * Contract (D5/AC9-AC10):
 * - Non-modal: no scrim, no focus trap. The wrapper covers the viewport
 *   with `pointer-events: none`; only the sheet box takes input
 *   (`pointer-events: auto`) — the map stays interactive everywhere else.
 * - Snap detents from `bottomSheet` tokens: `peek` (CTA row + safe-area),
 *   `half`, `full` (`useExpeditionSheet` store — survives remounts as
 *   user intent, same contract as the drawer's fold).
 * - Drag lives ONLY on the 44px handle+header strip (`touch-action: none`);
 *   the body scrolls instead. Tap on the chevron toggles peek ⇄ expanded.
 * - Safe-area: the peek detent adds `env(safe-area-inset-bottom)` so the
 *   CTA row never slides under the home indicator.
 * - Targets ≥44px (handle, CONFIRM, chevron), slots ≥`slotPx`, body text
 *   ≥`minTextPx`.
 * - The six mockup blocks keep their names (`data-block`) — the sheet is
 *   the same planner surface in a different form factor, so
 *   `launch-cta` (reason + CONFIRM) sits in the always-visible strip and
 *   the remaining blocks fill the scrollable body.
 * - Honest occupancy: the measured sheet height publishes to
 *   `useGameLayoutInsets.insets.bottom`; `right` is never touched (the
 *   lateral ledger is 0 by definition in this band); unmount restores 0.
 */
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { useGameLayoutInsets } from '@/ui/idleVillage/store/useGameLayoutInsets';
import { useExpeditionSheet, type ExpeditionSheetDetent } from '@/ui/idleVillage/store/useExpeditionSheet';
import { ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
import { StashItemTile } from '@/ui/idleVillage/components/gameFrame/stashItemFace';
import { EngravedIcon } from './engravedIcons';
import type { HudRealCassettoProps } from '@/ui/idleVillage/hudReal/HudRealCassetto';

const SHEET = CASSETTO_LAYOUT_CONFIG.bottomSheet;
const CTA_VARS = CASSETTO_LAYOUT_CONFIG.cta.vars;

/** The viewport band where the sheet is the ONLY expedition form (AC10,
 *  boundary inclusive — 1024 and 1100 match, 1101 does not). */
const SHEET_MQ = `(max-width: ${SHEET.maxWidthPx}px)`;
const subscribeSheetMode = (cb: () => void) => {
  const mq = window.matchMedia(SHEET_MQ);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const readSheetMode = () => window.matchMedia(SHEET_MQ).matches;
/**
 * Live viewport check for the T8 band. The drawer and the page's edge-tab
 * guard share this so the mutual exclusion cannot drift from the token.
 */
export const useExpeditionSheetMode = () =>
  useSyncExternalStore(subscribeSheetMode, readSheetMode, () => false);

/** Detent heights in real px (safe-area is added in CSS, not to the snap math). */
const detentPx = (detent: ExpeditionSheetDetent, viewportH: number): number =>
  detent === 'peek'
    ? SHEET.peekPx
    : Math.round(viewportH * (detent === 'half' ? SHEET.halfFraction : SHEET.fullFraction));

const DETENTS: readonly ExpeditionSheetDetent[] = ['peek', 'half', 'full'];

/* Sheet CONFIRM — same `--skin-cassetto-cta-*` token contract as the docked
 * column (`cta.vars`, T1/AC8): every state colour traces config → registry,
 * never a literal in this file. The plaque face is the hud lacquer/brass
 * family — the painted column art does not exist at this form factor. */
const SHEET_SCOPED_CSS = `
[data-expedition-sheet] [data-testid="cassetto-confirm"] {
  position: relative; flex: none;
  min-width: 132px; min-height: ${SHEET.handlePx}px;
  padding: 0 18px; border: 1px solid color-mix(in srgb, var(--skin-hud-brass-hi) 65%, transparent);
  border-radius: 12px; cursor: pointer;
  background: linear-gradient(180deg, var(--skin-hud-lacquer-lift), var(--skin-hud-lacquer-base) 55%, var(--skin-hud-lacquer-deep));
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--skin-hud-brass-crest) 35%, transparent), inset 0 -3px 8px rgba(0,0,0,.55), 0 2px 8px rgba(0,0,0,.5);
  color: ${CTA_VARS.text};
  font-family: var(--skin-font-display); font-size: ${SHEET.minTextPx}px; font-weight: 800;
  letter-spacing: 0.22em; text-transform: uppercase; text-shadow: ${CTA_VARS.textShadow};
  transition: filter 160ms ease, transform 120ms cubic-bezier(0.25,0.46,0.45,0.94), text-shadow 160ms ease;
}
[data-expedition-sheet] [data-testid="cassetto-confirm"]:not(:disabled):hover {
  filter: brightness(1.14); text-shadow: ${CTA_VARS.hoverTextGlow};
}
[data-expedition-sheet] [data-testid="cassetto-confirm"]:not(:disabled):active { transform: ${CTA_VARS.pressTransform}; }
[data-expedition-sheet] [data-testid="cassetto-confirm"]:disabled { opacity: ${CTA_VARS.mutedOpacity}; cursor: default; }
[data-expedition-sheet] [data-testid="cassetto-confirm"]:focus-visible {
  outline: 2px solid ${CTA_VARS.focusRing}; outline-offset: -3px;
}
`;

export interface ExpeditionBottomSheetProps extends HudRealCassettoProps {
  /** Host visibility — hidden/unmounted publishes 0 and renders nothing. */
  visible?: boolean;
}

export const ExpeditionBottomSheet: React.FC<ExpeditionBottomSheetProps> = ({
  visible = true,
  quest,
  slots,
  resourceItems: _resourceItems,
  onSlotClick,
  onSlotClear,
  suppressedResidentIds,
  loadout,
  canSend = true,
  disabledReason,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation('idleVillage');
  const detent = useExpeditionSheet((s) => s.detent);
  const setDetent = useExpeditionSheet((s) => s.setDetent);
  const sheetRef = useRef<HTMLDivElement>(null);
  /* Transient height while a handle drag is in flight — null = snap to detent. */
  const [dragHeightPx, setDragHeightPx] = useState<number | null>(null);

  /* Honest occupancy: the measured sheet height (safe-area included in the
   *  real layout) owns `insets.bottom`; jsdom measures 0 → fall back to the
   *  detent token so the ledger is still meaningful under tests. */
  useEffect(() => {
    if (!visible) return;
    const publish = useGameLayoutInsets.getState().publish;
    const node = sheetRef.current;
    const fallback = detentPx(detent, window.innerHeight);
    if (!node) {
      publish({ bottom: fallback });
      return () => publish({ bottom: 0 });
    }
    const update = () => publish({ bottom: Math.round(node.offsetHeight || fallback) });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      observer.disconnect();
      publish({ bottom: 0 });
    };
  }, [visible, detent, dragHeightPx]);

  /* Handle drag (D5): pointer capture on window so the gesture survives
   *  leaving the strip; snap = nearest detent of the release height. */
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      /* Interactive children (CONFIRM, chevron) never start a drag. */
      if ((e.target as HTMLElement).closest('button, a, input, [role="button"]')) return;
      const startHeight = sheetRef.current?.offsetHeight || detentPx(detent, window.innerHeight);
      dragRef.current = { startY: e.clientY ?? 0, startHeight };
      const onMove = (ev: PointerEvent) => {
        const d = dragRef.current;
        if (!d) return;
        const full = detentPx('full', window.innerHeight);
        setDragHeightPx(Math.min(full, Math.max(SHEET.peekPx, d.startHeight + (d.startY - (ev.clientY ?? 0)))));
      };
      const onUp = (ev: PointerEvent) => {
        const d = dragRef.current;
        dragRef.current = null;
        setDragHeightPx(null);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        if (!d) return;
        const released = d.startHeight + (d.startY - (ev.clientY ?? 0));
        const vh = window.innerHeight;
        const nearest = DETENTS.reduce((best, cand) =>
          Math.abs(detentPx(cand, vh) - released) < Math.abs(detentPx(best, vh) - released) ? cand : best,
        );
        setDetent(nearest);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [detent, setDetent],
  );

  if (!visible) return null;

  const heightCss =
    dragHeightPx !== null
      ? `${dragHeightPx}px`
      : detent === 'peek'
        ? `calc(${SHEET.peekPx}px + env(safe-area-inset-bottom, 0px))`
        : detent === 'half'
          ? `${SHEET.halfFraction * 100}vh`
          : `${SHEET.fullFraction * 100}vh`;
  const nextDetent: ExpeditionSheetDetent = detent === 'peek' ? 'half' : 'peek';

  return (
    <div
      data-testid="expedition-sheet-portal"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: DEFAULT_GAME_FRAME_CONFIG.zLayers.floating }}
    >
      <style>{SHEET_SCOPED_CSS}</style>
      <div
        ref={sheetRef}
        data-expedition-sheet=""
        data-testid="expedition-sheet"
        data-detent={detent}
        role="region"
        aria-label={quest.title || t('gameFrame.cassetto.demo.subtitle', 'Plan the expedition')}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: heightCss,
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
          fontFamily: 'var(--skin-font-serif)',
          color: 'var(--skin-text-primary)',
          fontSize: SHEET.minTextPx,
          background:
            'linear-gradient(180deg, var(--skin-hud-lacquer-base), var(--skin-hud-lacquer-deep))',
          borderTop: '1px solid color-mix(in srgb, var(--skin-hud-brass-hi) 60%, transparent)',
          borderRadius: '14px 14px 0 0',
          boxShadow: '0 -10px 32px rgba(0,0,0,.55)',
          transition: dragHeightPx !== null ? 'none' : 'height 180ms ease',
          overflow: 'hidden',
        }}
      >
        {/* Handle+header strip — the ONLY drag surface (D5). At `peek` this
         *  strip IS the whole visible sheet: grab pill + quest title +
         *  the launch-cta block (D5 "peek = CTA row + safe-area"). */}
        <div
          data-testid="expedition-sheet-handle"
          onPointerDown={onHandlePointerDown}
          style={{
            position: 'relative',
            flex: 'none',
            minHeight: SHEET.handlePx,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '4px 10px',
            touchAction: 'none',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          <EngravedIcon id="ico-pouch" size={18} style={{ flex: 'none', color: 'var(--skin-title-color)' }} aria-hidden />
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: 'var(--skin-font-display)',
              fontWeight: 700,
              fontSize: SHEET.minTextPx,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--skin-title-color)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {quest.title}
          </span>
          {/* T2 block `launch-cta` — inline reason + CONFIRM, the row the
           *  peek detent keeps on screen. */}
          <div data-block="launch-cta" style={{ display: 'contents' }}>
            {!canSend && disabledReason && (
              <span
                id="expedition-sheet-confirm-reason"
                data-testid="cassetto-confirm-reason"
                style={{
                  flex: 'none',
                  maxWidth: '34%',
                  fontStyle: 'italic',
                  fontSize: SHEET.minTextPx,
                  color: 'var(--skin-text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {disabledReason}
              </span>
            )}
            <button
              type="button"
              data-testid="cassetto-confirm"
              onClick={onConfirm}
              disabled={!canSend}
              aria-label={t('gameFrame.cassetto.confirm', 'CONFIRM')}
              aria-describedby={!canSend && disabledReason ? 'expedition-sheet-confirm-reason' : undefined}
            >
              {t('gameFrame.cassetto.confirm', 'CONFIRM')}
            </button>
          </div>
          <button
            type="button"
            data-testid="expedition-sheet-toggle"
            aria-label={t(detent === 'peek' ? 'gameFrame.sheet.expand' : 'gameFrame.sheet.collapse')}
            onClick={() => setDetent(nextDetent)}
            style={{
              flex: 'none',
              width: SHEET.handlePx,
              height: SHEET.handlePx,
              display: 'grid',
              placeItems: 'center',
              border: 'none',
              background: 'transparent',
              color: 'var(--skin-text-secondary)',
              cursor: 'pointer',
            }}
          >
            <EngravedIcon
              id="cmd-chevron-right"
              size={14}
              aria-hidden
              style={{ transform: detent === 'peek' ? 'rotate(-90deg)' : 'rotate(90deg)' }}
            />
          </button>
          {/* Same × as the column (Director 2026-11-20 «chiudi e perdi
           *  tutto»): closes the planner and the adapter owns the discard —
           *  the detents only fold. */}
          {onClose && (
            <button
              type="button"
              data-testid="cassetto-close"
              aria-label={t('floatingPanel.close')}
              title={t('floatingPanel.close')}
              onClick={onClose}
              style={{
                flex: 'none',
                width: SHEET.handlePx,
                height: SHEET.handlePx,
                display: 'grid',
                placeItems: 'center',
                border: 'none',
                background: 'transparent',
                color: 'var(--skin-text-secondary)',
                cursor: 'pointer',
              }}
            >
              <EngravedIcon id="cmd-close" size={14} aria-hidden />
            </button>
          )}
          {/* Grab pill — the visual drag affordance, centered on the strip. */}
          <span
            aria-hidden="true"
            data-testid="expedition-sheet-grab"
            style={{
              position: 'absolute',
              top: 3,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 44,
              height: 4,
              borderRadius: 999,
              background: 'color-mix(in srgb, var(--skin-hud-brass-hi) 55%, transparent)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Body — scrollable planner content, visible at half/full (and
         *  clipped by the sheet box at peek). Never drags: scrolling wins. */}
        <div
          data-testid="expedition-sheet-body"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 14px 18px' }}
        >
          {/* T2 block `quest-banner` — subtitle + briefing (the title rides
           *  the handle strip at every detent). */}
          <div data-block="quest-banner" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {quest.subtitle ? (
              <span style={{ fontStyle: 'italic', fontSize: SHEET.minTextPx, color: 'var(--skin-text-secondary)' }}>
                {quest.subtitle}
              </span>
            ) : null}
            <p style={{ margin: 0, fontSize: SHEET.minTextPx, lineHeight: 1.4, color: 'var(--skin-text-primary)' }}>
              {quest.briefing}
            </p>
          </div>

          {/* T2 block `party-slots` — header + the REAL certified rack at
           *  the ≥44px touch slot (`bottomSheet.slotPx`). */}
          <div data-block="party-slots" style={{ marginBottom: 12 }}>
            <div
              style={{
                fontFamily: 'var(--skin-font-display)',
                fontSize: SHEET.minTextPx,
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--skin-title-color)',
                textAlign: 'center',
                marginBottom: 6,
              }}
            >
              {t('gameFrame.cassetto.party', 'Party Slots')}
            </div>
            <div data-cassetto-rack="" style={{ display: 'flex', justifyContent: 'center' }}>
              <ResidentSlotRack
                slots={slots}
                layout="detail"
                slotSize={SHEET.slotPx}
                slotMaterial="hud-gold"
                slotVariant="hud64"
                bezelPreset="draghi"
                onSlotClick={onSlotClick}
                onSlotClear={onSlotClear}
                suppressedResidentIds={suppressedResidentIds}
              />
            </div>
          </div>

          {/* T2 block `bag-slots` — the quest bag wells (R-337), same
           *  testids and interaction contract as the column. */}
          <div data-block="bag-slots" style={{ marginBottom: 12 }}>
            {loadout && (
              <div data-cassetto-bag="" style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
                {loadout.slots.map((slot, i) => (
                  <span
                    key={i}
                    data-testid={`bag-slot-${i}`}
                    style={{
                      width: SHEET.slotPx,
                      height: SHEET.slotPx,
                      flexShrink: 0,
                      borderRadius: 10,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: slot ? 'none' : '1px solid color-mix(in srgb, var(--skin-hud-brass-hi) 45%, transparent)',
                      background: slot ? 'none' : 'var(--skin-hud-lacquer-deep)',
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
                        <StashItemTile icon={slot.icon} qty={slot.qty} size={SHEET.slotPx - 6} iconSize={26} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        data-testid={`bag-slot-empty-${i}`}
                        aria-label={t('questExpedition.bag.emptySlot', { index: i + 1 })}
                        onClick={(e) => loadout.onOpenStash(e.currentTarget)}
                        style={{
                          width: '100%',
                          height: '100%',
                          padding: 0,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {/* Painted supply-bag (refs/icon-supply-bag.png) — same
                         *  symbol the drawer wells carry, dimmed while empty. */}
                        <img
                          src="/assets/ui/hud-real/slicekit/cassetto/supply-bag.webp"
                          alt="" draggable={false} aria-hidden
                          style={{ width: '82%', height: '82%', objectFit: 'contain', opacity: 0.4, filter: 'saturate(0.7)' }}
                        />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* T2 block `journey-strip` — legs + sub-labels + the explicit
           *  total (AC6). */}
          <div data-block="journey-strip" style={{ marginBottom: 12 }}>
            <div
              style={{
                fontFamily: 'var(--skin-font-display)',
                fontSize: SHEET.minTextPx,
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--skin-title-color)',
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              {t('gameFrame.cassetto.journey', 'Journey')}
            </div>
            <div style={{ display: 'flex' }}>
              {quest.legs.map((leg, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--skin-font-display)', fontSize: SHEET.minTextPx + 2, fontWeight: 700, color: 'var(--skin-text-primary)' }}>
                    {typeof leg.days === 'number' ? t('gameFrame.cassetto.legDays', { count: leg.days }) : leg.days}
                  </span>
                  <span style={{ fontSize: SHEET.minTextPx, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--skin-text-secondary)', textAlign: 'center' }}>
                    {leg.label}
                  </span>
                </div>
              ))}
            </div>
            {quest.totalDays != null && (
              <div data-testid="cassetto-journey-total" style={{ textAlign: 'center', marginTop: 4 }}>
                <span style={{ fontSize: SHEET.minTextPx, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--skin-text-secondary)' }}>
                  {t('gameFrame.cassetto.journeyTotal', { count: quest.totalDays })}
                </span>
              </div>
            )}
          </div>

          {/* T2 block `risk-rewards` — risk, the reserved cost slot and the
           *  reward chips on one row. */}
          <div data-block="risk-rewards" style={{ marginBottom: 4 }}>
            <div
              style={{
                fontFamily: 'var(--skin-font-display)',
                fontSize: SHEET.minTextPx,
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--skin-title-color)',
                textAlign: 'center',
                marginBottom: 6,
              }}
            >
              {t('gameFrame.cassetto.riskRewards', 'Risk & Rewards')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: SHEET.minTextPx, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--skin-text-secondary)' }}>
                  {t('gameFrame.cassetto.risk', 'Risk')}
                </span>
                <span
                  data-testid="cassetto-risk-value"
                  data-risk-state={quest.riskPending ?? 'ready'}
                  style={{
                    fontFamily: 'var(--skin-font-display)', fontSize: SHEET.minTextPx, fontWeight: 800, textTransform: 'uppercase',
                    color: quest.riskPending ? 'var(--skin-text-secondary)' : 'var(--skin-text-primary)',
                  }}
                >
                  {quest.riskLabel}
                </span>
                {/* Director 2026-11-20: % morte next to the risk value. */}
                {quest.deathPct != null && (
                  <span data-testid="cassetto-death-pct" style={{ fontSize: SHEET.minTextPx, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--skin-text-secondary)' }}>
                    {t('questExpedition.forecast.death', { pct: Math.round(quest.deathPct) })}
                  </span>
                )}
              </span>
              {/* INV:cassetto-no-cost-cell — no cost cell on the sheet either
               *  (the cost lives in the supplies flow). */}
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  {quest.rewards.map((r) => (
                    <span key={r.icon} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: SHEET.minTextPx, fontWeight: 700, color: 'var(--skin-title-color)' }}>
                      <img src={`/assets/ui/resources/res-${r.icon}-64.webp`} alt="" style={{ width: 20, height: 20 }} draggable={false} />
                      {r.qty}
                    </span>
                  ))}
                </span>
                {/* Director 2026-11-20: % riuscita next to the reward. */}
                {quest.successPct != null && (
                  <span data-testid="cassetto-success-pct" style={{ fontSize: SHEET.minTextPx, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--skin-title-color)' }}>
                    {t('questExpedition.forecast.reward', { pct: Math.round(quest.successPct) })}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpeditionBottomSheet;
