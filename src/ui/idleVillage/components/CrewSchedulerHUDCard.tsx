/**
 * Crew Scheduler HUD Card Component - NP-017
 * 
 * React component for displaying crew scheduler information in the Active HUD.
 * Provides crew status, alerts, and quick controls (pause/priority adjustment).
 * Follows Gilded Observatory theme with compact, analytics-focused design.
 * 
 * @since 2026-01-19
 * @author Cascade
 */

import React, { useCallback, useMemo } from 'react';
import type { CrewHUDEntry, CrewHUDMetrics } from '../hooks/useCrewHUDState';
import type {
  CrewHUDConfig,
  CrewStatusLevel,
  CrewAlertLevel,
} from '../config/hudCrewConfig';
import {
  CREW_STATUS_LEVELS,
  CREW_ALERT_LEVELS,
} from '../config/hudCrewConfig';

/**
 * Component props
 */
export interface CrewSchedulerHUDCardProps {
  /** Crew entry to display */
  crewEntry: CrewHUDEntry;
  /** HUD configuration */
  config: CrewHUDConfig;
  /** Overall HUD metrics */
  metrics: CrewHUDMetrics;
  /** On pause toggle callback */
  onPauseToggle: (crewId: string) => void;
  /** On priority adjustment callback */
  onPriorityAdjust: (crewId: string, priority: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show compact view */
  compact?: boolean;
}

/**
 * Status badge component
 */
function StatusBadge({ 
  status, 
  config 
}: { 
  status: CrewStatusLevel; 
  config: CrewHUDConfig;
}) {
  const badgeConfig = config.badges[status];
  
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: badgeConfig.backgroundColor,
        color: badgeConfig.textColor,
        borderColor: badgeConfig.borderColor,
        fontSize: `${badgeConfig.size * 0.75}px`,
      }}
    >
      {badgeConfig.showIcon && badgeConfig.icon && (
        <span className="text-xs">{badgeConfig.icon}</span>
      )}
      <span className="uppercase tracking-wide">{status}</span>
    </div>
  );
}

/**
 * Alert indicator component
 */
function AlertIndicator({ 
  alertLevel, 
  config 
}: { 
  alertLevel: CrewAlertLevel; 
  config: CrewHUDConfig;
}) {
  if (alertLevel === CREW_ALERT_LEVELS.NONE) {
    return null;
  }

  const color = config.colors.alerts[alertLevel];
  const isPulsing = config.animation.enableAlertPulse && 
    (alertLevel === CREW_ALERT_LEVELS.HIGH || alertLevel === CREW_ALERT_LEVELS.CRITICAL);

  return (
    <div
      className={`w-2 h-2 rounded-full ${isPulsing ? 'animate-pulse' : ''}`}
      style={{
        backgroundColor: color,
        boxShadow: `0 0 4px ${color}`,
      }}
      title={`Alert: ${alertLevel}`}
    />
  );
}

/**
 * Control buttons component
 */
