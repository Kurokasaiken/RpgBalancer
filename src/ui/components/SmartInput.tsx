import React, { useState, useEffect, useRef } from 'react';
import { PARAM_DEFINITIONS } from '../../balancing/registry';
import type { LockedParameter } from '../../balancing/types';

interface SmartInputProps {
    paramId: string;
    value: number;
    onChange: (value: number) => void;
    onReset?: () => void;
    lockedParam: LockedParameter;
    onLockToggle: (param: LockedParameter) => void;
    min: number;
    max: number;
    step?: number;
    isPercentage?: boolean;
    readOnly?: boolean;
    label?: string;
    bgColor?: string;
}

export const SmartInput: React.FC<SmartInputProps> = ({
    paramId,
    value,
    onChange,
    onReset,
    lockedParam,
    onLockToggle,
    min,
    max,
    step = 1,
    isPercentage = false,
    readOnly = false,
    label,
    bgColor
}) => {
    const def = PARAM_DEFINITIONS[paramId];
    const [isVisible, setIsVisible] = useState(true);
    const [showTooltip, setShowTooltip] = useState(false);
    const [isChanging, setIsChanging] = useState(false);
    const [prevValue, setPrevValue] = useState(value);

    // Ref for direct DOM manipulation
    const numberInputRef = useRef<HTMLInputElement>(null);

    const isActive = !readOnly;
    const isLocked = lockedParam === paramId;
    const displayLabel = label || def?.name || paramId;

    // Update input value when prop changes
    useEffect(() => {
        if (numberInputRef.current) {
            numberInputRef.current.value = isPercentage
                ? String(Math.round(value ?? 0))
                : (value ?? 0).toFixed(2);
        }
    }, [value, isPercentage]);

    // Detect value changes from external sources (cascade effects)
    useEffect(() => {
        const roundedValue = Math.round(value * 100) / 100;
        const roundedPrev = Math.round(prevValue * 100) / 100;

        if (roundedValue !== roundedPrev && !isLocked) {
            setIsChanging(true);
            setPrevValue(value);
            const timer = setTimeout(() => setIsChanging(false), 400);
            return () => clearTimeout(timer);
        }
    }, [value, isLocked]);

    if (!isVisible) {
        return (
            <div className="bg-white/5 backdrop-blur-sm p-1.5 rounded-lg flex justify-between items-center opacity-50 hover:opacity-75 transition-opacity border border-white/10">
                <span className="text-xs text-gray-300">{displayLabel}</span>
                <button onClick={() => setIsVisible(true)} className="text-xs text-gray-300 hover:text-white hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.8)] transition-all">
                    👁️
                </button>
            </div>
        );
    }

    const containerStyle = !isActive && !bgColor
        ? 'opacity-60 grayscale border-white/5'
        : 'border-white/10 opacity-100';

    return (
        <div className={`relative backdrop-blur-sm p-2 rounded-lg transition-all border ${bgColor || 'bg-white/5'} ${containerStyle} ${isChanging ? 'ring-2 ring-yellow-400/50 shadow-[0_0_12px_rgba(250,204,21,0.4)]' : ''}`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1">
                    <label
                        className={`text-xs font-semibold cursor-help border-b border-dotted border-gray-500 ${isChanging ? 'text-yellow-300' : ''}`}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        {displayLabel}
                        {isChanging && <span className="ml-1 text-yellow-400">⚡</span>}
                    </label>
                    {/* Tooltip */}
                    {showTooltip && def && (
                        <div className="absolute z-10 left-0 bottom-full mb-1 w-48 bg-black text-white text-xs p-2 rounded shadow-xl border border-gray-600">
                            <p className="font-bold mb-0.5">{def.name}</p>
                            <p className="mb-1 text-xs">{def.description}</p>
                            {def.formulas.length > 0 && (
                                <p className="text-gray-400 text-xs">In: {def.formulas.join(', ')}</p>
                            )}
                            <p className="text-gray-500 text-xs mt-0.5">Def: {def.defaultValue}</p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-0.5">
                    <button
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className="p-0.5 rounded text-xs bg-white/10 border border-white/20 text-gray-300 hover:bg-white/15 hover:text-white transition-all"
                        title="Info"
                    >
                        ?
                    </button>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-0.5 rounded text-xs bg-white/10 border border-white/20 hover:bg-white/15 text-gray-300 hover:text-white transition-all"
                        title="Nascondi"
                    >
                        👁️
                    </button>

                    {!readOnly && (
                        <button
                            onClick={() => !readOnly && onLockToggle(isLocked ? 'none' : paramId as LockedParameter)}
                            className={`p-0.5 rounded text-xs transition-all ${isLocked ? 'bg-red-500/30 border border-red-400 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/15 hover:text-white'}`}
                            title="Lock"
                            disabled={!isActive}
                        >
                            {isLocked ? '🔒' : '🔓'}
                        </button>
                    )}

                    {onReset && !readOnly && (
                        <button
                            onClick={() => isActive && !isLocked && onReset()}
                            className="p-0.5 rounded text-xs bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all"
                            title="Reset Default"
                            disabled={!isActive || isLocked}
                        >
                            ↺
                        </button>
                    )}
                </div>
            </div>

            {/* Value Display / Input */}
            <div className="flex justify-between items-end mb-1">
                <input
                    ref={numberInputRef}
                    type="number"
                    defaultValue={isPercentage ? Math.round(value ?? 0) : Number((value ?? 0).toFixed(2))}
                    onChange={(e) => {
                        const newValStr = e.target.value;
                        const newVal = parseFloat(newValStr);

                        if (!isNaN(newVal)) {
                            onChange(Math.max(min, Math.min(max, newVal)));
                        }
                    }}
                    disabled={!isActive || isLocked}
                    className={`text-sm font-mono bg-transparent border-b-2 focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.5)] outline-none w-full transition-all ${isLocked ? 'border-red-400 text-red-400' : isChanging ? 'border-yellow-400 text-yellow-300' : 'border-white/20 text-cyan-300'}`}
                />
                {isPercentage && <span className="text-gray-400 text-xs ml-0.5">%</span>}
            </div>

            {/* Slider */}
            {!readOnly && (
                <input
                    type="range"
                    value={value}
                    onInput={(e) => {
                        // Direct DOM update for immediate feedback
                        const target = e.target as HTMLInputElement;
                        const newValue = parseFloat(target.value);
                        if (numberInputRef.current) {
                            numberInputRef.current.value = isPercentage
                                ? String(Math.round(newValue))
                                : newValue.toFixed(2);
                        }
                    }}
                    onChange={(e) => {
                        const newValue = parseFloat(e.target.value);
                        onChange(newValue);
                    }}
                    disabled={!isActive || isLocked}
                    min={min}
                    max={max}
                    step={step}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
            )}
        </div>
    );
};
