/**
 * Crew Quick Controls - NP-017
 * 
 * Quick action controls for crew management in the HUD.
 * Provides rapid access to common crew operations like assignment,
 * rest, specialization, and emergency actions.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useCallback, useMemo } from 'react';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import {
  type CrewQuickControlConfig,
  type CrewCardConfig,
  type CrewSchedulerHUDConfig,
  CrewQuickControlType,
  CrewStatusLevel,
  isQuickControlEnabled,
} from '../config/crewSchedulerHUDConfig';

const diagnostics = createSandboxDiagnostics('CrewQuickControls', 'controls');

/**
 * Props for CrewQuickControls component
 */
export interface CrewQuickControlsProps {
  /** Crew member to control */
  crewCard: CrewCardConfig;
  /** HUD configuration */
  config: CrewSchedulerHUDConfig;
  /** User permissions */
  userPermissions: string[];
  /** Available activities for assignment */
  availableActivities?: Array<{
    id: string;
    name: string;
    requiresSpecialization?: string[];
  }>;
  /** Event handlers */
  onControlAction?: (controlType: CrewQuickControlType, crewId: string, payload: Record<string, unknown>) => void;
  /** Control layout */
  layout?: 'horizontal' | 'vertical' | 'grid';
  /** Show labels on controls */
  showLabels?: boolean;
  /** Control size variant */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Activity assignment modal component
 */
const ActivityAssignmentModal: React.FC<{
  crewCard: CrewCardConfig;
  availableActivities: Array<{
    id: string;
    name: string;
    requiresSpecialization?: string[];
  }>;
  onAssign: (activityId: string) => void;
  onCancel: () => void;
  config: CrewSchedulerHUDConfig;
}> = ({ crewCard, availableActivities, onAssign, onCancel, config }) => {
  const [selectedActivity, setSelectedActivity] = useState<string>('');

  const filteredActivities = useMemo(() => {
    return availableActivities.filter(activity => {
      if (!activity.requiresSpecialization || activity.requiresSpecialization.length === 0) {
        return true;
      }
      return activity.requiresSpecialization.some(spec =>
        crewCard.specializations.includes(spec)
      );
    });
  }, [availableActivities, crewCard.specializations]);

  const handleAssign = useCallback(() => {
    if (selectedActivity) {
      onAssign(selectedActivity);
    }
  }, [selectedActivity, onAssign]);

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: config.visual.colors.background,
          border: `1px solid ${config.visual.colors.border}`,
          borderRadius: config.visual.borderRadius.large,
          padding: '1.5rem',
          minWidth: '300px',
          maxWidth: '500px',
          boxShadow: `0 8px 32px ${config.visual.colors.shadow}`,
        }}
      >
        <h3 style={{
          margin: '0 0 1rem 0',
          color: config.visual.colors.foreground,
          fontSize: config.visual.typography.fontSize.large,
          fontWeight: config.visual.typography.fontWeight.bold,
        }}>
          Assign Activity to {crewCard.name}
        </h3>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: config.visual.colors.foreground,
            fontSize: config.visual.typography.fontSize.medium,
          }}>
            Select Activity:
          </label>
          <select
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: config.visual.colors.background,
              color: config.visual.colors.foreground,
              border: `1px solid ${config.visual.colors.border}`,
              borderRadius: config.visual.borderRadius.small,
              fontSize: config.visual.typography.fontSize.medium,
            }}
          >
            <option value="">Choose an activity...</option>
            {filteredActivities.map(activity => (
              <option key={activity.id} value={activity.id}>
                {activity.name}
                {activity.requiresSpecialization && activity.requiresSpecialization.length > 0 && 
                 ` (${activity.requiresSpecialization.join(', ')})`
                }
              </option>
            ))}
          </select>
        </div>

        {crewCard.specializations.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              fontSize: config.visual.typography.fontSize.small,
              color: config.visual.colors.foreground,
              opacity: 0.8,
              marginBottom: '0.25rem',
            }}>
              Crew Specializations:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {crewCard.specializations.map(spec => (
                <span
                  key={spec}
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

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: config.visual.colors.border,
              color: config.visual.colors.foreground,
              border: 'none',
              borderRadius: config.visual.borderRadius.small,
              fontSize: config.visual.typography.fontSize.medium,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedActivity}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedActivity ? config.visual.colors.accent : config.visual.colors.border,
              color: 'white',
              border: 'none',
              borderRadius: config.visual.borderRadius.small,
              fontSize: config.visual.typography.fontSize.medium,
              cursor: selectedActivity ? 'pointer' : 'not-allowed',
              opacity: selectedActivity ? 1 : 0.5,
            }}
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Fatigue management modal component
 */
