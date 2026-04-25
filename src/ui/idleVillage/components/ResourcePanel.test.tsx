import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import ResourcePanel, { type ResourcePanelItem } from './ResourcePanel';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '../../../balancing/config/idleVillage/defaultConfig';

const buildConfigDrivenItems = (): ResourcePanelItem[] => {
  const configResources = DEFAULT_IDLE_VILLAGE_CONFIG.resources ?? {};
  const resourceOrder = ['gold', 'food'] as const;
  const resourceState: Record<(typeof resourceOrder)[number], number> = {
    gold: 245,
    food: 78,
  };
  const resourceDeltas: Record<(typeof resourceOrder)[number], number> = {
    gold: 9,
    food: -4,
  };

  return resourceOrder.map((resourceId) => {
    const definition = configResources[resourceId];
    if (!definition) {
      throw new Error(`Missing ${resourceId} definition in DEFAULT_IDLE_VILLAGE_CONFIG.resources`);
    }

    return {
      id: definition.id,
      label: definition.label ?? resourceId,
      icon: definition.icon,
      value: resourceState[resourceId],
      delta: resourceDeltas[resourceId],
      accentClass: definition.colorClass,
    };
  });
};

describe('ResourcePanel (config-driven items path)', () => {
  it('renders config resources with positive/negative deltas and accent classes', () => {
    const items = buildConfigDrivenItems();

    render(<ResourcePanel title="Sandbox Resources" items={items} />);

    expect(screen.getByRole('heading', { name: 'Sandbox Resources' })).toBeVisible();
    expect(screen.getByText(/2\s*res/)).toBeVisible();

    const goldPill = screen.getByTestId('resource-pill-gold');
    expect(within(goldPill).getByText('Gold')).toBeVisible();
    const goldDelta = within(goldPill).getByText('+9');
    expect(goldDelta).toHaveClass('text-emerald-300');
    const goldValue = within(goldPill).getByTestId('resource-value-gold');
    expect(goldValue).toHaveTextContent('245');
    expect(goldValue).toHaveClass('text-amber-300');

    const foodPill = screen.getByTestId('resource-pill-food');
    expect(within(foodPill).getByText('Food')).toBeVisible();
    const foodDelta = within(foodPill).getByText('-4');
    expect(foodDelta).toHaveClass('text-rose-300');
    const foodValue = within(foodPill).getByTestId('resource-value-food');
    expect(foodValue).toHaveTextContent('78');
    expect(foodValue).toHaveClass('text-emerald-300');

    expect(screen.queryByTestId('summary-strip')).not.toBeInTheDocument();
  });
});
