/**
 * Roster V2 header controls — unit tests.
 *
 * Covers the restored V1 filtering/sorting surface on DragTestContainerV2:
 * - status select filters the rendered list (all / heroes / per-status)
 * - the sort select is no longer an inert mockup: rosterSortConfig modes and
 *   dynamic statSnapshot stats reorder the rendered cards after filtering,
 *   inside the hero / active / blocked groups.
 * - the direction toggle applies to stat sorts only.
 *
 * Framework: Vitest + React Testing Library
 */

import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import DragTestContainerV2 from '@/ui/idleVillage/rosterV2/DragTestContainerV2';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

const makeResident = (overrides: Partial<ResidentState>): ResidentState => ({
  id: 'res-x',
  displayName: 'X',
  status: 'available',
  fatigue: 0,
  currentHp: 100,
  maxHp: 100,
  isHero: false,
  isInjured: false,
  survivalCount: 0,
  survivalScore: 0,
  ...overrides,
});

const RESIDENTS: ResidentState[] = [
  makeResident({
    id: 'res-alpha',
    displayName: 'Alpha',
    currentHp: 100,
    fatigue: 10,
    statSnapshot: { damage: 5 },
  }),
  makeResident({
    id: 'res-beta',
    displayName: 'Beta',
    currentHp: 80,
    fatigue: 20,
    statSnapshot: { damage: 15 },
  }),
  makeResident({
    id: 'res-gamma',
    displayName: 'Gamma',
    status: 'injured',
    isInjured: true,
    currentHp: 30,
    fatigue: 80,
    statSnapshot: { damage: 30 },
  }),
  makeResident({
    id: 'res-zeta',
    displayName: 'Zeta',
    isHero: true,
    currentHp: 90,
    fatigue: 5,
    statSnapshot: { damage: 1 },
  }),
];

const WRAPPER = ({ children }: { children: React.ReactNode }) => (
  <DndContext>
    <DragProvider>{children}</DragProvider>
  </DndContext>
);

/**
 * Reads the rendered card order from the roster list.
 * Card wrappers carry data-resident-id as direct children of the list container.
 */
function renderedOrder(container: HTMLElement): string[] {
  const list = container.querySelector('[data-resident-count]');
  if (!list) return [];
  return Array.from(list.children)
    .map((el) => el.getAttribute('data-resident-id'))
    .filter((id): id is string => Boolean(id));
}

describe('DragTestContainerV2 header controls', () => {
  it('status filter narrows the list and updates the counter', async () => {
    const { container } = render(<DragTestContainerV2 residents={RESIDENTS} />, {
      wrapper: WRAPPER,
    });

    expect(renderedOrder(container)).toEqual([
      'res-zeta',
      'res-alpha',
      'res-beta',
      'res-gamma',
    ]);
    expect(container.querySelector('[data-testid="resident-count"]')?.textContent).toBe('4/4');

    const select = container.querySelector('[data-testid="roster-filter-select"]') as HTMLSelectElement;
    await userEvent.selectOptions(select, 'injured');
    expect(renderedOrder(container)).toEqual(['res-gamma']);

    await userEvent.selectOptions(select, 'heroes');
    expect(renderedOrder(container)).toEqual(['res-zeta']);

    await userEvent.selectOptions(select, 'all');
    expect(renderedOrder(container)).toHaveLength(4);
  });

  it('sort select reorders cards with the V1 modes (name-desc, hp-desc, fatigue-asc)', async () => {
    const { container } = render(<DragTestContainerV2 residents={RESIDENTS} />, {
      wrapper: WRAPPER,
    });
    const sort = container.querySelector('[data-testid="roster-stat-sort-select"]') as HTMLSelectElement;

    // name Z→A inside the groups: hero group stays first, blocked stays last
    await userEvent.selectOptions(sort, 'name-desc');
    expect(renderedOrder(container)).toEqual([
      'res-zeta',
      'res-beta',
      'res-alpha',
      'res-gamma',
    ]);

    // HP highest first inside groups
    await userEvent.selectOptions(sort, 'hp-desc');
    expect(renderedOrder(container)).toEqual([
      'res-zeta',
      'res-alpha',
      'res-beta',
      'res-gamma',
    ]);

    // Fatigue lowest first inside groups
    await userEvent.selectOptions(sort, 'fatigue-asc');
    expect(renderedOrder(container)).toEqual([
      'res-zeta',
      'res-alpha',
      'res-beta',
      'res-gamma',
    ]);
  });

  it('dynamic stat sort orders by statSnapshot and respects the direction toggle', async () => {
    const { container } = render(<DragTestContainerV2 residents={RESIDENTS} />, {
      wrapper: WRAPPER,
    });
    const sort = container.querySelector('[data-testid="roster-stat-sort-select"]') as HTMLSelectElement;
    const direction = container.querySelector('[data-testid="roster-stat-sort-direction"]') as HTMLButtonElement;

    // Direction toggle is meaningful only for stat sorts
    expect(direction).toBeDisabled();

    await userEvent.selectOptions(sort, 'stat:damage');
    expect(direction).toBeEnabled();

    // Default direction desc: damage 30 is in the blocked group (Gamma stays last),
    // so within the active group Beta(15) precedes Alpha(5)
    expect(renderedOrder(container)).toEqual([
      'res-zeta',
      'res-beta',
      'res-alpha',
      'res-gamma',
    ]);

    await userEvent.click(direction); // asc
    expect(renderedOrder(container)).toEqual([
      'res-zeta',
      'res-alpha',
      'res-beta',
      'res-gamma',
    ]);
  });

  it('status filter and stat sort compose: sort applies to the filtered subset', async () => {
    const { container } = render(<DragTestContainerV2 residents={RESIDENTS} />, {
      wrapper: WRAPPER,
    });
    const status = container.querySelector('[data-testid="roster-filter-select"]') as HTMLSelectElement;
    const sort = container.querySelector('[data-testid="roster-stat-sort-select"]') as HTMLSelectElement;

    await userEvent.selectOptions(status, 'available');
    await userEvent.selectOptions(sort, 'stat:damage');

    expect(renderedOrder(container)).toEqual(['res-zeta', 'res-beta', 'res-alpha']);
  });

  it('empty filter result shows the empty state', async () => {
    const { container } = render(<DragTestContainerV2 residents={RESIDENTS} />, {
      wrapper: WRAPPER,
    });
    const status = container.querySelector('[data-testid="roster-filter-select"]') as HTMLSelectElement;
    await userEvent.selectOptions(status, 'dead');

    expect(renderedOrder(container)).toEqual([]);
    expect(container.querySelector('[data-resident-count]')?.getAttribute('data-resident-count')).toBe('0');
  });
});
