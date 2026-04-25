/**
 * Skin Dev Tools Panel
 * 
 * Development tools panel for skin system management, testing, and debugging.
 * Provides UI controls for skin operations, replacement API access, and system monitoring.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useSkinSystem } from '../hooks/useSkinSystem';
import { getSkinReplacementAPI, SkinReplacementAPI } from './SkinReplacementAPI';
import { getSkinRegistryManager } from './SkinRegistry';

// Define types locally to avoid import issues
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

interface SkinPresetConfig {
  id: SkinPresetId;
  name: string;
  description: string;
  category: string;
  colors: Record<string, string>;
  animations: Record<string, any>;
  components: Record<string, any>;
}

// ============================================================================
// DEV TOOLS COMPONENTS
// ============================================================================

interface SkinDevToolsProps {
  /**
   * Whether to show advanced options
   * @default false
   */
  showAdvanced?: boolean;
  
  /**
   * Whether to enable debug mode
   * @default false
   */
  enableDebug?: boolean;
  
  /**
   * Custom className
   */
  className?: string;
  
  /**
   * Panel title
   * @default "Skin Dev Tools"
   */
  title?: string;
  
  /**
   * Whether to show telemetry section
   * @default true
   */
  showTelemetry?: boolean;
  
  /**
   * Whether to show replacement API section
   * @default true
   */
  showReplacementAPI?: boolean;
  
  /**
   * Whether to show registry section
   * @default true
   */
  showRegistry?: boolean;
}

interface PresetSelectorProps {
  value: SkinPresetId;
  onChange: (presetId: SkinPresetId) => void;
  presets: SkinPresetConfig[];
  disabled?: boolean;
  label?: string;
}

interface PillarSelectorProps {
  value: StyleLabPillar;
  onChange: (pillar: StyleLabPillar) => void;
  supportedPillars: StyleLabPillar[];
  disabled?: boolean;
  label?: string;
}

interface MotionSelectorProps {
  value: MotionLevel;
  onChange: (motionLevel: MotionLevel) => void;
  supportedMotionLevels: MotionLevel[];
  disabled?: boolean;
  label?: string;
}

interface TelemetryPanelProps {
  showEvents?: boolean;
  maxEvents?: number;
}

interface ReplacementAPIPanelProps {
  api: SkinReplacementAPI;
  showHistory?: boolean;
  showRules?: boolean;
}

interface RegistryPanelProps {
  showStats?: boolean;
  showPresets?: boolean;
  showComponents?: boolean;
}

// ============================================================================
// PRESET SELECTOR COMPONENT
// ============================================================================

const PresetSelector: React.FC<PresetSelectorProps> = ({
  value,
  onChange,
  presets,
  disabled = false,
  label = "Preset",
}) => {
  return (
    <div className="skin-dev-tools-field">
      <label className="skin-dev-tools-label">{label}:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SkinPresetId)}
        disabled={disabled}
        className="skin-dev-tools-select"
      >
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name} ({preset.id})
            {preset.isDefault && ' [default]'}
            {preset.isExperimental && ' [experimental]'}
          </option>
        ))}
      </select>
    </div>
  );
};

// ============================================================================
// PILLAR SELECTOR COMPONENT
// ============================================================================

