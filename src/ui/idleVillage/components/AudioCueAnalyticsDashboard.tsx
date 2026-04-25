/**
 * NP-036 – Idle Village Audio Cue Configurator
 *
 * Audio cue analytics dashboard component for visualizing
 * telemetry data with performance metrics and usage analytics.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import React from 'react';
import type { AudioCueTelemetry, AudioCueCategory, AudioCueEventType } from '../types/audioCue';

interface AudioCueAnalyticsDashboardProps {
  telemetry: AudioCueTelemetry | null;
  className?: string;
}

/**
 * Audio Cue Analytics Dashboard Component
 */
export const AudioCueAnalyticsDashboard: React.FC<AudioCueAnalyticsDashboardProps> = ({
  telemetry,
  className = '',
}) => {
  if (!telemetry) {
    return (
      <div className={`audio-cue-analytics-dashboard ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="text-lg text-gray-500">No telemetry data available</div>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`audio-cue-analytics-dashboard bg-amber-50 border border-amber-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-amber-200 bg-amber-100">
        <h2 className="text-xl font-bold text-amber-900">Audio Cue Analytics</h2>
        <div className="text-sm text-amber-700 mt-1">
          Session: {telemetry.sessionId} • Last updated: {new Date(telemetry.timestamp).toLocaleString()}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Overview Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="text-sm font-medium text-gray-600">Total Plays</div>
            <div className="text-2xl font-bold text-blue-600">{telemetry.playback.totalPlays}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="text-sm font-medium text-gray-600">Success Rate</div>
            <div className="text-2xl font-bold text-green-600">
              {telemetry.playback.totalPlays > 0
                ? formatPercentage(telemetry.playback.successfulPlays / telemetry.playback.totalPlays)
                : '0%'
              }
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="text-sm font-medium text-gray-600">Avg Play Time</div>
            <div className="text-2xl font-bold text-purple-600">
              {formatDuration(telemetry.playback.averagePlayTime)}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="text-sm font-medium text-gray-600">Total Play Time</div>
            <div className="text-2xl font-bold text-indigo-600">
              {formatDuration(telemetry.playback.totalPlayTime)}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h3 className="text-lg font-semibold text-amber-900 mb-3">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded p-4">
              <h4 className="font-medium text-gray-900 mb-2">Load Performance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Average Load Time:</span>
                  <span className="font-medium">{telemetry.performance.averageLoadTime.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Play Time:</span>
                  <span className="font-medium">{telemetry.performance.averagePlayTime.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Sample Rate:</span>
                  <span className="font-medium">{telemetry.performance.sampleRate}Hz</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded p-4">
              <h4 className="font-medium text-gray-900 mb-2">System Resources</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Buffer Underruns:</span>
                  <span className="font-medium text-red-600">{telemetry.performance.bufferUnderruns}</span>
                </div>
                <div className="flex justify-between">
                  <span>CPU Usage:</span>
                  <span className="font-medium">{telemetry.performance.cpuUsage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Usage:</span>
                  <span className="font-medium">{formatBytes(telemetry.performance.memoryUsage)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Interaction */}
        <div>
          <h3 className="text-lg font-semibold text-amber-900 mb-3">User Interactions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{telemetry.userInteraction.muteToggles}</div>
              <div className="text-sm text-gray-600">Mute Toggles</div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{telemetry.userInteraction.volumeChanges}</div>
              <div className="text-sm text-gray-600">Volume Changes</div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{telemetry.userInteraction.settingsChanges}</div>
              <div className="text-sm text-gray-600">Settings Changes</div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(telemetry.userInteraction.cueInteractions).reduce((sum, count) => sum + count, 0)}
              </div>
              <div className="text-sm text-gray-600">Cue Interactions</div>
            </div>
          </div>
        </div>

        {/* Category Usage */}
        <div>
          <h3 className="text-lg font-semibold text-amber-900 mb-3">Category Usage</h3>
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plays
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(telemetry.userInteraction.categoryInteractions).map(([category, interactions]) => {
                  const cueStats = telemetry.playback.cueStatistics;
                  const categoryCues = Object.values(cueStats).filter(stat => stat.category === category);
                  const totalPlays = categoryCues.reduce((sum, stat) => sum + stat.plays, 0);
                  const totalSuccesses = categoryCues.reduce((sum, stat) => sum + stat.successes, 0);
                  const successRate = totalPlays > 0 ? totalSuccesses / totalPlays : 0;

                  return (
                    <tr key={category}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                        {category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {interactions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {totalPlays}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPercentage(successRate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cue Statistics */}
        {Object.keys(telemetry.playback.cueStatistics).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-3">Top Performing Cues</h3>
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cue ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plays
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Played
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(telemetry.playback.cueStatistics)
                    .sort(([, a], [, b]) => b.plays - a.plays)
                    .slice(0, 10)
                    .map(([cueId, stats]) => (
                      <tr key={cueId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {cueId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stats.plays}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stats.plays > 0 ? formatPercentage(stats.successes / stats.plays) : '0%'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDuration(stats.averageDuration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stats.lastPlayed > 0 ? new Date(stats.lastPlayed).toLocaleDateString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Errors */}
        {telemetry.errors.totalErrors > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-3">Error Summary</h3>
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{telemetry.errors.totalErrors}</div>
                  <div className="text-sm text-red-700">Total Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{telemetry.errors.recoveryAttempts}</div>
                  <div className="text-sm text-orange-700">Recovery Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{telemetry.errors.successfulRecoveries}</div>
                  <div className="text-sm text-green-700">Successful Recoveries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{telemetry.errors.affectedCues.length}</div>
                  <div className="text-sm text-blue-700">Affected Cues</div>
                </div>
              </div>

              {telemetry.errors.errorMessages.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-900 mb-2">Recent Error Messages</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {telemetry.errors.errorMessages.slice(-5).map((message, index) => (
                      <div key={index} className="text-sm text-red-700 bg-red-100 px-2 py-1 rounded">
                        {message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Info */}
        <div>
          <h3 className="text-lg font-semibold text-amber-900 mb-3">System Information</h3>
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Audio Capabilities</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Web Audio API:</span>
                    <span className={`font-medium ${telemetry.system.webAudioSupported ? 'text-green-600' : 'text-red-600'}`}>
                      {telemetry.system.webAudioSupported ? 'Supported' : 'Not Supported'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Audio Context State:</span>
                    <span className="font-medium">{telemetry.performance.audioContextState}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Supported Formats:</span>
                    <span className="font-medium">{telemetry.system.supportedFormats.join(', ')}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Device Information</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Platform:</span>
                    <span className="font-medium">{telemetry.system.deviceInfo.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hardware Concurrency:</span>
                    <span className="font-medium">{telemetry.system.deviceInfo.hardwareConcurrency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Device Memory:</span>
                    <span className="font-medium">{telemetry.system.deviceInfo.deviceMemory}GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>User Agent:</span>
                    <span className="font-medium text-xs truncate" title={telemetry.system.deviceInfo.userAgent}>
                      {telemetry.system.deviceInfo.userAgent.substring(0, 30)}...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
