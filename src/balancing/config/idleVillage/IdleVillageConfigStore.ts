// src/balancing/config/idleVillage/IdleVillageConfigStore.ts
// Local-storage backed store for IdleVillageConfig, mirroring BalancerConfigStore
// but scoped to the Idle Village meta-game.

import type { IdleVillageConfig, IdleVillageConfigSnapshot } from './types';
import { IdleVillageConfigSchema } from './schemas';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from './defaultConfig';

const STORAGE_KEY = 'idle_village_config';
const HISTORY_KEY = 'idle_village_config_history';
const MAX_HISTORY = 10;

export class IdleVillageConfigStore {
  private static config: IdleVillageConfig | null = null;
  private static history: IdleVillageConfigSnapshot[] = [];

  static load(): IdleVillageConfig {
    if (this.config) return this.config;

    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        const validated = IdleVillageConfigSchema.parse(parsed);
        this.config = this.mergeWithDefaults(validated);
      } else {
        this.config = { ...DEFAULT_IDLE_VILLAGE_CONFIG };
      }
    } catch (e) {
      // Fallback to defaults if anything goes wrong
      console.warn('Failed to load IdleVillageConfig, using defaults:', e);
      this.config = { ...DEFAULT_IDLE_VILLAGE_CONFIG };
    }

    this.loadHistory();
    return this.config;
  }

  static save(config: IdleVillageConfig, description = 'Manual save'): void {
    const result = IdleVillageConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid IdleVillageConfig: ${result.error.message}`);
    }

    this.addToHistory(description);
    this.config = config;

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      try {
        window.dispatchEvent(new CustomEvent('idleVillageConfigUpdated'));
      } catch {
        // Swallow errors from CustomEvent in non-browser environments.
      }
    }
  }

  private static addToHistory(description: string): void {
    if (!this.config) return;

    const snapshot: IdleVillageConfigSnapshot = {
      timestamp: Date.now(),
      config: JSON.parse(JSON.stringify(this.config)),
      description,
    };

    this.history.unshift(snapshot);
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(0, MAX_HISTORY);
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    }
  }

  private static loadHistory(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.history = [];
      return;
    }

    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      this.history = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Failed to load IdleVillageConfig history:', e);
      this.history = [];
    }
  }

  static getHistory(): IdleVillageConfigSnapshot[] {
    return [...this.history];
  }

  static undo(): IdleVillageConfig | null {
    if (this.history.length === 0) return null;

    const previous = this.history[0];
    this.config = JSON.parse(JSON.stringify(previous.config));

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      this.history.shift();
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    }

    return this.config;
  }

  static reset(): IdleVillageConfig {
    this.addToHistory('Reset IdleVillageConfig to defaults');
    this.config = { ...DEFAULT_IDLE_VILLAGE_CONFIG };

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    }

    return this.config;
  }

  static export(): string {
    return JSON.stringify(this.load(), null, 2);
  }

  static import(json: string): IdleVillageConfig {
    const parsed = JSON.parse(json);
    const validated = IdleVillageConfigSchema.parse(parsed);
    const merged = this.mergeWithDefaults(validated);
    this.save(merged, 'Imported IdleVillageConfig');
    return merged;
  }

  private static mergeWithDefaults(config: IdleVillageConfig): IdleVillageConfig {
    return {
      ...DEFAULT_IDLE_VILLAGE_CONFIG,
      ...config,
      resources: {
        ...DEFAULT_IDLE_VILLAGE_CONFIG.resources,
        ...config.resources,
      },
      activities: {
        ...DEFAULT_IDLE_VILLAGE_CONFIG.activities,
        ...config.activities,
      },
      mapSlots: {
        ...DEFAULT_IDLE_VILLAGE_CONFIG.mapSlots,
        ...config.mapSlots,
      },
      buildings: {
        ...DEFAULT_IDLE_VILLAGE_CONFIG.buildings,
        ...config.buildings,
      },
      founders: {
        ...DEFAULT_IDLE_VILLAGE_CONFIG.founders,
        ...config.founders,
      },
      variance: {
        difficultyCategories: {
          ...DEFAULT_IDLE_VILLAGE_CONFIG.variance.difficultyCategories,
          ...(config.variance?.difficultyCategories ?? {}),
        },
        rewardCategories: {
          ...DEFAULT_IDLE_VILLAGE_CONFIG.variance.rewardCategories,
          ...(config.variance?.rewardCategories ?? {}),
        },
      },
      globalRules: {
        ...DEFAULT_IDLE_VILLAGE_CONFIG.globalRules,
        ...config.globalRules,
        injuryTiers: {
          ...(DEFAULT_IDLE_VILLAGE_CONFIG.globalRules.injuryTiers ?? {}),
          ...(config.globalRules?.injuryTiers ?? {}),
        },
        deathRules:
          DEFAULT_IDLE_VILLAGE_CONFIG.globalRules.deathRules || config.globalRules?.deathRules
            ? {
                ...(DEFAULT_IDLE_VILLAGE_CONFIG.globalRules.deathRules ?? {}),
                ...(config.globalRules?.deathRules ?? {}),
              }
            : undefined,
      },
    };
  }
}
