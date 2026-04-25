/**
 * Activity Slot Telemetry Integration Examples
 * 
 * Demonstrates how to integrate the activity slot telemetry system
 * with existing Idle Village components and provides usage examples.
 * 
 * @since NP-016
 */

import React, { useCallback } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';
import { useActivitySlotTelemetry, useDragTelemetry, useValidationTelemetry } from '../hooks/useActivitySlotTelemetry';

/**
 * Example: Enhanced Activity Slot Component with Telemetry
 * 
 * This example shows how to integrate telemetry into an existing activity slot component
 * without breaking existing functionality.
 */
export interface TelemetryActivitySlotProps {
  slotId: string;
  activity: ActivityDefinition;
  residents: ResidentState[];
  maxOccupants: number;
  onResidentAssign?: (resident: ResidentState) => void;
  onResidentRemove?: (resident: ResidentState) => void;
  onValidationFailure?: (reason: string) => void;
}

export const TelemetryActivitySlot: React.FC<TelemetryActivitySlotProps> = ({
  slotId,
  activity,
  residents,
  maxOccupants,
  onResidentAssign,
  onResidentRemove,
  onValidationFailure,
}) => {
  // Initialize telemetry with configuration
  const telemetry = useActivitySlotTelemetry({
    config: {
      enabled: true,
      eventTypes: ['drag_start', 'drag_complete', 'drag_cancel', 'resident_assign', 'assign_failure', 'validation_check'],
      samplingRate: 1.0,
      includeDetailedPayloads: true,
    },
    enablePerformanceMonitoring: true,
    defaultContext: {
      location: 'main_map',
      inputMethod: 'mouse',
      isRepeatOperation: false,
    },
  });

  // Specialized drag telemetry for this slot
  const dragTelemetry = useDragTelemetry({
    slotId,
    activity,
    onDragStart: (resident, sourceLocation) => {
      console.log(`Drag started: ${resident.displayName} from ${sourceLocation.type}`);
    },
    onDragComplete: (resident, targetSlot, validationResult) => {
      if (validationResult.isValid) {
        onResidentAssign?.(resident);
      } else {
        onValidationFailure?.(validationResult.message || 'Assignment failed');
      }
    },
    onDragCancel: (resident, cancelReason) => {
      console.log(`Drag cancelled: ${resident.displayName} - ${cancelReason}`);
    },
  });

  // Validation telemetry for this slot
  const validationTelemetry = useValidationTelemetry({
    slotId,
    activity,
    enableDetailedTracking: true,
  });

  // Handle drag start
  const handleDragStart = useCallback((
    resident: ResidentState,
    sourceLocation: { type: string; slotId?: string },
    position: { x: number; y: number }
  ) => {
    dragTelemetry.handleDragStart(resident, sourceLocation, position);
  }, [dragTelemetry]);

  // Handle drag over (validation)
  const handleDragOver = useCallback((
    resident: ResidentState,
    validationResult: DropValidationResult
  ) => {
    validationTelemetry.recordValidation(resident, validationResult, {
      checkType: 'pre_assign',
      validationRules: ['availability', 'fatigue', 'capacity'],
      strictMode: false,
    });
  }, [validationTelemetry]);

  // Handle drop
  const handleDrop = useCallback((
    resident: ResidentState,
    validationResult: DropValidationResult
  ) => {
    const targetSlot = {
      slotId,
      previousOccupants: residents.length,
      newOccupants: residents.length + (validationResult.isValid ? 1 : 0),
      wasEmpty: residents.length === 0,
    };

    dragTelemetry.handleDragComplete(resident, targetSlot, validationResult);
  }, [dragTelemetry, residents.length]);

  // Handle resident removal
  const handleResidentRemove = useCallback((resident: ResidentState) => {
    const previousSlotState = {
      occupants: residents.length,
      residentIds: residents.map(r => r.id),
      wasLocked: false,
    };

    const newSlotState = {
      occupants: residents.length - 1,
      residentIds: residents.filter(r => r.id !== resident.id).map(r => r.id),
      isLocked: false,
    };

    telemetry.recordResidentAssign(
      slotId,
      activity,
      resident,
      'drag_out',
      previousSlotState,
      newSlotState
    );

    onResidentRemove?.(resident);
  }, [telemetry, slotId, activity, residents]);

  // Render the slot UI (simplified example)
  return (
    <div className="activity-slot" data-slot-id={slotId}>
      <div className="slot-header">
        <h3>{activity.name}</h3>
        <span className="occupancy">{residents.length}/{maxOccupants}</span>
      </div>
      
      <div className="slot-content">
        {residents.map(resident => (
          <div
            key={resident.id}
            className="resident-card"
            draggable
            onDragStart={(e) => {
              const position = { x: e.clientX, y: e.clientY };
              handleDragStart(resident, { type: 'activity_slot', slotId }, position);
            }}
            onDoubleClick={() => handleResidentRemove(resident)}
          >
            <span className="resident-name">{resident.displayName}</span>
            <span className="resident-status">{resident.status}</span>
          </div>
        ))}
        
        {residents.length < maxOccupants && (
          <div
            className="empty-slot"
            onDragOver={(e) => {
              e.preventDefault();
              // Would validate here and call handleDragOver
            }}
            onDrop={(e) => {
              e.preventDefault();
              // Would get resident from drag data and call handleDrop
            }}
          >
            Drop resident here
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Example: Telemetry Dashboard Component
 * 
 * Shows how to display telemetry data and insights
 */
export interface TelemetryDashboardProps {
  slotId: string;
  activity: ActivityDefinition;
}

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({
  slotId,
  activity,
}) => {
  const telemetry = useActivitySlotTelemetry();

  // Get recent events for this slot
  const recentEvents = telemetry.getEventsBySlot(slotId).slice(-10);
  
  // Get performance metrics
  const performanceEvents = telemetry.getEventsByType('performance_metric');
  const validationTimes = performanceEvents
    .filter(e => (e.payload as any).metricType === 'validation_time')
    .map(e => (e.payload as any).value);

  const averageValidationTime = validationTimes.length > 0
    ? validationTimes.reduce((a, b) => a + b, 0) / validationTimes.length
    : 0;

  // Get error rate
  const totalEvents = telemetry.getEventsBySlot(slotId).length;
  const errorEvents = telemetry.getEventsBySlot(slotId).filter(e => 
    e.type === 'assign_failure' || e.type === 'drag_cancel'
  );
  const errorRate = totalEvents > 0 ? errorEvents.length / totalEvents : 0;

  return (
    <div className="telemetry-dashboard">
      <h3>Telemetry Dashboard - {activity.name}</h3>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Performance</h4>
          <div className="metric-value">
            Avg Validation: {averageValidationTime.toFixed(2)}ms
          </div>
        </div>
        
        <div className="metric-card">
          <h4>Error Rate</h4>
          <div className={`metric-value ${errorRate > 0.1 ? 'error' : 'success'}`}>
            {(errorRate * 100).toFixed(1)}%
          </div>
        </div>
        
        <div className="metric-card">
          <h4>Total Events</h4>
          <div className="metric-value">{totalEvents}</div>
        </div>
        
        <div className="metric-card">
          <h4>Session ID</h4>
          <div className="metric-value small">{telemetry.getSessionId()}</div>
        </div>
      </div>
      
      <div className="recent-events">
        <h4>Recent Events</h4>
        <ul>
          {recentEvents.map(event => (
            <li key={event.id}>
              <span className="event-type">{event.type}</span>
              <span className="event-time">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="actions">
        <button onClick={() => telemetry.clearEvents()}>
          Clear Events
        </button>
        <button onClick={() => {
          const data = telemetry.exportEvents();
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `telemetry-${slotId}-${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }}>
          Export Data
        </button>
      </div>
    </div>
  );
};

/**
 * Example: Batch Operation with Telemetry
 * 
 * Shows how to track batch operations like assigning multiple residents
 */
export interface BatchAssignProps {
  residents: ResidentState[];
  targetSlots: Array<{ slotId: string; activity: ActivityDefinition }>;
  onBatchComplete?: (results: { successful: number; failed: number }) => void;
}

export const BatchAssignWithTelemetry: React.FC<BatchAssignProps> = ({
  residents,
  targetSlots,
  onBatchComplete,
}) => {
  const telemetry = useActivitySlotTelemetry();

  const handleBatchAssign = useCallback(async () => {
    const startTime = Date.now();
    let successful = 0;
    let failed = 0;

    // Record batch start
    telemetry.recordPerformanceMetric(
      'batch_operation',
      targetSlots[0]?.activity || {} as ActivityDefinition,
      'batch_operation',
      0,
      'ms',
      {
        operation: 'bulk_assign',
        component: 'activity_slot',
        userInteraction: true,
        systemLoad: 'low',
      }
    );

    // Process each resident-slot assignment
    for (const resident of residents) {
      for (const { slotId, activity } of targetSlots) {
        try {
          // Simulate validation and assignment
          const validationResult = { isValid: Math.random() > 0.2 }; // 80% success rate
          
          if (validationResult.isValid) {
            telemetry.recordResidentAssign(
              slotId,
              activity,
              resident,
              'batch_operation',
              { occupants: 0, residentIds: [], wasLocked: false },
              { occupants: 1, residentIds: [resident.id], isLocked: false },
              { processingTime: Math.random() * 50, validationTime: Math.random() * 20, uiUpdateTime: Math.random() * 10 }
            );
            successful++;
          } else {
            telemetry.recordAssignFailure(
              slotId,
              activity,
              resident,
              'Random failure',
              'batch_validation',
              { slotId, currentOccupants: 0, maxOccupants: 1, isLocked: false },
              { validationTime: Math.random() * 20, errorMessage: 'Random failure', isRetryable: true }
            );
            failed++;
          }
        } catch (error) {
          failed++;
          console.error('Batch assignment error:', error);
        }
      }
    }

    // Record batch completion
    const totalDuration = Date.now() - startTime;
    telemetry.recordPerformanceMetric(
      'batch_operation',
      targetSlots[0]?.activity || {} as ActivityDefinition,
      'batch_operation',
      totalDuration,
      'ms',
      {
        operation: 'bulk_assign_complete',
        component: 'activity_slot',
        userInteraction: false,
        systemLoad: 'low',
      }
    );

    onBatchComplete?.({ successful, failed });
  }, [telemetry, residents, targetSlots, onBatchComplete]);

  return (
    <div className="batch-assign">
      <h3>Batch Assignment</h3>
      <p>Assign {residents.length} residents to {targetSlots.length} slots</p>
      <button onClick={handleBatchAssign}>
        Start Batch Assignment
      </button>
    </div>
  );
};

/**
 * Example: Performance Monitoring Hook
 * 
 * Shows how to use the performance monitoring capabilities
 */
export const usePerformanceMonitoring = (slotId: string, activity: ActivityDefinition) => {
  const telemetry = useActivitySlotTelemetry();

  const monitorOperation = useCallback(async (
    operationName: string,
    operation: () => Promise<void> | void
  ) => {
    const startTime = performance.now();
    
    try {
      await operation();
      
      const duration = performance.now() - startTime;
      telemetry.recordPerformanceMetric(
        slotId,
        activity,
        operationName as any,
        duration,
        'ms',
        {
          operation: operationName,
          component: 'activity_slot',
          userInteraction: true,
          systemLoad: 'low',
        }
      );
    } catch (error) {
      const duration = performance.now() - startTime;
      telemetry.recordPerformanceMetric(
        slotId,
        activity,
        `${operationName}_error` as any,
        duration,
        'ms',
        {
          operation: `${operationName}_error`,
          component: 'activity_slot',
          userInteraction: true,
          systemLoad: 'low',
        }
      );
      throw error;
    }
  }, [telemetry, slotId, activity]);

  return { monitorOperation };
};

/**
 * Example: Real-time Telemetry Monitor
 * 
 * Component that displays real-time telemetry updates
 */
export const RealTimeTelemetryMonitor: React.FC = () => {
  const telemetry = useActivitySlotTelemetry();
  const [events, setEvents] = React.useState(telemetry.getEvents());

  // Update events every second
  React.useEffect(() => {
    const interval = setInterval(() => {
      setEvents(telemetry.getEvents());
    }, 1000);

    return () => clearInterval(interval);
  }, [telemetry]);

  const recentEvents = events.slice(-20);

  return (
    <div className="real-time-monitor">
      <h3>Real-time Telemetry Monitor</h3>
      <div className="monitor-stats">
        <div>Total Events: {events.length}</div>
        <div>Session: {telemetry.getSessionId()}</div>
        <div>Last Update: {new Date().toLocaleTimeString()}</div>
      </div>
      
      <div className="event-stream">
        {recentEvents.map(event => (
          <div key={event.id} className="event-item">
            <span className="event-time">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
            <span className="event-type">{event.type}</span>
            <span className="event-slot">{event.slotId}</span>
            <span className="event-context">{event.context.interactionType}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Usage Examples Documentation
 */

/**
 * Basic Usage Example:
 * 
 * ```typescript
 * import { useActivitySlotTelemetry } from '@/ui/idleVillage/telemetry/hooks/useActivitySlotTelemetry';
 * 
 * function MyComponent() {
 *   const telemetry = useActivitySlotTelemetry({
 *     config: {
 *       enabled: true,
 *       samplingRate: 1.0,
 *     },
 *     enablePerformanceMonitoring: true,
 *   });
 * 
 *   const handleDragStart = (resident, activity, slotId) => {
 *     telemetry.recordDragStart(
 *       slotId,
 *       activity,
 *       resident,
 *       { type: 'activity_slot', slotId },
 *       { x: 100, y: 200 }
 *     );
 *   };
 * 
 *   return <div>...</div>;
 * }
 * ```
 */

/**
 * Advanced Usage with Custom Context:
 * 
 * ```typescript
 * const telemetry = useActivitySlotTelemetry({
 *   config: {
 *     enabled: true,
 *     eventTypes: ['drag_start', 'drag_complete', 'assign_failure'],
 *     samplingRate: 0.5, // Sample 50% of events
 *   },
 *   enablePerformanceMonitoring: true,
 *   defaultContext: {
 *     location: 'theater_view',
 *     inputMethod: 'touch',
 *     isRepeatOperation: false,
 *   },
 * });
 * ```
 */

/**
 * Performance Monitoring Example:
 * 
 * ```typescript
 * const { monitorOperation } = usePerformanceMonitoring(slotId, activity);
 * 
 * const handleComplexOperation = async () => {
 *   await monitorOperation('complex_validation', async () => {
 *     // Complex validation logic here
 *     await validateResident(resident);
 *     await checkSlotCapacity(slot);
 *     await updateUI();
 *   });
 * };
 * ```
 */

/**
 * Data Export Example:
 * 
 * ```typescript
 * const exportTelemetryData = () => {
 *   const events = telemetry.getEvents();
 *   const summary = telemetry.generateEventSummary();
 *   const jsonExport = telemetry.exportEvents();
 *   
 *   // Download as JSON file
 *   const blob = new Blob([jsonExport], { type: 'application/json' });
 *   const url = URL.createObjectURL(blob);
 *   const a = document.createElement('a');
 *   a.href = url;
 *   a.download = `telemetry-${Date.now()}.json`;
 *   a.click();
 *   URL.revokeObjectURL(url);
 * };
 * ```
 */
