/**
 * HearthstoneCard - Premium card component with Hearthstone-style aesthetics
 * 
 * Features:
 * - Textured background with weathered leather/metal look
 * - Ornate gold border with corner gems
 * - Variant-specific glow colors (azure, ember, jade, amethyst, solar)
 * - State-based visual feedback (active, valid, invalid)
 * - Smooth entrance animation
 * - Hover/active microinteractions
 * - Drop shadow with depth effect
 */
import React, { forwardRef } from 'react';

export type CardVariant = 'default' | 'azure' | 'ember' | 'jade' | 'amethyst' | 'solar';
export type CardState = 'idle' | 'active' | 'valid' | 'invalid' | 'disabled';

export interface HearthstoneCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant;
    state?: CardState;
    isInteractive?: boolean;
    hasGlow?: boolean;
    children?: React.ReactNode;
}

// Variant-specific glow and accent colors
const VARIANT_COLORS: Record<CardVariant, {
    glowColor: string;
    borderColor: string;
    accentGradient: string;
}> = {
    default: {
        glowColor: 'rgba(201,162,39,0.4)',
        borderColor: 'rgba(201,162,39,0.5)',
        accentGradient: 'radial-gradient(ellipse at 50% 0%, rgba(201,162,39,0.15) 0%, transparent 60%)',
    },
    azure: {
        glowColor: 'rgba(14,165,233,0.5)',
        borderColor: 'rgba(34,211,238,0.5)',
        accentGradient: 'radial-gradient(ellipse at 50% 0%, rgba(14,165,233,0.2) 0%, transparent 60%)',
    },
    ember: {
        glowColor: 'rgba(251,146,60,0.5)',
        borderColor: 'rgba(251,146,60,0.5)',
        accentGradient: 'radial-gradient(ellipse at 50% 0%, rgba(251,146,60,0.2) 0%, transparent 60%)',
    },
    jade: {
        glowColor: 'rgba(16,185,129,0.5)',
        borderColor: 'rgba(52,211,153,0.5)',
        accentGradient: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.2) 0%, transparent 60%)',
    },
    amethyst: {
        glowColor: 'rgba(167,139,250,0.5)',
        borderColor: 'rgba(192,132,252,0.5)',
        accentGradient: 'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.2) 0%, transparent 60%)',
    },
    solar: {
        glowColor: 'rgba(251,191,36,0.6)',
        borderColor: 'rgba(253,224,71,0.5)',
        accentGradient: 'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.25) 0%, transparent 60%)',
    },
};

// State-specific border colors
const STATE_BORDERS: Record<CardState, string | null> = {
    idle: null,
    active: 'rgba(201,162,39,0.8)',
    valid: 'rgba(16,185,129,0.7)',
    invalid: 'rgba(239,68,68,0.7)',
    disabled: null,
};

/**
 * HearthstoneCard - A premium card component for fantasy game UI
 */
export const HearthstoneCard = forwardRef<HTMLDivElement, HearthstoneCardProps>(
    (
        {
            variant = 'default',
            state = 'idle',
            isInteractive = false,
            hasGlow = true,
            className = '',
            style = {},
            children,
            ...props
        },
        ref
    ) => {
        const variantColors = VARIANT_COLORS[variant];
        const stateBorderColor = STATE_BORDERS[state];
        const borderColor = stateBorderColor || variantColors.borderColor;
        const glowColor = variantColors.glowColor;
        const isActive = state === 'active';
        const isDisabled = state === 'disabled';

        const cardClasses = [
            // Base structure
            'relative overflow-hidden rounded-xl',
            // Background
            'bg-gradient-to-b from-[#0a0f1e] via-[#060b15] to-[#030609]',
            // Border
            'border-2',
            // Transitions
            'transition-all duration-300 ease-out',
            // Interactive states
            isInteractive && !isDisabled && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
            // Disabled state
            isDisabled && 'opacity-50 grayscale pointer-events-none',
            // Entrance animation
            'animate-card-enter',
            className,
        ].filter(Boolean).join(' ');

        const cardStyle: React.CSSProperties = {
            borderColor,
            boxShadow: hasGlow && isActive
                ? `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${glowColor}, 0 0 40px ${glowColor}`
                : '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            ...style,
        };

        return (
            <div
                ref={ref}
                className={cardClasses}
                style={cardStyle}
                role={isInteractive ? 'button' : undefined}
                tabIndex={isInteractive ? 0 : undefined}
                aria-disabled={isDisabled}
                {...props}
            >
                {/* Top gradient accent */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: variantColors.accentGradient }}
                    aria-hidden="true"
                />

                {/* Corner ornaments - gold accents */}
                <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-gold/50 rounded-tl-sm" aria-hidden="true" />
                <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-gold/50 rounded-tr-sm" aria-hidden="true" />
                <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-gold/50 rounded-bl-sm" aria-hidden="true" />
                <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-gold/50 rounded-br-sm" aria-hidden="true" />

                {/* Inner shadow for depth */}
                <div
                    className="absolute inset-0 pointer-events-none rounded-xl"
                    style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)' }}
                    aria-hidden="true"
                />

                {/* Shimmer effect on hover */}
                {isInteractive && (
                    <div
                        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 2.5s linear infinite',
                        }}
                        aria-hidden="true"
                    />
                )}

                {/* Animated ring for active state */}
                {isActive && (
                    <div
                        className="absolute inset-0 pointer-events-none rounded-xl animate-ring-pulse"
                        style={{ boxShadow: `0 0 0 0 ${glowColor}` }}
                        aria-hidden="true"
                    />
                )}

                {/* Card content */}
                <div className="relative z-10">
                    {children}
                </div>
            </div>
        );
    }
);

HearthstoneCard.displayName = 'HearthstoneCard';

export default HearthstoneCard;
