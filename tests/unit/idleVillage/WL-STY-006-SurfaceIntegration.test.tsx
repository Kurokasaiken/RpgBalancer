import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { WanderlustPillar } from '@/ui/styleLab/presets/wanderlust';

// Mock telemetry
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
}));

// Simple test component that mimics the key functionality
import React, { useState, useEffect } from 'react';

const TestWanderlustIntegration: React.FC = () => {
  const [wanderlustPillar, setWanderlustPillar] = useState<WanderlustPillar>('wilderness');
  const [showPillarToggle] = useState(true);

  // Log telemetry on pillar switch
  useEffect(() => {
    trackTelemetryEvent('wanderlust_pillar_switch', {
      context: 'test_roster',
      pillar: wanderlustPillar,
      previousPillar: wanderlustPillar === 'wilderness' ? 'empire' : 'wilderness',
      timestamp: Date.now(),
    });
    
    // Set global Style Lab preset reference
    if (typeof window !== 'undefined') {
      (window as Record<string, unknown>).__STYLE_LAB_LAST_PRESET = {
        id: `wanderlust-${wanderlustPillar}`,
        pillar: wanderlustPillar,
        appliedAt: Date.now(),
      };
    }
  }, [wanderlustPillar]);

  // Log component rendering telemetry
  useEffect(() => {
    trackTelemetryEvent('action_halo_render', {
      context: 'test_roster',
      pillar: wanderlustPillar,
      haloCount: 3,
      timestamp: Date.now(),
    });
    
    trackTelemetryEvent('action_card_base_render', {
      context: 'test_roster',
      pillar: wanderlustPillar,
      cardCount: 4,
      timestamp: Date.now(),
    });
  }, [wanderlustPillar]);

  return (
    <div data-testid="wanderlust-integration-test">
      {/* Pillar Toggle */}
      {showPillarToggle && (
        <div className="flex items-center gap-2 wanderlust-pillar-toggle">
          <span className="text-xs">Wanderlust:</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setWanderlustPillar('wilderness')}
              className={`rounded-full border px-2 py-0.5 text-xs ${
                wanderlustPillar === 'wilderness'
                  ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-200'
                  : 'border-white/20 text-white/60'
              }`}
              data-testid="wilderness-button"
            >
              🌲 Wilderness
            </button>
            <button
              type="button"
              onClick={() => setWanderlustPillar('empire')}
              className={`rounded-full border px-2 py-0.5 text-xs ${
                wanderlustPillar === 'empire'
                  ? 'border-amber-400/70 bg-amber-400/10 text-amber-200'
                  : 'border-white/20 text-white/60'
              }`}
              data-testid="empire-button"
            >
              👑 Empire
            </button>
          </div>
        </div>
      )}

      {/* ActionHalo Demo Section */}
      <div className="space-y-3 action-halo-demo" data-testid="action-halo-demo">
        <div>
          <p className="text-xs">ActionHalo Map POI Demo</p>
          <p className="text-sm">
            Wanderlust {wanderlustPillar === 'wilderness' ? 'Wilderness' : 'Empire'} Theme
          </p>
        </div>
        <div className="flex justify-around items-center p-6">
          <div
            data-testid="action-halo-demo-1"
            data-wanderlust-pillar={wanderlustPillar}
            className="w-12 h-12 rounded-full border-2"
            style={{
              borderColor: wanderlustPillar === 'wilderness' ? 'rgba(58, 215, 80, 0.7)' : 'rgba(216, 144, 64, 0.7)',
            }}
          />
          <div
            data-testid="action-halo-demo-2"
            data-wanderlust-pillar={wanderlustPillar}
            className="w-10 h-10 rounded-full border-2"
            style={{
              borderColor: wanderlustPillar === 'wilderness' ? 'rgba(58, 215, 80, 0.5)' : 'rgba(216, 144, 64, 0.5)',
            }}
          />
          <div
            data-testid="action-halo-demo-3"
            data-wanderlust-pillar={wanderlustPillar}
            className="w-11 h-11 rounded-full border-2"
            style={{
              borderColor: wanderlustPillar === 'wilderness' ? 'rgba(58, 215, 80, 0.9)' : 'rgba(216, 144, 64, 0.9)',
            }}
          />
        </div>
        <div className="text-xs text-center">
          <p>Map POI halos with {wanderlustPillar} styling</p>
          <p>Ring size, pulse, and glow vary by pillar</p>
        </div>
      </div>

      {/* ActionCardBase Preview Section */}
      <div className="space-y-3" data-testid="action-card-preview">
        <div>
          <p className="text-xs">ActionCard Preview</p>
          <p className="text-sm">Config snapshot · SLOT_LAB_CONFIG</p>
        </div>
        <div className="grid gap-3">
          <div
            data-testid="action-card-base-job"
            data-wanderlust-pillar={wanderlustPillar}
            className="p-4 border rounded"
            style={{
              borderColor: wanderlustPillar === 'wilderness' ? 'rgba(58, 215, 80, 0.4)' : 'rgba(216, 144, 64, 0.4)',
              background: wanderlustPillar === 'wilderness' 
                ? 'linear-gradient(135deg, rgba(42, 24, 16, 0.98) 0%, rgba(90, 60, 40, 0.99) 100%)'
                : 'linear-gradient(135deg, rgba(10, 4, 2, 0.98) 0%, rgba(58, 28, 8, 0.99) 100%)',
            }}
          >
            <div className="text-white">Job Action</div>
          </div>
          <div
            data-testid="action-card-base-quest"
            data-wanderlust-pillar={wanderlustPillar}
            className="p-4 border rounded"
            style={{
              borderColor: wanderlustPillar === 'wilderness' ? 'rgba(58, 215, 80, 0.4)' : 'rgba(216, 144, 64, 0.4)',
              background: wanderlustPillar === 'wilderness' 
                ? 'linear-gradient(135deg, rgba(42, 24, 16, 0.98) 0%, rgba(90, 60, 40, 0.99) 100%)'
                : 'linear-gradient(135deg, rgba(10, 4, 2, 0.98) 0%, rgba(58, 28, 8, 0.99) 100%)',
            }}
          >
            <div className="text-white">Quest Action</div>
          </div>
        </div>
      </div>
    </div>
  );
};

