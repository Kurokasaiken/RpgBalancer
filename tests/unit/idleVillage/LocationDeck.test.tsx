import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { LocationDeck } from '@/ui/idleVillage/components/LocationDeck';
import { MINIMAL_GAMEPLAY_CONFIG } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { LocationDropState } from '@/ui/idleVillage/map/validators/locationDropValidators';

// Mock telemetry
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

// Mock diagnostics
vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: vi.fn(() => ({
    info: vi.fn(),
  })),
}));

describe('LocationDeck', () => {
  const mockResidents: ResidentState[] = [
    {
      id: 'resident-1',
      name: 'Test Resident',
      fatigue: 50,
      isWorking: false,
      skills: { strength: 10 },
      locationId: null,
      activityId: null,
    },
  ];

  const mockLocationStates: Record<string, LocationDropState> = {
    'gold_mine_slot': 'valid',
    'quest_board_slot': 'idle',
    'market_slot': 'invalid',
  };

  const defaultProps = {
    locations: MINIMAL_GAMEPLAY_CONFIG.locations,
    locationStates: mockLocationStates,
    residents: mockResidents,
    isDayPhase: true,
    draggingResidentId: null,
    testId: 'test-location-deck',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all location cards', () => {
    render(<LocationDeck {...defaultProps} />);

    const deck = screen.getByTestId('test-location-deck');
    expect(deck).toBeInTheDocument();

    // Check that all location cards are rendered
    MINIMAL_GAMEPLAY_CONFIG.locations.forEach((location) => {
      const card = screen.getByTestId(`test-location-deck-card-${location.slotId}`);
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent(location.label);
      expect(card).toHaveTextContent(location.description);
    });
  });

  it('applies correct styling based on dropState', () => {
    render(<LocationDeck {...defaultProps} />);

    // Check gold mine card (valid state)
    const goldMineCard = screen.getByTestId('test-location-deck-card-gold_mine_slot');
    expect(goldMineCard).toHaveStyle({
      border: 'rgba(251,191,36,0.65) 1px solid',
      background: 'rgba(251,191,36,0.12)',
    });
    expect(goldMineCard).toHaveTextContent('Drop Valido');

    // Check quest board card (idle state)
    const questBoardCard = screen.getByTestId('test-location-deck-card-quest_board_slot');
    expect(questBoardCard).toHaveStyle({
      border: 'rgba(255,255,255,0.15) 1px solid',
      background: 'rgba(255,255,255,0.03)',
    });
    expect(questBoardCard).toHaveTextContent('Idle');

    // Check market card (invalid state)
    const marketCard = screen.getByTestId('test-location-deck-card-market_slot');
    expect(marketCard).toHaveStyle({
      border: 'rgba(239,68,68,0.45) 1px solid',
      background: 'rgba(239,68,68,0.12)',
    });
    expect(marketCard).toHaveTextContent('Drop Bloccato');
  });

  it('handles locked state when locationStates has locked', () => {
    const lockedLocationStates = {
      'gold_mine_slot': 'locked',
      'quest_board_slot': 'locked',
      'market_slot': 'locked',
    };
    render(<LocationDeck {...defaultProps} locationStates={lockedLocationStates} isDayPhase={false} />);

    const goldMineCard = screen.getByTestId('test-location-deck-card-gold_mine_slot');
    expect(goldMineCard).toHaveStyle({
      border: 'rgba(148,163,184,0.4) 1px solid',
      background: 'rgba(15,23,42,0.35)',
    });
    expect(goldMineCard).toHaveTextContent('Fase Notte');
  });

  it('renders with default testId when not provided', () => {
    const { testId, ...propsWithoutTestId } = defaultProps;
    render(<LocationDeck {...propsWithoutTestId} />);

    const deck = screen.getByTestId('location-deck');
    expect(deck).toBeInTheDocument();
  });

  it('tracks telemetry events for non-idle states', () => {
    render(<LocationDeck {...defaultProps} draggingResidentId="resident-1" />);

    // Should track for valid and invalid states, but not idle
    expect(trackTelemetryEvent).toHaveBeenCalledWith('location_deck_state_change', expect.objectContaining({
      locationId: expect.any(String),
      slotId: 'gold_mine_slot',
      dropState: 'valid',
      draggingResidentId: 'resident-1',
      isDayPhase: true,
      timestamp: expect.any(Number),
    }));

    expect(trackTelemetryEvent).toHaveBeenCalledWith('location_deck_state_change', expect.objectContaining({
      slotId: 'market_slot',
      dropState: 'invalid',
    }));

    // Should not track for idle state
    expect(trackTelemetryEvent).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ slotId: 'quest_board_slot' })
    );
  });

  it('logs diagnostics for each location card render', () => {
    const mockDiagnostics = { info: vi.fn() };
    createSandboxDiagnostics.mockReturnValue(mockDiagnostics);

    render(<LocationDeck {...defaultProps} />);

    expect(createSandboxDiagnostics).toHaveBeenCalledWith('LocationDeck', 'minimal-gameplay');

    MINIMAL_GAMEPLAY_CONFIG.locations.forEach((location) => {
      expect(mockDiagnostics.info).toHaveBeenCalledWith('location_card_rendered', expect.objectContaining({
        locationId: location.id,
        slotId: location.slotId,
        dropState: mockLocationStates[location.slotId] || 'idle',
        draggingResidentId: null,
        isDayPhase: true,
      }));
    });
  });
});
