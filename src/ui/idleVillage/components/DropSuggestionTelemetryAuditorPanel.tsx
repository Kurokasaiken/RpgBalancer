/**
 * Drop Suggestion Telemetry Auditor Panel
 *
 * React component that displays comprehensive analytics for Idle Village drop suggestions.
 * Shows effectiveness metrics, user interaction patterns, and suggestion performance data.
 *
 * @since NP-106
 */

import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import {
  type SuggestionEffectivenessMetrics,
  type DropSuggestionTelemetryEvent,
} from '@/ui/idleVillage/utils/dropSuggestionTelemetryAuditor';

/**
 * Mock telemetry data for development and testing
 */
const MOCK_TELEMETRY_EVENTS: DropSuggestionTelemetryEvent[] = [
  {
    id: 'event_1',
    type: 'suggestion_generated',
    timestamp: Date.now() - 300000,
    sessionId: 'session_123',
    context: {
      suggestionId: 'sugg_1',
      residentId: 'resident_1',
      slotId: 'slot_1',
      locationId: 'location_1',
      confidence: 0.85,
      reason: 'skill_match',
      alternativesCount: 3,
      residentFatigue: 25,
      slotUtilization: 60,
    },
  },
  {
    id: 'event_2',
    type: 'suggestion_accepted',
    timestamp: Date.now() - 250000,
    sessionId: 'session_123',
    context: {
      suggestionId: 'sugg_1',
      residentId: 'resident_1',
      slotId: 'slot_1',
      locationId: 'location_1',
      confidence: 0.85,
      reason: 'skill_match',
      alternativesCount: 3,
      residentFatigue: 25,
      slotUtilization: 60,
    },
    metrics: {
      timeToInteract: 4500,
      hesitationDetected: false,
      viewCount: 1,
      actedUpon: true,
    },
  },
  {
    id: 'event_3',
    type: 'suggestion_generated',
    timestamp: Date.now() - 200000,
    sessionId: 'session_123',
    context: {
      suggestionId: 'sugg_2',
      residentId: 'resident_2',
      slotId: 'slot_2',
      locationId: 'location_2',
      confidence: 0.65,
      reason: 'load_balancing',
      alternativesCount: 1,
      residentFatigue: 45,
      slotUtilization: 30,
    },
  },
  {
    id: 'event_4',
    type: 'suggestion_rejected',
    timestamp: Date.now() - 180000,
    sessionId: 'session_123',
    context: {
      suggestionId: 'sugg_2',
      residentId: 'resident_2',
      slotId: 'slot_2',
      locationId: 'location_2',
      confidence: 0.65,
      reason: 'load_balancing',
      alternativesCount: 1,
      residentFatigue: 45,
      slotUtilization: 30,
    },
    metrics: {
      timeToInteract: 12000,
      hesitationDetected: true,
      viewCount: 1,
      actedUpon: true,
    },
    metadata: {
      rejectionReason: 'wrong_location',
    },
  },
];

const MOCK_EFFECTIVENESS_METRICS: SuggestionEffectivenessMetrics = {
  totalSuggestions: 150,
  acceptedSuggestions: 95,
  rejectedSuggestions: 35,
  dismissedSuggestions: 20,
  acceptanceRate: 63.3,
  averageAcceptanceTime: 5200,
  averageAcceptedConfidence: 0.78,
  commonRejectionReasons: {
    wrong_location: 15,
    wrong_timing: 12,
    resident_unavailable: 8,
  },
  suggestionsByReason: {
    skill_match: 60,
    load_balancing: 45,
    optimal_fit: 30,
    emergency_coverage: 15,
  },
};

interface DropSuggestionTelemetryAuditorPanelProps {
  /** Custom CSS classes */
  className?: string;
  /** Whether to show detailed metrics */
  showDetailedMetrics?: boolean;
  /** Maximum events to display */
  maxEvents?: number;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
}

/**
 * Drop Suggestion Telemetry Auditor Panel Component
 */
