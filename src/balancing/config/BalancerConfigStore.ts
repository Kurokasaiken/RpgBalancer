import type { BalancerConfig, ConfigSnapshot, StatDefinition } from './types';
import { BalancerConfigSchema } from './schemas';
import { DEFAULT_CONFIG } from './defaultConfig';
import BALANCER_DEFAULT_JSON from './balancer-default-config.json';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { useStorageTelemetryMonitor, generateDataChecksum } from './storageTelemetryMonitor';

const STORAGE_KEY = 'rpg_balancer_config';
const HISTORY_KEY = 'rpg_balancer_config_history';
const MAX_HISTORY = 10;

// Use the JSON config as the new default
const INITIAL_CONFIG: BalancerConfig = BALANCER_DEFAULT_JSON as unknown as BalancerConfig;

export class BalancerConfigStore {
  private static config: BalancerConfig | null = null;
  private static history: ConfigSnapshot[] = [];

  // Static telemetry monitor for storage operations
  private static telemetryMonitor = (() => {
    // Create a telemetry monitor instance for static usage
    const monitor = {
      startOperation: (operation: any, metadata?: any) => {
        // Telemetry tracking logic would go here
        // For now, we'll implement basic logging
        console.debug(`[StorageTelemetry] Starting ${operation}`, metadata);
      },
      completeOperation: (success: boolean, error?: string, additionalMetadata?: any) => {
        console.debug(`[StorageTelemetry] Operation ${success ? 'completed' : 'failed'}`, { error, ...additionalMetadata });
      },
      recordEvent: (type: any, metrics: any, metadata?: any) => {
        console.debug(`[StorageTelemetry] Event ${type}`, { metrics, ...metadata });
      },
    };
    return monitor;
  })();

  /**
   * Produces a deep-cloned configuration to avoid leaking references outside of
   * the store. Helpers such as history snapshots and reset routines rely on
   * fully isolated copies so tests can safely mutate their datasets.
   */
  private static cloneConfig(config: BalancerConfig): BalancerConfig {
    return JSON.parse(JSON.stringify(config)) as BalancerConfig;
  }

  /**
   * Loads the persisted balancer configuration, validating against the schema
   * and merging with defaults if necessary. Falls back to INITIAL_CONFIG when
   * storage is empty or corrupted, persisting that baseline before returning.
   */
  static async load(): Promise<BalancerConfig> {
    if (this.config) return this.config;

    this.telemetryMonitor.startOperation('load', { cacheHit: false });

    try {
      const loaded = await loadData<BalancerConfig>(STORAGE_KEY, INITIAL_CONFIG);
      const dataSize = JSON.stringify(loaded).length;

      const validated = BalancerConfigSchema.parse(loaded);
      this.config = this.mergeWithDefaults(validated);

      // Generate data integrity checksum
      const checksum = generateDataChecksum(this.config);

      this.telemetryMonitor.completeOperation(true, undefined, {
        dataSize,
        checksum,
        configVersion: this.config.version || 'unknown',
      });

      // Record data integrity check event
      this.telemetryMonitor.recordEvent('storage_data_integrity_check', {
        operation: 'load',
        success: true,
        dataSize,
      }, { checksum });

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';

      console.warn('Failed to load balancer config, using defaults:', e);
      this.config = this.cloneConfig(INITIAL_CONFIG);

      this.telemetryMonitor.completeOperation(false, errorMessage, {
        fallbackUsed: true,
        errorType: e instanceof Error ? e.name : 'unknown',
      });

      // Save the defaults so future loads work
      await this.save(this.config, 'Initialize defaults');
    }

    await this.loadHistory();
    return this.config;
  }

  /**
   * Validates and persists a new balancer configuration while snapshotting the
   * previous state for history. Creates a snapshot with timestamp and change
   * description for undo/redo functionality.
   */
  static async save(config: BalancerConfig, description: string): Promise<void> {
    this.telemetryMonitor.startOperation('save', {
      description,
      configVersion: config.version || 'unknown',
    });

    try {
      const dataSize = JSON.stringify(config).length;
      const checksum = generateDataChecksum(config);

      // Validate before saving
      BalancerConfigSchema.parse(config);

      // Create history snapshot if we have a previous config
      if (this.config) {
        await this.saveHistorySnapshot(this.config, description);
      }

      // Save the new configuration
      await saveData(STORAGE_KEY, config);
      this.config = this.cloneConfig(config);

      this.telemetryMonitor.completeOperation(true, undefined, {
        dataSize,
        checksum,
        description,
        historySnapshots: this.history.length,
      });

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';

      this.telemetryMonitor.completeOperation(false, errorMessage, {
        description,
        errorType: e instanceof Error ? e.name : 'unknown',
      });

      throw e; // Re-throw the original error
    }
  }

