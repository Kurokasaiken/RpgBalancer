import React, { useState } from 'react';
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
  onClickAddStat: (card: CardDefinition) => void;
  onEditStat: (statId: string, updates: Partial<StatDefinition>) => void;
  onDeleteStat: (statId: string) => void;
  newStatId?: string;
  onUpdateCard: (updates: Partial<CardDefinition>) => void;
  onDeleteCard: () => void;
  startHeaderInEdit?: boolean;
  availableStats: string[];
}

const SortableCard: React.FC<SortableCardProps> = ({
  card,
  stats,
  onClickAddStat,
  onEditStat,
  onDeleteStat,
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
        onEditStat={onEditStat}
        onDeleteStat={onDeleteStat}
        newStatId={newStatId}
        onUpdateCard={onUpdateCard}
        onDeleteCard={onDeleteCard}
        startHeaderInEdit={startHeaderInEdit}
        availableStats={availableStats}
        dragListeners={listeners}
      />
      <button
        type="button"
        className="mt-2 w-full text-[11px] px-3 py-2 rounded-xl border border-dashed border-amber-400/60 text-amber-200 hover:bg-amber-500/10 tracking-[0.3em] uppercase"
        onClick={() => onClickAddStat(card)}
      >
        ＋ Add Stat
      </button>
    </div>
  );
};

export const BalancerNew: React.FC = () => {
  const { config, reorderCards, updateStat, deleteStat, addCard, addStat, updateCard, deleteCard } = useBalancerConfig();

  const [lastCreatedStatId, setLastCreatedStatId] = useState<string | null>(null);
  const [lastCreatedCardId, setLastCreatedCardId] = useState<string | null>(null);

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
    <div className="min-h-full bg-gradient-to-br from-[#050509] via-[#0f1a1d] to-[#132427] text-[#f0efe4] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="rounded-2xl border border-[#3b4b4d] bg-[#0c1517]/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
          <p className="text-xs uppercase tracking-[0.6em] text-[#8db3a5]">Gilded Observatory</p>
          <div className="flex flex-wrap items-end justify-between gap-4 mt-2">
            <div>
              <h1 className="text-4xl font-display text-[#f6f3e4]">Balancer · New</h1>
              <p className="text-sm text-[#cfdfd8] mt-2 max-w-2xl">
                Editor completo per card e stat con inline editing, drag & drop, salvataggio JSON e import/export. Ogni card eredita lo stile
                "Orbital Budget" direttamente dal playground.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddCard}
              className="px-4 py-2 rounded-full border border-amber-400/60 text-amber-200 text-xs tracking-[0.4em] uppercase hover:bg-amber-500/10"
            >
              ＋ Nuova Card
            </button>
          </div>
        </header>

        <ConfigToolbar />

        <div className="rounded-2xl border border-[#384444] bg-[#0d181b]/80 p-5 shadow-[0_15px_45px_rgba(0,0,0,0.55)]">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#6da8a0]">Card Registry</p>
              <p className="text-sm text-[#aeb8b4]">{cards.length} card configurabili · {Object.keys(config.stats).length} stats totali</p>
            </div>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => (
                  <SortableCard
                    key={card.id}
                    card={card}
                    stats={config.stats}
                    onClickAddStat={handleAddStat}
                    onEditStat={(statId, updates) => updateStat(statId, updates)}
                    onDeleteStat={(statId) => {
                      deleteStat(statId);
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
