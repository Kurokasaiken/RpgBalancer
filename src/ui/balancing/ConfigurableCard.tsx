import React, { useState } from 'react';
import type { CardDefinition, StatDefinition } from '../../balancing/config/types';
import { ConfigurableStat } from './ConfigurableStat';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Props for the ConfigurableCard component.
 */
interface Props {
  /**
   * The card definition.
   */
  card: CardDefinition;
  /**
   * A record of stat definitions.
   */
  stats: Record<string, StatDefinition>;
  /**
   * A record of simulation values.
   */
  simValues: Record<string, number>;
  /**
   * A callback function to update the simulation value of a stat.
   * @param statId The ID of the stat.
   * @param value The new simulation value.
   */
  onSimValueChange: (statId: string, value: number) => void;
  /**
   * A callback function to edit a stat.
   * @param statId The ID of the stat.
   * @param updates The updates to apply to the stat.
   */
  onEditStat: (statId: string, updates: Partial<StatDefinition>) => void;
  /**
   * A callback function to delete a stat.
   * @param statId The ID of the stat.
   */
  onDeleteStat: (statId: string) => void;
  /**
   * An optional callback function to reset a stat.
   * @param statId The ID of the stat.
   */
  onResetStat?: (statId: string) => void;
  /**
   * An optional callback function to reset the card.
   */
  onResetCard?: () => void;
  /**
   * An optional callback function to add a new stat.
   */
  onAddStat?: () => void;
  /**
   * An optional callback function to open the stat editor.
   * @param statId The ID of the stat to edit, or undefined to create a new stat.
   */
  onOpenStatEditor?: (statId?: string) => void;
  /**
   * An optional callback function to open the card editor.
   */
  onOpenCardEditor?: () => void;
  /**
   * The ID of the newly added stat, or undefined if no stat has been added.
   */
  newStatId?: string;
  /**
   * An optional callback function to update the card.
   * @param updates The updates to apply to the card.
   */
  onUpdateCard?: (updates: Partial<CardDefinition>) => void;
  /**
   * An optional callback function to delete the card.
   */
  onDeleteCard?: () => void;
  /**
   * Whether the header is in edit mode initially.
   */
  startHeaderInEdit?: boolean;
  /**
   * A list of available stats.
   */
  availableStats: { id: string; label: string }[];
  /**
   * Optional drag listeners for the card.
   */
  dragListeners?: React.HTMLAttributes<HTMLButtonElement>;
  /**
   * A record of dependency highlights.
   */
  dependencyHighlights?: Record<string, boolean>;
  /**
   * A record of error highlights.
   */
  errorHighlights?: Record<string, boolean>;
}

interface SortableStatProps {
  stat: StatDefinition;
  simValues: Record<string, number>;
  onSimValueChange: (statId: string, value: number) => void;
  onEditStat: (statId: string, updates: Partial<StatDefinition>) => void;
  onDeleteStat: (statId: string) => void;
  onResetStat?: (statId: string) => void;
  newStatId?: string;
  availableStats: { id: string; label: string }[];
  canDelete: boolean;
  isDependencyHighlighted?: boolean;
  hasError?: boolean;
  onOpenStatEditor?: (statId?: string) => void;
}

const SortableStat: React.FC<SortableStatProps> = ({
  stat,
  simValues,
  onSimValueChange,
  onEditStat,
  onDeleteStat,
  onResetStat,
  newStatId,
  availableStats,
  canDelete,
  isDependencyHighlighted,
  hasError,
  onOpenStatEditor,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stat.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative z-10">
      <ConfigurableStat
        stat={stat}
        simValue={simValues[stat.id] ?? stat.defaultValue}
        onSimValueChange={(value) => onSimValueChange(stat.id, value)}
        allSimValues={simValues}
        onUpdate={(updates) => onEditStat(stat.id, updates)}
        onDelete={() => onDeleteStat(stat.id)}
        onReset={onResetStat ? () => onResetStat(stat.id) : undefined}
        startInEdit={stat.id === newStatId}
        availableStats={availableStats}
        canDelete={canDelete}
        isDependencyHighlighted={isDependencyHighlighted}
        hasError={hasError}
        dragHandleProps={{ ...attributes, ...listeners }}
        onRequestStatEditor={onOpenStatEditor ? () => onOpenStatEditor(stat.id) : undefined}
      />
    </div>
  );
};

