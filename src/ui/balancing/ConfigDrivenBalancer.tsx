import React, { useState, useCallback, useMemo } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { ConfigurableCard } from './ConfigurableCard';
import { StatEditor } from './components/StatEditor';
import { FormulaEditor } from './components/FormulaEditor';
import { ConfigToolbar } from './ConfigToolbar';
import { useBalancerUI } from './hooks/useBalancerUI';
import type { StatDefinition } from '../../balancing/config/types';

/**
 * Enhanced Balancer UI with config-driven architecture
 * Integrates BalancerConfigStore with drag & drop cards, stat editing, and formula management
 */
export const ConfigDrivenBalancer: React.FC = () => {
  const {
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
  } = useBalancerUI({ autoSave: true, debounceMs: 500 });

  // UI State
  const [isStatEditorOpen, setStatEditorOpen] = useState(false);
  const [isFormulaEditorOpen, setFormulaEditorOpen] = useState(false);
  const [editingStatId, setEditingStatId] = useState<string | null>(null);

  // Get sorted cards
  const cards = useMemo(
    () => (config ? Object.values(config.cards).sort((a, b) => a.order - b.order) : []),
    [config]
  );
  const visibleCards = useMemo(() => cards.filter(card => !card.isHidden), [cards]);
  const coreCards = useMemo(() => cards.filter(card => card.isCore), [cards]);
  const customCards = useMemo(() => cards.filter(card => !card.isCore), [cards]);
  
  // Available stats
  const statDefinitions = useMemo(() => Object.values(config?.stats ?? {}), [config]);
  const availableStatOptions = useMemo(
    () => statDefinitions.map(stat => ({ id: stat.id, label: stat.label })),
    [statDefinitions]
  );

  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !config) return;

    const cardIds = cards.map(c => c.id);
    const oldIndex = cardIds.indexOf(active.id as string);
    const newIndex = cardIds.indexOf(over.id as string);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...cardIds];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    
    await reorderCards(reordered);
  }, [cards, config, reorderCards]);

  // Card operations
  const handleCreateCard = useCallback(async () => {
    if (!config) return;
    
    const newCard = {
      title: 'New Card',
      color: '#1f2937',
      statIds: [],
      isCore: false,
      order: cards.length,
    };
    
    try {
      await createCard(newCard);
    } catch (err) {
      console.error('Failed to create card:', err);
    }
  }, [config, cards.length, createCard]);
  
  const handleDeleteCard = useCallback(
    async (cardId: string) => {
      try {
        await deleteCard(cardId);
      } catch (err) {
        console.error('Failed to delete card:', err);
      }
    },
    [deleteCard],
  );

  // Stat operations
  const handleCreateStat = useCallback(async (cardId: string) => {
    if (!config) return;
    
    const newStat = {
      label: 'New Stat',
      type: 'number' as const,
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 50,
      weight: 1,
      isCore: false,
      isDerived: false,
      bgColor: '#1f2937',
      isLocked: false,
      isHidden: false,
      isPenalty: false,
      baseStat: true,
      isDetrimental: false,
    };
    
    try {
      const statId = await createStat(newStat);
      
      // Add stat to card
      const card = config.cards[cardId];
      if (card) {
        await updateCard(cardId, {
          statIds: [...card.statIds, statId]
        });
      }
      
      setEditingStatId(statId);
      setStatEditorOpen(true);
    } catch (err) {
      console.error('Failed to create stat:', err);
    }
  }, [config, createStat, updateCard]);
  
  const handleEditStat = useCallback((statId: string) => {
    setEditingStatId(statId);
    setStatEditorOpen(true);
  }, []);

  const handleDeleteStat = useCallback(async (statId: string) => {
    try {
      await deleteStat(statId);
    } catch (err) {
      console.error('Failed to delete stat:', err);
    }
  }, [deleteStat]);

  const handleResetStat = useCallback(async (statId: string) => {
    try {
      await resetStat(statId);
    } catch (err) {
      console.error('Failed to reset stat:', err);
    }
  }, [resetStat]);

  // Formula editor
  const handleEditFormula = useCallback((statId: string) => {
    setEditingStatId(statId);
    setFormulaEditorOpen(true);
  }, []);

  // Get editing data
  const editingStat = editingStatId && config?.stats[editingStatId];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-slate-400">Loading Balancer...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  // No config state
  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-slate-400">No configuration available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <ConfigToolbar />

        {/* Additional Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-200">Config-Driven Balancer</h1>
            <p className="text-slate-400">Drag & drop cards • Edit stats • Manage formulas</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateCard}
              className="px-3 py-2 text-sm rounded border border-indigo-500 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              New Card
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-slate-200">{cards.length}</div>
            <div className="text-slate-400 text-sm">Total Cards</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-slate-200">{coreCards.length}</div>
            <div className="text-slate-400 text-sm">Core Cards</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-slate-200">{customCards.length}</div>
            <div className="text-slate-400 text-sm">Custom Cards</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="text-2xl font-bold text-slate-200">{Object.keys(config.stats).length}</div>
            <div className="text-slate-400 text-sm">Total Stats</div>
          </div>
        </div>

        {/* Cards Grid */}
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleCards.map(card => card.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleCards.map((card) => (
                <ConfigurableCard
                  key={card.id}
                  card={card}
                  stats={config.stats}
                  simValues={simValues}
                  onSimValueChange={updateSimValue}
                  onEditStat={(statId, updates) => {
                    if (updates.isDerived) {
                      handleEditFormula(statId);
                    } else {
                      handleEditStat(statId);
                    }
                  }}
                  onDeleteStat={handleDeleteStat}
                  onResetStat={handleResetStat}
                  onUpdateCard={(updates) => updateCard(card.id, updates)}
                  onAddStat={() => handleCreateStat(card.id)}
                  onOpenStatEditor={(statId) => statId && handleEditStat(statId)}
                  onDeleteCard={() => handleDeleteCard(card.id)}
                  availableStats={availableStatOptions}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Empty State */}
        {visibleCards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">No cards created yet</div>
            <button
              onClick={handleCreateCard}
              className="px-4 py-2 rounded border border-indigo-500 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Your First Card
            </button>
          </div>
        )}

        {/* Hidden Cards Section */}
        {cards.some(card => card.isHidden) && (
          <div className="border-t border-slate-700 pt-6">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Hidden Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.filter(card => card.isHidden).map((card) => (
                <ConfigurableCard
                  key={card.id}
                  card={card}
                  stats={config.stats}
                  simValues={simValues}
                  onSimValueChange={updateSimValue}
                  onEditStat={(statId, updates) => {
                    if (updates.isDerived) {
                      handleEditFormula(statId);
                    } else {
                      handleEditStat(statId);
                    }
                  }}
                  onDeleteStat={handleDeleteStat}
                  onResetStat={handleResetStat}
                  onUpdateCard={(updates) => updateCard(card.id, updates)}
                  onAddStat={() => handleCreateStat(card.id)}
                  onOpenStatEditor={(statId) => statId && handleEditStat(statId)}
                  onDeleteCard={() => handleDeleteCard(card.id)}
                  availableStats={availableStatOptions}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stat Editor Modal */}
      {isStatEditorOpen && editingStat && (
        <StatEditor
          stat={editingStat}
          availableIds={Object.keys(config.stats)}
          onSave={async (statId: string, updates: Partial<StatDefinition>) => {
            await updateStat(statId, updates);
            setStatEditorOpen(false);
            setEditingStatId(null);
          }}
          onCancel={() => {
            setStatEditorOpen(false);
            setEditingStatId(null);
          }}
          mode="edit"
        />
      )}

      {/* Formula Editor Modal */}
      {isFormulaEditorOpen && editingStat && (
        <FormulaEditor
          stat={editingStat}
          availableStats={statDefinitions}
          onSave={async (statId: string, formula: string) => {
            await updateStat(statId, { formula });
            setFormulaEditorOpen(false);
            setEditingStatId(null);
          }}
          onCancel={() => {
            setFormulaEditorOpen(false);
            setEditingStatId(null);
          }}
          mode={editingStatId ? 'edit' : 'create'}
        />
      )}
    </div>
  );
};
