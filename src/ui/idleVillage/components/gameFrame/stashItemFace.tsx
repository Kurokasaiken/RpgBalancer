/**
 * Shared stash-item vocabulary (R-270, Director ruling): the village shelf
 * (`VillageStashPanel`) and the quest planner bag/tray
 * (`QuestExpeditionDetail`) are different containers of the same stock —
 * they render the SAME item-face (lacquer tile + corner ×N badge), the
 * SAME tooltip vocabulary (name · description · covers · stock) and the
 * SAME skin tokens. Containers stay different; the grammar is one.
 */
import React, { type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { STAT_SHORT } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import { VillageStashItemIcon } from './villageStashItemIcons';

/**
 * Key-stat coverage of a stash item, for the shared tooltip's `covers`
 * line: catalog `engineFlag` → `QUEST_STASH` entry → short stat labels.
 * One join for both surfaces (planner tray and village shelf).
 */
export const stashItemCovers = (itemId: string): string[] => {
  const flag = defaultQuestItems[itemId]?.engineFlag;
  const stash = flag ? QUEST_STASH.items.find((i) => i.flag === flag) : undefined;
  return stash?.stats?.map((s) => STAT_SHORT[s] ?? s) ?? [];
};

/** Corner quantity badge — `×N` pinned bottom-right of the tile. */
export const StashQtyBadge: React.FC<{ qty: number }> = ({ qty }) => (
  <span
    aria-hidden
    data-testid="stash-qty-badge"
    style={{
      position: 'absolute',
      right: 1,
      bottom: 0,
      fontFamily: 'var(--skin-font-display)',
      fontSize: 12,
      lineHeight: 1,
      fontVariantNumeric: 'tabular-nums',
      color: 'var(--skin-text-secondary)',
    }}
  >
    ×{qty}
  </span>
);

export interface StashItemTileProps {
  /** `questItems` icon field — resolved by `VillageStashItemIcon`. */
  icon?: string;
  /** Remaining stock copies; the badge mounts only when defined. */
  qty?: number;
  /** Tile edge in px (planner tray/bag 44, village shelf 32). */
  size?: number;
  /** Glyph size in px (default ≈ half the tile). */
  iconSize?: number;
  /** Selected (packed) look — brass border + tinted lacquer. */
  selected?: boolean;
}

/**
 * The lacquer item tile: rounded surface-bordered frame on lacquer-deep,
 * engraved glyph centred, optional corner stock badge. Purely decorative —
 * the surrounding control (row button / picker button) carries semantics.
 */
export const StashItemTile: React.FC<StashItemTileProps> = ({ icon, qty, size = 44, iconSize, selected }) => (
  <span
    aria-hidden
    data-testid="stash-item-tile"
    style={{
      position: 'relative',
      width: size,
      height: size,
      borderRadius: 8,
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1px solid color-mix(in srgb, ${selected ? 'var(--skin-title-color)' : 'var(--skin-surface-border)'} ${selected ? 85 : 60}%, transparent)`,
      background: selected ? 'color-mix(in srgb, var(--skin-title-color) 22%, transparent)' : 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 55%, transparent)',
      color: 'var(--skin-title-color)',
    }}
  >
    <VillageStashItemIcon icon={icon} size={iconSize ?? Math.round(size / 2)} />
    {qty != null && <StashQtyBadge qty={qty} />}
  </span>
);

/** Tooltip surface — the lacquer idiom both surfaces already shared. */
export const STASH_TOOLTIP_STYLE: CSSProperties = {
  zIndex: 2000,
  maxWidth: 280,
  padding: '9px 11px',
  borderRadius: 8,
  border: '1px solid color-mix(in srgb, var(--skin-surface-border) 70%, transparent)',
  background: 'var(--skin-hud-lacquer-deep)',
  boxShadow: '0 10px 24px color-mix(in srgb, var(--skin-hud-lacquer-deep) 80%, transparent)',
};

export interface StashItemTooltipData {
  /** i18n key for the item name (already `idleVillage.`-stripped). */
  labelKey: string;
  /** Resolved description key (catalog `descKey` or stash effect text). */
  descKey?: string;
  /** Covered stat short-labels — mounted only when the item covers stats. */
  covers?: string[];
  /** Stock copies available to the viewer (village remaining / bag stock). */
  stockQty: number;
}

const line: CSSProperties = {
  fontFamily: 'var(--skin-font-serif)',
  fontSize: 12,
  lineHeight: 1.35,
  color: 'var(--skin-text-primary)',
};

/**
 * The shared tooltip vocabulary — name (uppercase display), effect
 * description, key-stat coverage (when present), stock count. Both stash
 * surfaces mount this body inside the same lacquer surface.
 */
export const StashItemTooltipBody: React.FC<StashItemTooltipData> = ({ labelKey, descKey, covers, stockQty }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <>
      <div style={{ fontFamily: 'var(--skin-font-display)', fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--skin-title-color)', marginBottom: 4 }}>
        {t(labelKey)}
      </div>
      {descKey && <div style={line}>{t(descKey)}</div>}
      {covers && covers.length > 0 && (
        <div style={{ ...line, color: 'var(--skin-text-secondary)' }}>
          {t('questExpedition.bag.covers')} {covers.join(' · ')}
        </div>
      )}
      <div style={{ ...line, color: 'var(--skin-text-secondary)' }}>{t('questExpedition.bag.stock', { qty: stockQty })}</div>
    </>
  );
};