export const ConfigurableCard: React.FC<Props> = ({
  card,
  stats,
  simValues,
  onSimValueChange,
  onEditStat,
  onDeleteStat,
  onResetStat,
  onResetCard,
  onAddStat,
  onOpenStatEditor,
  onOpenCardEditor,
  newStatId,
  onUpdateCard,
  onDeleteCard,
  startHeaderInEdit,
  availableStats,
  dragListeners,
  dependencyHighlights,
  errorHighlights,
}) => {
  const orderedStats = card.statIds.map((id) => stats[id]).filter(Boolean);
  const [isEditingHeader, setIsEditingHeader] = useState(!!startHeaderInEdit);
  const [title, setTitle] = useState(card.title);
  const displayIcon = card.icon || '⚔️';
  const dragHandleProps = !isEditingHeader && dragListeners ? dragListeners : undefined;

  const handleHeaderSave = () => {
    if (!onUpdateCard) { setIsEditingHeader(false); return; }
    const updates: Partial<CardDefinition> = {};
    if (title.trim() !== card.title) updates.title = title.trim();
    if (Object.keys(updates).length > 0) onUpdateCard(updates);
    setIsEditingHeader(false);
  };

  const handleResetCard = () => {
    if (!onResetCard) return;
    onResetCard();
  };

  const handleDeleteCard = () => {
    if (!onDeleteCard) return;
    const confirmDelete = window.confirm(`Eliminare la card "${card.title}"?`);
    if (confirmDelete) onDeleteCard();
  };

  const statsGridClassName = orderedStats.length >= 4 ? 'grid gap-2 grid-cols-1 md:grid-cols-2' : 'grid gap-2 grid-cols-1';

  return (
    <div className={`heroic-card flex flex-col gap-2 transition-all ${
      isEditingHeader ? 'ring-2 ring-(--bronze-glow)/50' : ''
    }`}>
      
      {/* Header in Marmo (heroic-header) */}
      <div className="heroic-header flex items-start gap-2 relative z-10">
        {dragHandleProps && (
          <button type="button" className="mt-0.5 text-(--sienna-shadow) opacity-70 hover:opacity-100 cursor-grab active:cursor-grabbing" {...dragHandleProps}>
            <span className="text-lg">⋮⋮</span>
          </button>
        )}
        
        <div className="flex flex-1 items-center justify-between min-w-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {isEditingHeader ? (
              <input 
                className="bg-black/20 border-b border-(--bronze-aged) font-heroic text-sm px-2 py-1 outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base drop-shadow-md">{displayIcon}</span>
                <p className="font-heroic text-[11px] font-bold tracking-widest uppercase truncate" style={{ color: card.color }}>
                  {card.title}
                </p>
              </div>
            )}
          </div>

          {/* Azioni in Bronzo (btn-heroic) */}
          <div className="flex items-center gap-1">
            <button 
              type="button" 
              className="btn-heroic p-1 text-xs" 
              onClick={() => isEditingHeader ? handleHeaderSave() : setIsEditingHeader(true)}
            >
              {isEditingHeader ? '✔' : '✎'}
            </button>
            {!isEditingHeader && (
              <>
                {onResetCard && (
                  <button type="button" className="btn-heroic p-1 text-xs" onClick={handleResetCard} title="Reset card">
                    ↺
                  </button>
                )}
                {onOpenCardEditor && (
                  <button type="button" className="btn-heroic p-1 text-xs" onClick={onOpenCardEditor} title="Apri editor card">
                    ✹
                  </button>
                )}
                {onDeleteCard && (
                  <button type="button" className="btn-heroic p-1 text-xs text-rose-200 hover:text-rose-50" onClick={handleDeleteCard} title="Elimina card">
                    ✖
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Area Contenuto (Basalto) */}
      <div className="p-3 space-y-2 bg-(--panel-basalt)/50">
        <DndContext collisionDetection={closestCenter} onDragEnd={(e) => {
           const { active, over } = e;
           if (over && active.id !== over.id) {
             const oldIdx = card.statIds.indexOf(active.id as string);
             const newIdx = card.statIds.indexOf(over.id as string);
             onUpdateCard?.({ statIds: arrayMove(card.statIds, oldIdx, newIdx) });
           }
        }}>
          <SortableContext items={card.statIds} strategy={verticalListSortingStrategy}>
            <div className={statsGridClassName}>
              {orderedStats.map((stat) => (
                <SortableStat
                  key={stat.id}
                  stat={stat}
                  simValues={simValues}
                  onSimValueChange={onSimValueChange}
                  onEditStat={(id, updates) => onEditStat(id, updates)}
                  onDeleteStat={(id) => onDeleteStat(id)}
                  onResetStat={onResetStat}
                  newStatId={newStatId}
                  availableStats={availableStats}
                  canDelete={!stat.isCore}
                  isDependencyHighlighted={dependencyHighlights?.[stat.id]}
                  hasError={errorHighlights?.[stat.id]}
                  onOpenStatEditor={onOpenStatEditor}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {onAddStat && (
          <button type="button" onClick={onAddStat} className="w-full py-2 border border-dashed border-(--bronze-aged) text-(--bronze-aged) font-heroic text-[10px] uppercase tracking-widest hover:bg-(--bronze-glow)/5">
            ＋ Aggiungi Stat
          </button>
        )}
      </div>
    </div>
  );
};
