/**
 * GlowProgress - Halo/ring style progress indicator
 * Used in VerbCard for activity timers with premium glow effects
 */
import React from 'react';

export type ProgressVariant = 'azure' | 'ember' | 'jade' | 'amethyst' | 'solar' | 'gold';

export interface GlowProgressProps {
    progress: number; // 0 to 1
    variant?: ProgressVariant;
    size?: 'sm' | 'verb' | 'md' | 'lg';
    showTrail?: boolean;
    className?: string;
    children?: React.ReactNode;
}

// Variant colors for progress ring
const VARIANT_COLORS: Record<ProgressVariant, { primary: string; secondary: string }> = {
    azure: { primary: 'rgba(14,165,233,0.8)', secondary: 'rgba(129,140,248,0.5)' },
    ember: { primary: 'rgba(251,146,60,0.8)', secondary: 'rgba(244,63,94,0.5)' },
    jade: { primary: 'rgba(16,185,129,0.8)', secondary: 'rgba(45,212,191,0.5)' },
    amethyst: { primary: 'rgba(167,139,250,0.8)', secondary: 'rgba(129,140,248,0.5)' },
    solar: { primary: 'rgba(251,191,36,0.8)', secondary: 'rgba(251,146,60,0.5)' },
    gold: { primary: 'rgba(201,162,39,0.9)', secondary: 'rgba(253,224,71,0.6)' },
};

const SIZE_DIMENSIONS: Record<NonNullable<GlowProgressProps['size']>, { size: number; stroke: number }> = {
    sm: { size: 80, stroke: 4 },
    verb: { size: 96, stroke: 4.5 },
    md: { size: 120, stroke: 5 },
    lg: { size: 160, stroke: 6 },
};

/**
 * GlowProgress - A circular progress indicator with glow effect
 * 
 * Features:
 * - Conic gradient progress fill
 * - Glowing leading edge
 * - Background trail ring
 * - Centers children content
 */
export const GlowProgress: React.FC<GlowProgressProps> = ({
    progress,
    variant = 'gold',
    size = 'md',
    showTrail = true,
    className = '',
    children,
}) => {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const colors = VARIANT_COLORS[variant];
    const dims = SIZE_DIMENSIONS[size];
    const progressDegrees = clampedProgress * 360;

    const radius = (dims.size - dims.stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - clampedProgress);

    return (
        <div
            className={`relative flex items-center justify-center ${className}`}
            style={{ width: dims.size, height: dims.size }}
        >
            {/* Background trail */}
            {showTrail && (
                <svg
                    className="absolute inset-0"
                    viewBox={`0 0 ${dims.size} ${dims.size}`}
                    style={{ transform: 'rotate(-90deg)' }}
                >
                    <circle
                        cx={dims.size / 2}
                        cy={dims.size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(30,41,59,0.6)"
                        strokeWidth={dims.stroke}
                    />
                </svg>
            )}

            {/* Progress ring */}
            <svg
                className="absolute inset-0"
                viewBox={`0 0 ${dims.size} ${dims.size}`}
                style={{ transform: 'rotate(-90deg)' }}
            >
                <defs>
                    <linearGradient id={`progress-gradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={colors.primary} />
                        <stop offset="100%" stopColor={colors.secondary} />
                    </linearGradient>
                    <filter id={`glow-${variant}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feFlood floodColor={colors.primary} result="color" />
                        <feComposite in="color" in2="blur" operator="in" result="glow" />
                        <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <circle
                    cx={dims.size / 2}
                    cy={dims.size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#progress-gradient-${variant})`}
                    strokeWidth={dims.stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    filter={`url(#glow-${variant})`}
                    style={{
                        transition: 'stroke-dashoffset 0.3s ease-out',
                    }}
                />
            </svg>

            {/* Conic gradient overlay for extra glow effect */}
            <div
                className="absolute rounded-full opacity-60"
                style={{
                    width: dims.size - dims.stroke * 4,
                    height: dims.size - dims.stroke * 4,
                    background: `conic-gradient(from 0deg, ${colors.primary} 0deg ${progressDegrees}deg, transparent ${progressDegrees}deg 360deg)`,
                    filter: `blur(${dims.stroke}px)`,
                }}
                aria-hidden="true"
            />

            {/* Dashed decorative ring */}
            <div
                className="absolute rounded-full border border-dashed border-slate-600/40 animate-[spin_12s_linear_infinite]"
                style={{
                    width: dims.size - dims.stroke * 2 - 8,
                    height: dims.size - dims.stroke * 2 - 8,
                }}
                aria-hidden="true"
            />

            {/* Children (center content) */}
            <div className="relative z-10 flex items-center justify-center">
                {children}
            </div>
        </div>
    );
};

export default GlowProgress;
