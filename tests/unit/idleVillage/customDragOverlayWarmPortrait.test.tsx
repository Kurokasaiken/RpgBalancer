// INV:custom-drag-overlay.INV-2
import '@testing-library/jest-dom';
import { DndContext } from '@dnd-kit/core';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMedalPortraitUrl } from '@/balancing/config/idleVillage/medalPortraitAssets';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';
import { getDragConfig } from '@/ui/idleVillage/config/dragConfig';

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

const FIRST_RESIDENT: ResidentState = {
  id: 'sir-spaccaculi',
  displayName: 'Sir Spaccaculi',
  visualProfileId: 'sir-spaccaculi',
  status: 'available',
  fatigue: 0,
  currentHp: 100,
  maxHp: 100,
  isHero: false,
  isInjured: false,
  survivalCount: 0,
  survivalScore: 0,
};
const DRAGGED_RESIDENT: ResidentState = {
  ...FIRST_RESIDENT,
  id: 'giggiolillo',
  displayName: 'Giggiolillo',
  visualProfileId: 'giggiolillo',
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('R-359 — the warm drag medallion shows the dragged resident', () => {
  it.each(['movement', 'hold'] as const)('replaces the first resident portrait on %s activation', (activation) => {
    render(
      <DndContext>
        <div data-testid="drag-card" data-resident-id={DRAGGED_RESIDENT.id} />
        <CustomDragOverlay
          dragVisualState={{ mode: 'idle' }}
          usePgCardPreview
          residentsById={{
            [FIRST_RESIDENT.id]: FIRST_RESIDENT,
            [DRAGGED_RESIDENT.id]: DRAGGED_RESIDENT,
          }}
        />
      </DndContext>,
    );
    const firstMedalUrl = getMedalPortraitUrl(getResidentPortraitUrl(FIRST_RESIDENT));
    const draggedMedalUrl = getMedalPortraitUrl(getResidentPortraitUrl(DRAGGED_RESIDENT));
    const warmNode = document.body.querySelector<HTMLElement>('[data-drag-warm-mount="true"]');
    const portrait = warmNode?.querySelector<HTMLImageElement>('img:not([src*="ring.webp"])');

    expect(draggedMedalUrl).not.toBe(firstMedalUrl);
    expect(warmNode).toHaveStyle({ visibility: 'hidden' });
    expect(portrait).toHaveAttribute('src', firstMedalUrl);

    // Like the existing pointer tests, use MouseEvent with a pointer event type
    // so client coordinates reach the window listeners even without PointerEvent in jsdom.
    fireEvent(screen.getByTestId('drag-card'), new MouseEvent('pointerdown', {
      bubbles: true,
      clientX: 40,
      clientY: 40,
    }));
    if (activation === 'movement') {
      fireEvent(window, new MouseEvent('pointermove', {
        bubbles: true,
        clientX: 40 + getDragConfig().thresholds.minDragDistance + 1,
        clientY: 40,
      }));
    } else {
      act(() => {
        vi.advanceTimersByTime(getDragConfig().timing.holdToDragMs);
      });
    }

    expect(warmNode).toHaveStyle({ visibility: 'visible' });
    expect(warmNode).toHaveAttribute('data-drag-preview', 'true');
    expect(warmNode).toHaveAttribute('data-debug-active-id', DRAGGED_RESIDENT.id);
    expect(portrait?.src).toBe(new URL(draggedMedalUrl, document.baseURI).href);
    expect(portrait?.src).not.toBe(new URL(firstMedalUrl, document.baseURI).href);
  });
});
