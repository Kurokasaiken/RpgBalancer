import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DayNightPOI from '@/ui/idleVillage/components/minimal/DayNightPOI';
import DayNightPoiSkin from '@/ui/idleVillage/components/minimal/DayNightPoiSkin';
import { useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';

// Mock the hooks
vi.mock('@/store/useMinimalGameplay');
vi.mock('@/ui/styleLab/hooks/useStyleLabTokens');
vi.mock('@/ui/idleVillage/hooks/useSkinPreferences');

describe('DayNightPOI Components', () => {
  const mockGameplayState = {
    state: {
      isDayPhase: true,
      cycleProgress: 0.5,
      isPaused: false,
      currentTime: 10,
      currentDay: 1,
    },
    config: {
      version: '1.0.0',
      loop: {
        tickIntervalMs: 1000,
        autosaveIntervalMs: 30000,
        warmupDelayMs: 1000,
        maxSpeedMultiplier: 3,
        defaultSpeedMultiplier: 1,
      },
      globalRules: {
        baseFoodPriceInGold: 5,
        baseWoodPriceInGold: 3,
        dayLengthInTimeUnits: 5,
        dayNightCycle: {
          dayTimeUnits: 5,
          nightTimeUnits: 5,
        },
        ticksPerDay: 5,
        ticksPerNight: 5,
        secondsPerTimeUnit: 1,
        fatigueRecoveryPerDay: 50,
        fatigueRecoveryPerNightTick: 10,
        fatigueYellowThreshold: 33,
        fatigueRedThreshold: 66,
        rngSeed: 12345,
      },
    },
    pauseGame: vi.fn(),
    resumeGame: vi.fn(),
    resetGame: vi.fn(),
  };

  const mockStyleLabTokens = {
    preset: {} as any,
    cssVars: {},
    modifierScopes: {} as any,
    modifierStatus: {} as any,
    interactionColors: {
      accentPrimary: '#16a34a',
      accentSecondary: '#c8a030',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
    interactionPhysics: {} as any,
    materialFeel: {} as any,
    audioHaptics: {} as any,
    actionCardFrame: {} as any,
    actionHalo: {} as any,
    progressInlay: {} as any,
  };

  const mockSkinPreferences = {
    presetId: 'minimal_frontier',
    pillar: 'wilderness' as const,
    skinConfig: {} as any,
    supportedPillars: ['wilderness', 'empire'] as const,
    availablePresets: [],
    isLoading: false,
    setPreset: vi.fn(),
    setPillar: vi.fn(),
    updateOverrides: vi.fn(),
    resetOverrides: vi.fn(),
    refresh: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useMinimalGameplayWithIdleVillageConfig as any).mockReturnValue(mockGameplayState);
    (useStyleLabTokens as any).mockReturnValue(mockStyleLabTokens);
    (useSkinPreferences as any).mockReturnValue(mockSkinPreferences);
  });

  describe('DayNightPOI', () => {
    it('renders day phase correctly', () => {
      render(<DayNightPOI />);
      
      expect(screen.getByText('Day 1')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();
      expect(screen.getByText('50% · T:10')).toBeInTheDocument();
      expect(screen.getByText('Pause')).toBeInTheDocument();
    });

    it('renders night phase correctly', () => {
      (useMinimalGameplayWithIdleVillageConfig as any).mockReturnValue({
        ...mockGameplayState,
        state: {
          ...mockGameplayState.state,
          isDayPhase: false,
        },
      });

      render(<DayNightPOI />);
      
      expect(screen.getByText('Night 1')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();
      expect(screen.getByText('50% · T:10')).toBeInTheDocument();
      expect(screen.getByText('Pause')).toBeInTheDocument();
    });

    it('renders paused state correctly', () => {
      (useMinimalGameplayWithIdleVillageConfig as any).mockReturnValue({
        ...mockGameplayState,
        state: {
          ...mockGameplayState.state,
          isPaused: true,
        },
      });

      render(<DayNightPOI />);
      
      expect(screen.getByText('Day 1')).toBeInTheDocument();
      expect(screen.getByText('Paused')).toBeInTheDocument();
      expect(screen.getByText('50% · T:10')).toBeInTheDocument();
      expect(screen.getByText('Resume')).toBeInTheDocument();
    });

    it('displays correct progress percentage', () => {
      (useMinimalGameplayWithIdleVillageConfig as any).mockReturnValue({
        ...mockGameplayState,
        state: {
          ...mockGameplayState.state,
          cycleProgress: 0.75,
        },
      });

      render(<DayNightPOI />);
      
      expect(screen.getByText('75% · T:10')).toBeInTheDocument();
    });

    it('calls pauseGame when pause button is clicked', () => {
      render(<DayNightPOI />);
      
      const pauseButton = screen.getByText('Pause');
      pauseButton.click();
      
      expect(mockGameplayState.pauseGame).toHaveBeenCalledWith('user');
    });

    it('calls resumeGame when resume button is clicked', () => {
      (useMinimalGameplayWithIdleVillageConfig as any).mockReturnValue({
        ...mockGameplayState,
        state: {
          ...mockGameplayState.state,
          isPaused: true,
        },
      });

      render(<DayNightPOI />);
      
      const resumeButton = screen.getByText('Resume');
      resumeButton.click();
      
      expect(mockGameplayState.resumeGame).toHaveBeenCalledWith('user');
    });
  });

  describe('DayNightPoiSkin', () => {
    it('renders circle with correct dimensions', () => {
      render(
        <DayNightPoiSkin 
          isDayPhase={true}
          cycleProgress={0.5}
          isPaused={false}
        />
      );

      // Check that the main container exists with correct dimensions
      const container = document.querySelector('[style*="width: 48px"]');
      expect(container).toBeInTheDocument();
      expect(container).toHaveStyle({ width: '48px', height: '48px' });
    });

    it('applies correct colors for day phase', () => {
      render(
        <DayNightPoiSkin 
          isDayPhase={true}
          cycleProgress={0.5}
          isPaused={false}
        />
      );

      // Check that day color is applied
      const mainCircle = document.querySelector('.rounded-full');
      expect(mainCircle).toHaveStyle({
        backgroundColor: '#16a34a', // accentPrimary from mock
        borderColor: '#16a34a',
      });
    });

    it('applies correct colors for night phase', () => {
      render(
        <DayNightPoiSkin 
          isDayPhase={false}
          cycleProgress={0.5}
          isPaused={false}
        />
      );

      // Check that night color is applied
      const mainCircle = document.querySelector('.rounded-full');
      expect(mainCircle).toHaveStyle({
        backgroundColor: '#c8a030', // accentSecondary from mock
        borderColor: '#c8a030',
      });
    });

    it('shows pause indicator when paused', () => {
      render(
        <DayNightPoiSkin 
          isDayPhase={true}
          cycleProgress={0.5}
          isPaused={true}
        />
      );

      // Check for pause indicator
      const pauseIndicator = document.querySelector('[style*="rgba(0, 0, 0, 0.5)"]');
      expect(pauseIndicator).toBeInTheDocument();
      
      const pauseText = screen.getByText('||');
      expect(pauseText).toBeInTheDocument();
    });

    it('does not show pause indicator when running', () => {
      render(
        <DayNightPoiSkin 
          isDayPhase={true}
          cycleProgress={0.5}
          isPaused={false}
        />
      );

      // Check that pause indicator is not present
      const pauseIndicator = document.querySelector('[style*="rgba(0, 0, 0, 0.5)"]');
      expect(pauseIndicator).not.toBeInTheDocument();
    });

    it('applies correct rotation based on progress', () => {
      render(
        <DayNightPoiSkin 
          isDayPhase={true}
          cycleProgress={0.25} // 25% progress = 90 degrees rotation
          isPaused={false}
        />
      );

      // Check that progress ring has correct rotation
      const progressRing = document.querySelector('[style*="rotate"]');
      expect(progressRing).toHaveStyle({ transform: 'rotate(90deg)' });
    });

    it('has correct accessibility attributes', () => {
      render(
        <DayNightPoiSkin 
          isDayPhase={true}
          cycleProgress={0.5}
          isPaused={false}
        />
      );

      // Check for pause button accessibility
      const pauseButton = screen.getByRole('button');
      expect(pauseButton).toBeInTheDocument();
      expect(pauseButton).toHaveAttribute('aria-label');
    });
  });

  describe('Integration', () => {
    it('both components work together correctly', () => {
      const { container } = render(
        <div>
          <DayNightPoiSkin 
            isDayPhase={mockGameplayState.state.isDayPhase}
            cycleProgress={mockGameplayState.state.cycleProgress}
            isPaused={mockGameplayState.state.isPaused}
          />
          <DayNightPOI />
        </div>
      );

      // Verify both components render
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();
      expect(screen.getByText('Day')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });
});
