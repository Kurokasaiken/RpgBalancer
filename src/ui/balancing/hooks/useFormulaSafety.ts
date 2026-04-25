/**
 * Formula Safety Hook
 *
 * React hook for managing FormulaEngine safety analysis, linting results,
 * and cycle detection in the Config Balancer Formula Safety Dashboard.
 *
 * @module useFormulaSafety
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FormulaValidationResult, FormulaWarning } from '@/balancing/config/FormulaEngine';
import { validateFormulaWithSafety, createFormulaContext } from '@/balancing/config/FormulaEngine';
import type { StatDefinition } from '@/balancing/config/types';

export interface FormulaSafetyItem {
  /** Unique identifier for the formula */
  id: string;
  /** Card or item name this formula belongs to */
  cardName: string;
  /** The formula string */
  formula: string;
  /** Validation result from FormulaEngine */
  validationResult: FormulaValidationResult;
  /** Timestamp of last analysis */
  lastAnalyzed: number;
  /** Whether this item is currently selected for detailed view */
  isSelected?: boolean;
}

export interface FormulaSafetyFilters {
  /** Filter by severity level */
  severity?: 'info' | 'warning' | 'error';
  /** Filter by card name (partial match) */
  cardName?: string;
  /** Filter by warning type */
  warningType?: FormulaWarning['type'];
  /** Show only items with cycles */
  hasCycles?: boolean;
  /** Filter by complexity level */
  complexity?: 'low' | 'medium' | 'high';
  /** Show only items with range issues */
  hasRangeIssues?: boolean;
}

export interface FormulaSafetyStats {
  /** Total number of formulas analyzed */
  totalFormulas: number;
  /** Number of formulas with warnings */
  formulasWithWarnings: number;
  /** Number of formulas with errors */
  formulasWithErrors: number;
  /** Number of formulas with cycles detected */
  formulasWithCycles: number;
  /** Number of formulas with range issues */
  formulasWithRangeIssues: number;
  /** Severity distribution */
  severityCount: Record<'info' | 'warning' | 'error', number>;
  /** Warning type distribution */
  warningTypeCount: Record<FormulaWarning['type'], number>;
}

export interface UseFormulaSafetyConfig {
  /** Auto-refresh interval in milliseconds */
  autoRefreshInterval?: number;
  /** Maximum number of formulas to analyze at once */
  batchSize?: number;
  /** Custom stat definitions for formula context */
  statDefinitions?: StatDefinition[];
  /** Enable telemetry logging */
  enableTelemetry?: boolean;
}

export interface UseFormulaSafetyReturn {
  /** All analyzed formulas */
  formulas: FormulaSafetyItem[];
  /** Filtered formulas based on current filters */
  filteredFormulas: FormulaSafetyItem[];
  /** Currently applied filters */
  filters: FormulaSafetyFilters;
  /** Statistics about the formula safety analysis */
  stats: FormulaSafetyStats;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Last refresh timestamp */
  lastRefresh: number;

  /** Actions */
  setFilters: (filters: Partial<FormulaSafetyFilters>) => void;
  refreshAnalysis: () => Promise<void>;
  analyzeFormula: (id: string, cardName: string, formula: string) => Promise<void>;
  clearAll: () => void;
  exportData: (format: 'json' | 'csv') => string;
}

/**
 * Hook for managing FormulaEngine safety analysis and linting
 *
 * @param config - Configuration options
 * @returns Formula safety state and actions
 *
 * @example
 * ```typescript
 * const {
 *   formulas,
 *   filteredFormulas,
 *   stats,
 *   setFilters,
 *   refreshAnalysis
 * } = useFormulaSafety({
 *   autoRefreshInterval: 30000,
 *   enableTelemetry: true
 * });
 * ```
 */
