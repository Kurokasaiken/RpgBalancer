/**
 * dragSensors — PLAN-043 hold-or-move drag contract: every drag surface arms
 * the same sensor triple (pointer hold/drag, touch, keyboard) so a quick click
 * stays a click and keyboard keeps full parity.
 */
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIdleVillageDragSensors } from '@/ui/idleVillage/interaction/dragSensors';

describe('useIdleVillageDragSensors — hold-or-move sensors', () => {
  // INV:drag-sensors.INV-1 — the hook arms exactly three sensors (pointer
  // hold-or-move, touch, keyboard) so every draggable supports click,
  // hold/drag and keyboard parity from one config.
  it('arms pointer, touch and keyboard sensors', () => {
    const { result } = renderHook(() => useIdleVillageDragSensors());
    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current).toHaveLength(3);
  });
});
