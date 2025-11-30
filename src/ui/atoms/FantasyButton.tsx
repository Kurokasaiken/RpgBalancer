import React from 'react';

interface FantasyButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'accent';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
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
    className = '',
}) => {
    const baseStyles = `
        font-display font-semibold rounded-lg
        transition-all duration-base
        flex items-center justify-center gap-2
        border-2 shadow-fantasy
        disabled:opacity-50 disabled:cursor-not-allowed
        relative overflow-hidden
    `;

    const variants = {
        primary: `
            bg-sage text-wood-dark border-forest
            bg-[image:var(--sage-gradient)]
            shadow-[0_4px_0_rgb(80,100,80),0_5px_10px_rgba(0,0,0,0.3)]
            hover:translate-y-[2px] hover:shadow-[0_2px_0_rgb(80,100,80),0_2px_5px_rgba(0,0,0,0.3)]
            active:translate-y-[4px] active:shadow-none
        `,
        secondary: `
            bg-wood text-parchment-light border-bronze
            bg-[image:var(--texture-wood-dark)]
            shadow-[0_4px_0_rgb(60,50,40),0_5px_10px_rgba(0,0,0,0.3)]
            hover:translate-y-[2px] hover:shadow-[0_2px_0_rgb(60,50,40),0_2px_5px_rgba(0,0,0,0.3)]
            active:translate-y-[4px] active:shadow-none
        `,
        accent: `
            bg-sky text-wood-dark border-sky-ocean
            bg-[image:var(--sky-gradient)]
            shadow-[0_4px_0_rgb(100,130,150),0_5px_10px_rgba(0,0,0,0.3)]
            hover:translate-y-[2px] hover:shadow-[0_2px_0_rgb(100,130,150),0_2px_5px_rgba(0,0,0,0.3)]
            active:translate-y-[4px] active:shadow-none
        `,
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {/* Leather strap accent (decorative) */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-leather-dark opacity-40" />

            {isLoading ? (
                <span className="animate-spin mr-2">⟳</span>
            ) : leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}

            <span className="relative z-10">{children}</span>

            {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </button>
    );
};
