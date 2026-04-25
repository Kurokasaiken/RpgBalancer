import React from 'react';

interface FantasyInputProps {
    value: string | number;
    onChange: (value: string) => void;
    type?: 'text' | 'number' | 'email' | 'password';
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
    className?: string;
}

export const FantasyInput: React.FC<FantasyInputProps> = ({
    value,
    onChange,
    type = 'text',
    label,
    placeholder,
    disabled = false,
    error,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
}) => {
    const containerClasses = fullWidth ? 'w-full' : 'w-auto';

    const inputClasses = `
        font-body text-base
        bg-parchment-medium text-wood-dark
        bg-[image:var(--texture-parchment)]
        border-2 border-bronze-light rounded-lg
        px-4 py-3
        transition-all duration-base
        shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]
        focus:outline-none focus:border-bronze focus:shadow-[0_0_0_2px_rgba(205,127,50,0.3),inset_0_2px_4px_rgba(0,0,0,0.1)]
        disabled:opacity-50 disabled:cursor-not-allowed
        placeholder:text-wood-light placeholder:italic
        ${leftIcon ? 'pl-12' : ''}
        ${rightIcon ? 'pr-12' : ''}
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
                {leftIcon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-bronze">
                        {leftIcon}
                    </div>
                )}

                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={inputClasses}
                />

                {rightIcon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-bronze">
                        {rightIcon}
                    </div>
                )}
            </div>

            {error && (
                <span className="block mt-1 text-sm text-red-600 font-body italic">
                    {error}
                </span>
            )}
        </div>
    );
};
