import React from 'react';

interface FantasySelectOption {
    value: string;
    label: string;
}

interface FantasySelectProps {
    value: string;
    onChange: (value: string) => void;
    options: FantasySelectOption[];
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    fullWidth?: boolean;
    className?: string;
}

export const FantasySelect: React.FC<FantasySelectProps> = ({
    value,
    onChange,
    options,
    label,
    placeholder = 'Select an option...',
    disabled = false,
    error,
    fullWidth = false,
    className = '',
}) => {
    const containerClasses = fullWidth ? 'w-full' : 'w-auto';

    const selectClasses = `
        font-body text-base
        bg-parchment-medium text-wood-dark
        border-2 border-bronze-light rounded-lg
        px-4 py-3 pr-10
        transition-all duration-base
        focus:outline-none focus:border-sage focus:shadow-glow-green
        disabled:opacity-50 disabled:cursor-not-allowed
        appearance-none cursor-pointer
        ${error ? 'border-red-500 focus:border-red-600' : ''}
    `;

    return (
        <div className={`${containerClasses} ${className}`}>
            {label && (
                <label className="block font-display text-sm font-semibold text-wood-dark mb-2">
                    {label}
                </label>
            )}

            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className={selectClasses}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-parchment text-wood-dark">
                            {opt.label}
                        </option>
                    ))}
                </select>

                {/* Custom Arrow */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-bronze">
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>
            </div>

            {error && (
                <span className="block mt-1 text-sm text-red-600 font-body italic">
                    {error}
                </span>
            )}
        </div>
    );
};
