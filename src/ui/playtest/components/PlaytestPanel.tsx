/**
 * Mobile Playtest Panel Component - NP-225
 * 
 * UI component for playtest logging with session controls and visualization.
 * 
 * @since 2026-01-24
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  getPlaytestLogger,
  type PlaytestSession,
  type BugReport,
  type HeatmapPoint,
  type PlaytestConfig,
  type PlaytestSessionStats,
} from '../systems/playtestLogger';

/**
 * Component props
 */
export interface PlaytestPanelProps {
  config?: Partial<PlaytestConfig>;
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (session: PlaytestSession) => void;
  onBugReport?: (report: BugReport) => void;
  className?: string;
}

/**
 * Session info component
 */
function SessionInfo({ session }: { session: PlaytestSession | null }) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!session) {
    return (
      <div className="session-info">
        <div className="info-item">
          <span className="label">Status:</span>
          <span className="value">No active session</span>
        </div>
      </div>
    );
  }

  const duration = session.endTime ? 
    session.duration : 
    currentTime - session.startTime;

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="session-info">
      <div className="info-item">
        <span className="label">Session ID:</span>
        <span className="value">{session.id}</span>
      </div>
      <div className="info-item">
        <span className="label">Duration:</span>
        <span className="value">{formatDuration(duration)}</span>
      </div>
      <div className="info-item">
        <span className="label">Platform:</span>
        <span className="value">{session.platform}</span>
      </div>
      <div className="info-item">
        <span className="label">Build:</span>
        <span className="value">{session.buildVersion}</span>
      </div>
      <div className="info-item">
        <span className="label">Interactions:</span>
        <span className="value">{session.interactionCount}</span>
      </div>
      <div className="info-item">
        <span className="label">Errors:</span>
        <span className={`value ${session.errorCount > 0 ? 'error' : ''}`}>
          {session.errorCount}
        </span>
      </div>
      {session.crashDetected && (
        <div className="info-item error">
          <span className="label">⚠️ Crash Detected!</span>
        </div>
      )}
    </div>
  );
}

/**
 * Controls component
 */
function Controls({
  isRecording,
  onStart,
  onEnd,
  onExport,
  onReport,
}: {
  isRecording: boolean;
  onStart: () => void;
  onEnd: () => void;
  onExport: (format: 'json' | 'csv') => void;
  onReport: () => void;
}) {
  return (
    <div className="controls">
      {!isRecording ? (
        <button onClick={onStart} className="btn btn-primary">
          ▶️ Start Session
        </button>
      ) : (
        <button onClick={onEnd} className="btn btn-danger">
          ⏹️ End Session
        </button>
      )}
      
      <div className="control-group">
        <button onClick={() => onExport('json')} className="btn btn-secondary">
          📄 Export JSON
        </button>
        <button onClick={() => onExport('csv')} className="btn btn-secondary">
          📊 Export CSV
        </button>
        <button onClick={onReport} className="btn btn-warning">
          🐛 Report Bug
        </button>
      </div>
    </div>
  );
}

/**
 * Stats component
 */
interface StatsProps {
  stats: PlaytestSessionStats;
}

