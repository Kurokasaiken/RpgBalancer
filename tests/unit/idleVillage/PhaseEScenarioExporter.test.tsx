/**
 * NP-105 – Idle Village Phase E Scenario Exporter Tests
 * 
 * Comprehensive test suite for Phase E Scenario Exporter UI component
 * and custom hook. Covers filtering, export functionality, telemetry,
 * and error handling scenarios.
 * 
 * @since 2026-01-21
 * @author Cascade
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PhaseEScenarioExporter } from '@/ui/idleVillage/tools/PhaseEScenarioExporter';
import { usePhaseEScenarioExport } from '@/ui/idleVillage/hooks/usePhaseEScenarioExport';
import type {
  PhaseEScenario,
  PhaseEExportFilters,
  PhaseEExportStats,
} from '@/ui/idleVillage/tools/PhaseEScenarioExporter';

// Mock PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn().mockResolvedValue(undefined),
  loadData: vi.fn().mockResolvedValue(null),
}));

// Mock PhaseEScenarioSerializer
vi.mock('@/balancing/idleVillage/PhaseEScenarioSerializer', () => ({
  createPhaseEScenario: vi.fn(),
  serializePhaseEScenario: vi.fn(),
  phaseEScenarioToMarkdown: vi.fn(),
  validatePhaseEScenario: vi.fn(),
  createPhaseEScenarioExportedTelemetry: vi.fn(),
}));

// Mock URL.createObjectURL and download
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('PhaseEScenarioExporter', () => {
  // Sample scenario for testing
  const sampleScenario: PhaseEScenario = {
    schemaVersion: '1.0.0',
    id: 'test-scenario-1',
    name: 'Test Scenario',
    description: 'A test scenario for unit testing',
    generatedAt: Date.now(),
    author: 'test',
    tags: ['test'],
    tick: {
      current: 0,
      total: 100,
      durationMs: 1000,
    },
    residents: [
      {
        id: 'resident-1',
        name: 'Test Resident',
        status: 'available',
        fatigue: 25,
        hp: 80,
        maxHp: 100,
        statTags: ['strength'],
        isHero: false,
        isInjured: false,
        survivalCount: 5,
        survivalScore: 75,
      },
      {
        id: 'resident-2',
        name: 'Test Resident 2',
        status: 'exhausted',
        fatigue: 85,
        hp: 60,
        maxHp: 100,
        statTags: ['agility'],
        isHero: true,
        isInjured: false,
        survivalCount: 3,
        survivalScore: 60,
      },
    ],
    slots: [
      {
        id: 'slot-1',
        activityId: 'test-activity',
        name: 'Test Activity',
        slotTags: ['village_job'],
        maxCrew: 3,
        currentOccupants: 2,
        isLocked: false,
      },
      {
        id: 'slot-2',
        activityId: 'test-activity-2',
        name: 'Test Activity 2',
        slotTags: ['village_job'],
        maxCrew: 2,
        currentOccupants: 1,
        isLocked: true,
      },
    ],
    tagDefinitions: [
      {
        id: 'strength',
        name: 'Strength',
        category: 'stat',
        color: '#ff6b6b',
        description: 'Physical strength attribute',
      },
      {
        id: 'village_job',
        name: 'Village Job',
        category: 'activity_type',
        color: '#4ecdc4',
        description: 'Regular village work activities',
      },
    ],
    dropFeedbackConfigs: [
      {
        slotId: 'slot-1',
        dropState: 'valid',
        compatibilityScore: 0.85,
        validationResults: {
          statRequirements: true,
          fatigueThreshold: true,
          crewCapacity: true,
          tagCompatibility: true,
          phaseLock: false,
        },
        lastValidatedAt: Date.now(),
      },
    ],
    questTimelineTicks: [
      {
        tick: 0,
        questId: 'quest-1',
        questName: 'Test Quest',
        status: 'active',
        progress: 0.5,
        priority: 'normal',
        questType: 'main',
        timeRemainingTicks: 50,
        participatingResidents: ['resident-1'],
      },
    ],
    metadata: {
      difficulty: 'beginner',
      estimatedRuntimeMinutes: 5,
      requiredFeatures: [],
      compatibilityVersion: '1.0.0',
      exportSource: 'manual',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock createPhaseEScenario to return sample scenario
    const mockCreatePhaseEScenario = vi.mocked(createPhaseEScenario);
    const mockSerializePhaseEScenario = vi.mocked(serializePhaseEScenario);
    const mockPhaseEScenarioToMarkdown = vi.mocked(phaseEScenarioToMarkdown);
    
    mockCreatePhaseEScenario.mockReturnValue(sampleScenario);
    mockSerializePhaseEScenario.mockReturnValue(JSON.stringify(sampleScenario, null, 2));
    mockPhaseEScenarioToMarkdown.mockReturnValue('# Test Scenario\n\nA test scenario for unit testing');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<PhaseEScenarioExporter />);
    
    expect(screen.getByText('Phase E Scenario Exporter')).toBeInTheDocument();
    expect(screen.getByText('Export Phase E scenarios with custom filters and preview')).toBeInTheDocument();
  });

  it('displays scenario information when loaded', async () => {
    render(<PhaseEScenarioExporter />);
    
    await waitFor(() => {
      expect(screen.getByText('Current Scenario')).toBeInTheDocument();
      expect(screen.getByText('Test Scenario')).toBeInTheDocument();
      expect(screen.getByText('Version: 1.0.0')).toBeInTheDocument();
      expect(screen.getByText('Residents: 2')).toBeInTheDocument();
      expect(screen.getByText('Slots: 2')).toBeInTheDocument();
    });
  });

  it('renders export controls', async () => {
    render(<PhaseEScenarioExporter />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('JSON')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Export JSON/i })).toBeInTheDocument();
    });
  });

  it('switches export format', async () => {
    render(<PhaseEScenarioExporter />);
    
    await waitFor(() => {
      const formatSelect = screen.getByDisplayValue('JSON');
      fireEvent.change(formatSelect, { target: { value: 'markdown' } });
      
      expect(screen.getByDisplayValue('markdown')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Export MARKDOWN/i })).toBeInTheDocument();
    });
  });

  it('renders filter controls', async () => {
    render(<PhaseEScenarioExporter />);
    
    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('Fatigue Range: 0% - 100%')).toBeInTheDocument();
      expect(screen.getByLabelText('Include Locked Slots')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All States')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument();
    });
  });

  it('updates fatigue range filters', async () => {
    render(<PhaseEScenarioExporter />);
    
    await waitFor(() => {
      const fatigueMinSlider = screen.getAllByRole('slider')[0];
      const fatigueMaxSlider = screen.getAllByRole('slider')[1];
      
      fireEvent.change(fatigueMinSlider, { target: { value: '30' } });
      fireEvent.change(fatigueMaxSlider, { target: { value: '70' } });
      
      expect(screen.getByText('Fatigue Range: 30% - 70%')).toBeInTheDocument();
    });
  });

  it('toggles include locked slots', async () => {
    render(<PhaseEScenarioExporter />);
    
    await waitFor(() => {
      const includeLockedCheckbox = screen.getByLabelText('Include Locked Slots');
      
      expect(includeLockedCheckbox).not.toBeChecked();
      
      fireEvent.click(includeLockedCheckbox);
      
      expect(includeLockedCheckbox).toBeChecked();
    });
  });

  it('displays export statistics', async () => {
    render(<PhaseEScenarioExporter />);
    
    await waitFor(() => {
      expect(screen.getByText('Export Statistics')).toBeInTheDocument();
      expect(screen.getByText(/Residents: 2\/2/)).toBeInTheDocument();
      expect(screen.getByText(/Slots: 2\/2/)).toBeInTheDocument();
      expect(screen.getByText(/Tags: 2\/2/)).toBeInTheDocument();
    });
  });

  it('generates preview for JSON format', async () => {
    render(<PhaseEScenarioExporter />);
    
    await waitFor(() => {
      expect(screen.getByText('Preview (JSON)')).toBeInTheDocument();
      expect(screen.getByText(/"schemaVersion": "1.0.0"/)).toBeInTheDocument();
    });
  });

  it('exports JSON format', async () => {
    render(<PhaseEScenarioExporter />);
    
    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /Export JSON/i });
      
      // Create a mock link element
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      } as any;
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
      
      fireEvent.click(exportButton);
      
      expect(serializePhaseEScenario).toHaveBeenCalled();
      expect(mockLink.download).toMatch(/phase-e-scenario-test-scenario-1-\d+\.json/);
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  it('uses external scenario when provided', async () => {
    const externalScenario: PhaseEScenario = {
      ...sampleScenario,
      id: 'external-scenario',
      name: 'External Scenario',
    };
    
    render(<PhaseEScenarioExporter scenario={externalScenario} />);
    
    await waitFor(() => {
      expect(screen.getByText('External Scenario')).toBeInTheDocument();
      expect(screen.getByText('Residents: 2')).toBeInTheDocument();
    });
  });
});

describe('usePhaseEScenarioExport', () => {
  // Test component to use the hook
  function TestComponent() {
    const {
      scenario,
      isLoading,
      error,
      filters,
      exportFormat,
      exportStats,
      filteredScenario,
      updateScenario,
      updateFilters,
      resetFilters,
      exportScenario,
      setExportFormat,
    } = usePhaseEScenarioExport();

    return (
      <div>
        <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
        <div data-testid="error">{error || 'no-error'}</div>
        <div data-testid="scenario-id">{scenario?.id || 'no-scenario'}</div>
        <div data-testid="export-format">{exportFormat}</div>
        <div data-testid="filtered-residents">{filteredScenario?.residents.length || 0}</div>
        <button data-testid="update-filters" onClick={() => updateFilters({ fatigueMin: 50 })}>
          Update Filters
        </button>
        <button data-testid="reset-filters" onClick={resetFilters}>
          Reset Filters
        </button>
        <button data-testid="set-format" onClick={() => setExportFormat('markdown')}>
          Set Format
        </button>
        <button data-testid="export-json" onClick={() => exportScenario('json')}>
          Export JSON
        </button>
      </div>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock createPhaseEScenario to return sample scenario
    const mockCreatePhaseEScenario = vi.mocked(createPhaseEScenario);
    const mockSerializePhaseEScenario = vi.mocked(serializePhaseEScenario);
    const mockPhaseEScenarioToMarkdown = vi.mocked(phaseEScenarioToMarkdown);
    const mockValidatePhaseEScenario = vi.mocked(validatePhaseEScenario);
    
    mockCreatePhaseEScenario.mockReturnValue({
      id: 'test-scenario',
      name: 'Test Scenario',
      residents: [
        { id: 'resident-1', name: 'Test Resident', status: 'available', fatigue: 25, hp: 80, maxHp: 100, statTags: ['strength'], isHero: false, isInjured: false, survivalCount: 5, survivalScore: 75 },
        { id: 'resident-2', name: 'Test Resident 2', status: 'exhausted', fatigue: 85, hp: 60, maxHp: 100, statTags: ['agility'], isHero: true, isInjured: false, survivalCount: 3, survivalScore: 60 },
      ],
      slots: [
        { id: 'slot-1', activityId: 'test-activity', name: 'Test Activity', slotTags: ['village_job'], maxCrew: 3, currentOccupants: 2, isLocked: false },
        { id: 'slot-2', activityId: 'test-activity-2', name: 'Test Activity 2', slotTags: ['village_job'], maxCrew: 2, currentOccupants: 1, isLocked: true },
      ],
      tagDefinitions: [
        { id: 'strength', name: 'Strength', category: 'stat', color: '#ff6b6b', description: 'Physical strength attribute' },
        { id: 'village_job', name: 'Village Job', category: 'activity_type', color: '#4ecdc4', description: 'Regular village work activities' },
      ],
      dropFeedbackConfigs: [
        { slotId: 'slot-1', dropState: 'valid', compatibilityScore: 0.85, validationResults: { statRequirements: true, fatigueThreshold: true, crewCapacity: true, tagCompatibility: true, phaseLock: false }, lastValidatedAt: Date.now() },
      ],
      questTimelineTicks: [
        { tick: 0, questId: 'quest-1', questName: 'Test Quest', status: 'active', progress: 0.5, priority: 'normal', questType: 'main', timeRemainingTicks: 50, participatingResidents: ['resident-1'] },
      ],
    } as any);
    
    mockSerializePhaseEScenario.mockReturnValue('{}');
    mockPhaseEScenarioToMarkdown.mockReturnValue('# Test Scenario');
    mockValidatePhaseEScenario.mockImplementation((data) => data);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads scenario after initialization', async () => {
    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      expect(screen.getByTestId('scenario-id')).toHaveTextContent('test-scenario');
      expect(screen.getByTestId('export-format')).toHaveTextContent('json');
      expect(screen.getByTestId('filtered-residents')).toHaveTextContent('2');
    });
  });

  it('updates filters', async () => {
    render(<TestComponent />);
    
    await waitFor(() => {
      const updateButton = screen.getByTestId('update-filters');
      fireEvent.click(updateButton);
      
      // Filter should be updated and filtered residents should change
      expect(screen.getByTestId('filtered-residents')).toHaveTextContent('1'); // Only resident with fatigue <= 50
    });
  });

  it('resets filters', async () => {
    render(<TestComponent />);
    
    await waitFor(() => {
      // First update filters
      const updateButton = screen.getByTestId('update-filters');
      fireEvent.click(updateButton);
      
      expect(screen.getByTestId('filtered-residents')).toHaveTextContent('1');
      
      // Then reset
      const resetButton = screen.getByTestId('reset-filters');
      fireEvent.click(resetButton);
      
      expect(screen.getByTestId('filtered-residents')).toHaveTextContent('2'); // All residents restored
    });
  });

  it('sets export format', async () => {
    render(<TestComponent />);
    
    await waitFor(() => {
      const formatButton = screen.getByTestId('set-format');
      fireEvent.click(formatButton);
      
      expect(screen.getByTestId('export-format')).toHaveTextContent('markdown');
    });
  });

  it('exports scenario as JSON', async () => {
    render(<TestComponent />);
    
    await waitFor(() => {
      const exportButton = screen.getByTestId('export-json');
      
      const result = exportButton.onclick?.();
      
      expect(result).resolves.toMatchObject({
        data: '{}',
        fileName: expect.stringMatching(/phase-e-scenario-test-scenario-\d+\.json/),
        mimeType: 'application/json',
        fileSizeBytes: expect.any(Number),
        exportDurationMs: expect.any(Number),
        stats: expect.any(Object),
      });
    });
  });
});
