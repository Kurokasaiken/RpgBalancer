import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { selectResourceOutlook } from '@/store/useMinimalGameplay';
import { ResourceReadout } from '@/ui/idleVillage/components/gameFrame/ResourceReadout';
import { DEFAULT_MINIMAL_CONFIG } from '@/balancing/config/idleVillage/minimalConfig';

type State = Parameters<typeof selectResourceOutlook>[0];
type Config = Parameters<typeof selectResourceOutlook>[1];

const config = {
  ...DEFAULT_MINIMAL_CONFIG,
  activities: [
    { id: 'woodcut', name: 'Woodcut', type: 'job', baseReward: { gold: 2, food: 0, wood: 5, xp: 0 }, cost: { gold: 0, food: 0 } },
    { id: 'hunt', name: 'Hunt', type: 'job', baseReward: { gold: 0, food: 3, wood: 0, xp: 0 }, cost: { gold: 0, food: 0 } },
  ],
  globalRules: { ...DEFAULT_MINIMAL_CONFIG.globalRules, dailyFoodConsumptionPerResident: 1 },
  ui: {
    ...DEFAULT_MINIMAL_CONFIG.ui,
    warningThresholds: { ...DEFAULT_MINIMAL_CONFIG.ui?.warningThresholds, foodDangerDays: 2 },
  },
} as unknown as Config;

const state = (over: Partial<State>): State =>
  ({
    gold: 15,
    food: 8,
    maxFood: 20,
    wood: 0,
    residents: [{}, {}, {}],
    activeActivities: [],
    ...over,
  }) as unknown as State;

describe('selectResourceOutlook', () => {
  it('derives food consumption and autonomy from residents', () => {
    const { food } = selectResourceOutlook(state({}), config);
    expect(food).toMatchObject({ value: 8, max: 20, perDay: 3, daysLeft: 2, danger: true });
  });

  it('is not in danger when stock lasts beyond the threshold', () => {
    expect(selectResourceOutlook(state({ food: 12 }), config).food.danger).toBe(false);
  });

  it('sums the base reward of activities in progress as incoming', () => {
    const outlook = selectResourceOutlook(
      state({
        activeActivities: [
          { activityId: 'woodcut', residentId: 'a', ticksRemaining: 3 },
          { activityId: 'woodcut', residentId: 'b', ticksRemaining: 1 },
          { activityId: 'hunt', residentId: 'c', ticksRemaining: 2 },
          { activityId: 'unknown', residentId: 'd', ticksRemaining: 2 },
        ],
      }),
      config,
    );
    expect(outlook.wood.incoming).toBe(10);
    expect(outlook.gold.incoming).toBe(4);
    expect(outlook.food.incoming).toBe(3);
  });
});

describe('ResourceReadout', () => {
  const setViewportWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  };
  const ITEMS = [
    { id: 'food', icon: <span />, label: 'Food', value: 8, max: 20, detail: '−3/d · 2 d', tone: 'danger' as const, description: 'Food 8 of 20.' },
  ];

  it('drops the trend line into the tooltip on a narrow viewport', () => {
    setViewportWidth(1280);
    render(<ResourceReadout items={ITEMS} />);
    expect(screen.getByRole('group', { name: 'Food 8 of 20.' })).toBeInTheDocument();
    expect(screen.queryByText('−3/d · 2 d')).not.toBeInTheDocument();
  });

  it('shows value, capacity, trend line and an accessible description', () => {
    setViewportWidth(1600);
    render(
      <ResourceReadout
        items={[
          { id: 'food', icon: <span />, label: 'Food', value: 8, max: 20, detail: '−3/d · 2 d', tone: 'danger', description: 'Food 8 of 20.' },
        ]}
      />,
    );
    expect(screen.getByRole('group', { name: 'Food 8 of 20.' })).toBeInTheDocument();
    expect(screen.getByText('/20')).toBeInTheDocument();
    expect(screen.getByText('−3/d · 2 d')).toBeInTheDocument();
  });
});
