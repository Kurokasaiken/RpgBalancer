import React, { useEffect, useState } from 'react';
import type { CardDefinition, StatDefinition } from '../../balancing/config/types';
import { ConfigurableStat } from './ConfigurableStat';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  card: CardDefinition;
  stats: Record<string, StatDefinition>;
  simValues: Record<string, number>;
  onSimValueChange: (statId: string, value: number) => void;
  onEditStat: (statId: string, updates: Partial<StatDefinition>) => void;
  onDeleteStat: (statId: string) => void;
  onResetStat?: (statId: string) => void;
  onResetCard?: () => void;
  onAddStat?: () => void;
  onOpenStatEditor?: (statId?: string) => void;
  onOpenCardEditor?: (statId?: string) => void;
  newStatId?: string;
  onUpdateCard?: (updates: Partial<CardDefinition>) => void;
  onDeleteCard?: () => void;
  startHeaderInEdit?: boolean;
  availableStats: { id: string; label: string }[];
  dragListeners?: React.HTMLAttributes<HTMLButtonElement>;
  dependencyHighlights?: Record<string, boolean>;
  errorHighlights?: Record<string, boolean>;
}

const SortableStat: React.FC<any> = ({
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
        onUpdate={onEditStat}
        onDelete={onDeleteStat}
        onReset={onResetStat}
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
  const [color, setColor] = useState(card.color);
  const [icon, setIcon] = useState(card.icon || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const iconLibrary = ['⚔️', '🛡️', '✨', '🔥', '❄️', '🌊', '🌿', '💀', '🐉', '🔮', '🏹', '⚒️', '📜', '🏰', '🪙', '💎'];
  const displayIcon = icon || card.icon || '⚔️';
  const dragHandleProps = !isEditingHeader && dragListeners ? dragListeners : undefined;

  const handleHeaderSave = () => {
    if (!onUpdateCard) { setIsEditingHeader(false); return; }
    const updates: Partial<CardDefinition> = {};
    if (title.trim() !== card.title) updates.title = title.trim();
    if (color !== card.color) updates.color = color;
    if (icon !== (card.icon || '')) updates.icon = icon || undefined;
    if (Object.keys(updates).length > 0) onUpdateCard(updates);
    setIsEditingHeader(false);
  };

  const statsGridClassName = orderedStats.length >= 4 ? 'grid gap-2 grid-cols-1 md:grid-cols-2' : 'grid gap-2 grid-cols-1';

  return (
    <div className={`heroic-card flex flex-col gap-2 transition-all ${
      isEditingHeader ? 'ring-2 ring-[var(--bronze-glow)]/50' : ''
    }`}>
      
      {/* Header in Marmo (heroic-header) */}
      <div className="heroic-header flex items-start gap-2 relative z-10">
        {dragHandleProps && (
          <button type="button" className="mt-0.5 text-[var(--sienna-shadow)] opacity-70 hover:opacity-100 cursor-grab active:cursor-grabbing" {...dragHandleProps}>
            <span className="text-lg">⋮⋮</span>
          </button>
        )}
        
        <div className="flex flex-1 items-center justify-between min-w-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {isEditingHeader ? (
              <input 
                className="bg-black/20 border-b border-[var(--bronze-aged)] font-heroic text-sm px-2 py-1 outline-none"
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
            {!isEditingHeader && onUpdateCard && (
              <button type="button" className="btn-heroic p-1 text-xs" onClick={() => onUpdateCard({ isHidden: true })}>
                👁
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Area Contenuto (Basalto) */}
      <div className="p-3 space-y-2 bg-[var(--panel-basalt)]/50">
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
                  onEditStat={(u: any) => onEditStat(stat.id, u)}
                  onDeleteStat={() => onDeleteStat(stat.id)}
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
          <button type="button" onClick={onAddStat} className="w-full py-2 border border-dashed border-[var(--bronze-aged)] text-[var(--bronze-aged)] font-heroic text-[10px] uppercase tracking-widest hover:bg-[var(--bronze-glow)]/5">
            ＋ Aggiungi Stat
          </button>
        )}
      </div>
    </div>
  );
};
