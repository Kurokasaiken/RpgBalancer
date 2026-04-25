import { useState, useCallback, useEffect, useRef } from 'react';
import type { BalancerConfig, CardDefinition, StatDefinition } from '../../../balancing/config/types';
import { BalancerConfigStore } from '../../../balancing/config/BalancerConfigStore';

interface UseBalancerUIOptions {
  autoSave?: boolean;
  debounceMs?: number;
}

interface UseBalancerUIReturn {
  config: BalancerConfig | null;
  isLoading: boolean;
  error: string | null;
  // Card operations
  createCard: (card: Omit<CardDefinition, 'id'>) => Promise<string>;
  updateCard: (cardId: string, updates: Partial<CardDefinition>) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  reorderCards: (cardIds: string[]) => Promise<void>;
  // Stat operations
  createStat: (stat: Omit<StatDefinition, 'id'>) => Promise<string>;
  updateStat: (statId: string, updates: Partial<StatDefinition>) => Promise<void>;
  deleteStat: (statId: string) => Promise<void>;
  resetStat: (statId: string) => Promise<void>;
  // Simulation values
  simValues: Record<string, number>;
  updateSimValue: (statId: string, value: number) => void;
  resetSimValues: () => void;
  // History operations
  undo: () => Promise<BalancerConfig | null>;
  getHistory: () => Array<{ timestamp: number; config: BalancerConfig; description: string }>;
  // Utility
  refresh: () => Promise<void>;
  exportConfig: () => Promise<string>;
  importConfig: (json: string) => Promise<void>;
}

/**
 * Hook for managing Balancer UI state and operations
 * Provides config-driven interface to BalancerConfigStore with debounced auto-save
 */
