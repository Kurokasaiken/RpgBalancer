import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import clsx from 'clsx';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';
import type { LocationDropState } from '@/ui/idleVillage/map/validators/locationDropValidators';
import { RESIDENT_DRAG_MIME } from '@/ui/idleVillage/constants';
import {
    deriveTheaterRiskStripes,
    type TheaterRiskStripeMetrics,
} from '@/ui/idleVillage/theater/riskStripes';
import {
    type ActionCardFeelPreset,
    useActionCardFeel,
    useActionCardTheme,
} from '@/ui/idleVillage/map/actionCards/useActionCardStyling';

/**
 * @deprecated ActivityActionCard is deprecated. Use ActionCardWrapper or specific wrappers (JobCard, QuestCard, TrainingCard, MaintenanceCard) instead.
 * See IV-ACT-LEGACY-CLEANUP-006 for migration guidance.
 * This component will be removed in a future release.
 */

/**
 * Supported layout variants for the card.
 */
export type ActivityActionCardVariant = 'compact' | 'detail';

/** Contract for the config-first activity action card exposed to map consumers.
 * @deprecated Use ActionCardWrapper or specific wrappers instead. See IV-ACT-LEGACY-CLEANUP-006.
 */
export interface ActivityActionCardProps {
    /** Slot identifier to expose through accessibility metadata. */
    slotId: string;
    /** Primary label displayed on the card. */
    label: string;
    /** Optional helper text shown under the label when variant = detail. */
    helperText?: string | null;
    /** Optional icon or emoji rendered inside the medallion. */
    icon?: ReactNode;
    /** Visual theme borrowed from VerbCard tokens. */
    visualVariant?: VerbVisualVariant;
    /** Currently assigned resident identifier (used for instrumentation). */
    assignedResidentId?: string | null;
    /** Display name for the assigned resident (if any). */
    assignedResidentName?: string | null;
    /** Fractional progress (0-1). */
    progressFraction: number;
    /** Elapsed time in seconds. */
    elapsedSeconds: number;
    /** Total duration in seconds. */
    totalDurationSeconds: number;
    /** Whether the card should prefer the expanded detail layout. */
    variant?: ActivityActionCardVariant;
    /** Drag/drop external state propagated by the parent. */
    dropState?: DropState;
    /** Whether the slot can currently accept drops. */
    canAcceptDrop?: boolean;
    /** Optional disabled state to gray out the card. */
    disabled?: boolean;
    /** Optional CTA label rendered at the footer (detail variant only). */
    ctaLabel?: string;
    /** Called when the CTA or card is clicked. */
    onClick?: () => void;
    /** Called when a worker token is dropped onto the card. */
    onWorkerDrop?: (workerId: string | null) => void;
    /** Hover callback used by HUD overlays. */
    onHoverChange?: (isHovering: boolean) => void;
    /** Additional mouse enter handler. */
    onMouseEnter?: () => void;
    /** Additional mouse leave handler. */
    onMouseLeave?: () => void;
    /** Optional risk data to paint the injury stripe. */
    riskPercentages?: {
        injury: number;
        death: number;
    };
    /** Optional precomputed risk stripe metrics shared with parent containers. */
    riskStripeMetrics?: TheaterRiskStripeMetrics;
    /** Optional heroic feedback to display when quest phase is completed successfully */
    heroicFeedback?: {
        /** Whether to show heroic badge */
        showBadge?: boolean;
        /** Heroic badge label/text */
        label?: string;
    };
    /** Optional quest phase sequence for multi-phase quests (config-first from QuestEngine) */
    questPhaseSequence?: {
        currentPhaseIndex?: number;
        totalPhases?: number;
        currentPhaseType?: string;
    };
    /** Optional telemetry badges to display quest analytics */
    telemetryBadges?: {
        recentChoice?: string;
        branchCount?: number;
        avgChoiceTime?: number;
    };
    /** Optional feel preset override sourced via Style Lab physics bridge */
    feelPreset?: ActionCardFeelPreset;
}

/**
 * Clamps a numeric value to the 0-1 range.
 */
const clamp01 = (value: number): number => {
    return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
};

/**
 * Formats seconds into mm:ss for the Observatory HUD.
 */
