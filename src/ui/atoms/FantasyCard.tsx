import React from 'react';

interface FantasyCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'parchment' | 'wood' | 'marble' | 'leather' | 'gold' | 'nature';
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    bordered?: boolean;
    ornate?: boolean;
    interactive?: boolean;
    glowing?: boolean;
    onClick?: () => void;
}

export const FantasyCard: React.FC<FantasyCardProps> = ({
    children,
    className = '',
    variant = 'parchment',
    padding = 'md',
    bordered = true,
    ornate = false,
    interactive = false,
    glowing = false,
    onClick
}) => {
    const baseStyles = "rounded-xl transition-all duration-300 relative overflow-hidden";

    const variants = {
        parchment: "fantasy-panel",
        wood: "fantasy-wood-panel",
        marble: "fantasy-marble-panel",
        leather: "fantasy-leather-panel",
        gold: "fantasy-frame-gold",
        nature: "fantasy-nature-panel",
    };

    const paddings = {
        none: "p-0",
        sm: "p-3",
        md: "p-6",
        lg: "p-8",
        xl: "p-10",
    };

    const borderStyles = bordered ? "" : "border-none !shadow-none";
    
    const interactiveStyles = interactive
        ? "cursor-pointer hover:shadow-fantasy-float hover:scale-[1.01] hover:shadow-glow-gold active:scale-[0.99] active:shadow-fantasy"
        : "";

    const glowStyles = glowing ? "shadow-glow-gold" : "";

    // Determine ornament color based on variant
    const ornamentColor = variant === 'gold' || variant === 'parchment' ? 'gold' : 'bronze';

    return (
        <div
            className={`
                ${baseStyles} 
                ${variants[variant]} 
                ${paddings[padding]} 
                ${borderStyles}
                ${interactiveStyles}
                ${glowStyles}
                ${className}
            `}
            onClick={onClick}
        >
            {/* Premium Corner Ornaments */}
            {bordered && ornate && (
                <>
                    {/* Corner L-shapes */}
                    <div className={`absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-${ornamentColor} rounded-tl-md opacity-90`} />
                    <div className={`absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-${ornamentColor} rounded-tr-md opacity-90`} />
                    <div className={`absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-${ornamentColor} rounded-bl-md opacity-90`} />
                    <div className={`absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-${ornamentColor} rounded-br-md opacity-90`} />

                    {/* Corner Dots - Gold accents */}
                    <div className={`absolute top-3 left-3 w-1.5 h-1.5 bg-${ornamentColor} rounded-full shadow-glow-gold opacity-80`} />
                    <div className={`absolute top-3 right-3 w-1.5 h-1.5 bg-${ornamentColor} rounded-full shadow-glow-gold opacity-80`} />
                    <div className={`absolute bottom-3 left-3 w-1.5 h-1.5 bg-${ornamentColor} rounded-full shadow-glow-gold opacity-80`} />
                    <div className={`absolute bottom-3 right-3 w-1.5 h-1.5 bg-${ornamentColor} rounded-full shadow-glow-gold opacity-80`} />

                    {/* Center top/bottom accent bar */}
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-${ornamentColor} to-transparent opacity-60`} />
                    <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-${ornamentColor} to-transparent opacity-60`} />
                </>
            )}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};
