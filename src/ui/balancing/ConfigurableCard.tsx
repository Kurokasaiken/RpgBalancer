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
  onOpenCardEditor?: () => void;
  newStatId?: string;
  onUpdateCard?: (updates: Partial<CardDefinition>) => void;
  onDeleteCard?: () => void;
  startHeaderInEdit?: boolean;
  availableStats: { id: string; label: string }[];
  dragListeners?: React.HTMLAttributes<HTMLButtonElement>;
  dependencyHighlights?: Record<string, boolean>;
  errorHighlights?: Record<string, boolean>;
}

interface SortableStatProps {
  stat: StatDefinition;
  simValues: Record<string, number>;
  onSimValueChange: (statId: string, value: number) => void;
  onEditStat: (updates: Partial<StatDefinition>) => void;
  onDeleteStat: () => void;
  onResetStat?: () => void;
  newStatId?: string;
  availableStats: { id: string; label: string }[];
  canDelete: boolean;
  isDependencyHighlighted?: boolean;
  hasError?: boolean;
  onOpenStatEditor?: (statId: string) => void;
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
    <div ref={setNodeRef} style={style}>
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
        onRequestStatEditor={
          onOpenStatEditor
            ? () => onOpenStatEditor(stat.id)
            : undefined
        }
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

  const iconLibrary = [
    '🂠', '⚔️', '🛡️', '✨', '🔥', '❄️', '🌊', '🌿', '💀', '🐉', '🦊', '🪽', '🧠', '⚙️', '🜂', '🜄', '🜃', '🜁', '🜚', '🔮',
    '🪄', '🎲', '🏹', '⚒️', '⚗️', '📜', '🏰', '🪙', '💎', '🌀', '🌙', '⭐', '🪬', '🩸', '🦂', '🐺', '👁️', '🪐', '⚡', '🌑',
  ];

  const [showIconPicker, setShowIconPicker] = useState(false);
  const displayIcon = icon || card.icon || '⚔️';
  const dragHandleProps = !isEditingHeader && dragListeners ? dragListeners : undefined;

  useEffect(() => {
    if (!isEditingHeader) {
      setShowIconPicker(false);
    }
  }, [isEditingHeader]);

  const resetHeaderDraft = () => {
    setTitle(card.title);
    setColor(card.color);
    setIcon(card.icon || '');
  };

  const handleHeaderSave = () => {
    if (!onUpdateCard) {
      setIsEditingHeader(false);
      setShowIconPicker(false);
      setShowDeleteConfirm(false);
      return;
    }
    const updates: Partial<CardDefinition> = {};
    if (title.trim() && title.trim() !== card.title) updates.title = title.trim();
    if (color !== card.color) updates.color = color;
    if (icon !== (card.icon || '')) updates.icon = icon || undefined;
    if (Object.keys(updates).length > 0) {
      onUpdateCard(updates);
    }
    setIsEditingHeader(false);
    setShowIconPicker(false);
    setShowDeleteConfirm(false);
  };

  const handleHeaderCancel = () => {
    resetHeaderDraft();
    setIsEditingHeader(false);
    setShowIconPicker(false);
    setShowDeleteConfirm(false);
  };

  const isCustomColor = color?.startsWith('#');
  const displayStyle = isCustomColor ? { color } : undefined;
  const isHidden = !!card.isHidden;

  const hasManyStats = orderedStats.length >= 4;
  const statsGridClassName = hasManyStats ? 'grid gap-2 grid-cols-1 md:grid-cols-2' : 'grid gap-2 grid-cols-1';

