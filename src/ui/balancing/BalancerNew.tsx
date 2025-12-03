import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CardDefinition, StatDefinition } from '../../balancing/config/types';
import { useBalancerConfig } from '../../balancing/hooks/useBalancerConfig';
import { ConfigurableCard } from './ConfigurableCard';
import { ConfigToolbar } from './ConfigToolbar';

interface SortableCardProps {
  card: CardDefinition;
  stats: Record<string, StatDefinition>;
  simValues: Record<string, number>;
  onSimValueChange: (statId: string, value: number) => void;
  onClickAddStat: (card: CardDefinition) => void;
  onEditStat: (statId: string, updates: Partial<StatDefinition>) => void;
  onDeleteStat: (statId: string) => void;
  onResetStat?: (statId: string) => void;
  onResetCard?: () => void;
  newStatId?: string;
  onUpdateCard: (updates: Partial<CardDefinition>) => void;
  onDeleteCard: () => void;
  startHeaderInEdit?: boolean;
  availableStats: string[];
}

const SortableCard: React.FC<SortableCardProps> = ({
  card,
  stats,
  simValues,
  onSimValueChange,
  onClickAddStat,
  onEditStat,
  onDeleteStat,
  onResetStat,
  onResetCard,
  newStatId,
  onUpdateCard,
  onDeleteCard,
  startHeaderInEdit,
  availableStats,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ConfigurableCard
        card={card}
        stats={stats}
        simValues={simValues}
        onSimValueChange={onSimValueChange}
        onEditStat={onEditStat}
        onDeleteStat={onDeleteStat}
        onResetStat={onResetStat}
        onResetCard={onResetCard}
        newStatId={newStatId}
        onUpdateCard={onUpdateCard}
        onDeleteCard={onDeleteCard}
        startHeaderInEdit={startHeaderInEdit}
        availableStats={availableStats}
        dragListeners={listeners}
      />
      {!card.isHidden && (
        <button
          type="button"
          className="mt-1 w-full text-[10px] px-2 py-1.5 rounded-lg border border-dashed border-amber-400/60 text-amber-200 hover:bg-amber-500/10 tracking-[0.3em] uppercase transition-colors"
          onClick={() => onClickAddStat(card)}
        >
          ＋ Stat
        </button>
      )}
    </div>
  );
};

export const BalancerNew: React.FC = () => {
  const { config, reorderCards, updateStat, deleteStat, addCard, addStat, updateCard, deleteCard, resetStatToInitial, resetCardToInitial, resetToInitialConfig } = useBalancerConfig();

  const [lastCreatedStatId, setLastCreatedStatId] = useState<string | null>(null);
  const [lastCreatedCardId, setLastCreatedCardId] = useState<string | null>(null);
  const [resetConfirmPending, setResetConfirmPending] = useState(false);
  
  // Simulation values - initialized from config defaults
  const [simValues, setSimValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    Object.entries(config.stats).forEach(([id, stat]) => {
      initial[id] = stat.defaultValue;
    });
    return initial;
  });
  
  // Keep simValues in sync with config: whenever config.stats changes
  // (e.g., after import, reset card, reset stat), rebuild the simulation
  // values from the current defaultValue of each stat.
  useEffect(() => {
    const next: Record<string, number> = {};
    Object.entries(config.stats).forEach(([id, stat]) => {
      next[id] = stat.defaultValue;
    });
    setSimValues(next);
  }, [config.stats]);
  
  // Handle simulation value change - this triggers formula recalculation
  const handleSimValueChange = useCallback((statId: string, value: number) => {
    setSimValues(prev => ({ ...prev, [statId]: value }));
  }, []);

  const cards = Object.values(config.cards).sort((a, b) => a.order - b.order);
  const allStatIds = Object.keys(config.stats);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = cards.map((c) => c.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const updated = [...ids];
    const [moved] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, moved);
    reorderCards(updated);
  };

  const handleAddCard = () => {
    const id = `card_${Date.now()}`;
    const result = addCard({ id, title: 'New Card', color: 'text-amber-300', icon: '🂠' });
    if (result.success) {
      setLastCreatedCardId(id);
    }
  };

  const handleAddStat = (card: CardDefinition) => {
    const id = `stat_${Date.now()}`;
    addStat(card.id, {
      id,
      label: 'New Stat',
      description: undefined,
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 0,
      weight: 1,
      isDerived: false,
      formula: undefined,
      bgColor: undefined,
    });
    setLastCreatedStatId(id);
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-[#050509] via-[#0f1a1d] to-[#132427] text-[#f0efe4] p-4">
      <div className="max-w-6xl mx-auto space-y-3">
        <header className="flex items-center justify-between gap-2">
          <h1 className="text-3xl font-display text-[#f6f3e4]">Balancer</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (resetConfirmPending) {
                  resetToInitialConfig();
                  // Reset simValues to defaults
                  const newSimValues: Record<string, number> = {};
                  Object.entries(config.stats).forEach(([id, stat]) => {
                    newSimValues[id] = stat.defaultValue;
                  });
                  setSimValues(newSimValues);
                  setResetConfirmPending(false);
                } else {
                  setResetConfirmPending(true);
                  setTimeout(() => setResetConfirmPending(false), 3000);
                }
              }}
              className={`px-3 py-2 rounded border text-xs tracking-[0.3em] uppercase transition-colors ${
                resetConfirmPending 
                  ? 'border-red-400 text-red-100 bg-red-500/20 animate-pulse' 
                  : 'border-red-500/60 text-red-200 hover:bg-red-500/10'
              }`}
              title={resetConfirmPending ? 'Clicca di nuovo per confermare' : 'Reset all to initial state'}
            >
              {resetConfirmPending ? '⚠ Conferma Reset' : '↺ Reset All'}
            </button>
            <button
              type="button"
              onClick={handleAddCard}
              className="px-4 py-2 rounded-full border border-amber-400/60 text-amber-200 text-xs tracking-[0.4em] uppercase hover:bg-amber-500/10 transition-colors"
            >
              ＋ Nuova Card
            </button>
          </div>
        </header>

        <ConfigToolbar />

        <div className="rounded-2xl border border-[#384444] bg-[#0d181b]/80 p-4 shadow-[0_15px_45px_rgba(0,0,0,0.55)]">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => (
                  <SortableCard
                    key={card.id}
                    card={card}
                    stats={config.stats}
                    simValues={simValues}
                    onSimValueChange={handleSimValueChange}
                    onClickAddStat={handleAddStat}
                    onEditStat={(statId, updates) => updateStat(statId, updates)}
                    onDeleteStat={(statId) => {
                      deleteStat(statId);
                    }}
                    onResetStat={(statId) => {
                      resetStatToInitial(statId);
                    }}
                    onResetCard={() => {
                      resetCardToInitial(card.id);
                    }}
                    newStatId={lastCreatedStatId ?? undefined}
                    onUpdateCard={(updates) => {
                      updateCard(card.id, updates);
                    }}
                    onDeleteCard={() => {
                      deleteCard(card.id);
                    }}
                    startHeaderInEdit={card.id === lastCreatedCardId}
                    availableStats={allStatIds}
                  />
                ))}
                <button
                  type="button"
                  onClick={handleAddCard}
                  className="flex items-center justify-center rounded-2xl border border-dashed border-amber-500/50 text-amber-200 text-xl hover:bg-amber-500/5 min-h-[120px]"
                  title="Add Card"
                >
                  ＋
                </button>
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};
