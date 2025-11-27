import React, { useRef, useState, useEffect } from 'react';

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
  const ticks = steps.length >= 3 ? steps : [...steps, ...Array(3 - steps.length).fill({ value: 0, weight: 1 })];
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle mouse/touch drag
  const handleSliderInteraction = (clientX: number) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const tickIndex = Math.round(percentage * (ticks.length - 1));

    if (tickIndex !== selectedTick) {
      onSelectTick(tickIndex);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSliderInteraction(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleSliderInteraction(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

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
          <div className="flex flex-col gap-3">

            {/* Row 1: Value Inputs */}
            <div className="flex items-center justify-start gap-2">
              <span className="text-xs text-gray-400 font-semibold w-12 text-center">VALUE</span>
              <div className="flex items-center gap-1 flex-1">
                {ticks.map((step, idx) => (
                  <div key={`val-${idx}`} className="flex-1 flex justify-center">
                    <input
                      type="number"
                      value={step.value}
                      onChange={e => onStepChange(idx, { ...step, value: Number(e.target.value) })}
                      className={`w-full max-w-[70px] px-1 py-1.5 text-center text-sm rounded outline-none transition-all ${selectedTick === idx
                        ? 'text-blue-300 font-bold bg-blue-500/20 border-2 border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                        : 'text-gray-300 bg-white/5 border border-white/10 hover:border-white/30 focus:border-blue-400'
                        }`}
                      placeholder="Val"
                    />
                  </div>
                ))}
              </div>
              {/* Add button at end */}
              <button
                type="button"
                onClick={() => onAddStep(ticks.length - 1)}
                className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center hover:bg-green-500/40 transition-all text-sm font-bold flex-shrink-0"
                title="Add tick"
              >
                +
              </button>
            </div>

            {/* Row 2: Draggable Slider Track */}
            <div className="flex items-center justify-start gap-2">
              <span className="text-xs text-gray-400 font-semibold w-12 text-center">SLIDE</span>
              <div className="flex-1 flex items-center gap-1 relative h-10">
                {/* Invisible positioned elements to match input layout */}
                {ticks.map((_, idx) => (
                  <div key={`pos-${idx}`} className="flex-1 flex justify-center relative">
                    <div className="w-full max-w-[70px]" />
                  </div>
                ))}

                {/* Track overlay - positioned absolutely */}
                <div
                  ref={trackRef}
                  onMouseDown={handleMouseDown}
                  className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-purple-900/40 rounded-full cursor-pointer"
                >
                  {/* Draggable thumb - positioned by flex column center */}
                  <div className="absolute inset-0 flex items-center pointer-events-none">
                    <div className="flex items-center gap-1 w-full">
                      {ticks.map((_, idx) => (
                        <div key={`thumb-pos-${idx}`} className="flex-1 flex justify-center">
                          <div className={`w-6 h-6 rounded-full border-2 border-white transition-all ${selectedTick === idx
                            ? isDragging
                              ? 'scale-125 bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,1)]'
                              : 'bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.8)]'
                            : 'opacity-0'
                            }`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-6 flex-shrink-0" /> {/* Spacer for alignment */}
            </div>

            {/* Row 3: Weight Inputs */}
            <div className="flex items-center justify-start gap-2">
              <span className="text-xs text-gray-400 font-semibold w-12 text-center">WEIGHT</span>
              <div className="flex items-center gap-1 flex-1">
                {ticks.map((step, idx) => (
                  <div key={`wgt-${idx}`} className="flex-1 flex justify-center relative group/wgt">
                    <input
                      type="number"
                      value={step.weight}
                      step={0.1}
                      onChange={e => onStepChange(idx, { ...step, weight: Number(e.target.value) })}
                      className={`w-full max-w-[70px] px-1 py-1.5 text-center text-xs rounded outline-none transition-all ${selectedTick === idx
                        ? 'text-purple-300 font-bold bg-purple-500/20 border-2 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                        : 'text-gray-400 bg-white/5 border border-white/10 hover:border-white/30 focus:border-purple-400'
                        }`}
                      placeholder="Wgt"
                    />
                    {/* Remove button (bottom) - visible on hover when > 3 ticks */}
                    {ticks.length > 3 && (
                      <button
                        type="button"
                        onClick={() => onRemoveStep(idx)}
                        className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center opacity-0 group-hover/wgt:opacity-100 hover:bg-red-500/40 transition-all z-10 text-xs font-bold"
                        title="Remove tick"
                      >
                        −
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="w-6 flex-shrink-0" /> {/* Spacer for alignment */}
            </div>

          </div>

          {/* Description */}
          <div className="mt-6 text-xs text-gray-500 italic text-center">
            {description}
          </div>
        </div>
      )}
    </div>
  );
};
