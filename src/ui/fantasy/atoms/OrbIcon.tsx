/**
 * OrbIcon - Circular icon container with glow effects
 * Used in VerbCard and activity panels for Hearthstone-style icon display
 */
import React from 'react';

export type OrbVariant = 'azure' | 'ember' | 'jade' | 'amethyst' | 'solar' | 'neutral';

export interface OrbIconProps {
    icon: React.ReactNode;
    variant?: OrbVariant;
    size?: 'sm' | 'verb' | 'md' | 'lg';
    isActive?: boolean;
    className?: string;
}

// Variant-specific orb styling
const VARIANT_STYLES: Record<OrbVariant, {
    orbBg: string;
    glowColor: string;
    iconColor: string;
    ringColor: string;
}> = {
    azure: {
        orbBg: 'bg-gradient-to-b from-[#091222] via-[#050a12] to-[#03060a]',
        glowColor: 'rgba(14,165,233,0.5)',
        iconColor: 'text-sky-100',
        ringColor: 'border-cyan-400/40',
    },
    ember: {
        orbBg: 'bg-gradient-to-b from-[#1b0b05] via-[#2b0b08] to-[#140403]',
        glowColor: 'rgba(251,146,60,0.5)',
        iconColor: 'text-amber-100',
        ringColor: 'border-orange-400/40',
    },
    jade: {
        orbBg: 'bg-gradient-to-b from-[#04140f] via-[#03201a] to-[#020a07]',
        glowColor: 'rgba(16,185,129,0.5)',
        iconColor: 'text-emerald-100',
        ringColor: 'border-emerald-400/40',
    },
    amethyst: {
        orbBg: 'bg-gradient-to-b from-[#120320] via-[#1d0c26] to-[#08010f]',
        glowColor: 'rgba(167,139,250,0.5)',
        iconColor: 'text-violet-100',
        ringColor: 'border-purple-400/40',
    },
    solar: {
        orbBg: 'bg-gradient-to-b from-[#251803] via-[#2d1a04] to-[#120901]',
        glowColor: 'rgba(251,191,36,0.5)',
        iconColor: 'text-amber-100',
        ringColor: 'border-amber-400/40',
    },
    neutral: {
        orbBg: 'bg-gradient-to-b from-[#0f1419] via-[#0a0f14] to-[#05080a]',
        glowColor: 'rgba(148,163,184,0.3)',
        iconColor: 'text-slate-200',
        ringColor: 'border-slate-500/40',
    },
};

const SIZE_CLASSES: Record<NonNullable<OrbIconProps['size']>, { outer: string; inner: string; icon: string }> = {
    sm: { outer: 'h-10 w-10', inner: 'h-8 w-8', icon: 'text-lg' },
    verb: { outer: 'h-12 w-12', inner: 'h-10 w-10', icon: 'text-xl' },
    md: { outer: 'h-14 w-14', inner: 'h-12 w-12', icon: 'text-2xl' },
    lg: { outer: 'h-20 w-20', inner: 'h-16 w-16', icon: 'text-3xl' },
};

/**
 * OrbIcon - A glowing circular icon container
 * 
 * Features:
 * - Gradient orb background matching variant
 * - Outer ring with variant-specific color
 * - Glowing effect when active
 * - Smooth animations
 */
export const OrbIcon: React.FC<OrbIconProps> = ({
    icon,
    variant = 'neutral',
    size = 'md',
    isActive = false,
    className = '',
}) => {
    const styles = VARIANT_STYLES[variant];
    const sizeClasses = SIZE_CLASSES[size];

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Outer glow ring */}
            <div
                className={`
          absolute ${sizeClasses.outer} rounded-full 
          ${styles.ringColor} border-2
          ${isActive ? 'animate-glow-breathe' : ''}
        `}
                style={{
                    boxShadow: isActive ? `0 0 16px ${styles.glowColor}` : 'none',
                }}
                aria-hidden="true"
            />

            {/* Background glow (active only) */}
            {isActive && (
                <div
                    className={`absolute ${sizeClasses.outer} rounded-full blur-xl opacity-50`}
                    style={{ backgroundColor: styles.glowColor }}
                    aria-hidden="true"
                />
            )}

            {/* Inner orb */}
            <div
                className={`
          relative flex flex-col items-center justify-center rounded-full
          ${sizeClasses.inner} ${styles.orbBg}
          border border-gold/50
          shadow-inner shadow-black/50
        `}
            >
                {/* Icon */}
                <span className={`${sizeClasses.icon} ${styles.iconColor} drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]`}>
                    {icon}
                </span>
            </div>

            {/* Spinning decorative ring */}
            <div
                className="absolute inset-0 rounded-full border border-slate-700/40 border-dashed animate-[spin_20s_linear_infinite] opacity-30"
                style={{ transform: `scale(1.15)` }}
                aria-hidden="true"
            />
        </div>
    );
};

export default OrbIcon;
