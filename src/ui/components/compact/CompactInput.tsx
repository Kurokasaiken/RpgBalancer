import React from 'react';
import type { InputHTMLAttributes } from 'react';
import { useDensity } from '../../../contexts/DensityContext';

interface CompactInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    hint?: string;
    icon?: React.ReactNode;
    size?: 'sm' | 'md';
}

export const CompactInput: React.FC<CompactInputProps> = ({
    label,
    error,
    hint,
    icon,
    size = 'sm',
    className = '',
    id,
    ...props
}) => {
    const { density, text } = useDensity();
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const sizeClasses = {
        sm: density === 'compact' ? 'h-7 text-sm px-2' : 'h-8 text-sm px-2.5',
        md: density === 'compact' ? 'h-8 text-base px-2.5' : 'h-9 text-base px-3',
    };

    return (
        <div className={className}>
            {label && (
                <label htmlFor={inputId} className={`block mb-1 ${text.label} text-teal-muted`}>
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-teal-muted">
                        {icon}
                    </span>
                )}
                <input
                    id={inputId}
                    className={`
                        w-full rounded-lg border bg-obsidian/60 backdrop-blur-sm
                        text-ivory placeholder-teal-muted/50
                        border-slate-dark hover:border-slate focus:border-gold/50
                        focus:outline-none focus:ring-1 focus:ring-gold/30 focus:shadow-[0_0_8px_rgba(201,162,39,0.2)]
                        transition-all duration-150
                        ${sizeClasses[size]}
                        ${icon ? 'pl-8' : ''}
                        ${error ? 'border-error/50 focus:border-error focus:ring-error/30' : ''}
                    `}
                    {...props}
                />
            </div>
            {error && <p className={`mt-0.5 ${text.small} text-error`}>{error}</p>}
            {hint && !error && <p className={`mt-0.5 ${text.small} text-teal-soft`}>{hint}</p>}
        </div>
    );
};

// Number input with stepper
interface CompactNumberInputProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    size?: 'sm' | 'md';
    className?: string;
    disabled?: boolean;
}

export const CompactNumberInput: React.FC<CompactNumberInputProps> = ({
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    label,
    size = 'sm',
    className = '',
    disabled = false,
}) => {
    const { density, text } = useDensity();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value) || 0;
        onChange(Math.min(max, Math.max(min, newValue)));
    };

    const handleStep = (direction: 'up' | 'down') => {
        const newValue = direction === 'up' ? value + step : value - step;
        onChange(Math.min(max, Math.max(min, newValue)));
    };

    const sizeClasses = {
        sm: density === 'compact' ? 'h-7' : 'h-8',
        md: density === 'compact' ? 'h-8' : 'h-9',
    };

    return (
        <div className={className}>
            {label && (
                <label className={`block mb-1 ${text.label} text-teal-muted`}>
                    {label}
                </label>
            )}
            <div className={`flex items-center gap-1 ${sizeClasses[size]}`}>
                <button
                    type="button"
                    onClick={() => handleStep('down')}
                    disabled={value <= min}
                    className="w-6 h-full flex items-center justify-center rounded bg-slate-darkest/60 hover:bg-slate-dark/60 text-teal-muted disabled:opacity-30 transition-all hover:scale-105 active:scale-95 border border-slate-darkest"
                >
                    −
                </button>
                <input
                    type="number"
                    value={value}
                    onChange={handleChange}
                    min={min}
                    max={max}
                    step={step}
                    className={`
                        flex-1 min-w-0 h-full text-center rounded border
                        bg-obsidian/60 border-slate-dark
                        text-ivory text-sm
                        focus:outline-none focus:border-gold/50
                        [appearance:textfield]
                        [&::-webkit-outer-spin-button]:appearance-none
                        [&::-webkit-inner-spin-button]:appearance-none
                    `}
                    disabled={disabled}
                />
                <button
                    type="button"
                    onClick={() => handleStep('up')}
                    disabled={value >= max}
                    className="w-6 h-full flex items-center justify-center rounded bg-slate-darkest/60 hover:bg-slate-dark/60 text-teal-muted disabled:opacity-30 transition-all hover:scale-105 active:scale-95 border border-slate-darkest"
                >
                    +
                </button>
            </div>
        </div>
    );
};

// Compact slider
interface CompactSliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    showValue?: boolean;
    color?: 'default' | 'gold' | 'nature';
}

export const CompactSlider: React.FC<CompactSliderProps> = ({
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    label,
    showValue = true,
    color = 'default',
}) => {
    const { text } = useDensity();
    const percentage = ((value - min) / (max - min)) * 100;

    const colorClasses = {
        default: 'from-teal-dim to-teal',
        gold: 'from-gold-dark to-gold-bright',
        nature: 'from-teal to-teal-light',
    };

    return (
        <div>
            {(label || showValue) && (
                <div className="flex justify-between items-center mb-1">
                    {label && <span className={`${text.label} text-teal-muted`}>{label}</span>}
                    {showValue && <span className={`${text.small} text-ivory font-medium`}>{value}</span>}
                </div>
            )}
            <div className="relative h-6 flex items-center">
                {/* Track */}
                <div className="absolute inset-x-0 h-2 bg-slate-darkest/60 rounded-full border border-slate-darkest/30">
                    <div
                        className={`h-full rounded-full bg-gradient-to-r ${colorClasses[color]} shadow-[0_0_8px_rgba(141,179,165,0.3)]`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                {/* Native input */}
                <input
                    type="range"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    min={min}
                    max={max}
                    step={step}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {/* Custom thumb */}
                <div
                    className={`absolute w-4 h-4 rounded-full border-2 shadow-md pointer-events-none transition-all hover:scale-110 ${
                        color === 'gold' ? 'bg-gold border-gold-dark shadow-[0_0_8px_rgba(201,162,39,0.4)]' :
                        color === 'nature' ? 'bg-teal border-teal-dark shadow-[0_0_8px_rgba(141,179,165,0.4)]' :
                        'bg-ivory border-slate'
                    }`}
                    style={{ left: `calc(${percentage}% - 8px)` }}
                />
            </div>
        </div>
    );
};
