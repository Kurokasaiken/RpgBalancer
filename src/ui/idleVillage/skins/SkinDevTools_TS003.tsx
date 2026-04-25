/**
 * TS-003: Enhanced Skin Dev Tools
 * 
 * Advanced development tools panel with comprehensive skin system management,
 * hot-reloading controls, inspection tools, and performance monitoring.
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { getSkinReplacementAPI_TS003, type SkinReplacementAPI_TS003, type SkinInspectionResult, type HotReloadConfig } from './SkinReplacementAPI_TS003';

// ============================================================================
// TYPES
// ============================================================================

// Define types locally to avoid import issues
type ComponentId = string;
type MotionLevel = 'minimal' | 'reduced' | 'full';
type StyleLabPillar = 'frontier' | 'wilderness' | 'empire';
type SkinPresetId = 'minimal-frontier' | 'minimal-wilderness' | 'minimal-empire' | 'wanderlust' | 'arcane-tech' | 'gilded-observatory';

interface ComponentSkinBinding {
  componentId: string;
  name: string;
  description: string;
  version: string;
  defaultPreset: SkinPresetId;
  supportedPillars: StyleLabPillar[];
  supportedMotionLevels: MotionLevel[];
  cssClassBase: string;
  dataAttributePrefix: string;
  supportsMotionLevel: boolean;
  supportsTelemetry: boolean;
  supportsPillarSwitching: boolean;
  category: string;
  priority: number;
  tags: string[];
  skinProperties?: Record<string, unknown>;
}

interface SkinState {
  currentPreset: SkinPresetId;
  currentPillar: StyleLabPillar;
  currentMotionLevel: MotionLevel;
  isTransitioning: boolean;
  activeBindings: Record<string, ComponentSkinBinding>;
  updateCount: number;
  lastUpdated: number;
}

export interface SkinDevTools_TS003Props {
  /** Whether to show advanced features */
  showAdvanced?: boolean;
  /** Whether to enable debug mode */
  enableDebug?: boolean;
  /** Whether to show performance metrics */
  showPerformance?: boolean;
  /** Whether to show hot reload controls */
  showHotReload?: boolean;
  /** Whether to show inspection tools */
  showInspection?: boolean;
  /** Whether to show telemetry */
  showTelemetry?: boolean;
  /** Whether to show replacement API */
  showReplacementAPI?: boolean;
  /** Whether to show registry */
  showRegistry?: boolean;
  /** Maximum number of debug log entries */
  maxDebugEntries?: number;
  /** Update interval for real-time data */
  updateInterval?: number;
  /** Custom className */
  className?: string;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const DebugLogViewer: React.FC<{
  logs: any[];
  maxEntries?: number;
}> = ({ logs, maxEntries = 50 }) => {
  const displayLogs = useMemo(() => {
    return logs.slice(0, maxEntries);
  }, [logs, maxEntries]);

  return (
    <div className="skin-dev-tools__debug-log">
      <h4>Debug Log</h4>
      <div className="skin-dev-tools__log-container">
        {displayLogs.map((log, index) => (
          <div key={index} className={`skin-dev-tools__log-entry skin-dev-tools__log-entry--${log.success ? 'success' : 'error'}`}>
            <span className="skin-dev-tools__log-timestamp">{log.timestamp}</span>
            <span className="skin-dev-tools__log-action">{log.action}</span>
            {log.error && <span className="skin-dev-tools__log-error">{log.error}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

const ComponentInspector: React.FC<{
  inspection: SkinInspectionResult;
}> = ({ inspection }) => {
  return (
    <div className="skin-dev-tools__component-inspector">
      <h4>Component: {inspection.componentId}</h4>
      
      <div className="skin-dev-tools__inspector-section">
        <h5>Binding Info</h5>
        <div className="skin-dev-tools__inspector-grid">
          <div><strong>Name:</strong> {inspection.binding.name}</div>
          <div><strong>Version:</strong> {inspection.binding.version}</div>
          <div><strong>Category:</strong> {inspection.binding.category}</div>
          <div><strong>Priority:</strong> {inspection.binding.priority}</div>
        </div>
      </div>

      <div className="skin-dev-tools__inspector-section">
        <h5>Current Classes ({inspection.currentClasses.length})</h5>
        <div className="skin-dev-tools__class-list">
          {inspection.currentClasses.map((cls, index) => (
            <span key={index} className="skin-dev-tools__class-badge">{cls}</span>
          ))}
        </div>
      </div>

      <div className="skin-dev-tools__inspector-section">
        <h5>Attributes ({Object.keys(inspection.currentAttributes).length})</h5>
        <div className="skin-dev-tools__attribute-list">
          {Object.entries(inspection.currentAttributes).map(([key, value]) => (
            <div key={key} className="skin-dev-tools__attribute-item">
              <strong>{key}:</strong> {value}
            </div>
          ))}
        </div>
      </div>

      <div className="skin-dev-tools__inspector-section">
        <h5>Styles ({Object.keys(inspection.currentStyles).length})</h5>
        <div className="skin-dev-tools__style-list">
          {Object.entries(inspection.currentStyles).map(([key, value]) => (
            <div key={key} className="skin-dev-tools__style-item">
              <strong>{key}:</strong> {value}
            </div>
          ))}
        </div>
      </div>

      {inspection.validationErrors.length > 0 && (
        <div className="skin-dev-tools__inspector-section skin-dev-tools__inspector-section--errors">
          <h5>Validation Errors</h5>
          <div className="skin-dev-tools__error-list">
            {inspection.validationErrors.map((error, index) => (
              <div key={index} className="skin-dev-tools__error-item">{error}</div>
            ))}
          </div>
        </div>
      )}

      <div className="skin-dev-tools__inspector-section">
        <h5>Performance Metrics</h5>
        <div className="skin-dev-tools__metrics-grid">
          <div><strong>Render Time:</strong> {inspection.performanceMetrics.renderTime.toFixed(2)}ms</div>
          <div><strong>Style Gen:</strong> {inspection.performanceMetrics.styleGenerationTime.toFixed(2)}ms</div>
          <div><strong>Class Gen:</strong> {inspection.performanceMetrics.classGenerationTime.toFixed(2)}ms</div>
          <div><strong>Render Count:</strong> {inspection.renderCount}</div>
        </div>
      </div>
    </div>
  );
};

const PerformanceMetrics: React.FC<{
  metrics: Record<string, number>;
}> = ({ metrics }) => {
  const sortedMetrics = useMemo(() => {
    return Object.entries(metrics).sort(([, a], [, b]) => b - a);
  }, [metrics]);

  return (
    <div className="skin-dev-tools__performance-metrics">
      <h4>Performance Metrics</h4>
      <div className="skin-dev-tools__metrics-table">
        {sortedMetrics.map(([name, value]) => (
          <div key={name} className="skin-dev-tools__metric-row">
            <div className="skin-dev-tools__metric-name">{name}</div>
            <div className="skin-dev-tools__metric-value">{value.toFixed(2)}ms</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HotReloadControls: React.FC<{
  api: SkinReplacementAPI_TS003;
}> = ({ api }) => {
  const [selectedComponent, setSelectedComponent] = useState<string>('');
  const [hotReloadConfig, setHotReloadConfig] = useState<HotReloadConfig>({
    enabled: false,
    watchInterval: 1000,
    debounceMs: 100,
    validateOnReload: true,
    preserveComponentState: true,
  });

  const components = useMemo(() => {
    return api.inspectAllComponents().map(c => c.componentId);
  }, [api]);

  const handleEnableHotReload = useCallback(() => {
    if (selectedComponent) {
      api.enableHotReload(selectedComponent, hotReloadConfig);
    }
  }, [api, selectedComponent, hotReloadConfig]);

  const handleDisableHotReload = useCallback(() => {
    if (selectedComponent) {
      api.disableHotReload(selectedComponent);
    }
  }, [api, selectedComponent]);

  const handleHotReloadComponent = useCallback(() => {
    if (selectedComponent) {
      api.hotReloadComponent(selectedComponent);
    }
  }, [api, selectedComponent]);

  return (
    <div className="skin-dev-tools__hot-reload">
      <h4>Hot Reload Controls</h4>
      
      <div className="skin-dev-tools__hot-reload-controls">
        <div className="skin-dev-tools__form-group">
          <label>Component:</label>
          <select
            value={selectedComponent}
            onChange={(e) => setSelectedComponent(e.target.value)}
            className="skin-dev-tools__select"
          >
            <option value="">Select component...</option>
            {components.map(component => (
              <option key={component} value={component}>{component}</option>
            ))}
          </select>
        </div>

        <div className="skin-dev-tools__form-group">
          <label>
            <input
              type="checkbox"
              checked={hotReloadConfig.enabled}
              onChange={(e) => setHotReloadConfig(prev => ({ ...prev, enabled: e.target.checked }))}
            />
            Enabled
          </label>
        </div>

        <div className="skin-dev-tools__form-group">
          <label>Watch Interval (ms):</label>
          <input
            type="number"
            value={hotReloadConfig.watchInterval}
            onChange={(e) => setHotReloadConfig(prev => ({ ...prev, watchInterval: parseInt(e.target.value) || 1000 }))}
            className="skin-dev-tools__input"
          />
        </div>

        <div className="skin-dev-tools__form-group">
          <label>Debounce (ms):</label>
          <input
            type="number"
            value={hotReloadConfig.debounceMs}
            onChange={(e) => setHotReloadConfig(prev => ({ ...prev, debounceMs: parseInt(e.target.value) || 100 }))}
            className="skin-dev-tools__input"
          />
        </div>

        <div className="skin-dev-tools__form-group">
          <label>
            <input
              type="checkbox"
              checked={hotReloadConfig.validateOnReload}
              onChange={(e) => setHotReloadConfig(prev => ({ ...prev, validateOnReload: e.target.checked }))}
            />
            Validate on Reload
          </label>
        </div>

        <div className="skin-dev-tools__hot-reload-actions">
          <button
            onClick={handleEnableHotReload}
            disabled={!selectedComponent}
            className="skin-dev-tools__button skin-dev-tools__button--primary"
          >
            Enable Hot Reload
          </button>
          <button
            onClick={handleDisableHotReload}
            disabled={!selectedComponent}
            className="skin-dev-tools__button skin-dev-tools__button--secondary"
          >
            Disable Hot Reload
          </button>
          <button
            onClick={handleHotReloadComponent}
            disabled={!selectedComponent}
            className="skin-dev-tools__button skin-dev-tools__button--accent"
          >
            Reload Now
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN DEV TOOLS COMPONENT
// ============================================================================

const SkinDevTools_TS003: React.FC<SkinDevTools_TS003Props> = ({
  showAdvanced = false,
  enableDebug = true,
  showPerformance = true,
  showHotReload = true,
  showInspection = true,
  showTelemetry = false,
  showReplacementAPI = true,
  showRegistry = false,
  maxDebugEntries = 50,
  updateInterval = 1000,
  className = '',
}) => {
  const api = useMemo(() => getSkinReplacementAPI_TS003(), []);
  const [skinState, setSkinState] = useState<SkinState | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string>('');
  const [componentInspection, setComponentInspection] = useState<SkinInspectionResult | null>(null);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<string>('state');

  // Update data periodically
  useEffect(() => {
    const updateData = () => {
      try {
        setSkinState(api.getCurrentState());
        setDebugLogs(api.getDebugLog(maxDebugEntries));
        setPerformanceMetrics(api.getPerformanceMetrics());
        
        if (selectedComponent) {
          const inspection = api.inspectComponent(selectedComponent);
          setComponentInspection(inspection);
        }
      } catch (error) {
        console.error('Error updating dev tools data:', error);
      }
    };

    updateData();
    const interval = setInterval(updateData, updateInterval);

    return () => clearInterval(interval);
  }, [api, selectedComponent, maxDebugEntries, updateInterval]);

  // Replacement controls
  const handleReplacePreset = useCallback(async (presetId: SkinPresetId) => {
    await api.replacePreset(presetId, { animate: true, validate: true });
  }, [api]);

  const handleReplacePillar = useCallback(async (pillar: StyleLabPillar) => {
    await api.replacePillar(pillar, { animate: true });
  }, [api]);

  const handleReplaceMotionLevel = useCallback(async (motionLevel: MotionLevel) => {
    await api.replaceMotionLevel(motionLevel, { animate: true });
  }, [api]);

  // Export/Import controls
  const handleExportState = useCallback(() => {
    const stateJson = api.exportSkinState();
    const blob = new Blob([stateJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skin-state-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [api]);

  const handleImportState = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const text = await file.text();
      await api.importSkinState(text);
    }
  }, [api]);

  if (!skinState) {
    return <div className="skin-dev-tools skin-dev-tools--loading">Loading...</div>;
  }

  return (
    <div className={`skin-dev-tools ${className}`}>
      <div className="skin-dev-tools__header">
        <h3>Skin Dev Tools TS-003</h3>
        <div className="skin-dev-tools__header-actions">
          <button onClick={handleExportState} className="skin-dev-tools__button skin-dev-tools__button--small">
            Export State
          </button>
          <label className="skin-dev-tools__button skin-dev-tools__button--small">
            Import State
            <input
              type="file"
              accept=".json"
              onChange={handleImportState}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className="skin-dev-tools__tabs">
        <button
          className={`skin-dev-tools__tab ${activeTab === 'state' ? 'skin-dev-tools__tab--active' : ''}`}
          onClick={() => setActiveTab('state')}
        >
          State
        </button>
        {showReplacementAPI && (
          <button
            className={`skin-dev-tools__tab ${activeTab === 'replacement' ? 'skin-dev-tools__tab--active' : ''}`}
            onClick={() => setActiveTab('replacement')}
          >
            Replacement API
          </button>
        )}
        {showInspection && (
          <button
            className={`skin-dev-tools__tab ${activeTab === 'inspection' ? 'skin-dev-tools__tab--active' : ''}`}
            onClick={() => setActiveTab('inspection')}
          >
            Inspection
          </button>
        )}
        {showHotReload && (
          <button
            className={`skin-dev-tools__tab ${activeTab === 'hotreload' ? 'skin-dev-tools__tab--active' : ''}`}
            onClick={() => setActiveTab('hotreload')}
          >
            Hot Reload
          </button>
        )}
        {showPerformance && (
          <button
            className={`skin-dev-tools__tab ${activeTab === 'performance' ? 'skin-dev-tools__tab--active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </button>
        )}
        {enableDebug && (
          <button
            className={`skin-dev-tools__tab ${activeTab === 'debug' ? 'skin-dev-tools__tab--active' : ''}`}
            onClick={() => setActiveTab('debug')}
          >
            Debug Log
          </button>
        )}
      </div>

      <div className="skin-dev-tools__content">
        {activeTab === 'state' && (
          <div className="skin-dev-tools__state">
            <h4>Current Skin State</h4>
            <div className="skin-dev-tools__state-grid">
              <div>
                <label>Preset:</label>
                <select
                  value={skinState.currentPreset}
                  onChange={(e) => handleReplacePreset(e.target.value as SkinPresetId)}
                  className="skin-dev-tools__select"
                >
                  <option value="minimal-frontier">Minimal Frontier</option>
                  <option value="minimal-wilderness">Minimal Wilderness</option>
                  <option value="minimal-empire">Minimal Empire</option>
                  <option value="wanderlust">Wanderlust</option>
                  <option value="arcane-tech">Arcane Tech</option>
                  <option value="gilded-observatory">Gilded Observatory</option>
                </select>
              </div>
              <div>
                <label>Pillar:</label>
                <select
                  value={skinState.currentPillar}
                  onChange={(e) => handleReplacePillar(e.target.value as StyleLabPillar)}
                  className="skin-dev-tools__select"
                >
                  <option value="frontier">Frontier</option>
                  <option value="wilderness">Wilderness</option>
                  <option value="empire">Empire</option>
                </select>
              </div>
              <div>
                <label>Motion:</label>
                <select
                  value={skinState.currentMotionLevel}
                  onChange={(e) => handleReplaceMotionLevel(e.target.value as MotionLevel)}
                  className="skin-dev-tools__select"
                >
                  <option value="minimal">Minimal</option>
                  <option value="reduced">Reduced</option>
                  <option value="full">Full</option>
                </select>
              </div>
              <div>
                <label>Transitioning:</label>
                <span className={`skin-dev-tools__status ${skinState.isTransitioning ? 'skin-dev-tools__status--active' : ''}`}>
                  {skinState.isTransitioning ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <label>Components:</label>
                <span>{Object.keys(skinState.activeBindings).length}</span>
              </div>
              <div>
                <label>Updates:</label>
                <span>{skinState.updateCount}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inspection' && (
          <div className="skin-dev-tools__inspection">
            <div className="skin-dev-tools__inspection-header">
              <h4>Component Inspection</h4>
              <select
                value={selectedComponent}
                onChange={(e) => setSelectedComponent(e.target.value)}
                className="skin-dev-tools__select"
              >
                <option value="">Select component...</option>
                {Object.keys(skinState.activeBindings).map(componentId => (
                  <option key={componentId} value={componentId}>{componentId}</option>
                ))}
              </select>
            </div>
            
            {componentInspection ? (
              <ComponentInspector inspection={componentInspection} />
            ) : (
              <div className="skin-dev-tools__no-selection">Select a component to inspect</div>
            )}
          </div>
        )}

        {activeTab === 'hotreload' && showHotReload && (
          <HotReloadControls api={api} />
        )}

        {activeTab === 'performance' && showPerformance && (
          <PerformanceMetrics metrics={performanceMetrics} />
        )}

        {activeTab === 'debug' && enableDebug && (
          <DebugLogViewer logs={debugLogs} maxEntries={maxDebugEntries} />
        )}
      </div>
    </div>
  );
};

SkinDevTools_TS003.displayName = 'SkinDevTools_TS003';

export default SkinDevTools_TS003;
