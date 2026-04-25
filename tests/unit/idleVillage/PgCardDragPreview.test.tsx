/**
 * PgCardDragPreview Unit Tests
 * 
 * Tests the PgCard drag preview component with Style Lab tokens,
 * pillar variants, telemetry, and fallback behavior.
 */

import { render, screen } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { PgCardDragPreview } from '@/ui/idleVillage/components/PgCardDragPreview';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

// Mock telemetry service
vi.mock('@/analytics/telemetry/telemetryProvider');
const mockTrackTelemetryEvent = vi.mocked(trackTelemetryEvent);

// Mock Style Lab hooks
vi.mock('@/ui/styleLab/hooks/useStyleLabTokens');
vi.mock('@/ui/styleLab/utils/pgCardSkinHelpers');

const mockUseStyleLabTokens = vi.hoisted(() => ({
  useStyleLabTokens: vi.fn(),
}));

const mockGetPgCardSkinTokens = vi.hoisted(() => ({
  getPgCardSkinTokens: vi.fn(),
  determinePillarFromContext: vi.fn(),
}));

vi.mock('@/ui/styleLab/hooks/useStyleLabTokens', () => mockUseStyleLabTokens);
vi.mock('@/ui/styleLab/utils/pgCardSkinHelpers', () => mockGetPgCardSkinTokens);

