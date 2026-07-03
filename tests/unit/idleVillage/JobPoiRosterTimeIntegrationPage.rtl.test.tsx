/**
 * RTL tests for JobPoiRosterTimeIntegrationPage.
 *
 * Verifies the page wires the certified components together and that rewards
 * are REAL (produced by the store's config-driven tick(), not simulated):
 * - StatusHUD + TimeEngineStrip render
 * - Clicking a roster resident assigns them to the job (startActivity)
 * - Advancing time completes the job and surfaces a real reward-log entry
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { DEFAULT_MINIMAL_CONFIG } from '@/balancing/config/idleVillage/minimalConfig';

// Use the hand-authored minimal config (short durationTicks) for both the hook
// and the store, so a job can complete within a few manual steps. The real
// transformation maps durationFormula(ms) → large durationTicks, impractical here.
vi.mock('@/balancing/config/idleVillage/transformations', () => ({
  transformIdleVillageToMinimalConfig: () => DEFAULT_MINIMAL_CONFIG,
}));

// jsdom polyfills required by the certified visual components (roster/HUD/skins).
class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
(globalThis as Record<string, unknown>).IntersectionObserver = MockObserver;
(globalThis as Record<string, unknown>).ResizeObserver = MockObserver;
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}
window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined) as unknown as typeof window.HTMLMediaElement.prototype.play;
window.HTMLMediaElement.prototype.pause = vi.fn() as unknown as typeof window.HTMLMediaElement.prototype.pause;

// Force the idle-village config hook to be initialized with the real default config
// so the minimal hook transforms it into a config with real activities.
vi.mock('@/balancing/hooks/useIdleVillageConfig', () => ({
  useIdleVillageConfig: () => ({
    config: DEFAULT_IDLE_VILLAGE_CONFIG,
    history: [],
    initialized: true,
    isInitializing: false,
    initializeConfig: vi.fn(),
    saveConfig: vi.fn(),
    undo: vi.fn(),
    canUndo: false,
    exportConfig: vi.fn(),
    importConfig: vi.fn(),
    resetConfig: vi.fn(),
    resetToInitialConfig: vi.fn(),
    updateConfig: vi.fn(),
  }),
}));

vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
  traceMinimalGameplay: vi.fn(),
}));

import { JobPoiRosterTimeIntegrationPage } from '@/ui/idleVillage/pages/JobPoiRosterTimeIntegrationPage';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';

const MINIMAL_CONFIG = DEFAULT_MINIMAL_CONFIG;
const JOBS = MINIMAL_CONFIG.activities.filter((a) => a.type === 'job');
// Mirror the page: it selects the shortest-duration job.
const JOB = JOBS.reduce((shortest, current) =>
  current.durationTicks < shortest.durationTicks ? current : shortest
);

function resetStore() {
  const base = useMinimalGameplayStore.getState();
  useMinimalGameplayStore.setState({
    ...base,
    config: MINIMAL_CONFIG,
    state: {
      ...base.state,
      gold: 100,
      food: 50,
      maxFood: 50,
      wood: 0,
      xp: 0,
      currentDay: 0,
      currentTick: 0,
      isPaused: true,
      speedMultiplier: 1,
      residents: [
        {
          id: 'hero-1',
          name: 'Aurora',
          stats: { strength: 10, perception: 10, wisdom: 10, charisma: 10, endurance: 10, agility: 10, intelligence: 10 },
          fatigue: 0,
          isWorking: false,
          isInjured: false,
          level: 5,
        },
      ],
      activeActivities: [],
      eventLog: [],
    },
  });
}

describe('JobPoiRosterTimeIntegrationPage', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders the StatusHUD and TimeEngineStrip', () => {
    render(<JobPoiRosterTimeIntegrationPage />);
    expect(screen.getByTestId('status-hud')).toBeTruthy();
    expect(screen.getByTestId('time-engine-strip-compact')).toBeTruthy();
  });

  it('renders the roster with the resident', () => {
    render(<JobPoiRosterTimeIntegrationPage />);
    expect(screen.getByTestId('village-roster-section')).toBeTruthy();
    expect(screen.getByText(/Aurora/)).toBeTruthy();
  });

  it('shows no rewards before any activity completes', () => {
    render(<JobPoiRosterTimeIntegrationPage />);
    const log = screen.getByTestId('reward-log');
    expect(within(log).queryAllByTestId('reward-entry')).toHaveLength(0);
  });

  it('assigns a resident on click and produces a REAL reward after advancing time', async () => {
    const { container } = render(<JobPoiRosterTimeIntegrationPage />);

    const card = container.querySelector('[data-testid*="pg-card"]') as HTMLElement | null;
    expect(card).toBeTruthy();
    fireEvent.click(card!);

    // Assignment registered in the store via the canonical onResidentSelect callback.
    await waitFor(() => {
      expect(useMinimalGameplayStore.getState().state.activeActivities).toHaveLength(1);
    });

    const advance = screen.getByTestId('advance-time-button');
    for (let i = 0; i < JOB.durationTicks; i += 1) {
      fireEvent.click(advance);
    }

    // Real reward applied by the engine (config baseReward), visible in the log + HUD.
    await waitFor(() => {
      const log = screen.getByTestId('reward-log');
      expect(within(log).queryAllByTestId('reward-entry').length).toBeGreaterThan(0);
    });
    expect(useMinimalGameplayStore.getState().state.wood).toBe(JOB.baseReward.wood);
  });
});