const FatigueManagementModal: React.FC<{
  crewCard: CrewCardConfig;
  onRest: (duration: number) => void;
  onCancel: () => void;
  config: CrewSchedulerHUDConfig;
}> = ({ crewCard, onRest, onCancel, config }) => {
  const [restDuration, setRestDuration] = useState<number>(30); // minutes

  const handleRest = useCallback(() => {
    onRest(restDuration * 60 * 1000); // Convert to milliseconds
  }, [restDuration, onRest]);

  const fatiguePercentage = crewCard.fatigueLevel * 100;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: config.visual.colors.background,
          border: `1px solid ${config.visual.colors.border}`,
          borderRadius: config.visual.borderRadius.large,
          padding: '1.5rem',
          minWidth: '300px',
          boxShadow: `0 8px 32px ${config.visual.colors.shadow}`,
        }}
      >
        <h3 style={{
          margin: '0 0 1rem 0',
          color: config.visual.colors.foreground,
          fontSize: config.visual.typography.fontSize.large,
          fontWeight: config.visual.typography.fontWeight.bold,
        }}>
          Manage Fatigue for {crewCard.name}
        </h3>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
            color: config.visual.colors.foreground,
            fontSize: config.visual.typography.fontSize.medium,
          }}>
            <span>Current Fatigue:</span>
            <span style={{
              color: fatiguePercentage > 70 ? config.visual.colors.warning : 
                     fatiguePercentage > 40 ? config.visual.colors.accent : 
                     config.visual.colors.success,
            }}>
              {fatiguePercentage.toFixed(0)}%
            </span>
          </div>
          <div style={{
            height: '8px',
            backgroundColor: config.visual.colors.border,
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '1rem',
          }}>
            <div
              style={{
                height: '100%',
                width: `${fatiguePercentage}%`,
                backgroundColor: fatiguePercentage > 70 ? config.visual.colors.warning : 
                               fatiguePercentage > 40 ? config.visual.colors.accent : 
                               config.visual.colors.success,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: config.visual.colors.foreground,
            fontSize: config.visual.typography.fontSize.medium,
          }}>
            Rest Duration (minutes):
          </label>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={restDuration}
            onChange={(e) => setRestDuration(Number(e.target.value))}
            style={{ width: '100%', marginBottom: '0.5rem' }}
          />
          <div style={{
            textAlign: 'center',
            color: config.visual.colors.foreground,
            fontSize: config.visual.typography.fontSize.medium,
          }}>
            {restDuration} minutes
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: config.visual.colors.border,
              color: config.visual.colors.foreground,
              border: 'none',
              borderRadius: config.visual.borderRadius.small,
              fontSize: config.visual.typography.fontSize.medium,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleRest}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: config.visual.colors.success,
              color: 'white',
              border: 'none',
              borderRadius: config.visual.borderRadius.small,
              fontSize: config.visual.typography.fontSize.medium,
              cursor: 'pointer',
            }}
          >
            Start Rest
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual quick control button
 */