const PillarSelector: React.FC<PillarSelectorProps> = ({
  value,
  onChange,
  supportedPillars,
  disabled = false,
  label = "Pillar",
}) => {
  return (
    <div className="skin-dev-tools-field">
      <label className="skin-dev-tools-label">{label}:</label>
      <div className="skin-dev-tools-pillar-group">
        {supportedPillars.map((pillar) => (
          <button
            key={pillar}
            onClick={() => onChange(pillar)}
            disabled={disabled}
            className={`skin-dev-tools-pillar-btn ${
              value === pillar ? 'active' : ''
            }`}
            data-pillar={pillar}
          >
            {pillar}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MOTION SELECTOR COMPONENT
// ============================================================================

const MotionSelector: React.FC<MotionSelectorProps> = ({
  value,
  onChange,
  supportedMotionLevels,
  disabled = false,
  label = "Motion",
}) => {
  return (
    <div className="skin-dev-tools-field">
      <label className="skin-dev-tools-label">{label}:</label>
      <div className="skin-dev-tools-motion-group">
        {supportedMotionLevels.map((motion) => (
          <button
            key={motion}
            onClick={() => onChange(motion)}
            disabled={disabled}
            className={`skin-dev-tools-motion-btn ${
              value === motion ? 'active' : ''
            }`}
            data-motion={motion}
          >
            {motion}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// TELEMETRY PANEL COMPONENT
// ============================================================================

const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  showEvents = true,
  maxEvents = 10,
}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [isTracking, setIsTracking] = useState(true);

  useEffect(() => {
    if (!isTracking) return;

    // Mock telemetry subscription - in real implementation, this would connect to actual telemetry
    const interval = setInterval(() => {
      setEvents(prev => {
        const newEvent = {
          id: Math.random().toString(36),
          type: 'skin_preset_changed',
          timestamp: new Date().toISOString(),
          data: {
            previousPreset: 'minimal-frontier',
            newPreset: 'wanderlust',
            reason: 'manual',
          },
        };
        
        const updated = [newEvent, ...prev];
        return updated.slice(0, maxEvents);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isTracking, maxEvents]);

  return (
    <div className="skin-dev-tools-section">
      <div className="skin-dev-tools-section-header">
        <h4>Telemetry</h4>
        <button
          onClick={() => setIsTracking(!isTracking)}
          className={`skin-dev-tools-toggle-btn ${isTracking ? 'active' : ''}`}
        >
          {isTracking ? 'Tracking' : 'Paused'}
        </button>
      </div>
      
      {showEvents && (
        <div className="skin-dev-tools-events">
          {events.length === 0 ? (
            <div className="skin-dev-tools-empty">No events yet</div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="skin-dev-tools-event">
                <div className="skin-dev-tools-event-type">{event.type}</div>
                <div className="skin-dev-tools-event-time">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
                <div className="skin-dev-tools-event-data">
                  {JSON.stringify(event.data, null, 2)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// REPLACEMENT API PANEL COMPONENT
// ============================================================================

const ReplacementAPIPanel: React.FC<ReplacementAPIPanelProps> = ({
  api,
  showHistory = true,
  showRules = true,
}) => {
  const [targetPreset, setTargetPreset] = useState<SkinPresetId>('minimal-frontier');
  const [targetPillar, setTargetPillar] = useState<StyleLabPillar>('frontier');
  const [targetMotion, setTargetMotion] = useState<MotionLevel>('full');
  const [isReplacing, setIsReplacing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const {
    state,
    getAllPresets,
  } = useSkinSystem();

  const presets = getAllPresets();
  const history = api.getHistory();
  const sessionStats = api.getSessionStats();

  const handleReplacePreset = useCallback(async () => {
    setIsReplacing(true);
    try {
      const result = await api.replacePreset(targetPreset, {
        animateTransition: true,
        trackTelemetry: true,
        metadata: {
          reason: 'dev-tools',
          source: 'skin-dev-tools',
        },
      });
      setLastResult(result);
    } catch (error) {
      setLastResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsReplacing(false);
    }
  }, [api, targetPreset]);

  const handleReplacePillar = useCallback(async () => {
    setIsReplacing(true);
    try {
      const result = await api.replacePillar(targetPillar, {
        animateTransition: true,
        trackTelemetry: true,
        metadata: {
          reason: 'dev-tools',
          source: 'skin-dev-tools',
        },
      });
      setLastResult(result);
    } catch (error) {
      setLastResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsReplacing(false);
    }
  }, [api, targetPillar]);

  const handleReplaceMotion = useCallback(async () => {
    setIsReplacing(true);
    try {
      const result = await api.replaceMotionLevel(targetMotion, {
        animateTransition: true,
        trackTelemetry: true,
        metadata: {
          reason: 'dev-tools',
          source: 'skin-dev-tools',
        },
      });
      setLastResult(result);
    } catch (error) {
      setLastResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsReplacing(false);
    }
  }, [api, targetMotion]);

  const handleUndo = useCallback(async () => {
    setIsReplacing(true);
    try {
      const result = await api.undoLastReplacement();
      setLastResult(result);
    } catch (error) {
      setLastResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsReplacing(false);
    }
  }, [api]);

  const handleClearHistory = useCallback(() => {
    api.clearHistory();
    setLastResult({ success: true, message: 'History cleared' });
  }, [api]);

  return (
    <div className="skin-dev-tools-section">
      <div className="skin-dev-tools-section-header">
        <h4>Replacement API</h4>
        <div className="skin-dev-tools-stats">
          <span>{sessionStats.totalReplacements} replacements</span>
        </div>
      </div>

      {/* Current State */}
      <div className="skin-dev-tools-current-state">
        <h5>Current State</h5>
        <div className="skin-dev-tools-state-display">
          <div>Preset: {state.currentPreset}</div>
          <div>Pillar: {state.currentPillar}</div>
          <div>Motion: {state.currentMotionLevel}</div>
          <div>Transitioning: {state.isTransitioning ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* Replacement Controls */}
      <div className="skin-dev-tools-replacement-controls">
        <h5>Replace With</h5>
        
        <PresetSelector
          value={targetPreset}
          onChange={setTargetPreset}
          presets={presets}
          disabled={isReplacing}
          label="Target Preset"
        />
        
        <PillarSelector
          value={targetPillar}
          onChange={setTargetPillar}
          supportedPillars={['frontier', 'wilderness', 'empire']}
          disabled={isReplacing}
          label="Target Pillar"
        />
        
        <MotionSelector
          value={targetMotion}
          onChange={setTargetMotion}
          supportedMotionLevels={['minimal', 'reduced', 'full']}
          disabled={isReplacing}
          label="Target Motion"
        />

        <div className="skin-dev-tools-action-buttons">
          <button
            onClick={handleReplacePreset}
            disabled={isReplacing || targetPreset === state.currentPreset}
            className="skin-dev-tools-action-btn"
          >
            Replace Preset
          </button>
          
          <button
            onClick={handleReplacePillar}
            disabled={isReplacing || targetPillar === state.currentPillar}
            className="skin-dev-tools-action-btn"
          >
            Replace Pillar
          </button>
          
          <button
            onClick={handleReplaceMotion}
            disabled={isReplacing || targetMotion === state.currentMotionLevel}
            className="skin-dev-tools-action-btn"
          >
            Replace Motion
          </button>
          
          <button
            onClick={handleUndo}
            disabled={isReplacing || history.length === 0}
            className="skin-dev-tools-action-btn secondary"
          >
            Undo Last
          </button>
          
          <button
            onClick={handleClearHistory}
            disabled={isReplacing || history.length === 0}
            className="skin-dev-tools-action-btn secondary"
          >
            Clear History
          </button>
        </div>
      </div>

      {/* Last Result */}
      {lastResult && (
        <div className="skin-dev-tools-result">
          <h5>Last Result</h5>
          <div className={`skin-dev-tools-result-content ${
            lastResult.success ? 'success' : 'error'
          }`}>
            <div>Status: {lastResult.success ? 'Success' : 'Failed'}</div>
            {lastResult.error && <div>Error: {lastResult.error}</div>}
            {lastResult.message && <div>Message: {lastResult.message}</div>}
            {lastResult.metadata && (
              <div>Duration: {lastResult.metadata.duration.toFixed(2)}ms</div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {showHistory && history.length > 0 && (
        <div className="skin-dev-tools-history">
          <h5>Replacement History</h5>
          <div className="skin-dev-tools-history-list">
            {history.slice(0, 5).map((entry) => (
              <div key={entry.id} className="skin-dev-tools-history-item">
                <div className="skin-dev-tools-history-time">
                  {new Date(entry.result.metadata.timestamp).toLocaleTimeString()}
                </div>
                <div className="skin-dev-tools-history-change">
                  {entry.result.previousState.presetId} → {entry.result.newState.presetId}
                </div>
                <div className="skin-dev-tools-history-status">
                  {entry.result.success ? '✓' : '✗'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// REGISTRY PANEL COMPONENT
// ============================================================================

const RegistryPanel: React.FC<RegistryPanelProps> = ({
  showStats = true,
  showPresets = true,
  showComponents = true,
}) => {
  const registry = getSkinRegistryManager();
  
  const [stats, setStats] = useState<any>(null);
  const [presets, setPresets] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);

  useEffect(() => {
    // Mock registry data - in real implementation, this would use actual registry
    setStats({
      totalPresets: 6,
      totalComponents: 12,
      totalBindings: 24,
      lastUpdated: new Date().toISOString(),
    });
    
    setPresets([
      { id: 'minimal-frontier', name: 'Minimal Frontier', category: 'minimal' },
      { id: 'wanderlust', name: 'Wanderlust', category: 'themed' },
      { id: 'arcane-tech', name: 'Arcane Tech', category: 'experimental' },
    ]);
    
    setComponents([
      { id: 'PgCard', name: 'PgCard', category: 'interactive' },
      { id: 'ActivitySlot', name: 'ActivitySlot', category: 'container' },
      { id: 'HUD', name: 'HUD', category: 'display' },
    ]);
  }, []);

  return (
    <div className="skin-dev-tools-section">
      <div className="skin-dev-tools-section-header">
        <h4>Registry</h4>
      </div>

      {showStats && stats && (
        <div className="skin-dev-tools-registry-stats">
          <h5>Statistics</h5>
          <div className="skin-dev-tools-stats-grid">
            <div className="skin-dev-tools-stat-item">
              <div className="skin-dev-tools-stat-value">{stats.totalPresets}</div>
              <div className="skin-dev-tools-stat-label">Presets</div>
            </div>
            <div className="skin-dev-tools-stat-item">
              <div className="skin-dev-tools-stat-value">{stats.totalComponents}</div>
              <div className="skin-dev-tools-stat-label">Components</div>
            </div>
            <div className="skin-dev-tools-stat-item">
              <div className="skin-dev-tools-stat-value">{stats.totalBindings}</div>
              <div className="skin-dev-tools-stat-label">Bindings</div>
            </div>
          </div>
        </div>
      )}

      {showPresets && (
        <div className="skin-dev-tools-presets">
          <h5>Registered Presets</h5>
          <div className="skin-dev-tools-list">
            {presets.map((preset) => (
              <div key={preset.id} className="skin-dev-tools-list-item">
                <div className="skin-dev-tools-item-name">{preset.name}</div>
                <div className="skin-dev-tools-item-id">{preset.id}</div>
                <div className="skin-dev-tools-item-category">{preset.category}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showComponents && (
        <div className="skin-dev-tools-components">
          <h5>Registered Components</h5>
          <div className="skin-dev-tools-list">
            {components.map((component) => (
              <div key={component.id} className="skin-dev-tools-list-item">
                <div className="skin-dev-tools-item-name">{component.name}</div>
                <div className="skin-dev-tools-item-id">{component.id}</div>
                <div className="skin-dev-tools-item-category">{component.category}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN DEV TOOLS COMPONENT
// ============================================================================

export const SkinDevTools: React.FC<SkinDevToolsProps> = ({
  showAdvanced = false,
  enableDebug = false,
  className,
  title = "Skin Dev Tools",
  showTelemetry = true,
  showReplacementAPI = true,
  showRegistry = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('controls');
  
  const {
    state,
    setPreset,
    setPillar,
    setMotionLevel,
    getAllPresets,
    validateState,
  } = useSkinSystem();

  const replacementAPI = useMemo(() => getSkinReplacementAPI(), []);
  const presets = getAllPresets();
  const validation = validateState();

  const tabs = [
    { id: 'controls', label: 'Controls' },
    ...(showTelemetry ? [{ id: 'telemetry', label: 'Telemetry' }] : []),
    ...(showReplacementAPI ? [{ id: 'replacement', label: 'Replacement API' }] : []),
    ...(showRegistry ? [{ id: 'registry', label: 'Registry' }] : []),
    ...(showAdvanced ? [{ id: 'advanced', label: 'Advanced' }] : []),
  ];

  if (enableDebug && process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={`skin-dev-tools ${className || ''}`}>
      <div className="skin-dev-tools-header">
        <h3>{title}</h3>
        <div className="skin-dev-tools-header-controls">
          <div className="skin-dev-tools-status">
            <span className={`skin-dev-tools-status-indicator ${
              validation.isValid ? 'valid' : 'invalid'
            }`} />
            {validation.isValid ? 'Valid' : 'Invalid'}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="skin-dev-tools-expand-btn"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="skin-dev-tools-content">
          {/* Tab Navigation */}
          <div className="skin-dev-tools-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`skin-dev-tools-tab ${
                  activeTab === tab.id ? 'active' : ''
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="skin-dev-tools-tab-content">
            {activeTab === 'controls' && (
              <div className="skin-dev-tools-section">
                <h4>Skin Controls</h4>
                
                <PresetSelector
                  value={state.currentPreset}
                  onChange={setPreset}
                  presets={presets}
                  label="Current Preset"
                />
                
                <PillarSelector
                  value={state.currentPillar}
                  onChange={setPillar}
                  supportedPillars={['frontier', 'wilderness', 'empire']}
                  label="Current Pillar"
                />
                
                <MotionSelector
                  value={state.currentMotionLevel}
                  onChange={setMotionLevel}
                  supportedMotionLevels={['minimal', 'reduced', 'full']}
                  label="Current Motion"
                />

                {/* Validation Status */}
                <div className="skin-dev-tools-validation">
                  <h5>Validation Status</h5>
                  <div className={`skin-dev-tools-validation-result ${
                    validation.isValid ? 'valid' : 'invalid'
                  }`}>
                    {validation.isValid ? (
                      <div>✓ All validations passed</div>
                    ) : (
                      <div>
                        <div>✗ Validation failed</div>
                        {validation.errors.map((error, index) => (
                          <div key={index} className="skin-dev-tools-validation-error">
                            {error.message || error}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'telemetry' && showTelemetry && (
              <TelemetryPanel showEvents={true} maxEvents={10} />
            )}

            {activeTab === 'replacement' && showReplacementAPI && (
              <ReplacementAPIPanel 
                api={replacementAPI} 
                showHistory={true} 
                showRules={showAdvanced}
              />
            )}

            {activeTab === 'registry' && showRegistry && (
              <RegistryPanel 
                showStats={true} 
                showPresets={true} 
                showComponents={true}
              />
            )}

            {activeTab === 'advanced' && showAdvanced && (
              <div className="skin-dev-tools-section">
                <h4>Advanced Options</h4>
                
                <div className="skin-dev-tools-advanced">
                  <div className="skin-dev-tools-field">
                    <label className="skin-dev-tools-label">Debug Mode:</label>
                    <button className="skin-dev-tools-toggle-btn">
                      {enableDebug ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  
                  <div className="skin-dev-tools-field">
                    <label className="skin-dev-tools-label">Session ID:</label>
                    <div className="skin-dev-tools-session-id">
                      {replacementAPI.getSessionStats().sessionId}
                    </div>
                  </div>
                  
                  <div className="skin-dev-tools-field">
                    <label className="skin-dev-tools-label">Component Count:</label>
                    <div className="skin-dev-tools-component-count">
                      {Object.keys(state.activeBindings).length}
                    </div>
                  </div>
                  
                  <div className="skin-dev-tools-field">
                    <label className="skin-dev-tools-label">Update Count:</label>
                    <div className="skin-dev-tools-update-count">
                      {state.updateCount}
                    </div>
                  </div>
                  
                  <div className="skin-dev-tools-field">
                    <label className="skin-dev-tools-label">Last Updated:</label>
                    <div className="skin-dev-tools-last-updated">
                      {new Date(state.lastUpdated).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkinDevTools;
