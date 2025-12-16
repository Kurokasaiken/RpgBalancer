import React, { useEffect, useState } from 'react';
import type { StatDefinition } from '../../balancing/config/types';
import { FormulaEditor } from './FormulaEditor';
import { executeFormula } from '../../balancing/config/FormulaEngine';
import {
  Swords, Shield, Heart, Zap, Flame, Droplets, Snowflake, Wind, Skull,
  Crosshair, Hourglass, Crown, Gem, Scroll, Wand2, Axe, Hammer, Feather,
  Sun, Moon, Star, Ghost, BookOpen, Eye, Lock, Unlock, RotateCcw, Edit2,
  Trash2, Check, X, Plus, Minus
} from 'lucide-react';
import type { ElementType } from 'react';

const lucideStatIcons: Record<string, ElementType> = {
  swords: Swords,
  shield: Shield,
  heart: Heart,
  zap: Zap,
  flame: Flame,
  droplets: Droplets,
  snowflake: Snowflake,
  wind: Wind,
  skull: Skull,
  crosshair: Crosshair,
  hourglass: Hourglass,
  crown: Crown,
  gem: Gem,
  scroll: Scroll,
  wand: Wand2,
  axe: Axe,
  hammer: Hammer,
  feather: Feather,
  sun: Sun,
  moon: Moon,
  star: Star,
  ghost: Ghost,
  book: BookOpen,
};

const statGlyphMap: Record<string, string> = {
  hp: '❤',
  damage: '⚔️',
  htk: '♜',
  txc: '🎯',
  evasion: '🌀',
  hitChance: '％',
  attacksPerKo: '⚖️',
  critChance: '✦',
  critMult: '✪',
  critTxCBonus: '➕',
  failChance: '⚠️',
  failMult: '⭘',
  failTxCMalus: '➖',
  ward: '🛡️',
  armor: '⛨',
  resistance: '🜃',
  armorPen: '⛏️',
  penPercent: '⤓',
  effectiveDamage: '🔥',
  lifesteal: '🌿',
  regen: '💧',
  ttk: '⏳',
  edpt: '📈',
  earlyImpact: '⚡',
};

interface Props {
  stat: StatDefinition;
  simValue: number;
  onSimValueChange: (value: number) => void;
  allSimValues: Record<string, number>;
  onUpdate: (updates: Partial<StatDefinition>) => void;
  onDelete: () => void;
  onReset?: () => void;
  startInEdit?: boolean;
  availableStats: { id: string; label: string }[];
  canDelete?: boolean;
  dependentStats?: string[]; // Stats that depend on this one (for highlight)
  isDependencyHighlighted?: boolean; // Whether this stat is highlighted as a dependency
  hasError?: boolean; // Whether this stat is highlighted as an error constraint
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export const ConfigurableStat: React.FC<Props> = ({ stat, simValue, onSimValueChange, allSimValues, onUpdate, onDelete, onReset, startInEdit, availableStats, canDelete = false, isDependencyHighlighted, hasError, dragHandleProps }) => {
  const [isConfigMode, setIsConfigMode] = useState(!!startInEdit);
  const [label, setLabel] = useState(() => stat.label);
  const [description, setDescription] = useState(() => stat.description ?? '');
  const [min, setMin] = useState(() => stat.min);
  const [max, setMax] = useState(() => stat.max);
  const [step, setStep] = useState(() => stat.step);
  const [weight, setWeight] = useState(() => stat.weight);
  const [isDerived, setIsDerived] = useState(() => stat.isDerived);
  const [formula, setFormula] = useState(() => stat.formula || '');
  const [iconId, setIconId] = useState(() => stat.icon ?? '');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPenalty, setIsPenalty] = useState(() => !!stat.isPenalty);
  const [baseStat, setBaseStat] = useState(() => stat.baseStat ?? true);
  const [isDetrimental, setIsDetrimental] = useState(() => stat.isDetrimental ?? false);

  const isLocked = !!stat.isLocked;
  const isHidden = !!stat.isHidden;

  const LucideIcon = stat.icon ? lucideStatIcons[stat.icon] : undefined;
  const fallbackGlyph = statGlyphMap[stat.id] ?? '◆';

