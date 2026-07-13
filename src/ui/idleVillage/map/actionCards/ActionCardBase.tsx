import type { CSSProperties, ReactNode } from 'react';
import { useMemo } from 'react';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';
import { useMinimalStyleLabTokens } from '@/ui/idleVillage/hooks/useMinimalStyleLabTokens';
import { DEFAULT_MINIMAL_CONFIG } from '@/balancing/config/idleVillage/minimalConfig';
import type { ActionCardAssignee, ActionCardMetric } from './ActionCard';
import { getActionCardFeelTokens } from '@/ui/styleLab/presets/presetBridge';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';

export interface ActionCardBaseProps {
  /** Card label/title */
  label: string;
  /** Icon or visual element */
  icon: ReactNode;
  /** Optional subtitle */
  subtitle?: string;
  /** Optional helper text */
  helperText?: string;
  /** Assignee badges (PgCard tokens) */
  assignees?: ActionCardAssignee[];
  /** Limit for assignee display (default 3) */
  assigneeDisplayLimit?: number;
  /** Optional status label */
  statusLabel?: string;
  /** Optional metrics display */
  metrics?: ActionCardMetric[];
  /** Optional className */
  className?: string;
  /** Optional data-testid for Playwright */
  dataTestId?: string;
  /** Optional pillar for Style Lab tokens */
  pillar?: StyleLabPillar;
  /** Drop state for visual feedback */
  dropState?: 'valid' | 'invalid' | 'idle';
  /** Extra content rendered inside the card frame (e.g. progress bar, halo, risk stripes). */
  children?: ReactNode;
}

/**
 * ActionCardBase – Frame-only component using WL-STY-004 actionCardFeel atoms.
 * Provides the card frame, assignee badges, and basic layout without halo or progress.
 * Designed to be composed by semantic wrappers (JobCard, QuestCard, etc.).
 */
export function ActionCardBase({
  label,
  icon,
  subtitle,
  helperText,
  assignees = [],
  assigneeDisplayLimit = 3,
  statusLabel,
  metrics = [],
  className,
  dataTestId,
  pillar,
  dropState,
  children,
}: ActionCardBaseProps) {
  const liveTokens = useStyleLabTokens();
  const fallbackTokens = useMinimalStyleLabTokens(DEFAULT_MINIMAL_CONFIG.ui);
  const tokens = liveTokens ?? fallbackTokens;
  const feelTokens = getActionCardFeelTokens('minimalFrontier', pillar ?? 'frontier');

  const frameStyle = useMemo((): CSSProperties => {
    const base = {
      backgroundColor: feelTokens.frameColor || tokens?.preset?.surfaces?.card?.background || '#1a1a1a',
      border: `2px solid ${feelTokens.frameGlow || tokens?.preset?.surfaces?.card?.borderColor || '#333'}`,
      borderRadius: tokens?.preset?.surfaces?.card?.borderRadius || '8px',
      boxShadow: `0 ${feelTokens.shadowDepth || '12px'} ${feelTokens.shadowDepth ? `${feelTokens.shadowDepth * 2}px` : '24px'} rgba(0,0,0,0.3)`,
      padding: '16px',
      transition: `transform ${feelTokens.transitionMs || 200}ms ease`,
      position: 'relative',
      overflow: 'hidden',
    };

    // Add drop state styling
    if (dropState === 'valid') {
      base.boxShadow = `0 0 0 2px rgba(34, 197, 94, 0.7)`;
    } else if (dropState === 'invalid') {
      base.boxShadow = `0 0 0 2px rgba(239, 68, 68, 0.7)`;
    } else if (dropState === 'idle') {
      base.boxShadow = `0 0 0 1px rgba(71, 85, 105, 0.4)`;
    }

    return base;
  }, [tokens, feelTokens, dropState]);

  const textStyle = useMemo((): CSSProperties => ({
    color: tokens?.preset?.text?.primary || '#fff',
    textAlign: 'center',
  }), [tokens]);

  const assigneeContainerStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    alignItems: 'center',
    marginTop: '8px',
  }), []);

  const assigneeStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    fontSize: '11px',
    color: tokens?.preset?.text?.secondary || '#ccc',
  }), [tokens]);

  const metricsStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginTop: '8px',
    fontSize: '10px',
    color: tokens?.preset?.text?.tertiary || '#999',
  }), [tokens]);

  const limitedAssignees = assignees.slice(0, assigneeDisplayLimit);
  const hasMoreAssignees = assignees.length > assigneeDisplayLimit;

  return (
    <div
      className={className}
      data-testid={dataTestId ?? 'action-card-base'}
      style={frameStyle}
    >
      {/* Header */}
      <div style={textStyle}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '2px' }}>
          {label}
        </div>
        {subtitle && (
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            {subtitle}
          </div>
        )}
        {statusLabel && (
          <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
            {statusLabel}
          </div>
        )}
      </div>

      {/* Icon */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '12px 0',
        fontSize: '24px',
        color: tokens?.preset?.text?.primary || '#fff'
      }}>
        {icon}
      </div>

      {/* Helper Text */}
      {helperText && (
        <div style={{
          ...textStyle,
          fontSize: '11px',
          opacity: 0.7,
          marginTop: '4px',
        }}>
          {helperText}
        </div>
      )}

      {/* Metrics */}
      {metrics.length > 0 && (
        <div style={metricsStyle}>
          {metrics.map((metric, index) => (
            <div key={index}>
              <span style={{ opacity: 0.6 }}>{metric.label}:</span>
              <span style={{ marginLeft: '4px', fontWeight: 'bold' }}>
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Assignees */}
      {limitedAssignees.length > 0 && (
        <div style={assigneeContainerStyle}>
          {limitedAssignees.map((assignee) => (
            <div key={assignee.id} style={assigneeStyle}>
              {assignee.portraitUrl ? (
                <img
                  src={assignee.portraitUrl}
                  alt={assignee.name}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: assignee.accentColor || tokens.preset.interactionColors.accentPrimary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  {assignee.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
                  {assignee.name}
                </div>
                {assignee.subtitle && (
                  <div style={{ fontSize: '8px', opacity: 0.7 }}>
                    {assignee.subtitle}
                  </div>
                )}
                {assignee.statusLabel && (
                  <div style={{ fontSize: '8px', opacity: 0.6 }}>
                    {assignee.statusLabel}
                  </div>
                )}
              </div>
            </div>
          ))}
          {hasMoreAssignees && (
            <div style={{ fontSize: '9px', opacity: 0.5 }}>
              +{assignees.length - assigneeDisplayLimit} more
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export default ActionCardBase;
