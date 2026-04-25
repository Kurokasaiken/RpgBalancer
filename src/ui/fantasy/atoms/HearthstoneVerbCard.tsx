/**
 * HearthstoneVerbCard - Premium Hearthstone-style VerbCard
 * 
 * Composes HearthstoneCard + OrbIcon + GlowProgress for a AAA-quality
 * idle game activity card inspired by Cultist Simulator meets Hearthstone
 */
import React, { forwardRef } from 'react';
import { HearthstoneCard, type CardVariant, type CardState } from './HearthstoneCard';
import { OrbIcon, type OrbVariant } from './OrbIcon';
import { GlowProgress } from './GlowProgress';

export type VerbTone = 'neutral' | 'job' | 'quest' | 'danger' | 'system';
export type DropState = 'idle' | 'valid' | 'invalid';

export interface HearthstoneVerbCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
    // Core props
    icon: React.ReactNode;
    label?: string;
    sublabel?: string;
    progressFraction: number; // 0 to 1
    elapsedSeconds: number;
    totalDuration: number;

    // Risk indicators
    injuryPercentage?: number; // 0-100
    deathPercentage?: number;  // 0-100

    // Slots
    assignedCount?: number;
    totalSlots?: number;

    // Interaction
    isInteractive?: boolean;
    dropState?: DropState;
    onClick?: () => void;

    // Styling
    variant?: CardVariant;
    tone?: VerbTone;
}

// Map tone to variant
const TONE_TO_VARIANT: Record<VerbTone, CardVariant> = {
    neutral: 'default',
    job: 'azure',
    quest: 'solar',
    danger: 'ember',
    system: 'amethyst',
};

// Map tone to orb variant
const TONE_TO_ORB: Record<VerbTone, OrbVariant> = {
    neutral: 'neutral',
    job: 'azure',
    quest: 'solar',
    danger: 'ember',
    system: 'amethyst',
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

const formatTime = (seconds?: number): string => {
    if (seconds === undefined || !Number.isFinite(seconds)) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * HearthstoneVerbCard - Premium activity card for Idle Village
 */
export const HearthstoneVerbCard = forwardRef<HTMLDivElement, HearthstoneVerbCardProps>(
    (
        {
            icon,
            label,
            sublabel,
            progressFraction,
            elapsedSeconds,
            totalDuration,
            injuryPercentage = 0,
            deathPercentage = 0,
            assignedCount = 0,
            totalSlots = 0,
            isInteractive = false,
            dropState = 'idle',
            onClick,
            variant,
            tone = 'neutral',
            className = '',
            ...rest
        },
        ref
    ) => {
        const clampedProgress = clamp01(progressFraction);
        const remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);
        const isActive = elapsedSeconds > 0 && remainingSeconds > 0;

        // Determine card state from drop state and active state
        let cardState: CardState = 'idle';
        if (dropState === 'valid') cardState = 'valid';
        else if (dropState === 'invalid') cardState = 'invalid';
        else if (isActive) cardState = 'active';

        // Use explicit variant or derive from tone
        const cardVariant = variant || TONE_TO_VARIANT[tone];
        const orbVariant = TONE_TO_ORB[tone];
        const progressVariant = cardVariant === 'default' ? 'gold' : cardVariant as 'azure' | 'ember' | 'jade' | 'amethyst' | 'solar';

        // Risk indicator colors
        const hasRisk = injuryPercentage > 0 || deathPercentage > 0;
        const riskColor = deathPercentage > 0 ? 'text-error' : 'text-warning';

        const handleClick = () => {
            if (isInteractive && onClick) onClick();
        };

        return (
            <HearthstoneCard
                ref={ref}
                variant={cardVariant}
                state={cardState}
                isInteractive={isInteractive}
                hasGlow={isActive || dropState !== 'idle'}
                className={`w-32 h-48 p-3 flex flex-col items-center ${className}`}
                onClick={handleClick}
                {...rest}
            >
                {/* Progress ring with orb icon */}
                <div className="relative flex-1 flex items-center justify-center">
                    <GlowProgress
                        progress={clampedProgress}
                        variant={progressVariant}
                        size="sm"
                        showTrail={true}
                    >
                        <OrbIcon
                            icon={icon}
                            variant={orbVariant}
                            size="sm"
                            isActive={isActive}
                        />
                    </GlowProgress>
                </div>

                {/* Timer display */}
                <div className="text-center mb-2">
                    <div className={`font-mono text-sm font-bold tracking-wider ${isActive ? 'text-gold-bright' : 'text-ivory-muted'}`}>
                        {formatTime(isActive ? remainingSeconds : totalDuration)}
                    </div>
                </div>

                {/* Label */}
                {label && (
                    <div className="text-center mb-1">
                        <div className="text-xs font-semibold text-ivory truncate max-w-full">{label}</div>
                        {sublabel && (
                            <div className="text-2xs text-ivory-dark truncate">{sublabel}</div>
                        )}
                    </div>
                )}

                {/* Bottom bar: slots + risk */}
                <div className="w-full flex justify-between items-center text-2xs">
                    {/* Slot indicator */}
                    <div className="text-teal-light">
                        <span className="font-bold">{assignedCount}</span>
                        <span className="opacity-60">/{totalSlots}</span>
                    </div>

                    {/* Risk indicator */}
                    {hasRisk && (
                        <div className={`${riskColor} font-semibold`}>
                            {deathPercentage > 0 ? `💀${deathPercentage}%` : `⚠️${injuryPercentage}%`}
                        </div>
                    )}
                </div>
            </HearthstoneCard>
        );
    }
);

HearthstoneVerbCard.displayName = 'HearthstoneVerbCard';

export default HearthstoneVerbCard;
