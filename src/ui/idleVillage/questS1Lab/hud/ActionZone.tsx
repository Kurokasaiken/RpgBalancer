/**
 * questS1Lab/hud/ActionZone — the bottom `plinth` content (PLAN-024 D2):
 * options ⟷ verdict on the same real estate. Buttons speak the skin's
 * roles (`data-skin="button"` rows, `data-skin="cta"` for a lone choice,
 * `data-hud-controls` toolbar for the belt) — no ad-hoc Tailwind chrome.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
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

/** ACTION ZONE — stateful: options ⟷ verdict, same real estate. The outer
 *  `HudPlaque shape="plinth"` in the page supplies the frame and height. */
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
  return (
    <div className="quest-s1-scroll flex h-full w-full flex-col overflow-y-auto">
      {inTransition ? (
        <TransitView transit={transitText} art={transitArt} onAdvance={onTransitSkip} />
      ) : presenting && activeCheck ? (
        phase === 'cinematic' ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
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
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <p className="max-w-xl" style={{ ...bodyText, fontStyle: 'italic' }}>
            {run.lastEvent}
          </p>
          <Kicker tone="muted">{t('questS1Lab.harmInProgress')}</Kicker>
        </div>
      ) : run.ended ? (
        <div className="flex h-full items-center justify-center">
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
        <div className="flex h-full flex-col">
          <header className="mb-1 flex items-baseline justify-between gap-3">
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
          <p className="mb-2 line-clamp-2" style={{ ...bodyText, color: 'var(--skin-text-secondary)' }}>
            {currentNode?.body}
          </p>
          {/* Consumable belt (artifact §7b): arm BEFORE choosing — the belt
              sits above the options it modifies, as one controls toolbar. */}
          <ConsumableBelt
            flags={run.flags}
            armed={armConsumable}
            onToggleArmed={onToggleArmed}
            onDrinkPotion={onDrinkPotion}
            onUseHealing={onUseHealing}
          />
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {options.map((o) => {
              const pv = previewOption(run, o.id, { useConsumable: armConsumable });
              const pvBase =
                pv && armConsumable && pv.consumableFlag
                  ? previewOption(run, o.id, { useConsumable: false })
                  : null;
              return (
                <div key={o.id} className="group relative">
                  <button
                    disabled={o.disabled}
                    onClick={() => onChoose(o.id)}
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
                  {/* Stakes tooltip — the full analytic X-ray on
                      hover/focus, not a separate phase (Director D1). */}
                  {pv && (
                    <div className="pointer-events-none absolute bottom-full left-0 z-30 mb-1 hidden w-[22rem] group-hover:block group-focus-within:block">
                      <div
                        className="quest-s1-scroll max-h-80 overflow-y-auto p-2"
                        style={{
                          borderRadius: 12,
                          border: '1px solid var(--skin-surface-border)',
                          background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 97%, transparent)',
                          boxShadow: 'var(--skin-hud-shadow-filter)',
                        }}
                      >
                        <QuestCheckPreview run={run} optionId={o.id} useConsumable={armConsumable} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Party inventory — loot/intel readout kept inline. */}
          {(run.loot.length > 0 || run.info.length > 0) && (
            <div
              className="mt-1 flex flex-wrap gap-3"
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