export const DropSuggestionTelemetryAuditorPanel: React.FC<DropSuggestionTelemetryAuditorPanelProps> = ({
  className,
  showDetailedMetrics = true,
  maxEvents = 20,
  compact = false,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [telemetryEvents] = useState<DropSuggestionTelemetryEvent[]>(MOCK_TELEMETRY_EVENTS);
  const [effectivenessMetrics] = useState<SuggestionEffectivenessMetrics>(MOCK_EFFECTIVENESS_METRICS);
  const [selectedReason, setSelectedReason] = useState<string>('all');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Filter events by reason
  const filteredEvents = useMemo(() => {
    if (selectedReason === 'all') {
      return telemetryEvents.slice(0, maxEvents);
    }
    return telemetryEvents
      .filter(event => event.context.reason === selectedReason)
      .slice(0, maxEvents);
  }, [telemetryEvents, selectedReason, maxEvents]);

  // Get unique reasons for filter
  const reasons = useMemo(() => {
    const reasonSet = new Set<string>();
    telemetryEvents.forEach(event => reasonSet.add(event.context.reason));
    return Array.from(reasonSet).sort();
  }, [telemetryEvents]);

  // Format duration
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Get event type color
  const getEventTypeColor = (type: string): string => {
    switch (type) {
      case 'suggestion_accepted':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'suggestion_rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'suggestion_dismissed':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'suggestion_generated':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Calculate performance score (0-100)
  const performanceScore = useMemo(() => {
    if (effectivenessMetrics.totalSuggestions === 0) return 0;

    const acceptanceScore = effectivenessMetrics.acceptanceRate;
    const confidenceScore = effectivenessMetrics.averageAcceptedConfidence * 100;
    const timeScore = Math.max(0, 100 - (effectivenessMetrics.averageAcceptanceTime / 100)); // Penalize >10s avg

    return Math.round((acceptanceScore + confidenceScore + timeScore) / 3);
  }, [effectivenessMetrics]);

  return (
    <div className={clsx('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Drop Suggestion Telemetry Auditor
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Analyzing suggestion effectiveness and user interactions
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Last Refresh</div>
              <div className="text-sm font-medium text-gray-900">
                {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
            <div className="flex items-center">
              <div className={clsx(
                'px-2 py-1 rounded-full text-xs font-medium',
                performanceScore >= 80 ? 'bg-green-100 text-green-800' :
                performanceScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              )}>
                Performance: {performanceScore}/100
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Effectiveness Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600">Total Suggestions</div>
            <div className="text-2xl font-bold text-gray-900">{effectivenessMetrics.totalSuggestions}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm font-medium text-green-600">Acceptance Rate</div>
            <div className="text-2xl font-bold text-green-900">
              {effectivenessMetrics.acceptanceRate.toFixed(1)}%
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-600">Avg Confidence</div>
            <div className="text-2xl font-bold text-blue-900">
              {(effectivenessMetrics.averageAcceptedConfidence * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm font-medium text-purple-600">Avg Response Time</div>
            <div className="text-2xl font-bold text-purple-900">
              {formatDuration(effectivenessMetrics.averageAcceptanceTime)}
            </div>
          </div>
        </div>

        {/* Suggestion Breakdown */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-gray-900">Recent Suggestions</h3>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Reasons</option>
              {reasons.map(reason => (
                <option key={reason} value={reason}>
                  {reason.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No suggestion events available
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={clsx(
                    'border rounded-lg p-3',
                    getEventTypeColor(event.type)
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">
                        {event.type.replace('suggestion_', '').replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {event.context.reason.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs bg-white/50 px-2 py-1 rounded">
                        {(event.context.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimestamp(event.timestamp)}
                    </div>
                  </div>

                  {showDetailedMetrics && (
                    <div className="mt-2 grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">Resident:</span>
                        <span className="ml-1 font-medium">{event.context.residentId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Slot:</span>
                        <span className="ml-1 font-medium">{event.context.slotId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <span className="ml-1 font-medium">{event.context.locationId}</span>
                      </div>
                      {event.metrics?.timeToInteract && (
                        <div className="col-span-3">
                          <span className="text-gray-600">Response Time:</span>
                          <span className="ml-1 font-medium">
                            {formatDuration(event.metrics.timeToInteract)}
                            {event.metrics.hesitationDetected && ' (hesitated)'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {event.metadata?.rejectionReason && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                      Rejection: {event.metadata.rejectionReason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Analytics Insights */}
        {!compact && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Analytics Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Suggestions by Reason</h4>
                <div className="space-y-2">
                  {Object.entries(effectivenessMetrics.suggestionsByReason)
                    .sort(([, a], [, b]) => b - a)
                    .map(([reason, count]) => {
                      const percentage = (count / effectivenessMetrics.totalSuggestions) * 100;
                      return (
                        <div key={reason} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">
                            {reason.replace('_', ' ')}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-900 w-8 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Common Rejection Reasons</h4>
                <div className="space-y-2">
                  {Object.entries(effectivenessMetrics.commonRejectionReasons)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([reason, count]) => {
                      const totalRejections = effectivenessMetrics.rejectedSuggestions;
                      const percentage = totalRejections > 0 ? (count / totalRejections) * 100 : 0;
                      return (
                        <div key={reason} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {reason.replace('_', ' ')}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-red-500 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-900 w-8 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  {Object.keys(effectivenessMetrics.commonRejectionReasons).length === 0 && (
                    <div className="text-sm text-gray-500">No rejection data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Effectiveness Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Effectiveness Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Accepted:</span>
                  <span className="ml-1 font-medium text-green-600">
                    {effectivenessMetrics.acceptedSuggestions}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Rejected:</span>
                  <span className="ml-1 font-medium text-red-600">
                    {effectivenessMetrics.rejectedSuggestions}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Dismissed:</span>
                  <span className="ml-1 font-medium text-yellow-600">
                    {effectivenessMetrics.dismissedSuggestions}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                System is performing {performanceScore >= 70 ? 'well' : performanceScore >= 50 ? 'adequately' : 'poorly'}
                with {effectivenessMetrics.acceptanceRate.toFixed(1)}% suggestion acceptance rate.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DropSuggestionTelemetryAuditorPanel;
