import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  BalancerConfig,
  BalancerPreset,
  CardDefinition,
  ConfigSnapshot,
  StatDefinition,
} from '../config/types';
import { BalancerConfigStore } from '../config/BalancerConfigStore';
import { StatDefinitionSchema, CardDefinitionSchema } from '../config/schemas';
import { isCoreCard, isCoreStat } from '../config/defaultConfig';
import { validateFormula } from '../config/FormulaEngine';

export interface ValidationResult {
  success: boolean;
  error?: string;
}

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export interface UseBalancerConfigReturn {
  // State
  config: BalancerConfig;
  activePreset: BalancerPreset | undefined;
  history: ConfigSnapshot[];

  // Stat CRUD
  addStat: (cardId: string, stat: Omit<StatDefinition, 'isCore'>) => ValidationResult;
  updateStat: (statId: string, updates: Partial<StatDefinition>) => ValidationResult;
  deleteStat: (statId: string) => ValidationResult;

  // Card CRUD
  addCard: (card: Omit<CardDefinition, 'isCore' | 'order' | 'statIds'>) => ValidationResult;
  updateCard: (cardId: string, updates: Partial<CardDefinition>) => ValidationResult;
  deleteCard: (cardId: string) => ValidationResult;
  reorderCards: (cardIds: string[]) => void;

  // Presets (stub per ora, espandibile)
  switchPreset: (presetId: string) => void;

  // Formula validation
  validateStatFormula: (formula: string) => ReturnType<typeof validateFormula>;

  // History
  undo: () => void;
  canUndo: boolean;

  // Export/Import
  exportConfig: () => string;
  importConfig: (json: string) => ValidationResult;
  resetConfig: () => void;
  resetToInitialConfig: () => void;
  resetCardToInitial: (cardId: string) => ValidationResult;
  resetStatToInitial: (statId: string) => ValidationResult;
}

