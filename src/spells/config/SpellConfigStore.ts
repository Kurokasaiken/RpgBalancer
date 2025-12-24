import type { SpellConfig, SpellConfigSnapshot } from './types';
import { SpellConfigSchema } from './schemas';
import { DEFAULT_SPELL_CONFIG } from './defaultSpellConfig';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

const STORAGE_KEY = 'rpg_spell_config';
const HISTORY_KEY = 'rpg_spell_config_history';
const MAX_HISTORY = 10;

/**
 * Store for the config-driven Spell Creator.
 *
 * NOTE: this store manages only the Spell Creator configuration
 * (cards, presets, spell metadata). Combat/balancing logic continues
 * to use `Spell` + `spellBalancingConfig` as single source of truth.
 */
export class SpellConfigStore {
  private static config: SpellConfig | null = null;
  private static history: SpellConfigSnapshot[] = [];

  /**
   * Load config from storage or fall back to defaults.
   */
  static async load(): Promise<SpellConfig> {
    if (this.config) return this.config;

    try {
      const loaded = await loadData<SpellConfig>(STORAGE_KEY, null);
      if (loaded) {
        const validated = SpellConfigSchema.parse(loaded);
        this.config = validated;
      } else {
        this.config = { ...DEFAULT_SPELL_CONFIG };
      }
    } catch (error) {
      console.warn('Failed to load spell config, using defaults:', error);
      this.config = { ...DEFAULT_SPELL_CONFIG };
    }

    await this.loadHistory();
    return this.config;
  }

  /**
   * Save config and push previous state to history.
   */
  static async save(config: SpellConfig, label: string = 'Manual save'): Promise<void> {
    const result = SpellConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid spell config: ${result.error.message}`);
    }

    await this.addToHistory(label);

    this.config = config;
    await saveData(STORAGE_KEY, config);
  }

  /**
   * Get a shallow copy of the current history stack.
   */
  static getHistory(): SpellConfigSnapshot[] {
    return [...this.history];
  }

  /**
   * Undo: restore the most recent snapshot from history.
   */
  static async undo(): Promise<SpellConfig | null> {
    if (this.history.length === 0) return null;

    const [latest, ...rest] = this.history;
    this.history = rest;
    await saveData(HISTORY_KEY, this.history);

    this.config = latest.config;
    await saveData(STORAGE_KEY, this.config);
    return this.config;
  }

  /**
   * Reset configuration to defaults and push previous state to history.
   */
  static async reset(label: string = 'Reset to defaults'): Promise<SpellConfig> {
    await this.addToHistory(label);
    this.config = { ...DEFAULT_SPELL_CONFIG };
    await saveData(STORAGE_KEY, this.config);
    return this.config;
  }

  /**
   * Export current config as formatted JSON string.
   */
  static async export(): Promise<string> {
    const config = await this.load();
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import config from JSON string, validate and save.
   */
  static async import(json: string, label: string = 'Imported configuration'): Promise<SpellConfig> {
    const parsed = JSON.parse(json);
    const validated = SpellConfigSchema.parse(parsed);
    await this.save(validated, label);
    return validated;
  }

  // --- Internal helpers ---

  private static async addToHistory(label: string): Promise<void> {
    if (!this.config) {
      // Ensure config is initialized before snapshotting
      await this.load();
    }
    if (!this.config) return;

    const snapshot: SpellConfigSnapshot = {
      timestamp: Date.now(),
      label,
      config: JSON.parse(JSON.stringify(this.config)),
    };

    this.history.unshift(snapshot);
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(0, MAX_HISTORY);
    }

    await saveData(HISTORY_KEY, this.history);
  }

  private static async loadHistory(): Promise<void> {
    try {
      this.history = await loadData<SpellConfigSnapshot[]>(HISTORY_KEY, []);
    } catch (error) {
      console.warn('Failed to load spell config history:', error);
      this.history = [];
    }
  }
}
