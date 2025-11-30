import React from 'react';

interface FantasyCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'parchment' | 'wood' | 'marble' | 'ornate';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    bordered?: boolean;
    interactive?: boolean;
    onClick?: () => void;
}

export const FantasyCard: React.FC<FantasyCardProps> = ({
    children,
    className = '',
    variant = 'parchment',
    padding = 'md',
    bordered = true,
    interactive = false,
    onClick
}) => {
    const baseStyles = "rounded-xl transition-all duration-base relative";

    const variants = {
        parchment: "fantasy-panel",
        ornate: "fantasy-frame-gold",
        wood: "fantasy-wood-panel",
        marble: "bg-marble-white text-wood-dark shadow-fantasy-soft border border-marble-gray",
    };

    const paddings = {
        none: "p-0",
        sm: "p-3",
        md: "p-6",
        lg: "p-8",
    };

    // Border styles are now handled by the premium classes, but we keep the prop for overrides
    const borderStyles = bordered ? "" : "border-none shadow-none";

    const interactiveStyles = interactive
        ? "cursor-pointer hover:shadow-fantasy-strong hover:scale-[1.01] active:scale-[0.99] transition-transform duration-200"
        : "";

    return (
        <div
            className={`
                ${baseStyles} 
                ${variants[variant]} 
                ${paddings[padding]} 
                ${borderStyles}
                ${interactiveStyles} 
                ${className}
            `}
            onClick={onClick}
        >
            {/* Corner ornaments (Premium Gold/Bronze) */}
            {bordered && variant === 'parchment' && (
                <>
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-bronze opacity-80 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-bronze opacity-80 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-bronze opacity-80 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-bronze opacity-80 rounded-br-lg" />

                    {/* Inner Gold Accent */}
                    <div className="absolute top-1 left-1 w-2 h-2 bg-bronze rounded-full opacity-40" />
                    <div className="absolute top-1 right-1 w-2 h-2 bg-bronze rounded-full opacity-40" />
                    <div className="absolute bottom-1 left-1 w-2 h-2 bg-bronze rounded-full opacity-40" />
                    <div className="absolute bottom-1 right-1 w-2 h-2 bg-bronze rounded-full opacity-40" />
                </>
            )}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};
