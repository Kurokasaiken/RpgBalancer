import '@testing-library/jest-dom';
import { DndContext } from '@dnd-kit/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';

vi.mock('@/ui/idleVillage/components/DragContextStore', () => ({
  useDragContext: () => ({
    setDragPreviewCenter: vi.fn(),
    magnetTargetCenter: null,
    setDragHomeCenter: vi.fn(),
  }),
}));

vi.mock('@/ui/idleVillage/hooks/useDragPreviewInstrumentation', () => ({
  useDragPreviewInstrumentation: () => ({ measurePreviewCreation: vi.fn().mockResolvedValue(null) }),
}));

describe('CustomDragOverlay portal', () => {
  it('renders the active medallion outside a stage stacking context', () => {
    render(
      <div data-testid="stage-stacking-context" style={{ position: 'fixed', zIndex: 12, transform: 'translateZ(0)' }}>
        <DndContext>
          <CustomDragOverlay
            dragVisualState={{ mode: 'idle' }}
            forcedResidentId="resident-1"
          />
        </DndContext>
      </div>,
    );

    const overlay = document.body.querySelector('[data-dnd-overlay]');
    expect(overlay).toBeInTheDocument();
    expect(overlay?.closest('[data-testid="stage-stacking-context"]')).toBeNull();

    let ancestor: HTMLElement | null = overlay as HTMLElement | null;
    while (ancestor && ancestor !== document.body) ancestor = ancestor.parentElement;
    expect(ancestor).toBe(document.body);
    expect(screen.getByTestId('stage-stacking-context')).toBeInTheDocument();
  });
});
