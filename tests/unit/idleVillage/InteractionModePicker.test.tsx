/**
 * Interaction Mode Picker Tests
 * 
 * Unit tests for the Interaction Mode Picker component and related hooks.
 * Tests UI rendering, state management, and store integration.
 * 
 * @since NP-062 – Idle Village Interaction Mode Picker
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractionModePicker, CompactInteractionModePicker, InteractionModeStatus } from '@/ui/idleVillage/components/InteractionModePicker';
import { useInteractionModeStore } from '@/ui/idleVillage/hooks/useInteractionModeStore';
import type { InteractionMode } from '@/ui/idleVillage/hooks/useSandboxInteractionMode';

// Mock the store
vi.mock('@/ui/idleVillage/hooks/useInteractionModeStore');

describe('InteractionModePicker', () => {
  const mockSetPreferredMode = vi.fn();
  const mockSetAutoDetect = vi.fn();
  const mockToggleMode = vi.fn();
  const mockGetModeSummary = vi.fn();

  const mockPreference = {
    preferredMode: 'desktop' as InteractionMode,
    autoDetect: true,
    lastUpdated: Date.now(),
    sessionStats: {
      totalSessions: 10,
      desktopSessions: 7,
      mobileSessions: 3,
      averageSessionDuration: 120,
    },
    uiPreferences: {
      showModeSwitcher: true,
      enableHapticFeedback: true,
      animationSpeedMultiplier: 1.0,
      touchTargetSizeMultiplier: 1.0,
    },
  };

  const mockStore = {
    preference: mockPreference,
    setPreferredMode: mockSetPreferredMode,
    setAutoDetect: mockSetAutoDetect,
    updateSessionStats: vi.fn(),
    updateUIPreferences: vi.fn(),
    getEffectiveMode: vi.fn(() => 'desktop'),
    getCurrentMode: vi.fn(() => 'desktop'),
    isMobilePreferred: vi.fn(() => false),
    getSessionStats: vi.fn(() => mockPreference.sessionStats),
    validatePreference: vi.fn(() => true),
    resetPreferences: vi.fn(),
    toggleMode: mockToggleMode,
    getModeSummary: mockGetModeSummary.mockReturnValue({
      preferredMode: 'desktop',
      autoDetect: true,
      totalSessions: 10,
      mobileSessionRatio: 30,
      averageSessionDuration: 120,
      lastUpdated: Date.now(),
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useInteractionModeStore as any).mockReturnValue(mockStore);
  });

  it('renders mode picker with desktop mode', () => {
    render(<InteractionModePicker />);
    
    expect(screen.getByText('desktop')).toBeInTheDocument();
    expect(screen.getByTitle('Switch to mobile mode')).toBeInTheDocument();
  });

  it('renders mode picker with mobile mode', () => {
    mockStore.preference.preferredMode = 'mobile';
    render(<InteractionModePicker />);
    
    expect(screen.getByText('mobile')).toBeInTheDocument();
    expect(screen.getByTitle('Switch to desktop mode')).toBeInTheDocument();
  });

  it('calls toggleMode when button is clicked', async () => {
    render(<InteractionModePicker />);
    
    const button = screen.getByTitle('Switch to mobile mode');
    fireEvent.click(button);
    
    expect(mockToggleMode).toHaveBeenCalledTimes(1);
  });

  it('calls onModeChange callback when mode changes', () => {
    const onModeChange = vi.fn();
    render(<InteractionModePicker onModeChange={onModeChange} />);
    
    const button = screen.getByTitle('Switch to mobile mode');
    fireEvent.click(button);
    
    expect(onModeChange).toHaveBeenCalledWith('mobile');
  });

  it('renders auto-detect toggle', () => {
    render(<InteractionModePicker />);
    
    expect(screen.getByText('Auto-detect')).toBeInTheDocument();
    expect(screen.getByTitle('Auto-detect is enabled')).toBeInTheDocument();
  });

  it('calls setAutoDetect when auto-detect toggle is clicked', () => {
    render(<InteractionModePicker />);
    
    const autoDetectButton = screen.getByTitle('Auto-detect is enabled');
    fireEvent.click(autoDetectButton);
    
    expect(mockSetAutoDetect).toHaveBeenCalledWith(false);
  });

  it('renders session stats when available', () => {
    render(<InteractionModePicker />);
    
    expect(screen.getByText('10 sessions')).toBeInTheDocument();
  });

  it('does not render when showModeSwitcher is false', () => {
    render(<InteractionModePicker showModeSwitcher={false} />);
    
    expect(screen.queryByText('desktop')).not.toBeInTheDocument();
  });

  it('does not render when uiPreferences.showModeSwitcher is false', () => {
    mockStore.preference.uiPreferences.showModeSwitcher = false;
    render(<InteractionModePicker />);
    
    expect(screen.queryByText('desktop')).not.toBeInTheDocument();
  });

  it('renders compact version', () => {
    render(<CompactInteractionModePicker />);
    
    expect(screen.getByTitle('Switch to mobile mode')).toBeInTheDocument();
    expect(screen.queryByText('Auto-detect')).not.toBeInTheDocument();
    expect(screen.queryByText('10 sessions')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<InteractionModePicker className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('InteractionModeStatus', () => {
  const mockGetModeSummary = vi.fn();

  const mockStore = {
    preference: {
      preferredMode: 'desktop' as InteractionMode,
      autoDetect: true,
      lastUpdated: Date.now(),
      sessionStats: {
        totalSessions: 5,
        desktopSessions: 3,
        mobileSessions: 2,
        averageSessionDuration: 90,
      },
      uiPreferences: {
        showModeSwitcher: true,
        enableHapticFeedback: true,
        animationSpeedMultiplier: 1.0,
        touchTargetSizeMultiplier: 1.0,
      },
    },
    setPreferredMode: vi.fn(),
    setAutoDetect: vi.fn(),
    updateSessionStats: vi.fn(),
    updateUIPreferences: vi.fn(),
    getEffectiveMode: vi.fn(() => 'desktop'),
    getCurrentMode: vi.fn(() => 'desktop'),
    isMobilePreferred: vi.fn(() => false),
    getSessionStats: vi.fn(() => mockStore.preference.sessionStats),
    validatePreference: vi.fn(() => true),
    resetPreferences: vi.fn(),
    toggleMode: vi.fn(),
    getModeSummary: mockGetModeSummary.mockReturnValue({
      preferredMode: 'desktop',
      autoDetect: true,
      totalSessions: 5,
      mobileSessionRatio: 40,
      averageSessionDuration: 90,
      lastUpdated: Date.now(),
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useInteractionModeStore as any).mockReturnValue(mockStore);
  });

  it('renders status with desktop mode', () => {
    render(<InteractionModeStatus />);
    
    expect(screen.getByText('desktop')).toBeInTheDocument();
    expect(screen.getByText('auto')).toBeInTheDocument();
  });

  it('renders status with mobile mode', () => {
    mockStore.preference.preferredMode = 'mobile';
    render(<InteractionModeStatus />);
    
    expect(screen.getByText('mobile')).toBeInTheDocument();
    expect(screen.getByText('auto')).toBeInTheDocument();
  });

  it('renders without auto indicator when autoDetect is false', () => {
    mockStore.preference.autoDetect = false;
    render(<InteractionModeStatus />);
    
    expect(screen.getByText('desktop')).toBeInTheDocument();
    expect(screen.queryByText('auto')).not.toBeInTheDocument();
  });

  it('renders session stats when showStats is true', () => {
    render(<InteractionModeStatus showStats={true} />);
    
    expect(screen.getByText('(5)')).toBeInTheDocument();
  });

  it('does not render session stats when showStats is false', () => {
    render(<InteractionModeStatus showStats={false} />);
    
    expect(screen.queryByText('(5)')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<InteractionModeStatus className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('useInteractionModeStore integration', () => {
  it('should initialize with default preferences', () => {
    const { result } = renderHook(() => useInteractionModeStore());
    
    expect(result.current.preference.preferredMode).toBe('desktop');
    expect(result.current.preference.autoDetect).toBe(true);
    expect(result.current.preference.sessionStats.totalSessions).toBe(0);
  });

  it('should update preferred mode', () => {
    const { result } = renderHook(() => useInteractionModeStore());
    
    act(() => {
      result.current.setPreferredMode('mobile');
    });
    
    expect(result.current.preference.preferredMode).toBe('mobile');
  });

  it('should toggle auto-detect', () => {
    const { result } = renderHook(() => useInteractionModeStore());
    
    act(() => {
      result.current.setAutoDetect(false);
    });
    
    expect(result.current.preference.autoDetect).toBe(false);
  });

  it('should update session stats', () => {
    const { result } = renderHook(() => useInteractionModeStore());
    
    act(() => {
      result.current.updateSessionStats('mobile', 300);
    });
    
    expect(result.current.preference.sessionStats.totalSessions).toBe(1);
    expect(result.current.preference.sessionStats.mobileSessions).toBe(1);
    expect(result.current.preference.sessionStats.averageSessionDuration).toBe(300);
  });

  it('should update UI preferences', () => {
    const { result } = renderHook(() => useInteractionModeStore());
    
    act(() => {
      result.current.updateUIPreferences({
        showModeSwitcher: false,
        enableHapticFeedback: false,
      });
    });
    
    expect(result.current.preference.uiPreferences.showModeSwitcher).toBe(false);
    expect(result.current.preference.uiPreferences.enableHapticFeedback).toBe(false);
  });

  it('should reset preferences', () => {
    const { result } = renderHook(() => useInteractionModeStore());
    
    // Change some values first
    act(() => {
      result.current.setPreferredMode('mobile');
      result.current.setAutoDetect(false);
    });
    
    // Reset
    act(() => {
      result.current.resetPreferences();
    });
    
    expect(result.current.preference.preferredMode).toBe('desktop');
    expect(result.current.preference.autoDetect).toBe(true);
  });
});

// Helper function for testing hooks
function renderHook<T>(hook: () => T): { result: { current: T } } {
  const result = { current: hook() };
  return { result };
}

function act(callback: () => void): void {
  callback();
}
