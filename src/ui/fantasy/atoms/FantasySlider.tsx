import React from 'react';

interface FantasySliderProps {
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    label?: string;
    className?: string;
}

export const FantasySlider: React.FC<FantasySliderProps> = ({
    value, min, max, step = 1, onChange, label, className = ''
}) => {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <div className="flex justify-between text-sm font-fantasy-ui font-bold text-[var(--fantasy-text-ink)] opacity-80">
                    <span>{label}</span>
                    <span>{value}</span>
                </div>
            )}
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="
                    w-full h-2 rounded-lg appearance-none cursor-pointer
                    bg-[var(--fantasy-bg-wood-dark)]
                    accent-[var(--fantasy-text-bronze)]
                "
                style={{
                    backgroundImage: `linear-gradient(to right, var(--fantasy-text-bronze) 0%, var(--fantasy-text-bronze) ${(value - min) / (max - min) * 100}%, var(--fantasy-bg-wood-dark) ${(value - min) / (max - min) * 100}%, var(--fantasy-bg-wood-dark) 100%)`
                }}
            />
        </div>
    );
};
