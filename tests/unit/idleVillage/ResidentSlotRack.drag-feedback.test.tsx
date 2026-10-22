import '@testing-library/jest-dom';
import { DndContext } from '@dnd-kit/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResidentSlotRack, resolveSlotBloomState } from '@/ui/idleVillage/components/ResidentSlotRack';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';

vi.mock('@/ui/idleVillage/hooks/useSensoryAudio', () => ({
  useSensoryAudio: () => vi.fn(),
}));

vi.mock('@/ui/idleVillage/hooks/useSlotSounds', () => ({
  useSlotSounds: () => ({ clank: vi.fn(), detach: vi.fn(), reject: vi.fn(), complete: vi.fn(), testAll: vi.fn() }),
}));

const emptySlot: ResidentSlotViewModel = {
  id: 'poi-goblin:goblin-slot-member-1',
  index: 0,
  label: 'Fighter',
  assignedResidentId: null,
  isPlaceholder: false,
  dropState: 'valid',
  bloomState: 'valid',
  status: 'empty',
  telemetryTags: [],
};

describe('ResidentSlotRack drag feedback', () => {
  it('keeps empty seats static even when a compatible resident is being dragged over them', () => {
    expect(resolveSlotBloomState('valid', false, true)).toBe('idle');

    render(
      <DndContext>
        <ResidentSlotRack
          slots={[emptySlot]}
          layout="detail"
          slotSize={64}
          slotMaterial="hud-gold"
          slotVariant="hud64"
        />
      </DndContext>,
    );

    const slot = screen.getByTestId(`slot-button-${emptySlot.id}`);
    expect(slot).toHaveStyle({ filter: 'none', animation: '' });
  });

  it('only blooms an occupied slot when it is the active valid swap target', () => {
    expect(resolveSlotBloomState('valid', true, true)).toBe('valid');
    expect(resolveSlotBloomState('valid', true, false)).toBe('idle');
    expect(resolveSlotBloomState('invalid', true, true)).toBe('invalid');
    expect(resolveSlotBloomState('invalid', false, true)).toBe('invalid');
  });

  // INV:resident-slot-rack.INV-2 — R-257: while a flight proxy carries this
  // resident (extraction return or
  // swap), the seat must NOT render a second identical medallion — the clear
  // commits in a transition, so without `flyingResidentId` suppression the
  // seat copy stays visible for the whole flight (Director: «due medaglioni»).
  it('hides the seat medallion while its resident is airborne on a flight', () => {
    const slotted: ResidentSlotViewModel = {
      ...emptySlot,
      assignedResidentId: 'hero-giggiolillo',
    };

    render(
      <DndContext>
        <ResidentSlotRack
          slots={[slotted]}
          layout="detail"
          slotSize={64}
          slotMaterial="hud-gold"
          slotVariant="hud64"
          suppressedResidentIds={['hero-giggiolillo']}
        />
      </DndContext>,
    );

    expect(screen.queryByTestId(`slot-medal-${slotted.id}`)).toBeNull();
    /* Sanity: the same seat without the suppression signal shows its medal. */
  });
});
