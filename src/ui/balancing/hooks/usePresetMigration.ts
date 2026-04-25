/**
 * Preset Migration UI Helpers
 *
 * TypeScript utility functions for UI integration with the preset migration system,
 * providing easy-to-use hooks and utilities for displaying migration status,
 * progress tracking, and user interaction.
 *
 * @module presetMigrationHelpers
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useCallback, useEffect } from 'react';
import { PresetMigrator } from '@/balancing/config/presetMigration';
import type { PresetMigrationResult, PresetMigrationChange } from '@/balancing/config/presetMigration';

/**
 * Migration status for UI display
 */
export type MigrationStatus = 'idle' | 'analyzing' | 'migrating' | 'completed' | 'error';

/**
 * Migration progress information
 */
export interface MigrationProgress {
  currentFile: string;
  completed: number;
  total: number;
  percentage: number;
  status: MigrationStatus;
  currentResult?: PresetMigrationResult;
}

/**
 * Migration summary for dashboard display
 */
export interface MigrationSummary {
  totalFiles: number;
  successfulMigrations: number;
  failedMigrations: number;
  totalChanges: number;
  averageDuration: number;
  backupFiles: string[];
  errorMessages: string[];
  warningMessages: string[];
}

/**
 * Hook for managing single preset migration
 */
