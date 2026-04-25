/**
 * Crew Scheduler HUD - NP-017
 * 
 * Main HUD component for crew status monitoring and management.
 * Provides real-time crew status cards, quick controls, and telemetry
 * integration for the Idle Village crew scheduler system.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import {
  type CrewSchedulerHUDConfig,
  type CrewCardConfig,
  type CrewQuickControlConfig,
  CrewStatusLevel,
  CrewQuickControlType,
  CrewCardDisplayMode,
  DEFAULT_CREW_SCHEDULER_HUD_CONFIG,
  getCrewStatusColor,
  isQuickControlEnabled,
  sortCrewCards,
  filterCrewCards,
} from '../config/crewSchedulerHUDConfig';

const diagnostics = createSandboxDiagnostics('CrewSchedulerHUD', 'hud');

/**
 * Props for CrewSchedulerHUD component
 */
export interface CrewSchedulerHUDProps {
  /** Crew member data */
  crewCards: CrewCardConfig[];
  /** User permissions for quick controls */
  userPermissions: string[];
  /** Custom configuration (uses default if not provided) */
  config?: Partial<CrewSchedulerHUDConfig>;
  /** Event handlers */
  onQuickControl?: (controlType: CrewQuickControlType, crewId: string, payload: Record<string, unknown>) => void;
  onCardClick?: (crewId: string) => void;
  onFilterChange?: (filters: CrewSchedulerHUDConfig['filters']) => void;
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void;
  /** Whether HUD is visible */
  visible?: boolean;
  /** Whether HUD is minimized */
  minimized?: boolean;
  /** Callback for visibility toggle */
  onVisibilityToggle?: (visible: boolean) => void;
  /** Callback for minimize toggle */
  onMinimizeToggle?: (minimized: boolean) => void;
}

/**
 * Individual crew status card component
 */
