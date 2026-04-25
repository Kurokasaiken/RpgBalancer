import React, { useMemo, useRef, useState } from 'react';
import { validateFormula, lintFormula, createFormulaContext, type FormulaWarning, type FormulaSafetyReport } from '../../balancing/config/FormulaEngine';
import { FormulaSafetyBadge } from './components/FormulaSafetyBadge';

/**
 * Props for the FormulaEditor component.
 */
interface Props {
  value: string;
  onChange: (formula: string) => void;
  availableStats: { id: string; label: string; min?: number; max?: number }[];
  enableSafetyChecks?: boolean;
}

const OPERATOR_TOKENS = ['+', '-', '*', '/', '(', ')'];

// Safety UI components moved outside render
interface SafetyIndicatorProps {
  safety: FormulaSafetyReport | undefined;
  showSafety: boolean;
  onToggleSafety: () => void;
}

const SafetyIndicator: React.FC<SafetyIndicatorProps> = ({ safety, showSafety, onToggleSafety }) => {
  if (!safety) return null;
  
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-emerald-300';
      case 'medium': return 'text-yellow-300';
      case 'high': return 'text-red-300';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="mt-2 p-2 bg-slate-900/60 border border-slate-700 rounded text-[10px]">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-slate-300">Formula Safety</span>
        <button
          type="button"
          className="text-[9px] text-amber-300 hover:text-amber-200"
          onClick={onToggleSafety}
        >
          {showSafety ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {showSafety && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span>Complexity:</span>
            <span className={getComplexityColor(safety.complexity)}>
              {safety.complexity} ({safety.estimatedOperations} ops)
            </span>
          </div>
          
          {safety.hasCycles && (
            <div className="text-red-300">⚠ Potential circular dependency</div>
          )}
          
          {safety.divisionRisk && (
            <div className="text-yellow-300">⚠ Division by zero risk</div>
          )}
          
          {safety.rangeIssues.length > 0 && (
            <div className="space-y-1">
              <div className="text-orange-300">Range Issues:</div>
              {safety.rangeIssues.map((issue, idx) => (
                <div key={idx} className="ml-2 text-orange-200">
                  • {issue.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface WarningsDisplayProps {
  warnings: FormulaWarning[];
}

const WarningsDisplay: React.FC<WarningsDisplayProps> = ({ warnings }) => {
  if (warnings.length === 0) return null;
  
  return (
    <div className="mt-2 space-y-1">
      {warnings.map((warning, idx) => (
        <div
          key={idx}
          className={`text-[10px] p-1 rounded ${
            warning.severity === 'error' ? 'text-red-300 bg-red-500/10' :
            warning.severity === 'warning' ? 'text-yellow-300 bg-yellow-500/10' :
            'text-blue-300 bg-blue-500/10'
          }`}
        >
          <span className="font-semibold capitalize">{warning.type}:</span> {warning.message}
        </div>
      ))}
    </div>
  );
};

export const FormulaEditor: React.FC<Props> = ({ value, onChange, availableStats, enableSafetyChecks = false }) => {
  const [cursorPos, setCursorPos] = useState(0);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [showRaw, setShowRaw] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Create formula context for safety checks
  const formulaContext = useMemo(() => {
    if (!enableSafetyChecks) return undefined;
    return createFormulaContext(
      availableStats.map(stat => ({
        id: stat.id,
        min: stat.min ?? 0,
        max: stat.max ?? 100
      }))
    );
  }, [availableStats, enableSafetyChecks]);

  // Enhanced validation with safety checks
  const validationResult = useMemo(() => {
    const statIds = availableStats.map((s) => s.id);
    if (enableSafetyChecks && formulaContext) {
      return validateFormula(value, statIds, formulaContext);
    }
    return validateFormula(value, statIds);
  }, [value, availableStats, enableSafetyChecks, formulaContext]);

  // Real-time linting for warnings
  const lintWarnings = useMemo(() => {
    if (!value) return [];
    const statIds = availableStats.map((s) => s.id);
    return lintFormula(value, statIds);
  }, [value, availableStats]);

  const error = validationResult.error;
  const warnings = validationResult.warnings || lintWarnings;
  const safety = validationResult.safety;

  const { suggestions, matchStart, matchEnd } = useMemo(() => {
    const safeCursor = Math.min(Math.max(cursorPos, 0), value.length);
    const beforeCursor = value.slice(0, safeCursor);
    const match = beforeCursor.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
    const currentWord = match ? match[0] : '';
    const start = match ? safeCursor - currentWord.length : safeCursor;
    const needle = currentWord.toLowerCase();
    const list = availableStats
      .filter((s) => {
        if (!needle) return true;
        return (
          s.label.trim().toLowerCase().includes(needle) ||
          s.id.toLowerCase().startsWith(needle)
        );
      })
      .slice(0, 8);
    return {
      suggestions: list.slice(0, 8),
      matchStart: start,
      matchEnd: safeCursor,
    };
  }, [value, cursorPos, availableStats]);

  const prettyFormula = useMemo(() => {
    if (!value) return '';
    if (!availableStats.length) return value;

    const idToLabel: Record<string, string> = {};
    availableStats.forEach((s) => {
      idToLabel[s.id] = s.label;
    });

    return value.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (token) => {
      return idToLabel[token] ?? token;
    });
  }, [value, availableStats]);

  const borderClass = error
    ? 'border-red-500/70 focus:ring-red-500/40'
    : warnings.some(w => w.severity === 'error')
    ? 'border-orange-500/70 focus:ring-orange-500/40'
    : warnings.some(w => w.severity === 'warning')
    ? 'border-yellow-500/70 focus:ring-yellow-500/40'
    : 'border-emerald-500/50 focus:ring-emerald-500/30';

  const updateCursorFromEvent = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    setCursorPos(target.selectionStart ?? target.value.length);
  };

  const insertToken = (token: string, replaceWord = false) => {
    const start = replaceWord ? matchStart ?? cursorPos : cursorPos;
    const end = replaceWord ? matchEnd ?? cursorPos : cursorPos;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const nextValue = `${before}${token}${after}`;
    onChange(nextValue);
    const nextCursor = start + token.length;
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(nextCursor, nextCursor);
      }
      setCursorPos(nextCursor);
    });
  };

  const insertSuggestion = (suggestionId: string) => insertToken(suggestionId, true);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!suggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestion((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestion((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      insertSuggestion(suggestions[activeSuggestion].id);
    }
  };

  // Safety UI components moved outside render
  const handleToggleSafety = () => setShowSafety(!showSafety);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-medium text-slate-200">Formula</label>
          {enableSafetyChecks && safety && (
            <FormulaSafetyBadge 
              safety={safety} 
              warnings={warnings}
              showDetails={false}
              className="text-xs"
            />
          )}
        </div>
        <div className="flex gap-2">
          {enableSafetyChecks && (
            <button
              type="button"
              className="px-2 py-0.5 rounded border border-slate-700 text-[9px] text-slate-300 hover:border-amber-400/60 hover:text-amber-200"
              onClick={handleToggleSafety}
            >
              {showSafety ? 'Hide Safety' : 'Show Safety'}
            </button>
          )}
          <button
            type="button"
            className="px-2 py-0.5 rounded border border-slate-700 text-[9px] text-slate-300 hover:border-amber-400/60 hover:text-amber-200"
            onClick={() => setShowRaw((prev) => !prev)}
          >
            {showRaw ? 'Nascondi formula tecnica' : 'Modifica formula (avanzato)'}
          </button>
        </div>
      </div>

      <div className="text-[10px] text-slate-500">
        <span className="font-semibold text-slate-300">Formula (nomi):</span>{' '}
        {prettyFormula || '—'}
      </div>

      {error ? (
        <p className="text-[10px] text-red-300">{error}</p>
      ) : (
        <p className="text-[10px] text-emerald-300">Formula valida.</p>
      )}

      {showRaw && (
        <>
          <textarea
            ref={textareaRef}
            className={`w-full h-20 text-xs rounded-md bg-slate-950/80 ${borderClass} outline-none px-2 py-1.5 text-slate-100`}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setActiveSuggestion(0);
              setCursorPos(e.target.selectionStart ?? e.target.value.length);
            }}
            onKeyDown={handleKeyDown}
            onClick={updateCursorFromEvent}
            onKeyUp={updateCursorFromEvent}
            onSelect={updateCursorFromEvent}
            placeholder="Es. hp / damage"
          />
          <div className="flex flex-wrap gap-1 text-[10px] text-slate-300">
            {OPERATOR_TOKENS.map((token) => (
              <button
                key={token}
                type="button"
                className="px-2 py-0.5 border border-slate-700 rounded bg-slate-900/60 hover:border-amber-400/60"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertToken(token);
                }}
              >
                {token}
              </button>
            ))}
            <span className="text-[9px] text-slate-500">Click per inserire operatori base.</span>
          </div>
          {suggestions.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-700 rounded-md p-2 text-[10px] text-slate-200 space-y-1">
              <p className="uppercase tracking-wide text-[9px] text-slate-500">Stats suggerite</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    className={`px-2 py-0.5 rounded border ${
                      index === activeSuggestion
                        ? 'border-amber-400 text-amber-200 bg-amber-500/10'
                        : 'border-slate-700 text-slate-200 hover:border-amber-400/60'
                    }`}
                    onMouseEnter={() => setActiveSuggestion(index)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertSuggestion(suggestion.id);
                    }}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-500">Premi TAB per inserire il suggerimento selezionato.</p>
            </div>
          )}
        </>
      )}

      <div className="text-[10px] text-slate-500 mt-1">
        <span className="font-semibold text-slate-300">Stats disponibili:</span>{' '}
        {availableStats.map((s) => s.label).join(', ') || 'nessuna'}
      </div>

      {/* Safety Analysis */}
      <SafetyIndicator 
        safety={safety} 
        showSafety={showSafety} 
        onToggleSafety={handleToggleSafety} 
      />
      
      {/* Warnings Display */}
      <WarningsDisplay warnings={warnings} />
    </div>
  );
};
;
