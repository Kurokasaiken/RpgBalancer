/**
 * rosterKit v1.1.0 — `density="compact"` (HUD strip) and its isolation from the
 * default, certified layout.
 */

import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  VillageRosterSection,
  RosterKitShell,
  useRosterKitData,
} from '@/ui/idleVillage/frozen/kits/rosterKit';

function Harness({ density }: { density?: 'default' | 'compact' }): JSX.Element {
  const { residents } = useRosterKitData();
  return (
    <RosterKitShell>
      <VillageRosterSection residents={residents} componentId="rosterKit-compact-test" useWanderlustSkin density={density} />
    </RosterKitShell>
  );
}

const animated = (root: Element, name: string) =>
  [...root.querySelectorAll<HTMLElement>('[style]')].filter((el) => el.style.animation.includes(name));

describe('rosterKit compact density', () => {
  test('renders one compact strip per visible resident', () => {
    const { container } = render(<Harness density="compact" />);
    const strips = container.querySelectorAll('[data-density="compact"]');
    const count = container.querySelector('[data-testid="resident-count"]')?.textContent ?? '';
    expect(strips.length).toBeGreaterThan(0);
    expect(String(strips.length)).toBe(count.split('/')[0]);
  });

  test('keeps filter and sort controls, tagged for compact sizing, and drops decorative animations', () => {
    const { container, queryByTestId } = render(<Harness density="compact" />);
    expect(queryByTestId('roster-filter-select')).not.toBeNull();
    expect(queryByTestId('roster-stat-sort-select')).not.toBeNull();
    expect(container.querySelector('[data-roster-controls="compact"]')).not.toBeNull();
    expect(queryByTestId('roster-drag-handle')).not.toBeNull();
    expect(animated(container, 'firefly')).toHaveLength(0);
    expect(animated(container, 'border-pulse')).toHaveLength(0);
  });

  test('keeps strips draggable through the same dnd-kit wiring as the full card', () => {
    const { container } = render(<Harness density="compact" />);
    const strip = container.querySelector('[data-density="compact"]');
    expect(strip?.getAttribute('aria-roledescription')).toBe('draggable');
    expect(strip?.getAttribute('data-worker-id')).toBeTruthy();
  });

  test('default density is untouched: menus present, no compact markers', () => {
    const { container, queryByTestId } = render(<Harness />);
    expect(queryByTestId('roster-filter-select')).not.toBeNull();
    expect(container.querySelector('[data-density="compact"]')).toBeNull();
    expect(container.querySelector('[data-roster-controls]')).toBeNull();
    expect(animated(container, 'firefly').length).toBeGreaterThan(0);
  });
});
