import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IdleVillagePinballMonitor } from '@/ui/idleVillage/components/IdleVillagePinballMonitor';
import { usePinballMonitor } from '@/ui/altVisuals/hooks/usePinballMonitor';

// Mock the pinball monitor hook
jest.mock('@/ui/altVisuals/hooks/usePinballMonitor');

const mockUsePinballMonitor = usePinballMonitor as jest.MockedFunction<typeof usePinballMonitor>;

const mockPinballMonitorReturn = {
  status: 'monitoring' as const,
  summary: {
    sceneId: 'test-scene',
    lastBallLaunchTs: Date.now() - 5000,
    lastBallStopTs: Date.now() - 1000,
    lastPillarImpactTs: Date.now() - 2000,
    ballActive: true,
    ballStopped: false,
    enemyPillarsLanded: 2,
    playerPillarsLanded: 3,
    totalPillars: 5,
    telemetryContext: { test: true },
  },
  derived: {
    ballRuntimeMs: 5000,
    timeSinceImpactMs: 2000,
    flags: {
      bridgeReady: true,
      ballStuck: false,
      pillarStalled: false,
      awaitingAutoLaunch: false,
    },
  },
  events: [],
  lastEvent: undefined,
  lastScan: Date.now(),
  lastRecovery: undefined,
  config: {
    pollingIntervalMs: 1000,
    ballStuckThresholdMs: 30000,
    autoLaunchGraceMs: 5000,
    pillarStallThresholdMs: 15000,
  },
  scanNow: jest.fn(),
  forceBallRelaunch: jest.fn(),
  forceSceneRelaunch: jest.fn(),
};

