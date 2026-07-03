import { useEffect, useRef } from 'react';
import type { ButtonHTMLAttributes, MouseEvent, ReactNode, DragEvent } from 'react';
import type { LocationDropState } from '@/ui/idleVillage/map/validators/locationDropValidators';
import theaterPlaceholder from '@/assets/ui/idleVillage/panorama-hotspring.jpg';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import { useLocationTooltip, useLocationTooltipData } from '@/ui/idleVillage/hooks/useLocationTooltip';
import LocationTooltip from '@/ui/idleVillage/components/LocationTooltip';
import type { LocationTooltipConfig } from '@/ui/idleVillage/config/locationTooltipConfig';

/**
 * Props for the decorative location preview card used in Idle Village.
 */
/**
 * Lightweight summary of the activity to showcase inside the location card.
 */
export interface LocationFeaturedActivity {
  /**
   * Unique slot identifier for the activity showcased.
   */
  slotId: string;
  /**
   * Icon, emoji or glyph representing the featured activity.
   */
  icon?: ReactNode;
  /**
   * Display label for the activity.
   */
  label: string;
  /**
   * Optional short label communicating the current state (e.g. ETA or status).
   */
  metaLabel?: string;
  /**
   * Optional highlight tone used to select accent colors.
   */
  tone?: 'neutral' | 'job' | 'quest' | 'danger' | 'system';
  /**
   * Resident names currently associated with the featured activity.
   */
  assignedNames?: string[];
  /**
   * Normalized progress value between 0 and 1.
   */
  progressFraction: number;
  /**
   * Textual representation of the progress (percentage, ETA, etc).
   */
  progressLabel?: string;
}

type LocationCardSize = 'standard' | 'compact';

const SIZE_CLASS_MAP: Record<LocationCardSize, { wrapper: string; innerPadding: string; featuredPadding: string; featuredText: string }> = {
  standard: {
    wrapper: 'w-full',
    innerPadding: 'px-3 py-3',
    featuredPadding: 'px-3 py-3 text-[11px]',
    featuredText: 'text-[10px]',
  },
  compact: {
    wrapper: 'w-[240px]',
    innerPadding: 'px-2.5 py-2.5',
    featuredPadding: 'px-2.5 py-2.5 text-[10px]',
    featuredText: 'text-[9px]',
  },
};

