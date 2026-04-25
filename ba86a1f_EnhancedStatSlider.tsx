import React from 'react';

export interface EnhancedStatSliderProps {
  field: string;
  steps: Array<{ value: number; weight: number }>;
  selectedTick: number;
  onSelectTick: (idx: number) => void;
  description: string;
  isMalus: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onStepChange: (idx: number, step: { value: number; weight: number }) => void;
  onAddStep: (idx: number) => void;
  onRemoveStep: (idx: number) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export const EnhancedStatSlider: React.FC<EnhancedStatSliderProps> = ({
  field,
  steps,
  selectedTick,
  onSelectTick,
  description,
  isMalus,
  collapsed,
  onToggleCollapse,
  onStepChange,
  onAddStep,
  onRemoveStep,
  draggable,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  // Ensure at least 3 ticks for visual consistency
  const ticks = steps.length >= 3 ? steps : [...steps, ...Array(3 - steps.length).fill({ value: 0, weight: 1 })];

  return (
    <div
      className={`max-w-full backdrop-blur-md bg-white/5 rounded-lg border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-purple-400/30 group ${collapsed ? 'flex-grow-0 basis-auto' : 'flex-grow basis-[320px]'}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5 cursor-move"
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-200 uppercase tracking-wide">
            {field}
          </span>
          {isMalus && <span className="text-yellow-400 text-xs" title="Malus">⚠️</span>}
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="text-gray-400 hover:text-white transition-colors w-5 h-5 flex items-center justify-center"
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

      {!collapsed && (
        <div className="p-4">
          <div className="flex flex-col gap-2 overflow-x-auto custom-scrollbar pb-2">

            {/* Row 1: Values */}
            <div className="flex items-end justify-between px-2 min-w-max gap-4">
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
            <div className="relative h-8 w-full min-w-max px-2">
              {/* Track Background */}
              <div className="absolute top-1/2 left-2 right-6 h-2 bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-purple-900/40 rounded-full -translate-y-1/2 shadow-inner" />

              {/* Ticks on Track */}
              <div className="absolute inset-0 left-2 right-6 flex justify-between items-center pointer-events-none">
                {ticks.map((_, idx) => (
                  <div
                    key={`tick-${idx}`}
                    className={`w-2 h-2 rounded-full transition-all ${selectedTick === idx
                      ? 'bg-blue-400 scale-150 shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                      : 'bg-gray-600 scale-100'
                      }`}
                  />
                ))}
              </div>

              {/* Custom Range Input with styled thumb */}
              <input
                type="range"
                min={0}
                max={ticks.length - 1}
                value={selectedTick}
                onChange={(e) => onSelectTick(Number(e.target.value))}
                className="slider-custom absolute inset-0 w-full h-full cursor-pointer z-10"
                title="Drag to select tick"
                style={{
                  background: 'transparent',
                }}
              />
            </div>

            {/* Row 3: Weights */}
            <div className="flex items-start justify-between px-2 min-w-max gap-4">
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

          </div>

          <div className="mt-2 text-xs text-gray-500 italic truncate text-center">
            {description}
          </div>
        </div>
      )}

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider-custom::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          cursor: pointer;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.6), 0 0 20px rgba(59, 130, 246, 0.4);
          border: 2px solid #ffffff;
          transition: all 0.2s ease;
        }
        
        .slider-custom::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 16px rgba(59, 130, 246, 0.8), 0 0 28px rgba(59, 130, 246, 0.6);
        }
        
        .slider-custom::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          cursor: pointer;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.6), 0 0 20px rgba(59, 130, 246, 0.4);
          border: 2px solid #ffffff;
          transition: all 0.2s ease;
        }
        
        .slider-custom::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 16px rgba(59, 130, 246, 0.8), 0 0 28px rgba(59, 130, 246, 0.6);
        }

        .slider-custom::-webkit-slider-runnable-track {
          background: transparent;
        }

        .slider-custom::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
};
