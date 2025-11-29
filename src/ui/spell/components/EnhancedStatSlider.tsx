import React from 'react';

export interface EnhancedStatSliderProps {
  field: string;
  value: number;
  steps: Array<{ value: number; weight: number }>;
  description: string;
  isMalus: boolean;
  collapsed: boolean;
  onValueChange: (value: number) => void;
  onWeightChange: (weight: number) => void;
  onBaselineChange: (baseline: number) => void;
  onToggleCollapse: () => void;
  onRangeChange?: (newRange: { min: number; max: number; step: number }) => void;
}

export const EnhancedStatSlider: React.FC<EnhancedStatSliderProps> = ({
  field,
  steps,
  description,
  isMalus,
  collapsed,
  onValueChange,
  onToggleCollapse,
  onStepChange,
  onAddStep,
  onRemoveStep
}) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onToggleCollapse} className="text-xs text-gray-400 hover:text-blue-400">
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
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-400">Step {idx + 1}</span>
              <input
                type="number"
                value={step.value}
                onChange={e => onStepChange(idx, { ...step, value: Number(e.target.value) })}
                className="w-16 bg-gray-900 text-white px-2 py-1 rounded border border-gray-700 text-xs"
              />
              <span className="text-gray-500">Peso:</span>
              <input
                type="number"
                value={step.weight}
                step={0.01}
                onChange={e => onStepChange(idx, { ...step, weight: Number(e.target.value) })}
                className="w-16 bg-gray-900 text-white px-2 py-1 rounded border border-gray-700 text-xs"
              />
              <button type="button" className="px-2 text-xs text-red-400" onClick={() => onRemoveStep(idx)}>-</button>
              <button type="button" className="px-2 text-xs text-green-400" onClick={() => onAddStep(idx)}>+</button>
            </div>
          ))}
        </div>
      )}
      <div className="text-xs text-gray-400 mt-1">{description}</div>
    </div>
  );
};
