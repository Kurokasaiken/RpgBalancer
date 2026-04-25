import React, { useMemo } from 'react';
import type { QuestTimelineEvent } from './QuestOutcomeAnalyzer.types';
import styles from './QuestTimeline.module.css';

/**
 * Props for QuestTimeline component
 */
export interface QuestTimelineProps {
  /** Timeline events to display */
  events: QuestTimelineEvent[];
  /** Whether to show timestamps */
  showTimestamps?: boolean;
  /** Whether to highlight risk events */
  highlightRiskEvents?: boolean;
  /** Maximum height for the timeline */
  maxHeight?: string;
  /** Custom CSS class name */
  className?: string;
}

/**
 * Quest Timeline Component
 *
 * Visual timeline showing quest execution events with risk indicators and phase progression.
 * Displays events chronologically with visual cues for different event types.
 */
export const QuestTimeline: React.FC<QuestTimelineProps> = ({
  events,
  showTimestamps = true,
  highlightRiskEvents = true,
  maxHeight = '400px',
  className,
}) => {
  // Sort events by timestamp
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.timestamp - b.timestamp);
  }, [events]);

  // Calculate timeline duration for relative positioning
  const timelineDuration = useMemo(() => {
    if (sortedEvents.length < 2) return 1;
    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    return lastEvent.timestamp - firstEvent.timestamp;
  }, [sortedEvents]);

  // Get event icon based on type
  const getEventIcon = (type: QuestTimelineEvent['type']): string => {
    switch (type) {
      case 'phase_start': return '▶️';
      case 'phase_complete': return '✅';
      case 'branch_taken': return '🔀';
      case 'effect_applied': return '⚡';
      case 'risk_assessment': return '⚠️';
      case 'fatal_event': return '💀';
      default: return '📝';
    }
  };

  // Get event color class based on type and risk
  const getEventClass = (event: QuestTimelineEvent): string => {
    let baseClass = styles.event;

    if (event.type === 'fatal_event') {
      baseClass += ` ${styles.fatal}`;
    } else if (event.type === 'risk_assessment' && highlightRiskEvents) {
      if (event.riskLevel && event.riskLevel > 0.7) {
        baseClass += ` ${styles.highRisk}`;
      } else if (event.riskLevel && event.riskLevel > 0.4) {
        baseClass += ` ${styles.mediumRisk}`;
      }
    }

    return baseClass;
  };

  // Calculate relative position on timeline
  const getEventPosition = (event: QuestTimelineEvent): number => {
    if (sortedEvents.length < 2) return 0;
    const firstEvent = sortedEvents[0];
    const relativeTime = event.timestamp - firstEvent.timestamp;
    return (relativeTime / timelineDuration) * 100;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={`${styles.timelineContainer} ${className || ''}`} style={{ maxHeight }}>
      <h4 className={styles.timelineTitle}>Quest Timeline</h4>

      {sortedEvents.length === 0 ? (
        <div className={styles.noEvents}>
          No timeline events available for this quest.
        </div>
      ) : (
        <div className={styles.timeline}>
          {/* Timeline track */}
          <div className={styles.timelineTrack}></div>

          {/* Timeline events */}
          <div className={styles.eventsContainer}>
            {sortedEvents.map((event, index) => (
              <div
                key={event.id}
                className={getEventClass(event)}
                style={{ left: `${getEventPosition(event)}%` }}
                title={event.description}
              >
                <div className={styles.eventIcon}>
                  {getEventIcon(event.type)}
                </div>
                <div className={styles.eventContent}>
                  <div className={styles.eventDescription}>
                    {event.description}
                  </div>
                  {showTimestamps && (
                    <div className={styles.eventTimestamp}>
                      {formatTimestamp(event.timestamp)}
                    </div>
                  )}
                  {event.riskLevel !== undefined && highlightRiskEvents && (
                    <div className={styles.riskIndicator}>
                      Risk: {(event.riskLevel * 100).toFixed(1)}%
                    </div>
                  )}
                  {event.phaseId && (
                    <div className={styles.phaseIndicator}>
                      Phase: {event.phaseId}
                    </div>
                  )}
                </div>

                {/* Connection line to next event */}
                {index < sortedEvents.length - 1 && (
                  <div
                    className={styles.eventConnector}
                    style={{
                      width: `${getEventPosition(sortedEvents[index + 1]) - getEventPosition(event)}%`
                    }}
                  ></div>
                )}
              </div>
            ))}
          </div>

          {/* Timeline legend */}
          <div className={styles.timelineLegend}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendIcon} ${styles.phaseStart}`}>▶️</span>
              <span>Phase Start</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendIcon} ${styles.phaseComplete}`}>✅</span>
              <span>Phase Complete</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendIcon} ${styles.branchTaken}`}>🔀</span>
              <span>Branch Taken</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendIcon} ${styles.effectApplied}`}>⚡</span>
              <span>Effect Applied</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendIcon} ${styles.riskAssessment}`}>⚠️</span>
              <span>Risk Assessment</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendIcon} ${styles.fatalEvent}`}>💀</span>
              <span>Fatal Event</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestTimeline;
