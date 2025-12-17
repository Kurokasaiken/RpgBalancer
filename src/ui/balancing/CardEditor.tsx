import React, { useEffect, useState } from 'react';
import type { CardDefinition } from '../../balancing/config/types';
import { useBalancerConfig } from '../../balancing/hooks/useBalancerConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingCard?: CardDefinition;
  onSaveComplete?: (cardId: string) => void;
}

const COLOR_OPTIONS = [
  'text-blue-400',
  'text-emerald-400',
  'text-amber-400',
  'text-purple-400',
  'text-rose-400',
  'text-cyan-400',
];

const ICON_OPTIONS = ['⚔️', '🛡️', '✨', '🧪', '🂠', '📊', '🌟', '🔥'];

export const CardEditor: React.FC<Props> = ({ isOpen, onClose, editingCard, onSaveComplete }) => {
  const { addCard, updateCard, deleteCard } = useBalancerConfig();

  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('text-blue-400');
  const [icon, setIcon] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (editingCard) {
      setId(editingCard.id);
      setTitle(editingCard.title);
      setColor(editingCard.color);
      setIcon(editingCard.icon || '');
    } else {
      setId('');
      setTitle('');
      setColor('text-blue-400');
      setIcon('');
    }
    setError(undefined);
  }, [editingCard, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (editingCard) {
      const res = updateCard(editingCard.id, { title, color, icon: icon || undefined });
      if (!res.success) {
        setError(res.error);
        return;
      }
      onSaveComplete?.(editingCard.id);
      onClose();
      return;
    }

    if (!id.trim()) {
      setError('ID is required for new cards');
      return;
    }

    const res = addCard({ id, title, color, icon: icon || undefined });
    if (!res.success) {
      setError(res.error);
      return;
    }
    onSaveComplete?.(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60">
      <div className="w-full max-w-sm h-full bg-slate-950 border-l border-slate-800 p-4 flex flex-col gap-3">
        <header className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Card Editor</p>
            <h2 className="text-sm font-semibold text-slate-50">
              {editingCard ? 'Modifica card' : 'Nuova card'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-sm"
          >
            ✕
          </button>
        </header>

        {!editingCard && (
          <label className="flex flex-col gap-1 text-xs text-slate-200">
            <span>ID (unico)</span>
            <input
              className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-100"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="es. mitigation"
            />
          </label>
        )}

        <label className="flex flex-col gap-1 text-xs text-slate-200">
          <span>Title</span>
          <input
            className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-100"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="es. Mitigation"
          />
        </label>

        <div className="flex flex-col gap-2 text-xs text-slate-200">
          <div>
            <span className="block mb-1">Icon</span>
            <div className="flex flex-wrap gap-1 mb-1">
              {ICON_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setIcon(opt)}
                  className={`w-7 h-7 flex items-center justify-center rounded border text-base ${
                    icon === opt ? 'border-amber-400 bg-amber-500/20' : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <input
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-100"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="es. 🛡️"
            />
          </div>

          <div>
            <span className="block mb-1">Color</span>
            <div className="flex flex-wrap gap-1">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setColor(opt)}
                  className={`px-2 py-1 rounded border text-[11px] ${
                    color === opt
                      ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                      : 'border-slate-700 bg-slate-900 text-slate-200'
                  }`}
                >
                  <span className={opt.replace('text-', '')}>A</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-[11px] text-red-300">{error}</p>}

        <div className="mt-auto flex justify-between gap-2 pt-2 border-t border-slate-800">
          {editingCard && !editingCard.isCore && (
            <button
              type="button"
              onClick={() => {
                deleteCard(editingCard.id);
                onClose();
              }}
              className="px-2 py-1 text-xs rounded border border-red-600 text-red-200 bg-red-700/30 hover:bg-red-700/60"
            >
              Delete Card
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 text-xs rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-2 py-1 text-xs rounded border border-amber-500 text-amber-100 bg-amber-600/20 hover:bg-amber-600/40"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};
