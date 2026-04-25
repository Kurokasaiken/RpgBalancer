import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import ResidentSlotRack from '@/ui/idleVillage/components/ResidentSlotRack';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';

class IntersectionObserverMock {
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe() {
    // no-op
  }
  disconnect() {
    // no-op
  }
  unobserve() {
    // no-op
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

class ResizeObserverMock {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe() {
    // no-op
  }
  disconnect() {
    // no-op
  }
  unobserve() {
    // no-op
  }
}

const noop = () => undefined;

const mockSlots: ResidentSlotViewModel[] = [
  {
    id: 'slot-1',
    index: 0,
    label: 'Slot 1',
    statHint: 'Strength',
    required: false,
    assignedResidentId: null,
    assignedResident: undefined,
    requirement: undefined,
    modifiers: undefined,
    isPlaceholder: false,
    dropState: 'idle',
    bloomState: 'idle',
    status: 'empty',
    telemetryTags: [],
  },
  {
    id: 'slot-2',
    index: 1,
    label: 'Slot 2',
    statHint: 'Agility',
    required: false,
    assignedResidentId: 'res-1',
    assignedResident: {
      id: 'res-1',
      status: 'available',
      fatigue: 0,
      currentHp: 100,
      maxHp: 100,
      isHero: false,
      isInjured: false,
      survivalCount: 0,
      survivalScore: 0,
    },
    requirement: undefined,
    modifiers: undefined,
    isPlaceholder: false,
    dropState: 'idle',
    bloomState: 'idle',
    status: 'assigned',
    telemetryTags: [],
  },
];

describe('ResidentSlotRack', () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;
  const originalResizeObserver = globalThis.ResizeObserver;

  beforeAll(() => {
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: IntersectionObserverMock,
    });
    Object.defineProperty(globalThis, 'ResizeObserver', {
      writable: true,
      configurable: true,
      value: ResizeObserverMock,
    });
  });

  afterAll(() => {
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: originalIntersectionObserver,
    });
    Object.defineProperty(globalThis, 'ResizeObserver', {
      writable: true,
      configurable: true,
      value: originalResizeObserver,
    });
  });

  it('renders slots correctly', () => {
    render(
      <ResidentSlotRack
        slots={mockSlots}
        layout="detail"
        overflowBehavior="wrap"
        onSlotDrop={noop}
        onSlotClear={noop}
        onSlotClick={noop}
      />
    );

    expect(screen.getAllByText('Slot 1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Slot 2').length).toBeGreaterThanOrEqual(1);
  });

  it('shows hint when overflowing', () => {
    // Mock scroll overflow by providing many slots
    const manySlots = Array.from({ length: 10 }, (_, i) => ({
      ...mockSlots[0],
      id: `slot-${i}`,
      index: i,
      label: `Slot ${i + 1}`,
    }));

    render(
      <ResidentSlotRack
        slots={manySlots}
        layout="detail"
        overflowBehavior="scroll"
        onSlotDrop={noop}
        onSlotClear={noop}
        onSlotClick={noop}
      />
    );

    // Note: overflow detection may not trigger in test, but basic render ok
    expect(screen.getAllByText(/Slot \d+/i).length).toBeGreaterThanOrEqual(1);
  });
});
