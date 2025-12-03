import type { BalancerConfig, ConfigSnapshot } from './types';
import { BalancerConfigSchema } from './schemas';
import { DEFAULT_CONFIG } from './defaultConfig';

const STORAGE_KEY = 'rpg_balancer_config';
const HISTORY_KEY = 'rpg_balancer_config_history';
const MAX_HISTORY = 10;

export class BalancerConfigStore {
  private static config: BalancerConfig | null = null;
  private static history: ConfigSnapshot[] = [];

  static load(): BalancerConfig {
    if (this.config) return this.config;

    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        const validated = BalancerConfigSchema.parse(parsed);
        this.config = this.mergeWithDefaults(validated);
      } else {
        this.config = { ...DEFAULT_CONFIG };
      }
    } catch (e) {
      console.warn('Failed to load balancer config, using defaults:', e);
      this.config = { ...DEFAULT_CONFIG };
    }

    this.loadHistory();
    return this.config;
  }

  static save(config: BalancerConfig, description: string = 'Manual save'): void {
    const result = BalancerConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid balancer config: ${result.error.message}`);
    }

    this.addToHistory(description);
    this.config = config;

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      this.history.shift();
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    }

    return this.config;
  }

  private static mergeWithDefaults(config: BalancerConfig): BalancerConfig {
    // Deep merge stats to preserve all properties including formulas
    const mergedStats: Record<string, any> = { ...DEFAULT_CONFIG.stats };
    Object.entries(config.stats).forEach(([id, stat]) => {
      mergedStats[id] = {
        ...(DEFAULT_CONFIG.stats[id] || {}),
        ...stat,
      };
    });

    // Deep merge cards
    const mergedCards: Record<string, any> = { ...DEFAULT_CONFIG.cards };
    Object.entries(config.cards).forEach(([id, card]) => {
      mergedCards[id] = {
        ...(DEFAULT_CONFIG.cards[id] || {}),
        ...card,
      };
    });

    // Deep merge presets
    const mergedPresets: Record<string, any> = { ...DEFAULT_CONFIG.presets };
    Object.entries(config.presets).forEach(([id, preset]) => {
      mergedPresets[id] = {
        ...(DEFAULT_CONFIG.presets[id] || {}),
        ...preset,
      };
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
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
