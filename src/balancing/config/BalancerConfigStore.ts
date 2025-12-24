import type { BalancerConfig, ConfigSnapshot, StatDefinition } from './types';
import { BalancerConfigSchema } from './schemas';
import { DEFAULT_CONFIG } from './defaultConfig';
import BALANCER_DEFAULT_JSON from './balancer-default-config.json';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

const STORAGE_KEY = 'rpg_balancer_config';
const HISTORY_KEY = 'rpg_balancer_config_history';
const MAX_HISTORY = 10;

// Use the JSON config as the new default
const INITIAL_CONFIG: BalancerConfig = BALANCER_DEFAULT_JSON as unknown as BalancerConfig;

// Track the last known localStorage state to detect external changes
let lastStorageState: string | null = null;

export class BalancerConfigStore {
  private static config: BalancerConfig | null = null;
  private static history: ConfigSnapshot[] = [];

  /**
   * Check if localStorage has been modified externally (e.g., from another tab)
   */
  private static hasExternalChange(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const current = localStorage.getItem(STORAGE_KEY);
    if (current !== lastStorageState) {
      lastStorageState = current;
      return true;
    }
    return false;
  }

  static async load(): Promise<BalancerConfig> {
    if (this.config) return this.config;

    try {
      const loaded = await loadData<BalancerConfig>(STORAGE_KEY, INITIAL_CONFIG);
      const validated = BalancerConfigSchema.parse(loaded);
      this.config = this.mergeWithDefaults(validated);
    } catch (e) {
      console.warn('Failed to load balancer config, using defaults:', e);
      this.config = { ...INITIAL_CONFIG };
      // Save the defaults so future loads work
      await this.save(this.config, 'Initialize defaults');
    }

    await this.loadHistory();
    return this.config;
  }

  static async save(config: BalancerConfig, description: string = 'Manual save'): Promise<void> {
    const result = BalancerConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid balancer config: ${result.error.message}`);
    }

    await this.addToHistory(description);
    this.config = config;

    await saveData(STORAGE_KEY, config);
  }

  private static addToHistory(description: string): void {
    if (!this.config) return;

    const snapshot: ConfigSnapshot = {
      timestamp: Date.now(),
      config: JSON.parse(JSON.stringify(this.config)),
      description,
    };

    this.history.unshift(snapshot);
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(0, MAX_HISTORY);
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    }
  }

  private static loadHistory(): void {
    if (typeof localStorage === 'undefined') {
      this.history = [];
      return;
    }
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      this.history = raw ? (JSON.parse(raw) as ConfigSnapshot[]) : [];
    } catch (e) {
      console.warn('Failed to load balancer config history:', e);
      this.history = [];
    }
  }

  static getHistory(): ConfigSnapshot[] {
    return [...this.history];
  }

  static restore(timestamp: number): BalancerConfig | null {
    const snapshot = this.history.find((s) => s.timestamp === timestamp);
    if (!snapshot) return null;
    this.save(snapshot.config, `Restored from ${new Date(timestamp).toISOString()}`);
    return this.config;
  }

  static undo(): BalancerConfig | null {
    if (this.history.length === 0) return null;

    const previous = this.history[0];
    this.config = JSON.parse(JSON.stringify(previous.config));

    if (typeof localStorage !== 'undefined') {
      const serialized = JSON.stringify(this.config);
      localStorage.setItem(STORAGE_KEY, serialized);
      lastStorageState = serialized;
      this.history.shift();
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    }

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

  static reset(): BalancerConfig {
    this.addToHistory('Reset to defaults');
    this.config = { ...DEFAULT_CONFIG };
    if (typeof localStorage !== 'undefined') {
      const serialized = JSON.stringify(this.config);
      localStorage.setItem(STORAGE_KEY, serialized);
      lastStorageState = serialized;
    }
    return this.config;
  }

  static export(): string {
    return JSON.stringify(this.load(), null, 2);
  }

  static import(json: string): BalancerConfig {
    const parsed = JSON.parse(json);
    const validated = BalancerConfigSchema.parse(parsed);
    const merged = this.mergeWithDefaults(validated);
    this.save(merged, 'Imported configuration');
    return merged;
  }
}