  private static async saveHistorySnapshot(config: BalancerConfig, description: string): Promise<void> {
    if (!this.config) return;

    const snapshot: ConfigSnapshot = {
      timestamp: Date.now(),
      config: this.cloneConfig(this.config),
      description,
    };

    this.history.unshift(snapshot);
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(0, MAX_HISTORY);
    }

    await saveData(HISTORY_KEY, this.history);
  }

  private static async loadHistory(): Promise<void> {
    try {
      this.history = await loadData<ConfigSnapshot[]>(HISTORY_KEY, []);
    } catch (e) {
      console.warn('Failed to load balancer config history:', e);
      this.history = [];
    }
  }

  static getHistory(): ConfigSnapshot[] {
    return [...this.history];
  }

  /**
   * Returns a deep-cloned snapshot of the last persisted configuration without
   * asynchronous loading. Useful for storage tests that need to verify the raw
   * serialized payload immediately after save operations.
   */
  static getCurrentConfigSnapshot(): BalancerConfig | null {
    return this.config ? this.cloneConfig(this.config) : null;
  }

  /**
   * Serializes the in-memory configuration snapshot to JSON without triggering
   * I/O. This mirrors what would be stored in persistence and is helpful for
   * generating deterministic logs during storage tests.
   *
   * @returns JSON string for the current config, or null if nothing is cached.
   */
  static exportCurrentConfigSnapshot(): string | null {
    const snapshot = this.getCurrentConfigSnapshot();
    return snapshot ? JSON.stringify(snapshot, null, 2) : null;
  }

  /**
   * Returns the most recently loaded configuration without triggering I/O.
   * Useful for synchronous consumers that only need a snapshot.
   */
  static getCachedConfig(): BalancerConfig | null {
    return this.config;
  }

  static async restore(timestamp: number): Promise<BalancerConfig | null> {
    const snapshot = this.history.find((s) => s.timestamp === timestamp);
    if (!snapshot) return null;
    await this.save(snapshot.config, `Restored from ${new Date(timestamp).toISOString()}`);
    return this.config;
  }

  /**
   * Reverts to the most recent snapshot in history and removes it from the
   * stack, updating both config storage and history storage in the process.
   *
   * @returns The reverted configuration, or null when no history remains.
   */
  static async undo(): Promise<BalancerConfig | null> {
    if (this.history.length === 0) return null;

    const previous = this.history[0];
    this.config = JSON.parse(JSON.stringify(previous.config));

    this.history.shift();
    await saveData(HISTORY_KEY, this.history);
    await saveData(STORAGE_KEY, this.config);

    return this.config;
  }

  private static applyStatFlagDefaults(stat: StatDefinition): StatDefinition {
    const baseStat = stat.baseStat ?? (!stat.isDerived && !stat.isPenalty);
    const isDetrimental = stat.isDetrimental ?? !!stat.isPenalty;
    return {
      ...stat,
      baseStat,
      isDetrimental,
    };
  }

  private static mergeWithDefaults(config: BalancerConfig): BalancerConfig {
    // Deep merge stats: preserve imported values, add missing defaults
    const mergedStats: Record<string, StatDefinition> = {};
    
    // First, add all defaults
    Object.entries(DEFAULT_CONFIG.stats).forEach(([id, stat]) => {
      mergedStats[id] = { ...stat };
    });
    
    // Then, override with imported values (preserving them completely)
    Object.entries(config.stats).forEach(([id, stat]) => {
      mergedStats[id] = { ...stat };
    });

    Object.entries(mergedStats).forEach(([id, stat]) => {
      mergedStats[id] = this.applyStatFlagDefaults(stat as StatDefinition);
    });

    // Deep merge cards: preserve imported values, add missing defaults
    const mergedCards: Record<string, typeof DEFAULT_CONFIG.cards[keyof typeof DEFAULT_CONFIG.cards]> = {};
    
    // First, add all defaults
    Object.entries(DEFAULT_CONFIG.cards).forEach(([id, card]) => {
      mergedCards[id] = { ...card };
    });
    
    // Then, override with imported values (preserving them completely)
    Object.entries(config.cards).forEach(([id, card]) => {
      mergedCards[id] = { ...card };
    });

    // Deep merge presets: preserve imported values, add missing defaults
    const mergedPresets: Record<string, typeof DEFAULT_CONFIG.presets[keyof typeof DEFAULT_CONFIG.presets]> = {};
    
    // First, add all defaults
    Object.entries(DEFAULT_CONFIG.presets).forEach(([id, preset]) => {
      mergedPresets[id] = { ...preset };
    });
    
    // Then, override with imported values (preserving them completely)
    Object.entries(config.presets).forEach(([id, preset]) => {
      mergedPresets[id] = { ...preset };
    });

    return {
      ...config,
      stats: mergedStats,
      cards: mergedCards,
      presets: mergedPresets,
    };
  }

  /**
   * Resets the persisted configuration to the shipping defaults defined inside
   * `balancer-default-config.json`, ensuring StorageTestFramework scenarios can
   * start from a pristine baseline. Previous state is snapshotted so undo flows
   * continue to work as expected.
   *
   * @param description - Optional label stored inside history.
   */
  static async resetToDefault(description: string = 'Reset to defaults'): Promise<BalancerConfig> {
    await this.addToHistory(description);
    this.config = this.cloneConfig(INITIAL_CONFIG);
    await saveData(STORAGE_KEY, this.config);
    return this.config;
  }

  /**
   * @deprecated Use {@link resetToDefault} instead. Maintained for backwards
   * compatibility with older hooks/import paths.
   */
  static async reset(): Promise<BalancerConfig> {
    return this.resetToDefault();
  }

  /**
   * Serializes the currently persisted configuration (loading it if needed)
   * into a prettified JSON string suitable for sharing or backups.
   *
   * @returns JSON string representing the active balancer configuration.
   */
  static async export(): Promise<string> {
    this.telemetryMonitor.startOperation('backup', {
      exportType: 'json',
    });

    try {
      const config = await this.load();
      const jsonString = JSON.stringify(config, null, 2);
      const dataSize = jsonString.length;

      this.telemetryMonitor.completeOperation(true, undefined, {
        dataSize,
        exportType: 'json',
        configVersion: config.version || 'unknown',
      });

      // Record backup event
      this.telemetryMonitor.recordEvent('storage_backup_created', {
        operation: 'export',
        success: true,
        dataSize,
      }, { exportFormat: 'json' });

      return jsonString;

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';

      this.telemetryMonitor.completeOperation(false, errorMessage, {
        exportType: 'json',
        errorType: e instanceof Error ? e.name : 'unknown',
      });

      throw e;
    }
  }

  static async import(json: string): Promise<BalancerConfig> {
    this.telemetryMonitor.startOperation('restore', {
      importType: 'json',
      dataSize: json.length,
    });

    try {
      const parsed = JSON.parse(json);
      const dataSize = JSON.stringify(parsed).length;

      const validated = BalancerConfigSchema.parse(parsed);
      const merged = this.mergeWithDefaults(validated);

      await this.save(merged, 'Imported configuration');

      this.telemetryMonitor.completeOperation(true, undefined, {
        dataSize,
        importType: 'json',
        configVersion: merged.version || 'unknown',
      });

      // Record restore event
      this.telemetryMonitor.recordEvent('storage_backup_created', {
        operation: 'import',
        success: true,
        dataSize,
      }, { importFormat: 'json' });

      return merged;

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';

      this.telemetryMonitor.completeOperation(false, errorMessage, {
        importType: 'json',
        errorType: e instanceof Error ? e.name : 'unknown',
        dataSize: json.length,
      });

      throw e;
    }
  }

  
  /**
   * Generates a checksum for configuration integrity verification.
   * Used by StorageTestFramework to detect data corruption.
   * 
   * @param config - Configuration to checksum
   * @returns String checksum
   */
  private static generateChecksum(config: BalancerConfig): string {
    const configString = JSON.stringify(config);
    let hash = 0;
    for (let i = 0; i < configString.length; i++) {
      const char = configString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Updates formula safety configuration
   * @param safetyConfig - New safety configuration
   */
  static async updateFormulaSafety(safetyConfig: BalancerConfig['formulaSafety']): Promise<void> {
    const config = await this.load();
    if (!config) {
      throw new Error('No configuration loaded');
    }

    config.formulaSafety = safetyConfig;
    await this.save(config, 'Updated formula safety settings');
  }

  /**
   * Gets current formula safety configuration
   * @returns Formula safety configuration or default
   */
  static getFormulaSafety(): Required<BalancerConfig>['formulaSafety'] {
    const config = this.config;
    if (!config) {
      // Return default safety settings
      return {
        enableRealTimeValidation: true,
        showSafetyBadges: true,
        maxComplexityLevel: 'medium',
        allowDivisionByVariables: true,
        warnOnPotentialCycles: true,
      };
    }

    return {
      enableRealTimeValidation: config.formulaSafety?.enableRealTimeValidation ?? true,
      showSafetyBadges: config.formulaSafety?.showSafetyBadges ?? true,
      maxComplexityLevel: config.formulaSafety?.maxComplexityLevel ?? 'medium',
      allowDivisionByVariables: config.formulaSafety?.allowDivisionByVariables ?? true,
      warnOnPotentialCycles: config.formulaSafety?.warnOnPotentialCycles ?? true,
    };
  }

  /**
   * Creates a snapshot with formula safety validation
   * @param description - Snapshot description
   * @returns Created snapshot
   */
  static async createSafetySnapshot(description: string): Promise<ConfigSnapshot> {
    const config = await this.load();
    if (!config) {
      throw new Error('No configuration loaded');
    }

    // Validate all formulas before creating snapshot
    const validationResults = await this.validateAllFormulas(config);
    
    const snapshot: ConfigSnapshot = {
      timestamp: Date.now(),
      config: this.cloneConfig(config),
      description: `${description} (Formulas: ${validationResults.valid}/${validationResults.total})`,
      checksum: this.generateChecksum(config),
    };

    this.history.unshift(snapshot);
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(0, MAX_HISTORY);
    }

    await saveData(HISTORY_KEY, this.history);
    return snapshot;
  }

  /**
   * Validates all formulas in the configuration
   * @param config - Configuration to validate
   * @returns Validation results
   */
  private static async validateAllFormulas(config: BalancerConfig): Promise<{
    valid: number;
    total: number;
    errors: string[];
  }> {
    const { validateFormula, createFormulaContext } = await import('./FormulaEngine');
    
    const stats = Object.values(config.stats);
    const context = createFormulaContext(stats);
    const statIds = stats.map(s => s.id);
    
    let valid = 0;
    let total = 0;
    const errors: string[] = [];

    for (const stat of stats) {
      if (stat.formula) {
        total++;
        const result = validateFormula(stat.formula, statIds, context);
        if (result.valid) {
          valid++;
        } else {
          errors.push(`${stat.id}: ${result.error}`);
        }
      }
    }

    return { valid, total, errors };
  }

  /**
   * Gets formula validation history
   * @returns Array of validation snapshots
   */
  static getFormulaHistory(): ConfigSnapshot[] {
    return this.history.filter(snapshot => 
      snapshot.description.includes('Formulas:')
    );
  }

  /**
   * Clears all stored data including configuration and history.
   * Used by StorageTestFramework for clean test environments.
   */
  static async clearAll(): Promise<void> {
    this.telemetryMonitor.startOperation('clear', {
      historyItems: this.history.length,
      hasConfig: !!this.config,
    });

    try {
      this.config = null;
      this.history = [];
      await saveData(STORAGE_KEY, null);
      await saveData(HISTORY_KEY, null);

      this.telemetryMonitor.completeOperation(true, undefined, {
        clearedItems: 'config + history',
      });

      // Record backup/clear event
      this.telemetryMonitor.recordEvent('storage_backup_created', {
        operation: 'clear',
        success: true,
      }, { clearedAll: true });

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';

      this.telemetryMonitor.completeOperation(false, errorMessage, {
        errorType: e instanceof Error ? e.name : 'unknown',
      });

      throw e;
    }
  }

  /**
   * Gets the current storage keys used by BalancerConfigStore.
   * Used by StorageTestFramework for test isolation.
   */
  static getStorageKeys(): string[] {
    return [STORAGE_KEY, HISTORY_KEY];
  }
}