function Stats({ stats }: StatsProps) {
  return (
    <div className="stats">
      <div className="stat-item">
        <span className="label">Events:</span>
        <span className="value">{stats.eventCount}</span>
      </div>
      <div className="stat-item">
        <span className="label">Heatmap Points:</span>
        <span className="value">{stats.heatmapPointCount}</span>
      </div>
      <div className="stat-item">
        <span className="label">Bug Reports:</span>
        <span className={`value ${stats.bugReportCount > 0 ? 'warning' : ''}`}>
          {stats.bugReportCount}
        </span>
      </div>
      {stats.averageFPS && (
        <div className="stat-item">
          <span className="label">Avg FPS:</span>
          <span className={`value ${stats.averageFPS < 30 ? 'error' : ''}`}>
            {stats.averageFPS.toFixed(1)}
          </span>
        </div>
      )}
      {stats.memoryUsage && (
        <div className="stat-item">
          <span className="label">Memory:</span>
          <span className="value">
            {(stats.memoryUsage / 1024 / 1024).toFixed(1)}MB
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Bug reports list component
 */
function BugReportsList({ reports, onSelect }: { 
  reports: BugReport[];
  onSelect: (report: BugReport) => void;
}) {
  if (reports.length === 0) {
    return (
      <div className="bug-reports-empty">
        <p>No bug reports yet</p>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'low';
    }
  };

  return (
    <div className="bug-reports">
      <h3>Bug Reports ({reports.length})</h3>
      <div className="reports-list">
        {reports.map(report => (
          <div
            key={report.id}
            className={`report-item ${getSeverityColor(report.severity)}`}
            onClick={() => onSelect(report)}
          >
            <div className="report-header">
              <span className="report-title">{report.title}</span>
              <span className="report-severity">{report.severity.toUpperCase()}</span>
            </div>
            <div className="report-description">
              {report.description}
            </div>
            <div className="report-meta">
              {new Date(report.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Simple heatmap visualization
 */
function HeatmapVisualization({ points }: { points: HeatmapPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dimensions = { width: 300, height: 200 };

  useEffect(() => {
    if (!canvasRef.current || points.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw heatmap points
    points.forEach(point => {
      const x = (point.x / window.innerWidth) * dimensions.width;
      const y = (point.y / window.innerHeight) * dimensions.height;
      
      // Simple circle with opacity based on recency
      const age = Date.now() - point.timestamp;
      const opacity = Math.max(0, 1 - age / 30000); // Fade over 30 seconds
      
      ctx.fillStyle = `rgba(255, 0, 0, ${opacity * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * dimensions.width;
      const y = (i / 10) * dimensions.height;
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, dimensions.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(dimensions.width, y);
      ctx.stroke();
    }
  }, [points, dimensions.height, dimensions.width]);

  return (
    <div className="heatmap-visualization">
      <h3>Interaction Heatmap</h3>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="heatmap-canvas"
      />
      <div className="heatmap-legend">
        <div className="legend-item">
          <div className="legend-color hot"></div>
          <span>Recent</span>
        </div>
        <div className="legend-item">
          <div className="legend-color cold"></div>
          <span>Old</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Bug report modal
 */
type BugReportPayload = Omit<BugReport, 'id' | 'sessionId' | 'timestamp' | 'createdAt' | 'updatedAt' | 'environment'>;
type BugSeverity = BugReport['severity'];

function BugReportModal({
  report,
  onClose,
  onSubmit,
}: {
  report: BugReport | null;
  onClose: () => void;
  onSubmit: (report: BugReportPayload) => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: '',
    expected: '',
    actual: '',
    severity: 'medium' as BugSeverity,
  });

  useEffect(() => {
    if (report) {
      const newFormData = {
        title: report.title,
        description: report.description,
        steps: report.steps.join('\n'),
        expected: report.expected,
        actual: report.actual,
        severity: report.severity,
      };
      setFormData(newFormData);
    } else {
      const emptyFormData = {
        title: '',
        description: '',
        steps: '',
        expected: '',
        actual: '',
        severity: 'medium' as BugSeverity,
      };
      setFormData(emptyFormData);
    }
  }, [report]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      steps: formData.steps.split('\n').filter(s => s.trim()),
      type: 'ui',
      attachments: {
        logs: [],
        performance: {},
      },
      resolved: false,
    });
    onClose();
  };

  if (!report) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Bug Report</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Severity:</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as BugSeverity })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Steps to reproduce:</label>
            <textarea
              value={formData.steps}
              onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label>Expected behavior:</label>
            <textarea
              value={formData.expected}
              onChange={(e) => setFormData({ ...formData, expected: e.target.value })}
              rows={2}
            />
          </div>
          
          <div className="form-group">
            <label>Actual behavior:</label>
            <textarea
              value={formData.actual}
              onChange={(e) => setFormData({ ...formData, actual: e.target.value })}
              rows={2}
            />
          </div>
        </form>
        
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" onClick={handleSubmit} className="btn btn-primary">
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Playtest Panel Component
 */
export function PlaytestPanel({
  config,
  onSessionStart,
  onSessionEnd,
  onBugReport,
  className = '',
}: PlaytestPanelProps) {
  const [logger] = useState(() => getPlaytestLogger(config));
  const [currentSession, setCurrentSession] = useState<PlaytestSession | null>(null);
  const [stats, setStats] = useState<PlaytestSessionStats>({
    duration: 0,
    eventCount: 0,
    interactionCount: 0,
    errorCount: 0,
    bugReportCount: 0,
    heatmapPointCount: 0,
  });
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [selectedBugReport, setSelectedBugReport] = useState<BugReport | null>(null);
  const [showBugModal, setShowBugModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentSession) {
        setStats(logger.getSessionStats());
        setBugReports(logger.getBugReports());
        setHeatmapPoints(logger.getHeatmapData());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession, logger]);

  // Session handlers
  const handleStartSession = async () => {
    const sessionId = await logger.startSession();
    setCurrentSession(logger.getCurrentSession());
    setIsRecording(true);
    onSessionStart?.(sessionId);
  };

  const handleEndSession = async () => {
    const session = await logger.endSession();
    setCurrentSession(null);
    setIsRecording(false);
    onSessionEnd?.(session!);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const data = await logger.exportSession(format);
      
      // Create download
      const blob = new Blob([data], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `playtest-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleManualReport = () => {
    setSelectedBugReport(null);
    setShowBugModal(true);
  };

  const handleBugReportSubmit = (report: Omit<BugReport, 'id' | 'sessionId' | 'timestamp' | 'createdAt' | 'updatedAt' | 'environment'>) => {
    const reportId = logger.createManualBugReport(report);
    onBugReport?.(logger.getBugReports().find(r => r.id === reportId)!);
  };

  return (
    <div className={`playtest-panel ${className}`}>
      <div className="panel-header">
        <h2>🎮 Mobile Playtest Logger</h2>
        <div className="status-indicator">
          <div className={`indicator ${isRecording ? 'recording' : 'idle'}`}></div>
          <span>{isRecording ? 'Recording' : 'Idle'}</span>
        </div>
      </div>

      <Controls
        isRecording={isRecording}
        onStart={handleStartSession}
        onEnd={handleEndSession}
        onExport={handleExport}
        onReport={handleManualReport}
      />

      <SessionInfo session={currentSession} />

      {currentSession && (
        <>
          <Stats stats={stats} />
          
          <HeatmapVisualization points={heatmapPoints} />
          
          <BugReportsList
            reports={bugReports}
            onSelect={(report) => {
              setSelectedBugReport(report);
              setShowBugModal(true);
            }}
          />
        </>
      )}

      {showBugModal && (
        <BugReportModal
          report={selectedBugReport}
          onClose={() => {
            setShowBugModal(false);
            setSelectedBugReport(null);
          }}
          onSubmit={handleBugReportSubmit}
        />
      )}
    </div>
  );
}
