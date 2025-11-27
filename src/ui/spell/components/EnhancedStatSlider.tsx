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
  onRemoveStep
}) => {
  // Assicura almeno 3 tick
  const ticks = steps.length >= 3 ? steps : [...steps, ...Array(3 - steps.length).fill({ value: 0, weight: 1 })];

  return (
    <div className="backdrop-blur-md bg-white/5 rounded-lg p-3 border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:bg-white/8 hover:border-purple-400/30 hover:scale-[1.01] transition-all duration-300">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onToggleCollapse} className="text-xs text-gray-300 hover:text-blue-400 hover:drop-shadow-[0_0_4px_rgba(96,165,250,0.8)] transition-all">
            {collapsed ? '▶' : '▼'}
          </button>
          <label className="text-xs text-gray-300 font-medium" title={description}>
            {field.charAt(0).toUpperCase() + field.slice(1)}
            {isMalus && <span className="text-yellow-400 ml-1 text-xs">⚠️</span>}
          </label>
        </div>
      </div>
      {!collapsed && (
        <div className="space-y-2">
          {/* Slider con tick */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 flex justify-between items-center relative">
              {/* Track Line */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 rounded top-1/2 -translate-y-1/2 z-0 mx-4 shadow-[0_0_8px_rgba(139,92,246,0.4)]" />

              {/* Tick values and weights */}
              {ticks.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center z-20" style={{ minWidth: 40 }}>
                  {/* Valore sopra: sempre visibile e modificabile */}
                  <input
                    type="number"
                    value={step.value}
                    onChange={e => onStepChange(idx, { ...step, value: Number(e.target.value) })}
                    className={`mb-1 w-16 px-2 py-1 rounded text-xs text-center transition-all ${selectedTick === idx
                        ? 'bg-blue-950/30 text-white border border-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]'
                        : 'bg-white/5 text-gray-400 border-0'
                      }`}
                  />

                  {/* Peso sotto: sempre visibile e modificabile */}
                  <input
                    type="number"
                    value={step.weight}
                    step={0.01}
                    onChange={e => onStepChange(idx, { ...step, weight: Number(e.target.value) })}
                    className={`mt-1 w-16 px-2 py-1 rounded text-xs text-center transition-all ${selectedTick === idx
                        ? 'bg-purple-950/30 text-white border border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                        : 'bg-white/5 text-gray-400 border-0'
                      }`}
                  />
                  {/* Pulsanti + e - */}
                  <div className="flex gap-1 mt-1">
                    <button type="button" className="px-1 text-xs text-green-400" onClick={() => onAddStep(idx)}>+</button>
                    {ticks.length > 3 && <button type="button" className="px-1 text-xs text-red-400" onClick={() => onRemoveStep(idx)}>-</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="text-xs text-gray-300 mt-1">{description}</div>
    </div>
  );
};
