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
    readOnly = false
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
            <div className="bg-gray-700 p-1 rounded flex justify-between items-center opacity-50">
                <span className="text-xs text-gray-400">{def?.name || paramId}</span>
                <button onClick={() => setIsVisible(true)} className="text-xs text-gray-400 hover:text-white">
                    👁️
                </button>
            </div>
        );
    }

    return (
        <div className={`relative bg-gray-700 p-1.5 rounded transition-all ${!isActive ? 'opacity-60 grayscale' : ''} ${isChanging ? 'ring-2 ring-yellow-400' : ''}`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1">
                    <label
                        className={`text-xs font-semibold cursor-help border-b border-dotted border-gray-500 ${isChanging ? 'text-yellow-300' : ''}`}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        {def?.name || paramId}
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
                        className="p-0.5 rounded text-xs bg-gray-600 text-gray-300 hover:bg-gray-500"
                        title="Info"
                    >
                        ?
                    </button>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-0.5 rounded text-xs bg-gray-600 hover:bg-gray-500 text-gray-300"
                        title="Nascondi"
                    >
                        👁️
                    </button>

                    {!readOnly && (
                        <button
                            onClick={() => !readOnly && onLockToggle(isLocked ? 'none' : paramId as LockedParameter)}
                            className={`p-0.5 rounded text-xs ${isLocked ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                            title="Lock"
                            disabled={!isActive}
                        >
                            {isLocked ? '🔒' : '🔓'}
                        </button>
                    )}

                    {onReset && !readOnly && (
                        <button
                            onClick={() => isActive && !isLocked && onReset()}
                            className="p-0.5 rounded text-xs bg-orange-900 text-orange-400 hover:bg-orange-800"
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
                    className={`text-sm font-mono bg-transparent border-b border-gray-600 focus:border-blue-500 outline-none w-full transition-colors ${isLocked ? 'text-red-400' : isChanging ? 'text-yellow-300' : 'text-blue-300'}`}
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
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            )}
        </div>
    );
};