function ControlButtons({ 
  crewEntry, 
  config, 
  onPauseToggle, 
  onPriorityAdjust 
}: { 
  crewEntry: CrewHUDEntry;
  config: CrewHUDConfig;
  onPauseToggle: (crewId: string) => void;
  onPriorityAdjust: (crewId: string, priority: number) => void;
}) {
  const handlePauseToggle = useCallback(() => {
    onPauseToggle(crewEntry.crewId);
  }, [crewEntry.crewId, onPauseToggle]);

  const handlePriorityIncrease = useCallback(() => {
    const newPriority = (crewEntry.priorityScore || 0.5) + 0.1;
    onPriorityAdjust(crewEntry.crewId, Math.min(1.0, newPriority));
  }, [crewEntry.crewId, crewEntry.priorityScore, onPriorityAdjust]);

  const handlePriorityDecrease = useCallback(() => {
    const newPriority = (crewEntry.priorityScore || 0.5) - 0.1;
    onPriorityAdjust(crewEntry.crewId, Math.max(0.0, newPriority));
  }, [crewEntry.crewId, crewEntry.priorityScore, onPriorityAdjust]);

  if (!config.controls.enablePause && !config.controls.enablePriority) {
    return null;
  }

  return (
    <div className="flex gap-1">
      {config.controls.enablePause && (
        <button
          onClick={handlePauseToggle}
          className={`p-1 rounded transition-colors ${
            crewEntry.isPaused 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
          }`}
          style={{
            width: `${config.controls.controlSize}px`,
            height: `${config.controls.controlSize}px`,
          }}
          title={crewEntry.isPaused ? 'Resume' : 'Pause'}
        >
          <span className="text-white text-xs">
            {crewEntry.isPaused ? '▶' : '⏸'}
          </span>
        </button>
      )}
      
      {config.controls.enablePriority && (
        <>
          <button
            onClick={handlePriorityDecrease}
            className="p-1 rounded bg-gray-500 hover:bg-gray-600 transition-colors"
            style={{
              width: `${config.controls.controlSize}px`,
              height: `${config.controls.controlSize}px`,
            }}
            title="Decrease Priority"
          >
            <span className="text-white text-xs">−</span>
          </button>
          <button
            onClick={handlePriorityIncrease}
            className="p-1 rounded bg-blue-500 hover:bg-blue-600 transition-colors"
            style={{
              width: `${config.controls.controlSize}px`,
              height: `${config.controls.controlSize}px`,
            }}
            title="Increase Priority"
          >
            <span className="text-white text-xs">+</span>
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Progress bar component
 */
function ProgressBar({ 
  value, 
  maxValue, 
  config, 
  label 
}: { 
  value: number; 
  maxValue: number; 
  config: CrewHUDConfig;
  label: string;
}) {
  const percentage = Math.max(0, Math.min(100, (value / maxValue) * 100));

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs" style={{ color: config.colors.text.secondary }}>
          {label}
        </span>
        <span className="text-xs" style={{ color: config.colors.text.muted }}>
          {Math.round(percentage)}%
        </span>
      </div>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          height: '4px',
          backgroundColor: config.colors.progress.background,
          border: `1px solid ${config.colors.progress.border}`,
        }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: config.colors.progress.fill,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Main Crew Scheduler HUD Card component
 */
export function CrewSchedulerHUDCard({
  crewEntry,
  config,
  metrics,
  onPauseToggle,
  onPriorityAdjust,
  className = '',
  compact = false,
}: CrewSchedulerHUDCardProps) {
  // Determine card border color based on alert level
  const borderColor = useMemo(() => {
    const alertColors = {
      [CREW_ALERT_LEVELS.NONE]: config.colors.text.muted,
      [CREW_ALERT_LEVELS.LOW]: config.colors.alerts.low,
      [CREW_ALERT_LEVELS.MEDIUM]: config.colors.alerts.medium,
      [CREW_ALERT_LEVELS.HIGH]: config.colors.alerts.high,
      [CREW_ALERT_LEVELS.CRITICAL]: config.colors.alerts.critical,
    };
    return alertColors[crewEntry.alertLevel];
  }, [crewEntry.alertLevel, config.colors.alerts, config.colors.text.muted]);

  const cardStyle = useMemo(() => ({
    width: compact ? '100%' : `${config.layout.cardWidth}px`,
    height: compact ? 'auto' : `${config.layout.cardHeight}px`,
    borderColor,
    borderWidth: crewEntry.alertLevel !== CREW_ALERT_LEVELS.NONE ? '2px' : '1px',
    borderRadius: `${config.layout.borderRadius}px`,
    padding: `${config.layout.padding}px`,
    gap: `${config.layout.cardSpacing}px`,
  }), [compact, config.layout, crewEntry.alertLevel, borderColor]);

  return (
    <div
      className={`bg-gray-900 border rounded-lg p-3 transition-all duration-300 hover:border-opacity-80 ${className}`}
      style={cardStyle}
      data-crew-id={crewEntry.crewId}
      data-testid={`crew-${crewEntry.crewId}`}
      data-alert-level={crewEntry.alertLevel}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          {config.layout.showAvatars && crewEntry.avatarUrl ? (
            <img
              src={crewEntry.avatarUrl}
              alt={crewEntry.crewName}
              className="rounded-full"
              style={{
                width: `${config.layout.avatarSize}px`,
                height: `${config.layout.avatarSize}px`,
              }}
            />
          ) : (
            <div
              className="rounded-full bg-gray-700 flex items-center justify-center text-gray-400"
              style={{
                width: `${config.layout.avatarSize}px`,
                height: `${config.layout.avatarSize}px`,
                fontSize: `${config.layout.avatarSize * 0.5}px`,
              }}
            >
              {crewEntry.crewName.charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* Crew info */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white truncate">
              {crewEntry.crewName}
            </h3>
            <div className="flex items-center gap-2">
              <StatusBadge status={crewEntry.status} config={config} />
              <AlertIndicator alertLevel={crewEntry.alertLevel} config={config} />
            </div>
          </div>
        </div>

        {/* Controls */}
        <ControlButtons
          crewEntry={crewEntry}
          config={config}
          onPauseToggle={onPauseToggle}
          onPriorityAdjust={onPriorityAdjust}
        />
      </div>

      {/* Status details */}
      <div className="space-y-2">
        {/* Fatigue progress */}
        <ProgressBar
          value={crewEntry.fatigue}
          maxValue={1.0}
          config={config}
          label="Fatigue"
        />

        {/* Priority score if queued */}
        {crewEntry.priorityScore !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: config.colors.text.secondary }}>
              Priority
            </span>
            <span className="text-xs font-medium" style={{ color: config.colors.text.primary }}>
              {Math.round(crewEntry.priorityScore * 100)}%
            </span>
          </div>
        )}

        {/* Queue position if queued */}
        {crewEntry.queuePosition && (
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: config.colors.text.secondary }}>
              Queue Position
            </span>
            <span className="text-xs font-medium" style={{ color: config.colors.text.primary }}>
              #{crewEntry.queuePosition}
            </span>
          </div>
        )}

        {/* Current activity */}
        {crewEntry.currentActivity && (
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: config.colors.text.secondary }}>
              Activity
            </span>
            <span className="text-xs truncate" style={{ color: config.colors.text.primary }}>
              {crewEntry.currentActivity}
            </span>
          </div>
        )}

        {/* Response time */}
        {crewEntry.responseTime && (
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: config.colors.text.secondary }}>
              Response Time
            </span>
            <span 
              className="text-xs font-medium"
              style={{ 
                color: crewEntry.responseTime > config.thresholds.responseTimeThreshold 
                  ? config.colors.alerts.high 
                  : config.colors.text.primary 
              }}
            >
              {Math.round(crewEntry.responseTime / 1000)}s
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: config.colors.text.muted }}>
            Last updated
          </span>
          <span className="text-xs" style={{ color: config.colors.text.muted }}>
            {new Date(crewEntry.lastUpdate).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CrewSchedulerHUDCard;
