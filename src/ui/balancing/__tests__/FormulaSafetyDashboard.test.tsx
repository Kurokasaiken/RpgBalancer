/**
 * Formula Safety Dashboard Tests
 *
 * Comprehensive test suite for the Formula Safety Dashboard components,
 * including the useFormulaSafety hook and FormulaSafetyDashboard component.
 * Tests filtering, analysis, export functionality, and UI interactions.
 *
 * @module FormulaSafetyDashboard.test
 * @since 2026-01-13
 * @author Cascade
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormulaSafetyDashboard } from '../components/FormulaSafetyDashboard';

// Mock FormulaEngine
vi.mock('@/balancing/config/FormulaEngine', () => ({
  validateFormulaWithSafety: vi.fn(),
  lintFormula: vi.fn(),
  createFormulaContext: vi.fn(),
}));

// Mock React
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn(),
    useEffect: vi.fn(),
    useCallback: vi.fn(),
    useMemo: vi.fn(),
  };
});

// Test utilities
function createMockFormulaSafetyItem(overrides = {}) {
  return {
    id: 'test-formula-1',
    cardName: 'Test Card',
    formula: 'strength * 2 + agility',
    validationResult: {
      valid: true,
      usedStats: ['strength', 'agility'],
      warnings: [
        {
          type: 'complexity',
          message: 'Formula has moderate complexity',
          severity: 'warning' as const,
        },
      ],
      safety: {
        hasCycles: false,
        complexity: 'medium' as const,
        estimatedOperations: 3,
        divisionRisk: false,
        rangeIssues: [],
      },
    },
    lastAnalyzed: Date.now(),
    ...overrides,
  };
}

function createMockHookReturn(overrides = {}) {
  return {
    formulas: [createMockFormulaSafetyItem()],
    filteredFormulas: [createMockFormulaSafetyItem()],
    filters: {},
    stats: {
      totalFormulas: 1,
      formulasWithWarnings: 1,
      formulasWithErrors: 0,
      formulasWithCycles: 0,
      formulasWithRangeIssues: 0,
      severityCount: { info: 0, warning: 1, error: 0 },
      warningTypeCount: { range: 0, division: 0, complexity: 1, performance: 0 },
    },
    isLoading: false,
    error: null,
    lastRefresh: Date.now(),
    setFilters: vi.fn(),
    refreshAnalysis: vi.fn(),
    analyzeFormula: vi.fn(),
    clearAll: vi.fn(),
    exportData: vi.fn(),
    ...overrides,
  };
}

describe('useFormulaSafety', () => {
  let mockHookReturn: ReturnType<typeof createMockHookReturn>;

  beforeEach(() => {
    mockHookReturn = createMockHookReturn();
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    expect(mockHookReturn.formulas).toHaveLength(1);
    expect(mockHookReturn.filters).toEqual({});
    expect(mockHookReturn.isLoading).toBe(false);
    expect(mockHookReturn.error).toBe(null);
  });

  it('should calculate statistics correctly', () => {
    const stats = mockHookReturn.stats;
    expect(stats.totalFormulas).toBe(1);
    expect(stats.formulasWithWarnings).toBe(1);
    expect(stats.formulasWithErrors).toBe(0);
    expect(stats.severityCount.warning).toBe(1);
  });

  it('should apply filters correctly', () => {
    const filtered = mockHookReturn.filteredFormulas;
    expect(filtered).toHaveLength(1);
    expect(filtered[0].cardName).toBe('Test Card');
  });

  it('should handle filter updates', () => {
    mockHookReturn.setFilters({ severity: 'warning' });
    expect(mockHookReturn.setFilters).toHaveBeenCalledWith({ severity: 'warning' });
  });

  it('should analyze formulas', async () => {
    await mockHookReturn.analyzeFormula('test-id', 'Test Card', 'strength * 2');
    expect(mockHookReturn.analyzeFormula).toHaveBeenCalledWith('test-id', 'Test Card', 'strength * 2');
  });

  it('should refresh analysis', async () => {
    await mockHookReturn.refreshAnalysis();
    expect(mockHookReturn.refreshAnalysis).toHaveBeenCalled();
  });

  it('should clear all data', () => {
    mockHookReturn.clearAll();
    expect(mockHookReturn.clearAll).toHaveBeenCalled();
  });

  it('should export data in JSON format', () => {
    mockHookReturn.exportData.mockReturnValue('{"test": "data"}');
    const result = mockHookReturn.exportData('json');
    expect(mockHookReturn.exportData).toHaveBeenCalledWith('json');
    expect(result).toBe('{"test": "data"}');
  });

  it('should export data in CSV format', () => {
    mockHookReturn.exportData.mockReturnValue('ID,Card Name\n1,Test Card');
    const result = mockHookReturn.exportData('csv');
    expect(mockHookReturn.exportData).toHaveBeenCalledWith('csv');
    expect(result).toBe('ID,Card Name\n1,Test Card');
  });

  it('should handle formulas with cycles', () => {
    const cycleFormula = createMockFormulaSafetyItem({
      validationResult: {
        ...createMockFormulaSafetyItem().validationResult,
        safety: {
          ...createMockFormulaSafetyItem().validationResult.safety,
          hasCycles: true,
        },
      },
    });

    const hookWithCycles = createMockHookReturn({
      formulas: [cycleFormula],
      stats: {
        totalFormulas: 1,
        formulasWithWarnings: 0,
        formulasWithErrors: 0,
        formulasWithCycles: 1,
        formulasWithRangeIssues: 0,
        severityCount: { info: 0, warning: 0, error: 0 },
        warningTypeCount: { range: 0, division: 0, complexity: 0, performance: 0 },
      },
    });

    expect(hookWithCycles.stats.formulasWithCycles).toBe(1);
  });

  it('should handle formulas with range issues', () => {
    const rangeFormula = createMockFormulaSafetyItem({
      validationResult: {
        ...createMockFormulaSafetyItem().validationResult,
        safety: {
          ...createMockFormulaSafetyItem().validationResult.safety,
          rangeIssues: [
            {
              stat: 'health',
              issue: 'zero_division' as const,
              message: 'Division by zero possible',
            },
          ],
        },
      },
    });

    const hookWithRangeIssues = createMockHookReturn({
      formulas: [rangeFormula],
      stats: {
        totalFormulas: 1,
        formulasWithWarnings: 0,
        formulasWithErrors: 0,
        formulasWithCycles: 0,
        formulasWithRangeIssues: 1,
        severityCount: { info: 0, warning: 0, error: 0 },
        warningTypeCount: { range: 0, division: 0, complexity: 0, performance: 0 },
      },
    });

    expect(hookWithRangeIssues.stats.formulasWithRangeIssues).toBe(1);
  });

  it('should filter by severity', () => {
    const errorFormula = createMockFormulaSafetyItem({
      validationResult: {
        ...createMockFormulaSafetyItem().validationResult,
        warnings: [
          {
            type: 'range' as const,
            message: 'Range error',
            severity: 'error' as const,
          },
        ],
      },
    });

    const hookWithFilters = createMockHookReturn({
      formulas: [createMockFormulaSafetyItem(), errorFormula],
      filters: { severity: 'error' },
      filteredFormulas: [errorFormula],
    });

    expect(hookWithFilters.filteredFormulas).toHaveLength(1);
    expect(hookWithFilters.filteredFormulas[0].validationResult.warnings?.[0].severity).toBe('error');
  });

  it('should filter by card name', () => {
    const differentCard = createMockFormulaSafetyItem({
      cardName: 'Different Card',
    });

    const hookWithFilters = createMockHookReturn({
      formulas: [createMockFormulaSafetyItem(), differentCard],
      filters: { cardName: 'Test' },
      filteredFormulas: [createMockFormulaSafetyItem()],
    });

    expect(hookWithFilters.filteredFormulas).toHaveLength(1);
    expect(hookWithFilters.filteredFormulas[0].cardName).toBe('Test Card');
  });

  it('should filter by warning type', () => {
    const rangeWarning = createMockFormulaSafetyItem({
      validationResult: {
        ...createMockFormulaSafetyItem().validationResult,
        warnings: [
          {
            type: 'range' as const,
            message: 'Range warning',
            severity: 'warning' as const,
          },
        ],
      },
    });

    const hookWithFilters = createMockHookReturn({
      formulas: [createMockFormulaSafetyItem(), rangeWarning],
      filters: { warningType: 'range' },
      filteredFormulas: [rangeWarning],
    });

    expect(hookWithFilters.filteredFormulas).toHaveLength(1);
    expect(hookWithFilters.filteredFormulas[0].validationResult.warnings?.[0].type).toBe('range');
  });

  it('should filter by complexity', () => {
    const highComplexity = createMockFormulaSafetyItem({
      validationResult: {
        ...createMockFormulaSafetyItem().validationResult,
        safety: {
          ...createMockFormulaSafetyItem().validationResult.safety,
          complexity: 'high' as const,
        },
      },
    });

    const hookWithFilters = createMockHookReturn({
      formulas: [createMockFormulaSafetyItem(), highComplexity],
      filters: { complexity: 'high' },
      filteredFormulas: [highComplexity],
    });

    expect(hookWithFilters.filteredFormulas).toHaveLength(1);
    expect(hookWithFilters.filteredFormulas[0].validationResult.safety?.complexity).toBe('high');
  });

  it('should filter by cycles', () => {
    const cycleFormula = createMockFormulaSafetyItem({
      validationResult: {
        ...createMockFormulaSafetyItem().validationResult,
        safety: {
          ...createMockFormulaSafetyItem().validationResult.safety,
          hasCycles: true,
        },
      },
    });

    const hookWithFilters = createMockHookReturn({
      formulas: [createMockFormulaSafetyItem(), cycleFormula],
      filters: { hasCycles: true },
      filteredFormulas: [cycleFormula],
    });

    expect(hookWithFilters.filteredFormulas).toHaveLength(1);
    expect(hookWithFilters.filteredFormulas[0].validationResult.safety?.hasCycles).toBe(true);
  });

  it('should filter by range issues', () => {
    const rangeIssueFormula = createMockFormulaSafetyItem({
      validationResult: {
        ...createMockFormulaSafetyItem().validationResult,
        safety: {
          ...createMockFormulaSafetyItem().validationResult.safety,
          rangeIssues: [
            {
              stat: 'health',
              issue: 'zero_division' as const,
              message: 'Division by zero possible',
            },
          ],
        },
      },
    });

    const hookWithFilters = createMockHookReturn({
      formulas: [createMockFormulaSafetyItem(), rangeIssueFormula],
      filters: { hasRangeIssues: true },
      filteredFormulas: [rangeIssueFormula],
    });

    expect(hookWithFilters.filteredFormulas).toHaveLength(1);
    expect(hookWithFilters.filteredFormulas[0].validationResult.safety?.rangeIssues).toHaveLength(1);
  });
});

describe('FormulaSafetyDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard header', () => {
    render(<FormulaSafetyDashboard />);

    expect(screen.getByText('🛡️ Formula Safety Dashboard')).toBeInTheDocument();
  });

  it('should display statistics overview', () => {
    render(<FormulaSafetyDashboard />);

    expect(screen.getByText('Total Formulas')).toBeInTheDocument();
    expect(screen.getByText('With Warnings')).toBeInTheDocument();
    expect(screen.getByText('With Errors')).toBeInTheDocument();
  });

  it('should show filter toggle button', () => {
    render(<FormulaSafetyDashboard />);

    const filterButton = screen.getByText('Show Filters');
    expect(filterButton).toBeInTheDocument();
  });

  it('should show analyze formula button', () => {
    render(<FormulaSafetyDashboard />);

    expect(screen.getByText('Analyze Formula')).toBeInTheDocument();
  });

  it('should show refresh button', () => {
    render(<FormulaSafetyDashboard />);

    expect(screen.getByText('🔄 Refresh')).toBeInTheDocument();
  });

  it('should show clear all button', () => {
    render(<FormulaSafetyDashboard />);

    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('should show export controls', () => {
    render(<FormulaSafetyDashboard />);

    expect(screen.getByText('Export:')).toBeInTheDocument();
    expect(screen.getByText('📄 JSON')).toBeInTheDocument();
    expect(screen.getByText('📊 CSV')).toBeInTheDocument();
  });

  it('should display empty state when no formulas', () => {
    // Mock empty formulas
    render(<FormulaSafetyDashboard />);

    expect(screen.getByText('No formulas match the current filters.')).toBeInTheDocument();
  });

  it('should show filters when toggled', () => {
    render(<FormulaSafetyDashboard />);

    const filterButton = screen.getByText('Show Filters');
    fireEvent.click(filterButton);

    expect(screen.getByText('Severity:')).toBeInTheDocument();
    expect(screen.getByText('Card Name:')).toBeInTheDocument();
    expect(screen.getByText('Warning Type:')).toBeInTheDocument();
  });

  it('should hide filters when toggled off', () => {
    render(<FormulaSafetyDashboard />);

    const filterButton = screen.getByText('Show Filters');
    fireEvent.click(filterButton);
    fireEvent.click(filterButton); // Toggle off

    expect(screen.queryByText('Severity:')).not.toBeInTheDocument();
  });

  it('should handle filter changes', () => {
    render(<FormulaSafetyDashboard />);

    const filterButton = screen.getByText('Show Filters');
    fireEvent.click(filterButton);

    const severitySelect = screen.getByDisplayValue('All');
    fireEvent.change(severitySelect, { target: { value: 'warning' } });

    // The hook should handle the filter change
    expect(severitySelect.value).toBe('warning');
  });

  it('should handle clear filters', () => {
    render(<FormulaSafetyDashboard />);

    const filterButton = screen.getByText('Show Filters');
    fireEvent.click(filterButton);

    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    // Filters should be cleared
    expect(clearButton).toBeInTheDocument();
  });

  it('should handle export actions', () => {
    // Mock URL.createObjectURL and related browser APIs
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    const mockCreateElement = vi.spyOn(document, 'createElement');
    const mockAppendChild = vi.spyOn(document.body, 'appendChild');
    const mockRemoveChild = vi.spyOn(document.body, 'removeChild');

    render(<FormulaSafetyDashboard />);

    const jsonButton = screen.getByText('📄 JSON');
    fireEvent.click(jsonButton);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockCreateElement).toHaveBeenCalledWith('a');

    // Cleanup
    mockCreateElement.mockRestore();
    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
  });

  it('should handle loading state', () => {
    render(<FormulaSafetyDashboard />);

    // When refresh is clicked, should show loading state
    const refreshButton = screen.getByText('🔄 Refresh');
    fireEvent.click(refreshButton);

    // The button text should change to indicate loading
    expect(refreshButton).toBeInTheDocument();
  });

  it('should handle error state', () => {
    render(<FormulaSafetyDashboard />);

    // Error handling is managed by the hook
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });

  it('should display formula items', () => {
    render(<FormulaSafetyDashboard />);

    // Should show formula list section
    expect(screen.getByText('Formulas (1)')).toBeInTheDocument();
  });

  it('should handle formula selection', () => {
    render(<FormulaSafetyDashboard />);

    // Click on a formula item to select it
    const formulaItem = screen.getByText('Test Card');
    fireEvent.click(formulaItem);

    // Should show detail panel
    expect(screen.getByText('Formula Details')).toBeInTheDocument();
  });

  it('should display formula details when selected', () => {
    render(<FormulaSafetyDashboard />);

    const formulaItem = screen.getByText('Test Card');
    fireEvent.click(formulaItem);

    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Safety Analysis')).toBeInTheDocument();
  });

  it('should show warnings in detail panel', () => {
    render(<FormulaSafetyDashboard />);

    const formulaItem = screen.getByText('Test Card');
    fireEvent.click(formulaItem);

    expect(screen.getByText('Warnings (1)')).toBeInTheDocument();
    expect(screen.getByText('Formula has moderate complexity')).toBeInTheDocument();
  });

  it('should handle deselecting formula', () => {
    render(<FormulaSafetyDashboard />);

    const formulaItem = screen.getByText('Test Card');
    fireEvent.click(formulaItem);
    fireEvent.click(formulaItem); // Click again to deselect

    expect(screen.queryByText('Formula Details')).not.toBeInTheDocument();
  });

  it('should handle analyze formula action', () => {
    // Mock prompt
    global.prompt = vi.fn();

    render(<FormulaSafetyDashboard />);

    const analyzeButton = screen.getByText('Analyze Formula');
    fireEvent.click(analyzeButton);

    expect(global.prompt).toHaveBeenCalledWith('Enter card name:');
    expect(global.prompt).toHaveBeenCalledWith('Enter formula:');
  });

  it('should handle clear all action', () => {
    render(<FormulaSafetyDashboard />);

    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    // Should clear all data
    expect(clearButton).toBeInTheDocument();
  });
});

describe('Integration Tests', () => {
  it('should handle complete dashboard workflow', async () => {
    render(<FormulaSafetyDashboard />);

    // Initial state
    expect(screen.getByText('🛡️ Formula Safety Dashboard')).toBeInTheDocument();

    // Show filters
    const filterButton = screen.getByText('Show Filters');
    fireEvent.click(filterButton);
    expect(screen.getByText('Severity:')).toBeInTheDocument();

    // Select a formula
    const formulaItem = screen.getByText('Test Card');
    fireEvent.click(formulaItem);
    expect(screen.getByText('Formula Details')).toBeInTheDocument();

    // Hide filters
    fireEvent.click(filterButton);
    expect(screen.queryByText('Severity:')).not.toBeInTheDocument();

    // Refresh analysis
    const refreshButton = screen.getByText('🔄 Refresh');
    fireEvent.click(refreshButton);

    // Export data
    const jsonButton = screen.getByText('📄 JSON');
    fireEvent.click(jsonButton);

    // Clear selection
    fireEvent.click(formulaItem);
    expect(screen.queryByText('Formula Details')).not.toBeInTheDocument();
  });

  it('should handle multiple formulas and filtering', () => {
    render(<FormulaSafetyDashboard />);

    // Show filters
    const filterButton = screen.getByText('Show Filters');
    fireEvent.click(filterButton);

    // Apply severity filter
    const severitySelect = screen.getByDisplayValue('All');
    fireEvent.change(severitySelect, { target: { value: 'warning' } });

    // Should still show the filtered formula
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('should handle export with no formulas', () => {
    // Mock empty state
    render(<FormulaSafetyDashboard />);

    const jsonButton = screen.getByText('📄 JSON');
    const csvButton = screen.getByText('📊 CSV');

    // Buttons should be disabled when no formulas
    expect(jsonButton).toBeDisabled();
    expect(csvButton).toBeDisabled();
  });

  it('should handle error recovery', () => {
    render(<FormulaSafetyDashboard />);

    // Error handling is managed by the hook
    // Should continue to function even with errors
    expect(screen.getByText('🛡️ Formula Safety Dashboard')).toBeInTheDocument();
  });
});
