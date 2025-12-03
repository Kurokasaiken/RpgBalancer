import React, { useEffect, useState } from 'react';
import type { CardDefinition, StatDefinition } from '../../balancing/config/types';
import { ConfigurableStat } from './ConfigurableStat';

interface Props {
  card: CardDefinition;
  stats: Record<string, StatDefinition>;
  onEditStat: (statId: string, updates: Partial<StatDefinition>) => void;
  onDeleteStat: (statId: string) => void;
  onResetStat?: (statId: string) => void;
  onAddStat?: () => void;
  newStatId?: string;
  onUpdateCard?: (updates: Partial<CardDefinition>) => void;
  onDeleteCard?: () => void;
  startHeaderInEdit?: boolean;
  availableStats: string[];
  dragListeners?: React.HTMLAttributes<HTMLButtonElement>;
}

export const ConfigurableCard: React.FC<Props> = ({ card, stats, onEditStat, onDeleteStat, onResetStat, onAddStat, newStatId, onUpdateCard, onDeleteCard, startHeaderInEdit, availableStats, dragListeners }) => {
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
      className={`rounded-2xl border border-[#384444] bg-gradient-to-br from-[#101e22] via-[#0c1a1c] to-[#050b0f] p-2.5 shadow-[0_16px_32px_rgba(0,0,0,0.55)] flex flex-col gap-2 transition-all ${
        isEditingHeader ? 'ring-2 ring-amber-400/40 border-amber-400/60' : 'hover:border-amber-400/40'
      }`}
    >
      <div className="flex items-start gap-2 pb-1.5 border-b border-amber-400/15">
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
                              className={`h-8 w-8 flex items-center justify-center rounded border text-base ${
                                icon === symbol
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
              <div className="flex items-center gap-2 min-w-0 group relative">
                <span className="text-lg drop-shadow-[0_0_8px_rgba(0,0,0,0.55)]" aria-hidden="true">{displayIcon}</span>
                <p className="text-base font-display text-[#f5f0dc] truncate cursor-help" style={displayStyle}>
                  {card.title}
                </p>
                <div className="pointer-events-none absolute left-0 top-full mt-1 w-48 rounded-md bg-[#0c1517] border border-[#c7b996]/40 px-2 py-1 text-[10px] text-[#f6f3e4] opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-10 whitespace-normal">
                  {card.isCore ? `${card.title} · card di sistema` : `Configura ${card.title}`}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isEditingHeader && onDeleteCard && !card.isCore && (
              <div className="relative">
                <button
                  type="button"
                  className="w-5 h-5 flex items-center justify-center rounded bg-red-900/40 border border-red-500/70 text-red-300 hover:text-red-100 hover:bg-red-800/70 leading-none transition-colors"
                  title="Elimina card"
                  onClick={() => setShowDeleteConfirm((prev) => !prev)}
                >
                  <span aria-hidden="true" className="text-sm">🗑</span>
                </button>
                {showDeleteConfirm && (
                  <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-red-500/40 bg-gradient-to-br from-[#1b0202] to-[#360808] p-3 text-[11px] text-[#f5f0dc] shadow-[0_18px_40px_rgba(0,0,0,0.65)] z-20">
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
            {onUpdateCard && (
              <button
                type="button"
                className={`w-5 h-5 flex items-center justify-center rounded transition-all leading-none ${
                  isEditingHeader
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
        {orderedStats.map((stat) => (
          <ConfigurableStat
            key={stat.id}
            stat={stat}
            onUpdate={(updates) => onEditStat(stat.id, updates)}
            onDelete={() => onDeleteStat(stat.id)}
            onReset={onResetStat ? () => onResetStat(stat.id) : undefined}
            startInEdit={stat.id === newStatId}
            availableStats={availableStats}
            canDelete={!stat.isCore}
          />
        ))}
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
