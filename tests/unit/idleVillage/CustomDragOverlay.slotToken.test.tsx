/**
 * PLAN-067 T-A5 (R-234) — a slotted token being swapped is painted by the
 * rack's own ghost (`slot-token-ghost` in `ResidentSlotRack`). The shared drag
 * overlay has no resident for a `slot-token:<slotId>` id and used to fall back
 * to printing the id itself («slot-token:poi-goblin:goblin-slot-leader» flying
 * under the cursor, audit F3 §6.2).
 */
import '@testing-library/jest-dom';
import { DndContext } from '@dnd-kit/core';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';
import { slotTokenDragId } from '@/ui/idleVillage/components/ResidentSlotRack';

vi.mock('@/ui/idleVillage/components/DragContextStore', () => ({
  useDragContext: () => ({ setDragPreviewCenter: vi.fn(), magnetTargetCenter: null, setDragHomeCenter: vi.fn() }),
}));
vi.mock('@/ui/idleVillage/hooks/useDragPreviewInstrumentation', () => ({
  useDragPreviewInstrumentation: () => ({ measurePreviewCreation: vi.fn().mockResolvedValue(null) }),
}));

describe('CustomDragOverlay — slot token swap', () => {
  // INV:R-234-no-raw-drag-id — a drag id is never painted as text: a slot-token swap draws
  // nothing in the shared overlay (the rack's ghost carries the portrait).
  it('never paints the raw slot-token drag id (R-234)', () => {
    for (const usePgCardPreview of [true, false]) {
      const { unmount } = render(
        <DndContext>
          <CustomDragOverlay
            dragVisualState={{ mode: 'idle' }}
            forcedResidentId={slotTokenDragId('poi-goblin:goblin-slot-leader')}
            usePgCardPreview={usePgCardPreview}
          />
        </DndContext>,
      );
      const painted = [...document.body.querySelectorAll('[data-dnd-overlay]')].map((n) => n.textContent ?? '').join(' ');
      expect(painted).not.toContain('slot-token:');
      unmount();
    }
  });
});
