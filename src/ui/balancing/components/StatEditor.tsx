import React, { useState, useCallback, useMemo } from 'react';
import { X, Save, RotateCcw, AlertCircle } from 'lucide-react';
import type { StatDefinition } from '../../../balancing/config/types';

interface StatEditorProps {
  stat?: StatDefinition;
  availableIds: string[];
  onSave: (statId: string, updates: Partial<StatDefinition>) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

/**
 * StatEditor component for creating and editing stat definitions
 * Provides real-time validation and config-driven constraints
 */
export const StatEditor: React.FC<StatEditorProps> = ({
  stat,
  availableIds,
  onSave,
  onCancel,
  mode,
}) => {
  const [formData, setFormData] = useState<Partial<StatDefinition>>(() => ({
    id: stat?.id ?? '',
    label: stat?.label ?? '',
    description: stat?.description ?? '',
    type: stat?.type ?? 'number',
    min: stat?.min ?? 0,
    max: stat?.max ?? 100,
    step: stat?.step ?? 1,
    defaultValue: stat?.defaultValue ?? 0,
    weight: stat?.weight ?? 1,
    isCore: stat?.isCore ?? false,
    isDerived: stat?.isDerived ?? false,
    formula: stat?.formula ?? '',
    bgColor: stat?.bgColor ?? '#1f2937',
    isLocked: stat?.isLocked ?? false,
    isHidden: stat?.isHidden ?? false,
    icon: stat?.icon ?? '',
    isPenalty: stat?.isPenalty ?? false,
    baseStat: stat?.baseStat ?? (!stat?.isDerived && !stat?.isPenalty),
    isDetrimental: stat?.isDetrimental ?? !!stat?.isPenalty,
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate formula when it changes
  const isFormulaValid = useMemo(() => {
    if (formData.isDerived && formData.formula) {
      // Basic formula validation - check for common patterns
      const formula = formData.formula;
      const hasValidChars = /^[a-zA-Z0-9+\-*/().\s]+$/.test(formula);
      const hasBalancedParens = (formula.match(/\(/g) || []).length === (formula.match(/\)/g) || []).length;
      
      return hasValidChars && hasBalancedParens;
    } else {
      return true;
    }
  }, [formData.isDerived, formData.formula]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.id?.trim()) {
      newErrors.id = 'ID is required';
    } else if (mode === 'create' && availableIds.includes(formData.id.trim())) {
      newErrors.id = 'ID already exists';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.id.trim())) {
      newErrors.id = 'ID must contain only letters, numbers, underscores, and hyphens';
    }

    if (!formData.label?.trim()) {
      newErrors.label = 'Label is required';
    }

    if (typeof formData.min !== 'number' || typeof formData.max !== 'number' || formData.min >= formData.max) {
      newErrors.range = 'Min must be less than max';
    }

    if (typeof formData.defaultValue !== 'number' || 
        formData.defaultValue < formData.min! || 
        formData.defaultValue > formData.max!) {
      newErrors.defaultValue = 'Default value must be within min/max range';
    }

    if (typeof formData.step !== 'number' || formData.step <= 0) {
      newErrors.step = 'Step must be positive';
    }

    if (typeof formData.weight !== 'number' || formData.weight < 0) {
      newErrors.weight = 'Weight must be non-negative';
    }

    if (formData.isDerived && !formData.formula?.trim()) {
      newErrors.formula = 'Formula is required for derived stats';
    } else if (formData.isDerived && !isFormulaValid) {
      newErrors.formula = 'Formula contains invalid syntax';
    }

    if (!formData.bgColor?.trim() || !/^#[0-9A-Fa-f]{6}$/.test(formData.bgColor.trim())) {
      newErrors.bgColor = 'Valid hex color required (e.g., #1f2937)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, availableIds, mode, isFormulaValid]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const statId = formData.id!.trim();
    const updates: Partial<StatDefinition> = {
      ...formData,
      id: statId,
      label: formData.label!.trim(),
      description: formData.description?.trim() || undefined,
      min: formData.min!,
      max: formData.max!,
      step: formData.step!,
      defaultValue: formData.defaultValue!,
      weight: formData.weight!,
      bgColor: formData.bgColor!.trim(),
      icon: formData.icon?.trim() || undefined,
      formula: formData.isDerived ? formData.formula?.trim() || '' : undefined,
    };

    onSave(statId, updates);
  }, [formData, validateForm, onSave]);

  const handleInputChange = useCallback((field: keyof StatDefinition, value: StatDefinition[keyof StatDefinition]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const generateIdFromLabel = useCallback(() => {
    if (formData.label) {
      const id = formData.label
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      handleInputChange('id', id);
    }
  }, [formData.label, handleInputChange]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-200">
            {mode === 'create' ? 'Create Stat' : 'Edit Stat'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                ID *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.id || ''}
                  onChange={(e) => handleInputChange('id', e.target.value)}
                  placeholder="e.g., hit_points"
                  className={`flex-1 px-3 py-2 text-sm rounded border bg-slate-950 text-slate-200 outline-none transition-colors ${
                    errors.id 
                      ? 'border-red-400 focus:border-red-400' 
                      : 'border-slate-600 focus:border-indigo-400'
                  }`}
                  disabled={mode === 'edit'}
                />
                {mode === 'create' && (
                  <button
                    type="button"
                    onClick={generateIdFromLabel}
                    className="px-3 py-2 text-xs rounded border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Auto
                  </button>
                )}
              </div>
              {errors.id && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.id}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Label *
              </label>
              <input
                type="text"
                value={formData.label || ''}
                onChange={(e) => handleInputChange('label', e.target.value)}
                placeholder="e.g., Hit Points"
                className={`w-full px-3 py-2 text-sm rounded border bg-slate-950 text-slate-200 outline-none transition-colors ${
                  errors.label 
                    ? 'border-red-400 focus:border-red-400' 
                    : 'border-slate-600 focus:border-indigo-400'
                }`}
              />
              {errors.label && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.label}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Stat description..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded border border-slate-600 bg-slate-950 text-slate-200 outline-none focus:border-indigo-400 transition-colors resize-none"
            />
          </div>

          {/* Type and Range */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded border border-slate-600 bg-slate-950 text-slate-200 outline-none focus:border-indigo-400"
              >
                <option value="number">Number</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Min
              </label>
              <input
                type="number"
                value={formData.min || ''}
                onChange={(e) => handleInputChange('min', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded border border-slate-600 bg-slate-950 text-slate-200 outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Max
              </label>
              <input
                type="number"
                value={formData.max || ''}
                onChange={(e) => handleInputChange('max', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded border border-slate-600 bg-slate-950 text-slate-200 outline-none focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Step
              </label>
              <input
                type="number"
                step="any"
                value={formData.step || ''}
                onChange={(e) => handleInputChange('step', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded border border-slate-600 bg-slate-950 text-slate-200 outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {errors.range && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.range}
            </p>
          )}

          {/* Default Value and Weight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Default Value
              </label>
              <input
                type="number"
                value={formData.defaultValue || ''}
                onChange={(e) => handleInputChange('defaultValue', Number(e.target.value))}
                className={`w-full px-3 py-2 text-sm rounded border bg-slate-950 text-slate-200 outline-none transition-colors ${
                  errors.defaultValue 
                    ? 'border-red-400 focus:border-red-400' 
                    : 'border-slate-600 focus:border-indigo-400'
                }`}
              />
              {errors.defaultValue && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.defaultValue}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Weight
              </label>
              <input
                type="number"
                step="any"
                value={formData.weight || ''}
                onChange={(e) => handleInputChange('weight', Number(e.target.value))}
                className={`w-full px-3 py-2 text-sm rounded border bg-slate-950 text-slate-200 outline-none transition-colors ${
                  errors.weight 
                    ? 'border-red-400 focus:border-red-400' 
                    : 'border-slate-600 focus:border-indigo-400'
                }`}
              />
              {errors.weight && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.weight}
                </p>
              )}
            </div>
          </div>

          {/* Formula (for derived stats) */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-1">
              <input
                type="checkbox"
                checked={formData.isDerived || false}
                onChange={(e) => handleInputChange('isDerived', e.target.checked)}
                className="rounded border-slate-600 bg-slate-950 text-indigo-400 focus:ring-indigo-400 focus:ring-offset-slate-900"
              />
              Derived Stat
            </label>
            {formData.isDerived && (
              <div>
                <textarea
                  value={formData.formula || ''}
                  onChange={(e) => handleInputChange('formula', e.target.value)}
                  placeholder="e.g., hp * 0.1 + defense * 0.05"
                  rows={2}
                  className={`w-full px-3 py-2 text-sm rounded border bg-slate-950 text-slate-200 outline-none transition-colors resize-none font-mono ${
                    errors.formula || !isFormulaValid
                      ? 'border-red-400 focus:border-red-400' 
                      : 'border-slate-600 focus:border-indigo-400'
                  }`}
                />
                {errors.formula && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.formula}
                  </p>
                )}
                {!isFormulaValid && (
                  <p className="mt-1 text-xs text-amber-400">
                    Formula syntax appears invalid
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Visual Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Background Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.bgColor || '#1f2937'}
                  onChange={(e) => handleInputChange('bgColor', e.target.value)}
                  className="h-9 w-9 rounded border border-slate-600 bg-slate-950"
                />
                <input
                  type="text"
                  value={formData.bgColor || ''}
                  onChange={(e) => handleInputChange('bgColor', e.target.value)}
                  placeholder="#1f2937"
                  className={`flex-1 px-3 py-2 text-sm rounded border bg-slate-950 text-slate-200 outline-none transition-colors ${
                    errors.bgColor 
                      ? 'border-red-400 focus:border-red-400' 
                      : 'border-slate-600 focus:border-indigo-400'
                  }`}
                />
              </div>
              {errors.bgColor && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.bgColor}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Icon
              </label>
              <input
                type="text"
                value={formData.icon || ''}
                onChange={(e) => handleInputChange('icon', e.target.value)}
                placeholder="icon-name"
                className="w-full px-3 py-2 text-sm rounded border border-slate-600 bg-slate-950 text-slate-200 outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Flags */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isCore || false}
                  onChange={(e) => handleInputChange('isCore', e.target.checked)}
                  className="rounded border-slate-600 bg-slate-950 text-indigo-400 focus:ring-indigo-400 focus:ring-offset-slate-900"
                />
                Core Stat
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.baseStat || false}
                  onChange={(e) => handleInputChange('baseStat', e.target.checked)}
                  className="rounded border-slate-600 bg-slate-950 text-indigo-400 focus:ring-indigo-400 focus:ring-offset-slate-900"
                />
                Base Stat
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isPenalty || false}
                  onChange={(e) => handleInputChange('isPenalty', e.target.checked)}
                  className="rounded border-slate-600 bg-slate-950 text-indigo-400 focus:ring-indigo-400 focus:ring-offset-slate-900"
                />
                Penalty
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isDetrimental || false}
                  onChange={(e) => handleInputChange('isDetrimental', e.target.checked)}
                  className="rounded border-slate-600 bg-slate-950 text-indigo-400 focus:ring-indigo-400 focus:ring-offset-slate-900"
                />
                Detrimental
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isLocked || false}
                  onChange={(e) => handleInputChange('isLocked', e.target.checked)}
                  className="rounded border-slate-600 bg-slate-950 text-indigo-400 focus:ring-indigo-400 focus:ring-offset-slate-900"
                />
                Locked
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isHidden || false}
                  onChange={(e) => handleInputChange('isHidden', e.target.checked)}
                  className="rounded border-slate-600 bg-slate-950 text-indigo-400 focus:ring-indigo-400 focus:ring-offset-slate-900"
                />
                Hidden
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <div className="flex gap-2">
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => {
                    if (stat) {
                      onSave(stat.id, stat);
                    }
                  }}
                  className="px-3 py-2 text-xs rounded border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm rounded border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm rounded border border-indigo-500 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 transition-colors flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                {mode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
