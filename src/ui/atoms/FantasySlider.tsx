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
    variant?: 'nature' | 'gold' | 'bronze';
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
    variant = 'nature',
    className = '',
}) => {
    const percentage = ((value - min) / (max - min)) * 100;

    const trackColors = {
        nature: 'from-nature-sage via-nature-leaf to-nature-fern',
        gold: 'from-gold-pale via-gold-bright to-gold',
        bronze: 'from-bronze-light via-bronze-polished to-bronze',
    };

    const glowColors = {
        nature: 'shadow-glow-green',
        gold: 'shadow-glow-gold',
        bronze: 'shadow-[0_0_8px_rgba(166,124,61,0.4)]',
    };

    const thumbColors = {
        nature: 'from-nature-leaf to-nature-forest border-nature-forest',
        gold: 'from-gold-light to-gold border-gold-dark',
        bronze: 'from-bronze-light to-bronze border-bronze-dark',
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Label & Value */}
            {label && (
                <div className="flex justify-between items-center mb-3">
                    <label className="font-display text-sm font-semibold text-wood-dark tracking-wide">
                        {label}
                    </label>
                    {showValue && (
                        <span className={`
                            font-ui text-base font-bold px-3 py-1 rounded-md
                            ${variant === 'gold' 
                                ? 'text-gold-dark bg-gold-pale/50 border border-gold shadow-glow-gold' 
                                : 'text-bronze-polished bg-parchment-medium border border-bronze-light'
                            }
                        `}>
                            {value}
                        </span>
                    )}
                </div>
            )}

            {/* Slider Container */}
            <div className="relative pt-2 pb-6">
                {/* Track Background - Wood texture */}
                <div className="relative h-3 bg-wood-light rounded-full shadow-fantasy-inset border border-wood-dark/30">
                    {/* Fill - Gradient based on variant */}
                    <div
                        className={`
                            absolute h-full rounded-full transition-all duration-200 ease-out
                            bg-gradient-to-r ${trackColors[variant]} ${glowColors[variant]}
                        `}
                        style={{ width: `${percentage}%` }}
                    />

                    {/* Marks */}
                    {marks.length > 0 && marks.map((mark, idx) => {
                        const markPercentage = ((mark - min) / (max - min)) * 100;
                        const isActive = value >= mark;
                        return (
                            <div
                                key={idx}
                                className={`
                                    absolute top-1/2 -translate-y-1/2 w-1.5 h-4 rounded-sm
                                    transition-all duration-200
                                    ${isActive 
                                        ? `bg-${variant === 'gold' ? 'gold' : 'nature-forest'} shadow-sm` 
                                        : 'bg-wood-medium/60'
                                    }
                                `}
                                style={{ left: `calc(${markPercentage}% - 3px)` }}
                                title={`${mark}`}
                            />
                        );
                    })}
                </div>

                {/* Hidden Range Input */}
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

                {/* Custom Thumb */}
                <div
                    className={`
                        absolute top-1/2 -translate-y-1/2 -translate-x-1/2
                        w-7 h-7 rounded-full
                        bg-gradient-to-br ${thumbColors[variant]}
                        border-2 shadow-fantasy-strong
                        transition-all duration-200
                        pointer-events-none
                        ${disabled ? 'opacity-50' : 'group-hover:scale-110'}
                    `}
                    style={{ left: `${percentage}%` }}
                >
                    {/* Inner highlight */}
                    <div className="absolute inset-1 rounded-full bg-white/20" />
                    {/* Center dot */}
                    <div className={`absolute inset-2 rounded-full bg-gradient-to-br ${thumbColors[variant]} opacity-80`} />
                </div>

                {/* Min/Max Labels */}
                <div className="absolute -bottom-1 left-0 right-0 flex justify-between text-xs text-wood-light font-ui opacity-70">
                    <span>{min}</span>
                    <span>{max}</span>
                </div>
            </div>
        </div>
    );
};
