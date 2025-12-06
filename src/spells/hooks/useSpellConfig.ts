import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  SpellConfig,
  SpellConfigSnapshot,
  SpellDefinition,
  SpellCard,
  SpellPreset,
} from '../config/types';
import { SpellConfigStore } from '../config/SpellConfigStore';
import { SpellDefinitionSchema, SpellCardSchema } from '../config/schemas';

export interface ValidationResult {
  success: boolean;
  error?: string;
}

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export interface UseSpellConfigReturn {
  config: SpellConfig;
  history: SpellConfigSnapshot[];
  activePreset: SpellPreset | undefined;

  addSpell: (cardId: string, spell: SpellDefinition) => ValidationResult;
  updateSpell: (spellId: string, updates: Partial<SpellDefinition>) => ValidationResult;
  deleteSpell: (spellId: string) => ValidationResult;

  addCard: (card: Omit<SpellCard, 'isCore' | 'order' | 'spellIds'>) => ValidationResult;
  updateCard: (cardId: string, updates: Partial<SpellCard>) => ValidationResult;
  deleteCard: (cardId: string) => ValidationResult;
  reorderCards: (cardIds: string[]) => void;

  switchPreset: (presetId: string) => ValidationResult;

  undo: () => void;
  canUndo: boolean;

  exportConfig: () => string;
  importConfig: (json: string) => ValidationResult;
  resetConfig: () => void;
  resetToInitialConfig: () => void;
  resetSpellToInitial: (spellId: string) => ValidationResult;
  resetCardToInitial: (cardId: string) => ValidationResult;
}