const QuickControlButton: React.FC<{
  control: CrewQuickControlConfig;
  crewCard: CrewCardConfig;
  config: CrewSchedulerHUDConfig;
  showLabel: boolean;
  size: 'small' | 'medium' | 'large';
  onAction: (controlType: CrewQuickControlType, payload: Record<string, unknown>) => void;
}> = ({ control, crewCard, config, showLabel, size, onAction }) => {
  const [showModal, setShowModal] = useState(false);
  const isEnabled = isQuickControlEnabled(control, crewCard, ['crew.assign', 'crew.rest', 'crew.recall']);

  const handleClick = useCallback(() => {
    if (!isEnabled) return;

    switch (control.type) {
      case CrewQuickControlType.ASSIGN_ACTIVITY:
        setShowModal(true);
        break;
      case CrewQuickControlType.REST_RESIDENT:
        setShowModal(true);
        break;
      default:
        onAction(control.type, control.action.payload);
    }
  }, [control.type, isEnabled, onAction]);

  const handleModalAction = useCallback((payload: Record<string, unknown>) => {
    setShowModal(false);
    onAction(control.type, payload);
  }, [control.type, onAction]);

  const getButtonStyle = useCallback((): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      backgroundColor: control.visual.color,
      color: 'white',
      border: 'none',
      borderRadius: config.visual.borderRadius.small,
      cursor: isEnabled ? 'pointer' : 'not-allowed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.25rem',
      transition: config.visual.animations.enabled ? 
        `all ${config.visual.animations.duration}ms ${config.visual.animations.easing}` : 'none',
      opacity: isEnabled ? 1 : 0.5,
      fontSize: config.visual.typography.fontSize.small,
    };

    switch (size) {
      case 'small':
        return {
          ...baseStyle,
          padding: '0.25rem 0.5rem',
          fontSize: config.visual.typography.fontSize.small,
        };
      case 'medium':
        return {
          ...baseStyle,
          padding: '0.375rem 0.75rem',
          fontSize: config.visual.typography.fontSize.medium,
        };
      case 'large':
        return {
          ...baseStyle,
          padding: '0.5rem 1rem',
          fontSize: config.visual.typography.fontSize.large,
        };
      default:
        return baseStyle;
    }
  }, [control, config, isEnabled, size]);

  return (
    <>
      <button
        className="quick-control-button"
        style={getButtonStyle()}
        onClick={handleClick}
        disabled={!isEnabled}
        title={`${control.label} - ${isEnabled ? 'Available' : 'Not available'}`}
      >
        <span className="control-icon">{control.icon}</span>
        {showLabel && size !== 'small' && (
          <span className="control-label">{control.label}</span>
        )}
      </button>

      {showModal && control.type === CrewQuickControlType.ASSIGN_ACTIVITY && (
        <ActivityAssignmentModal
          crewCard={crewCard}
          availableActivities={[]} // Will be passed from parent
          onAssign={(activityId) => handleModalAction({ activityId })}
          onCancel={() => setShowModal(false)}
          config={config}
        />
      )}

      {showModal && control.type === CrewQuickControlType.REST_RESIDENT && (
        <FatigueManagementModal
          crewCard={crewCard}
          onRest={(duration) => handleModalAction({ duration })}
          onCancel={() => setShowModal(false)}
          config={config}
        />
      )}
    </>
  );
};

/**
 * Main CrewQuickControls component
 */
export const CrewQuickControls: React.FC<CrewQuickControlsProps> = ({
  crewCard,
  config,
  userPermissions,
  availableActivities = [],
  onControlAction,
  layout = 'horizontal',
  showLabels = true,
  size = 'medium',
}) => {
  const enabledControls = useMemo(() => {
    return config.quickControls.filter(control =>
      isQuickControlEnabled(control, crewCard, userPermissions)
    );
  }, [config.quickControls, crewCard, userPermissions]);

  const handleControlAction = useCallback((
    controlType: CrewQuickControlType,
    payload: Record<string, unknown>
  ) => {
    diagnostics.log('Quick control action triggered', {
      controlType,
      crewId: crewCard.id,
      payload,
    });
    onControlAction?.(controlType, crewCard.id, payload);
  }, [crewCard.id, onControlAction]);

  const getLayoutStyle = useCallback((): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: 'flex',
      gap: config.layout.cardLayout.spacing,
    };

    switch (layout) {
      case 'horizontal':
        return {
          ...baseStyle,
          flexDirection: 'row',
          flexWrap: 'wrap',
        };
      case 'vertical':
        return {
          ...baseStyle,
          flexDirection: 'column',
        };
      case 'grid':
        return {
          ...baseStyle,
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${size === 'small' ? '80px' : size === 'medium' ? '120px' : '160px'}, 1fr))`,
        };
      default:
        return baseStyle;
    }
  }, [config, layout, size]);

  if (enabledControls.length === 0) {
    return (
      <div
        className="no-controls-available"
        style={{
          padding: '0.5rem',
          color: config.visual.colors.foreground,
          opacity: 0.6,
          fontSize: config.visual.typography.fontSize.small,
          fontStyle: 'italic',
        }}
      >
        No controls available
      </div>
    );
  }

  return (
    <div
      className="crew-quick-controls"
      style={getLayoutStyle()}
    >
      {enabledControls.map(control => (
        <QuickControlButton
          key={control.type}
          control={control}
          crewCard={crewCard}
          config={config}
          showLabel={showLabels}
          size={size}
          onAction={handleControlAction}
        />
      ))}
    </div>
  );
};

export default CrewQuickControls;
