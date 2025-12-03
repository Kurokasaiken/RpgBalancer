import React, { useEffect, useState } from 'react';
import type { StatDefinition } from '../../balancing/config/types';
import { FormulaEditor } from './FormulaEditor';

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
  onUpdate: (updates: Partial<StatDefinition>) => void;
  onDelete: () => void;
  onReset?: () => void;
  startInEdit?: boolean;
  availableStats: string[];
  canDelete?: boolean;
}

export const ConfigurableStat: React.FC<Props> = ({ stat, onUpdate, onDelete, onReset, startInEdit, availableStats, canDelete = false }) => {
  const [isConfigMode, setIsConfigMode] = useState(!!startInEdit);
  const [label, setLabel] = useState(stat.label);
  const [description, setDescription] = useState(stat.description ?? '');
  const [min, setMin] = useState(stat.min);
  const [max, setMax] = useState(stat.max);
  const [step, setStep] = useState(stat.step);
  const [weight, setWeight] = useState(stat.weight);
  const [isDerived, setIsDerived] = useState(stat.isDerived);
  const [formula, setFormula] = useState(stat.formula || '');
  const [mockValue, setMockValue] = useState(stat.defaultValue ?? stat.min);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const glyph = statGlyphMap[stat.id] ?? '◆';
  const sliderProgress = stat.max === stat.min ? 100 : Math.max(0, Math.min(100, ((mockValue - stat.min) / (stat.max - stat.min)) * 100));

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
    if (isDerived !== stat.isDerived) updates.isDerived = isDerived;
    if (isDerived) {
      if (formula !== (stat.formula || '')) {
        updates.formula = formula;
      }
    } else if (stat.isDerived) {
      updates.formula = undefined;
    }
    if (Object.keys(updates).length > 0) {
      onUpdate(updates);
    }
    setIsConfigMode(false);
  };

  const isLocked = !!stat.isLocked;
  const isHidden = !!stat.isHidden;

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
        <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl border border-[#3b4a4a] bg-gradient-to-br from-[#060b0d]/90 to-[#040708]/80 gap-2 opacity-70">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base text-amber-400 leading-none" aria-hidden="true">{glyph}</span>
            <span className="text-[#aeb8b4] truncate text-[11px]">{stat.label}</span>
          </div>
          <button
            type="button"
            className="flex items-center justify-center text-[#c9a227] hover:text-[#e6c547] transition-colors leading-none"
            title="Mostra stat"
            onClick={handleToggleHidden}
          >
            <span aria-hidden="true" className="text-sm">👁</span>
            <span className="sr-only">Mostra statistica</span>
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl border border-[#3b4a4a] bg-gradient-to-br from-[#0c181b]/90 to-[#060b0d]/80 gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-base text-amber-200 leading-none flex-shrink-0" aria-hidden="true">{glyph}</span>
            <div className="relative group flex-1 min-w-0">
              <span className="font-medium text-[#f6f3e4] truncate cursor-help leading-none">{stat.label}</span>
              {stat.description && (
                <div className="pointer-events-none absolute left-0 top-full mt-1 w-48 rounded-md bg-[#0c1517] border border-[#c7b996]/40 px-2 py-1 text-[10px] text-[#f6f3e4] opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-10">
                  {stat.description}
                </div>
              )}
            </div>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <button
              type="button"
              className={`w-6 h-6 flex items-center justify-center rounded border bg-[#1a1410]/70 transition-colors ${
                isLocked
                  ? 'border-[#555555] text-[#555555] cursor-not-allowed'
                  : 'border-[#9d7d5c] text-[#c9a227] hover:bg-[#2a2015]'
              }`}
              onClick={() => {
                if (isLocked) return;
                setMockValue((v) => Math.max(stat.min, v - stat.step));
              }}
              aria-label="Decrement"
            >
              −
            </button>
            <input
              type="range"
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer slider-bronze"
              min={stat.min}
              max={stat.max}
              step={stat.step}
              value={mockValue}
              onChange={(e) => {
                if (isLocked) return;
                setMockValue(Number(e.target.value));
              }}
              disabled={isLocked}
              style={{
                background: `linear-gradient(to right, #a0826d 0%, #a0826d ${sliderProgress}%, #1a1410 ${sliderProgress}%, #1a1410 100%)`,
              }}
            />
            <button
              type="button"
              className={`w-6 h-6 flex items-center justify-center rounded border bg-[#1a1410]/70 transition-colors ${
                isLocked
                  ? 'border-[#555555] text-[#555555] cursor-not-allowed'
                  : 'border-[#9d7d5c] text-[#c9a227] hover:bg-[#2a2015]'
              }`}
              onClick={() => {
                if (isLocked) return;
                setMockValue((v) => Math.min(stat.max, v + stat.step));
              }}
              aria-label="Increment"
            >
              +
            </button>
            <span className="w-10 text-right text-[10px] text-[#f5f0dc] font-mono">
              {mockValue}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={`flex items-center justify-center transition-colors leading-none ${
              isLocked ? 'text-[#9d7d5c]' : 'text-[#c9a227] hover:text-[#e6c547]'
            }`}
            title={isLocked ? 'Sblocca stat' : 'Blocca stat'}
            onClick={handleToggleLock}
          >
            <span aria-hidden="true" className="text-base">🔐</span>
            <span className="sr-only">{isLocked ? 'Sblocca' : 'Blocca'}</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center text-[#c9a227] hover:text-[#e6c547] transition-colors leading-none"
            title="Reset"
            onClick={onReset}
            disabled={!onReset}
          >
            <span aria-hidden="true" className="text-base">↺</span>
            <span className="sr-only">Reset</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center text-[#c9a227] hover:text-[#e6c547] transition-colors leading-none"
            title={isHidden ? 'Mostra stat' : 'Nascondi stat'}
            onClick={handleToggleHidden}
          >
            <span aria-hidden="true" className="text-base">👁</span>
            <span className="sr-only">Nascondi</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center text-[#c9a227] hover:text-[#e6c547] transition-colors leading-none"
            title="Modifica stat"
            onClick={() => setIsConfigMode(true)}
          >
            <span aria-hidden="true" className="text-base">✎</span>
            <span className="sr-only">Modifica statistica</span>
          </button>
        </div>
      </div>
    );
  }

  // === CONFIG VIEW ===
  return (
    <div className="flex flex-col text-xs py-3 px-3 rounded-xl border border-[#3b4a4a] bg-gradient-to-br from-[#0c181b]/90 to-[#060b0d]/80 gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-start gap-2">
        <input
          className="flex-1 text-sm rounded bg-[#0c1517] border border-[#475758] px-3 py-1.5 text-[#f5f0dc] placeholder:text-[#556567]"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nome statistica"
          autoFocus
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-full border border-emerald-400 text-emerald-200 hover:bg-emerald-500/15"
            title="Salva modifiche"
            onClick={handleSave}
          >
            <span aria-hidden="true">✔</span>
            <span className="sr-only">Salva modifiche</span>
          </button>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#475758] text-[#aeb8b4] hover:text-amber-200"
            title="Annulla"
            onClick={() => setIsConfigMode(false)}
          >
            <span aria-hidden="true">✖</span>
            <span className="sr-only">Annulla</span>
          </button>
          {canDelete && (
            <div className="relative">
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-900/40 text-red-200 border border-red-500/70 hover:bg-red-800/70"
                title="Elimina statistica"
                onClick={() => setShowDeleteConfirm((prev) => !prev)}
              >
                🗑
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
      <div className="flex flex-col gap-2">
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
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#f5f0dc]">
          <label className="flex items-center gap-1">
            <span className="text-[#8aa0a1]">Min</span>
            <input
              type="number"
              className="w-16 rounded bg-[#0c1517] border border-[#475758] px-2 py-1 text-[11px] text-[#f5f0dc]"
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-[#8aa0a1]">Max</span>
            <input
              type="number"
              className="w-16 rounded bg-[#0c1517] border border-[#475758] px-2 py-1 text-[11px] text-[#f5f0dc]"
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-[#8aa0a1]">Step</span>
            <input
              type="number"
              className="w-16 rounded bg-[#0c1517] border border-[#475758] px-2 py-1 text-[11px] text-[#f5f0dc]"
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-[#8aa0a1]">Weight</span>
            <input
              type="number"
              className="w-16 rounded bg-[#0c1517] border border-[#475758] px-2 py-1 text-[11px] text-[#f5f0dc]"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              className="w-3 h-3 rounded border-[#475758] bg-[#0c1517]"
              checked={isDerived}
              onChange={(e) => setIsDerived(e.target.checked)}
            />
            <span className="text-[#8aa0a1]">Derived</span>
          </label>
        </div>
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
