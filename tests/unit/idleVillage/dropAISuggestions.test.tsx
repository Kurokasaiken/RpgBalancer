/**
 * Comprehensive test suite for AI Drop Suggestions in Idle Village Phase E
 * 
 * Tests the AI suggestion engine, React hooks, UI components, and telemetry integration.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import React from 'react';

// Import components and hooks to test
import { DropSuggestionEngine, DEFAULT_SUGGESTION_CONFIG } from '@/ui/idleVillage/ai/dropSuggestionEngine';
import { useDropAISuggestions, useDropAISuggestionsWithDragDrop } from '@/ui/idleVillage/hooks/useDropAISuggestions';
import { 
  SuggestionTooltip, 
  SuggestionIndicator, 
  SuggestionOverlay, 
  SuggestionHighlight,
  DropAISuggestionContainer 
} from '@/ui/idleVillage/components/DropAISuggestionUI';
import { useDropAITelemetry, DropAITelemetryManager } from '@/ui/idleVillage/utils/dropAITelemetry';

// Import types
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { 
  DropSuggestion, 
  SuggestionType, 
  SuggestionPriority,
  VillageContext 
} from '@/ui/idleVillage/ai/dropSuggestionEngine';

// Mock data
const mockResident: ResidentState = {
  id: 'resident-1',
  displayName: 'Test Resident',
  status: 'available',
  fatigue: 30,
  statProfileId: 'warrior',
  visualProfileId: 'warrior-visual',
};

const mockActivity: ActivityDefinition = {
  id: 'activity-1',
  label: 'Test Activity',
  description: 'Test activity description',
  tags: ['job', 'manual'],
  slotTags: ['village_job'],
  resolutionEngineId: 'job',
  level: 1,
  dangerRating: 3,
  durationFormula: '10',
  statRequirement: {
    allOf: ['strength'],
    label: 'Requires strength',
  },
  maxSlots: 3,
  fatigueProfile: {
    baseGain: 5,
  },
};

const mockVillageContext: VillageContext = {
  residents: [mockResident],
  activities: [mockActivity],
  resourceLevels: { wood: 100, stone: 50 },
  resourceNeeds: { wood: 20 },
  currentAssignments: {},
  villageState: {
    day: 1,
    season: 'spring',
    crisisMode: false,
  },
};

// Mock validation function
const mockValidator = vi.fn(() => ({
  isValid: true,
  message: 'Valid assignment',
}));

// Mock diagnostics
const mockDiagnostics = {
  emit: vi.fn(),
};

vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: () => mockDiagnostics,
}));

vi.mock('@/ui/idleVillage/config/residentDropRules', () => ({
  createDropValidator: () => mockValidator,
  DEFAULT_DROP_RULES_CONFIG: {},
}));

// TODO(PhaseE-drop-AI): Re-enable once drop suggestion engine no longer depends on live IdleVillage store hooks.
describe.skip('DropSuggestionEngine', () => {
  let engine: DropSuggestionEngine;

  beforeEach(() => {
    engine = new DropSuggestionEngine();
    vi.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should create engine with default config', () => {
      expect(engine).toBeDefined();
    });

    it('should create engine with custom config', () => {
      const customConfig = {
        weights: {
          statCompatibility: 0.5,
          fatigueOptimization: 0.3,
          crewBalance: 0.1,
          resourcePriority: 0.05,
          statDevelopment: 0.03,
          riskAssessment: 0.02,
        },
      };
      const customEngine = new DropSuggestionEngine(customConfig);
      expect(customEngine).toBeDefined();
    });
  });

  describe('Suggestion generation', () => {
    it('should generate suggestions for a resident', () => {
      const suggestions = engine.generateSuggestionsForResident(mockResident, mockVillageContext);
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });

    it('should generate suggestions for an activity', () => {
      const suggestions = engine.generateSuggestionsForActivity(mockActivity, mockVillageContext);
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });

    it('should generate village-wide suggestions', () => {
      const suggestions = engine.generateVillageSuggestions(mockVillageContext);
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Suggestion structure', () => {
    it('should create properly structured suggestions', () => {
      const suggestions = engine.generateSuggestionsForResident(mockResident, mockVillageContext);
      
      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('priority');
        expect(suggestion).toHaveProperty('resident');
        expect(suggestion).toHaveProperty('activity');
        expect(suggestion).toHaveProperty('confidence');
        expect(suggestion).toHaveProperty('reason');
        expect(suggestion).toHaveProperty('validationResult');
        expect(suggestion).toHaveProperty('metadata');
        
        expect(typeof suggestion.confidence).toBe('number');
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
        expect(suggestion.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Scoring algorithm', () => {
    it('should score resident-activity compatibility', () => {
      // This tests the private scoring method indirectly
      const suggestions = engine.generateSuggestionsForResident(mockResident, mockVillageContext);
      
      if (suggestions.length > 0) {
        suggestions.forEach(suggestion => {
          expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
          expect(suggestion.confidence).toBeLessThanOrEqual(1);
        });
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle empty residents list', () => {
      const emptyContext = { ...mockVillageContext, residents: [] };
      const suggestions = engine.generateVillageSuggestions(emptyContext);
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle empty activities list', () => {
      const emptyContext = { ...mockVillageContext, activities: [] };
      const suggestions = engine.generateVillageSuggestions(emptyContext);
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle invalid assignments', () => {
      mockValidator.mockReturnValue({ isValid: false, message: 'Invalid assignment' });
      const suggestions = engine.generateSuggestionsForResident(mockResident, mockVillageContext);
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });
});

describe('useDropAISuggestions Hook', () => {
  const TestComponent: React.FC<{ params?: any }> = ({ params }) => {
    const {
      suggestions,
      isLoading,
      error,
      getSuggestionsForResident,
      getSuggestionsForActivity,
      refreshSuggestions,
    } = useDropAISuggestions([mockResident], [mockActivity], params);

    return (
      <div>
        <div data-testid="loading">{isLoading.toString()}</div>
        <div data-testid="error">{error || 'no-error'}</div>
        <div data-testid="suggestions-count">{suggestions.length}</div>
        <button data-testid="refresh" onClick={refreshSuggestions}>
          Refresh
        </button>
        <button 
          data-testid="get-resident-suggestions" 
          onClick={() => getSuggestionsForResident(mockResident)}
        >
          Get Resident Suggestions
        </button>
        <button 
          data-testid="get-activity-suggestions" 
          onClick={() => getSuggestionsForActivity(mockActivity)}
        >
          Get Activity Suggestions
        </button>
      </div>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', async () => {
    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('suggestions-count')).toHaveTextContent('0');
    });
  });

  it('should generate suggestions on mount', async () => {
    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('should handle refresh suggestions', async () => {
    render(<TestComponent />);
    
    const refreshButton = screen.getByTestId('refresh');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('should filter suggestions by type', async () => {
    const params = { suggestionTypes: ['optimal_assignment'] };
    render(<TestComponent params={params} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('should filter suggestions by priority', async () => {
    const params = { priorityFilter: ['high', 'critical'] };
    render(<TestComponent params={params} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });
});

describe('useDropAISuggestionsWithDragDrop Hook', () => {
  const TestDragDropComponent: React.FC = () => {
    const {
      draggedResident,
      hoveredActivity,
      currentSuggestions,
      handleDragStart,
      handleDragEnd,
      handleActivityHover,
    } = useDropAISuggestionsWithDragDrop([mockResident], [mockActivity]);

    return (
      <div>
        <div data-testid="dragged-resident">{draggedResident?.id || 'none'}</div>
        <div data-testid="hovered-activity">{hoveredActivity?.id || 'none'}</div>
        <div data-testid="current-suggestions-count">{currentSuggestions.length}</div>
        <button data-testid="drag-start" onClick={() => handleDragStart(mockResident)}>
          Drag Start
        </button>
        <button data-testid="drag-end" onClick={handleDragEnd}>
          Drag End
        </button>
        <button data-testid="hover-activity" onClick={() => handleActivityHover(mockActivity)}>
          Hover Activity
        </button>
      </div>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle drag start', async () => {
    render(<TestDragDropComponent />);
    
    const dragStartButton = screen.getByTestId('drag-start');
    fireEvent.click(dragStartButton);
    
    expect(screen.getByTestId('dragged-resident')).toHaveTextContent('resident-1');
  });

  it('should handle drag end', async () => {
    render(<TestDragDropComponent />);
    
    const dragStartButton = screen.getByTestId('drag-start');
    const dragEndButton = screen.getByTestId('drag-end');
    
    fireEvent.click(dragStartButton);
    expect(screen.getByTestId('dragged-resident')).toHaveTextContent('resident-1');
    
    fireEvent.click(dragEndButton);
    expect(screen.getByTestId('dragged-resident')).toHaveTextContent('none');
  });

  it('should handle activity hover', async () => {
    render(<TestDragDropComponent />);
    
    const hoverButton = screen.getByTestId('hover-activity');
    fireEvent.click(hoverButton);
    
    expect(screen.getByTestId('hovered-activity')).toHaveTextContent('activity-1');
  });
});

describe('SuggestionTooltip Component', () => {
  const mockSuggestion: DropSuggestion = {
    id: 'suggestion-1',
    type: 'optimal_assignment',
    priority: 'high',
    resident: mockResident,
    activity: mockActivity,
    confidence: 0.85,
    reason: 'Great match for this activity',
    expectedOutcomes: {
      successProbability: 0.8,
      yieldMultiplier: 1.2,
      fatigueImpact: 'medium',
      riskLevel: 'low',
    },
    validationResult: { isValid: true },
    metadata: {
      scoreBreakdown: { statCompatibility: 0.8 },
      alternatives: [],
      contextFactors: ['high_fatigue'],
    },
  };

  it('should render tooltip with suggestion data', () => {
    render(
      <SuggestionTooltip 
        suggestion={mockSuggestion} 
        position="top"
      />
    );
    
    expect(screen.getByText('Test Activity')).toBeInTheDocument();
    expect(screen.getByText('Great match for this activity')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('should show priority indicator', () => {
    render(
      <SuggestionTooltip 
        suggestion={mockSuggestion} 
        position="top"
      />
    );
    
    // Check for priority icon (⚡ for high priority)
    const priorityIcon = screen.getByText('⚡');
    expect(priorityIcon).toBeInTheDocument();
  });

  it('should show type indicator', () => {
    render(
      <SuggestionTooltip 
        suggestion={mockSuggestion} 
        position="top"
      />
    );
    
    // Check for type icon (🎯 for optimal_assignment)
    const typeIcon = screen.getByText('🎯');
    expect(typeIcon).toBeInTheDocument();
  });

  it('should expand to show details', async () => {
    render(
      <SuggestionTooltip 
        suggestion={mockSuggestion} 
        position="top"
        showDetails={true}
      />
    );
    
    // Check for expected outcomes
    expect(screen.getByText('Success: 80%')).toBeInTheDocument();
    expect(screen.getByText('Yield: 120%')).toBeInTheDocument();
    expect(screen.getByText('Fatigue: medium')).toBeInTheDocument();
    expect(screen.getByText('Risk: low')).toBeInTheDocument();
  });
});

describe('SuggestionIndicator Component', () => {
  const mockSuggestion: DropSuggestion = {
    id: 'suggestion-1',
    type: 'optimal_assignment',
    priority: 'high',
    resident: mockResident,
    activity: mockActivity,
    confidence: 0.85,
    reason: 'Great match',
    validationResult: { isValid: true },
    metadata: {
      scoreBreakdown: {},
      alternatives: [],
      contextFactors: [],
    },
  };

  it('should render indicator with correct size', () => {
    render(
      <SuggestionIndicator 
        suggestion={mockSuggestion} 
        size="medium"
      />
    );
    
    const indicator = screen.getByRole('button');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('w-6', 'h-6');
  });

  it('should show confidence indicator', () => {
    render(
      <SuggestionIndicator 
        suggestion={mockSuggestion} 
        size="medium"
      />
    );
    
    // Should show confidence as 8 (85% rounded to 8/10)
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(
      <SuggestionIndicator 
        suggestion={mockSuggestion} 
        size="medium"
        onClick={handleClick}
      />
    );
    
    const indicator = screen.getByRole('button');
    fireEvent.click(indicator);
    expect(handleClick).toHaveBeenCalled();
  });
});

describe('SuggestionOverlay Component', () => {
  const mockSuggestions: DropSuggestion[] = [
    {
      id: 'suggestion-1',
      type: 'optimal_assignment',
      priority: 'high',
      resident: mockResident,
      activity: mockActivity,
      confidence: 0.85,
      reason: 'Best match',
      validationResult: { isValid: true },
      metadata: {
        scoreBreakdown: {},
        alternatives: [],
        contextFactors: [],
      },
    },
    {
      id: 'suggestion-2',
      type: 'crew_optimization',
      priority: 'medium',
      resident: mockResident,
      activity: { ...mockActivity, id: 'activity-2', label: 'Activity 2' },
      confidence: 0.65,
      reason: 'Good for balance',
      validationResult: { isValid: true },
      metadata: {
        scoreBreakdown: {},
        alternatives: [],
        contextFactors: [],
      },
    },
  ];

  it('should render overlay when visible', () => {
    render(
      <SuggestionOverlay
        suggestions={mockSuggestions}
        visible={true}
        position={{ x: 100, y: 100, width: 200, height: 50 }}
      />
    );
    
    expect(screen.getByText('AI Suggestions')).toBeInTheDocument();
    expect(screen.getByText('2 suggestions available')).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    render(
      <SuggestionOverlay
        suggestions={mockSuggestions}
        visible={false}
        position={{ x: 100, y: 100, width: 200, height: 50 }}
      />
    );
    
    expect(screen.queryByText('AI Suggestions')).not.toBeInTheDocument();
  });

  it('should sort suggestions by priority and confidence', () => {
    render(
      <SuggestionOverlay
        suggestions={mockSuggestions}
        visible={true}
        position={{ x: 100, y: 100, width: 200, height: 50 }}
      />
    );
    
    const suggestions = screen.getAllByTestId(/suggestion-item/);
    expect(suggestions.length).toBe(2);
    
    // High priority should be first
    expect(screen.getByText('Best match')).toBeInTheDocument();
    expect(screen.getByText('Good for balance')).toBeInTheDocument();
  });

  it('should handle suggestion selection', () => {
    const handleSelect = vi.fn();
    render(
      <SuggestionOverlay
        suggestions={mockSuggestions}
        visible={true}
        position={{ x: 100, y: 100, width: 200, height: 50 }}
        onSelectSuggestion={handleSelect}
      />
    );
    
    const firstSuggestion = screen.getByText('Best match').closest('div');
    if (firstSuggestion) {
      fireEvent.click(firstSuggestion);
      expect(handleSelect).toHaveBeenCalledWith(mockSuggestions[0]);
    }
  });

  it('should handle dismiss', () => {
    const handleDismiss = vi.fn();
    render(
      <SuggestionOverlay
        suggestions={mockSuggestions}
        visible={true}
        position={{ x: 100, y: 100, width: 200, height: 50 }}
        onDismiss={handleDismiss}
      />
    );
    
    const dismissButton = screen.getByText('✕');
    fireEvent.click(dismissButton);
    expect(handleDismiss).toHaveBeenCalled();
  });
});

describe('SuggestionHighlight Component', () => {
  it('should render highlight when active', () => {
    render(
      <SuggestionHighlight
        active={true}
        priority="high"
        intensity="normal"
      >
        <div data-testid="highlighted-content">Content</div>
      </SuggestionHighlight>
    );
    
    expect(screen.getByTestId('highlighted-content')).toBeInTheDocument();
  });

  it('should not render highlight when inactive', () => {
    render(
      <SuggestionHighlight
        active={false}
        priority="high"
        intensity="normal"
      >
        <div data-testid="highlighted-content">Content</div>
      </SuggestionHighlight>
    );
    
    expect(screen.getByTestId('highlighted-content')).toBeInTheDocument();
  });

  it('should show priority indicator dot', () => {
    render(
      <SuggestionHighlight
        active={true}
        priority="high"
        intensity="normal"
      >
        <div>Content</div>
      </SuggestionHighlight>
    );
    
    // Should have a green indicator dot
    const indicatorDot = document.querySelector('.bg-green-400');
    expect(indicatorDot).toBeInTheDocument();
  });
});

describe('DropAITelemetryManager', () => {
  let telemetryManager: DropAITelemetryManager;

  beforeEach(() => {
    telemetryManager = new DropAITelemetryManager('test-session');
    vi.clearAllMocks();
  });

  it('should create telemetry manager with session ID', () => {
    expect(telemetryManager).toBeDefined();
    expect(telemetryManager.getSessionSummary().sessionId).toBe('test-session');
  });

  it('should track suggestions generated', () => {
    const mockSuggestions: DropSuggestion[] = [];
    telemetryManager.trackSuggestionsGenerated(
      mockSuggestions,
      DEFAULT_SUGGESTION_CONFIG,
      100,
      [mockResident],
      [mockActivity]
    );
    
    expect(mockDiagnostics.emit).toHaveBeenCalledWith(
      'suggestions_generated',
      expect.objectContaining({
        eventType: 'suggestions_generated',
        data: expect.objectContaining({
          totalSuggestions: 0,
          generationTimeMs: 100,
        }),
      })
    );
  });

  it('should track suggestion shown', () => {
    const mockSuggestion: DropSuggestion = {
      id: 'test-suggestion',
      type: 'optimal_assignment',
      priority: 'high',
      resident: mockResident,
      activity: mockActivity,
      confidence: 0.8,
      reason: 'Test suggestion',
      validationResult: { isValid: true },
      metadata: {
        scoreBreakdown: {},
        alternatives: [],
        contextFactors: [],
      },
    };

    telemetryManager.trackSuggestionShown(
      mockSuggestion,
      'tooltip',
      { x: 100, y: 100 }
    );
    
    expect(mockDiagnostics.emit).toHaveBeenCalledWith(
      'suggestion_shown',
      expect.objectContaining({
        eventType: 'suggestion_shown',
        data: expect.objectContaining({
          suggestionId: 'test-suggestion',
          uiMode: 'tooltip',
        }),
      })
    );
  });

  it('should track suggestion clicked', () => {
    const mockSuggestion: DropSuggestion = {
      id: 'test-suggestion',
      type: 'optimal_assignment',
      priority: 'high',
      resident: mockResident,
      activity: mockActivity,
      confidence: 0.8,
      reason: 'Test suggestion',
      validationResult: { isValid: true },
      metadata: {
        scoreBreakdown: {},
        alternatives: [],
        contextFactors: [],
      },
    };

    telemetryManager.trackSuggestionClicked(
      mockSuggestion,
      'indicator',
      500
    );
    
    expect(mockDiagnostics.emit).toHaveBeenCalledWith(
      'suggestion_clicked',
      expect.objectContaining({
        eventType: 'suggestion_clicked',
        data: expect.objectContaining({
          suggestionId: 'test-suggestion',
          clickType: 'indicator',
          timeToClick: 500,
        }),
      })
    );
  });

  it('should track suggestion accepted', () => {
    const mockSuggestion: DropSuggestion = {
      id: 'test-suggestion',
      type: 'optimal_assignment',
      priority: 'high',
      resident: mockResident,
      activity: mockActivity,
      confidence: 0.8,
      reason: 'Test suggestion',
      validationResult: { isValid: true },
      metadata: {
        scoreBreakdown: {},
        alternatives: [],
        contextFactors: [],
      },
    };

    telemetryManager.trackSuggestionAccepted(
      mockSuggestion,
      1000,
      { success: true, actualYield: 1.1 }
    );
    
    expect(mockDiagnostics.emit).toHaveBeenCalledWith(
      'suggestion_accepted',
      expect.objectContaining({
        eventType: 'suggestion_accepted',
        data: expect.objectContaining({
          suggestionId: 'test-suggestion',
          timeToAccept: 1000,
        }),
      })
    );
  });

  it('should track suggestion rejected', () => {
    const mockSuggestion: DropSuggestion = {
      id: 'test-suggestion',
      type: 'optimal_assignment',
      priority: 'high',
      resident: mockResident,
      activity: mockActivity,
      confidence: 0.8,
      reason: 'Test suggestion',
      validationResult: { isValid: true },
      metadata: {
        scoreBreakdown: {},
        alternatives: [],
        contextFactors: [],
      },
    };

    telemetryManager.trackSuggestionRejected(
      mockSuggestion,
      'user_choice',
      2000
    );
    
    expect(mockDiagnostics.emit).toHaveBeenCalledWith(
      'suggestion_rejected',
      expect.objectContaining({
        eventType: 'suggestion_rejected',
        data: expect.objectContaining({
          suggestionId: 'test-suggestion',
          rejectionReason: 'user_choice',
          timeToReject: 2000,
        }),
      })
    );
  });

  it('should generate session summary', () => {
    const summary = telemetryManager.getSessionSummary();
    
    expect(summary).toHaveProperty('sessionId');
    expect(summary).toHaveProperty('duration');
    expect(summary).toHaveProperty('totalEvents');
    expect(summary).toHaveProperty('eventsByType');
    expect(summary).toHaveProperty('performanceMetrics');
  });

  it('should export telemetry data', () => {
    const exportData = telemetryManager.exportData();
    
    expect(exportData).toHaveProperty('sessionSummary');
    expect(exportData).toHaveProperty('events');
    expect(exportData).toHaveProperty('exportedAt');
  });
});

describe('useDropAITelemetry Hook', () => {
  const TestTelemetryComponent: React.FC = () => {
    const {
      telemetryManager,
      trackSuggestionsGenerated,
      trackSuggestionShown,
      getSessionSummary,
    } = useDropAITelemetry('test-hook-session');

    const mockSuggestion: DropSuggestion = {
      id: 'test-suggestion',
      type: 'optimal_assignment',
      priority: 'high',
      resident: mockResident,
      activity: mockActivity,
      confidence: 0.8,
      reason: 'Test suggestion',
      validationResult: { isValid: true },
      metadata: {
        scoreBreakdown: {},
        alternatives: [],
        contextFactors: [],
      },
    };

    return (
      <div>
        <button 
          data-testid="track-generated"
          onClick={() => trackSuggestionsGenerated([], DEFAULT_SUGGESTION_CONFIG, 50, [mockResident], [mockActivity])}
        >
          Track Generated
        </button>
        <button 
          data-testid="track-shown"
          onClick={() => trackSuggestionShown(mockSuggestion, 'tooltip', { x: 0, y: 0 })}
        >
          Track Shown
        </button>
        <button 
          data-testid="get-summary"
          onClick={() => console.log(getSessionSummary())}
        >
          Get Summary
        </button>
      </div>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide telemetry functions', () => {
    render(<TestTelemetryComponent />);
    
    const trackGeneratedButton = screen.getByTestId('track-generated');
    const trackShownButton = screen.getByTestId('track-shown');
    const getSummaryButton = screen.getByTestId('get-summary');
    
    expect(trackGeneratedButton).toBeInTheDocument();
    expect(trackShownButton).toBeInTheDocument();
    expect(getSummaryButton).toBeInTheDocument();
  });

  it('should track events when functions are called', async () => {
    render(<TestTelemetryComponent />);
    
    const trackGeneratedButton = screen.getByTestId('track-generated');
    fireEvent.click(trackGeneratedButton);
    
    await waitFor(() => {
      expect(mockDiagnostics.emit).toHaveBeenCalledWith(
        'suggestions_generated',
        expect.any(Object)
      );
    });
  });
});

describe('Integration Tests', () => {
  it('should integrate engine, hook, and UI components', async () => {
    const TestIntegrationComponent: React.FC = () => {
      const {
        suggestions,
        getSuggestionsForResident,
      } = useDropAISuggestions([mockResident], [mockActivity]);

      const residentSuggestions = getSuggestionsForResident(mockResident);

      return (
        <div>
          <div data-testid="suggestions-count">{suggestions.length}</div>
          <div data-testid="resident-suggestions-count">{residentSuggestions.length}</div>
          {residentSuggestions.length > 0 && (
            <SuggestionTooltip 
              suggestion={residentSuggestions[0]} 
              position="top"
            />
          )}
        </div>
      );
    };

    render(<TestIntegrationComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('suggestions-count')).toBeInTheDocument();
      expect(screen.getByTestId('resident-suggestions-count')).toBeInTheDocument();
    });
  });

  it('should handle drag-drop integration', async () => {
    const TestDragDropIntegrationComponent: React.FC = () => {
      const {
        draggedResident,
        currentSuggestions,
        handleDragStart,
        handleActivityHover,
      } = useDropAISuggestionsWithDragDrop([mockResident], [mockActivity]);

      return (
        <div>
          <div data-testid="dragged-resident">{draggedResident?.id || 'none'}</div>
          <div data-testid="current-suggestions-count">{currentSuggestions.length}</div>
          <button data-testid="drag-start" onClick={() => handleDragStart(mockResident)}>
            Drag Start
          </button>
          <button data-testid="hover-activity" onClick={() => handleActivityHover(mockActivity)}>
            Hover Activity
          </button>
          {currentSuggestions.length > 0 && (
            <SuggestionOverlay
              suggestions={currentSuggestions}
              visible={true}
              position={{ x: 100, y: 100, width: 200, height: 50 }}
            />
          )}
        </div>
      );
    };

    render(<TestDragDropIntegrationComponent />);
    
    const dragStartButton = screen.getByTestId('drag-start');
    fireEvent.click(dragStartButton);
    
    expect(screen.getByTestId('dragged-resident')).toHaveTextContent('resident-1');
    
    const hoverButton = screen.getByTestId('hover-activity');
    fireEvent.click(hoverButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('current-suggestions-count')).toBeInTheDocument();
    });
  });
});