export const useBalancerUI = (options: UseBalancerUIOptions = {}): UseBalancerUIReturn => {
  const { autoSave = true, debounceMs = 500 } = options;
  
  const [config, setConfig] = useState<BalancerConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simValues, setSimValues] = useState<Record<string, number>>({});
  
  // Debounced save timeout
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial configuration
  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedConfig = await BalancerConfigStore.load();
      setConfig(loadedConfig);
      
      // Initialize sim values from config defaults
      const initialSimValues: Record<string, number> = {};
      Object.entries(loadedConfig.stats).forEach(([id, stat]) => {
        initialSimValues[id] = stat.defaultValue;
      });
      setSimValues(initialSimValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced save function
  const debouncedSave = useCallback(
    (newConfig: BalancerConfig, description: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      if (autoSave) {
        saveTimeoutRef.current = setTimeout(async () => {
          try {
            await BalancerConfigStore.save(newConfig, description);
            setConfig(newConfig);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save configuration');
          }
        }, debounceMs);
      } else {
        // Immediate save if autoSave is disabled
        BalancerConfigStore.save(newConfig, description)
          .then(() => setConfig(newConfig))
          .catch(err => setError(err instanceof Error ? err.message : 'Failed to save configuration'));
      }
    },
    [autoSave, debounceMs]
  );

  // Generate unique ID
  const generateId = useCallback((prefix: string, existingIds: Set<string>): string => {
    let counter = 1;
    let id = `${prefix}_${counter}`;
    while (existingIds.has(id)) {
      counter++;
      id = `${prefix}_${counter}`;
    }
    return id;
  }, []);

  // Card operations
  const createCard = useCallback(async (card: Omit<CardDefinition, 'id'>): Promise<string> => {
    if (!config) throw new Error('No configuration loaded');
    
    const existingIds = new Set(Object.keys(config.cards));
    const cardId = generateId(card.title.toLowerCase().replace(/[^a-z0-9]/g, '_'), existingIds);
    
    const newCard: CardDefinition = {
      ...card,
      id: cardId,
      order: Object.keys(config.cards).length,
    };
    
    const newConfig = {
      ...config,
      cards: {
        ...config.cards,
        [cardId]: newCard,
      },
    };
    
    await debouncedSave(newConfig, `Created card: ${card.title}`);
    return cardId;
  }, [config, generateId, debouncedSave]);

  const updateCard = useCallback(async (cardId: string, updates: Partial<CardDefinition>) => {
    if (!config) throw new Error('No configuration loaded');
    if (!config.cards[cardId]) throw new Error('Card not found');
    
    const newConfig = {
      ...config,
      cards: {
        ...config.cards,
        [cardId]: {
          ...config.cards[cardId],
          ...updates,
        },
      },
    };
    
    await debouncedSave(newConfig, `Updated card: ${cardId}`);
  }, [config, debouncedSave]);

  const deleteCard = useCallback(async (cardId: string) => {
    if (!config) throw new Error('No configuration loaded');
    if (!config.cards[cardId]) throw new Error('Card not found');
    if (config.cards[cardId].isCore) throw new Error('Cannot delete core card');
    
    const { [cardId]: _, ...remainingCards } = config.cards;  
    
    // Reorder remaining cards
    const reorderedCards: Record<string, CardDefinition> = {};
    Object.values(remainingCards)
      .sort((a, b) => a.order - b.order)
      .forEach((card, index) => {
        reorderedCards[card.id] = { ...card, order: index };
      });
    
    const newConfig = {
      ...config,
      cards: reorderedCards,
    };
    
    await debouncedSave(newConfig, `Deleted card: ${cardId}`);
  }, [config, debouncedSave]);

  const reorderCards = useCallback(async (cardIds: string[]) => {
    if (!config) throw new Error('No configuration loaded');
    
    const reorderedCards: Record<string, CardDefinition> = {};
    cardIds.forEach((cardId, index) => {
      if (config.cards[cardId]) {
        reorderedCards[cardId] = {
          ...config.cards[cardId],
          order: index,
        };
      }
    });
    
    const newConfig = {
      ...config,
      cards: reorderedCards,
    };
    
    await debouncedSave(newConfig, 'Reordered cards');
  }, [config, debouncedSave]);

  // Stat operations
  const createStat = useCallback(async (stat: Omit<StatDefinition, 'id'>): Promise<string> => {
    if (!config) throw new Error('No configuration loaded');
    
    const existingIds = new Set(Object.keys(config.stats));
    const statId = generateId(stat.label.toLowerCase().replace(/[^a-z0-9]/g, '_'), existingIds);
    
    const newStat: StatDefinition = {
      ...stat,
      id: statId,
    };
    
    const newConfig = {
      ...config,
      stats: {
        ...config.stats,
        [statId]: newStat,
      },
    };
    
    // Add to sim values
    setSimValues(prev => ({
      ...prev,
      [statId]: stat.defaultValue,
    }));
    
    await debouncedSave(newConfig, `Created stat: ${stat.label}`);
    return statId;
  }, [config, generateId, debouncedSave]);

  const updateStat = useCallback(async (statId: string, updates: Partial<StatDefinition>) => {
    if (!config) throw new Error('No configuration loaded');
    if (!config.stats[statId]) throw new Error('Stat not found');
    
    const newConfig = {
      ...config,
      stats: {
        ...config.stats,
        [statId]: {
          ...config.stats[statId],
          ...updates,
        },
      },
    };
    
    await debouncedSave(newConfig, `Updated stat: ${statId}`);
  }, [config, debouncedSave]);

  const deleteStat = useCallback(async (statId: string) => {
    if (!config) throw new Error('No configuration loaded');
    if (!config.stats[statId]) throw new Error('Stat not found');
    if (config.stats[statId].isCore) throw new Error('Cannot delete core stat');
    
    const { [statId]: _, ...remainingStats } = config.stats;  
    
    // Remove stat from all cards
    const updatedCards: Record<string, CardDefinition> = {};
    Object.entries(config.cards).forEach(([cardId, card]) => {
      updatedCards[cardId] = {
        ...card,
        statIds: card.statIds.filter(id => id !== statId),
      };
    });
    
    const newConfig = {
      ...config,
      stats: remainingStats,
      cards: updatedCards,
    };
    
    // Remove from sim values
    setSimValues(prev => {
      const { [statId]: _, ...remaining } = prev;  
      return remaining;
    });
    
    await debouncedSave(newConfig, `Deleted stat: ${statId}`);
  }, [config, debouncedSave]);

  const resetStat = useCallback(async (statId: string) => {
    if (!config) throw new Error('No configuration loaded');
    if (!config.stats[statId]) throw new Error('Stat not found');
    
    const stat = config.stats[statId];
    const updates: Partial<StatDefinition> = {
      defaultValue: stat.defaultValue,
      // Reset other fields to their original defaults if needed
    };
    
    await updateStat(statId, updates);
    
    // Reset sim value
    setSimValues(prev => ({
      ...prev,
      [statId]: stat.defaultValue,
    }));
  }, [config, updateStat]);

  // Simulation value operations
  const updateSimValue = useCallback((statId: string, value: number) => {
    setSimValues(prev => ({
      ...prev,
      [statId]: value,
    }));
  }, []);

  const resetSimValues = useCallback(() => {
    if (!config) return;
    
    const resetValues: Record<string, number> = {};
    Object.entries(config.stats).forEach(([id, stat]) => {
      resetValues[id] = stat.defaultValue;
    });
    setSimValues(resetValues);
  }, [config]);

  // History operations
  const undo = useCallback(async (): Promise<BalancerConfig | null> => {
    try {
      const revertedConfig = await BalancerConfigStore.undo();
      if (revertedConfig) {
        setConfig(revertedConfig);
        
        // Reset sim values to match new config
        const resetValues: Record<string, number> = {};
        Object.entries(revertedConfig.stats).forEach(([id, stat]) => {
          resetValues[id] = stat.defaultValue;
        });
        setSimValues(resetValues);
      }
      return revertedConfig;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to undo');
      return null;
    }
  }, []);

  const getHistory = useCallback(() => {
    return BalancerConfigStore.getHistory();
  }, []);

  // Utility operations
  const refresh = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  const exportConfig = useCallback(async (): Promise<string> => {
    return await BalancerConfigStore.export();
  }, []);

  const importConfig = useCallback(async (json: string) => {
    try {
      const importedConfig = await BalancerConfigStore.import(json);
      setConfig(importedConfig);
      
      // Reset sim values to match imported config
      const resetValues: Record<string, number> = {};
      Object.entries(importedConfig.stats).forEach(([id, stat]) => {
        resetValues[id] = stat.defaultValue;
      });
      setSimValues(resetValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import configuration');
    }
  }, []);

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    config,
    isLoading,
    error,
    createCard,
    updateCard,
    deleteCard,
    reorderCards,
    createStat,
    updateStat,
    deleteStat,
    resetStat,
    simValues,
    updateSimValue,
    resetSimValues,
    undo,
    getHistory,
    refresh,
    exportConfig,
    importConfig,
  };
};
