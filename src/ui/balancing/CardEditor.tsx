import React, { useMemo, useState } from 'react';
import type { CardDefinition } from '../../balancing/config/types';
import { useBalancerConfig } from '../../balancing/hooks/useBalancerConfig';

/**
 * Props for the CardEditor component.
 */
interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingCard?: CardDefinition;
  onSaveComplete?: (cardId: string, mode: 'create' | 'edit') => void;
  onNavigateToFormulaSafety?: (cardId: string) => void;
}

const COLOR_OPTIONS = [
  'text-amber-300',
  'text-emerald-300',
  'text-rose-300',
  'text-orange-200',
  'text-lime-200',
  'text-red-300',
];

const ICON_OPTIONS = ['⚔️', '🛡️', '✨', '🧪', '🂠', '📊', '🌟', '🔥'];

export const CardEditor: React.FC<Props> = ({ isOpen, onClose, editingCard, onSaveComplete, onNavigateToFormulaSafety }) => {
  const formKey = useMemo(() => editingCard?.id ?? 'new', [editingCard]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60">
      <CardEditorBody
        key={formKey}
        editingCard={editingCard}
        onClose={onClose}
        onSaveComplete={onSaveComplete}
        onNavigateToFormulaSafety={onNavigateToFormulaSafety}
      />
    </div>
  );
};

interface CardEditorBodyProps {
  editingCard?: CardDefinition;
  onClose: () => void;
  onSaveComplete?: (cardId: string, mode: 'create' | 'edit') => void;
  onNavigateToFormulaSafety?: (cardId: string) => void;
}

const CardEditorBody: React.FC<CardEditorBodyProps> = ({ editingCard, onClose, onSaveComplete, onNavigateToFormulaSafety }) => {
  const { addCard, updateCard, deleteCard } = useBalancerConfig();
  const [id, setId] = useState(() => editingCard?.id ?? '');
  const [title, setTitle] = useState(() => editingCard?.title ?? '');
  const [color, setColor] = useState(() => editingCard?.color ?? 'text-amber-300');
  const [icon, setIcon] = useState(() => editingCard?.icon ?? '');
  const [error, setError] = useState<string | undefined>(undefined);

  const inputClass =
    'w-full rounded-md border border-(--bronze-aged)/40 bg-black/30 px-3 py-2 text-sm text-(--marble-ivory) font-sans placeholder:text-(--marble-ivory)/40 focus:outline-none focus:ring-1 focus:ring-(--bronze-aged)';
  const labelClass =
    'flex flex-col gap-1 text-[10px] uppercase tracking-[0.2em] text-(--marble-ivory)/70 font-sans';

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
      onSaveComplete?.(editingCard.id, 'edit');
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
    onSaveComplete?.(id, 'create');
    onClose();
  };

  return (
    <div className="heroic-side-menu w-full max-w-sm h-full overflow-y-auto px-4 py-6">
      <header className="flex items-center justify-between pb-3 border-b border-white/5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-(--sienna-shadow)">Card Editor</p>
            <h2 className="text-sm font-semibold text-(--marble-ivory)">
              {editingCard ? 'Modifica card' : 'Nuova card'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-(--marble-ivory)/70 hover:text-(--marble-ivory) text-base transition-colors"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
          <div>
            <div className="heroic-menu-title">Identità Card</div>
            <div className="heroic-menu-item flex flex-col gap-3 font-sans text-sm">
              {!editingCard && (
                <label className={labelClass}>
                  <span>ID (unico)</span>
                  <input
                    className={inputClass}
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="es. mitigation"
                  />
                </label>
              )}

              <label className={labelClass}>
                <span>Title</span>
                <input
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="es. Mitigation"
                />
              </label>
            </div>
          </div>

          <div>
            <div className="heroic-menu-title">Icona e Colore</div>
            <div className="heroic-menu-item flex flex-col gap-3 font-sans text-sm">
              <div>
                <span className="block text-[10px] uppercase tracking-[0.2em] text-(--marble-ivory)/70">Icone</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setIcon(opt)}
                      className={`w-8 h-8 flex items-center justify-center rounded border border-(--bronze-aged)/40 bg-black/40 text-lg transition-all ${
                        icon === opt ? 'ring-1 ring-(--bronze-aged) bg-(--bronze-glow)/10' : ''
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <label className={labelClass}>
                <span>Icona personalizzata</span>
                <input
                  className={inputClass}
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="es. 🛡️"
                />
              </label>

              <div>
                <span className="block text-[10px] uppercase tracking-[0.2em] text-(--marble-ivory)/70">Colori</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setColor(opt)}
                      className={`px-3 py-1 rounded border border-(--bronze-aged)/40 bg-black/30 text-[11px] font-semibold ${
                        color === opt ? 'ring-1 ring-(--bronze-aged) bg-(--bronze-glow)/10' : ''
                      }`}
                    >
                      <span className={opt.replace('text-', '')}>A</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-[11px] text-red-300">{error}</p>}

      <div className="mt-auto flex justify-between gap-2 pt-4 border-t border-white/5">
        {editingCard && onNavigateToFormulaSafety && (
          <button
            type="button"
            onClick={() => onNavigateToFormulaSafety(editingCard.id)}
            className="px-3 py-2 text-xs rounded border border-blue-500 text-blue-200 bg-blue-700/30 hover:bg-blue-700/60 transition-colors"
            title="Check formula safety for this card"
          >
            🛡️ Safety Check
          </button>
        )}
        {editingCard && !editingCard.isCore && (
          <button
            type="button"
            onClick={() => {
              deleteCard(editingCard.id);
              onClose();
            }}
            className="px-3 py-2 text-xs rounded border border-red-600 text-red-200 bg-red-700/30 hover:bg-red-700/60 transition-colors"
          >
            Delete Card
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 text-xs rounded border border-white/20 text-(--marble-ivory)/80 hover:bg-white/5 transition-colors"
        >
          Annulla
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-2 text-xs rounded border border-emerald-500 text-emerald-200 bg-emerald-700/30 hover:bg-emerald-700/60 transition-colors"
        >
          {editingCard ? 'Salva modifiche' : 'Crea card'}
        </button>
      </div>
    </div>
  );
};
