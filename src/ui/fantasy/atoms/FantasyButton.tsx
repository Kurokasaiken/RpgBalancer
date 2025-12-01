import React from 'react';

interface FantasyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'icon';
    size?: 'sm' | 'md' | 'lg';
}

export const FantasyButton: React.FC<FantasyButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) => {
    const baseStyles = "font-fantasy-ui font-bold rounded transition-all duration-200 active:scale-95 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 relative overflow-hidden";

    const variants = {
        primary: "bg-[var(--fantasy-bg-wood-light)] text-[var(--fantasy-text-light)] border border-[var(--fantasy-text-bronze)] hover:bg-[var(--fantasy-bg-wood-dark)] shadow-md",
        secondary: "bg-[var(--fantasy-bg-paper)] text-[var(--fantasy-text-ink)] border border-[var(--fantasy-bg-wood-light)] hover:bg-white",
        danger: "bg-[var(--fantasy-error)] text-white border border-red-900 hover:brightness-110",
        icon: "p-2 bg-transparent hover:bg-[var(--fantasy-bg-paper)]/20 text-[var(--fantasy-text-bronze)] rounded-full"
    };

    const sizes = {
        sm: "px-3 py-1 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg"
    };

    const sizeClass = variant === 'icon' ? '' : sizes[size];

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizeClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
