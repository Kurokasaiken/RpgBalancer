/**
 * BagStrip (PLAN-032 SP-4, artifact r004) — a persistent, read-only glance
 * at the packed consumables during non-decision states (transit/pending and
 * beat playback, including the final replay). The interactive
 * `ConsumableBelt` stays the sole bag UI at decision nodes; the strip and
 * the belt never co-render (the caller evaluates the negated zone).
 *
 * Contract:
 * - `role="list"` of chips, strictly single-row (`flex-nowrap` + ellipsis),
 *   `data-hud-controls` pointer region, `cursor: default`.
 * - Chips are pure readout: `role="listitem"`, never focusable, zero `on*`
 *   handlers. Full detail stays in the title-row popover — `title` here is
 *   mouse-only decoration, subordinate to it.
 * - Accessible name = FULL label + qualifier via the `chipName` template
 *   ("{label} ({qualifier})" — parentheses, never the em-dash the
 *   short-label idiom splits on). Qualifier: check+armed → armed; action →
 *   held ("carried, usable at decisions"); passive → none.
 * - Visual state: check chips get an `aria-hidden` marker dot when armed
 *   (bag-level stance, matching the belt's `aria-pressed` semantics);
 *   action chips a muted variant (still readable, not disabled-looking);
 *   passive chips plain.
 * - Renders `null` on empty input (defense-in-depth — the wrapper's
 *   retained empty slot is the geometry contract, not this component).
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { getStatIconComponent } from '@/ui/shared/statIconUtils';
import { DEFAULT_QUEST_LAB_PRESENTATION as PRES } from '@/balancing/config/idleVillage/quests/questLabPresentation';
import { TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import { bagItemShortLabel } from './questBag';
import type { StashItem } from '@/balancing/config/idleVillage/quests/questStash';

/**
 * One strip/belt row height — derived from the same type token the belt
 * label uses (chip text + its vertical padding), so the reserved slot is a
 * named derivation, never a magic number.
 */
export const BAG_CHIP_ROW_PX = PRES.type.labelPx * 2 + 4;

/** Per-kind qualifier text; `null` for passive (packed = armed, nothing to say). */
const qualifierFor = (t: TFunction, item: StashItem, armed: boolean): string | null => {
  if (item.kind === 'check') return armed ? t('gameFrame.questWindow.bagStrip.armed') : null;
  if (item.kind === 'action') return t('gameFrame.questWindow.bagStrip.held');
  return null;
};

export interface BagStripProps {
  /** The packed items (already derived — `questBagItems(run.flags)`). */
  items: StashItem[];
  /** The player's bag-level stance — marks every check chip, never per-item. */
  armed: boolean;
}

/** Read-only chip row for the packed bag; `null` when there is nothing to show. */
export const BagStrip: React.FC<BagStripProps> = ({ items, armed }) => {
  const { t } = useTranslation('idleVillage');
  if (items.length === 0) return null;
  return (
    <div
      role="list"
      aria-label={t('gameFrame.questWindow.bagStrip.label')}
      data-hud-controls=""
      data-testid="quest-bag-strip"
      style={{
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        gap: 6,
        overflow: 'hidden',
        cursor: 'default',
        paddingBottom: 4,
      }}
    >
      {items.map((item) => {
        const Icon = getStatIconComponent(item.icon);
        const qualifier = qualifierFor(t, item, armed);
        const fullLabel = t(item.labelKey);
        const name = qualifier
          ? t('gameFrame.questWindow.bagStrip.chipName', { label: fullLabel, qualifier })
          : fullLabel;
        const muted = item.kind === 'action';
        return (
          <span
            key={item.flag}
            role="listitem"
            aria-label={name}
            title={t(item.descKey)}
            data-bag-chip={item.flag}
            data-bag-kind={item.kind}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 1,
              minWidth: 0,
              fontFamily: 'var(--skin-font-display)',
              fontSize: PRES.type.labelPx,
              letterSpacing: '0.08em',
              color: muted ? TONE.secondary : 'var(--skin-text-primary)',
              border: `1px solid ${muted ? 'var(--skin-text-muted)' : 'var(--skin-icon-color)'}`,
              borderRadius: 4,
              padding: '1px 6px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {Icon && <Icon aria-hidden />}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{bagItemShortLabel(t, item)}</span>
            {item.kind === 'check' && armed && (
              <span
                aria-hidden
                data-bag-armed={item.flag}
                style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--skin-title-color)', boxShadow: '0 0 6px var(--skin-title-color)', flexShrink: 0 }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
};

export default BagStrip;
