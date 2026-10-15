/**
 * questS1Lab/hud/ActionZone — the bottom `plinth` content (PLAN-024 D2):
 * options ⟷ verdict on the same real estate. Buttons speak the skin's
 * roles (`data-skin="button"` rows, `data-skin="cta"` for a lone choice,
 * `data-hud-controls` toolbar for the belt) — no ad-hoc Tailwind chrome.
 */

import React, { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Pin, PinOff, X } from 'lucide-react';
import {
  previewOption,
  availableOptions,
  STAT_ICONS,
} from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestRunState, ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestNode } from '@/ui/idleVillage/questS1Lab/questScenario';
import { getStatIconComponent } from '@/ui/shared/statIconUtils';
import { QuestCheckPreview } from '@/ui/idleVillage/questS1Lab/QuestCheckPreview';
import { DEFAULT_QUEST_LAB_PRESENTATION as PRES } from '@/balancing/config/idleVillage/quests/questLabPresentation';
import { HudChip, Kicker } from './atoms';
import { TransitView } from './TransitView';
import { VerdictCard } from './VerdictCard';
import { ConsumableBelt } from './ConsumableBelt';

export interface ActionZoneProps {
  run: QuestRunState;
  currentNode: QuestNode | null;
  inTransition: boolean;
  transitText?: string;
  transitArt?: { src: string; fit: 'contain' | 'cover' };
  /** Click on the transit line skips its read-hold. */
  onTransitSkip?: () => void;
  presenting: boolean;
  /** The check whose resolution is on stage, if any. */
  activeCheck: ResolvedCheck | null;
  phase: string;
  onAck: () => void;
  /** Burst progress for the throw counter. */
  burstCurrent: number;
  burstTotal: number;
  queuePending: boolean;
  armConsumable: boolean;
  onChoose: (optionId: string) => void;
  onToggleArmed: () => void;
  onDrinkPotion: () => void;
  onUseHealing: () => void;
  intelLabels: Record<string, string>;
}

/** Body/copy style — serif, guide's reading size. */
const bodyText: React.CSSProperties = {
  fontFamily: 'var(--skin-font-serif)',
  fontSize: PRES.type.bodyPx,
  lineHeight: 1.45,
  color: 'var(--skin-body-color)',
};

/**
 * XRayPopover — the option's analytic tooltip portaled to `<body>`:
 * `position: fixed` escapes every `overflow` ancestor (the plinth's own
 * scroll container would clip an in-flow absolute panel). Anchored above
 * the option; flips below when the space above is too thin.
 *
 * Hover-pinnable contract (hud_component_guide §5b.7): the panel is
 * interactive — pointer-events on, it stays open while hovered, and it
 * carries pin + close controls in a `data-hud-controls` corner group.
 * Width fits the analytic content (the RecordList counterfactual needs
 * ~30rem, not a 22rem strip).
 */
