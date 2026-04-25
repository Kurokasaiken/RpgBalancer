import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import type { ReactElement } from 'react';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

import { ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
import type { ResidentSlotRackProps } from '@/ui/idleVillage/components/ResidentSlotRack';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';
import type { DropState } from '@/ui/idleVillage/components/ActivitySlot';
import type { SlotActivityState } from '@/ui/idleVillage/slots/types';
import { FeatureFlags } from '@/shared/config/featureFlags';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

const slotSoundsControls = {
  clank: vi.fn(),
  detach: vi.fn(),
  reject: vi.fn(),
  complete: vi.fn(),
  testAll: vi.fn(),
};

vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

vi.mock('@/ui/idleVillage/hooks/useSlotSounds', () => ({
  useSlotSounds: vi.fn(() => slotSoundsControls),
}));

vi.mock('@/ui/idleVillage/hooks/useSensoryAudio', () => ({
  useSensoryAudio: vi.fn(() => vi.fn()),
}));

vi.mock('@/ui/idleVillage/residentName', () => ({
  formatResidentLabel: vi.fn(() => 'Test Resident'),
}));

vi.mock('@/engine/game/idleVillage/residentVisualResolver', () => ({
  getResidentPortraitUrl: vi.fn(() => '/portrait.png'),
}));

const originalSlottedMedalFlag = FeatureFlags.idleVillage.slottedMedalIntegration;

const buildSlot = (overrides: Partial<ResidentSlotViewModel> = {}): ResidentSlotViewModel => ({
  id: 'activity-slot0',
  index: 0,
  label: 'Slot 0',
  assignedResidentId: null,
  assignedResident: undefined,
  dropState: 'idle' as DropState,
  bloomState: 'idle',
  status: 'empty',
  telemetryTags: [],
  isPlaceholder: false,
  statHint: 'Any stat',
  required: false,
  ...overrides,
});

const renderRack = (slot: ResidentSlotViewModel, props: Partial<ResidentSlotRackProps> = {}): ReturnType<typeof render> =>
  render(
    <DndContext>
      <ResidentSlotRack
        slots={[slot]}
        layout="detail"
        {...props}
      />
    </DndContext>,
  );

describe('ResidentSlotRack – SlottedMedal integration', () => {
  beforeEach(() => {
    FeatureFlags.idleVillage.slottedMedalIntegration = true;
    vi.clearAllMocks();
    Object.values(slotSoundsControls).forEach((fn) => fn.mockClear());
  });

  afterAll(() => {
    FeatureFlags.idleVillage.slottedMedalIntegration = originalSlottedMedalFlag;
  });

  describe('slot0 gating', () => {
    it('renders SlottedMedal only for slot0 when feature flag is enabled', () => {
      renderRack(
        buildSlot({ assignedResidentId: 'resident-1', status: 'assigned' }),
      );

      expect(screen.getByTestId('slot-medal-activity-slot0')).toBeInTheDocument();
    });

    it('does not render SlottedMedal when flag disabled or slot id not ending with slot0', () => {
      FeatureFlags.idleVillage.slottedMedalIntegration = false;
      renderRack(
        buildSlot({ assignedResidentId: 'resident-1', status: 'assigned' }),
      );
      expect(screen.queryByTestId('slot-medal-activity-slot0')).not.toBeInTheDocument();

      FeatureFlags.idleVillage.slottedMedalIntegration = true;
      renderRack(
        buildSlot({ id: 'activity-slot1', assignedResidentId: 'resident-1', status: 'assigned' }),
      );
      expect(screen.queryByTestId('slot-medal-activity-slot1')).not.toBeInTheDocument();
    });
  });

  describe('telemetry + sound behavior', () => {
    it('emits drop telemetry and clank when a resident is assigned to slot0', () => {
      const initialSlot = buildSlot();
      const { rerender } = renderRack(initialSlot);

      (trackTelemetryEvent as ReturnType<typeof vi.fn>).mockClear();

      rerender(
        <DndContext>
          <ResidentSlotRack
            slots={[buildSlot({ assignedResidentId: 'resident-1', status: 'assigned' })]}
            layout="detail"
          />
        </DndContext>,
      );

      expect(trackTelemetryEvent).toHaveBeenCalledWith(
        'slot_medal_dropped',
        expect.objectContaining({ slotId: 'activity-slot0', residentId: 'resident-1' }),
      );
      expect(slotSoundsControls.clank).toHaveBeenCalledTimes(1);

      (trackTelemetryEvent as ReturnType<typeof vi.fn>).mockClear();
      slotSoundsControls.clank.mockClear();

      rerender(
        <DndContext>
          <ResidentSlotRack
            slots={[buildSlot({ assignedResidentId: 'resident-1', status: 'assigned' })]}
            layout="detail"
          />
        </DndContext>,
      );

      expect(trackTelemetryEvent).not.toHaveBeenCalled();
      expect(slotSoundsControls.clank).not.toHaveBeenCalled();

      rerender(
        <DndContext>
          <ResidentSlotRack
            slots={[buildSlot({ assignedResidentId: 'resident-2', status: 'assigned' })]}
            layout="detail"
          />
        </DndContext>,
      );

      expect(trackTelemetryEvent).toHaveBeenCalledWith(
        'slot_medal_dropped',
        expect.objectContaining({ slotId: 'activity-slot0', residentId: 'resident-2' }),
      );
    });

    it('emits detach telemetry and sound when clearing slot0 medal', () => {
      const onSlotClear = vi.fn();
      renderRack(
        buildSlot({ assignedResidentId: 'resident-1', status: 'assigned' }),
        { onSlotClear },
      );

      (trackTelemetryEvent as ReturnType<typeof vi.fn>).mockClear();

      fireEvent.click(screen.getByTestId('slot-button-activity-slot0'));

      expect(onSlotClear).toHaveBeenCalledWith('activity-slot0');
      expect(trackTelemetryEvent).toHaveBeenCalledWith(
        'slot_medal_detached',
        expect.objectContaining({ slotId: 'activity-slot0', residentId: 'resident-1' }),
      );
      expect(slotSoundsControls.detach).toHaveBeenCalledTimes(1);
    });

    it('tracks slot activity failure telemetry for slot0 medals', async () => {
      const failedState: SlotActivityState = {
        state: 'failed',
        failureType: 'injury',
        progress: 0.6,
        remainingSeconds: 0,
        isLockedByPhase: false,
      };

      renderRack(
        buildSlot({ assignedResidentId: 'resident-1', status: 'assigned' }),
        {
          getSlotActivityState: () => failedState,
        },
      );

      await waitFor(() => {
        expect(trackTelemetryEvent).toHaveBeenCalledWith(
          'slot_activity_failed',
          expect.objectContaining({ slotId: 'activity-slot0', residentId: 'resident-1', failureType: 'injury' }),
        );
      });
    });
  });
});