describe('IdleVillagePinballMonitor', () => {
  beforeEach(() => {
    mockUsePinballMonitor.mockReturnValue(mockPinballMonitorReturn);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders the monitor when visible', () => {
    render(<IdleVillagePinballMonitor visible={true} />);

    expect(screen.getByText('Alt Visual Monitor')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<IdleVillagePinballMonitor visible={false} />);

    expect(screen.queryByText('Alt Visual Monitor')).not.toBeInTheDocument();
  });

  it('displays pinball stats correctly', () => {
    render(<IdleVillagePinballMonitor visible={true} showStats={true} />);

    expect(screen.getByText('2/5')).toBeInTheDocument(); // enemy pillars
    expect(screen.getByText('3/5')).toBeInTheDocument(); // player pillars
    expect(screen.getByText('Ball Active')).toBeInTheDocument();
    expect(screen.getByText('Runtime: 5s')).toBeInTheDocument();
  });

  it('displays config-generated stats', () => {
    render(<IdleVillagePinballMonitor visible={true} showStats={true} />);

    expect(screen.getByText('Efficiency')).toBeInTheDocument();
    expect(screen.getByText('Responsive')).toBeInTheDocument();
  });

  it('hides stats when showStats is false', () => {
    render(<IdleVillagePinballMonitor visible={true} showStats={false} />);

    expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    expect(screen.queryByText('2/5')).not.toBeInTheDocument();
  });

  it('shows waiting message when no summary data', () => {
    mockUsePinballMonitor.mockReturnValue({
      ...mockPinballMonitorReturn,
      summary: null,
    });

    render(<IdleVillagePinballMonitor visible={true} />);

    expect(screen.getByText('Waiting for pinball data...')).toBeInTheDocument();
  });

  it('displays correct status indicator', () => {
    render(<IdleVillagePinballMonitor visible={true} />);

    // Status should be monitoring (green)
    const statusIndicator = document.querySelector('.bg-emerald-400');
    expect(statusIndicator).toBeInTheDocument();
  });

  it('shows recovery information when available', () => {
    const recoveryTimestamp = Date.now() - 30000; // 30 seconds ago
    mockUsePinballMonitor.mockReturnValue({
      ...mockPinballMonitorReturn,
      lastRecovery: {
        timestamp: recoveryTimestamp,
        reason: 'ball_stuck',
        action: 'relaunch_ball',
      },
    });

    render(<IdleVillagePinballMonitor visible={true} />);

    expect(screen.getByText(/Recovered 30s ago/)).toBeInTheDocument();
  });

  it('expands to show full monitor panel', () => {
    render(<IdleVillagePinballMonitor visible={true} />);

    const header = screen.getByText('Alt Visual Monitor');
    fireEvent.click(header);

    expect(screen.getByText('Idle Village · Alt Visuals Pinball Monitor')).toBeInTheDocument();
  });

  it('triggers auto-launch when bridge is available and status is idle', () => {
    const mockBridge = {
      autoLaunchBall: jest.fn(),
    };
    (window as any).__ALT_VISUALS_PINBALL__ = mockBridge;

    mockUsePinballMonitor.mockReturnValue({
      ...mockPinballMonitorReturn,
      status: 'idle',
    });

    render(<IdleVillagePinballMonitor visible={true} autoLaunch={true} />);

    expect(mockBridge.autoLaunchBall).toHaveBeenCalled();

    delete (window as any).__ALT_VISUALS_PINBALL__;
  });

  it('triggers stuck prevention when ball is stuck', () => {
    mockUsePinballMonitor.mockReturnValue({
      ...mockPinballMonitorReturn,
      derived: {
        ...mockPinballMonitorReturn.derived,
        flags: {
          ...mockPinballMonitorReturn.derived!.flags,
          ballStuck: true,
        },
      },
    });

    render(<IdleVillagePinballMonitor visible={true} />);

    expect(mockPinballMonitorReturn.forceBallRelaunch).toHaveBeenCalledWith('auto_prevention');
  });

  it('triggers scene relaunch when pillars are stalled', () => {
    mockUsePinballMonitor.mockReturnValue({
      ...mockPinballMonitorReturn,
      derived: {
        ...mockPinballMonitorReturn.derived,
        flags: {
          ...mockPinballMonitorReturn.derived!.flags,
          pillarStalled: true,
        },
      },
    });

    render(<IdleVillagePinballMonitor visible={true} />);

    expect(mockPinballMonitorReturn.forceSceneRelaunch).toHaveBeenCalledWith('auto_prevention');
  });

  it('performs health checks for bridge recovery', async () => {
    jest.useFakeTimers();

    const mockBridge = {
      autoLaunchBall: jest.fn(),
    };
    (window as any).__ALT_VISUALS_PINBALL__ = mockBridge;

    mockUsePinballMonitor.mockReturnValue({
      ...mockPinballMonitorReturn,
      status: 'waiting_bridge',
    });

    render(<IdleVillagePinballMonitor visible={true} autoLaunch={true} />);

    // Fast-forward 5 seconds
    jest.advanceTimersByTime(5000);

    expect(mockBridge.autoLaunchBall).toHaveBeenCalled();

    jest.useRealTimers();
    delete (window as any).__ALT_VISUALS_PINBALL__;
  });

  it('applies custom className', () => {
    const { container } = render(
      <IdleVillagePinballMonitor visible={true} className="custom-test-class" />
    );

    expect(container.firstChild).toHaveClass('custom-test-class');
  });

  it('uses custom title', () => {
    render(<IdleVillagePinballMonitor visible={true} title="Custom Monitor Title" />);

    expect(screen.getByText('Custom Monitor Title')).toBeInTheDocument();
  });

  it('calculates progress percentage correctly', () => {
    render(<IdleVillagePinballMonitor visible={true} />);

    // (2 + 3) / (5 * 2) = 5/10 = 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('displays inactive ball status correctly', () => {
    mockUsePinballMonitor.mockReturnValue({
      ...mockPinballMonitorReturn,
      summary: {
        ...mockPinballMonitorReturn.summary!,
        ballActive: false,
      },
    });

    render(<IdleVillagePinballMonitor visible={true} />);

    expect(screen.getByText('Ball Inactive')).toBeInTheDocument();
  });

  it('handles zero total pillars gracefully', () => {
    mockUsePinballMonitor.mockReturnValue({
      ...mockPinballMonitorReturn,
      summary: {
        ...mockPinballMonitorReturn.summary!,
        totalPillars: 0,
      },
    });

    render(<IdleVillagePinballMonitor visible={true} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('logs console messages for auto-launch and recovery', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    mockUsePinballMonitor.mockReturnValue({
      ...mockPinballMonitorReturn,
      status: 'idle',
      derived: {
        ...mockPinballMonitorReturn.derived,
        flags: {
          ...mockPinballMonitorReturn.derived!.flags,
          ballStuck: true,
        },
      },
    });

    const mockBridge = {
      autoLaunchBall: jest.fn(),
    };
    (window as any).__ALT_VISUALS_PINBALL__ = mockBridge;

    render(<IdleVillagePinballMonitor visible={true} autoLaunch={true} />);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[IdleVillagePinballMonitor] Auto-launching ball')
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[IdleVillagePinballMonitor] Ball stuck detected')
    );

    consoleSpy.mockRestore();
    delete (window as any).__ALT_VISUALS_PINBALL__;
  });
});
