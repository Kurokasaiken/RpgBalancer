import { vi } from 'vitest';
import type { ActivityAreaSlot, ActivityAreaProps, ActivityAreaHandlers } from '@/ui/idleVillage/ActivityArea';
import type { ResidentAssignmentCandidate } from '@/ui/idleVillage/components/InlineResidentChips';

/**
 * Factory for creating mock ActivityAreaSlot for testing/stories.
 */
export const createMockActivitySlot = (
  overrides: Partial<ActivityAreaSlot> = {},
): ActivityAreaSlot => ({
  slotId: 'job_punch_training',
  label: 'Punch Training',
  iconName: 'punch',
  assignedWorkerName: null,
  assignedWorkerAvatarUrl: null,
  visualVariant: 'azure',
  mapSlotLabel: 'Foresta',
  progressFraction: 0.5,
  elapsedSeconds: 30,
  totalDurationSeconds: 60,
  canAcceptDrop: true,
  isCycleControl: false,
  ...overrides,
});

/**
 * Factory for creating mock ActivityAreaProps for testing/stories.
 */
export const createActivityAreaProps = (
  overrides: Partial<ActivityAreaProps> = {},
): ActivityAreaProps => {
  const mockHandlers: ActivityAreaHandlers = {
    onWorkerDrop: vi.fn(),
    onInspect: vi.fn(),
    onToggleCycle: vi.fn(),
    onLocationInspect: vi.fn(),
    onLocationDragEnter: vi.fn(),
    onLocationDragLeave: vi.fn(),
    onLocationDrop: vi.fn(),
    onSlotResidentDragEnter: vi.fn(),
    onSlotResidentDragLeave: vi.fn(),
  };

  return {
    slots: [createMockActivitySlot()],
    isDayPhase: true,
    cycleProgressFraction: 0.5,
    cycleElapsedSeconds: 60,
    secondsPerTimeUnit: 1,
    draggingResidentId: null,
    slotDropStates: {},
    locationDropState: 'idle',
    handlers: mockHandlers,
    locationTitle: 'Luogo attivo',
    locationDescription: 'Trascina un residente per aprire gli slot compatibili.',
    selectedSlotId: null,
    highlightSelectedSlot: false,
    residentsCandidates: undefined,
    onAssign: undefined,
    onClose: undefined,
    onInspectResident: undefined,
    onSlotClick: undefined,
    layout: 'board',
    ...overrides,
  };
};

/**
 * Mock candidates for resident picker.
 */
export const mockResidentsCandidates: ResidentAssignmentCandidate[] = [
  {
    id: 'resident_1',
    displayName: 'Alice',
    statusLabel: 'Available',
    fatigue: 0,
    portraitUrl: '/avatars/alice.png',
    compatibility: { score: 1, reason: 'valid' as const, residentId: 'resident_1' },
  },
  {
    id: 'resident_2',
    displayName: 'Bob',
    statusLabel: 'Available',
    fatigue: 0,
    portraitUrl: '/avatars/bob.png',
    compatibility: { score: 0.8, reason: 'valid' as const, residentId: 'resident_2' },
  },
];