const XRayPopover: React.FC<{
  rect: DOMRect;
  pinned: boolean;
  onTogglePin: () => void;
  onClose: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  children: React.ReactNode;
}> = ({ rect, pinned, onTogglePin, onClose, onHoverStart, onHoverEnd, children }) => {
  const { t } = useTranslation('idleVillage');
  const W = 480; // 30rem — the analytic preview needs a real panel, not a strip
  const GAP = 8;
  const left = Math.max(GAP, Math.min(rect.left, window.innerWidth - W - GAP));
  const spaceAbove = rect.top - 2 * GAP;
  const pos: React.CSSProperties =
    spaceAbove >= 180
      ? { bottom: window.innerHeight - rect.top + GAP, maxHeight: spaceAbove }
      : { top: rect.bottom + GAP, maxHeight: window.innerHeight - rect.bottom - 2 * GAP };
  return createPortal(
    <div
      className="fixed z-[60] w-[min(30rem,calc(100vw-16px))]"
      style={{ left, ...pos }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <div
        className="quest-s1-scroll relative overflow-y-auto p-2 pt-8"
        style={{
          maxHeight: 'inherit',
          borderRadius: 12,
          border: '1px solid var(--skin-surface-border)',
          background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 97%, transparent)',
          boxShadow: 'var(--skin-hud-shadow-filter)',
        }}
      >
        <div data-hud-controls style={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}>
          <button
            type="button"
            aria-pressed={pinned}
            aria-label={pinned ? t('floatingPanel.unpin') : t('floatingPanel.pin')}
            title={pinned ? t('floatingPanel.unpin') : t('floatingPanel.pin')}
            onClick={onTogglePin}
          >
            {pinned ? <PinOff aria-hidden /> : <Pin aria-hidden />}
          </button>
          <button
            type="button"
            aria-label={t('floatingPanel.close')}
            title={t('floatingPanel.close')}
            onClick={onClose}
          >
            <X aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
};

/** ACTION ZONE — stateful: options ⟷ verdict, same real estate. The outer
 *  `HudPlaque shape="plinth"` hugs the content (max-height, not fixed):
 *  header/body/belt stay pinned, only the options list scrolls. */
export const ActionZone: React.FC<ActionZoneProps> = ({
  run, currentNode,
  inTransition, transitText, transitArt, onTransitSkip,
  presenting, activeCheck, phase, onAck,
  burstCurrent, burstTotal, queuePending,
  armConsumable, onChoose,
  onToggleArmed, onDrinkPotion, onUseHealing,
  intelLabels,
}) => {
  const { t } = useTranslation('idleVillage');
  const options = availableOptions(run);
  const loneChoice = options.length === 1;
  const [xray, setXray] = useState<{ optionId: string; rect: DOMRect } | null>(null);
  const [xrayPinned, setXrayPinnedState] = useState(false);
  /* A ref mirrors `pinned` so the delayed-close timer always reads the
   *  CURRENT value: a mouseleave may arm the timer before React commits
   *  the pin click — the callback must re-check, not trust the closure. */
  const xrayPinnedRef = useRef(false);
  const xrayCloseTimer = useRef<number | null>(null);
  const setXrayPinned = useCallback((v: boolean) => {
    xrayPinnedRef.current = v;
    setXrayPinnedState(v);
  }, []);

  /* Hover-pinnable tooltip lifecycle (hud_component_guide §5b.7): leaving
   *  the trigger schedules a delayed close so the pointer can cross the
   *  gap into the panel; entering the panel cancels it; pin freezes the
   *  panel until unpinned or closed. */
  const cancelXrayClose = useCallback(() => {
    if (xrayCloseTimer.current != null) {
      window.clearTimeout(xrayCloseTimer.current);
      xrayCloseTimer.current = null;
    }
  }, []);
  const scheduleXrayClose = useCallback(() => {
    if (xrayPinnedRef.current) return;
    cancelXrayClose();
    xrayCloseTimer.current = window.setTimeout(() => {
      if (xrayPinnedRef.current) return;
      setXray(null);
    }, 140);
  }, [cancelXrayClose]);
  const openXray = useCallback(
    (optionId: string, rect: DOMRect) => {
      cancelXrayClose();
      setXray((cur) => (xrayPinnedRef.current ? cur : { optionId, rect }));
    },
    [cancelXrayClose],
  );
  const closeXray = useCallback(() => {
    cancelXrayClose();
    setXrayPinned(false);
    setXray(null);
  }, [cancelXrayClose, setXrayPinned]);
  return (
    <div
      className="quest-s1-scroll flex w-full flex-col overflow-y-auto"
      style={{ maxHeight: `calc(${PRES.layout.actionZoneVh}vh - 34px)` }}
    >
      {inTransition ? (
        <TransitView transit={transitText} art={transitArt} onAdvance={onTransitSkip} />
      ) : presenting && activeCheck ? (
        phase === 'cinematic' ? (
          <div className="flex min-h-[9rem] flex-col items-center justify-center gap-2 text-center">
            <Kicker tone="muted">{t('questS1Lab.resolving')}</Kicker>
            <div
              style={{
                fontFamily: 'var(--skin-font-display)',
                fontSize: PRES.type.titlePx,
                color: 'var(--skin-title-color)',
                textShadow: 'var(--skin-incision-label)',
              }}
            >
              {activeCheck.title}
            </div>
            {activeCheck.transit && (
              <p className="max-w-xl" style={{ ...bodyText, fontStyle: 'italic' }}>
                {activeCheck.transit}
              </p>
            )}
            {burstTotal > 1 && (
              <HudChip tone="label">
                {t('questS1Lab.throwCounter', { current: burstCurrent, total: burstTotal })}
              </HudChip>
            )}
          </div>
        ) : (
          <VerdictCard check={activeCheck} phase={phase} onAck={onAck} />
        )
      ) : presenting || queuePending ? (
        /* Ambient harm beat — no owning check (ambush, attrition), or
           the inter-check gap inside a burst. The damage plays on the
           formation; options unlock only when the pipeline drains. */
        <div className="flex min-h-[9rem] flex-col items-center justify-center gap-2 text-center">
          <p className="max-w-xl" style={{ ...bodyText, fontStyle: 'italic' }}>
            {run.lastEvent}
          </p>
          <Kicker tone="muted">{t('questS1Lab.harmInProgress')}</Kicker>
        </div>
      ) : run.ended ? (
        <div className="flex min-h-[9rem] items-center justify-center">
          <div
            className="w-full max-w-lg p-4 text-center"
            style={{
              borderRadius: 14,
              border: '1px solid var(--skin-surface-border)',
              background: 'color-mix(in srgb, var(--skin-title-color) 10%, var(--skin-hud-lacquer-deep))',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--skin-font-display)',
                fontSize: PRES.type.numberPx,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--skin-title-color)',
              }}
            >
              {run.outcome === 'running' ? '' : t(`questS1Lab.outcome.${run.outcome}`)}
            </div>
            <p className="mt-2" style={bodyText}>
              {run.lastEvent}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="mb-1 flex shrink-0 items-baseline justify-between gap-3">
            <div className="min-w-0">
              <Kicker>{t('questS1Lab.situation')}</Kicker>
              <div
                className="truncate"
                style={{
                  fontFamily: 'var(--skin-font-display)',
                  fontSize: PRES.type.titlePx - 4,
                  color: 'var(--skin-text-primary)',
                }}
              >
                {currentNode?.title}
              </div>
            </div>
            {run.lastEvent && (
              <p
                className="max-w-[45%] truncate text-right"
                style={{ ...bodyText, fontStyle: 'italic', color: 'var(--skin-label-primary)' }}
              >
                {run.lastEvent}
              </p>
            )}
          </header>
          <p
            className="mb-2 line-clamp-2 shrink-0"
            style={{ ...bodyText, color: 'var(--skin-text-secondary)' }}
          >
            {currentNode?.body}
          </p>
          {/* Consumable belt (artifact §7b): arm BEFORE choosing — the belt
              sits above the options it modifies, as one controls toolbar. */}
          <div className="shrink-0">
            <ConsumableBelt
              flags={run.flags}
              armed={armConsumable}
              onToggleArmed={onToggleArmed}
              onDrinkPotion={onDrinkPotion}
              onUseHealing={onUseHealing}
            />
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {options.map((o) => {
              const pv = previewOption(run, o.id, { useConsumable: armConsumable });
              const pvBase =
                pv && armConsumable && pv.consumableFlag
                  ? previewOption(run, o.id, { useConsumable: false })
                  : null;
              return (
                <div key={o.id}>
                  <button
                    disabled={o.disabled}
                    onClick={() => onChoose(o.id)}
                    onMouseEnter={(e) => openXray(o.id, e.currentTarget.getBoundingClientRect())}
                    onMouseLeave={scheduleXrayClose}
                    onFocus={(e) => openXray(o.id, e.currentTarget.getBoundingClientRect())}
                    onBlur={scheduleXrayClose}
                    data-skin={loneChoice ? 'cta' : 'button'}
                    data-variant={loneChoice ? undefined : 'secondary'}
                    className="w-full px-4 py-2.5 text-left normal-case tracking-normal"
                    style={{ textTransform: 'none', letterSpacing: '0.01em' }}
                  >
                    <span
                      className="block"
                      style={{
                        fontFamily: 'var(--skin-font-display)',
                        fontSize: PRES.type.numberPx,
                        color: 'var(--skin-text-primary)',
                        textTransform: 'none',
                      }}
                    >
                      {o.label}
                      {o.costGold ? (
                        <span className="ml-2" style={{ fontSize: PRES.type.labelPx, color: 'var(--skin-label-primary)' }}>
                          ({o.costGold} {t('questS1Lab.gold')})
                        </span>
                      ) : null}
                    </span>
                    <span className="block" style={{ ...bodyText, color: 'var(--skin-text-secondary)' }}>
                      {o.detail}
                    </span>
                    {/* Compact stakes on the option itself (Director D1):
                        stat icons + success bound + wound/death risk. */}
                    {pv && (
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {pv.contributors.map((c) => {
                          const Icon = getStatIconComponent(
                            STAT_ICONS[c.stat as keyof typeof STAT_ICONS],
                          );
                          return (
                            <HudChip
                              key={c.stat}
                              tone="accent"
                              title={`${c.label} — ${c.bestName} ${c.bestValue}`}
                            >
                              {Icon && <Icon style={{ width: 13, height: 13 }} aria-hidden />}
                              {c.bestValue}
                            </HudChip>
                          );
                        })}
                        <HudChip tone="ok">≤{pv.successPct}</HudChip>
                        {pvBase && pvBase.successPct !== pv.successPct && (
                          <HudChip tone="accent">
                            {t('questS1Lab.consumableDelta', {
                              base: pvBase.successPct,
                              armed: pv.successPct,
                            })}
                          </HudChip>
                        )}
                        {pv.woundPct > 0 && (
                          <HudChip tone="warn">{t('questS1Lab.woundPct', { pct: pv.woundPct })}</HudChip>
                        )}
                        {pv.deathPct > 0 && (
                          <HudChip tone="danger">{t('questS1Lab.deathPct', { pct: pv.deathPct })}</HudChip>
                        )}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          {/* Stakes tooltip — the full analytic X-ray on hover/focus
              (Director D1), portaled out so the plinth's own scroll can't
              clip it. */}
          {xray && previewOption(run, xray.optionId, { useConsumable: armConsumable }) && (
            <XRayPopover
              rect={xray.rect}
              pinned={xrayPinned}
              onTogglePin={() => setXrayPinned(!xrayPinnedRef.current)}
              onClose={closeXray}
              onHoverStart={cancelXrayClose}
              onHoverEnd={scheduleXrayClose}
            >
              <QuestCheckPreview
                run={run}
                optionId={xray.optionId}
                useConsumable={armConsumable}
              />
            </XRayPopover>
          )}
          {/* Party inventory — loot/intel readout kept inline. */}
          {(run.loot.length > 0 || run.info.length > 0) && (
            <div
              className="mt-1 flex shrink-0 flex-wrap gap-3"
              style={{ fontSize: PRES.type.labelPx, color: 'var(--skin-text-muted)' }}
            >
              {run.loot.length > 0 && (
                <span>{t('questS1Lab.loot', { items: run.loot.join(', ') })}</span>
              )}
              {run.info.length > 0 && (
                <span>
                  {t('questS1Lab.intel', {
                    items: run.info.map((k) => intelLabels[k] ?? k).join(', '),
                  })}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionZone;
