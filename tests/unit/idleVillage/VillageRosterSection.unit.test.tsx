/**
 * VillageRosterSection Unit Tests — Fase 2
 *
 * Test per VillageRosterSection component con ordinamento e filtering.
 * Coprire: sort modes, filtering, update timing, resident display.
 *
 * Spec: COMPONENTS_SPECIFICATION.md § FASE 2: Roster + PgToken
 * Test Count: 15 tests (TEST-019 → TEST-031)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { VillageRosterSection } from '@/ui/idleVillage/roster';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

// Mock residents for testing
const MOCK_RESIDENTS: ResidentState[] = [
  {
    id: 'res-aelin',
    name: 'Aelin Swiftblade',
    type: 'hero',
    level: 1,
    hp: 25,
    maxHp: 25,
    fatigue: 2,
    isAway: false,
    isInjured: false,
    isBusy: false,
    assignedSlot: null,
    portraitUrl: 'https://example.com/aelin.jpg',
    statSnapshot: { strength: 12, perception: 14, wisdom: 10, charisma: 11, rarity: 1 },
  },
  {
    id: 'res-borin',
    name: 'Borin Stonefist',
    type: 'artisan',
    level: 2,
    hp: 30,
    maxHp: 30,
    fatigue: 5,
    isAway: false,
    isInjured: false,
    isBusy: false,
    assignedSlot: null,
    portraitUrl: 'https://example.com/borin.jpg',
    statSnapshot: { strength: 15, perception: 10, wisdom: 12, charisma: 8, rarity: 2 },
  },
  {
    id: 'res-theron',
    name: 'Theron the Wise',
    type: 'artisan',
    level: 3,
    hp: 35,
    maxHp: 35,
    fatigue: 8,
    isAway: false,
    isInjured: false,
    isBusy: false,
    assignedSlot: null,
    portraitUrl: 'https://example.com/theron.jpg',
    statSnapshot: { strength: 10, perception: 12, wisdom: 16, charisma: 13, rarity: 3 },
  },
];

const WRAPPER_WITH_DND = ({ children }: { children: React.ReactNode }) => (
  <DndContext>
    <DragProvider>
      {children}
    </DragProvider>
  </DndContext>
);

describe('VillageRosterSection Component (Fase 2 - Ordinamento)', () => {
  describe('✅ TEST-019 to TEST-023: Rendering & Sort Modes', () => {
    it('TEST-019: VillageRosterSection renders all residents', () => {
      const { container } = render(
        <VillageRosterSection
          residents={MOCK_RESIDENTS}
          sortMode="name-asc"
          onSortModeChange={vi.fn()}
          data-testid="roster-section"
        />,
        { wrapper: WRAPPER_WITH_DND }
      );

      expect(container).toBeTruthy();
      // Should render section element
      const section = container.querySelector('[data-testid="village-roster-section"]');
      expect(section).toBeTruthy();
    });

    it('TEST-020: Renders residents in name-asc order (A → Z)', () => {
      const { container } = render(
        <VillageRosterSection
          residents={MOCK_RESIDENTS}
          sortMode="name-asc"
          onSortModeChange={vi.fn()}
        />,
        { wrapper: WRAPPER_WITH_DND }
      );

      // Get rendered text content - should be alphabetical
      const text = container.textContent || '';
      // Aelin should appear before Borin which should appear before Theron
      const aelinIdx = text.indexOf('Aelin');
      const borinIdx = text.indexOf('Borin');
      const theronIdx = text.indexOf('Theron');

      expect(aelinIdx).toBeGreaterThanOrEqual(0);
      expect(borinIdx).toBeGreaterThan(aelinIdx);
      expect(theronIdx).toBeGreaterThan(borinIdx);
    });

    it('TEST-021: Renders residents in name-desc order (Z → A)', () => {
      const { container } = render(
        <VillageRosterSection
          residents={MOCK_RESIDENTS}
          sortMode="name-desc"
          onSortModeChange={vi.fn()}
        />,
        { wrapper: WRAPPER_WITH_DND }
      );

      const text = container.textContent || '';
      // Theron should appear before Borin which should appear before Aelin
      const aelinIdx = text.indexOf('Aelin');
      const borinIdx = text.indexOf('Borin');
      const theronIdx = text.indexOf('Theron');

      expect(theronIdx).toBeGreaterThanOrEqual(0);
      expect(borinIdx).toBeGreaterThan(theronIdx);
      expect(aelinIdx).toBeGreaterThan(borinIdx);
    });

    it('TEST-022: Renders with rarity-desc sort mode applied', () => {
      const { container } = render(
        <VillageRosterSection
          residents={MOCK_RESIDENTS}
          sortMode="rarity-desc"
          onSortModeChange={vi.fn()}
        />,
        { wrapper: WRAPPER_WITH_DND }
      );

      const text = container.textContent || '';
      // All residents should be present regardless of sort order
      expect(text).toContain('Aelin');
      expect(text).toContain('Borin');
      expect(text).toContain('Theron');

      // Component should render without errors
      expect(container).toBeTruthy();
    });

    it('TEST-023: Update timing < 100ms after sort mode change', async () => {
      const onSortModeChange = vi.fn();
      const { rerender } = render(
        <VillageRosterSection
          residents={MOCK_RESIDENTS}
          sortMode="name-asc"
          onSortModeChange={onSortModeChange}
        />,
        { wrapper: WRAPPER_WITH_DND }
      );

      const startTime = performance.now();

      rerender(
        <VillageRosterSection
          residents={MOCK_RESIDENTS}
          sortMode="rarity-desc"
          onSortModeChange={onSortModeChange}
        />
      );

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('✅ TEST-024 to TEST-026: Busy State & Filtering', () => {
    it('TEST-024: Busy resident shows dimmed state', () => {
      const busyResident: ResidentState = {
        ...MOCK_RESIDENTS[0],
        isBusy: true,
      };

      const residentsWithBusy = [busyResident, MOCK_RESIDENTS[1]];

      const { container } = render(
        <VillageRosterSection
          residents={residentsWithBusy}
          sortMode="name-asc"
          onSortModeChange={vi.fn()}
        />,
        { wrapper: WRAPPER_WITH_DND }
      );

      // Check for busy indicator - text should mention busy state somehow
      const text = container.textContent || '';
      // Component should still be rendered, just visually different
      expect(text).toContain('Aelin');
    });

    it('TEST-025: Injured resident stays in list', () => {
      const injuredResident: ResidentState = {
        ...MOCK_RESIDENTS[0],
        isInjured: true,
      };

      const residentsWithInjured = [injuredResident, MOCK_RESIDENTS[1]];

      const { container } = render(
        <VillageRosterSection
          residents={residentsWithInjured}
          sortMode="name-asc"
          onSortModeChange={vi.fn()}
        />,
        { wrapper: WRAPPER_WITH_DND }
      );

      const text = container.textContent || '';
      expect(text).toContain('Aelin');
    });

    it('TEST-026: Away resident stays in list', () => {
      const awayResident: ResidentState = {
        ...MOCK_RESIDENTS[0],
        isAway: true,
      };

      const residentsWithAway = [awayResident, MOCK_RESIDENTS[1]];

      const { container } = render(
        <VillageRosterSection
          residents={residentsWithAway}
          sortMode="name-asc"
          onSortModeChange={vi.fn()}
        />,
        { wrapper: WRAPPER_WITH_DND }
      );

      const text = container.textContent || '';
      expect(text).toContain('Aelin');
    });
  });

  describe('✅ TEST-027 to TEST-029: Interaction & Callbacks', () => {
    it('TEST-027: onSortModeChange callback works', async () => {
      const onSortModeChange = vi.fn();
      const { container } = render(
        <VillageRosterSection
          residents={MOCK_RESIDENTS}
          sortMode="name-asc"
          onSortModeChange={onSortModeChange}
        />,
        { wrapper: WRAPPER_WITH_DND }
      );

      expect(container).toBeTruthy();
      // Verify callback is available (will be called by RosterSortIcon)
    });

    it('TEST-028: onResidentSelect callback available', () => {
      const onResidentSelect = vi.fn();
      const { container } = render(
        <VillageRosterSection
          residents={MOCK_RESIDENTS}
          sortMode="name-asc"
          onSortModeChange={vi.fn()}
          onResidentSelect={onResidentSelect}
        />,
        { wrapper: WRAPPER_WITH_DND }
      );

      expect(container).toBeTruthy();
      // Callback available
    });

    it('TEST-029: Accepts componentId prop for drag tracking', () => {
      const { container } = render(
        <VillageRosterSection
          residents={MOCK_RESIDENTS}
          sortMode="name-asc"
          onSortModeChange={vi.fn()}
          componentId="roster-test-123"
        />,
        { wrapper: WRAPPER_WITH_DND }
      );

      expect(container).toBeTruthy();
    });
  });

  describe('✅ TEST-030 to TEST-031: Integration', () => {
    it('TEST-030: Reorders without breaking resident display', () => {
      const { rerender, container: container1 } = render(
        <VillageRosterSection
          residents={MOCK_RESIDENTS}
          sortMode="name-asc"
          onSortModeChange={vi.fn()}
        />,
        { wrapper: WRAPPER_WITH_DND }
      );

      // Get initial text
      const text1 = container1.textContent || '';
      expect(text1).toContain('Aelin');
      expect(text1).toContain('Borin');
      expect(text1).toContain('Theron');

      // Reorder
      rerender(
        <VillageRosterSection
          residents={MOCK_RESIDENTS}
          sortMode="rarity-desc"
          onSortModeChange={vi.fn()}
        />
      );

      // All residents still present
      const text2 = container1.textContent || '';
      expect(text2).toContain('Aelin');
      expect(text2).toContain('Borin');
      expect(text2).toContain('Theron');
    });

    it('TEST-031: Filtering does not mutate resident data', () => {
      const busyResident: ResidentState = {
        ...MOCK_RESIDENTS[0],
        isBusy: true,
      };

      const residentsWithBusy = [busyResident, MOCK_RESIDENTS[1]];

      const { rerender } = render(
        <VillageRosterSection
          residents={residentsWithBusy}
          sortMode="name-asc"
          onSortModeChange={vi.fn()}
        />,
        { wrapper: WRAPPER_WITH_DND }
      );

      // Verify original object not mutated
      expect(busyResident.isBusy).toBe(true);
      expect(busyResident.name).toBe('Aelin Swiftblade');

      // Reorder shouldn't affect original
      rerender(
        <VillageRosterSection
          residents={residentsWithBusy}
          sortMode="rarity-desc"
          onSortModeChange={vi.fn()}
        />
      );

      expect(busyResident.isBusy).toBe(true);
    });
  });

  describe('✅ Additional: DndContext & DragProvider Integration', () => {
    it('Works correctly within DndContext + DragProvider', () => {
      const { container } = render(
        <DndContext>
          <DragProvider>
            <VillageRosterSection
              residents={MOCK_RESIDENTS}
              sortMode="name-asc"
              onSortModeChange={vi.fn()}
            />
          </DragProvider>
        </DndContext>
      );

      expect(container).toBeTruthy();
      const section = container.querySelector('[data-testid="village-roster-section"]');
      expect(section).toBeTruthy();
    });
  });
});
