import React from 'react';

interface FantasyButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'gold' | 'nature' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
    className?: string;
}

export const FantasyButton: React.FC<FantasyButtonProps> = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    disabled = false,
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
}) => {
    const baseStyles = `
        font-display font-semibold rounded-lg
        transition-all duration-150 ease-out
        flex items-center justify-center gap-2
        border-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        relative overflow-hidden
        select-none
    `;

    const variants = {
        // Primary - Nature Green (Main actions)
        primary: `
            bg-gradient-to-b from-nature-spring via-nature-leaf to-nature-fern
            text-wood-darkest border-nature-forest
            shadow-[0_4px_0_#5a8a4a,0_4px_12px_rgba(0,0,0,0.25)]
            hover:shadow-[0_2px_0_#5a8a4a,0_2px_8px_rgba(0,0,0,0.2)] hover:translate-y-[2px]
            active:shadow-[0_0_0_#5a8a4a] active:translate-y-[4px]
        `,
        // Secondary - Wood/Leather (Cancel, secondary actions)
        secondary: `
            bg-gradient-to-b from-wood-light via-wood to-wood-dark
            text-parchment-light border-bronze
            shadow-[0_4px_0_#2d2418,0_4px_12px_rgba(0,0,0,0.3)]
            hover:shadow-[0_2px_0_#2d2418,0_2px_8px_rgba(0,0,0,0.25)] hover:translate-y-[2px]
            active:shadow-[0_0_0_#2d2418] active:translate-y-[4px]
        `,
        // Gold - Premium actions (Save, Confirm)
        gold: `
            bg-gradient-to-b from-gold-light via-gold-bright to-gold
            text-wood-darkest border-gold-dark
            shadow-[0_4px_0_#8b7500,0_4px_12px_rgba(201,162,39,0.4),0_0_16px_rgba(255,215,0,0.2)]
            hover:shadow-[0_2px_0_#8b7500,0_2px_8px_rgba(201,162,39,0.3),0_0_24px_rgba(255,215,0,0.3)] hover:translate-y-[2px]
            active:shadow-[0_0_0_#8b7500,0_0_8px_rgba(255,215,0,0.2)] active:translate-y-[4px]
        `,
        // Nature - Softer green (Info, optional actions)
        nature: `
            bg-gradient-to-b from-nature-mint via-nature-sage to-nature-moss
            text-wood-dark border-nature-fern
            shadow-[0_4px_0_#6b9b5a,0_4px_12px_rgba(0,0,0,0.2)]
            hover:shadow-[0_2px_0_#6b9b5a,0_2px_8px_rgba(0,0,0,0.15)] hover:translate-y-[2px]
            active:shadow-[0_0_0_#6b9b5a] active:translate-y-[4px]
        `,
        // Danger - Red for destructive actions
        danger: `
            bg-gradient-to-b from-error/80 via-error to-error
            text-parchment-light border-error
            shadow-[0_4px_0_#8b3a3a,0_4px_12px_rgba(0,0,0,0.25)]
            hover:shadow-[0_2px_0_#8b3a3a,0_2px_8px_rgba(0,0,0,0.2)] hover:translate-y-[2px]
            active:shadow-[0_0_0_#8b3a3a] active:translate-y-[4px]
        `,
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
        <button
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyles} ${className}`}
        >
            {/* Subtle inner highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-white/30 pointer-events-none" />
            
            {/* Bottom shadow line */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-black/20 pointer-events-none" />

            {isLoading ? (
                <span className="animate-spin">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </span>
            ) : leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}

            <span className="relative z-10">{children}</span>

            {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </button>
    );
};