export function useSpellConfig(): UseSpellConfigReturn {
  const initialConfigRef = useRef<SpellConfig | null>(null);
  const [config, setConfig] = useState<SpellConfig>(() => {
    const loaded = SpellConfigStore.load();
    if (!initialConfigRef.current) {
      initialConfigRef.current = deepClone(loaded);
    }
    return loaded;
  });
  const [history, setHistory] = useState<SpellConfigSnapshot[]>(() => SpellConfigStore.getHistory());

  const refreshState = useCallback(() => {
    setConfig(SpellConfigStore.load());
    setHistory(SpellConfigStore.getHistory());
  }, []);

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
    (next: SpellConfig, label: string) => {
      SpellConfigStore.save(next, label);
      refreshState();
    },
    [refreshState],
  );

  const addSpell = useCallback(
    (cardId: string, spell: SpellDefinition): ValidationResult => {
      const result = SpellDefinitionSchema.safeParse(spell);
      if (!result.success) {
        return { success: false, error: result.error.issues[0]?.message };
      }

      if (config.spells[spell.id]) {
        return { success: false, error: `Spell ID "${spell.id}" already exists` };
      }

      const card = config.cards[cardId];
      if (!card) {
        return { success: false, error: `Card "${cardId}" not found` };
      }

      const next: SpellConfig = {
        ...config,
        spells: { ...config.spells, [spell.id]: spell },
        cards: {
          ...config.cards,
          [cardId]: { ...card, spellIds: [...card.spellIds, spell.id] },
        },
      };

      saveConfig(next, `Added spell: ${spell.name}`);
      return { success: true };
    },
    [config, saveConfig],
  );

  const updateSpell = useCallback(
    (spellId: string, updates: Partial<SpellDefinition>): ValidationResult => {
      const existing = config.spells[spellId];
      if (!existing) {
        return { success: false, error: `Spell "${spellId}" not found` };
      }

      const merged: SpellDefinition = { ...existing, ...updates };
      const result = SpellDefinitionSchema.safeParse(merged);
      if (!result.success) {
        return { success: false, error: result.error.issues[0]?.message };
      }

      const next: SpellConfig = {
        ...config,
        spells: { ...config.spells, [spellId]: merged },
      };

      saveConfig(next, `Updated spell: ${merged.name}`);
      return { success: true };
    },
    [config, saveConfig],
  );

  const deleteSpell = useCallback(
    (spellId: string): ValidationResult => {
      if (!config.spells[spellId]) {
        return { success: false, error: `Spell "${spellId}" not found` };
      }

      const { [spellId]: removed, ...remainingSpells } = config.spells;
      const updatedCards: Record<string, SpellCard> = {};
      Object.entries(config.cards).forEach(([id, card]) => {
        updatedCards[id] = {
          ...card,
          spellIds: card.spellIds.filter((s) => s !== spellId),
        };
      });

      const next: SpellConfig = {
        ...config,
        spells: remainingSpells,
        cards: updatedCards,
      };

      saveConfig(next, `Deleted spell: ${removed.name}`);
      return { success: true };
    },
    [config, saveConfig],
  );

  const addCard = useCallback(
    (card: Omit<SpellCard, 'isCore' | 'order' | 'spellIds'>): ValidationResult => {
      if (config.cards[card.id]) {
        return { success: false, error: `Card ID "${card.id}" already exists` };
      }

      const maxOrder = Math.max(-1, ...Object.values(config.cards).map((c) => c.order));
      const fullCard: SpellCard = {
        ...card,
        isCore: false,
        order: maxOrder + 1,
        spellIds: [],
      };

      const result = SpellCardSchema.safeParse(fullCard);
      if (!result.success) {
        return { success: false, error: result.error.issues[0]?.message };
      }

      const next: SpellConfig = {
        ...config,
        cards: { ...config.cards, [fullCard.id]: fullCard },
      };

      saveConfig(next, `Added card: ${fullCard.title}`);
      return { success: true };
    },
    [config, saveConfig],
  );

  const updateCard = useCallback(
    (cardId: string, updates: Partial<SpellCard>): ValidationResult => {
      const existing = config.cards[cardId];
      if (!existing) {
        return { success: false, error: `Card "${cardId}" not found` };
      }

      const merged: SpellCard = { ...existing, ...updates };
      const result = SpellCardSchema.safeParse(merged);
      if (!result.success) {
        return { success: false, error: result.error.issues[0]?.message };
      }

      const next: SpellConfig = {
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
      const existing = config.cards[cardId];
      if (!existing) {
        return { success: false, error: `Card "${cardId}" not found` };
      }

      const { [cardId]: removed, ...remainingCards } = config.cards;

      const next: SpellConfig = {
        ...config,
        cards: remainingCards,
        spells: { ...config.spells },
      };

      saveConfig(next, `Deleted card: ${removed.title}`);
      return { success: true };
    },
    [config, saveConfig],
  );

  const reorderCards = useCallback(
    (cardIds: string[]): void => {
      const updated: Record<string, SpellCard> = { ...config.cards };
      cardIds.forEach((id, index) => {
        const card = updated[id];
        if (card) {
          updated[id] = { ...card, order: index };
        }
      });

      const next: SpellConfig = {
        ...config,
        cards: updated,
      };

      saveConfig(next, 'Reordered spell cards');
    },
    [config, saveConfig],
  );

  const switchPreset = useCallback(
    (presetId: string): ValidationResult => {
      if (!config.presets[presetId]) {
        return { success: false, error: `Preset "${presetId}" not found` };
      }

      const next: SpellConfig = {
        ...config,
        activePresetId: presetId,
      };

      saveConfig(next, `Switched spell preset: ${presetId}`);
      return { success: true };
    },
    [config, saveConfig],
  );

  const undo = useCallback(() => {
    SpellConfigStore.undo();
    refreshState();
  }, [refreshState]);

  const canUndo = history.length > 0;

  const exportConfig = useCallback(() => SpellConfigStore.export(), []);

  const importConfig = useCallback(
    (json: string): ValidationResult => {
      try {
        SpellConfigStore.import(json);
        refreshState();
        return { success: true };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    },
    [refreshState],
  );

  const resetConfig = useCallback(() => {
    SpellConfigStore.reset();
    refreshState();
  }, [refreshState]);

  const resetToInitialConfig = useCallback(() => {
    if (!initialConfigRef.current) return;
    SpellConfigStore.save(deepClone(initialConfigRef.current), 'Reset to initial snapshot');
    refreshState();
  }, [refreshState]);

  const resetSpellToInitial = useCallback(
    (spellId: string): ValidationResult => {
      const initialSpell = initialConfigRef.current?.spells[spellId];
      if (!initialSpell) {
        return { success: false, error: `Spell "${spellId}" not in initial snapshot` };
      }

      const next: SpellConfig = {
        ...config,
        spells: {
          ...config.spells,
          [spellId]: deepClone(initialSpell),
        },
      };

      saveConfig(next, `Reset spell: ${initialSpell.name}`);
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

      const next: SpellConfig = {
        ...config,
        cards: {
          ...config.cards,
          [cardId]: deepClone(initialCard),
        },
      };

      saveConfig(next, `Reset card: ${initialCard.title}`);
      return { success: true };
    },
    [config, saveConfig],
  );

  const activePreset = config.presets[config.activePresetId];

  return {
    config,
    history,
    activePreset,
    addSpell,
    updateSpell,
    deleteSpell,
    addCard,
    updateCard,
    deleteCard,
    reorderCards,
    switchPreset,
    undo,
    canUndo,
    exportConfig,
    importConfig,
    resetConfig,
    resetToInitialConfig,
    resetSpellToInitial,
    resetCardToInitial,
  };
}
