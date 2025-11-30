import React from 'react';

interface FantasySliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    showValue?: boolean;
    disabled?: boolean;
    marks?: number[];
    className?: string;
}

export const FantasySlider: React.FC<FantasySliderProps> = ({
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    label,
    showValue = true,
    disabled = false,
    marks = [],
    className = '',
}) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className={`w-full ${className}`}>
            {/* Label & Value */}
            {label && (
                <div className="flex justify-between items-center mb-3">
                    <label className="font-display text-sm font-semibold text-wood-dark">
                        {label}
                    </label>
                    {showValue && (
                        <span className="font-ui text-base font-bold text-bronze px-3 py-1 bg-parchment-medium rounded border border-bronze-light">
                            {value}
                        </span>
                    )}
                </div>
            )}

            {/* Slider Container */}
            <div className="relative pt-2 pb-6">
                {/* Track */}
                <div className="relative h-3 bg-wood-light rounded-full shadow-inner">
                    {/* Fill */}
                    <div
                        className="absolute h-full bg-gradient-to-r from-sage to-forest rounded-full shadow-glow-green transition-all duration-base"
                        style={{ width: `${percentage}%` }}
                    />

                    {/* Marks */}
                    {marks.length > 0 && (
                        <div className="absolute inset-0 flex justify-between px-1">
                            {marks.map((mark, idx) => {
                                const markPercentage = ((mark - min) / (max - min)) * 100;
                                const isActive = value >= mark;
                                return (
                                    <div
                                        key={idx}
                                        className={`w-1 h-full rounded-full transition-colors ${isActive ? 'bg-forest' : 'bg-wood-medium'
                                            }`}
                                        style={{ position: 'absolute', left: `${markPercentage}%` }}
                                        title={`${mark}`}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Thumb */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    disabled={disabled}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                />

                <div
                    className={`
                        absolute top-1/2 -translate-y-1/2 -translate-x-1/2
                        w-6 h-6 rounded-full
                        bg-bronze border-2 border-bronze-gold
                        shadow-fantasy-strong
                        transition-all duration-base
                        pointer-events-none
                        ${disabled ? 'opacity-50' : 'hover:scale-110'}
                    `}
                    style={{ left: `${percentage}%` }}
                >
                    <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-bronze-light to-bronze-dark" />
                </div>

                {/* Min/Max Labels */}
                <div className="absolute -bottom-1 left-0 right-0 flex justify-between text-xs text-wood-light font-ui">
                    <span>{min}</span>
                    <span>{max}</span>
                </div>
            </div>
        </div>
    );
};