describe('PgCardDragPreview', () => {
  const mockResident: ResidentState = {
    id: 'resident-1',
    displayName: 'Test Resident',
    currentHp: 80,
    fatigue: 0.2,
    statSnapshot: {
      hp: 100,
      strength: 50,
      agility: 40,
      intelligence: 60,
    },
    portraitUrl: 'https://example.com/portrait.jpg',
  };

  const mockStyleLabConfig = {
    name: 'Wanderlust Wilderness',
    pgCardSkin: {
      enabled: true,
      physics: {
        mass: 1.2,
        damping: 0.18,
        stiffness: 200,
      },
      visual: {
        metalGradient: 'linear-gradient(135deg, #2a1810 0%, #5a3c28 50%, #7a5438 100%)',
        gemGradient: 'linear-gradient(120deg, #d8ffd8 0%, #72ee82 40%, #1a7830 100%)',
        shadowDepth: 16,
        glassTint: 'rgba(255,255,255,0.08)',
        patinaOpacity: 0.6,
        rimLightIntensity: 0.26,
        glowIntensity: 0.4,
      },
      audio: {
        pickupCue: 'pickup',
        dropCue: 'drop',
        rejectCue: 'reject',
        volume: 70,
      },
      pillars: {
        wilderness: {
          patinaColor: 'rgba(44,116,66,0.30)',
          rimLightColor: 'rgba(168,200,168,0.26)',
          glowColor: 'rgba(58,215,80,0.40)',
        },
        empire: {
          patinaColor: 'rgba(192,112,40,0.30)',
          rimLightColor: 'rgba(255,238,148,0.26)',
          glowColor: 'rgba(216,144,64,0.32)',
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseStyleLabTokens.useStyleLabTokens.mockReturnValue(mockStyleLabConfig);
    mockGetPgCardSkinTokens.getPgCardSkinTokens.mockReturnValue({
      '--pgcard-metal': mockStyleLabConfig.pgCardSkin.visual.metalGradient,
      '--pgcard-gem': mockStyleLabConfig.pgCardSkin.visual.gemGradient,
      '--pgcard-shadow-depth': '16px',
      '--pgcard-physics-mass': '1.2',
    });
  });

  it('renders with resident data and applies skin tokens', () => {
    render(<PgCardDragPreview resident={mockResident} />);

    const container = document.querySelector('.pgcard-skin-wanderlust');
    expect(container).toHaveClass('pgcard-skin-wanderlust');
    expect(container).toHaveAttribute('data-drag-state', 'drag-overlay');
    expect(container).toHaveAttribute('data-pgcard-skin', 'default');
    expect(container).toHaveAttribute('data-skin-pillar', 'wilderness');
    expect(container).toHaveAttribute('data-style-lab-preset', 'Wanderlust Wilderness');

    // Check portrait is rendered
    const portrait = container.querySelector('.pgcard-portrait-img');
    expect(portrait).toHaveAttribute('src', mockResident.portraitUrl);
    expect(portrait).toHaveAttribute('alt', mockResident.displayName);
  });

  it('renders with initials when no portrait URL', () => {
    const residentWithoutPortrait = {
      ...mockResident,
      portraitUrl: undefined,
    };

    render(<PgCardDragPreview resident={residentWithoutPortrait} />);

    const initials = screen.getByText('T');
    expect(initials).toHaveClass('pgcard-initials');
  });

  it('applies pillar-specific tokens', () => {
    render(<PgCardDragPreview resident={mockResident} pillar="empire" />);

    const container = document.querySelector('.pgcard-skin-wanderlust');
    expect(container).toHaveAttribute('data-skin-pillar', 'empire');
  });

  it('uses provided skin ID', () => {
    render(<PgCardDragPreview resident={mockResident} skinId="custom-skin" />);

    const container = document.querySelector('.pgcard-skin-wanderlust');
    expect(container).toHaveAttribute('data-pgcard-skin', 'custom-skin');
  });

  it('emits telemetry when rendered as drag overlay', () => {
    render(<PgCardDragPreview resident={mockResident} isDragOverlay={true} />);

    expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('pgcard_drag_overlay_rendered', {
      residentId: 'resident-1',
      skinId: 'default',
      pillar: 'wilderness',
      presetId: 'Wanderlust Wilderness',
      timestamp: expect.any(Number),
      metadata: {
        displayName: 'Test Resident',
        hasPortrait: true,
        dragState: 'drag-overlay',
      },
    });
  });

  it('does not emit telemetry when not drag overlay', () => {
    render(<PgCardDragPreview resident={mockResident} isDragOverlay={false} />);

    expect(mockTrackTelemetryEvent).not.toHaveBeenCalled();
  });

  it('renders fallback when no resident data', () => {
    render(<PgCardDragPreview />);

    const container = document.querySelector('.pgcard-skin-wanderlust');
    expect(container).toHaveClass('pgcard-skin-wanderlust');
    expect(container).toHaveAttribute('data-drag-state', 'drag-overlay');

    // Should not have portrait or initials
    expect(container.querySelector('.pgcard-portrait')).not.toBeInTheDocument();
    expect(container.querySelector('.pgcard-initials')).not.toBeInTheDocument();
  });

  it('handles missing Style Lab config gracefully', () => {
    mockUseStyleLabTokens.useStyleLabTokens.mockReturnValue(undefined);

    render(<PgCardDragPreview resident={mockResident} />);

    const container = document.querySelector('.pgcard-skin-wanderlust');
    expect(container).toHaveAttribute('data-style-lab-preset', 'undefined');
  });

  it('applies context-based pillar detection', () => {
    mockGetPgCardSkinTokens.determinePillarFromContext.mockReturnValue('empire');

    render(
      <PgCardDragPreview
        resident={mockResident}
        context={{
          locationType: 'empire-city',
          scenarioType: 'imperial',
        }}
      />
    );

    expect(mockGetPgCardSkinTokens.determinePillarFromContext).toHaveBeenCalledWith({
      locationType: 'empire-city',
      scenarioType: 'imperial',
    });

    const container = document.querySelector('.pgcard-skin-wanderlust');
    expect(container).toHaveAttribute('data-skin-pillar', 'empire');
  });

  it('includes all required skin layers', () => {
    render(<PgCardDragPreview resident={mockResident} />);

    const container = document.querySelector('.pgcard-skin-wanderlust');
    expect(container.querySelector('.pgcard-glass')).toBeInTheDocument();
    expect(container.querySelector('.pgcard-patina')).toBeInTheDocument();
    expect(container.querySelector('.pgcard-gem')).toBeInTheDocument();
  });
});