export function usePresetMigration() {
  const [status, setStatus] = useState<MigrationStatus>('idle');
  const [result, setResult] = useState<PresetMigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const migratePreset = useCallback(async (
    inputFile: string,
    outputFile?: string,
    options: {
      createBackup?: boolean;
      dryRun?: boolean;
      force?: boolean;
    } = {}
  ): Promise<PresetMigrationResult> => {
    setStatus('migrating');
    setError(null);

    try {
      const migrationResult = await PresetMigrator.migrate(inputFile, outputFile, options);
      setResult(migrationResult);

      if (migrationResult.success) {
        setStatus('completed');
      } else {
        setStatus('error');
      }

      return migrationResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Migration failed';
      setError(errorMessage);
      setStatus('error');
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return {
    status,
    result,
    error,
    migratePreset,
    reset,
  };
}

/**
 * Hook for managing batch preset migration with progress tracking
 */
export function useBatchPresetMigration() {
  const [progress, setProgress] = useState<MigrationProgress>({
    currentFile: '',
    completed: 0,
    total: 0,
    percentage: 0,
    status: 'idle',
  });
  const [results, setResults] = useState<PresetMigrationResult[]>([]);
  const [summary, setSummary] = useState<MigrationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const migrateBatch = useCallback(async (
    inputFiles: string[],
    options: {
      outputDir?: string;
      createBackup?: boolean;
      dryRun?: boolean;
      parallel?: boolean;
    } = {}
  ): Promise<PresetMigrationResult[]> => {
    setProgress({
      currentFile: '',
      completed: 0,
      total: inputFiles.length,
      percentage: 0,
      status: 'migrating',
    });
    setResults([]);
    setSummary(null);
    setError(null);

    try {
      const batchResults: PresetMigrationResult[] = [];

      if (options.parallel) {
        // Parallel processing
        const promises = inputFiles.map(async (file, _index) => {
          setProgress(prev => ({
            ...prev,
            currentFile: file,
          }));

          const result = await PresetMigrator.migrate(file, undefined, {
            createBackup: options.createBackup,
            dryRun: options.dryRun,
          });

          setProgress(prev => ({
            ...prev,
            completed: prev.completed + 1,
            percentage: ((prev.completed + 1) / prev.total) * 100,
            currentResult: result,
          }));

          return result;
        });

        const allResults = await Promise.all(promises);
        batchResults.push(...allResults);
      } else {
        // Sequential processing
        for (let i = 0; i < inputFiles.length; i++) {
          const file = inputFiles[i];

          setProgress(prev => ({
            ...prev,
            currentFile: file,
          }));

          const result = await PresetMigrator.migrate(file, undefined, {
            createBackup: options.createBackup,
            dryRun: options.dryRun,
          });

          batchResults.push(result);

          setProgress(prev => ({
            ...prev,
            completed: prev.completed + 1,
            percentage: ((prev.completed + 1) / prev.total) * 100,
            currentResult: result,
          }));
        }
      }

      setResults(batchResults);

      // Generate summary
      const successful = batchResults.filter(r => r.success).length;
      const failed = batchResults.length - successful;
      const totalChanges = batchResults.reduce((sum, r) => sum + r.changes.length, 0);
      const averageDuration = batchResults.reduce((sum, r) => sum + r.duration, 0) / batchResults.length;
      const backupFiles = batchResults.map(r => r.backupFile).filter(Boolean) as string[];
      const errorMessages = batchResults.flatMap(r => r.errors);
      const warningMessages = batchResults.flatMap(r => r.warnings);

      setSummary({
        totalFiles: batchResults.length,
        successfulMigrations: successful,
        failedMigrations: failed,
        totalChanges,
        averageDuration,
        backupFiles,
        errorMessages,
        warningMessages,
      });

      setProgress(prev => ({
        ...prev,
        status: 'completed',
        currentFile: '',
      }));

      return batchResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch migration failed';
      setError(errorMessage);
      setProgress(prev => ({
        ...prev,
        status: 'error',
      }));
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setProgress({
      currentFile: '',
      completed: 0,
      total: 0,
      percentage: 0,
      status: 'idle',
    });
    setResults([]);
    setSummary(null);
    setError(null);
  }, []);

  return {
    progress,
    results,
    summary,
    error,
    migrateBatch,
    reset,
  };
}

/**
 * Hook for analyzing migration changes without performing migration
 */
export function useMigrationAnalysis() {
  const [status, setStatus] = useState<MigrationStatus>('idle');
  const [changes, setChanges] = useState<PresetMigrationChange[]>([]);
  const [sourceVersion, setSourceVersion] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const analyzePreset = useCallback(async (inputFile: string): Promise<PresetMigrationChange[]> => {
    setStatus('analyzing');
    setError(null);

    try {
      // Perform dry-run migration to get change analysis
      const result = await PresetMigrator.migrate(inputFile, undefined, {
        createBackup: false,
        dryRun: true,
      });

      if (!result.success) {
        throw new Error(`Analysis failed: ${result.errors.join(', ')}`);
      }

      setChanges(result.changes);
      setSourceVersion(result.sourceVersion);
      setStatus('completed');

      return result.changes;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      setStatus('error');
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setChanges([]);
    setSourceVersion('');
    setError(null);
  }, []);

  return {
    status,
    changes,
    sourceVersion,
    error,
    analyzePreset,
    reset,
  };
}

/**
 * Utility functions for migration UI
 */
export class MigrationUIUtils {
  /**
   * Format migration change for display
   */
  static formatChange(change: PresetMigrationChange): string {
    const icon = change.type === 'added' ? '➕' : change.type === 'modified' ? '🔄' : '➖';
    return `${icon} ${change.property}: ${change.description}`;
  }

  /**
   * Get status color for migration result
   */
  static getStatusColor(result: PresetMigrationResult): string {
    if (!result.success) return 'red';
    if (result.warnings.length > 0) return 'orange';
    return 'green';
  }

  /**
   * Get status icon for migration result
   */
  static getStatusIcon(result: PresetMigrationResult): string {
    if (!result.success) return '❌';
    if (result.warnings.length > 0) return '⚠️';
    return '✅';
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get change type color
   */
  static getChangeTypeColor(type: PresetMigrationChange['type']): string {
    switch (type) {
      case 'added': return 'green';
      case 'modified': return 'blue';
      case 'removed': return 'red';
      default: return 'gray';
    }
  }

  /**
   * Group changes by type for summary display
   */
  static groupChangesByType(changes: PresetMigrationChange[]): Record<string, PresetMigrationChange[]> {
    return changes.reduce((groups, change) => {
      if (!groups[change.type]) {
        groups[change.type] = [];
      }
      groups[change.type].push(change);
      return groups;
    }, {} as Record<string, PresetMigrationChange[]>);
  }

  /**
   * Calculate migration health score (0-100)
   */
  static calculateHealthScore(result: PresetMigrationResult): number {
    if (!result.success) return 0;

    let score = 100;

    // Deduct points for warnings
    score -= result.warnings.length * 5;

    // Deduct points for changes (more changes = more complex migration)
    score -= Math.min(result.changes.length * 2, 20);

    // Deduct points for long duration
    if (result.duration > 1000) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  /**
   * Get health score color
   */
  static getHealthScoreColor(score: number): string {
    if (score >= 80) return 'green';
    if (score >= 60) return 'orange';
    return 'red';
  }

  /**
   * Format duration for display
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  /**
   * Generate migration summary text
   */
  static generateSummaryText(summary: MigrationSummary): string {
    const successRate = ((summary.successfulMigrations / summary.totalFiles) * 100).toFixed(1);
    return `${summary.successfulMigrations}/${summary.totalFiles} presets migrated successfully (${successRate}%) with ${summary.totalChanges} total changes in ${MigrationUIUtils.formatDuration(summary.averageDuration)} avg time`;
  }
}

/**
 * React hook for managing migration history and state
 */
export function useMigrationHistory() {
  const [history, setHistory] = useState<PresetMigrationResult[]>([]);

  const addToHistory = useCallback((result: PresetMigrationResult) => {
    setHistory(prev => [result, ...prev.slice(0, 49)]); // Keep last 50
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getRecentMigrations = useCallback((limit: number = 10) => {
    return history.slice(0, limit);
  }, [history]);

  const getMigrationStats = useCallback(() => {
    const total = history.length;
    const successful = history.filter(h => h.success).length;
    const failed = total - successful;
    const averageDuration = total > 0
      ? history.reduce((sum, h) => sum + h.duration, 0) / total
      : 0;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      averageDuration,
    };
  }, [history]);

  return {
    history,
    addToHistory,
    clearHistory,
    getRecentMigrations,
    getMigrationStats,
  };
}

/**
 * Hook for periodic status checking
 */
export function useMigrationStatusCheck(intervalMs: number = 5000) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      setIsChecking(true);
      try {
        // Check if there are legacy files to migrate
        const files = await PresetMigrator.getLegacyPresetFiles();
        setLastCheck(new Date());
        return files.length > 0;
      } catch {
        return false;
      } finally {
        setIsChecking(false);
      }
    };

    // Initial check
    checkStatus();

    // Set up interval
    const interval = setInterval(checkStatus, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return {
    isChecking,
    lastCheck,
  };
}