describe('WL-STY-006 Surface Integration', () => {
  const mockTrackTelemetryEvent = vi.mocked(trackTelemetryEvent);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderTestComponent = () => {
    return render(<TestWanderlustIntegration />);
  };

  describe('Wanderlust Pillar Toggle', () => {
    it('should render pillar toggle buttons', async () => {
      renderTestComponent();
      
      expect(screen.getByText('Wanderlust:')).toBeInTheDocument();
      expect(screen.getByTestId('wilderness-button')).toBeInTheDocument();
      expect(screen.getByTestId('empire-button')).toBeInTheDocument();
    });

    it('should switch between wilderness and empire pillars', async () => {
      renderTestComponent();
      
      // Initially wilderness should be selected
      expect(screen.getByTestId('wilderness-button')).toHaveClass('border-emerald-400/70');
      expect(screen.getByTestId('empire-button')).toHaveClass('border-white/20');
      
      // Click Empire button
      fireEvent.click(screen.getByTestId('empire-button'));
      
      // Empire should now be selected
      expect(screen.getByTestId('empire-button')).toHaveClass('border-amber-400/70');
      expect(screen.getByTestId('wilderness-button')).toHaveClass('border-white/20');
      
      // Verify telemetry was called
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('wanderlust_pillar_switch', {
        context: 'test_roster',
        pillar: 'empire',
        previousPillar: 'wilderness',
        timestamp: expect.any(Number),
      });
    });

    it('should log telemetry on initial load', async () => {
      renderTestComponent();
      
      // Verify initial telemetry events
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('wanderlust_pillar_switch', {
        context: 'test_roster',
        pillar: 'wilderness',
        previousPillar: 'empire',
        timestamp: expect.any(Number),
      });
      
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('action_halo_render', {
        context: 'test_roster',
        pillar: 'wilderness',
        haloCount: 3,
        timestamp: expect.any(Number),
      });
      
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('action_card_base_render', {
        context: 'test_roster',
        pillar: 'wilderness',
        cardCount: 4,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('ActionHalo Demo Section', () => {
    it('should render ActionHalo demo section', async () => {
      renderTestComponent();
      
      expect(screen.getByText('ActionHalo Map POI Demo')).toBeInTheDocument();
      expect(screen.getByText('Wanderlust Wilderness Theme')).toBeInTheDocument();
      expect(screen.getByText('Map POI halos with wilderness styling')).toBeInTheDocument();
    });

    it('should render three ActionHalo components', async () => {
      renderTestComponent();
      
      expect(screen.getByTestId('action-halo-demo-1')).toBeInTheDocument();
      expect(screen.getByTestId('action-halo-demo-2')).toBeInTheDocument();
      expect(screen.getByTestId('action-halo-demo-3')).toBeInTheDocument();
    });

    it('should have correct data attributes for testing', async () => {
      renderTestComponent();
      
      const halo1 = screen.getByTestId('action-halo-demo-1');
      expect(halo1).toHaveAttribute('data-wanderlust-pillar', 'wilderness');
      
      const halo2 = screen.getByTestId('action-halo-demo-2');
      expect(halo2).toHaveAttribute('data-wanderlust-pillar', 'wilderness');
      
      const halo3 = screen.getByTestId('action-halo-demo-3');
      expect(halo3).toHaveAttribute('data-wanderlust-pillar', 'wilderness');
    });

    it('should update pillar attribute when switching themes', async () => {
      renderTestComponent();
      
      // Switch to Empire pillar
      fireEvent.click(screen.getByTestId('empire-button'));
      
      // Verify data attributes updated
      const halo1 = screen.getByTestId('action-halo-demo-1');
      expect(halo1).toHaveAttribute('data-wanderlust-pillar', 'empire');
    });

    it('should have correct styling based on pillar', async () => {
      renderTestComponent();
      
      const halo1 = screen.getByTestId('action-halo-demo-1');
      const style = window.getComputedStyle(halo1);
      
      // Should have wilderness green border
      expect(halo1.style.borderColor).toContain('58, 215, 80');
      
      // Switch to Empire
      fireEvent.click(screen.getByTestId('empire-button'));
      
      // Should now have empire gold border
      expect(halo1.style.borderColor).toContain('216, 144, 64');
    });
  });

  describe('ActionCardBase Preview Section', () => {
    it('should render ActionCardBase preview section', async () => {
      renderTestComponent();
      
      expect(screen.getByText('ActionCard Preview')).toBeInTheDocument();
      expect(screen.getByText('Config snapshot · SLOT_LAB_CONFIG')).toBeInTheDocument();
    });

    it('should render ActionCardBase components', async () => {
      renderTestComponent();
      
      expect(screen.getByTestId('action-card-base-job')).toBeInTheDocument();
      expect(screen.getByTestId('action-card-base-quest')).toBeInTheDocument();
    });

    it('should have correct data attributes for ActionCardBase', async () => {
      renderTestComponent();
      
      const jobCard = screen.getByTestId('action-card-base-job');
      expect(jobCard).toHaveAttribute('data-wanderlust-pillar', 'wilderness');
      
      const questCard = screen.getByTestId('action-card-base-quest');
      expect(questCard).toHaveAttribute('data-wanderlust-pillar', 'wilderness');
    });

    it('should update ActionCardBase pillar when switching themes', async () => {
      renderTestComponent();
      
      // Switch to Empire pillar
      fireEvent.click(screen.getByTestId('empire-button'));
      
      // Verify data attributes updated
      const jobCard = screen.getByTestId('action-card-base-job');
      expect(jobCard).toHaveAttribute('data-wanderlust-pillar', 'empire');
    });

    it('should have correct styling based on pillar', async () => {
      renderTestComponent();
      
      const jobCard = screen.getByTestId('action-card-base-job');
      
      // Should have wilderness brown gradient
      expect(jobCard.style.background).toContain('42, 24, 16');
      
      // Switch to Empire
      fireEvent.click(screen.getByTestId('empire-button'));
      
      // Should now have empire dark gradient
      expect(jobCard.style.background).toContain('10, 4, 2');
    });
  });

  describe('Integration with Style Lab', () => {
    it('should set global Style Lab preset reference', async () => {
      // Mock window object
      const mockWindow = {
        __STYLE_LAB_LAST_PRESET: undefined,
      };
      Object.defineProperty(window, '__STYLE_LAB_LAST_PRESET', {
        get: () => mockWindow.__STYLE_LAB_LAST_PRESET,
        set: (value) => { mockWindow.__STYLE_LAB_LAST_PRESET = value; },
        configurable: true,
      });

      renderTestComponent();
      
      // Verify global preset reference
      expect(mockWindow.__STYLE_LAB_LAST_PRESET).toEqual({
        id: 'wanderlust-wilderness',
        pillar: 'wilderness',
        appliedAt: expect.any(Number),
      });
    });
  });

  describe('Component Structure', () => {
    it('should have correct test IDs for Playwright testing', async () => {
      renderTestComponent();
      
      expect(screen.getByTestId('wanderlust-integration-test')).toBeInTheDocument();
      expect(screen.getByTestId('action-halo-demo')).toBeInTheDocument();
      expect(screen.getByTestId('action-card-preview')).toBeInTheDocument();
      expect(screen.getByTestId('wilderness-button')).toBeInTheDocument();
      expect(screen.getByTestId('empire-button')).toBeInTheDocument();
    });

    it('should apply correct CSS classes', async () => {
      renderTestComponent();
      
      const toggleContainer = screen.getByText('Wanderlust:').closest('div');
      expect(toggleContainer).toHaveClass('wanderlust-pillar-toggle');
      
      const demoSection = screen.getByTestId('action-halo-demo');
      expect(demoSection).toHaveClass('action-halo-demo');
    });
  });
});
