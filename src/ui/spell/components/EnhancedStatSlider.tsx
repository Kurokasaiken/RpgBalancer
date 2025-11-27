import React from 'react';
import { GlassCard } from '../../atoms/GlassCard';
import { GlassButton } from '../../atoms/GlassButton';
import { GlassInput } from '../../atoms/GlassInput';
import { GlassSlider } from '../../atoms/GlassSlider';

interface EnhancedStatSliderProps {
  label: string;
  statKey: string;
  ticks: Array<{ value: number; weight: number }>;
  selectedTick: number;
  onSelectTick: (index: number) => void;
  onUpdateStep: (index: number, field: 'value' | 'weight', newValue: number) => void;
  onAddStep: (index: number) => void;
  onRemoveStep: (index: number) => void;
  onDragStart: (e: React.DragEvent, key: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetKey: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const EnhancedStatSlider: React.FC<EnhancedStatSliderProps> = ({
  label,
  statKey,
  ticks,
  selectedTick,
  onSelectTick,
  onUpdateStep,
  onAddStep,
  onRemoveStep,
  onDragStart,
  onDragOver,
  onDrop,
  isCollapsed,
  onToggleCollapse
}) => {
  const currentTick = ticks[selectedTick];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, statKey)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, statKey)}
      className="mb-2 transition-all duration-300"
    >
      <GlassCard padding="sm" className="group">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
            <span className="text-gray-500">☰</span>
            <span className="font-bold text-blue-200">{label}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-400">
              Value: <span className="text-white font-mono">{currentTick?.value}</span>
            </div>
            <div className="text-xs text-gray-400">
              Cost: <span className="text-purple-300 font-mono">{currentTick?.weight}</span>
            </div>
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
            >
              {isCollapsed ? 'Show' : 'Hide'}
            </GlassButton>
          </div>
        </div>

        {/* CONTENT (Collapsible) */}
        {!isCollapsed && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">

            {/* SLIDER */}
            <div className="px-2">
              <GlassSlider
                min={0}
                max={ticks.length - 1}
                step={1}
                value={selectedTick}
                onChange={onSelectTick}
                showTicks
              />
            </div>

            {/* TICKS EDITOR */}
            <div className="grid grid-cols-6 gap-2 mt-4">
              {ticks.map((tick, idx) => (
                <div key={idx} className={`relative flex flex-col gap-1 p-2 rounded-lg transition-colors ${idx === selectedTick ? 'bg-white/5 border border-blue-500/30' : 'hover:bg-white/5'}`}>

                  {/* Active Indicator */}
                  {idx === selectedTick && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  )}

                  <GlassInput
                    type="number"
                    value={tick.value}
                    onChange={(e) => onUpdateStep(idx, 'value', Number(e.target.value))}
                    className="text-center text-xs"
                    placeholder="Val"
                  />

                  <GlassInput
                    type="number"
                    value={tick.weight}
                    onChange={(e) => onUpdateStep(idx, 'weight', Number(e.target.value))}
                    className="text-center text-xs !text-purple-300"
                    placeholder="Wgt"
                  />

                  {/* Add/Remove Controls (Hover only) */}
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex flex-col gap-1 z-10">
                    <button
                      onClick={() => onAddStep(idx)}
                      className="w-4 h-4 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center hover:bg-green-500/40"
                      title="Add step after"
                    >
                      +
                    </button>
                    {ticks.length > 2 && (
                      <button
                        onClick={() => onRemoveStep(idx)}
                        className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/40"
                        title="Remove step"
                      >
                        -
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
