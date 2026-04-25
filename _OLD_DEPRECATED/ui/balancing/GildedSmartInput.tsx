import React, { useState, useRef, useEffect } from 'react';

interface GildedSmartInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onReset?: () => void;
  onEdit?: () => void;
  isEditing?: boolean;
  isLocked?: boolean;
  onLockToggle?: () => void;
  min: number;
  max: number;
  step?: number;
  isPercentage?: boolean;
  readOnly?: boolean;
  bgColor?: string;
  description?: string;
  configContent?: React.ReactNode;
}

/**
 * Gilded Observatory themed stat input.
 * Based on SmartInput but with Gilded Observatory aesthetic
 * and an optional Edit button for config mode.
 */
export const GildedSmartInput: React.FC<GildedSmartInputProps> = ({
  label,
  value,
  onChange,
  onReset,
  onEdit,
  isEditing,
  isLocked = false,
  onLockToggle,
  min,
  max,
  step = 1,
  isPercentage = false,
  readOnly = false,
  bgColor,
  description,
  configContent,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [prevValue, setPrevValue] = useState(value);
  const numberInputRef = useRef<HTMLInputElement>(null);

  const isActive = !readOnly && !isLocked;

  // Update input value when prop changes
  useEffect(() => {
    if (numberInputRef.current) {
      numberInputRef.current.value = isPercentage
        ? String(Math.round(value ?? 0))
        : (value ?? 0).toFixed(2);
    }
  }, [value, isPercentage]);

  // Detect value changes (cascade effects)
  useEffect(() => {
    const roundedValue = Math.round(value * 100) / 100;
    const roundedPrev = Math.round(prevValue * 100) / 100;

    if (roundedValue !== roundedPrev) {
      setIsChanging(true);
      setPrevValue(value);
      const timer = setTimeout(() => setIsChanging(false), 400);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  // Hidden state
  if (!isVisible) {
    return (
      <div className="bg-slate-900/40 p-1.5 rounded-lg flex justify-between items-center opacity-50 hover:opacity-75 transition-opacity border border-slate-700/50">
        <span className="text-xs text-slate-400">{label}</span>
        <button
          onClick={() => setIsVisible(true)}
          className="text-xs text-slate-400 hover:text-amber-300 p-0.5 transition-all"
        >
          👁️
        </button>
      </div>
    );
  }

  return (
    <div
      className={`
        relative p-3 rounded-lg transition-all
        ${bgColor || 'bg-slate-900/60'}
        border border-slate-700/80
        ${isChanging ? 'ring-2 ring-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]' : ''}
        ${isEditing ? 'ring-2 ring-amber-500/40' : ''}
        ${isLocked ? 'ring-2 ring-red-500/40' : ''}
        ${!isActive ? 'opacity-60' : ''}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <label
            className={`
              text-xs font-semibold cursor-help
              border-b border-dotted border-slate-500
              ${isChanging ? 'text-amber-300' : 'text-slate-200'}
            `}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {label}
            {isChanging && <span className="ml-1 text-amber-400">⚡</span>}
          </label>

          {/* Tooltip */}
          {showTooltip && description && (
            <div className="absolute z-10 left-0 bottom-full mb-1 w-48 bg-slate-950 text-slate-100 text-xs p-2 rounded-lg shadow-xl border border-amber-500/30">
              <p className="font-bold mb-0.5 text-amber-300">{label}</p>
              <p className="text-slate-300">{description}</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="p-1 rounded text-xs bg-slate-800/80 border border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all"
            title="Info"
          >
            ?
          </button>

          <button
            onClick={() => setIsVisible(false)}
            className="p-1 rounded text-xs bg-slate-800/80 border border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all"
            title="Nascondi"
          >
            👁️
          </button>

          {onLockToggle && !readOnly && (
            <button
              onClick={onLockToggle}
              className={`
                p-1 rounded text-xs transition-all
                ${isLocked
                  ? 'bg-red-500/30 border border-red-400 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                  : 'bg-slate-800/80 border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-200'
                }
              `}
              title={isLocked ? 'Unlock' : 'Lock'}
            >
              {isLocked ? '🔒' : '🔓'}
            </button>
          )}

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
              title={isEditing ? 'Salva impostazioni' : 'Modifica impostazioni'}
            >
              <span aria-hidden="true">{isEditing ? '✔' : '✎'}</span>
              <span className="sr-only">{isEditing ? 'Salva impostazioni' : 'Modifica impostazioni'}</span>
            </button>
          )}

          {onReset && !readOnly && (
            <button
              onClick={() => isActive && onReset()}
              className="p-1 rounded text-xs bg-slate-800/80 border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-amber-300 transition-all"
              title="Reset Default"
              disabled={!isActive}
            >
              ↺
            </button>
          )}
        </div>
      </div>

      {/* Value Display / Input */}
      <div className="flex justify-between items-end mb-2">
        <input
          ref={numberInputRef}
          type="number"
          defaultValue={isPercentage ? Math.round(value ?? 0) : Number((value ?? 0).toFixed(2))}
          onChange={(e) => {
            const newVal = parseFloat(e.target.value);
            if (!isNaN(newVal)) {
              onChange(Math.max(min, Math.min(max, newVal)));
            }
          }}
          disabled={!isActive}
          className={`
            text-sm font-mono bg-transparent border-b-2 outline-none w-full transition-all
            focus:border-amber-400 focus:shadow-[0_0_8px_rgba(245,158,11,0.4)]
            ${isLocked ? 'border-red-400 text-red-400' : isChanging ? 'border-amber-400 text-amber-300' : 'border-slate-600 text-amber-200'}
          `}
        />
        {isPercentage && <span className="text-slate-400 text-xs ml-1">%</span>}
      </div>

      {/* Slider */}
      {!readOnly && (
        <input
          type="range"
          value={value}
          onInput={(e) => {
            const target = e.target as HTMLInputElement;
            const newValue = parseFloat(target.value);
            if (numberInputRef.current) {
              numberInputRef.current.value = isPercentage
                ? String(Math.round(newValue))
                : newValue.toFixed(2);
            }
          }}
          onChange={(e) => {
            const newValue = parseFloat(e.target.value);
            onChange(newValue);
          }}
          disabled={!isActive}
          min={min}
          max={max}
          step={step}
          className="w-full h-1.5 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
      )}

      {isEditing && configContent && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-slate-950/40 p-3 text-[11px] text-slate-200 space-y-2">
          {configContent}
        </div>
      )}
    </div>
  );
};