export function useFormulaSafety(
  config: UseFormulaSafetyConfig = {}
): UseFormulaSafetyReturn {
  const {
    autoRefreshInterval,
    statDefinitions = [],
    enableTelemetry = true,
  } = config;

  // State
  const [formulas, setFormulas] = useState<FormulaSafetyItem[]>([]);
  const [filters, setFiltersState] = useState<FormulaSafetyFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Create formula context from stat definitions
  const formulaContext = useMemo(() => {
    if (statDefinitions.length > 0) {
      return createFormulaContext(statDefinitions);
    }
    // Default context for common stats
    return createFormulaContext([
      { id: 'strength', min: 0, max: 100 },
      { id: 'agility', min: 0, max: 100 },
      { id: 'intelligence', min: 0, max: 100 },
      { id: 'health', min: 1, max: 1000 },
      { id: 'damage', min: 0, max: 500 },
    ]);
  }, [statDefinitions]);

  // Get available stats for linting
  const availableStats = useMemo(() => {
    return Object.keys(formulaContext.stats);
  }, [formulaContext]);

  // Calculate statistics
  const stats = useMemo((): FormulaSafetyStats => {
    const severityCount = { info: 0, warning: 0, error: 0 };
    const warningTypeCount = {
      range: 0,
      division: 0,
      complexity: 0,
      performance: 0,
    } as Record<FormulaWarning['type'], number>;

    let formulasWithWarnings = 0;
    let formulasWithErrors = 0;
    let formulasWithCycles = 0;
    let formulasWithRangeIssues = 0;

    formulas.forEach(item => {
      const warnings = item.validationResult.warnings || [];
      const safety = item.validationResult.safety;

      if (warnings.length > 0) {
        formulasWithWarnings++;

        warnings.forEach(warning => {
          severityCount[warning.severity]++;
          warningTypeCount[warning.type]++;
        });

        if (warnings.some(w => w.severity === 'error')) {
          formulasWithErrors++;
        }
      }

      if (safety?.hasCycles) {
        formulasWithCycles++;
      }

      if (safety?.rangeIssues && safety.rangeIssues.length > 0) {
        formulasWithRangeIssues++;
      }
    });

    return {
      totalFormulas: formulas.length,
      formulasWithWarnings,
      formulasWithErrors,
      formulasWithCycles,
      formulasWithRangeIssues,
      severityCount,
      warningTypeCount,
    };
  }, [formulas]);

  // Apply filters
  const filteredFormulas = useMemo(() => {
    return formulas.filter(item => {
      const warnings = item.validationResult.warnings || [];
      const safety = item.validationResult.safety;

      // Severity filter
      if (filters.severity) {
        const hasSeverity = warnings.some(w => w.severity === filters.severity);
        if (!hasSeverity) return false;
      }

      // Card name filter
      if (filters.cardName) {
        if (!item.cardName.toLowerCase().includes(filters.cardName.toLowerCase())) {
          return false;
        }
      }

      // Warning type filter
      if (filters.warningType) {
        const hasWarningType = warnings.some(w => w.type === filters.warningType);
        if (!hasWarningType) return false;
      }

      // Cycles filter
      if (filters.hasCycles !== undefined) {
        if (safety?.hasCycles !== filters.hasCycles) return false;
      }

      // Complexity filter
      if (filters.complexity) {
        if (safety?.complexity !== filters.complexity) return false;
      }

      // Range issues filter
      if (filters.hasRangeIssues !== undefined) {
        const hasRangeIssues = safety?.rangeIssues && safety.rangeIssues.length > 0;
        if (hasRangeIssues !== filters.hasRangeIssues) return false;
      }

      return true;
    });
  }, [formulas, filters]);

  // Set filters
  const setFilters = useCallback((newFilters: Partial<FormulaSafetyFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));

    if (enableTelemetry) {
      console.log('Formula safety filters updated:', newFilters);
    }
  }, [enableTelemetry]);

  // Analyze a single formula
  const analyzeFormula = useCallback(async (
    id: string,
    cardName: string,
    formula: string
  ): Promise<void> => {
    try {
      const validationResult = validateFormulaWithSafety(formula, availableStats, formulaContext);

      const safetyItem: FormulaSafetyItem = {
        id,
        cardName,
        formula,
        validationResult,
        lastAnalyzed: Date.now(),
      };

      setFormulas(prev => {
        const existingIndex = prev.findIndex(item => item.id === id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = safetyItem;
          return updated;
        } else {
          return [...prev, safetyItem];
        }
      });

      if (enableTelemetry) {
        console.log(`Formula analyzed: ${cardName} - ${formula.substring(0, 50)}...`);
      }
    } catch (err) {
      console.error('Formula analysis error:', err);
      setError(`Failed to analyze formula: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [availableStats, formulaContext, enableTelemetry]);

  // Refresh all analysis
  const refreshAnalysis = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Re-analyze all existing formulas
      const analysisPromises = formulas.map(item =>
        analyzeFormula(item.id, item.cardName, item.formula)
      );

      await Promise.all(analysisPromises);
      setLastRefresh(Date.now());

      if (enableTelemetry) {
        console.log(`Refreshed analysis for ${formulas.length} formulas`);
      }
    } catch (err) {
      setError(`Analysis refresh failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [formulas, analyzeFormula, enableTelemetry]);

  // Clear all data
  const clearAll = useCallback(() => {
    setFormulas([]);
    setFiltersState({});
    setError(null);

    if (enableTelemetry) {
      console.log('Formula safety data cleared');
    }
  }, [enableTelemetry]);

  // Export data
  const exportData = useCallback((format: 'json' | 'csv'): string => {
    const dataToExport = filteredFormulas.map(item => ({
      id: item.id,
      cardName: item.cardName,
      formula: item.formula,
      hasWarnings: (item.validationResult.warnings?.length || 0) > 0,
      hasErrors: item.validationResult.warnings?.some(w => w.severity === 'error') || false,
      hasCycles: item.validationResult.safety?.hasCycles || false,
      complexity: item.validationResult.safety?.complexity || 'unknown',
      warningsCount: item.validationResult.warnings?.length || 0,
      lastAnalyzed: new Date(item.lastAnalyzed).toISOString(),
      warnings: item.validationResult.warnings?.map(w => ({
        type: w.type,
        severity: w.severity,
        message: w.message,
      })) || [],
    }));

    if (format === 'csv') {
      const headers = ['ID', 'Card Name', 'Formula', 'Has Warnings', 'Has Errors', 'Has Cycles', 'Complexity', 'Warnings Count', 'Last Analyzed'];
      const rows = dataToExport.map(item => [
        item.id,
        item.cardName,
        `"${item.formula.replace(/"/g, '""')}"`,
        item.hasWarnings.toString(),
        item.hasErrors.toString(),
        item.hasCycles.toString(),
        item.complexity,
        item.warningsCount.toString(),
        item.lastAnalyzed,
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(dataToExport, null, 2);
  }, [filteredFormulas]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshInterval) return;

    const interval = setInterval(() => {
      refreshAnalysis();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, refreshAnalysis]);

  return {
    formulas,
    filteredFormulas,
    filters,
    stats,
    isLoading,
    error,
    lastRefresh,
    setFilters,
    refreshAnalysis,
    analyzeFormula,
    clearAll,
    exportData,
  };
}