const formatSeconds = (seconds: number): string => {
    if (!Number.isFinite(seconds)) return '--:--';
    const mins = Math.max(0, Math.floor(seconds / 60));
    const secs = Math.max(0, Math.floor(seconds % 60));
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Observatory-native card combining drag/drop, timers, and risk visualization.
 *
 * @deprecated This component is deprecated. Use ActionCardWrapper or specific wrappers instead.
 * See IV-ACT-LEGACY-CLEANUP-006 for migration guidance.
 * 
 * @param props Component properties supplied by higher-level map views.
 */
function ActivityActionCard({
    slotId,
    label,
    helperText,
    icon,
    visualVariant = 'azure',
    assignedResidentId,
    assignedResidentName,
    progressFraction,
    elapsedSeconds,
    totalDurationSeconds,
    variant = 'compact',
    dropState = 'idle',
    canAcceptDrop = true,
    disabled = false,
    ctaLabel,
    onClick,
    onWorkerDrop,
    onHoverChange,
    onMouseEnter,
    onMouseLeave,
    riskPercentages,
    riskStripeMetrics,
    heroicFeedback,
    questPhaseSequence,
    telemetryBadges,
    feelPreset = 'default',
}: ActivityActionCardProps) {
    // Runtime deprecation warning
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn(
        'ActivityActionCard is deprecated. Use ActionCardWrapper or specific wrappers (JobCard, QuestCard, TrainingCard, MaintenanceCard) instead. See IV-ACT-LEGACY-CLEANUP-006 for migration guidance.'
      );
    }

    const [isDragActive, setIsDragActive] = useState(false);

    const clampedProgress = clamp01(progressFraction);
    const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);
    const theme = useActionCardTheme(visualVariant);
    const feel = useActionCardFeel(feelPreset);
    const droppable = Boolean(onWorkerDrop) && canAcceptDrop && !disabled;
    const dropShadow = dropState === 'valid'
        ? theme.drop.valid
        : dropState === 'invalid'
            ? theme.drop.invalid
            : theme.drop.idle;
    const cardStyle = {
        background: theme.surface.background,
        borderColor: theme.surface.borderColor,
        borderRadius: theme.surface.borderRadius,
        boxShadow: [theme.surface.boxShadow, dropShadow].filter(Boolean).join(', ') || undefined,
    } as const;

    const riskStripeProps = useMemo(() => {
        const metrics =
            riskStripeMetrics ??
            deriveTheaterRiskStripes({
                injuryPercentage: riskPercentages?.injury ?? 0,
                deathPercentage: riskPercentages?.death ?? 0,
            });
        return {
            style: metrics.style,
            injury: metrics.injuryPercent,
            death: metrics.deathPercent,
            hasRisk: metrics.hasRisk,
            segments: metrics.segments,
        };
    }, [riskPercentages, riskStripeMetrics]);

    const handleDragOver = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            if (!droppable) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            if (!isDragActive) {
                setIsDragActive(true);
                onHoverChange?.(true);
            }
        },
        [droppable, isDragActive, onHoverChange],
    );

    const handleDragLeave = useCallback(() => {
        if (!isDragActive) return;
        setIsDragActive(false);
        onHoverChange?.(false);
    }, [isDragActive, onHoverChange]);

    const handleDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            if (!droppable) return;
            event.preventDefault();
            const workerId =
                event.dataTransfer.getData(RESIDENT_DRAG_MIME) ||
                event.dataTransfer.getData('text/plain') ||
                null;
            onWorkerDrop?.(workerId || null);
            setIsDragActive(false);
            onHoverChange?.(false);
        },
        [droppable, onWorkerDrop, onHoverChange],
    );

    const handleClick = useCallback(() => {
        if (disabled) return;
        onClick?.();
    }, [disabled, onClick]);

    const handleMouseEnter = useCallback(() => {
        onMouseEnter?.();
        onHoverChange?.(true);
    }, [onMouseEnter, onHoverChange]);

    const handleMouseLeave = useCallback(() => {
        onMouseLeave?.();
        onHoverChange?.(false);
    }, [onMouseLeave, onHoverChange]);

    const baseClasses = clsx(
        'relative rounded-3xl border text-ivory transition-all duration-200',
        variant === 'detail' ? 'p-4 w-64' : 'p-3 w-48',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer',
        dropState === 'invalid' && 'opacity-40',
    );

    const iconWrapperClasses = clsx(
        'flex items-center justify-center rounded-2xl border w-14 h-14 text-3xl transition-transform duration-200',
    );

    const progressBarStyle = {
        width: `${clampedProgress * 100}%`,
        backgroundColor: theme.accentColor,
    };

    const progressHaloStyle = {
        background: `conic-gradient(${theme.haloColor} ${clampedProgress * 360}deg, rgba(5,6,11,0.4) 0deg)`,
    };

    const iconStyle = {
        borderColor: theme.surface.borderColor ?? theme.accentColor,
        boxShadow: isDragActive && droppable ? theme.glowColor : undefined,
        transform: isDragActive && droppable ? `scale(${feel.liftScale.toFixed(3)})` : undefined,
    } as const;

    return (
        <div
            data-slot-id={slotId}
            data-drop-state={dropState}
            data-assigned-worker={assignedResidentId ?? undefined}
            className={baseClasses}
            style={cardStyle}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            aria-disabled={disabled}
        >
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="absolute inset-0 rounded-2xl blur-md opacity-40" style={progressHaloStyle} />
                    <div className={iconWrapperClasses} style={iconStyle}>
                        <span aria-hidden>{icon ?? '◎'}</span>
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-[0.35em] text-amber-200">{label}</span>
                    {assignedResidentName ? (
                        <span className="text-[11px] text-slate-300">{assignedResidentName}</span>
                    ) : (
                        <span className="text-[11px] text-slate-500">Nessun assegnato</span>
                    )}
                    {questPhaseSequence && questPhaseSequence.currentPhaseIndex !== undefined && questPhaseSequence.totalPhases !== undefined && (
                        <span className="text-[9px] text-amber-300/80 uppercase tracking-[0.2em]">
                            Phase {questPhaseSequence.currentPhaseIndex + 1}/{questPhaseSequence.totalPhases}: {questPhaseSequence.currentPhaseType ?? 'Unknown'}
                        </span>
                    )}
                    {helperText && variant === 'detail' && (
                        <span className="text-[10px] text-slate-400">{helperText}</span>
                    )}
                </div>
            </div>

            <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between">
                    <div className="h-1.5 w-full rounded-full bg-slate-800/80">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={progressBarStyle}
                            aria-hidden
                        />
                    </div>
                    {heroicFeedback?.showBadge && (
                        <div className="ml-2 flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-500/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-amber-200">
                            <span>🏆</span>
                            <span>{heroicFeedback.label ?? 'Heroic'}</span>
                        </div>
                    )}
                    {telemetryBadges?.recentChoice && (
                        <div className="ml-2 flex items-center gap-1 rounded-full border border-blue-400/60 bg-blue-500/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-blue-200">
                            <span>💭</span>
                            <span className="truncate max-w-16">{telemetryBadges.recentChoice}</span>
                        </div>
                    )}
                    {telemetryBadges?.branchCount !== undefined && telemetryBadges.branchCount > 0 && (
                        <div className="ml-2 flex items-center gap-1 rounded-full border border-purple-400/60 bg-purple-500/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-purple-200">
                            <span>🔀</span>
                            <span>{telemetryBadges.branchCount}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Elapsed {formatSeconds(elapsedSeconds)}</span>
                    <span>Remaining {formatSeconds(remainingSeconds)}</span>
                </div>
            </div>

            {variant === 'detail' && ctaLabel && (
                <button
                    type="button"
                    className="mt-3 w-full rounded-2xl border border-amber-200/40 bg-linear-to-r from-amber-500/30 to-amber-200/20 py-2 text-xs uppercase tracking-[0.3em] text-amber-50 transition hover:from-amber-500/50 hover:to-amber-200/40"
                    onClick={handleClick}
                >
                    {ctaLabel}
                </button>
            )}

            <div
                data-testid="activity-risk-stripe"
                className="absolute right-1 top-2 bottom-2 w-1.5 rounded-full overflow-hidden flex flex-col"
                data-injury-percent={riskStripeProps.injury}
                data-death-percent={riskStripeProps.death}
                data-has-risk={riskStripeProps.hasRisk ? 'true' : 'false'}
                aria-label="Risk indicator"
            >
                {riskStripeProps.segments.deathHeightPercent > 0 && (
                    <div
                        className="bg-red-500/95"
                        style={{ height: `${riskStripeProps.segments.deathHeightPercent}%` }}
                        data-segment="death"
                    />
                )}
                {riskStripeProps.segments.injuryHeightPercent > 0 && (
                    <div
                        className="bg-yellow-500/95"
                        style={{ height: `${riskStripeProps.segments.injuryHeightPercent}%` }}
                        data-segment="injury"
                    />
                )}
                {riskStripeProps.segments.safeHeightPercent > 0 && (
                    <div
                        className="bg-slate-400/18"
                        style={{ height: `${riskStripeProps.segments.safeHeightPercent}%` }}
                        data-segment="safe"
                    />
                )}
            </div>
        </div>
    );
}

export default ActivityActionCard;
