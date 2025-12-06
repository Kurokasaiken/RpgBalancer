import type { SpellConfig, SpellConfigSnapshot } from './types';
import { SpellConfigSchema } from './schemas';
import { DEFAULT_SPELL_CONFIG } from './defaultSpellConfig';

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
   * Load config from localStorage or fall back to defaults.
   */
  static load(): SpellConfig {
    if (this.config) return this.config;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const validated = SpellConfigSchema.parse(parsed);
        this.config = validated;
      } else {
        this.config = { ...DEFAULT_SPELL_CONFIG };
      }
    } catch (error) {
      console.warn('Failed to load spell config, using defaults:', error);
      this.config = { ...DEFAULT_SPELL_CONFIG };
    }

    this.loadHistory();
    return this.config;
  }

  /**
   * Save config and push previous state to history.
   */
  static save(config: SpellConfig, label: string = 'Manual save'): void {
    const result = SpellConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid spell config: ${result.error.message}`);
    }

    this.addToHistory(label);

    this.config = config;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
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
  static undo(): SpellConfig | null {
    if (this.history.length === 0) return null;

    const [latest, ...rest] = this.history;
    this.history = rest;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));

    this.config = latest.config;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    return this.config;
  }

  /**
   * Reset configuration to defaults and push previous state to history.
   */
  static reset(label: string = 'Reset to defaults'): SpellConfig {
    this.addToHistory(label);
    this.config = { ...DEFAULT_SPELL_CONFIG };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    return this.config;
  }

  /**
   * Export current config as formatted JSON string.
   */
  static export(): string {
    const config = this.load();
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import config from JSON string, validate and save.
   */
  static import(json: string, label: string = 'Imported configuration'): SpellConfig {
    const parsed = JSON.parse(json);
    const validated = SpellConfigSchema.parse(parsed);
    this.save(validated, label);
    return validated;
  }

  // --- Internal helpers ---

  private static addToHistory(label: string): void {
    if (!this.config) {
      // Ensure config is initialized before snapshotting
      this.load();
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

    localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
  }

  private static loadHistory(): void {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SpellConfigSnapshot[];
        this.history = Array.isArray(parsed) ? parsed : [];
      } else {
        this.history = [];
      }
    } catch (error) {
      console.warn('Failed to load spell config history:', error);
      this.history = [];
    }
  }
}
