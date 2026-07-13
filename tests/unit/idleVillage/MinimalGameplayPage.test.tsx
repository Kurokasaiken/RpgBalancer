import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MinimalGameplayPage from '@/ui/idleVillage/MinimalGameplayPage';

const mockGameplayState = {
  state: {
    gold: 100,
    food: 50,
    maxFood: 100,
    currentDay: 1,
    currentTick: 1,
    cycleProgress: 0.5,
    isPaused: false,
    isDayPhase: true,
    speedMultiplier: 1,
    tickIntervalMs: 1000,
  },
  config: {
    loop: {
      defaultSpeedMultiplier: 1,
      maxSpeedMultiplier: 4,
      warmupDelayMs: 0,
    },
  },
  setSpeedMultiplier: vi.fn(),
  resumeGame: vi.fn(),
  pauseGame: vi.fn(),
  resetGame: vi.fn(),
  startActivity: vi.fn(),
};

vi.mock('@/store/useMinimalGameplay', () => ({
  useMinimalGameplayWithIdleVillageConfig: () => mockGameplayState,
}));

vi.mock('@/ui/idleVillage/hooks/useVillageResidents', () => ({
  useVillageResidents: () => ({ residents: [] }),
}));

vi.mock('@/balancing/hooks/useIdleVillageConfig', () => ({
  useIdleVillageConfig: () => ({
    config: {
      resources: {
        gold: { id: 'gold', label: 'Gold', icon: '🪙', colorClass: 'text-amber-200' },
        food: { id: 'food', label: 'Food', icon: '🍞', colorClass: 'text-emerald-200' },
      },
      activities: {},
    },
  }),
}));

vi.mock('@/hooks/useThemeSwitcher', () => ({
  useThemeSwitcher: () => ({
    activePreset: 'default',
    presets: [],
    isRandomized: false,
    setPreset: vi.fn(),
    randomizeTheme: vi.fn(),
    resetRandomization: vi.fn(),
  }),
}));

vi.mock('@/ui/styleLab/hooks/useStyleLabTokens', () => ({
  useStyleLabTokens: () => ({
    modifierScopes: { SESSION: { border: '#ffffff' } },
    meta: { pillar: 'frontier', presetId: 'minimal_frontier' },
    pgCardSkin: { enabled: false },
    materialFeel: { frameTreatment: 'standard' },
    cssVars: {},
  }),
}));

vi.mock('@/ui/idleVillage/hooks/useCentralizedTiming', () => ({
  useCentralizedTiming: () => undefined,
}));

vi.mock('@/ui/idleVillage/hooks/useResidentDropValidation', () => ({
  useResidentDropValidation: () => ({ validateDrop: vi.fn(() => ({ isValid: true })) }),
}));

vi.mock('@/ui/idleVillage/slots/useResidentSlotController', () => ({
  useResidentSlotController: () => ({ slots: [] }),
}));

vi.mock('@/ui/idleVillage/components/DragContext', () => ({
  DragProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDragContext: () => ({ activeId: null, setActiveId: vi.fn() }),
}));

vi.mock('@/ui/styleLab/StyleLaboratoryPanel', () => ({
  StyleLaboratoryPanel: () => <div data-testid="style-lab-panel">Style Lab</div>,
}));

vi.mock('@/ui/idleVillage/frozen/kits/clockKit', () => ({
  ClockWidget: () => <div data-testid="clock-widget">Clock</div>,
}));

vi.mock('@/ui/idleVillage/frozen/kits/poiKit', () => ({
  DayNightPOI: () => <div data-testid="day-night-poi">Day/Night</div>,
}));

vi.mock('@/ui/idleVillage/roster', () => ({
  VillageRosterSection: () => <div data-testid="village-roster">Roster</div>,
}));

vi.mock('@/ui/idleVillage/components/ResidentSlotRack', () => ({
  ResidentSlotRack: () => <div data-testid="resident-slot-rack">Slot Rack</div>,
}));

vi.mock('@/ui/idleVillage/components/CustomDragOverlay', () => ({
  CustomDragOverlay: () => null,
}));

vi.mock('@/ui/styleLab/physics/DragPhysicsContext', () => ({
  DragPhysicsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/ui/idleVillage/components/TooltipProvider', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderPage() {
  return render(<MinimalGameplayPage />);
}

describe('MinimalGameplayPage I18N-003c', () => {
  it('renders localized FTUE headings and labels', () => {
    renderPage();
    expect(screen.getByText(/Time Engine/)).toBeInTheDocument();
    expect(screen.getAllByText('Resources')).toHaveLength(2);
    expect(screen.getAllByText('Roster')).toHaveLength(2);
    expect(screen.getByText(/Available Activities/)).toBeInTheDocument();
    expect(screen.getByText(/SlottedMetal \(Placeholder\)/)).toBeInTheDocument();
    expect(screen.getByText(/SlottedMetal component/)).toBeInTheDocument();
  });

  it('renders localized resource labels and phase info', () => {
    renderPage();
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Day:')).toBeInTheDocument();
    expect(screen.getByText('Tick:')).toBeInTheDocument();
    expect(screen.getByText('Cycle Progress:')).toBeInTheDocument();
  });
});
