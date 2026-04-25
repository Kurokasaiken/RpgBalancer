/**
 * Session Analytics and Reporting Components
 * 
 * Components for analyzing session data and generating reports.
 */

import React, { useState, useMemo } from 'react';
import { type SessionTag, type SessionMetrics, type SessionTagType } from '@/analytics/sessionTaggingPipeline';

/**
 * Session analytics dashboard component
 */
export function SessionAnalyticsDashboard({ 
  sessions,
  onSessionSelect 
}: {
  sessions: Array<{
    id: string;
    metrics: SessionMetrics;
    tags: SessionTag[];
    timestamp: number;
  }>;
  onSessionSelect?: (sessionId: string) => void;
}) {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<SessionTagType | 'all'>('all');

  // Calculate aggregated analytics
  const analytics = useMemo(() => {
    if (sessions.length === 0) return null;

    const totalSessions = sessions.length;
    const totalCombats = sessions.reduce((sum, s) => sum + s.metrics.combatsTotal, 0);
    const totalWins = sessions.reduce((sum, s) => sum + s.metrics.combatsWon, 0);
    const totalXP = sessions.reduce((sum, s) => sum + s.metrics.experienceGained, 0);
    const totalMoney = sessions.reduce((sum, s) => sum + s.metrics.moneyGained, 0);
    const totalDuration = sessions.reduce((sum, s) => sum + (s.metrics.duration || 0), 0);

    const avgWinRate = totalCombats > 0 ? totalWins / totalCombats : 0;
    const avgXPPerSession = totalXP / totalSessions;
    const avgMoneyPerSession = totalMoney / totalSessions;
    const avgDurationPerSession = totalDuration / totalSessions;

    // Tag analytics
    const allTags = sessions.flatMap(s => s.tags);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag.type] = (acc[tag.type] || 0) + 1;
      return acc;
    }, {} as Record<SessionTagType, number>);

    const confidenceCounts = allTags.reduce((acc, tag) => {
      if (tag.confidence >= 0.8) acc.high++;
      else if (tag.confidence >= 0.5) acc.medium++;
      else acc.low++;
      return acc;
    }, { high: 0, medium: 0, low: 0 });

    return {
      totalSessions,
      totalCombats,
      totalWins,
      totalXP,
      totalMoney,
      avgWinRate,
      avgXPPerSession,
      avgMoneyPerSession,
      avgDurationPerSession,
      tagCounts,
      confidenceCounts,
      totalTags: allTags.length,
    };
  }, [sessions]);

  // Filter sessions based on selected tag type
  const filteredSessions = useMemo(() => {
    if (filterType === 'all') return sessions;
    
    return sessions.filter(session => 
      session.tags.some(tag => tag.type === filterType)
    );
  }, [sessions, filterType]);

  if (!analytics) {
    return (
      <div className="text-center text-gray-500 py-8">
        No session data available for analytics
      </div>
    );
  }

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatWinRate = (winRate: number) => {
    return `${(winRate * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Analytics</h2>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{analytics.totalSessions}</div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{formatWinRate(analytics.avgWinRate)}</div>
            <div className="text-sm text-gray-600">Average Win Rate</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{Math.round(analytics.avgXPPerSession)}</div>
            <div className="text-sm text-gray-600">Avg XP/Session</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{formatDuration(analytics.avgDurationPerSession)}</div>
            <div className="text-sm text-gray-600">Avg Duration</div>
          </div>
        </div>

        {/* Tag Type Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Tag Type
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as SessionTagType | 'all')}
            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sessions</option>
            <option value="playstyle">Playstyle</option>
            <option value="progression">Progression</option>
            <option value="activity">Activity</option>
            <option value="performance">Performance</option>
            <option value="duration">Duration</option>
            <option value="frequency">Frequency</option>
            <option value="milestone">Milestone</option>
            <option value="custom">Custom</option>
            <option value="auto">Auto</option>
            <option value="system">System</option>
          </select>
        </div>

        {/* Tag Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Tag Distribution</h3>
            <div className="space-y-2">
              {Object.entries(analytics.tagCounts).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="capitalize font-medium">{type}</span>
                  <span className="bg-gray-200 px-2 py-1 rounded-full text-sm font-medium">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Tag Confidence</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <span className="font-medium">High (≥80%)</span>
                <span className="bg-green-200 px-2 py-1 rounded-full text-sm font-medium">
                  {analytics.confidenceCounts.high}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                <span className="font-medium">Medium (50-80%)</span>
                <span className="bg-yellow-200 px-2 py-1 rounded-full text-sm font-medium">
                  {analytics.confidenceCounts.medium}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                <span className="font-medium">Low (<50%)</span>
                <span className="bg-red-200 px-2 py-1 rounded-full text-sm font-medium">
                  {analytics.confidenceCounts.low}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Session List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Sessions ({filteredSessions.length})
          </h3>
          <div className="space-y-2">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedSession(session.id);
                  onSessionSelect?.(session.id);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">
                      Session {session.id}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(session.timestamp).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Level {session.metrics.levelStart} → {session.metrics.levelEnd} | 
                      {session.metrics.combatsWon}/{session.metrics.combatsTotal} wins | 
                      {session.metrics.experienceGained} XP | 
                      {formatDuration(session.metrics.duration || 0)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {session.tags.length} tags
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatWinRate(session.metrics.winRate)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Session export component
 */
export function SessionExport({ sessions }: { sessions: Array<{
  id: string;
  metrics: SessionMetrics;
  tags: SessionTag[];
  timestamp: number;
}> }) {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'markdown'>('json');

  const exportData = () => {
    switch (exportFormat) {
      case 'json':
        return JSON.stringify(sessions, null, 2);
      
      case 'csv':
        const headers = [
          'Session ID', 'Timestamp', 'Level Start', 'Level End', 'Combats Total',
          'Combats Won', 'Win Rate', 'XP Gained', 'Money Gained', 'Duration',
          'Tags Count', 'Auto Tags', 'Manual Tags'
        ];
        
        const rows = sessions.map(session => [
          session.id,
          new Date(session.timestamp).toISOString(),
          session.metrics.levelStart,
          session.metrics.levelEnd,
          session.metrics.combatsTotal,
          session.metrics.combatsWon,
          session.metrics.winRate,
          session.metrics.experienceGained,
          session.metrics.moneyGained,
          session.metrics.duration || 0,
          session.tags.length,
          session.tags.filter(t => t.source === 'auto').length,
          session.tags.filter(t => t.source === 'manual').length,
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      
      case 'markdown':
        return sessions.map(session => {
          const date = new Date(session.timestamp).toLocaleString();
          const tags = session.tags.map(tag => `${tag.name}: ${tag.value}`).join(', ');
          
          return `## Session ${session.id}
**Date:** ${date}
**Progression:** Level ${session.metrics.levelStart} → ${session.metrics.levelEnd}
**Combat:** ${session.metrics.combatsWon}/${session.metrics.combatsTotal} (${(session.metrics.winRate * 100).toFixed(1)}%)
**Rewards:** ${session.metrics.experienceGained} XP, ${session.metrics.moneyGained} money
**Duration:** ${Math.round((session.metrics.duration || 0) / 60000)} minutes
**Tags:** ${tags || 'None'}

---`;
        }).join('\n\n');
    }
  };

  const downloadFile = () => {
    const data = exportData();
    const blob = new Blob([data], { 
      type: exportFormat === 'json' ? 'application/json' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-data.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">Export Session Data</h3>
      
      <div className="flex items-center gap-4">
        <label className="block text-sm font-medium text-gray-700">
          Export Format
        </label>
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv' | 'markdown')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="markdown">Markdown</option>
        </select>
        
        <button
          onClick={downloadFile}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Download {exportFormat.toUpperCase()}
        </button>
      </div>
      
      <div className="text-sm text-gray-600">
        Exporting {sessions.length} sessions with {sessions.reduce((sum, s) => sum + s.tags.length, 0)} total tags
      </div>
    </div>
  );
}
