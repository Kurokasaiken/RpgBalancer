/**
 * WL-STY-010: ActivityCapsule Skin Integration Examples (TS-Series Integration)
 * 
 * Comprehensive examples demonstrating ActivityCapsule skin integration with
 * the TS-Series system. Includes basic usage, advanced customization,
 * theme switching, motion level adaptation, and development tools.
 * 
 * Dependencies: TS-001 (SkinSchema), TS-002 (SkinSlot), ActivityCapsuleSkinAware
 * Integration: useActivityCapsuleSkin, ActivityCapsuleSkinPresets, telemetry
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ActivityCapsuleSkinAware } from './ActivityCapsuleSkinAware';
import { useActivityCapsuleSkin, useActivityCapsuleSkinBasic, useActivityCapsuleSkinDev } from './useActivityCapsuleSkin';
import { 
  ACTIVITY_CAPSULE_SKIN_PRESETS,
  ACTIVITY_CAPSULE_SKIN_THEMES,
  getActivityCapsuleSkinPreset,
  getActivityCapsuleSkinTheme,
  searchActivityCapsuleSkinPresets,
  getRecommendedActivityCapsuleSkinPresets,
} from './ActivityCapsuleSkinPresets';
import type { 
  StyleLabPillar, 
  SkinPresetId,
  MotionLevel,
  ActivitySlotData
} from '../SkinSchema';

// ============================================================================
// EXAMPLE DATA
// ============================================================================

const EXAMPLE_SLOTS: ActivitySlotData[] = [
  { slotId: 'slot-1', assignedWorkerName: 'Alice', assignedWorkerAvatarUrl: '/avatars/alice.jpg', isOccupied: true, isLocked: false },
  { slotId: 'slot-2', assignedWorkerName: 'Bob', assignedWorkerAvatarUrl: '/avatars/bob.jpg', isOccupied: true, isLocked: false },
  { slotId: 'slot-3', assignedWorkerName: null, assignedWorkerAvatarUrl: null, isOccupied: false, isLocked: false },
];

const EXAMPLE_SLOTS_FULL: ActivitySlotData[] = [
  { slotId: 'slot-1', assignedWorkerName: 'Alice', assignedWorkerAvatarUrl: '/avatars/alice.jpg', isOccupied: true, isLocked: false },
  { slotId: 'slot-2', assignedWorkerName: 'Bob', assignedWorkerAvatarUrl: '/avatars/bob.jpg', isOccupied: true, isLocked: false },
  { slotId: 'slot-3', assignedWorkerName: 'Charlie', assignedWorkerAvatarUrl: '/avatars/charlie.jpg', isOccupied: true, isLocked: false },
  { slotId: 'slot-4', assignedWorkerName: null, assignedWorkerAvatarUrl: null, isOccupied: false, isLocked: false },
];

// ============================================================================
// BASIC USAGE EXAMPLE
// ============================================================================

export function BasicActivityCapsuleExample() {
  const [status, setStatus] = useState<'idle' | 'in-progress' | 'completed' | 'blocked'>('idle');
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  
  // Basic skin hook with default configuration
  const skin = useActivityCapsuleSkinBasic('basic-example', 'frontier');
  
  // Simulate progress
  React.useEffect(() => {
    if (status === 'in-progress') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 1) {
            setStatus('completed');
            return 1;
          }
          return prev + 0.1;
        });
        setElapsed(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [status]);
  
  const handleCollect = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setElapsed(0);
  }, []);
  
  return (
    <div className="example-container">
      <h3>Basic ActivityCapsule with TS-Series Skin</h3>
      <p>Using default frontier preset with automatic skin binding</p>
      
      <ActivityCapsuleSkinAware
        activityId="basic-example"
        label="Basic Example Activity"
        subtitle="Demonstrates TS-Series integration"
        slots={EXAMPLE_SLOTS}
        maxSlots={3}
        progressFraction={progress}
        elapsedSeconds={elapsed}
        totalDurationSeconds={10}
        status={status}
        canCollect={status === 'completed'}
        onCollect={handleCollect}
        skinBindingId="basic-example-binding"
        dataTestId="basic-activity-capsule"
      />
      
      <div className="example-controls">
        <button onClick={() => setStatus('in-progress')}>Start Activity</button>
        <button onClick={() => setStatus('completed')}>Complete Activity</button>
        <button onClick={() => setStatus('blocked')}>Block Activity</button>
        <button onClick={() => setStatus('idle')}>Reset Activity</button>
      </div>
      
      <div className="example-debug">
        <h4>Skin Debug Info:</h4>
        <pre>{JSON.stringify({
          presetId: skin.config.presetId,
          pillar: skin.config.pillar,
          motionLevel: skin.config.motionLevel,
          isBound: skin.isBound,
          isValid: skin.isValid,
          renderCount: skin.renderCount,
        }, null, 2)}</pre>
      </div>
    </div>
  );
}

// ============================================================================
// ADVANCED CUSTOMIZATION EXAMPLE
// ============================================================================

export function AdvancedActivityCapsuleExample() {
  const [status, setStatus] = useState<'idle' | 'in-progress' | 'completed' | 'blocked'>('idle');
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<SkinPresetId>('wanderlust');
  const [selectedPillar, setSelectedPillar] = useState<StyleLabPillar>('wilderness');
  const [motionLevel, setMotionLevel] = useState<MotionLevel>('full');
  
  // Advanced skin hook with custom configuration
  const skin = useActivityCapsuleSkin({
    componentId: 'advanced-example',
    initialPresetId: selectedPreset,
    initialPillar: selectedPillar,
    initialMotionLevel: motionLevel,
    enableSkinBinding: true,
    bindingPriority: 'high',
    enableValidation: true,
    validationMode: 'strict',
    enableHotReload: true,
    enablePerformanceOptimization: true,
    enableDevTools: true,
    enableDebugMode: true,
    logSkinChanges: true,
  });
  
  // Update skin when selections change
  React.useEffect(() => {
    skin.updatePresetId(selectedPreset);
    skin.updatePillar(selectedPillar);
    skin.updateMotionLevel(motionLevel);
  }, [selectedPreset, selectedPillar, motionLevel, skin]);
  
  // Simulate progress
  React.useEffect(() => {
    if (status === 'in-progress') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 1) {
            setStatus('completed');
            return 1;
          }
          return prev + 0.05;
        });
        setElapsed(prev => prev + 1);
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [status]);
  
  const handleCollect = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setElapsed(0);
  }, []);
  
  const handleHotReload = useCallback(async () => {
    await skin.hotReload();
  }, [skin]);
  
  const handleExportConfig = useCallback(() => {
    const config = skin.exportConfig();
    navigator.clipboard.writeText(config);
    alert('Configuration exported to clipboard!');
  }, [skin]);
  
  const handleImportConfig = useCallback(() => {
    const config = prompt('Paste configuration:');
    if (config) {
      const success = skin.importConfig(config);
      if (success) {
        alert('Configuration imported successfully!');
      } else {
        alert('Failed to import configuration!');
      }
    }
  }, [skin]);
  
  return (
    <div className="example-container">
      <h3>Advanced ActivityCapsule with Custom TS-Series Skin</h3>
      <p>Demonstrates advanced customization, validation, and hot-reloading</p>
      
      {/* Skin Controls */}
      <div className="skin-controls">
        <div className="control-group">
          <label>Preset:</label>
          <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value as SkinPresetId)}>
            {Object.keys(ACTIVITY_CAPSULE_SKIN_PRESETS).map(presetId => (
              <option key={presetId} value={presetId}>{presetId}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Pillar:</label>
          <select value={selectedPillar} onChange={(e) => setSelectedPillar(e.target.value as StyleLabPillar)}>
            <option value="frontier">Frontier</option>
            <option value="wilderness">Wilderness</option>
            <option value="empire">Empire</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Motion Level:</label>
          <select value={motionLevel} onChange={(e) => setMotionLevel(e.target.value as MotionLevel)}>
            <option value="minimal">Minimal</option>
            <option value="reduced">Reduced</option>
            <option value="full">Full</option>
          </select>
        </div>
      </div>
      
      {/* Activity Capsule */}
      <ActivityCapsuleSkinAware
        activityId="advanced-example"
        label="Advanced Example Activity"
        subtitle="Custom TS-Series skin with validation"
        helperText="Demonstrates advanced skin features"
        slots={EXAMPLE_SLOTS_FULL}
        maxSlots={4}
        progressFraction={progress}
        elapsedSeconds={elapsed}
        totalDurationSeconds={20}
        status={status}
        canCollect={status === 'completed'}
        onCollect={handleCollect}
        skinPresetId={selectedPreset}
        pillar={selectedPillar}
        motionLevel={motionLevel}
        enableSkinBinding={true}
        skinBindingId="advanced-example-binding"
        enableDevTools={true}
        onValidationError={(errors) => console.error('Validation errors:', errors)}
        onSkinChange={(config) => console.log('Skin changed:', config)}
        dataTestId="advanced-activity-capsule"
      />
      
      {/* Activity Controls */}
      <div className="example-controls">
        <button onClick={() => setStatus('in-progress')}>Start Activity</button>
        <button onClick={() => setStatus('completed')}>Complete Activity</button>
        <button onClick={() => setStatus('blocked')}>Block Activity</button>
        <button onClick={() => setStatus('idle')}>Reset Activity</button>
      </div>
      
      {/* Skin Tools */}
      <div className="skin-tools">
        <button onClick={handleHotReload}>Hot Reload</button>
        <button onClick={handleExportConfig}>Export Config</button>
        <button onClick={handleImportConfig}>Import Config</button>
        <button onClick={() => skin.reset()}>Reset Skin</button>
        <button onClick={() => skin.rebind()}>Rebind Skin</button>
      </div>
      
      {/* Debug Information */}
      <div className="example-debug">
        <h4>Advanced Debug Info:</h4>
        <pre>{JSON.stringify(skin.generateDebugInfo(), null, 2)}</pre>
      </div>
    </div>
  );
}

// ============================================================================
// THEME SWITCHING EXAMPLE
// ============================================================================

export function ThemeSwitchingExample() {
  const [status, setStatus] = useState<'idle' | 'in-progress' | 'completed' | 'blocked'>('idle');
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState('minimal');
  const [selectedPreset, setSelectedPreset] = useState('minimal-frontier');
  
  const skin = useActivityCapsuleSkinBasic('theme-example');
  
  // Get theme presets
  const theme = getActivityCapsuleSkinTheme(selectedTheme);
  const themePresets = theme ? Object.values(theme.presets) : [];
  
  // Update preset when theme changes
  React.useEffect(() => {
    if (theme && !theme.presets[selectedPreset as SkinPresetId]) {
      const firstPreset = Object.keys(theme.presets)[0] as SkinPresetId;
      setSelectedPreset(firstPreset);
    }
  }, [selectedTheme, selectedPreset, theme]);
  
  // Simulate progress
  React.useEffect(() => {
    if (status === 'in-progress') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 1) {
            setStatus('completed');
            return 1;
          }
          return prev + 0.08;
        });
        setElapsed(prev => prev + 1);
      }, 800);
      
      return () => clearInterval(interval);
    }
  }, [status]);
  
  const handleCollect = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setElapsed(0);
  }, []);
  
  return (
    <div className="example-container">
      <h3>Theme Switching Example</h3>
      <p>Demonstrates preset themes with coordinated visual identities</p>
      
      {/* Theme Controls */}
      <div className="theme-controls">
        <div className="control-group">
          <label>Theme:</label>
          <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
            {Object.keys(ACTIVITY_CAPSULE_SKIN_THEMES).map(themeId => (
              <option key={themeId} value={themeId}>{themeId}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Preset:</label>
          <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)}>
            {themePresets.map(preset => (
              <option key={preset.id} value={preset.id}>{preset.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Theme Description */}
      {theme && (
        <div className="theme-description">
          <h4>{theme.name}</h4>
          <p>{theme.description}</p>
          <div className="theme-info">
            <span>Presets: {Object.keys(theme.presets).length}</span>
            <span>Pillars: {Object.keys(theme.pillarVariants).length}</span>
            <span>Motion Levels: {Object.keys(theme.motionAdaptations).length}</span>
          </div>
        </div>
      )}
      
      {/* Activity Capsule */}
      <ActivityCapsuleSkinAware
        activityId="theme-example"
        label="Theme Switching Example"
        subtitle="Demonstrates preset themes"
        slots={EXAMPLE_SLOTS}
        maxSlots={3}
        progressFraction={progress}
        elapsedSeconds={elapsed}
        totalDurationSeconds={12}
        status={status}
        canCollect={status === 'completed'}
        onCollect={handleCollect}
        skinPresetId={selectedPreset}
        enableSkinBinding={true}
        skinBindingId="theme-example-binding"
        dataTestId="theme-activity-capsule"
      />
      
      {/* Activity Controls */}
      <div className="example-controls">
        <button onClick={() => setStatus('in-progress')}>Start Activity</button>
        <button onClick={() => setStatus('completed')}>Complete Activity</button>
        <button onClick={() => setStatus('blocked')}>Block Activity</button>
        <button onClick={() => setStatus('idle')}>Reset Activity</button>
      </div>
    </div>
  );
}

// ============================================================================
// MOTION LEVEL ADAPTATION EXAMPLE
// ============================================================================

export function MotionLevelExample() {
  const [status, setStatus] = useState<'idle' | 'in-progress' | 'completed' | 'blocked'>('idle');
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [motionLevel, setMotionLevel] = useState<MotionLevel>('full');
  const [selectedPreset, setSelectedPreset] = useState<SkinPresetId>('wanderlust');
  
  const skin = useActivityCapsuleSkin({
    componentId: 'motion-example',
    initialPresetId: selectedPreset,
    initialMotionLevel: motionLevel,
    enableSkinBinding: true,
    enableValidation: true,
    enableHotReload: false,
    enablePerformanceOptimization: true,
  });
  
  // Update motion level
  React.useEffect(() => {
    skin.updateMotionLevel(motionLevel);
  }, [motionLevel, skin]);
  
  // Simulate progress
  React.useEffect(() => {
    if (status === 'in-progress') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 1) {
            setStatus('completed');
            return 1;
          }
          return prev + 0.1;
        });
        setElapsed(prev => prev + 1);
      }, 600);
      
      return () => clearInterval(interval);
    }
  }, [status]);
  
  const handleCollect = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setElapsed(0);
  }, []);
  
  return (
    <div className="example-container">
      <h3>Motion Level Adaptation Example</h3>
      <p>Demonstrates motion level adaptations for accessibility and performance</p>
      
      {/* Motion Controls */}
      <div className="motion-controls">
        <div className="control-group">
          <label>Motion Level:</label>
          <select value={motionLevel} onChange={(e) => setMotionLevel(e.target.value as MotionLevel)}>
            <option value="minimal">Minimal (No animations)</option>
            <option value="reduced">Reduced (Subtle animations)</option>
            <option value="full">Full (Rich animations)</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Preset:</label>
          <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value as SkinPresetId)}>
            <option value="minimal-frontier">Minimal Frontier</option>
            <option value="wanderlust">Wanderlust</option>
            <option value="arcane-tech">Arcane Tech</option>
            <option value="gilded-observatory">Gilded Observatory</option>
          </select>
        </div>
      </div>
      
      {/* Motion Level Description */}
      <div className="motion-description">
        <h4>Current Motion Level: {motionLevel}</h4>
        <p>
          {motionLevel === 'minimal' && 'No animations, maximum performance, minimal visual feedback.'}
          {motionLevel === 'reduced' && 'Subtle animations, balanced performance, reduced motion sensitivity.'}
          {motionLevel === 'full' && 'Rich animations, full visual feedback, enhanced user experience.'}
        </p>
      </div>
      
      {/* Activity Capsule */}
      <ActivityCapsuleSkinAware
        activityId="motion-example"
        label="Motion Level Example"
        subtitle={`Current motion: ${motionLevel}`}
        slots={EXAMPLE_SLOTS}
        maxSlots={3}
        progressFraction={progress}
        elapsedSeconds={elapsed}
        totalDurationSeconds={10}
        status={status}
        canCollect={status === 'completed'}
        onCollect={handleCollect}
        skinPresetId={selectedPreset}
        motionLevel={motionLevel}
        enableSkinBinding={true}
        skinBindingId="motion-example-binding"
        dataTestId="motion-activity-capsule"
      />
      
      {/* Activity Controls */}
      <div className="example-controls">
        <button onClick={() => setStatus('in-progress')}>Start Activity</button>
        <button onClick={() => setStatus('completed')}>Complete Activity</button>
        <button onClick={() => setStatus('blocked')}>Block Activity</button>
        <button onClick={() => setStatus('idle')}>Reset Activity</button>
      </div>
      
      {/* Performance Metrics */}
      <div className="performance-metrics">
        <h4>Performance Metrics:</h4>
        <div className="metrics">
          <span>Render Count: {skin.renderCount}</span>
          <span>Cache Hits: {skin.cacheHits}</span>
          <span>Cache Misses: {skin.cacheMisses}</span>
          <span>Validation: {skin.isValid ? 'Valid' : 'Invalid'}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DEVELOPMENT TOOLS EXAMPLE
