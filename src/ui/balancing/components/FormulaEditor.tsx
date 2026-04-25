import React, { useState, useCallback, useMemo } from 'react';
import { X, Save, RotateCcw, AlertCircle, Code } from 'lucide-react';
import type { StatDefinition } from '../../../balancing/config/types';

interface FormulaEditorProps {
  stat?: StatDefinition;
  availableStats: StatDefinition[];
  onSave: (statId: string, formula: string) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

/**
 * FormulaEditor component for editing derived stat formulas
 * Provides syntax highlighting, validation, and stat reference suggestions
 */
export const FormulaEditor: React.FC<FormulaEditorProps> = ({
  stat,
  availableStats,
  onSave,
  onCancel,
  mode,
}) => {
  const [formula, setFormula] = useState(stat?.formula ?? '');
  const [cursorPosition, setCursorPosition] = useState(0);

  // Basic formula validation helper
  const validateForm = useCallback((formulaText: string) => {
    const newErrors: string[] = [];
    
    if (!formulaText.trim()) {
      newErrors.push('Formula cannot be empty');
    }

    const openParens = (formulaText.match(/\(/g) || []).length;
    const closeParens = (formulaText.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      newErrors.push('Unbalanced parentheses');
    }

    const validChars = /^[a-zA-Z0-9+\-*/().\s]+$/;
    if (!validChars.test(formulaText)) {
      newErrors.push('Formula contains invalid characters');
    }

    const statRefs = formulaText.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    const validStatIds = new Set(availableStats.map(s => s.id));
    const undefinedStats = statRefs.filter(ref => !validStatIds.has(ref) && isNaN(Number(ref)));
    
    if (undefinedStats.length > 0) {
      newErrors.push(`Undefined stats: ${undefinedStats.join(', ')}`);
    }

    return newErrors;
  }, [availableStats]);

  const getSuggestions = useCallback((text: string, position: number) => {
    const beforeCursor = text.substring(0, position);
    const lastWordMatch = beforeCursor.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
    
    if (!lastWordMatch) return [];
    
    const lastWord = lastWordMatch[0].toLowerCase();
    return availableStats
      .filter(s => s.id.toLowerCase().includes(lastWord))
      .map(s => s.id);
  }, [availableStats]);

  // Derived state using useMemo to eliminate cascading renders
  const errors = useMemo(() => validateForm(formula), [formula, validateForm]);
  
  const suggestions = useMemo(() => 
    getSuggestions(formula, cursorPosition), 
    [formula, cursorPosition, getSuggestions]
  );

  const showSuggestions = useMemo(() => suggestions.length > 0, [suggestions]);

  const isFormulaValid = useMemo(() => {
    if (!formula) return true;
    const hasValidChars = /^[a-zA-Z0-9+\-*/().\s]+$/.test(formula);
    const hasBalancedParens = (formula.match(/\(/g) || []).length === (formula.match(/\)/g) || []).length;
    return hasValidChars && hasBalancedParens;
  }, [formula]);

  const handleFormulaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormula(e.target.value);
    setCursorPosition(e.target.selectionStart ?? 0);
  }, []);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    const beforeCursor = formula.substring(0, cursorPosition);
    const afterCursor = formula.substring(cursorPosition);
    const lastWordMatch = beforeCursor.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
    
    let newFormula;
    if (lastWordMatch) {
      const beforeWord = beforeCursor.substring(0, beforeCursor.length - lastWordMatch[0].length);
      newFormula = beforeWord + suggestion + afterCursor;
    } else {
      newFormula = beforeCursor + suggestion + afterCursor;
    }
    
