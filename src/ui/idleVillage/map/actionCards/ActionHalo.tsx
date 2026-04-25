import type { CSSProperties, DragEvent, KeyboardEvent, MouseEvent } from 'react';
import { useMemo, useState } from 'react';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';
import { getMapHaloFeelTokens, getHaloShaderTokens } from '@/ui/styleLab/presets/presetBridge';
import { getActionHaloSkinConfig, type ActionHaloSkinConfig } from '@/ui/idleVillage/skins/actionHaloSkinConfig';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';

export interface ActionHaloProps {
  /** Icon or visual element in center */
  icon?: React.ReactNode;
  /** Icon text fallback if no icon provided */
  iconText?: string;
  /** Optional size override */
  size?: number;
  /** Optional ring width override */
  ringWidth?: number;
  /** Optional fractional progress (0-1) visualized as a sweeping arc */
  fillFraction?: number;
  /** Optional pulse intensity override (0-1) */
  pulseIntensity?: number;
  /** Optional pulse speed override (seconds) */
  pulseSpeed?: number;
  /** Optional blur radius for glow effect */
  shadowBlur?: number;
  /** Optional className */
  className?: string;
  /** Optional data-testid for Playwright */
  dataTestId?: string;
  /** Optional pillar for Style Lab tokens */
  pillar?: StyleLabPillar;
  /** Enable bloom effect on hover/drag (default true) */
  enableBloom?: boolean;
  /** Click handler */
  onClick?: (event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => void;
  /** Pointer enter handler */
  onHover?: (event: MouseEvent<HTMLDivElement>) => void;
  /** Pointer leave handler */
  onLeave?: (event: MouseEvent<HTMLDivElement>) => void;
  /** Drop handler */
  onDrop?: (event: DragEvent<HTMLDivElement>) => void;
  /** Drag enter handler */
  onDragEnter?: (event: DragEvent<HTMLDivElement>) => void;
  /** Drag leave handler */
  onDragLeave?: (event: DragEvent<HTMLDivElement>) => void;
  /** Drag over handler */
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
}

/**
 * ActionHalo – Map POI halo component using WL-STY-004 mapHaloFeel and haloShader atoms.
 * Renders a pulsing ring with optional icon, designed for map POI visualization.
 * Uses Style Laboratory tokens for colors, gradients, and animations.
 */
export function ActionHalo({
  icon,
  iconText = 'POI',
  size = 32,
  ringWidth = 4,
  fillFraction,
  pulseIntensity,
  pulseSpeed,
  shadowBlur,
  className,
  dataTestId,
  pillar,
  enableBloom = true,
  onClick,
  onHover,
  onLeave,
  onDrop,
  onDragEnter,
  onDragLeave,
  onDragOver,
}: ActionHaloProps) {
  const tokens = useStyleLabTokens();
  const feelTokens = getMapHaloFeelTokens('minimalFrontier', pillar);
  const shaderTokens = getHaloShaderTokens('minimalFrontier', pillar);

  const _enableBloom = enableBloom;

  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const finalPulseIntensity = pulseIntensity ?? feelTokens.pulseIntensity;
  const finalPulseSpeed = pulseSpeed ?? feelTokens.pulseSpeed;
  const finalShadowBlur = shadowBlur ?? feelTokens.shadowBlur;
  const clampedFillFraction = Math.max(0, Math.min(1, fillFraction ?? 0));
  const progressRadius = Math.max(0, size - ringWidth * 1.25);
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressDashOffset = progressCircumference * (1 - clampedFillFraction);
  const progressStrokeColor = feelTokens.haloColor || tokens.preset.interactionColors.accentPrimary;
  const showProgressArc = clampedFillFraction > 0 && progressCircumference > 0;

  const haloStyle = useMemo((): CSSProperties => {
    const base: CSSProperties = {
      position: 'relative',
      width: `${size * 2}px`,
      height: `${size * 2}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: onClick ? 'pointer' : 'default',
      transition: `transform ${feelTokens.interaction.transitionMs}ms ease`,
    };

    // Apply hover/active scaling
    if (isActive) {
      (base as any).transform = `scale(${feelTokens.interaction.activeScale})`;
    } else if (isHovered) {
      (base as any).transform = `scale(${feelTokens.interaction.hoverScale})`;
    }

    return base;
  }, [size, feelTokens, isHovered, isActive, onClick]);

  const progressArcStyle = useMemo((): CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    transform: 'rotate(-90deg)',
  }), []);

  const ringStyle = useMemo((): CSSProperties => {
    const gradientStops = shaderTokens.gradientStops || [
      { offset: 0, color: 'rgba(71, 85, 105, 0.8)', opacity: 0.8 },
      { offset: 0.5, color: 'rgba(71, 85, 105, 0.4)', opacity: 0.4 },
      { offset: 1, color: 'rgba(71, 85, 105, 0)', opacity: 0 },
    ];

    // Create gradient string
    const gradientColors = gradientStops
      .map(stop => `${stop.color} ${Math.round(stop.offset * 100)}%`)
      .join(', ');

    return {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      border: `${ringWidth}px solid transparent`,
      borderRadius: '50%',
      background: `linear-gradient(${(shaderTokens as any).shader?.gradientType || 'radial'}, ${gradientColors})`,
      boxShadow: `0 0 ${finalShadowBlur}px ${feelTokens.haloGlow}`,
      opacity: finalPulseIntensity,
      animation: finalPulseIntensity > 0 ? `pulse ${finalPulseSpeed}s ease-in-out infinite` : 'none',
      pointerEvents: 'none' as const,
    };
  }, [ringWidth, shaderTokens, finalShadowBlur, feelTokens, finalPulseIntensity, finalPulseSpeed]);

  const iconStyle = useMemo((): CSSProperties => {
    return {
      width: `${size * 0.6}px`,
      height: `${size * 0.6}px`,
      backgroundColor: feelTokens.haloColor || tokens.preset.interactionColors.accentPrimary,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: `${size * 0.3}px`,
      fontWeight: 'bold',
      zIndex: 1,
      pointerEvents: 'none' as const,
    };
  }, [size, feelTokens, tokens]);

  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
    onHover?.( e);
  };

  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    setIsHovered(false);
    onLeave?.( e);
  };

  const handleMouseDown = () => {
    setIsActive(true);
  };

  const handleMouseUp = () => {
    setIsActive(false);
  };

  const handleClick = (e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => {
    onClick?.(e);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    setIsActive(false);
    onDrop?.(e);
  };

  return (
    <div
      className={className}
      data-testid={dataTestId ?? 'action-halo'}
      style={haloStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
    >
      {/* Halo ring */}
      <div style={ringStyle} />

      {/* Progress arc overlay */}
      {showProgressArc && (
        <svg
          width={size * 2}
          height={size * 2}
          style={progressArcStyle}
          viewBox={`0 0 ${size * 2} ${size * 2}`}
          role="presentation"
          aria-hidden="true"
        >
          <circle
            cx={size}
            cy={size}
            r={progressRadius}
            stroke={progressStrokeColor}
            strokeWidth={ringWidth}
            strokeDasharray={progressCircumference}
            strokeDashoffset={progressDashOffset}
            strokeLinecap="round"
            fill="none"
            opacity={0.95}
          />
        </svg>
      )}
      
      {/* Icon */}
      {icon || (
        <div style={iconStyle}>
          {iconText}
        </div>
      )}
    </div>
  );
}

export default ActionHalo;