  // For derived stats, calculate value from formula; otherwise use simValue
  // If locked, use simValue (frozen value); if not locked and derived, calculate from formula
  const displayValue = stat.isDerived && stat.formula && !isLocked
    ? executeFormula(stat.formula, allSimValues)
    : simValue;
  // Interactive controls are disabled only when the stat is locked; derived stats remain editable
  // so that their changes can be propagated via the generic config solver.
  const isInteractive = !isLocked;

  const sliderProgress = stat.max === stat.min ? 100 : Math.max(0, Math.min(100, ((displayValue - stat.min) / (stat.max - stat.min)) * 100));

  const showDragHandle = !!dragHandleProps && !isConfigMode;

  useEffect(() => {
    if (!isConfigMode) {
      setLabel(stat.label);
      setDescription(stat.description ?? '');
      setMin(stat.min);
      setMax(stat.max);
      setStep(stat.step);
      setWeight(stat.weight);
      setIsDerived(stat.isDerived);
      setFormula(stat.formula || '');
      setIconId(stat.icon ?? '');
      setIsPenalty(!!stat.isPenalty);
      setBaseStat(stat.baseStat ?? true);
      setIsDetrimental(stat.isDetrimental ?? false);
    }
  }, [stat, isConfigMode]);

  const handleSave = () => {
    if (!label.trim()) return;
    const updates: Partial<StatDefinition> = {};
    if (label !== stat.label) {
      updates.label = label.trim();
    }
    if (min !== stat.min) updates.min = min;
    if (max !== stat.max) updates.max = max;
    if (step !== stat.step) updates.step = step;
    if (weight !== stat.weight) updates.weight = weight;
    if ((description || undefined) !== stat.description) {
      updates.description = description.trim() ? description.trim() : undefined;
    }
    if ((iconId || undefined) !== (stat.icon || undefined)) {
      updates.icon = iconId || undefined;
    }
    if (isDerived !== stat.isDerived) updates.isDerived = isDerived;
    if (isDerived) {
      if (formula !== (stat.formula || '')) {
        updates.formula = formula;
      }
    } else if (stat.isDerived) {
      updates.formula = undefined;
    }
    if ((isPenalty || undefined) !== (stat.isPenalty || undefined)) {
      updates.isPenalty = isPenalty || undefined;
    }
    if ((baseStat ?? undefined) !== (stat.baseStat ?? undefined)) {
      updates.baseStat = baseStat;
    }
    if ((isDetrimental ?? undefined) !== (stat.isDetrimental ?? undefined)) {
      updates.isDetrimental = isDetrimental;
    }
    if (Object.keys(updates).length > 0) {
      onUpdate(updates);
    }
    setIsConfigMode(false);
  };

  const handleToggleLock = () => {
    onUpdate({ isLocked: !isLocked });
  };

  const handleToggleHidden = () => {
    onUpdate({ isHidden: !isHidden });
  };

