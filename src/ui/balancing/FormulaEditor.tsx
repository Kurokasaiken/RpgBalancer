import React, { useEffect, useMemo, useRef, useState } from 'react';
import { suggestCompletions, validateFormula } from '../../balancing/config/FormulaEngine';

interface Props {
  value: string;
  onChange: (formula: string) => void;
  availableStats: string[];
}

const OPERATOR_TOKENS = ['+', '-', '*', '/', '(', ')'];

export const FormulaEditor: React.FC<Props> = ({ value, onChange, availableStats }) => {
  const [error, setError] = useState<string | undefined>();
  const [cursorPos, setCursorPos] = useState(0);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!value) {
      setError('Formula cannot be empty');
      return;
    }
    const result = validateFormula(value, availableStats);
    setError(result.valid ? undefined : result.error);
  }, [value, availableStats]);

  const { suggestions, matchStart, matchEnd } = useMemo(() => {
    const safeCursor = Math.min(Math.max(cursorPos, 0), value.length);
    const beforeCursor = value.slice(0, safeCursor);
    const match = beforeCursor.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
    const currentWord = match ? match[0] : '';
    const start = match ? safeCursor - currentWord.length : safeCursor;
    const list = currentWord ? suggestCompletions(currentWord, availableStats) : [];
    return {
      suggestions: list.slice(0, 8),
      matchStart: start,
      matchEnd: safeCursor,
    };
  }, [value, cursorPos, availableStats]);

  useEffect(() => {
    setActiveSuggestion(0);
  }, [suggestions.length, value]);

  const borderClass = error
    ? 'border-red-500/70 focus:ring-red-500/40'
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

  const insertSuggestion = (suggestion: string) => insertToken(suggestion, true);

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
      insertSuggestion(suggestions[activeSuggestion]);
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-slate-200">Formula</label>
      <textarea
        ref={textareaRef}
        className={`w-full h-20 text-xs rounded-md bg-slate-950/80 ${borderClass} outline-none px-2 py-1.5 text-slate-100`}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
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
                key={suggestion}
                type="button"
                className={`px-2 py-0.5 rounded border ${
                  index === activeSuggestion
                    ? 'border-amber-400 text-amber-200 bg-amber-500/10'
                    : 'border-slate-700 text-slate-200 hover:border-amber-400/60'
                }`}
                onMouseEnter={() => setActiveSuggestion(index)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertSuggestion(suggestion);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-slate-500">Premi TAB per inserire il suggerimento selezionato.</p>
        </div>
      )}
      {error ? (
        <p className="text-[10px] text-red-300">{error}</p>
      ) : (
        <p className="text-[10px] text-emerald-300">Formula valida.</p>
      )}
      <div className="text-[10px] text-slate-500 mt-1">
        <span className="font-semibold text-slate-300">Stats disponibili:</span>{' '}
        {availableStats.join(', ') || 'nessuna'}
      </div>
    </div>
  );
};
