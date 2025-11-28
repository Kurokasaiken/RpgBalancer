import React from 'react';
import { GlassCard } from '../../atoms/GlassCard';

interface EnhancedStatSliderProps {
  field: string;
  ticks: Array<{ value: number; weight: number }>;
  selectedTick: number;
  onSelectTick: (index: number) => void;
  description: string;
  isMalus: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onStepChange: (index: number, step: { value: number; weight: number }) => void;
  onAddStep: (index: number) => void;
  onRemoveStep: (index: number) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, field: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, field: string) => void;
  renderDerivedStats?: (currentValue: number) => React.ReactNode;
}

export const EnhancedStatSlider: React.FC<EnhancedStatSliderProps> = ({
  field,
  ticks,
  selectedTick,
  onSelectTick,
  description,
  isMalus,
  collapsed,
  onToggleCollapse,
  onStepChange,
  onAddStep,
  onRemoveStep,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  renderDerivedStats
}) => {
  return (
    <div className="mb-2 transition-all duration-300">
      <GlassCard padding="none" className="overflow-hidden">
        {/* HEADER - Draggable ONLY */}
        <div
          draggable={draggable}
          onDragStart={(e) => onDragStart?.(e, field)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop?.(e, field)}
          className="flex justify-between items-center p-3 cursor-grab active:cursor-grabbing bg-white/5 border-b border-white/10"
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-500">☰</span>
            <span className="font-bold text-blue-200 capitalize">
              {field}
            </span>
            {isMalus && <span className="text-yellow-400 text-xs" title="Malus">⚠️</span>}
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-gray-400 hover:text-white transition-colors w-5 h-5 flex items-center justify-center flex-shrink-0"
            title={collapsed ? "Show" : "Hide"}
          >
            {collapsed ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* CONTENT - NOT Draggable */}
        {!collapsed && (
          <div className="p-4 h-[180px] flex flex-col justify-between">
            <div className="flex flex-col gap-2 overflow-x-auto overflow-y-hidden custom-scrollbar flex-grow">

              {/* Row 1: Values */}
              <div className="flex flex-nowrap items-end justify-between px-2 min-w-max gap-4">
                {ticks.map((step, idx) => (
                  <div key={`val-${idx}`} className="flex flex-col items-center relative group/val">
                    {/* Add Button (Left) */}
                    <button
                      type="button"
                      onClick={() => onAddStep(idx - 1)}
                      className="absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center opacity-0 group-hover/val:opacity-100 hover:bg-green-500/40 transition-all z-20 text-[10px]"
                      title="Add tick before"
                    >
                      +
                    </button>

                    <input
                      type="number"
                      value={step.value}
                      onChange={e => onStepChange(idx, { ...step, value: Number(e.target.value) })}
                      className={`w-14 px-1 py-1 text-center text-sm bg-transparent rounded outline-none transition-all ${selectedTick === idx
                        ? 'text-blue-300 font-bold bg-blue-500/10 border border-blue-400/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                        : 'text-gray-300 border border-transparent hover:border-white/20 focus:border-blue-400'
                        }`}
                      placeholder="Val"
                    />
                  </div>
                ))}
                {/* Add Button (End) */}
                <button
                  type="button"
                  onClick={() => onAddStep(ticks.length - 1)}
                  className="w-4 h-4 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 flex items-center justify-center transition-colors text-[10px]"
                  title="Add tick at end"
                >
                  +
                </button>
              </div>

              {/* Row 2: Slider Track */}
              <div className="flex flex-nowrap items-center justify-between px-2 min-w-max gap-4 relative h-8">
                {/* Create same flex layout as input boxes to get exact positions */}
                {ticks.map((_, idx) => (
                  <div key={`track-spacer-${idx}`} className="w-14 relative flex items-center justify-center">
                    {/* Tick marker at center of this position only for selected */}
                    {idx === selectedTick && (
                      <div className="absolute w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_12px_rgba(59,130,246,0.8)] z-20 pointer-events-none" />
                    )}
                  </div>
                ))}
                {/* Spacer for consistency with add button */}
                <div className="w-4" />

                {/* Background track spanning across all positions */}
                <div className="absolute left-[calc(0.5rem+28px)] right-[calc(2.5rem+28px)] top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-purple-900/40 rounded-full shadow-inner pointer-events-none" />

                {/* Invisible full-width range input */}
                <input
                  type="range"
                  min={0}
                  max={ticks.length - 1}
                  value={selectedTick}
                  onChange={(e) => onSelectTick(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-10"
                  title="Drag to select tick"
                />
              </div>

              {/* Row 3: Weights */}
              <div className="flex flex-nowrap items-start justify-between px-2 min-w-max gap-4">
                {ticks.map((step, idx) => (
                  <div key={`wgt-${idx}`} className="flex flex-col items-center relative group/wgt">
                    <input
                      type="number"
                      value={step.weight}
                      step={0.1}
                      onChange={e => onStepChange(idx, { ...step, weight: Number(e.target.value) })}
                      className={`w-14 px-1 py-1 text-center text-xs bg-transparent rounded outline-none transition-all ${selectedTick === idx
                        ? 'text-purple-300 font-bold bg-purple-500/10 border border-purple-400/30 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                        : 'text-gray-400 border border-transparent hover:border-white/20 focus:border-purple-400'
                        }`}
                      placeholder="Wgt"
                    />

                    {/* Remove Button (Bottom) */}
                    {ticks.length > 3 && (
                      <button
                        type="button"
                        onClick={() => onRemoveStep(idx)}
                        className="text-red-400/50 hover:text-red-400 text-[10px] opacity-0 group-hover/wgt:opacity-100 transition-opacity mt-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {/* Spacer to align with top add button */}
                <div className="w-4" />
              </div>

              {/* Row 3.5: Derived Stats (Optional) */}
              {renderDerivedStats && (
                <div className="px-2 mb-2">
                  {renderDerivedStats(ticks[selectedTick].value)}
                </div>
              )}

            </div>

            {/* Row 4: Description - MOVED OUTSIDE scroll container */}
            <div className="text-xs text-gray-500 italic truncate text-center px-2 pt-2 border-t border-white/5 mt-1">
              {description}
            </div>
          </div>
        )}

        {/* Hide number input spinners for consistent width */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Hide spinners for Chrome, Safari, Edge, Opera */
            input[type=number]::-webkit-inner-spin-button,
            input[type=number]::-webkit-outer-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            
            /* Hide spinners for Firefox */
            input[type=number] {
              -moz-appearance: textfield;
            }
          `
        }} />
      </GlassCard>
    </div>
  );
};
