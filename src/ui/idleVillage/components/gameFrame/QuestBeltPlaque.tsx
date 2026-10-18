/**
 * QuestBeltPlaque — the packed consumables of the running quest, as a
 * companion plaque of the `QuestRunWindow` shell (R-196 / PLAN-035).
 * Mounts under the party roster inside `[data-hud-companion="left"]`.
 *
 * Icon-only contract: every item is a round icon button (`EngravedIcon` /
 * `VillageStashItemIcon`, the item's name lives in `aria-label`/`title`,
 * zero visible text). First click on a check/action item ARMS it
 * (`aria-pressed`, lit); a second click disarms it. The per-item status the
 * engine computed (`beltItemStatuses`) drives the frame: `winner` lit,
 * `shadowed` lit-dimmed (an armed sibling covers the check better — never
 * consumed), `inert` muted (nothing ahead needs it — never consumed),
 * `passive` a non-toggle badge (`role="img"`, no `aria-pressed` — the
 * guardian banner is always in effect while packed).
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { EngravedIcon } from './engravedIcons';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import { VillageStashItemIcon } from './villageStashItemIcons';
import type { StashItem } from '@/balancing/config/idleVillage/quests/questStash';
import type { BeltItemStatus } from '@/ui/idleVillage/questS1Lab/questRun';

export interface QuestBeltPlaqueProps {
  /** `id` the header toggle points at with `aria-controls`. */
  panelId: string;
  /** Packed items, catalog order (`questBagItems(run.flags)`). */
  items: StashItem[];
  /** flag → per-item belt status (`beltItemStatuses` output). */
  statuses: Record<string, BeltItemStatus>;
  /** Currently armed flags — drives `aria-pressed`. */
  armedFlags: ReadonlySet<string>;
  onToggleFlag: (flag: string) => void;
  onClose: () => void;
}

/** Status → the belt.* qualifier line in the item's tooltip/name. */
const STATUS_QUALIFIER: Partial<Record<BeltItemStatus, string>> = {
  winner: 'gameFrame.questWindow.belt.armed',
  armed: 'gameFrame.questWindow.belt.actionArmed',
  shadowed: 'gameFrame.questWindow.belt.shadowed',
  inert: 'gameFrame.questWindow.belt.inert',
  passive: 'gameFrame.questWindow.belt.passive',
};

export const QuestBeltPlaque: React.FC<QuestBeltPlaqueProps> = ({ panelId, items, statuses, armedFlags, onToggleFlag, onClose }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <HudPlaque
      shape="panel"
      as="aside"
      id={panelId}
      data-testid="quest-belt"
      aria-label={t('gameFrame.questWindow.bag')}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px 12px', flexShrink: 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <EngravedIcon id="nav-bag" size={14} style={{ color: 'var(--skin-title-color)' }} />
        <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--skin-font-display)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--skin-title-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t('gameFrame.questWindow.bag')}
        </span>
        <span data-hud-controls="" style={{ display: 'inline-flex' }}>
          <button type="button" aria-label={t('gameFrame.panels.close')} title={t('gameFrame.panels.close')} onClick={onClose}>
            <EngravedIcon id="cmd-close" />
          </button>
        </span>
      </div>
      {items.length === 0 ? (
        <span style={{ fontFamily: 'var(--skin-font-serif)', fontStyle: 'italic', fontSize: 12, color: TONE.muted }}>{t('gameFrame.questWindow.bagEmpty')}</span>
      ) : (
        <div data-testid="quest-belt-items" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <BeltItemChips items={items} statuses={statuses} armedFlags={armedFlags} onToggleFlag={onToggleFlag} />
        </div>
      )}
    </HudPlaque>
  );
};

export interface BeltItemChipsProps {
  items: StashItem[];
  statuses: Record<string, BeltItemStatus>;
  armedFlags: ReadonlySet<string>;
  onToggleFlag: (flag: string) => void;
  /** Chip diameter — the plaque uses 32, the inline Micro-Belt 24. */
  size?: number;
}

/**
 * The belt's icon-only item chips, extracted so the plaque and the
 * QuestRunWindow Micro-Belt share ONE renderer (PLAN-043 WS-4 —
 * dual-affordance bag): same `data-belt-item`/`data-belt-status` markers,
 * same arm/disarm semantics (`aria-pressed`, lit/dimmed/passive badge).
 */
export const BeltItemChips: React.FC<BeltItemChipsProps> = ({ items, statuses, armedFlags, onToggleFlag, size = 32 }) => {
  const { t } = useTranslation('idleVillage');
  const iconSize = Math.round(size * 0.56);
  return (
    <>
      {items.map((item) => {
        const status = statuses[item.flag] ?? 'available';
        const armed = armedFlags.has(item.flag);
        const qualifierKey = STATUS_QUALIFIER[status];
        const name = qualifierKey ? `${t(item.labelKey)} — ${t(qualifierKey)}` : t(item.labelKey);
        const lit = status === 'winner' || status === 'armed' || armed;
        const dimmed = status === 'shadowed' || status === 'inert';
        const icon = <VillageStashItemIcon icon={item.icon} size={iconSize} />;
        if (item.kind === 'passive') {
          /* Always-on gear: a badge, never a toggle — no `aria-pressed`
           * would be honest and none is set (WITNESS-12). */
          return (
            <span
              key={item.flag}
              role="img"
              aria-label={name}
              title={`${name} — ${t(item.descKey)}`}
              data-belt-item={item.flag}
              data-belt-status="passive"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: size,
                height: size,
                borderRadius: 999,
                border: '1px solid color-mix(in srgb, var(--skin-title-color) 55%, transparent)',
                background: 'color-mix(in srgb, var(--skin-title-color) 10%, transparent)',
                color: 'var(--skin-title-color)',
              }}
            >
              {icon}
            </span>
          );
        }
        return (
          <button
            key={item.flag}
            type="button"
            aria-label={name}
            aria-pressed={armed}
            title={`${name} — ${t(item.descKey)}`}
            data-belt-item={item.flag}
            data-belt-status={status}
            data-shadowed={status === 'shadowed' || undefined}
            data-inert={status === 'inert' || undefined}
            onClick={() => onToggleFlag(item.flag)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: size,
              height: size,
              padding: 0,
              borderRadius: 999,
              border: `1px solid ${lit ? 'var(--skin-title-color)' : 'color-mix(in srgb, var(--skin-surface-border) 60%, transparent)'}`,
              background: lit
                ? 'color-mix(in srgb, var(--skin-icon-accent, var(--skin-title-color)) 18%, transparent)'
                : 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 55%, transparent)',
              boxShadow: lit && !dimmed ? '0 0 8px color-mix(in srgb, var(--skin-title-color) 55%, transparent)' : 'none',
              color: dimmed ? TONE.muted : lit ? 'var(--skin-title-color)' : TONE.label,
              opacity: dimmed ? 0.75 : 1,
              cursor: 'pointer',
            }}
          >
            {icon}
          </button>
        );
      })}
    </>
  );
};

export default QuestBeltPlaque;