export function useBalancerConfig(): UseBalancerConfigReturn {
  const initialConfigRef = useRef<BalancerConfig | null>(null);
  const [config, setConfig] = useState<BalancerConfig>(() => {
    const loaded = BalancerConfigStore.load();
    if (!initialConfigRef.current) {
      initialConfigRef.current = deepClone(loaded);
    }
    return loaded;
  });
  const [history, setHistory] = useState<ConfigSnapshot[]>(() => BalancerConfigStore.getHistory());

  const refreshState = useCallback(() => {
    setConfig(BalancerConfigStore.load());
    setHistory(BalancerConfigStore.getHistory());
  }, []);

  // Listen for localStorage changes (from other tabs/windows or import)
  useEffect(() => {
    const handleStorageChange = () => {
      refreshState();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [refreshState]);

  const saveConfig = useCallback(
    (next: BalancerConfig, description: string) => {
      BalancerConfigStore.save(next, description);
      refreshState();
    },
    [refreshState],
  );

  // === STAT CRUD ===
  const addStat = useCallback(
    (cardId: string, stat: Omit<StatDefinition, 'isCore'>): ValidationResult => {
      const fullStat: StatDefinition = { ...stat, isCore: false };

      const result = StatDefinitionSchema.safeParse(fullStat);
      if (!result.success) {
        return { success: false, error: result.error.issues[0]?.message }; 
      }

      if (config.stats[fullStat.id]) {
        return { success: false, error: `Stat ID "${fullStat.id}" already exists` };
      }

      // Enforce unique labels (case-insensitive, trimmed)
      const newLabel = fullStat.label.trim().toLowerCase();
      const existingWithLabel = Object.values(config.stats).find(
        (s) => s.label.trim().toLowerCase() === newLabel,
      );
      if (existingWithLabel) {
        return { success: false, error: `Stat label "${fullStat.label}" is already used` };
      }

      const card = config.cards[cardId];
      if (!card) {
        return { success: false, error: `Card "${cardId}" not found` };
      }

      if (fullStat.isDerived && fullStat.formula) {
        const formulaResult = validateFormula(fullStat.formula, Object.keys(config.stats));
        if (!formulaResult.valid) {
          return { success: false, error: formulaResult.error };
        }
      }

      const next: BalancerConfig = {
        ...config,
        stats: { ...config.stats, [fullStat.id]: fullStat },
        cards: {
          ...config.cards,
          [cardId]: { ...card, statIds: [...card.statIds, fullStat.id] },
        },
      };

      saveConfig(next, `Added stat: ${fullStat.label}`);
      return { success: true };
    },
    [config, saveConfig],
  );

  const updateStat = useCallback(
    (statId: string, updates: Partial<StatDefinition>): ValidationResult => {
      const existing = config.stats[statId];
      if (!existing) {
        return { success: false, error: `Stat "${statId}" not found` };
      }

      if ('isCore' in updates && updates.isCore !== existing.isCore) {
        return { success: false, error: 'Cannot change isCore property' };
      }

      const merged: StatDefinition = { ...existing, ...updates };
      const result = StatDefinitionSchema.safeParse(merged);
      if (!result.success) {
        return { success: false, error: result.error.issues[0]?.message };
      }

      // Enforce unique labels (case-insensitive, trimmed) across all other stats
      const mergedLabel = merged.label.trim().toLowerCase();
      const labelConflict = Object.values(config.stats).some(
        (s) => s.id !== statId && s.label.trim().toLowerCase() === mergedLabel,
      );
      if (labelConflict) {
        return { success: false, error: `Stat label "${merged.label}" is already used` };
      }

      if (merged.isDerived && merged.formula) {
        const availableStats = Object.keys(config.stats).filter((id) => id !== statId);
        const formulaResult = validateFormula(merged.formula, availableStats);
        if (!formulaResult.valid) {
          return { success: false, error: formulaResult.error };
        }
      }

      const next: BalancerConfig = {
        ...config,
        stats: { ...config.stats, [statId]: merged },
      };

      saveConfig(next, `Updated stat: ${merged.label}`);
      return { success: true };
    },
    [config, saveConfig],
  );

  const deleteStat = useCallback(
    (statId: string): ValidationResult => {
      if (isCoreStat(statId)) {
        return { success: false, error: 'Cannot delete core stat' };
      }

      if (!config.stats[statId]) {
        return { success: false, error: `Stat "${statId}" not found` };
      }

      const usedIn = Object.values(config.stats)
        .filter((s) => s.isDerived && s.formula && s.formula.includes(statId))
        .map((s) => s.label);

      if (usedIn.length > 0) {
        return {
          success: false,
          error: `Stat is used in formulas: ${usedIn.join(', ')}`,
        };
      }

      const { [statId]: removed, ...remainingStats } = config.stats;
      const updatedCards: Record<string, CardDefinition> = {};
      Object.entries(config.cards).forEach(([id, card]) => {
        updatedCards[id] = {
          ...card,
          statIds: card.statIds.filter((s) => s !== statId),
        };
      });

      const next: BalancerConfig = {
        ...config,
        stats: remainingStats,
        cards: updatedCards,
      };

      saveConfig(next, `Deleted stat: ${removed.label}`);
      return { success: true };
    },
    [config, saveConfig],
  );

  // === CARD CRUD ===
  const addCard = useCallback(
    (card: Omit<CardDefinition, 'isCore' | 'order' | 'statIds'>): ValidationResult => {
      if (config.cards[card.id]) {
        return { success: false, error: `Card ID "${card.id}" already exists` };
      }

      const maxOrder = Math.max(-1, ...Object.values(config.cards).map((c) => c.order));
      const fullCard: CardDefinition = {
        ...card,
        isCore: false,
        order: maxOrder + 1,
        statIds: [],
      };

      const result = CardDefinitionSchema.safeParse(fullCard);
      if (!result.success) {
        return { success: false, error: result.error.issues[0]?.message };
      }

      const next: BalancerConfig = {
        ...config,
        cards: { ...config.cards, [fullCard.id]: fullCard },
      };

      saveConfig(next, `Added card: ${fullCard.title}`);
      return { success: true };
    },
    [config, saveConfig],
  );

  const updateCard = useCallback(
    (cardId: string, updates: Partial<CardDefinition>): ValidationResult => {
      const existing = config.cards[cardId];
      if (!existing) {
        return { success: false, error: `Card "${cardId}" not found` };
      }

      if ('isCore' in updates && updates.isCore !== existing.isCore) {
        return { success: false, error: 'Cannot change isCore property' };
      }

      const merged: CardDefinition = { ...existing, ...updates };
      const result = CardDefinitionSchema.safeParse(merged);
      if (!result.success) {
        return { success: false, error: result.error.issues[0]?.message };
      }

      const next: BalancerConfig = {
        ...config,
        cards: { ...config.cards, [cardId]: merged },
      };

      saveConfig(next, `Updated card: ${merged.title}`);
      return { success: true };
    },
    [config, saveConfig],
  );

  const deleteCard = useCallback(
    (cardId: string): ValidationResult => {
      if (isCoreCard(cardId)) {
        return { success: false, error: 'Cannot delete core card' };
      }

      const existing = config.cards[cardId];
      if (!existing) {
        return { success: false, error: `Card "${cardId}" not found` };
      }

      const statsToDelete = existing.statIds.filter((id) => !isCoreStat(id));

      const remainingStats = Object.fromEntries(
        Object.entries(config.stats).filter(([id]) => !statsToDelete.includes(id)),
      );

      const { [cardId]: removedCard, ...remainingCards } = config.cards;

      const next: BalancerConfig = {
        ...config,
        stats: remainingStats,
        cards: remainingCards,
      };

      saveConfig(next, `Deleted card: ${removedCard.title}`);
      return { success: true };
    },
    [config, saveConfig],
  );

  const reorderCards = useCallback(
    (cardIds: string[]): void => {
      const updated: Record<string, CardDefinition> = { ...config.cards };
      cardIds.forEach((id, index) => {
        const card = updated[id];
        if (card) {
          updated[id] = { ...card, order: index };
        }
      });

      const next: BalancerConfig = {
        ...config,
        cards: updated,
      };

      saveConfig(next, 'Reordered cards');
    },
    [config, saveConfig],
  );

  // === PRESETS (stub minimal, da estendere dopo) ===
  const switchPreset = useCallback(
    (presetId: string) => {
      if (!config.presets[presetId]) return;
      const next: BalancerConfig = {
        ...config,
        activePresetId: presetId,
      };
      saveConfig(next, `Switched preset: ${presetId}`);
    },
    [config, saveConfig],
  );

  // === HISTORY ===
  const undo = useCallback(() => {
    BalancerConfigStore.undo();
    refreshState();
  }, [refreshState]);

  const canUndo = history.length > 0;

  // === EXPORT / IMPORT / RESET ===
  const exportConfig = useCallback(() => BalancerConfigStore.export(), []);

  const importConfig = useCallback((json: string): ValidationResult => {
    try {
      BalancerConfigStore.import(json);
      refreshState();
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }, [refreshState]);

  const resetConfig = useCallback(() => {
    BalancerConfigStore.reset();
    refreshState();
  }, [refreshState]);

  const resetToInitialConfig = useCallback(() => {
    if (!initialConfigRef.current) return;
    BalancerConfigStore.save(deepClone(initialConfigRef.current), 'Reset to initial snapshot');
    refreshState();
  }, [refreshState]);

  const resetStatToInitial = useCallback(
    (statId: string): ValidationResult => {
      const initialStat = initialConfigRef.current?.stats[statId];
      if (!initialStat) {
        return { success: false, error: `Stat "${statId}" not in initial snapshot` };
      }

      const next: BalancerConfig = {
        ...config,
        stats: {
          ...config.stats,
          [statId]: deepClone(initialStat),
        },
      };

      saveConfig(next, `Reset stat: ${initialStat.label}`);
      return { success: true };
    },
    [config, saveConfig],
  );

  const resetCardToInitial = useCallback(
    (cardId: string): ValidationResult => {
      const initialCard = initialConfigRef.current?.cards[cardId];
      if (!initialCard) {
        return { success: false, error: `Card "${cardId}" not in initial snapshot` };
      }

      const updatedStats: Record<string, StatDefinition> = { ...config.stats };
      initialCard.statIds.forEach((statId) => {
        const initialStat = initialConfigRef.current?.stats[statId];
        if (initialStat) {
          updatedStats[statId] = deepClone(initialStat);
        }
      });

      const next: BalancerConfig = {
        ...config,
        cards: {
          ...config.cards,
          [cardId]: deepClone(initialCard),
        },
        stats: updatedStats,
      };

      saveConfig(next, `Reset card: ${initialCard.title}`);
      return { success: true };
    },
    [config, saveConfig],
  );

  const activePreset = config.presets[config.activePresetId];

  return {
    config,
    activePreset,
    history,
    addStat,
    updateStat,
    deleteStat,
    addCard,
    updateCard,
    deleteCard,
    reorderCards,
    switchPreset,
    validateStatFormula: (formula: string) => validateFormula(formula, Object.keys(config.stats)),
    undo,
    canUndo,
    exportConfig,
    importConfig,
    resetConfig,
    resetToInitialConfig,
    resetCardToInitial,
    resetStatToInitial,
  };
}