    setFormula(newFormula);
  }, [formula, cursorPosition]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validateForm(formula);
    if (newErrors.length > 0) {
      return;
    }

    const statId = stat?.id || 'new_stat';
    onSave(statId, formula);
  }, [formula, validateForm, onSave, stat]);

  const insertOperator = useCallback((operator: string) => {
    const newFormula = formula.substring(0, cursorPosition) + operator + formula.substring(cursorPosition);
    setFormula(newFormula);
    setCursorPosition(cursorPosition + operator.length);
  }, [formula, cursorPosition]);

  const formatFormula = useCallback(() => {
    // Basic formatting: add spaces around operators
    const formatted = formula
      .replace(/\s+/g, ' ')
      .replace(/([+\-*/()])/g, ' $1 ')
      .replace(/\s+/g, ' ')
      .trim();
    setFormula(formatted);
  }, [formula]);

  const getHighlightedFormula = useCallback(() => {
    let highlighted = formula;
    
    // Highlight stat references
    availableStats.forEach(stat => {
      const regex = new RegExp(`\\b${stat.id}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="text-cyan-400 font-semibold">${stat.id}</span>`);
    });
    
    // Highlight operators
    highlighted = highlighted.replace(/([+\-*/()])/g, '<span class="text-amber-400 font-bold">$1</span>');
    
    // Highlight numbers
    highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-emerald-400">$1</span>');
    
    return highlighted;
  }, [formula, availableStats]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="shrink-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-slate-200">
              {mode === 'create' ? 'Create Formula' : 'Edit Formula'}
              {!isFormulaValid && (
                <span className="ml-2 text-xs text-red-400 font-normal">(Invalid Syntax)</span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Formula Input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Formula Expression
              </label>
              <div className="relative">
                <textarea
                  value={formula}
                  onChange={handleFormulaChange}
                  onSelect={(e) => setCursorPosition(e.currentTarget.selectionStart ?? 0)}
                  placeholder="e.g., hp * 0.1 + defense * 0.05"
                  rows={4}
                  className="w-full px-3 py-2 text-sm font-mono rounded border border-slate-600 bg-slate-950 text-slate-200 outline-none focus:border-indigo-400 resize-none"
                />
                
                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-32 overflow-y-auto z-10">
                    {suggestions.map((suggestion: string, index: number) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-2"
                      >
                        <span className="text-cyan-400">{suggestion}</span>
                        <span className="text-slate-500">
                          {availableStats.find(s => s.id === suggestion)?.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Formula Preview */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Preview
              </label>
              <div 
                className="px-3 py-2 text-sm font-mono rounded border border-slate-600 bg-slate-950 min-h-15"
                dangerouslySetInnerHTML={{ __html: getHighlightedFormula() || '<span class="text-slate-500">Formula preview...</span>' }}
              />
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="rounded-lg border border-red-400/60 bg-red-500/10 p-3">
                <h4 className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Validation Errors
                </h4>
                <ul className="space-y-1">
                  {errors.map((error: string, index: number) => (
                    <li key={index} className="text-xs text-red-300">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Available Stats Reference */}
            <div>
              <h4 className="text-xs font-medium text-slate-300 mb-2">Available Stats</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {availableStats.map((stat) => (
                  <button
                    key={stat.id}
                    type="button"
                    onClick={() => handleSuggestionClick(stat.id)}
                    className="px-2 py-1 text-xs rounded border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-left"
                  >
                    <span className="text-cyan-400 font-mono">{stat.id}</span>
                    <span className="text-slate-500 ml-1">{stat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Operators */}
            <div>
              <h4 className="text-xs font-medium text-slate-300 mb-2">Quick Insert</h4>
              <div className="flex flex-wrap gap-2">
                {['+', '-', '*', '/', '(', ')'].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => insertOperator(op)}
                    className="px-3 py-1 text-xs rounded border border-slate-600 bg-slate-800 text-amber-400 hover:bg-slate-700 transition-colors font-bold"
                  >
                    {op}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => insertOperator(' * ')}
                  className="px-3 py-1 text-xs rounded border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  ×
                </button>
                <button
                  type="button"
                  onClick={() => insertOperator(' / ')}
                  className="px-3 py-1 text-xs rounded border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  ÷
                </button>
                <button
                  type="button"
                  onClick={formatFormula}
                  className="px-3 py-1 text-xs rounded border border-slate-600 bg-slate-800 text-indigo-400 hover:bg-slate-700 transition-colors"
                >
                  Format
                </button>
              </div>
            </div>

            {/* Formula Examples */}
            <div>
              <h4 className="text-xs font-medium text-slate-300 mb-2">Examples</h4>
              <div className="space-y-1">
                {[
                  'hp * 0.1 + defense * 0.05',
                  '(strength + dexterity) * 0.5',
                  'max_hp * (0.8 + level * 0.02)',
                  'base_damage * (1 + crit_chance * crit_multiplier)',
                ].map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormula(example)}
                    className="block w-full text-left px-2 py-1 text-xs rounded border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 transition-colors font-mono"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="shrink-0 bg-slate-900 border-t border-slate-700 p-4 flex items-center justify-between">
            <div className="flex gap-2">
              {mode === 'edit' && stat && (
                <button
                  type="button"
                  onClick={() => onSave(stat.id, stat.formula || '')}
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
                disabled={errors.length > 0}
                className="px-4 py-2 text-sm rounded border border-indigo-500 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