  // === PLAY VIEW (default) ===
  if (!isConfigMode) {
    if (isHidden) {
      return (
        <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl border border-slate-700/70 bg-slate-900/70 backdrop-blur-sm gap-2 opacity-70">
          <div className="flex items-center gap-1.5 min-w-0">
            {LucideIcon ? (
              <LucideIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <span
                className="text-sm text-amber-400 leading-none shrink-0 h-4 flex items-center justify-center"
                aria-hidden="true"
              >
                {fallbackGlyph}
              </span>
            )}
            <span className="text-[11px] text-[#aeb8b4] truncate leading-none">{stat.label}</span>
          </div>
          <button
            type="button"
            className="flex items-center justify-center text-[#c9a227] hover:text-[#e6c547] transition-colors leading-none"
            title="Mostra stat"
            onClick={handleToggleHidden}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="sr-only">Mostra statistica</span>
          </button>
        </div>
      );
    }
    return (
      <div className={`flex items-center justify-between text-xs py-2 px-3 rounded-xl border backdrop-blur-sm gap-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.85)] transition-all ${hasError
          ? 'border-red-500/80 bg-red-950/60'
          : isDependencyHighlighted
            ? 'border-amber-400/60 bg-amber-950/40'
            : isLocked
              ? 'border-slate-800 bg-slate-950/40'
              : 'border-slate-700/70 bg-slate-900/70'
        }`}>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1.5 min-w-0 flex-1 ${isLocked ? 'opacity-60' : ''}`}>
              {showDragHandle ? (
                <button
                  type="button"
                  className="w-4 h-4 flex items-center justify-center rounded text-amber-200 cursor-grab active:cursor-grabbing shrink-0"
                  title="Trascina per riordinare"
                  {...dragHandleProps}
                >
                  {LucideIcon ? (
                    <LucideIcon className="w-3.5 h-3.5" />
                  ) : (
                    <span
                      className="text-sm leading-none h-4 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      {fallbackGlyph}
                    </span>
                  )}
                </button>
              ) : LucideIcon ? (
                <LucideIcon className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              ) : (
                <span
                  className="text-sm text-amber-200 leading-none shrink-0 h-4 flex items-center justify-center"
                  aria-hidden="true"
                >
                  {fallbackGlyph}
                </span>
              )}
              <div className="relative group flex-1 min-w-0">
                <span className="font-medium text-[11px] tracking-[0.12em] uppercase text-slate-100 truncate cursor-help leading-none">
                  {stat.label}
                </span>
                {stat.description && (
                  <div className="pointer-events-none absolute left-0 top-full mt-1 w-48 rounded-md bg-[#0c1517] border border-[#c7b996]/40 px-2 py-1 text-[10px] text-[#f6f3e4] opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-10">
                    {stat.description}
                  </div>
                )}
                {/* Labels shown only in edit mode */}
                {isConfigMode && (!stat.baseStat || stat.isDetrimental) && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {!stat.baseStat && (
                      <span className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-500/10 px-2 py-0.5 text-[9px] tracking-[0.18em] uppercase text-amber-200">
                        Off Base Kit
                      </span>
                    )}
                    {stat.isDetrimental && (
                      <span className="inline-flex items-center rounded-full border border-rose-500/60 bg-rose-500/10 px-2 py-0.5 text-[9px] tracking-[0.18em] uppercase text-rose-200">
                        Hero Only
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions: Lock, Reset, Edit, Hide */}
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <button
                type="button"
                className={`w-5 h-5 flex items-center justify-center rounded transition-colors leading-none ${isLocked ? 'text-rose-400 bg-rose-500/10' : 'text-slate-500 hover:text-indigo-200'
                  }`}
                title={isLocked ? 'Sblocca stat' : 'Blocca stat'}
                onClick={handleToggleLock}
              >
                {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                <span className="sr-only">{isLocked ? 'Sblocca' : 'Blocca'}</span>
              </button>
              <button
                type="button"
                className={`w-5 h-5 flex items-center justify-center rounded transition-colors leading-none ${onReset ? 'text-cyan-300 hover:text-cyan-100' : 'text-slate-600 cursor-not-allowed'
                  }`}
                title="Reset"
                onClick={() => {
                  if (onReset) {
                    onReset();
                    // Note: simValue is not automatically reset - user can manually adjust if needed
                  }
                }}
                disabled={!onReset || isLocked}
              >
                <RotateCcw className="w-3 h-3" />
                <span className="sr-only">Reset</span>
              </button>
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center rounded text-indigo-300 hover:text-indigo-100 transition-colors leading-none"
                title="Modifica stat"
                onClick={() => setIsConfigMode(true)}
              >
                <Edit2 className="w-3 h-3" />
                <span className="sr-only">Modifica statistica</span>
              </button>
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center rounded text-[#c9a227] hover:text-[#e6c547] transition-colors leading-none"
                title={isHidden ? 'Mostra stat' : 'Nascondi stat'}
                onClick={handleToggleHidden}
              >
                <Eye className="w-3 h-3" />
                <span className="sr-only">Nascondi</span>
              </button>
            </div>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5">
            <button
              type="button"
              className={`w-5 h-5 flex items-center justify-center rounded border bg-slate-900/80 transition-colors ${!isInteractive
                  ? 'border-slate-800 text-slate-700 cursor-not-allowed'
                  : 'border-indigo-500/70 text-indigo-200 hover:bg-indigo-500/20'
                }`}
              onClick={() => {
                if (!isInteractive) return;
                onSimValueChange(Math.max(stat.min, simValue - stat.step));
              }}
              aria-label="Decrement"
              disabled={!isInteractive}
            >
              <Minus className="w-3 h-3" />
            </button>
            <div className="flex-1 min-w-0 flex justify-center">
              <input
                type="range"
                className={`w-[90%] h-2 rounded-full appearance-none ${isInteractive ? 'cursor-pointer' : 'cursor-default'}`}
                min={stat.min}
                max={stat.max}
                step={stat.step}
                value={displayValue}
                onChange={(e) => {
                  if (!isInteractive) return;
                  onSimValueChange(Number(e.target.value));
                }}
                disabled={!isInteractive}
                style={{
                  background: isLocked
                    ? `linear-gradient(to right, #334155 0%, #334155 ${sliderProgress}%, #0f172a ${sliderProgress}%, #0f172a 100%)`
                    : `linear-gradient(to right, #4f46e5 0%, #22d3ee ${sliderProgress}%, #020617 ${sliderProgress}%, #020617 100%)`,
                }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                className={`w-12 px-1 py-0.5 rounded border text-[10px] font-mono text-center bg-slate-950/90 focus:outline-none focus:ring-1 focus:ring-cyan-400/70 ${!isInteractive
                    ? 'border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    : 'border-slate-600 text-cyan-200'
                  }`}
                value={Number.isFinite(displayValue) ? displayValue : ''}
                onChange={(e) => {
                  if (!isInteractive) return;
                  const next = Number(e.target.value);
                  if (!Number.isFinite(next)) return;
                  onSimValueChange(next);
                }}
                step={stat.step}
                min={stat.min}
                max={stat.max}
                disabled={!isInteractive}
              />
              <button
                type="button"
                className={`w-5 h-5 flex items-center justify-center rounded border bg-[#1a1410]/70 transition-colors ${!isInteractive
                    ? 'border-slate-800 text-slate-700 cursor-not-allowed'
                    : 'border-[#9d7d5c] text-[#c9a227] hover:bg-[#2a2015]'
                  }`}
                onClick={() => {
                  if (!isInteractive) return;
                  onSimValueChange(Math.min(stat.max, simValue + stat.step));
                }}
                aria-label="Increment"
                disabled={!isInteractive}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === CONFIG VIEW ===
  return (
    <div className="flex flex-col text-xs py-3 px-3 rounded-xl border border-slate-700/70 bg-slate-900/75 backdrop-blur-sm gap-2 shadow-[0_10px_24px_rgba(15,23,42,0.85)]">
      <div className="flex items-start gap-2">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowIconPicker((prev) => !prev)}
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded border border-slate-600 bg-slate-900/80 hover:border-indigo-400 hover:bg-slate-900/95 transition-colors"
              title="Scegli icona"
            >
              {iconId && lucideStatIcons[iconId] ? (
                React.createElement(lucideStatIcons[iconId], { className: 'w-4 h-4 text-indigo-200' })
              ) : (
                <span className="text-xs text-slate-400">∗</span>
              )}
            </button>
            <input
              className="flex-1 min-w-0 text-sm rounded bg-[#0c1517] border border-[#475758] px-3 py-1.5 text-[#f5f0dc] placeholder:text-[#556567]"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nome statistica"
              autoFocus
            />
          </div>

          {showIconPicker && (
            <div className="grid grid-cols-7 gap-1 max-h-32 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/95 p-2 shadow-[0_12px_30px_rgba(15,23,42,0.9)] z-10 relative">
              <button
                type="button"
                onClick={() => { setIconId(''); setShowIconPicker(false); }}
                className={`h-7 w-7 flex items-center justify-center rounded border text-slate-400 ${!iconId ? 'border-indigo-400 bg-indigo-500/30 text-indigo-200' : 'border-slate-700 hover:border-indigo-400 hover:bg-slate-800'
                  }`}
                title="Nessuna icona"
              >
                <span className="text-xs">∅</span>
              </button>
              {Object.entries(lucideStatIcons).map(([id, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setIconId(id); setShowIconPicker(false); }}
                  className={`h-7 w-7 flex items-center justify-center rounded border text-slate-100 ${iconId === id
                      ? 'border-indigo-400 bg-indigo-500/30'
                      : 'border-slate-700 hover:border-indigo-400 hover:bg-slate-800'
                    }`}
                  title={id}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded border border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/15 text-sm leading-none transition-colors"
            title="Salva modifiche"
            onClick={handleSave}
          >
            <Check className="w-4 h-4" />
            <span className="sr-only">Salva modifiche</span>
          </button>
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded border border-[#475758] text-[#aeb8b4] hover:text-amber-200 text-sm leading-none transition-colors"
            title="Annulla"
            onClick={() => setIsConfigMode(false)}
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Annulla</span>
          </button>
          {canDelete && (
            <div className="relative">
              <button
                type="button"
                className="w-7 h-7 flex items-center justify-center rounded bg-red-900/30 text-red-300 border border-red-500/50 hover:bg-red-800/50 text-sm leading-none transition-colors"
                title="Elimina statistica"
                onClick={() => setShowDeleteConfirm((prev) => !prev)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {showDeleteConfirm && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-red-500/40 bg-[#060b0d]/95 p-3 text-[11px] text-[#f5f0dc] shadow-[0_12px_35px_rgba(0,0,0,0.7)] z-20">
                  <p className="font-semibold text-red-200 mb-2 tracking-wide">Eliminare questa stat?</p>
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
                      className="px-2 py-1 rounded bg-red-600/80 text-white hover:bg-red-600"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        onDelete();
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

      <label className="flex flex-col text-[10px] text-[#aeb8b4] gap-1">
        <span>Descrizione (tooltip)</span>
        <textarea
          className="w-full rounded bg-[#0c1517] border border-[#475758] px-3 py-1.5 text-[11px] text-[#f5f0dc] resize-none placeholder:text-[#556567]"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Testo tooltip"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[#8aa0a1]">Min</span>
          <input
            type="number"
            className="w-full rounded bg-[#0c1517] border border-[#475758] px-2 py-1 text-[11px] text-[#f5f0dc] disabled:opacity-50 disabled:cursor-not-allowed"
            value={min}
            onChange={(e) => setMin(Number(e.target.value))}
            disabled={isDerived}
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[#8aa0a1]">Max</span>
          <input
            type="number"
            className="w-full rounded bg-[#0c1517] border border-[#475758] px-2 py-1 text-[11px] text-[#f5f0dc] disabled:opacity-50 disabled:cursor-not-allowed"
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
            disabled={isDerived}
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[#8aa0a1]">Step</span>
          <input
            type="number"
            className="w-full rounded bg-[#0c1517] border border-[#475758] px-2 py-1 text-[11px] text-[#f5f0dc] disabled:opacity-50 disabled:cursor-not-allowed"
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            disabled={isDerived}
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[#8aa0a1]">Weight</span>
          <input
            type="number"
            className="w-full rounded bg-[#0c1517] border border-[#475758] px-2 py-1 text-[11px] text-[#f5f0dc] disabled:opacity-50 disabled:cursor-not-allowed"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            disabled={isDerived}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-200 mt-1">
        <input
          type="checkbox"
          className="w-3 h-3 rounded border-slate-600 bg-slate-900"
          checked={isPenalty}
          onChange={(e) => {
            const checked = e.target.checked;
            setIsPenalty(checked);
            if (checked && baseStat) {
              setBaseStat(false);
            }
          }}
        />
        <span>Penalty stat (valori più alti sono peggiori)</span>
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-200 mt-2">
        <label className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-2">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 rounded border-slate-500 bg-slate-950"
            checked={baseStat}
            onChange={(e) => setBaseStat(e.target.checked)}
          />
          <div className="flex flex-col leading-tight">
            <span className="uppercase tracking-[0.18em] text-[10px] text-amber-200">Base Stat</span>
            <span className="text-[10px] text-slate-400">Usata per crescita/quest umane</span>
          </div>
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-2">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 rounded border-slate-500 bg-slate-950"
            checked={isDetrimental}
            onChange={(e) => setIsDetrimental(e.target.checked)}
          />
          <div className="flex flex-col leading-tight">
            <span className="uppercase tracking-[0.18em] text-[10px] text-rose-200">Hero Only</span>
            <span className="text-[10px] text-slate-400">Flag per stats detrimentali</span>
          </div>
        </label>
      </div>

      {isDerived && (
        <div className="mt-1">
          <p className="text-[10px] uppercase tracking-[0.4em] text-amber-300 mb-1">Formula</p>
          <FormulaEditor
            value={formula}
            onChange={setFormula}
            availableStats={availableStats}
          />
        </div>
      )}
    </div>
  );
};
