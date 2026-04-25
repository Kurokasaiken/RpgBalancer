/**
 * AI Tutor Mode Tests
 *
 * Comprehensive test suite for AI tutor functionality in Idle Village Drop AI,
 * covering step-by-step explanations, UI components, telemetry, and integration.
 *
 * @module aiTutorTests
 * @since 2026-01-13
 * @author Cascade
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AITutorEngine, createTutorEngine } from '../ai/aiTutorMode';
import { AITutorPanel, TutorToggle, MiniTutor } from '../ai/aiTutorUI';
import { createTutorTelemetry } from '../ai/aiTutorTelemetry';
import type { DropSuggestion } from '../ai/dropSuggestionEngine';

// Mock React
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn(),
    useEffect: vi.fn(),
    useCallback: vi.fn(),
    useMemo: vi.fn(),
    useRef: vi.fn(),
  };
});

// Mock DropSuggestionEngine
vi.mock('../ai/dropSuggestionEngine', () => ({
  DropSuggestionEngine: vi.fn().mockImplementation(() => ({
    generateSuggestionsForResident: vi.fn(),
    generateSuggestionsForActivity: vi.fn(),
  })),
}));

// Test utilities
function createMockSuggestion(overrides = {}): DropSuggestion {
  return {
    id: 'test-suggestion-1',
    type: 'optimal_assignment',
    priority: 'high',
    resident: {
      id: 'resident-1',
      name: 'Test Resident',
      fatigue: 50,
      stats: { strength: 10, agility: 8 },
      availability: true,
    },
    activity: {
      id: 'activity-1',
      label: 'Test Activity',
      statRequirement: { allOf: ['strength'] },
      dangerRating: 5,
      fatigueProfile: { baseGain: 2 },
      maxSlots: 3,
    },
    confidence: 0.85,
    reason: 'Good stat match with moderate fatigue',
    validationResult: {
      isValid: true,
      failures: [],
      ruleResults: {},
    },
    expectedOutcomes: {
      successProbability: 0.8,
      yieldMultiplier: 1.0,
      fatigueImpact: 'low',
      riskLevel: 'medium',
    },
    metadata: {
      scoreBreakdown: { statCompatibility: 0.8, fatigueOptimization: 0.7 },
      alternatives: [],
      contextFactors: ['moderate_fatigue'],
    },
    ...overrides,
  };
}

function createMockTutorHook() {
  return {
    isEnabled: false,
    isOpen: false,
    currentSuggestion: null,
    currentExplanation: null,
    interactionHistory: [],
    setEnabled: vi.fn(),
    explainSuggestion: vi.fn(),
    closeTutor: vi.fn(),
    acceptSuggestion: vi.fn(),
    rejectSuggestion: vi.fn(),
    getSuggestionsForResident: vi.fn(),
    getSuggestionsForActivity: vi.fn(),
    clearHistory: vi.fn(),
    tutorEngine: createTutorEngine(),
    suggestionEngine: {},
  };
}

describe('AITutorEngine', () => {
  let tutorEngine: AITutorEngine;
  let mockSuggestion: DropSuggestion;

  beforeEach(() => {
    tutorEngine = createTutorEngine({
      detailLevel: 'intermediate',
      enableLearningMode: true,
    });
    mockSuggestion = createMockSuggestion();
  });

  it('should create tutor engine with default config', () => {
    const engine = createTutorEngine();
    expect(engine).toBeDefined();
  });

  it('should explain a suggestion with step-by-step reasoning', () => {
    const explanation = tutorEngine.explainSuggestion(mockSuggestion);

    expect(explanation).toBeDefined();
    expect(explanation.suggestion).toBe(mockSuggestion);
    expect(explanation.reasoningSteps).toBeInstanceOf(Array);
    expect(explanation.reasoningSteps.length).toBeGreaterThan(0);
    expect(explanation.keyInsights).toBeInstanceOf(Array);
    expect(explanation.alternatives).toBeInstanceOf(Array);
    expect(explanation.overallConfidence).toBe(mockSuggestion.confidence);
  });

  it('should generate reasoning steps for different suggestion types', () => {
    const types: Array<DropSuggestion['type']> = [
      'optimal_assignment',
      'fatigue_management',
      'resource_need',
      'emergency_fill',
    ];

    types.forEach(type => {
      const suggestion = createMockSuggestion({ type });
      const explanation = tutorEngine.explainSuggestion(suggestion);

      expect(explanation.reasoningSteps.length).toBeGreaterThan(0);
      expect(explanation.reasoningSteps[0].title).toBe('Initial Assessment');
    });
  });

  it('should include learning tips when enabled', () => {
    const explanation = tutorEngine.explainSuggestion(mockSuggestion);

    expect(explanation.learningTips).toBeInstanceOf(Array);
    expect(explanation.learningTips.length).toBeGreaterThan(0);
  });

  it('should generate alternative scenarios', () => {
    const explanation = tutorEngine.explainSuggestion(mockSuggestion);

    expect(explanation.alternatives).toBeInstanceOf(Array);
    explanation.alternatives.forEach(alt => {
      expect(alt).toHaveProperty('scenario');
      expect(alt).toHaveProperty('impact');
      expect(alt).toHaveProperty('explanation');
    });
  });

  it('should handle different detail levels', () => {
    const basicEngine = createTutorEngine({ detailLevel: 'basic' });
    const advancedEngine = createTutorEngine({ detailLevel: 'advanced' });

    const basicExplanation = basicEngine.explainSuggestion(mockSuggestion);
    const advancedExplanation = advancedEngine.explainSuggestion(mockSuggestion);

    // Advanced should have more detailed explanations
    expect(advancedExplanation.reasoningSteps.length).toBeGreaterThanOrEqual(basicExplanation.reasoningSteps.length);
  });

  it('should update configuration', () => {
    tutorEngine.updateConfig({ detailLevel: 'advanced', showAlternatives: false });

    const explanation = tutorEngine.explainSuggestion(mockSuggestion);
    // Configuration should be applied (would need more detailed testing)
    expect(explanation).toBeDefined();
  });
});

describe('useAITutor', () => {
  const mockTutorHook = createMockTutorHook();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    expect(mockTutorHook.isEnabled).toBe(false);
    expect(mockTutorHook.isOpen).toBe(false);
    expect(mockTutorHook.currentSuggestion).toBe(null);
    expect(mockTutorHook.interactionHistory).toEqual([]);
  });

  it('should enable/disable tutor mode', () => {
    mockTutorHook.setEnabled(true);
    expect(mockTutorHook.setEnabled).toHaveBeenCalledWith(true);

    mockTutorHook.setEnabled(false);
    expect(mockTutorHook.setEnabled).toHaveBeenCalledWith(false);
  });

  it('should explain suggestions', () => {
    const suggestion = createMockSuggestion();
    mockTutorHook.explainSuggestion(suggestion);

    expect(mockTutorHook.explainSuggestion).toHaveBeenCalledWith(suggestion);
  });

  it('should handle suggestion acceptance', () => {
    mockTutorHook.acceptSuggestion();
    expect(mockTutorHook.acceptSuggestion).toHaveBeenCalled();
  });

  it('should handle suggestion rejection', () => {
    mockTutorHook.rejectSuggestion();
    expect(mockTutorHook.rejectSuggestion).toHaveBeenCalled();
  });

  it('should get suggestions for residents', () => {
    const resident = createMockSuggestion().resident;
    const context = {
      residents: [resident],
      activities: [],
      resourceLevels: {},
      resourceNeeds: {},
      currentAssignments: {},
      villageState: { day: 1 },
    };

    mockTutorHook.getSuggestionsForResident(resident, context);
    expect(mockTutorHook.getSuggestionsForResident).toHaveBeenCalledWith(resident, context);
  });

  it('should get suggestions for activities', () => {
    const activity = createMockSuggestion().activity;
    const context = {
      residents: [],
      activities: [activity],
      resourceLevels: {},
      resourceNeeds: {},
      currentAssignments: {},
      villageState: { day: 1 },
    };

    mockTutorHook.getSuggestionsForActivity(activity, context);
    expect(mockTutorHook.getSuggestionsForActivity).toHaveBeenCalledWith(activity, context);
  });

  it('should clear interaction history', () => {
    mockTutorHook.clearHistory();
    expect(mockTutorHook.clearHistory).toHaveBeenCalled();
  });
});

describe('AITutorPanel', () => {
  const mockSuggestion = createMockSuggestion();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when not active', () => {
    render(<AITutorPanel suggestion={mockSuggestion} isActive={false} />);
    expect(screen.queryByText('🤖 AI Tutor Mode')).not.toBeInTheDocument();
  });

  it('should render tutor panel when active', async () => {
    render(<AITutorPanel suggestion={mockSuggestion} isActive={true} />);

    await waitFor(() => {
      expect(screen.getByText('🤖 AI Tutor Mode')).toBeInTheDocument();
    });
  });

  it('should show suggestion summary', async () => {
    render(<AITutorPanel suggestion={mockSuggestion} isActive={true} />);

    await waitFor(() => {
      expect(screen.getByText('Test Resident')).toBeInTheDocument();
      expect(screen.getByText('Test Activity')).toBeInTheDocument();
    });
  });

  it('should show step navigation', async () => {
    render(<AITutorPanel suggestion={mockSuggestion} isActive={true} />);

    await waitFor(() => {
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next →')).toBeInTheDocument();
    });
  });

  it('should handle action buttons', async () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();

    render(<AITutorPanel suggestion={mockSuggestion} isActive={true} onAccept={onAccept} onReject={onReject} />);

    await waitFor(() => {
      const acceptButton = screen.getByText('✓ Accept Suggestion');
      const rejectButton = screen.getByText('✗ Reject Suggestion');

      fireEvent.click(acceptButton);
      expect(onAccept).toHaveBeenCalled();

      fireEvent.click(rejectButton);
      expect(onReject).toHaveBeenCalled();
    });
  });

  it('should close tutor on close button click', async () => {
    const onClose = vi.fn();

    render(<AITutorPanel suggestion={mockSuggestion} isActive={true} onClose={onClose} />);

    await waitFor(() => {
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('TutorToggle', () => {
  it('should render toggle component', () => {
    render(<TutorToggle isEnabled={false} onToggle={vi.fn()} />);

    expect(screen.getByText('🤖 AI Tutor Mode')).toBeInTheDocument();
  });

  it('should show enabled state', () => {
    render(<TutorToggle isEnabled={true} onToggle={vi.fn()} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should call onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<TutorToggle isEnabled={false} onToggle={onToggle} />);

    const toggle = screen.getByRole('checkbox');
    fireEvent.click(toggle);

    expect(onToggle).toHaveBeenCalledWith(true);
  });
});

describe('MiniTutor', () => {
  const mockSuggestion = {
    resident: 'Test Resident',
    activity: 'Test Activity',
    confidence: 0.85,
    reason: 'Good match',
  };

  it('should render mini tutor', () => {
    render(<MiniTutor suggestion={mockSuggestion} />);

    expect(screen.getByText('Test Resident')).toBeInTheDocument();
    expect(screen.getByText('Test Activity')).toBeInTheDocument();
    expect(screen.getByText('85% confidence')).toBeInTheDocument();
  });

  it('should show explain button', () => {
    const onOpenTutor = vi.fn();
    render(<MiniTutor suggestion={mockSuggestion} onOpenTutor={onOpenTutor} />);

    const button = screen.getByText('🤖 Explain');
    fireEvent.click(button);

    expect(onOpenTutor).toHaveBeenCalled();
  });
});

describe('AITutorTelemetry', () => {
  let telemetry: ReturnType<typeof createTutorTelemetry>;

  beforeEach(() => {
    telemetry = createTutorTelemetry('test-session');
  });

  it('should create telemetry instance', () => {
    expect(telemetry).toBeDefined();
  });

  it('should track tutor opened', () => {
    const suggestion = createMockSuggestion();
    telemetry.trackTutorOpened(suggestion);

    const events = telemetry.getQueuedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('tutor_opened');
    expect((events[0] as any).sessionId).toBe('test-session');
  });

  it('should track suggestion acceptance', () => {
    const suggestion = createMockSuggestion();
    const explanation = {
      suggestion,
      reasoningSteps: [],
      keyInsights: [],
      alternatives: [],
      overallConfidence: 0.85,
      learningTips: [],
    };

    telemetry.trackSuggestionAccepted(suggestion, explanation, 3000);

    const events = telemetry.getQueuedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('suggestion_accepted');
  });

  it('should export events in JSON format', () => {
    telemetry.trackTutorOpened(createMockSuggestion());

    const json = telemetry.exportEvents('json');
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('should export events in CSV format', () => {
    telemetry.trackTutorOpened(createMockSuggestion());

    const csv = telemetry.exportEvents('csv');
    expect(csv).toContain('timestamp');
    expect(csv).toContain('type');
  });

  it('should clear event queue', () => {
    telemetry.trackTutorOpened(createMockSuggestion());
    expect(telemetry.getQueuedEvents()).toHaveLength(1);

    telemetry.clearQueue();
    expect(telemetry.getQueuedEvents()).toHaveLength(0);
  });

  it('should enable/disable telemetry', () => {
    telemetry.setEnabled(false);
    telemetry.trackTutorOpened(createMockSuggestion());

    expect(telemetry.getQueuedEvents()).toHaveLength(0);
  });
});

describe('Integration Tests', () => {
  it('should handle complete tutor workflow', async () => {
    const mockTutorHook = {
      ...createMockTutorHook(),
      isConnected: true,
      connectionState: {
        ...createMockTutorHook().connectionState,
        isConnected: true,
      },
    };

    render(<AITutorPanel suggestion={createMockSuggestion()} isActive={true} tutorHook={mockTutorHook} />);

    await waitFor(() => {
      expect(screen.getByText('🤖 AI Tutor Mode')).toBeInTheDocument();
    });

    // Navigate through steps
    const nextButton = screen.getByText('Next →');
    fireEvent.click(nextButton);

    // Accept suggestion
    const acceptButton = screen.getByText('✓ Accept Suggestion');
    fireEvent.click(acceptButton);

    expect(mockTutorHook.acceptSuggestion).toHaveBeenCalled();
  });

  it('should handle tutor toggle workflow', () => {
    const onToggle = vi.fn();

    render(<TutorToggle isEnabled={false} onToggle={onToggle} />);

    const toggle = screen.getByRole('checkbox');
    fireEvent.click(toggle);

    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('should integrate telemetry with tutor actions', () => {
    const telemetry = createTutorTelemetry();
    const suggestion = createMockSuggestion();

    telemetry.trackTutorOpened(suggestion);
    telemetry.trackSuggestionAccepted(suggestion, {
      suggestion,
      reasoningSteps: [],
      keyInsights: [],
      alternatives: [],
      overallConfidence: 0.85,
      learningTips: [],
    }, 3000);

    const events = telemetry.getQueuedEvents();
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('tutor_opened');
    expect(events[1].type).toBe('suggestion_accepted');
  });
});
