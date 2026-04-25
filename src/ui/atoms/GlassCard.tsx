import React from 'react';

/**
 * Props for the GlassCard component.
 */
interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'neon' | 'danger';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    variant = 'default',
    padding = 'md',
    interactive = false,
    onClick
}) => {
    const baseStyles = "backdrop-blur-md border rounded-xl transition-all duration-300";

    const variants = {
        default: "bg-white/5 border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.2)]",
        neon: "bg-cyan-900/20 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]",
        danger: "bg-red-900/20 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
    };

    const paddings = {
        none: "p-0",
        sm: "p-3",
        md: "p-5",
        lg: "p-8"
    };

    const interactiveStyles = interactive
        ? "cursor-pointer hover:bg-white/10 hover:border-white/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] active:scale-[0.99]"
        : "";

    return (
        <div
            className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${interactiveStyles} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
