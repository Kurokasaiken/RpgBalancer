import React, { useEffect, useState } from 'react';
import type { CardDefinition, StatDefinition } from '../../balancing/config/types';
import { ConfigurableStat } from './ConfigurableStat';

interface Props {
  card: CardDefinition;
  stats: Record<string, StatDefinition>;
  onEditStat: (statId: string, updates: Partial<StatDefinition>) => void;
  onDeleteStat: (statId: string) => void;
  onAddStat?: () => void;
  newStatId?: string;
  onUpdateCard?: (updates: Partial<CardDefinition>) => void;
  onDeleteCard?: () => void;
  startHeaderInEdit?: boolean;
  availableStats: string[];
  dragListeners?: React.HTMLAttributes<HTMLButtonElement>;
}

export const ConfigurableCard: React.FC<Props> = ({ card, stats, onEditStat, onDeleteStat, onAddStat, newStatId, onUpdateCard, onDeleteCard, startHeaderInEdit, availableStats, dragListeners }) => {
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

  return (
    <div
      className={`rounded-2xl border border-[#384444] bg-gradient-to-br from-[#101e22] via-[#0c1a1c] to-[#050b0f] p-4 shadow-[0_20px_55px_rgba(0,0,0,0.6)] flex flex-col gap-4 transition-all ${
        isEditingHeader ? 'ring-2 ring-amber-400/40 border-amber-400/60' : 'hover:border-amber-400/40'
      }`}
    >
      <div className="flex items-start gap-3 pb-3 border-b border-amber-400/20">
        <button
          type="button"
          className="w-8 h-8 rounded-full border border-[#475758] text-[#aeb8b4] bg-[#0c1517]/80 cursor-grab active:cursor-grabbing hover:text-[#f6f3e4]"
          title="Drag to reorder card"
          {...dragListeners}
        >
          ⋮⋮
        </button>
        <div className="flex flex-1 items-center justify-between min-w-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {isEditingHeader ? (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="relative">
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded border border-[#475758] px-2 py-1 bg-[#0c1517]/90 hover:bg-[#121f22] text-[#f5f0dc]"
                      onClick={() => setShowIconPicker((prev) => !prev)}
                      title="Scegli icona"
                    >
                      <span className="text-lg">{icon || '🂠'}</span>
                      <span className="text-[10px] uppercase tracking-[0.4em] text-[#96aaa6]">Icona</span>
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
              <div className="flex flex-col w-full gap-2">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-[#6da8a0]">
                  <span>Observatory Card</span>
                  <span className="text-[#c7b996] tracking-[0.4em]">registry</span>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-2xl font-display text-[#f5f0dc] flex items-center gap-2">
                    {card.icon && <span className="text-2xl drop-shadow-[0_0_8px_rgba(0,0,0,0.45)]">{card.icon}</span>}
                    <span className="truncate text-[#f5f0dc]" style={displayStyle}>{card.title}</span>
                  </p>
                  <div className="text-right text-[10px] text-[#9bb8b2] leading-tight">
                    <p className="uppercase tracking-[0.4em] text-[#6da8a0]">Stats</p>
                    <p className="text-lg font-display text-[#f5f0dc]">{orderedStats.length}</p>
                  </div>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
                <p className="text-[11px] text-[#aeb8b4]">Configura inline colori, icone e parametri di questa card e delle sue statistiche.</p>
              </div>
            )}
            {card.isCore && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-100 border border-emerald-500/40 tracking-[0.4em] uppercase">
                core
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onUpdateCard && (
              <button
                type="button"
                className={`w-8 h-8 flex items-center justify-center rounded-full border text-xs transition-all ${
                  isEditingHeader
                    ? 'border-amber-400 text-amber-100 bg-amber-500/10 shadow-[0_0_14px_rgba(245,158,11,0.35)]'
                    : 'border-[#475758] text-[#aeb8b4] bg-[#0c1517]/80 hover:text-amber-200'
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
                <span aria-hidden="true">{isEditingHeader ? '✔' : '✎'}</span>
                <span className="sr-only">{isEditingHeader ? 'Salva card' : 'Modifica card'}</span>
              </button>
            )}
            {isEditingHeader && (
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-full border border-[#475758] text-[#aeb8b4] bg-[#0c1517]/80 hover:text-amber-200"
                title="Annulla modifiche"
                onClick={handleHeaderCancel}
              >
                <span aria-hidden="true">✖</span>
                <span className="sr-only">Annulla modifiche</span>
              </button>
            )}
            {isEditingHeader && onDeleteCard && !card.isCore && (
              <div className="relative">
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-red-900/30 text-red-100 border border-red-500/70 hover:bg-red-800/60"
                  title="Elimina card"
                  onClick={() => setShowDeleteConfirm((prev) => !prev)}
                >
                  🗑
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
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {orderedStats.length === 0 && (
          <p className="text-[11px] text-[#aeb8b4] italic">No stats in this card yet.</p>
        )}
        {orderedStats.map((stat) => (
          <ConfigurableStat
            key={stat.id}
            stat={stat}
            onUpdate={(updates) => onEditStat(stat.id, updates)}
            onDelete={() => onDeleteStat(stat.id)}
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
