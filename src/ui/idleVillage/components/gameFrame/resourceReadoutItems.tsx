import type { TFunction } from 'i18next';
import type { ResourceOutlook } from '@/store/useMinimalGameplay';
import { HudGlyph } from './hudIcons';
import type { ResourceReadoutItem } from './ResourceReadout';

/**
 * Turns `selectResourceOutlook` into readout items: amount, trend line, tone, and a
 * full sentence for hover / screen readers. `t` must be bound to the `idleVillage`
 * namespace.
 */
export function buildResourceReadoutItems(outlook: ResourceOutlook, t: TFunction<'idleVillage'>): ResourceReadoutItem[] {
  const income = (id: 'gold' | 'wood', iconLabelKey: string): ResourceReadoutItem => {
    const label = t(iconLabelKey);
    const { value, incoming } = outlook[id];
    const description =
      t('gameFrame.resources.tooltip.amount', { label, value }) +
      (incoming > 0 ? ` ${t('gameFrame.resources.tooltip.incoming', { count: incoming })}` : '');
    return {
      id,
      icon: <HudGlyph iconId={id} label={label} />,
      label,
      value,
      detail: incoming > 0 ? t('gameFrame.resources.incoming', { count: incoming }) : undefined,
      tone: incoming > 0 ? 'good' : undefined,
      description,
    };
  };

  const food = outlook.food;
  const foodLabel = t('gameFrame.resources.food');
  const lasts = Number.isFinite(food.daysLeft);
  const foodItem: ResourceReadoutItem = {
    id: 'food',
    icon: <HudGlyph iconId="food" label={foodLabel} />,
    label: foodLabel,
    value: food.value,
    max: food.max,
    detail: [
      t('gameFrame.resources.perDay', { count: food.perDay }),
      lasts ? t('gameFrame.resources.autonomy', { count: food.daysLeft }) : null,
    ]
      .filter(Boolean)
      .join(' · '),
    tone: food.danger ? 'danger' : undefined,
    description: t('gameFrame.resources.tooltip.food', {
      label: foodLabel,
      value: food.value,
      max: food.max,
      perDay: food.perDay,
      days: lasts ? food.daysLeft : '∞',
    }),
  };

  return [income('gold', 'gameFrame.resources.gold'), foodItem, income('wood', 'gameFrame.resources.wood')];
}