// ============================================================================

export function DevelopmentToolsExample() {
  const [status, setStatus] = useState<'idle' | 'in-progress' | 'completed' | 'blocked'>('idle');
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [showCacheInfo, setShowCacheInfo] = useState(false);
  const [showBindingInfo, setShowBindingInfo] = useState(false);
  
  // Development skin hook with full debugging enabled
  const skin = useActivityCapsuleSkinDev('dev-tools-example', {
    frame: {
      frameBorder: 'rgba(239, 68, 68, 0.5)', // Red border for visibility
      frameBackground: 'rgba(17, 24, 39, 0.98)',
    },
    progress: {
      progressFill: 'rgba(239, 68, 68, 0.8)', // Red progress for visibility
    },
    cta: {
      ctaBackground: 'rgba(239, 68, 68, 0.8)', // Red CTA for visibility
    },
  });
  
  // Simulate progress
  React.useEffect(() => {
    if (status === 'in-progress') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 1) {
            setStatus('completed');
            return 1;
          }
          return prev + 0.05;
        });
        setElapsed(prev => prev + 1);
      }, 400);
      
      return () => clearInterval(interval);
    }
  }, [status]);
  
  const handleCollect = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setElapsed(0);
  }, []);
  
  const handleIntroduceValidationError = useCallback(() => {
    // Intentionally invalid configuration for testing
    skin.updateConfig({
      frame: {
        frameBorder: 'invalid-color', // This will cause validation error
      } as any,
    });
  }, [skin]);
  
  const handleClearValidationErrors = useCallback(() => {
    skin.clearValidationErrors();
  }, [skin]);
  
  return (
    <div className="example-container">
      <h3>Development Tools Example</h3>
      <p>Demonstrates development tools, validation, and debugging features</p>
      
      {/* Development Controls */}
      <div className="dev-controls">
        <button onClick={() => setShowValidationErrors(!showValidationErrors)}>
          {showValidationErrors ? 'Hide' : 'Show'} Validation Errors
        </button>
        <button onClick={() => setShowCacheInfo(!showCacheInfo)}>
          {showCacheInfo ? 'Hide' : 'Show'} Cache Info
        </button>
        <button onClick={() => setShowBindingInfo(!showBindingInfo)}>
          {showBindingInfo ? 'Hide' : 'Show'} Binding Info
        </button>
        <button onClick={handleIntroduceValidationError}>Introduce Validation Error</button>
        <button onClick={handleClearValidationErrors}>Clear Validation Errors</button>
        <button onClick={() => skin.reset()}>Reset Skin</button>
      </div>
      
      {/* Activity Capsule with Dev Tools */}
      <ActivityCapsuleSkinAware
        activityId="dev-tools-example"
        label="Development Tools Example"
        subtitle="Full debugging and validation enabled"
        helperText="Red accents indicate development mode"
        slots={EXAMPLE_SLOTS}
        maxSlots={3}
        progressFraction={progress}
        elapsedSeconds={elapsed}
        totalDurationSeconds={20}
        status={status}
        canCollect={status === 'completed'}
        onCollect={handleCollect}
        enableSkinBinding={true}
        skinBindingId="dev-tools-example-binding"
        enableDevTools={true}
        onValidationError={(errors) => console.log('Validation error:', errors)}
        onSkinChange={(config) => console.log('Skin changed:', config)}
        dataTestId="dev-tools-activity-capsule"
      />
      
      {/* Activity Controls */}
      <div className="example-controls">
        <button onClick={() => setStatus('in-progress')}>Start Activity</button>
        <button onClick={() => setStatus('completed')}>Complete Activity</button>
        <button onClick={() => setStatus('blocked')}>Block Activity</button>
        <button onClick={() => setStatus('idle')}>Reset Activity</button>
      </div>
      
      {/* Development Information */}
      <div className="dev-info">
        <h4>Development Information:</h4>
        
        {showValidationErrors && (
          <div className="validation-errors">
            <h5>Validation Errors:</h5>
            {skin.validationErrors.length > 0 ? (
              <ul>
                {skin.validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            ) : (
              <p>No validation errors</p>
            )}
          </div>
        )}
        
        {showCacheInfo && (
          <div className="cache-info">
            <h5>Cache Information:</h5>
            <pre>{JSON.stringify(skin.inspectCache(), null, 2)}</pre>
          </div>
        )}
        
        {showBindingInfo && (
          <div className="binding-info">
            <h5>Skin Binding Information:</h5>
            <pre>{JSON.stringify(skin.inspectBinding(), null, 2)}</pre>
          </div>
        )}
        
        <div className="general-debug">
          <h5>General Debug Info:</h5>
          <pre>{JSON.stringify(skin.generateDebugInfo(), null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PRESET SEARCH AND RECOMMENDATION EXAMPLE
// ============================================================================

export function PresetSearchExample() {
  const [searchQuery, setSearchQuery] = useState('');
  const [useCase, setUseCase] = useState<'performance' | 'accessibility' | 'visual' | 'development'>('performance');
  const [selectedPreset, setSelectedPreset] = useState<SkinPresetId>('minimal-frontier');
  const [status, setStatus] = useState<'idle' | 'in-progress' | 'completed' | 'blocked'>('idle');
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  
  const skin = useActivityCapsuleSkinBasic('search-example');
  
  // Search results
  const searchResults = useMemo(() => {
    if (searchQuery.trim()) {
      return searchActivityCapsuleSkinPresets(searchQuery);
    }
    return [];
  }, [searchQuery]);
  
  // Recommended presets
  const recommendedPresets = useMemo(() => {
    return getRecommendedActivityCapsuleSkinPresets(useCase);
  }, [useCase]);
  
  // Simulate progress
  React.useEffect(() => {
    if (status === 'in-progress') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 1) {
            setStatus('completed');
            return 1;
          }
          return prev + 0.1;
        });
        setElapsed(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [status]);
  
  const handleCollect = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setElapsed(0);
  }, []);
  
  return (
    <div className="example-container">
      <h3>Preset Search and Recommendation Example</h3>
      <p>Demonstrates preset discovery, search, and recommendation system</p>
      
      {/* Search Controls */}
      <div className="search-controls">
        <div className="control-group">
          <label>Search Presets:</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, description, or tags..."
          />
        </div>
        
        <div className="control-group">
          <label>Use Case:</label>
          <select value={useCase} onChange={(e) => setUseCase(e.target.value as any)}>
            <option value="performance">Performance</option>
            <option value="accessibility">Accessibility</option>
            <option value="visual">Visual</option>
            <option value="development">Development</option>
          </select>
        </div>
      </div>
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h4>Search Results ({searchResults.length}):</h4>
          <div className="preset-grid">
            {searchResults.map(preset => (
              <div
                key={preset.id}
                className={`preset-card ${selectedPreset === preset.id ? 'selected' : ''}`}
                onClick={() => setSelectedPreset(preset.id as SkinPresetId)}
              >
                <h5>{preset.name}</h5>
                <p>{preset.description}</p>
                <div className="preset-meta">
                  <span className="category">{preset.category}</span>
                  <span className="difficulty">{preset.metadata?.difficulty}</span>
                  <span className="load-time">{preset.metadata?.estimatedLoadTime}ms</span>
                </div>
                <div className="preset-tags">
                  {preset.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recommended Presets */}
      <div className="recommended-presets">
        <h4>Recommended for {useCase}:</h4>
        <div className="preset-grid">
          {recommendedPresets.map(preset => (
            <div
              key={preset.id}
              className={`preset-card ${selectedPreset === preset.id ? 'selected' : ''}`}
              onClick={() => setSelectedPreset(preset.id as SkinPresetId)}
            >
              <h5>{preset.name}</h5>
              <p>{preset.description}</p>
              <div className="preset-meta">
                <span className="category">{preset.category}</span>
                <span className="difficulty">{preset.metadata?.difficulty}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Selected Preset Info */}
      {selectedPreset && (
        <div className="selected-preset-info">
          <h4>Selected Preset: {selectedPreset}</h4>
          {(() => {
            const preset = getActivityCapsuleSkinPreset(selectedPreset);
            return preset ? (
              <div className="preset-details">
                <p><strong>Description:</strong> {preset.description}</p>
                <p><strong>Category:</strong> {preset.category}</p>
                <p><strong>Author:</strong> {preset.author}</p>
                <p><strong>Version:</strong> {preset.version}</p>
                <p><strong>Supported Pillars:</strong> {preset.supportedPillars.join(', ')}</p>
                <p><strong>Supported Motion Levels:</strong> {preset.supportedMotionLevels.join(', ')}</p>
                <div className="preset-tags">
                  <strong>Tags:</strong>
                  {preset.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}
      
      {/* Activity Capsule */}
      <ActivityCapsuleSkinAware
        activityId="search-example"
        label="Preset Search Example"
        subtitle={`Using preset: ${selectedPreset}`}
        slots={EXAMPLE_SLOTS}
        maxSlots={3}
        progressFraction={progress}
        elapsedSeconds={elapsed}
        totalDurationSeconds={10}
        status={status}
        canCollect={status === 'completed'}
        onCollect={handleCollect}
        skinPresetId={selectedPreset}
        enableSkinBinding={true}
        skinBindingId="search-example-binding"
        dataTestId="search-activity-capsule"
      />
      
      {/* Activity Controls */}
      <div className="example-controls">
        <button onClick={() => setStatus('in-progress')}>Start Activity</button>
        <button onClick={() => setStatus('completed')}>Complete Activity</button>
        <button onClick={() => setStatus('blocked')}>Block Activity</button>
        <button onClick={() => setStatus('idle')}>Reset Activity</button>
      </div>
    </div>
  );
}

// ============================================================================
// LEGACY COMPATIBILITY EXAMPLE
// ============================================================================

export function LegacyCompatibilityExample() {
  const [status, setStatus] = useState<'idle' | 'in-progress' | 'completed' | 'blocked'>('idle');
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  
  // Legacy configuration (old format)
  const legacyConfig = {
    frameBorder: 'rgba(59, 130, 246, 0.4)',
    frameBackground: 'rgba(15, 23, 42, 0.95)',
    progressFill: 'rgba(59, 130, 246, 0.8)',
    ctaBackground: 'rgba(59, 130, 246, 0.8)',
    // ... other legacy properties
  };
  
  // Legacy mapper function
  const legacyMapper = (legacy: any) => ({
    frame: {
      frameBorder: legacy.frameBorder,
      frameBackground: legacy.frameBackground,
    },
    progress: {
      progressFill: legacy.progressFill,
    },
    cta: {
      ctaBackground: legacy.ctaBackground,
    },
  });
  
  // Legacy-compatible skin hook
  const skin = useActivityCapsuleSkinLegacy('legacy-example', legacyConfig, legacyMapper);
  
  // Simulate progress
  React.useEffect(() => {
    if (status === 'in-progress') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 1) {
            setStatus('completed');
            return 1;
          }
          return prev + 0.1;
        });
        setElapsed(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [status]);
  
  const handleCollect = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setElapsed(0);
  }, []);
  
  return (
    <div className="example-container">
      <h3>Legacy Compatibility Example</h3>
      <p>Demonstrates backward compatibility with existing ActivityCapsule configurations</p>
      
      {/* Legacy Info */}
      <div className="legacy-info">
        <h4>Legacy Configuration:</h4>
        <pre>{JSON.stringify(legacyConfig, null, 2)}</pre>
      </div>
      
      {/* Activity Capsule */}
      <ActivityCapsuleSkinAware
        activityId="legacy-example"
        label="Legacy Compatibility Example"
        subtitle="Demonstrates legacy config mapping"
        slots={EXAMPLE_SLOTS}
        maxSlots={3}
        progressFraction={progress}
        elapsedSeconds={elapsed}
        totalDurationSeconds={10}
        status={status}
        canCollect={status === 'completed'}
        onCollect={handleCollect}
        enableSkinBinding={true}
        skinBindingId="legacy-example-binding"
        // Legacy compatibility props
        skinPresetOverrideId="minimal-frontier"
        skinConfigOverrideLegacy={legacyConfig}
        dataTestId="legacy-activity-capsule"
      />
      
      {/* Activity Controls */}
      <div className="example-controls">
        <button onClick={() => setStatus('in-progress')}>Start Activity</button>
        <button onClick={() => setStatus('completed')}>Complete Activity</button>
        <button onClick={() => setStatus('blocked')}>Block Activity</button>
        <button onClick={() => setStatus('idle')}>Reset Activity</button>
      </div>
      
      {/* Compatibility Info */}
      <div className="compatibility-info">
        <h4>Compatibility Features:</h4>
        <ul>
          <li>✅ Legacy configuration support</li>
          <li>✅ Automatic config mapping</li>
          <li>✅ Backward compatibility</li>
          <li>✅ Migration path available</li>
          <li>✅ TS-Series integration</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE STYLES
// ============================================================================

const exampleStyles = `
.example-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, sans-serif;
}

.example-container h3 {
  color: #e2e8f0;
  margin-bottom: 8px;
}

.example-container p {
  color: #94a3b8;
  margin-bottom: 20px;
}

.example-controls,
.skin-controls,
.theme-controls,
.motion-controls,
.dev-controls,
.search-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-group label {
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
}

.control-group select,
.control-group input {
  padding: 4px 8px;
  border: 1px solid #475569;
  border-radius: 4px;
  background: #1e293b;
  color: #e2e8f0;
}

.example-debug,
.dev-info,
.legacy-info,
.compatibility-info {
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.example-debug pre,
.dev-info pre,
.legacy-info pre {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 4px;
  padding: 12px;
  font-size: 11px;
  color: #e2e8f0;
  overflow-x: auto;
}

.theme-description,
.motion-description {
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.theme-description h4,
.motion-description h4 {
  color: #e2e8f0;
  margin-bottom: 8px;
}

.theme-info {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
}

.skin-tools {
  display: flex;
  gap: 8px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.skin-tools button {
  padding: 6px 12px;
  border: 1px solid #475569;
  border-radius: 4px;
  background: #374151;
  color: #e2e8f0;
  font-size: 11px;
  cursor: pointer;
}

.skin-tools button:hover {
  background: #4b5563;
}

.performance-metrics {
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.performance-metrics h4 {
  color: #e2e8f0;
  margin-bottom: 8px;
}

.performance-metrics .metrics {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #94a3b8;
}

.validation-errors,
.cache-info,
.binding-info {
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.validation-errors h5,
.cache-info h5,
.binding-info h5 {
  color: #e2e8f0;
  margin-bottom: 8px;
}

.validation-errors ul {
  margin: 0;
  padding-left: 16px;
  color: #ef4444;
}

.general-debug {
  margin-top: 16px;
}

.search-results,
.recommended-presets,
.selected-preset-info {
  margin-top: 20px;
}

.search-results h4,
.recommended-presets h4,
.selected-preset-info h4 {
  color: #e2e8f0;
  margin-bottom: 12px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.preset-card {
  background: #1e293b;
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-card:hover {
  border-color: #64748b;
  transform: translateY(-2px);
}

.preset-card.selected {
  border-color: #3b82f6;
  background: #1e3a8a;
}

.preset-card h5 {
  color: #e2e8f0;
  margin-bottom: 4px;
  font-size: 14px;
}

.preset-card p {
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 8px;
}

.preset-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 10px;
}

.preset-meta span {
  background: #374151;
  padding: 2px 6px;
  border-radius: 4px;
  color: #cbd5e1;
}

.preset-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.preset-tags .tag {
  background: #4b5563;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  color: #e2e8f0;
}

.preset-details {
  line-height: 1.6;
}

.preset-details p {
  margin-bottom: 8px;
}

.preset-details strong {
  color: #cbd5e1;
}
`;

export default exampleStyles;
