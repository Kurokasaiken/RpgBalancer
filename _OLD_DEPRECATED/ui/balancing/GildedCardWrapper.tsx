import React, { useState } from 'react';

interface EditableFields {
  title: string;
  onTitleChange: (value: string) => void;
  icon: string;
  onIconChange: (value: string) => void;
  color: string;
  onColorChange: (value: string) => void;
}

interface GildedCardWrapperProps {
  title: string;
  color: string;
  icon?: string;
  onReset?: () => void;
  onEdit?: () => void;
  isEditing?: boolean;
  children: React.ReactNode;
  defaultVisible?: boolean;
  editableFields?: EditableFields;
  onDelete?: () => void;
  canDelete?: boolean;
}

/**
 * Gilded Observatory themed card wrapper.
 * Based on the original CardWrapper but with the Gilded Observatory aesthetic
 * and an optional Edit button for config mode.
 */
const COLOR_OPTIONS = [
  'text-amber-300',
  'text-emerald-300',
  'text-cyan-300',
  'text-rose-300',
  'text-purple-300',
];

export const GildedCardWrapper: React.FC<GildedCardWrapperProps> = ({
  title,
  color,
  icon,
  onReset,
  onEdit,
  isEditing,
  children,
  defaultVisible = true,
  editableFields,
  onDelete,
  canDelete = false,
}) => {
  const [isVisible, setIsVisible] = useState(defaultVisible);

  if (!isVisible) {
    return (
      <div className="bg-slate-950/80 p-2 rounded-xl shadow-lg border border-amber-500/20 opacity-50 hover:opacity-75 transition-opacity">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">{title}</span>
          <button
            onClick={() => setIsVisible(true)}
            className="text-xs text-slate-400 hover:text-amber-300 p-0.5 transition-all"
          >
            👁️
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-gradient-to-br from-slate-950/90 to-slate-900/80
        rounded-xl
        shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]
        border border-amber-500/30
        hover:border-amber-400/50
        transition-all duration-300
        p-4
        ${isEditing ? 'ring-2 ring-amber-500/50' : ''}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-amber-500/20 border-b">
        {isEditing && editableFields ? (
          <div className="flex flex-1 flex-wrap gap-2 items-center">
            <input
              className="w-16 text-xs rounded bg-slate-950 border border-slate-700 px-2 py-1 text-slate-100"
              value={editableFields.icon}
              onChange={(e) => editableFields.onIconChange(e.target.value)}
              placeholder="Icona"
            />
            <input
              className="flex-1 min-w-[120px] text-sm rounded bg-slate-950 border border-slate-700 px-2 py-1 text-slate-100"
              value={editableFields.title}
              onChange={(e) => editableFields.onTitleChange(e.target.value)}
              placeholder="Titolo"
            />
            <select
              className="text-xs rounded bg-slate-950 border border-slate-700 px-2 py-1 text-slate-100"
              value={editableFields.color}
              onChange={(e) => editableFields.onColorChange(e.target.value)}
            >
              {COLOR_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.replace('text-', '')}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <h3 className={`font-bold ${color} flex items-center gap-2 text-sm`}>
            {icon && <span>{icon}</span>}
            <span className="tracking-wide">{title}</span>
          </h3>
        )}

        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={onEdit}
              className={`
                p-1 rounded text-xs transition-all
                ${isEditing
                  ? 'bg-amber-500/30 border border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-800/80 border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-amber-300'
                }
              `}
              title={isEditing ? 'Salva' : 'Modifica'}
            >
              <span aria-hidden="true">{isEditing ? '✔' : '✎'}</span>
              <span className="sr-only">{isEditing ? 'Salva card' : 'Modifica card'}</span>
            </button>
          )}
          {isEditing && canDelete && onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Eliminare questa card?')) {
                  onDelete();
                }
              }}
              className="p-1 rounded text-xs bg-red-800/40 border border-red-500/70 text-red-200 hover:bg-red-700/60 transition-all"
              title="Elimina card"
            >
              🗑
            </button>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className="p-1 rounded text-xs bg-slate-800/80 border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-amber-300 transition-all"
              title="Reset Card"
            >
              ↺
            </button>
          )}
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 rounded text-xs bg-slate-800/80 border border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all"
            title="Nascondi"
          >
            👁️
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pt-3">{children}</div>
    </div>
  );
};
