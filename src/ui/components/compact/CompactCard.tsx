import React from 'react';
import type { ReactNode } from 'react';
import { useDensity } from '../../../contexts/DensityContext';

interface CompactCardProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    icon?: string;
    variant?: 'default' | 'glass' | 'solid' | 'outline';
    className?: string;
    headerAction?: ReactNode;
    onClick?: () => void;
}

export const CompactCard: React.FC<CompactCardProps> = ({
    children,
    title,
    subtitle,
    icon,
    variant = 'default',
    className = '',
    headerAction,
    onClick,
}) => {
    const { spacing, text } = useDensity();

    const variantClasses = {
        default: 'bg-gradient-to-br from-obsidian-light/60 to-obsidian/60 border-slate-dark shadow-[0_8px_32px_rgba(0,0,0,0.55)]',
        glass: 'bg-obsidian/40 backdrop-blur-md border-slate-darkest shadow-[0_12px_40px_rgba(0,0,0,0.6)]',
        solid: 'bg-gradient-to-br from-obsidian-light to-obsidian border-slate shadow-[0_6px_24px_rgba(0,0,0,0.45)]',
        outline: 'bg-transparent border-slate shadow-[0_4px_16px_rgba(0,0,0,0.3)]',
    };

    return (
        <div
            className={`
                rounded-2xl border relative overflow-hidden
                ${variantClasses[variant]}
                ${spacing.card}
                ${onClick ? 'cursor-pointer hover:border-gold/40 transition-all hover:shadow-[0_0_25px_rgba(201,162,39,0.25)]' : ''}
                ${className}
            `}
            onClick={onClick}
        >
            {/* Gold accent line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
            {(title || headerAction) && (
                <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                        {icon && <span className="text-lg flex-shrink-0 text-gold">{icon}</span>}
                        <div className="min-w-0">
                            {title && (
                                <p className={`font-display font-semibold ${text.heading} text-ivory-bright truncate`}>
                                    {title}
                                </p>
                            )}
                            {subtitle && (
                                <p className={`${text.small} text-teal-muted uppercase tracking-[0.2em] truncate`}>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    {headerAction && (
                        <div className="flex-shrink-0">
                            {headerAction}
                        </div>
                    )}
                </div>
            )}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

// Compact stat display for dashboards
interface StatDisplayProps {
    label: string;
    value: string | number;
    unit?: string;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'default' | 'success' | 'warning' | 'error' | 'gold';
}

export const StatDisplay: React.FC<StatDisplayProps> = ({
    label,
    value,
    unit,
    trend,
    color = 'default',
}) => {
    const { text } = useDensity();

    const colorClasses = {
        default: 'text-ivory',
        success: 'text-teal',
        warning: 'text-gold-bright',
        error: 'text-error',
        gold: 'text-gold',
    };

    const trendIcons = {
        up: '↑',
        down: '↓',
        neutral: '→',
    };

    return (
        <div className="flex items-baseline justify-between gap-2">
            <span className={`${text.label} text-teal-muted`}>{label}</span>
            <div className="flex items-baseline gap-1">
                <span className={`${text.body} font-medium ${colorClasses[color]}`}>
                    {value}
                </span>
                {unit && <span className={`${text.small} text-teal-soft`}>{unit}</span>}
                {trend && (
                    <span className={`${text.small} ${
                        trend === 'up' ? 'text-teal' :
                        trend === 'down' ? 'text-error' :
                        'text-teal-soft'
                    }`}>
                        {trendIcons[trend]}
                    </span>
                )}
            </div>
        </div>
    );
};

// Compact progress bar
interface ProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    showValue?: boolean;
    color?: 'default' | 'gold' | 'nature' | 'error';
    size?: 'sm' | 'md';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    max = 100,
    label,
    showValue = true,
    color = 'default',
    size = 'sm',
}) => {
    const { text } = useDensity();
    const percentage = Math.min(100, (value / max) * 100);

    const colorClasses = {
        default: 'bg-gradient-to-r from-teal-dim to-teal',
        gold: 'bg-gradient-to-r from-gold-dark to-gold-bright',
        nature: 'bg-gradient-to-r from-teal to-teal-light',
        error: 'bg-gradient-to-r from-error to-red-400',
    };

    const sizeClasses = {
        sm: 'h-1.5',
        md: 'h-2',
    };

    return (
        <div>
            {(label || showValue) && (
                <div className="flex justify-between items-center mb-1">
                    {label && <span className={`${text.small} text-teal-muted`}>{label}</span>}
                    {showValue && (
                        <span className={`${text.small} text-ivory-dark`}>
                            {value}{max !== 100 ? `/${max}` : '%'}
                        </span>
                    )}
                </div>
            )}
            <div className={`${sizeClasses[size]} bg-slate-darkest rounded-full overflow-hidden`}>
                <div
                    className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};
