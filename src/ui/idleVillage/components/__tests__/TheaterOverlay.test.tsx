import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TheaterOverlay from '../TheaterOverlay';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import type { TheaterRiskStripeMetrics } from '@/ui/idleVillage/theater/riskStripes';

const mockPrimarySlot: ActivitySlotData = {
  slotId: 'job-lumberyard',
  label: 'Lumberyard',
  iconName: '🪵',
  assignedWorkerId: null,
  activity: {
    id: 'job-lumberyard',
    label: 'Lumberyard',
    tags: ['job'],
    slotTags: ['village_job'],
    resolutionEngineId: 'job',
  },
  mapSlotLabel: 'North Woods',
  visualVariant: 'jade',
};

const mockVerb: VerbSummary = {
  key: 'verb-job-lumberyard',
  source: 'system',
  activityId: 'job-lumberyard',
  slotId: 'job-lumberyard',
  label: 'Harvest Timber',
  kindLabel: 'Job',
  isQuest: false,
  isJob: true,
  icon: '🪵',
  visualVariant: 'jade',
  progressStyle: 'border',
  progressFraction: 0.2,
  elapsedSeconds: 12,
  totalDurationSeconds: 60,
  remainingSeconds: 48,
  injuryPercentage: 5,
  deathPercentage: 1,
  assignedCount: 0,
  totalSlots: 1,
  rewardLabel: 'Timber',
  tone: 'job',
  deadlineLabel: null,
  assigneeNames: [],
};

describe('TheaterOverlay', () => {
  let originalRequestAnimationFrame: typeof globalThis.requestAnimationFrame;
  let originalCancelAnimationFrame: typeof globalThis.cancelAnimationFrame;

  beforeAll(() => {
    originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    let frameCounter = 0;
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      frameCounter += 1;
      cb(0);
      return frameCounter;
    };
    globalThis.cancelAnimationFrame = vi.fn();
  });

  afterAll(() => {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
    cleanup();
  });

  it('does not render anything when closed', () => {
    render(
      <TheaterOverlay
        isOpen={false}
        theaterPrimarySlot={mockPrimarySlot}
        theaterVerbs={[mockVerb]}
        draggingResidentId={null}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('theater-overlay')).toBeNull();
  });

  it('renders overlay and calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <TheaterOverlay
        isOpen
        theaterPrimarySlot={mockPrimarySlot}
        theaterVerbs={[mockVerb]}
        draggingResidentId={null}
        onClose={onClose}
      />,
    );

    const overlay = screen.getByTestId('theater-overlay');
    expect(overlay).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /chiudi theater overlay/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('invokes onResidentDrop when a resident token is dropped', () => {
    const onResidentDrop = vi.fn();
    render(
      <TheaterOverlay
        isOpen
        theaterPrimarySlot={mockPrimarySlot}
        theaterVerbs={[mockVerb]}
        draggingResidentId="resident-42"
        acceptResidentDrop
        onClose={vi.fn()}
        onResidentDrop={onResidentDrop}
      />,
    );

    const overlay = screen.getByTestId('theater-overlay');
    const dataTransfer = {
      getData: vi.fn(() => 'resident-42'),
      setData: vi.fn(),
      dropEffect: 'copy',
      effectAllowed: 'all',
    };

    fireEvent.dragEnter(overlay, { dataTransfer });
    fireEvent.drop(overlay, { dataTransfer });

    expect(onResidentDrop).toHaveBeenCalledWith('resident-42');
  });

  it('renders risk stripe data attributes derived from riskStripeMetrics when provided', () => {
    const customRiskMetrics: TheaterRiskStripeMetrics = {
      injuryPercent: 58,
      deathPercent: 24,
      injuryOnlyHeight: 34,
      safeHeight: 42,
      hasRisk: true,
      style: {
        background: 'linear-gradient(to top, rgba(239,68,68,0.95), rgba(252,211,77,0.95))',
        boxShadow: '0 0 10px rgba(251,191,36,0.35)',
      },
      segments: {
        deathHeightPercent: 24,
        injuryHeightPercent: 34,
        safeHeightPercent: 42,
      },
    };
    render(
      <TheaterOverlay
        isOpen
        theaterPrimarySlot={mockPrimarySlot}
        theaterVerbs={[
          {
            ...mockVerb,
            injuryPercentage: 10,
            deathPercentage: 4,
            riskStripeMetrics: customRiskMetrics,
          },
        ]}
        draggingResidentId={null}
        onClose={vi.fn()}
      />,
    );

    const riskStripe = screen.getAllByTestId('activity-risk-stripe')[0];
    expect(riskStripe).toBeInTheDocument();
    expect(riskStripe.getAttribute('data-injury-percent')).toBe('58');
    expect(riskStripe.getAttribute('data-death-percent')).toBe('24');
    expect(riskStripe.getAttribute('data-has-risk')).toBe('true');
  });
});
