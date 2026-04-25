import type { PassiveEffectDefinition } from './types';

export const DEFAULT_PASSIVE_EFFECTS: Record<string, PassiveEffectDefinition> = {
  food_upkeep_daily: {
    id: 'food_upkeep_daily',
    label: 'Daily Food Upkeep',
    description: 'Baseline food consumption applied once per in-game day for all living residents.',
    icon: '🍖',
    verbToneId: 'system',
    slotTags: ['village', 'job_site'],
    timeUnitsBetweenTicks: 5,
    resourceDeltas: [
      {
        resourceId: 'food',
        amountFormula: '-2',
      },
    ],
    metadata: {
      systemVerb: true,
    },
  },
};