  const handleStatDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = card.statIds.indexOf(active.id as string);
    const newIndex = card.statIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const newStatIds = arrayMove(card.statIds, oldIndex, newIndex);
    onUpdateCard?.({ statIds: newStatIds });
  };

  if (isHidden && !isEditingHeader) {
    return (
      <div className="rounded-2xl border border-[#384444] bg-gradient-to-br from-[#050b0f] via-[#060b0d] to-[#050509] p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.6)] flex items-center justify-between gap-2 opacity-80">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg" aria-hidden="true">{displayIcon}</span>
          <p className="text-sm font-display text-[#cfd5cf] truncate" style={displayStyle}>
            {card.title}
          </p>
        </div>
        {onUpdateCard && (
          <button
            type="button"
            className="w-6 h-6 flex items-center justify-center text-[#c9a227] hover:text-[#e6c547] transition-colors"
            title="Mostra card"
            onClick={() => onUpdateCard({ isHidden: false })}
          >
            <span aria-hidden="true" className="text-sm">👁</span>
            <span className="sr-only">Mostra card</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`default-card flex flex-col gap-2 transition-all ${isEditingHeader
          ? 'ring-2 ring-indigo-400/40 border-indigo-400/70 shadow-[0_0_25px_rgba(129,140,248,0.6)]'
          : 'hover:border-indigo-400/60 hover:shadow-[0_0_18px_rgba(129,140,248,0.45)]'
        }`}
    >

      <div className="flex items-start gap-2 pb-1.5 border-b border-slate-700/60 relative z-10">
        {dragHandleProps && (
          <button
            type="button"
            className="mt-0.5 w-5 h-5 rounded text-[#c9a227] hover:text-[#e6c547] cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center leading-none"
            title="Trascina per riordinare"
            {...dragHandleProps}
          >
            <span aria-hidden="true" className="text-base">⋮⋮</span>
            <span className="sr-only">Trascina card</span>
          </button>
        )}
        <div className="flex flex-1 items-center justify-between min-w-0 gap-2">

          {/* LEFT: Delete Button (Only in Edit Mode) */}
          <div className="flex items-center gap-1">
            {isEditingHeader && onDeleteCard && !card.isCore && (
              <div className="relative">
                <button
                  type="button"
                  className="w-5 h-5 flex items-center justify-center rounded-full bg-red-900/40 border border-red-500/70 text-red-300 hover:text-red-100 hover:bg-red-800/70 leading-none transition-colors"
                  title="Elimina card"
                  onClick={() => setShowDeleteConfirm((prev) => !prev)}
                >
                  <span aria-hidden="true" className="text-xs">🗑</span>
                </button>
                {showDeleteConfirm && (
                  <div className="absolute left-0 top-full mt-1 w-52 rounded-xl border border-red-500/40 bg-gradient-to-br from-[#1b0202] to-[#360808] p-3 text-[11px] text-[#f5f0dc] shadow-[0_18px_40px_rgba(0,0,0,0.65)] z-20">
                    <p className="font-semibold text-red-200 mb-2 tracking-[0.2em] uppercase">Eliminare questa card?</p>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="px-2 py-1 rounded border border-[#475758] text-[#aeb8b4] hover:bg-[#111c1e]"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Annulla
                      </button>
                      <button
                        type="button"
                        className="px-2 py-1 rounded bg-red-600/80 text-white hover:bg-red-500"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          onDeleteCard();
                        }}
                      >
                        Conferma
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 min-w-0">
              {isEditingHeader ? (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative">
                      <button
                        type="button"
                        className="flex items-center justify-center rounded border border-[#475758] px-2 py-1 bg-[#0c1517]/90 hover:bg-[#121f22] text-[#f5f0dc]"
                        onClick={() => setShowIconPicker((prev) => !prev)}
                        title="Scegli icona"
                      >
                        <span className="text-lg">{icon || '⚔️'}</span>
                      </button>
                      {showIconPicker && (
                        <div className="absolute z-20 mt-2 w-56 rounded-lg border border-[#475758] bg-gradient-to-br from-[#101e22] to-[#091113] p-3 shadow-[0_20px_45px_rgba(0,0,0,0.65)]">
                          <p className="text-[10px] uppercase tracking-[0.3em] text-[#aeb8b4] mb-1">Seleziona icona</p>
                          <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto">
                            {iconLibrary.map((symbol) => (
                              <button
                                key={symbol}
                                type="button"
                                onClick={() => {
                                  setIcon(symbol);
                                  setShowIconPicker(false);
                                }}
                                className={`h-8 w-8 flex items-center justify-center rounded border text-base ${icon === symbol
                                    ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                                    : 'border-[#384444] bg-[#0f1a1d] text-[#f5f0dc] hover:border-amber-400/60'
                                  }`}
                              >
                                {symbol}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      className="flex-1 min-w-[140px] text-sm rounded bg-[#0c1517] border border-[#475758] px-3 py-1.5 text-[#f5f0dc] placeholder:text-[#5a6f72]"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Nome card"
                      autoFocus={startHeaderInEdit}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#aeb8b4]">
                    <label className="flex items-center gap-1">
                      <span>HEX</span>
                      <input
                        type="text"
                        className="w-24 rounded bg-[#0c1517] border border-[#475758] px-2 py-1 text-[11px] text-[#f5f0dc] placeholder:text-[#5a6f72]"
                        placeholder="#c9a227"
                        value={isCustomColor ? color : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setColor(value.startsWith('#') ? value : `#${value.replace('#', '')}`);
                        }}
                      />
                    </label>
                    <input
                      type="color"
                      className="w-10 h-10 rounded border border-[#475758] bg-transparent"
                      value={isCustomColor ? color : '#c9a227'}
                      onChange={(e) => setColor(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 min-w-0 group relative pl-1">
                  <span className="text-base text-indigo-200 drop-shadow-[0_0_10px_rgba(129,140,248,0.8)]" aria-hidden="true">{displayIcon}</span>
                  <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-100 truncate cursor-help" style={displayStyle}>
                    {card.title}
                  </p>
                  <div className="pointer-events-none absolute left-0 top-full mt-1 w-48 rounded-md bg-[#0c1517] border border-[#c7b996]/40 px-2 py-1 text-[10px] text-[#f6f3e4] opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-10 whitespace-normal">
                    {card.isCore ? `${card.title} · card di sistema` : `Configura ${card.title}`}
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* RIGHT: Actions */}
          <div className="flex items-center gap-1">
            {!isEditingHeader && onResetCard && (
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center rounded text-indigo-300 hover:text-indigo-100 transition-colors leading-none"
                title="Modifica stat"
                onClick={() => {
                  if (onResetCard) onResetCard();
                  // Force update SIM values for all non-derived stats
                  card.statIds.forEach((statId) => {
                    const s = stats[statId];
                    if (s && !s.isDerived) {
                      onSimValueChange(statId, s.defaultValue);
                    }
                  });
                }}
              >
                <span aria-hidden="true" className="text-sm">↺</span>
                <span className="sr-only">Reset card</span>
              </button>
            )}

            {isEditingHeader && (
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center rounded text-[#c9a227] hover:text-[#e6c547] leading-none"
                title="Annulla modifiche"
                onClick={handleHeaderCancel}
              >
                <span aria-hidden="true" className="text-sm">✖</span>
                <span className="sr-only">Annulla modifiche</span>
              </button>
            )}
            {onOpenCardEditor && !isEditingHeader && (
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center rounded text-[#c9a227] hover:text-[#e6c547] transition-colors leading-none"
                title="Apri editor card"
                onClick={onOpenCardEditor}
              >
                <span aria-hidden="true" className="text-sm">⚙</span>
                <span className="sr-only">Apri editor card</span>
              </button>
            )}
            {onUpdateCard && (
              <button
                type="button"
                className={`w-5 h-5 flex items-center justify-center rounded transition-all leading-none ${isEditingHeader
                    ? 'text-amber-100'
                    : 'text-[#c9a227] hover:text-[#e6c547]'
                  }`}
                title={isEditingHeader ? 'Salva card' : 'Modifica card'}
                onClick={() => {
                  if (isEditingHeader) {
                    handleHeaderSave();
                  } else {
                    setIsEditingHeader(true);
                  }
                }}
              >
                <span aria-hidden="true" className="text-sm">{isEditingHeader ? '✔' : '✎'}</span>
                <span className="sr-only">{isEditingHeader ? 'Salva card' : 'Modifica card'}</span>
              </button>
            )}
            {!isEditingHeader && (
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center rounded text-[#c9a227] hover:text-[#e6c547] transition-colors leading-none"
                title="Nascondi card"
                onClick={() => onUpdateCard?.({ isHidden: true })}
              >
                <span aria-hidden="true" className="text-sm">👁</span>
                <span className="sr-only">Nascondi card</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {orderedStats.length === 0 && (
          <p className="text-[11px] text-[#aeb8b4] italic">No stats in this card yet.</p>
        )}
        <DndContext collisionDetection={closestCenter} onDragEnd={handleStatDragEnd}>
          <SortableContext items={orderedStats.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className={statsGridClassName}>
              {orderedStats.map((stat) => {
                const canDeleteStat = !stat.isCore && !stat.isLocked;
                return (
                  <SortableStat
                    key={stat.id}
                    stat={stat}
                    simValues={simValues}
                    onSimValueChange={onSimValueChange}
                    onEditStat={(updates) => onEditStat(stat.id, updates)}
                    onDeleteStat={() => onDeleteStat(stat.id)}
                    onResetStat={onResetStat ? () => onResetStat(stat.id) : undefined}
                    newStatId={newStatId}
                    availableStats={availableStats}
                    canDelete={canDeleteStat}
                    isDependencyHighlighted={dependencyHighlights?.[stat.id]}
                    hasError={errorHighlights?.[stat.id]}
                    onOpenStatEditor={onOpenStatEditor}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
        {onAddStat && (
          <button
            type="button"
            onClick={onAddStat}
            className="mt-2 w-full text-[11px] px-3 py-3 rounded-xl border border-dashed border-amber-400/60 text-amber-100 hover:bg-amber-500/10 tracking-[0.3em] uppercase"
          >
            ＋ Aggiungi Stat
          </button>
        )}
      </div>
    </div>
  );
};