export interface LocationCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  description: string;
  onInspect?: () => void;
  onResidentDrop?: (residentId: string) => void;
  onDragIntent?: (residentId: string | null) => void;
  onResidentDragEnter?: (residentId: string | null) => void;
  onResidentDragLeave?: () => void;
  dropState?: DropState;
  backgroundImageSrc?: string;
  /**
   * Optional featured activity preview rendered inside the card.
   */
  featuredActivity?: LocationFeaturedActivity | null;
  /** When true, location is locked (night phase) - blocks interactions */
  isLockedByPhase?: boolean;
  /**
   * Visual density of the card. Compact is used for side panels/map HUDs.
   * Defaults to 'standard' to preserve historical sizing.
   */
  size?: LocationCardSize;
  /**
   * Optional test id applied to the button for Playwright selectors.
   */
  testId?: string;
  /**
   * Optional test id applied to the bloom overlay rendered when drop is valid.
   */
  bloomTestId?: string;
  /**
   * Enable tooltip on hover/focus. Defaults to true.
   */
  enableTooltip?: boolean;
  /**
   * Custom tooltip configuration
   */
  tooltipConfig?: Partial<LocationTooltipConfig>;
  /**
   * Additional tooltip data (crew capacity, requirements, etc)
   */
  tooltipData?: {
    locationId?: string;
    crewMax?: number;
    requiredStats?: string[];
    riskLevel?: 'none' | 'low' | 'medium' | 'high' | 'critical';
    phaseStatus?: string;
    etaSeconds?: number;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Stylized card that showcases an Idle Village location with optional icon rows.
 */
const locationCardDiagnostics = createSandboxDiagnostics<{ dropState: DropState; title: string }>('location-card-drag', 'validators');

const LocationCard: React.FC<LocationCardProps> = ({
  title,
  description,
  onInspect,
  onResidentDrop,
  onDragIntent,
  onResidentDragEnter,
  onResidentDragLeave,
  dropState = 'idle',
  backgroundImageSrc,
  featuredActivity,
  isLockedByPhase = false,
  size = 'standard',
  onClick,
  testId = 'location-card',
  bloomTestId = 'location-card-bloom',
  enableTooltip = true,
  tooltipConfig,
  tooltipData: additionalTooltipData,
  ...buttonProps
}) => {
  const previousDropStateRef = useRef<DropState | null>(null);

  // Tooltip integration
  const tooltipDataProcessed = useLocationTooltipData(
    additionalTooltipData?.locationId || `location-${title}`,
    title,
    description,
    featuredActivity,
    {
      crewMax: additionalTooltipData?.crewMax,
      requiredStats: additionalTooltipData?.requiredStats,
      riskLevel: additionalTooltipData?.riskLevel,
      isLockedByPhase,
      phaseStatus: additionalTooltipData?.phaseStatus,
      etaSeconds: additionalTooltipData?.etaSeconds,
      metadata: additionalTooltipData?.metadata,
    }
  );

  const tooltip = useLocationTooltip(tooltipConfig);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (isLockedByPhase) return;
    onClick?.(event);
    onInspect?.();
  };

  const handleMouseEnter = (event: MouseEvent<HTMLButtonElement>) => {
    if (enableTooltip && tooltipConfig?.behavior?.showOnHover !== false) {
      tooltip.showTooltip(tooltipDataProcessed, event);
    }
  };

  const handleMouseLeave = () => {
    if (enableTooltip) {
      tooltip.hideTooltip();
    }
  };

  const handleMouseMove = (event: MouseEvent<HTMLButtonElement>) => {
    if (enableTooltip && tooltip.isVisible) {
      tooltip.updatePosition(event);
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLButtonElement>) => {
    if (enableTooltip && tooltipConfig?.behavior?.showOnFocus !== false) {
      tooltip.showTooltip(tooltipDataProcessed, event as unknown as MouseEvent);
    }
  };

  const handleBlur = () => {
    if (enableTooltip) {
      tooltip.hideTooltip();
    }
  };

  const extractResidentId = (event: DragEvent<HTMLElement>) =>
    event.dataTransfer.getData('text/resident-id') || event.dataTransfer.getData('text/plain') || null;

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isLockedByPhase) return;
    onDragIntent?.(extractResidentId(event));
  };

  const handleDragEnter = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isLockedByPhase) return;
    const residentId = extractResidentId(event);
    onDragIntent?.(residentId);
    onResidentDragEnter?.(residentId);
    onInspect?.();
  };

  const handleDragLeave = () => {
    onDragIntent?.(null);
    onResidentDragLeave?.();
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isLockedByPhase) return;
    onDragIntent?.(null);
    const residentId = extractResidentId(event);
    if (residentId && onResidentDrop && dropState !== 'invalid') {
      onResidentDrop(residentId);
    }
    onInspect?.();
  };

  useEffect(() => {
    if (previousDropStateRef.current !== dropState) {
      locationCardDiagnostics.info('drop_state_change', {
        dropState,
        title,
      });
      previousDropStateRef.current = dropState;
    }
  }, [dropState, title]);

  const progressPercent = featuredActivity ? Math.min(100, Math.max(0, featuredActivity.progressFraction * 100)) : 0;
  const toneAccent = featuredActivity?.tone ?? 'neutral';
  const accentByTone: Record<typeof toneAccent, { glow: string; fill: string }> = {
    neutral: { glow: 'rgba(255,255,255,0.18)', fill: 'linear-gradient(90deg, rgba(255,255,255,0.55), rgba(148,197,255,0.45))' },
    job: { glow: 'rgba(80,200,120,0.45)', fill: 'linear-gradient(90deg, rgba(137,247,97,0.7), rgba(46,204,113,0.6))' },
    quest: { glow: 'rgba(255,195,113,0.4)', fill: 'linear-gradient(90deg, rgba(255,196,115,0.85), rgba(255,153,102,0.7))' },
    danger: { glow: 'rgba(255,100,100,0.45)', fill: 'linear-gradient(90deg, rgba(255,138,138,0.85), rgba(255,92,92,0.7))' },
    system: { glow: 'rgba(126,190,255,0.4)', fill: 'linear-gradient(90deg, rgba(126,190,255,0.85), rgba(74,144,226,0.7))' },
  };
  const accent = accentByTone[toneAccent] ?? accentByTone.neutral;

  const isValidDropState = dropState === 'valid';
  const isInvalidDropState = dropState === 'invalid' || dropState === 'locked';
  const bloomVisible = isValidDropState && !isLockedByPhase;
  const dropStateClass =
    isValidDropState ? 'valid-drop' : isInvalidDropState ? 'invalid-drop' : undefined;
  const canDropAttr = isValidDropState ? 'true' : isInvalidDropState ? 'false' : undefined;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-pressed={dropState !== 'idle'}
        aria-dropeffect={dropState === 'valid' ? 'copy' : undefined}
        className={[
        'location-card',
        'group relative block overflow-hidden rounded-[28px] border transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/30',
        SIZE_CLASS_MAP[size].wrapper,
        dropState === 'valid'
          ? 'border-amber-300/80 shadow-[0_0_70px_rgba(236,197,94,0.45)] ring-4 ring-amber-200/50'
          : dropState === 'invalid' || dropState === 'locked'
            ? 'border-white/10 opacity-60'
            : 'border-[color:var(--panel-border)] shadow-[0_22px_55px_rgba(0,0,0,0.55)] hover:border-emerald-200/60',
        dropStateClass,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        background: 'var(--panel-surface)',
      }}
      aria-label={title}
      aria-live={dropState !== 'idle' ? 'polite' : undefined}
      data-state={dropState}
      data-can-drop={canDropAttr}
      data-bloom-visible={bloomVisible ? 'true' : 'false'}
      {...buttonProps}
      data-testid={testId}
    >
      <div
        className={[
          'pointer-events-none relative flex w-full flex-col rounded-[24px] bg-[radial-gradient(circle_at_25%_10%,rgba(88,142,122,0.25),rgba(2,4,6,0.92))] text-left text-ivory',
          SIZE_CLASS_MAP[size].innerPadding,
        ].join(' ')}
      >
        <div className="relative aspect-[2.1/1] w-full overflow-hidden rounded-[26px] border border-white/8 bg-[rgba(9,12,17,0.9)]">
          <img
            src={backgroundImageSrc ?? theaterPlaceholder}
            alt=""
            className="h-full w-full object-cover brightness-[0.78]"
            loading="lazy"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {bloomVisible && (
            <div
              data-testid={bloomTestId}
              className="pointer-events-none absolute inset-0 animate-pulse rounded-[26px] border border-amber-200/70 ring-4 ring-amber-100/20"
              data-state="valid"
              data-bloom="active"
            />
          )}
          <span className="sr-only">{`${title} – ${description}`}</span>
        </div>

        {featuredActivity && (
          <div
            className={[
              'mt-3 rounded-[22px] border border-white/12 bg-black/35 uppercase tracking-[0.3em] text-slate-200 shadow-[0_18px_38px_rgba(0,0,0,0.55)]',
              SIZE_CLASS_MAP[size].featuredPadding,
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-2">
              <div className={['flex items-center gap-2 tracking-[0.35em]', SIZE_CLASS_MAP[size].featuredText].join(' ')}>
                <span className="text-lg">{featuredActivity.icon ?? '◎'}</span>
                <span className="text-slate-100">{featuredActivity.label}</span>
              </div>
              {featuredActivity.metaLabel && (
                <span className="text-[9px] text-amber-100/70">{featuredActivity.metaLabel}</span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2.5 flex-1 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full shadow-[0_0_15px_currentColor]"
                  style={{
                    width: `${progressPercent}%`,
                    background: accent.fill,
                    boxShadow: `0 0 22px ${accent.glow}`,
                  }}
                  aria-hidden="true"
                />
              </div>
              {featuredActivity.progressLabel && (
                <span className="text-[9px] text-amber-200/80">{featuredActivity.progressLabel}</span>
              )}
            </div>
            {featuredActivity.assignedNames && featuredActivity.assignedNames.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1 text-[10px] tracking-[0.2em] text-slate-100">
                {featuredActivity.assignedNames.map((name) => (
                  <span
                    key={`${featuredActivity.slotId}-${name}`}
                    className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[9px]"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Night phase lock overlay */}
        {isLockedByPhase && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-[24px] bg-slate-900/70 backdrop-blur-sm">
            <span className="text-3xl" aria-hidden>🌙</span>
            <span className="mt-2 text-[10px] uppercase tracking-[0.4em] text-slate-300">Notte - Riposo</span>
          </div>
        )}
      </div>
    </button>

      {/* Tooltip */}
      {enableTooltip && tooltip.isVisible && tooltip.position && tooltip.tooltipData && (
        <LocationTooltip
          data={tooltip.tooltipData}
          position={tooltip.position}
          isVisible={tooltip.isVisible}
          onClose={tooltip.hideTooltipImmediate}
          config={tooltipConfig}
          testId={`${testId}-tooltip`}
        />
      )}
    </>
  );
};

export default LocationCard;
