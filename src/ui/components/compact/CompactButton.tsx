import React from 'react';
import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { useDensity } from '../../../contexts/DensityContext';

interface CompactButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
    size?: 'xs' | 'sm' | 'md';
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    isLoading?: boolean;
    fullWidth?: boolean;
}

export const CompactButton: React.FC<CompactButtonProps> = ({
    children,
    variant = 'secondary',
    size = 'sm',
    icon,
    iconPosition = 'left',
    isLoading = false,
    fullWidth = false,
    disabled,
    className = '',
    ...props
}) => {
    const { density } = useDensity();

    // Size classes - compact mode uses smaller sizes
    const sizeClasses = {
        xs: density === 'compact' ? 'h-6 px-2 text-xs gap-1' : 'h-7 px-2.5 text-xs gap-1.5',
        sm: density === 'compact' ? 'h-7 px-2.5 text-sm gap-1.5' : 'h-8 px-3 text-sm gap-2',
        md: density === 'compact' ? 'h-8 px-3 text-sm gap-2' : 'h-9 px-4 text-base gap-2',
    };

    const variantClasses = {
        primary: `
            bg-gradient-to-b from-teal to-teal-dim
            hover:from-teal-light hover:to-teal
            text-obsidian-darkest border-teal/50
            shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_0_12px_rgba(141,179,165,0.4)]
            active:scale-95 transition-all
        `,
        secondary: `
            bg-gradient-to-b from-slate-darkest/60 to-slate-darkest/40
            hover:from-slate-dark/80 hover:to-slate-dark/60
            text-ivory border-slate-dark
            hover:border-slate hover:shadow-[0_0_8px_rgba(0,0,0,0.3)]
            active:scale-98 transition-all
        `,
        ghost: `
            bg-transparent hover:bg-slate-darkest/50
            text-teal-muted hover:text-ivory
            active:scale-98 transition-all
            border-transparent
        `,
        danger: `
            bg-error/20 hover:bg-error/30
            text-error border-error/30
        `,
        gold: `
            bg-gradient-to-b from-gold to-gold-dark
            hover:from-gold-bright hover:to-gold
            text-obsidian-darkest border-gold/50
            shadow-[0_0_12px_rgba(201,162,39,0.3)] hover:shadow-[0_0_20px_rgba(201,162,39,0.5)]
            active:scale-95 transition-all
        `,
    };

    return (
        <button
            className={`
                inline-flex items-center justify-center
                rounded-lg
                transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
                ${sizeClasses[size]}
                ${variantClasses[variant]}
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
            disabled={disabled || isLoading}
            {...props}
        >
            <span className="relative z-10 flex items-center gap-2">
                {icon && iconPosition === 'left' && (
                    <span className="flex-shrink-0">{icon}</span>
                )}
                {children}
                {icon && iconPosition === 'right' && (
                    <span className="flex-shrink-0">{icon}</span>
                )}
                {isLoading && (
                    <span className="animate-spin ml-2">⏳</span>
                )}
            </span>
        </button>
    );
};

// Icon-only button variant
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: ReactNode;
    variant?: 'ghost' | 'secondary' | 'danger';
    size?: 'xs' | 'sm' | 'md';
    tooltip?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon,
    variant = 'ghost',
    size = 'sm',
    tooltip,
    className = '',
    ...props
}) => {
    const { density } = useDensity();

    const sizeClasses = {
        xs: density === 'compact' ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm',
        sm: density === 'compact' ? 'w-6 h-6 text-sm' : 'w-7 h-7 text-base',
        md: density === 'compact' ? 'w-7 h-7 text-base' : 'w-8 h-8 text-lg',
    };

    const variantClasses = {
        ghost: 'text-teal-muted hover:text-ivory hover:bg-slate-darkest/50',
        secondary: 'text-ivory bg-slate-darkest/60 hover:bg-slate-dark/80',
        danger: 'text-error/70 hover:text-error hover:bg-error/10',
    };

    return (
        <button
            className={`
                inline-flex items-center justify-center rounded
                transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                ${sizeClasses[size]}
                ${variantClasses[variant]}
                ${className}
            `}
            title={tooltip}
            {...props}
        >
            {icon}
        </button>
    );
};