const CrewStatusCard: React.FC<{
  card: CrewCardConfig;
  config: CrewSchedulerHUDConfig;
  displayMode: CrewCardDisplayMode;
  quickControls: CrewQuickControlConfig[];
  userPermissions: string[];
  onQuickControl?: (type: CrewQuickControlType, crewId: string, payload: Record<string, unknown>) => void;
  onCardClick?: (crewId: string) => void;
}> = ({ card, config, displayMode, quickControls, userPermissions, onQuickControl, onCardClick }) => {
  const statusColor = getCrewStatusColor(card.status, config);
  const fatiguePercentage = card.fatigueLevel * 100;
  
  const handleQuickControl = useCallback((control: CrewQuickControlConfig) => {
    if (isQuickControlEnabled(control, card, userPermissions)) {
      onQuickControl?.(control.type, card.id, control.action.payload);
    }
  }, [card, userPermissions, onQuickControl]);

  const handleCardClick = useCallback(() => {
    onCardClick?.(card.id);
  }, [card.id, onCardClick]);

  if (displayMode === CrewCardDisplayMode.MINIMAL) {
    return (
      <div
        className="crew-card-minimal"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.5rem',
          backgroundColor: config.visual.colors.background,
          border: `1px solid ${config.visual.colors.border}`,
          borderRadius: config.visual.borderRadius.small,
          cursor: 'pointer',
          transition: config.visual.animations.enabled ? 
            `all ${config.visual.animations.duration}ms ${config.visual.animations.easing}` : 'none',
        }}
        onClick={handleCardClick}
      >
        <div
          className="status-indicator"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: statusColor,
            marginRight: '0.5rem',
          }}
        />
        <span style={{
          color: config.visual.colors.foreground,
          fontSize: config.visual.typography.fontSize.small,
          fontWeight: config.visual.typography.fontWeight.normal,
        }}>
          {card.name}
        </span>
      </div>
    );
  }

  if (displayMode === CrewCardDisplayMode.COMPACT) {
    return (
      <div
        className="crew-card-compact"
        style={{
          padding: '0.75rem',
          backgroundColor: config.visual.colors.background,
          border: `1px solid ${config.visual.colors.border}`,
          borderRadius: config.visual.borderRadius.medium,
          cursor: 'pointer',
          transition: config.visual.animations.enabled ? 
            `all ${config.visual.animations.duration}ms ${config.visual.animations.easing}` : 'none',
        }}
        onClick={handleCardClick}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className="status-indicator"
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: statusColor,
                marginRight: '0.75rem',
              }}
            />
            <div>
              <div style={{
                color: config.visual.colors.foreground,
                fontSize: config.visual.typography.fontSize.medium,
                fontWeight: config.visual.typography.fontWeight.bold,
              }}>
                {card.name}
              </div>
              <div style={{
                color: config.visual.colors.foreground,
                fontSize: config.visual.typography.fontSize.small,
                opacity: 0.8,
              }}>
                {card.currentActivity || 'Available'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {quickControls
              .filter(control => isQuickControlEnabled(control, card, userPermissions))
              .slice(0, 2)
              .map(control => (
                <button
                  key={control.type}
                  className="quick-control-button"
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: control.visual.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: config.visual.borderRadius.small,
                    fontSize: config.visual.typography.fontSize.small,
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickControl(control);
                  }}
                  title={control.label}
                >
                  {control.icon}
                </button>
              ))}
          </div>
        </div>
        
        {config.cardDisplay.showFatigueBar && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{
              fontSize: config.visual.typography.fontSize.small,
              color: config.visual.colors.foreground,
              opacity: 0.8,
              marginBottom: '0.25rem',
            }}>
              Fatigue: {fatiguePercentage.toFixed(0)}%
            </div>
            <div style={{
              height: '4px',
              backgroundColor: config.visual.colors.border,
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div
                className="fatigue-bar"
                style={{
                  height: '100%',
                  width: `${fatiguePercentage}%`,
                  backgroundColor: fatiguePercentage > 70 ? 
                    config.visual.colors.warning : config.visual.colors.success,
                  transition: config.visual.animations.enabled ? 
                    `width ${config.visual.animations.duration}ms ${config.visual.animations.easing}` : 'none',
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Detailed mode (default)
  return (
    <div
      className="crew-card-detailed"
      style={{
        padding: '1rem',
        backgroundColor: config.visual.colors.background,
        border: `1px solid ${config.visual.colors.border}`,
        borderRadius: config.visual.borderRadius.medium,
        boxShadow: `0 2px 8px ${config.visual.colors.shadow}`,
        cursor: 'pointer',
        transition: config.visual.animations.enabled ? 
          `all ${config.visual.animations.duration}ms ${config.visual.animations.easing}` : 'none',
      }}
      onClick={handleCardClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div
              className="status-indicator"
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: statusColor,
                marginRight: '0.75rem',
              }}
            />
            <h3 style={{
              margin: 0,
              color: config.visual.colors.foreground,
              fontSize: config.visual.typography.fontSize.large,
              fontWeight: config.visual.typography.fontWeight.bold,
            }}>
              {card.name}
            </h3>
            <div style={{
              marginLeft: '0.5rem',
              padding: '0.125rem 0.5rem',
              backgroundColor: statusColor,
              color: 'white',
              borderRadius: config.visual.borderRadius.small,
              fontSize: config.visual.typography.fontSize.small,
              fontWeight: config.visual.typography.fontWeight.normal,
            }}>
              {card.status}
            </div>
          </div>
          
          {card.currentActivity && (
            <div style={{
              color: config.visual.colors.foreground,
              fontSize: config.visual.typography.fontSize.medium,
              marginBottom: '0.5rem',
            }}>
              📍 {card.currentActivity}
            </div>
          )}
          
          {config.cardDisplay.showSpecializations && card.specializations.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{
                fontSize: config.visual.typography.fontSize.small,
                color: config.visual.colors.foreground,
                opacity: 0.8,
                marginBottom: '0.25rem',
              }}>
                Specializations:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {card.specializations.map(spec => (
                  <span
                    key={spec}
                    className="specialization-tag"
                    style={{
                      padding: '0.125rem 0.375rem',
                      backgroundColor: config.visual.colors.accent,
                      color: 'white',
                      borderRadius: config.visual.borderRadius.small,
                      fontSize: config.visual.typography.fontSize.small,
                    }}
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {config.cardDisplay.showFatigueBar && (
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: config.visual.typography.fontSize.small,
                color: config.visual.colors.foreground,
                opacity: 0.8,
                marginBottom: '0.25rem',
              }}>
                <span>Fatigue Level</span>
                <span>{fatiguePercentage.toFixed(0)}%</span>
              </div>
              <div style={{
                height: '6px',
                backgroundColor: config.visual.colors.border,
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div
                  className="fatigue-bar"
                  style={{
                    height: '100%',
                    width: `${fatiguePercentage}%`,
                    backgroundColor: fatiguePercentage > 70 ? 
                      config.visual.colors.warning : 
                      fatiguePercentage > 40 ? 
                      config.visual.colors.accent : 
                      config.visual.colors.success,
                    transition: config.visual.animations.enabled ? 
                      `width ${config.visual.animations.duration}ms ${config.visual.animations.easing}` : 'none',
                  }}
                />
              </div>
            </div>
          )}
          
          {config.cardDisplay.showPriorityScore && (
            <div style={{
              fontSize: config.visual.typography.fontSize.small,
              color: config.visual.colors.foreground,
              opacity: 0.8,
            }}>
              Priority Score: {card.priorityScore.toFixed(1)}
            </div>
          )}
          
          {config.cardDisplay.showTimeUntilAvailable && card.timeUntilAvailable && (
            <div style={{
              fontSize: config.visual.typography.fontSize.small,
              color: config.visual.colors.foreground,
              opacity: 0.8,
            }}>
              Available in: {formatTime(card.timeUntilAvailable)}
            </div>
          )}
          
          {config.cardDisplay.showPerformance && (
            <div style={{
              marginTop: '0.5rem',
              paddingTop: '0.5rem',
              borderTop: `1px solid ${config.visual.colors.border}`,
              fontSize: config.visual.typography.fontSize.small,
              color: config.visual.colors.foreground,
              opacity: 0.8,
            }}>
              <div>Completed: {card.performance.assignmentsCompleted}</div>
              <div>Success Rate: {(card.performance.successRate * 100).toFixed(1)}%</div>
              <div>Avg Time: {formatTime(card.performance.averageCompletionTime)}</div>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginLeft: '1rem' }}>
          {quickControls
            .filter(control => isQuickControlEnabled(control, card, userPermissions))
            .map(control => (
              <button
                key={control.type}
                className="quick-control-button"
                style={{
                  padding: control.visual.size === 'large' ? '0.5rem 1rem' : 
                           control.visual.size === 'medium' ? '0.375rem 0.75rem' : 
                           '0.25rem 0.5rem',
                  backgroundColor: control.visual.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: config.visual.borderRadius.small,
                  fontSize: config.visual.typography.fontSize.small,
                  cursor: 'pointer',
                  opacity: control.enabled ? 1 : 0.5,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickControl(control);
                }}
                title={control.label}
                disabled={!control.enabled}
              >
                {control.icon} {control.visual.size !== 'small' && control.label}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Main CrewSchedulerHUD component
 */
export const CrewSchedulerHUD: React.FC<CrewSchedulerHUDProps> = ({
  crewCards,
  userPermissions,
  config: customConfig,
  onQuickControl,
  onCardClick,
  onFilterChange,
  onSortChange,
  visible = true,
  minimized = false,
  onVisibilityToggle,
  onMinimizeToggle,
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_CREW_SCHEDULER_HUD_CONFIG,
    ...customConfig,
  }), [customConfig]);

  const [filters, setFilters] = useState(config.filters);
  const [sortField, setSortField] = useState(config.sorting.defaultField);
  const [sortDirection, setSortDirection] = useState(config.sorting.defaultDirection);
  const [displayMode, setDisplayMode] = useState(config.cardDisplay.defaultMode);
  
  const hudRef = useRef<HTMLDivElement>(null);

  // Filter and sort crew cards
  const processedCrewCards = useMemo(() => {
    const filtered = filterCrewCards(crewCards, filters);
    const sorted = sortCrewCards(filtered, sortField, sortDirection);
    return sorted.slice(0, config.performance.maxCrewCards);
  }, [crewCards, filters, sortField, sortDirection, config.performance.maxCrewCards]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  }, [onFilterChange]);

  // Handle sort changes
  const handleSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    onSortChange?.(field, direction);
  }, [onSortChange]);

  // Handle quick control actions
  const handleQuickControl = useCallback((
    controlType: CrewQuickControlType,
    crewId: string,
    payload: Record<string, unknown>
  ) => {
    diagnostics.log('Quick control activated', { controlType, crewId, payload });
    onQuickControl?.(controlType, crewId, payload);
  }, [onQuickControl]);

  // Handle card clicks
  const handleCardClick = useCallback((crewId: string) => {
    diagnostics.log('Crew card clicked', { crewId });
    onCardClick?.(crewId);
  }, [onCardClick]);

  // Toggle visibility
  const toggleVisibility = useCallback(() => {
    onVisibilityToggle?.(!visible);
  }, [visible, onVisibilityToggle]);

  // Toggle minimize
  const toggleMinimize = useCallback(() => {
    onMinimizeToggle?.(!minimized);
  }, [minimized, onMinimizeToggle]);

  // Position HUD based on configuration
  const hudStyle: React.CSSProperties = useMemo(() => {
    const { position, dimensions } = config.layout;
    
    let left: number | undefined;
    let right: number | undefined;
    let top: number | undefined;
    let bottom: number | undefined;

    switch (position.anchor) {
      case 'top-left':
        left = position.x;
        top = position.y;
        break;
      case 'top-right':
        right = position.x;
        top = position.y;
        break;
      case 'bottom-left':
        left = position.x;
        bottom = position.y;
        break;
      case 'bottom-right':
        right = position.x;
        bottom = position.y;
        break;
      case 'center':
        left = `calc(50% - ${dimensions.width / 2}px)`;
        top = `calc(50% - ${dimensions.height / 2}px)`;
        break;
    }

    return {
      position: 'fixed',
      left,
      right,
      top,
      bottom,
      width: minimized ? 'auto' : `${dimensions.width}px`,
      height: minimized ? 'auto' : `${dimensions.height}px`,
      minWidth: minimized ? 'auto' : `${dimensions.minWidth}px`,
      minHeight: minimized ? 'auto' : `${dimensions.minHeight}px`,
      maxWidth: minimized ? 'auto' : `${dimensions.maxWidth}px`,
      maxHeight: minimized ? 'auto' : `${dimensions.maxHeight}px`,
      backgroundColor: config.visual.colors.background,
      border: `1px solid ${config.visual.colors.border}`,
      borderRadius: config.visual.borderRadius.large,
      boxShadow: `0 4px 16px ${config.visual.colors.shadow}`,
      zIndex: 1000,
      display: visible ? 'block' : 'none',
      overflow: 'hidden',
      transition: config.visual.animations.enabled ? 
        `all ${config.visual.animations.duration}ms ${config.visual.animations.easing}` : 'none',
    };
  }, [config, visible, minimized]);

  if (!visible) {
    return null;
  }

  return (
    <div
      ref={hudRef}
      className="crew-scheduler-hud"
      style={hudStyle}
    >
      {/* Header */}
      <div
        className="hud-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: config.visual.colors.background,
          borderBottom: `1px solid ${config.visual.colors.border}`,
        }}
      >
        <h2 style={{
          margin: 0,
          color: config.visual.colors.foreground,
          fontSize: config.visual.typography.fontSize.large,
          fontWeight: config.visual.typography.fontWeight.bold,
        }}>
          Crew Scheduler {processedCrewCards.length > 0 && `(${processedCrewCards.length})`}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="display-mode-toggle"
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: config.visual.colors.accent,
              color: 'white',
              border: 'none',
              borderRadius: config.visual.borderRadius.small,
              fontSize: config.visual.typography.fontSize.small,
              cursor: 'pointer',
            }}
            onClick={() => setDisplayMode(
              displayMode === CrewCardDisplayMode.DETAILED ? CrewCardDisplayMode.COMPACT :
              displayMode === CrewCardDisplayMode.COMPACT ? CrewCardDisplayMode.MINIMAL :
              CrewCardDisplayMode.DETAILED
            )}
          >
            {displayMode === CrewCardDisplayMode.DETAILED ? 'Detailed' :
             displayMode === CrewCardDisplayMode.COMPACT ? 'Compact' : 'Minimal'}
          </button>
          <button
            className="minimize-toggle"
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: config.visual.colors.accent,
              color: 'white',
              border: 'none',
              borderRadius: config.visual.borderRadius.small,
              fontSize: config.visual.typography.fontSize.small,
              cursor: 'pointer',
            }}
            onClick={toggleMinimize}
          >
            {minimized ? '📊' : '📉'}
          </button>
          <button
            className="close-toggle"
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: config.visual.colors.danger,
              color: 'white',
              border: 'none',
              borderRadius: config.visual.borderRadius.small,
              fontSize: config.visual.typography.fontSize.small,
              cursor: 'pointer',
            }}
            onClick={toggleVisibility}
          >
            ✕
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Controls Bar */}
          <div
            className="hud-controls"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: config.visual.colors.background,
              borderBottom: `1px solid ${config.visual.colors.border}`,
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                value={sortField}
                onChange={(e) => handleSortChange(e.target.value, sortDirection)}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: config.visual.colors.background,
                  color: config.visual.colors.foreground,
                  border: `1px solid ${config.visual.colors.border}`,
                  borderRadius: config.visual.borderRadius.small,
                  fontSize: config.visual.typography.fontSize.small,
                }}
              >
                {config.sorting.availableFields.map(field => (
                  <option key={field} value={field}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc')}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: config.visual.colors.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: config.visual.borderRadius.small,
                  fontSize: config.visual.typography.fontSize.small,
                  cursor: 'pointer',
                }}
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Crew Cards Container */}
          <div
            className="crew-cards-container"
            style={{
              padding: '0.5rem',
              overflowY: 'auto',
              maxHeight: 'calc(100% - 120px)',
            }}
          >
            {processedCrewCards.length === 0 ? (
              <div
                className="empty-state"
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: config.visual.colors.foreground,
                  opacity: 0.6,
                }}
              >
                <div style={{ fontSize: config.visual.typography.fontSize.large, marginBottom: '0.5rem' }}>
                  👥
                </div>
                <div>No crew members available</div>
              </div>
            ) : (
              <div
                className="crew-cards-list"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: config.layout.cardLayout.spacing,
                }}
              >
                {processedCrewCards.map((card, index) => (
                  <CrewStatusCard
                    key={card.id}
                    card={card}
                    config={config}
                    displayMode={displayMode}
                    quickControls={config.quickControls}
                    userPermissions={userPermissions}
                    onQuickControl={handleQuickControl}
                    onCardClick={handleCardClick}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Utility function to format time
 */
function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export default CrewSchedulerHUD;
