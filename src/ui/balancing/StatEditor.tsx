import React, { useEffect, useState } from 'react';
import type { StatDefinition, CardDefinition } from '../../balancing/config/types';
import { useBalancerConfig } from '../../balancing/hooks/useBalancerConfig';
import { FormulaEditor } from './FormulaEditor';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  card: CardDefinition | null;
  editingStat?: StatDefinition;
}

export const StatEditor: React.FC<Props> = ({ isOpen, onClose, card, editingStat }) => {
  const { addStat, updateStat, config } = useBalancerConfig();

  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'number' | 'percentage'>('number');
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(100);
  const [step, setStep] = useState(1);
  const [defaultValue, setDefaultValue] = useState(0);
  const [weight, setWeight] = useState(1);
  const [isDerived, setIsDerived] = useState(false);
  const [formula, setFormula] = useState('');
  const [isPenalty, setIsPenalty] = useState(false);
  const [baseStat, setBaseStat] = useState(true);
  const [isDetrimental, setIsDetrimental] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!isOpen) return;
    if (editingStat) {
      setId(editingStat.id);
      setLabel(editingStat.label);
      setDescription(editingStat.description || '');
      setType(editingStat.type);
      setMin(editingStat.min);
      setMax(editingStat.max);
      setStep(editingStat.step);
      setDefaultValue(editingStat.defaultValue);
      setWeight(editingStat.weight);
      setIsDerived(editingStat.isDerived);
      setFormula(editingStat.formula || '');
      setIsPenalty(!!editingStat.isPenalty);
      setBaseStat(editingStat.baseStat ?? (!editingStat.isDerived && !editingStat.isPenalty));
      setIsDetrimental(editingStat.isDetrimental ?? !!editingStat.isPenalty);
    } else {
      setId('');
      setLabel('');
      setDescription('');
      setType('number');
      setMin(0);
      setMax(100);
      setStep(1);
      setDefaultValue(0);
      setWeight(1);
      setIsDerived(false);
      setFormula('');
      setIsPenalty(false);
      setBaseStat(true);
      setIsDetrimental(false);
    }
    setError(undefined);
  }, [editingStat, isOpen]);

  if (!isOpen || !card) return null;

  const handleSave = () => {
    if (!label.trim()) {
      setError('Label is required');
      return;
    }
    if (min > max) {
      setError('min must be <= max');
      return;
    }
    if (defaultValue < min || defaultValue > max) {
      setError('defaultValue must be within range');
      return;
    }

    if (editingStat) {
      const res = updateStat(editingStat.id, {
        label,
        description: description || undefined,
        type,
        min,
        max,
        step,
        defaultValue,
        weight,
        isDerived,
        formula: isDerived ? formula : undefined,
        isPenalty: isPenalty || undefined,
        baseStat,
        isDetrimental,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      onClose();
      return;
    }

    if (!id.trim()) {
      setError('ID is required');
      return;
    }

    const res = addStat(card.id, {
      id,
      label,
      description: description || undefined,
      type,
      min,
      max,
      step,
      defaultValue,
      weight,
      isDerived,
      formula: isDerived ? formula : undefined,
      bgColor: undefined,
      isPenalty: isPenalty || undefined,
      baseStat,
      isDetrimental,
    });
    if (!res.success) {
      setError(res.error);
      return;
    }
    onClose();
  };

  const availableStats = Object.values(config.stats).map((s) => ({ id: s.id, label: s.label }));

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60">
      <div className="w-full max-w-sm h-full bg-slate-950 border-l border-slate-800 p-4 flex flex-col gap-3">
        <header className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Stat Editor</p>
            <h2 className="text-sm font-semibold text-slate-50">
              {editingStat ? 'Modifica stat' : 'Nuova stat'} in {card.title}
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

        {!editingStat && (
          <label className="flex flex-col gap-1 text-xs text-slate-200">
            <span>ID (unico)</span>
            <input
              className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-100"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="es. critChance"
            />
          </label>
        )}

        <label className="flex flex-col gap-1 text-xs text-slate-200">
          <span>Label</span>
          <input
            className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-100"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="es. Critical Chance"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-slate-200">
          <span>Description</span>
          <textarea
            className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-100 h-14"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-200">
          <label className="flex flex-col gap-1">
            <span>Type</span>
            <select
              className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-100"
              value={type}
              onChange={(e) => setType(e.target.value as 'number' | 'percentage')}
            >
              <option value="number">Number</option>
              <option value="percentage">Percentage</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span>Weight</span>
            <input
              type="number"
              className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-100"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value) || 0)}
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs text-slate-200">
          <label className="flex flex-col gap-1">
            <span>Min</span>
            <input
              type="number"
              className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-100"
              value={min}
              onChange={(e) => setMin(Number(e.target.value) || 0)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Max</span>
            <input
              type="number"
              className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-100"
              value={max}
              onChange={(e) => setMax(Number(e.target.value) || 0)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Step</span>
            <input
              type="number"
              className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-100"
              value={step}
              onChange={(e) => setStep(Number(e.target.value) || 1)}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs text-slate-200">
          <span>Default Value</span>
          <input
            type="number"
            className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-100"
            value={defaultValue}
            onChange={(e) => setDefaultValue(Number(e.target.value) || 0)}
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-200 mt-1">
          <input
            type="checkbox"
            className="w-3 h-3 rounded border-slate-600 bg-slate-900"
            checked={isDerived}
            onChange={(e) => setIsDerived(e.target.checked)}
          />
          <span>Derived stat (calcolata da formula)</span>
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-200 mt-1">
          <input
            type="checkbox"
            className="w-3 h-3 rounded border-slate-600 bg-slate-900"
            checked={isPenalty}
            onChange={(e) => setIsPenalty(e.target.checked)}
          />
          <span>Penalty stat (valori più alti sono peggiori)</span>
        </label>

        {isDerived && (
          <FormulaEditor value={formula} onChange={setFormula} availableStats={availableStats} />
        )}

        {error && <p className="text-[11px] text-red-300 mt-1">{error}</p>}

        <div className="mt-auto flex justify-end gap-2 pt-2 border-t border-slate-800">
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
            className="px-2 py-1 text-xs rounded border border-emerald-500 text-emerald-100 bg-emerald-600/20 hover:bg-emerald-600/40"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};
