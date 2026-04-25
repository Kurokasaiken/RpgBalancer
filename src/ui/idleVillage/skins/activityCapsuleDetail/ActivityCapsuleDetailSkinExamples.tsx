/**
 * WL-STY-011: ActivityCapsuleDetail Skin Integration Examples (TS-Series)
 * 
 * Comprehensive examples demonstrating ActivityCapsuleDetail skin integration
 * with the TS-Series skin system, including basic usage, advanced customization,
 * theme switching, motion level adaptation, development tools, and more.
 */

import React, { useState, useCallback } from 'react';
import ActivityCapsuleDetailSkinAware, { 
  ActivityDetailSlotData, 
  TelemetryEntry 
} from './ActivityCapsuleDetailSkinAware';
import { useActivityCapsuleDetailSkin } from './useActivityCapsuleDetailSkin';
import { 
  ActivityCapsuleDetailSkinHarnessProvider,
  useActivityCapsuleDetailSkinHarness,
  useActivityCapsuleDetailSkinHarnessIntegration,
} from './ActivityCapsuleDetailSkinHarness';
import { 
  ACTIVITY_CAPSULE_DETAIL_SKIN_PRESETS,
  getActivityCapsuleDetailSkinConfigWithPreset,
} from './ActivityCapsuleDetailSkinPresets';
import type { 
  MotionLevel, 
  StyleLabPillar, 
  SkinPresetId,
} from '../SkinSchema';

// ============================================================================
// MOCK DATA FOR EXAMPLES
// ============================================================================

const mockSlots: ActivityDetailSlotData[] = [
  { id: 'slot-1', state: 'idle', initial: 'A', progress: 0, assignedWorkerName: 'Aria' },
  { id: 'slot-2', state: 'idle', initial: 'B', progress: 0, assignedWorkerName: 'Bram' },
  { id: 'slot-3', state: 'ghost', initial: '', progress: 0 },
  { id: 'slot-4', state: 'empty', initial: '', progress: 0 },
];

const mockTelemetry: TelemetryEntry[] = [
  { id: 'tel-1', timestamp: new Date(Date.now() - 120000), message: 'Aria <em>assegnata</em>', type: 'assign' },
  { id: 'tel-2', timestamp: new Date(Date.now() - 60000), message: 'Bram <em>assegnato</em>', type: 'assign' },
  { id: 'tel-3', timestamp: new Date(Date.now() - 30000), message: 'Attività <em>avviata</em>', type: 'start' },
];

// ============================================================================
// EXAMPLE 1: BASIC USAGE
// ============================================================================

export function BasicUsageExample() {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div className="example-container">
      <h2>Basic Usage Example</h2>
      <p>Demonstrates the simplest way to use ActivityCapsuleDetailSkinAware with default settings.</p>
      
      <button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Close' : 'Open'} Activity Detail
      </button>
      
      <ActivityCapsuleDetailSkinAware
        activityId="basic-example"
        name="Foraging Expedition"
        type="Resource Gathering"
        subtitle="Collect herbs and rare materials"
        status="idle"
        progress={0}
        duration={3600}
        elapsed={0}
        slots={mockSlots}
        maxSlots={4}
        durationDisplay="1 hour"
        rewardDisplay="Herbs x10, Rare Materials x2"
        etaDisplay="N/A"
        telemetry={mockTelemetry}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onStart={() => console.log('Activity started')}
        onCancel={() => console.log('Activity cancelled')}
        onCollect={() => console.log('Rewards collected')}
        onSlotAssign={(slotId) => console.log('Slot assigned:', slotId)}
        onSlotDetach={(slotId) => console.log('Slot detached:', slotId)}
        data-testid="basic-activity-capsule-detail"
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: PRESET THEMING
// ============================================================================

export function PresetThemingExample() {
  const [isOpen, setIsOpen] = useState(true);
  const [currentPreset, setCurrentPreset] = useState<SkinPresetId>('minimal-frontier');
  const [currentPillar, setCurrentPillar] = useState<StyleLabPillar>('frontier');
  const [motionLevel, setMotionLevel] = useState<MotionLevel>('full');
  
  const presets: SkinPresetId[] = [
    'minimal-frontier',
    'minimal-wilderness', 
    'minimal-empire',
    'wanderlust',
    'arcane-tech',
    'gilded-observatory',
  ];
  
  const pillars: StyleLabPillar[] = ['frontier', 'wilderness', 'empire'];
  const motionLevels: MotionLevel[] = ['minimal', 'reduced', 'full'];
  
  return (
    <div className="example-container">
      <h2>Preset Theming Example</h2>
      <p>Demonstrates different preset themes and pillar adaptations.</p>
      
      <div className="controls">
        <div className="control-group">
          <label>Preset:</label>
          <select value={currentPreset} onChange={(e) => setCurrentPreset(e.target.value as SkinPresetId)}>
            {presets.map(preset => (
              <option key={preset} value={preset}>{preset}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Pillar:</label>
          <select value={currentPillar} onChange={(e) => setCurrentPillar(e.target.value as StyleLabPillar)}>
            {pillars.map(pillar => (
              <option key={pillar} value={pillar}>{pillar}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Motion Level:</label>
          <select value={motionLevel} onChange={(e) => setMotionLevel(e.target.value as MotionLevel)}>
            {motionLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
        
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? 'Close' : 'Open'} Activity Detail
        </button>
      </div>
      
      <ActivityCapsuleDetailSkinAware
        activityId="preset-example"
        name="Arcane Research"
        type="Knowledge Gathering"
        subtitle="Study ancient magical texts"
        status="in-progress"
        progress={0.65}
        duration={7200}
        elapsed={4680}
        slots={mockSlots}
        maxSlots={4}
        durationDisplay="2 hours"
        rewardDisplay="Knowledge Points x50, Ancient Scroll x1"
        etaDisplay="42 minutes"
        telemetry={mockTelemetry}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onStart={() => console.log('Activity started')}
        onCancel={() => console.log('Activity cancelled')}
        onCollect={() => console.log('Rewards collected')}
        onSlotAssign={(slotId) => console.log('Slot assigned:', slotId)}
        onSlotDetach={(slotId) => console.log('Slot detached:', slotId)}
        skinPresetId={currentPreset}
        pillar={currentPillar}
        motionLevel={motionLevel}
        data-testid="preset-activity-capsule-detail"
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: ADVANCED CUSTOMIZATION
// ============================================================================

export function AdvancedCustomizationExample() {
  const [isOpen, setIsOpen] = useState(true);
  const [customColors, setCustomColors] = useState({
    primary: '#ff6b6b',
    secondary: '#4ecdc4',
    accent: '#45b7d1',
  });
  
  const customConfig = {
    window: {
      windowBackground: `linear-gradient(135deg, ${customColors.primary}20 0%, ${customColors.secondary}20 100%)`,
      windowBorder: `2px solid ${customColors.accent}`,
      frameGradient: `linear-gradient(0% 0%, ${customColors.primary} 0%, ${customColors.secondary} 100%)`,
      dragHandleDotColor: customColors.accent,
      closeButtonColor: customColors.accent,
    },
    poi: {
      crownGradient: `linear-gradient(14% 4%, ${customColors.accent} 0%, ${customColors.primary} 100%)`,
      idleColor: customColors.secondary,
      activeColor: customColors.accent,
      completedColor: '#48d17c',
      poiGlow: `0 0 20px ${customColors.accent}80`,
    },
    header: {
      nameColor: customColors.primary,
      typeColor: customColors.secondary,
      statusActiveColor: customColors.accent,
      statusCompletedColor: '#48d17c',
    },
    cta: {
      startButtonBackground: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})`,
      startButtonColor: '#ffffff',
      collectButtonBackground: `linear-gradient(135deg, #48d17c, ${customColors.accent})`,
      collectButtonColor: '#ffffff',
    },
  };
  
  return (
    <div className="example-container">
      <h2>Advanced Customization Example</h2>
      <p>Demonstrates custom skin configuration with dynamic color theming.</p>
      
      <div className="controls">
        <div className="control-group">
          <label>Primary Color:</label>
          <input 
            type="color" 
            value={customColors.primary}
            onChange={(e) => setCustomColors(prev => ({ ...prev, primary: e.target.value }))}
          />
        </div>
        
        <div className="control-group">
          <label>Secondary Color:</label>
          <input 
            type="color" 
            value={customColors.secondary}
            onChange={(e) => setCustomColors(prev => ({ ...prev, secondary: e.target.value }))}
          />
        </div>
        
        <div className="control-group">
          <label>Accent Color:</label>
          <input 
            type="color" 
            value={customColors.accent}
            onChange={(e) => setCustomColors(prev => ({ ...prev, accent: e.target.value }))}
          />
        </div>
        
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? 'Close' : 'Open'} Activity Detail
        </button>
      </div>
      
      <ActivityCapsuleDetailSkinAware
        activityId="custom-example"
        name="Dragon Hunt"
        type="Combat Mission"
        subtitle="Hunt down the ancient dragon"
        status="completed"
        progress={1.0}
        duration={5400}
        elapsed={5400}
        slots={mockSlots.map(slot => ({ ...slot, state: 'done' as const, progress: 1.0 }))}
        maxSlots={4}
        durationDisplay="1.5 hours"
        rewardDisplay="Dragon Scale x5, Gold x1000, Experience x500"
        etaDisplay="Completed"
        telemetry={mockTelemetry}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onStart={() => console.log('Activity started')}
        onCancel={() => console.log('Activity cancelled')}
        onCollect={() => console.log('Rewards collected')}
        onSlotAssign={(slotId) => console.log('Slot assigned:', slotId)}
        onSlotDetach={(slotId) => console.log('Slot detached:', slotId)}
        skinConfigOverride={customConfig}
        data-testid="custom-activity-capsule-detail"
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: HOOK INTEGRATION
// ============================================================================

export function HookIntegrationExample() {
  const [isOpen, setIsOpen] = useState(true);
  const [currentPreset, setCurrentPreset] = useState<SkinPresetId>('arcane-tech');
  
  const skinHook = useActivityCapsuleDetailSkin({
    componentId: 'hook-example',
    skinPresetId: currentPreset,
    pillar: 'wilderness',
    motionLevel: 'full',
    enableDevTools: true,
    enableValidation: true,
    enableTelemetry: true,
    onSkinChange: (config) => {
      console.log('Skin configuration changed:', config);
    },
    onValidationError: (validation) => {
      console.log('Validation error:', validation);
    },
  });
  
  const handlePresetChange = (presetId: SkinPresetId) => {
    setCurrentPreset(presetId);
    skinHook.updateConfig({ presetId });
  };
  
  const handleColorChange = (color: string) => {
    skinHook.updateConfig({
      header: {
        nameColor: color,
      },
    });
  };
  
  return (
    <div className="example-container">
      <h2>Hook Integration Example</h2>
      <p>Demonstrates advanced hook usage with validation, telemetry, and development tools.</p>
      
      <div className="controls">
        <div className="control-group">
          <label>Preset:</label>
          <select value={currentPreset} onChange={(e) => handlePresetChange(e.target.value as SkinPresetId)}>
            <option value="arcane-tech">Arcane Tech</option>
            <option value="wanderlust">Wanderlust</option>
            <option value="gilded-observatory">Gilded Observatory</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Name Color:</label>
          <input 
            type="color" 
            value={skinHook.config.header.nameColor}
            onChange={(e) => handleColorChange(e.target.value)}
          />
        </div>
        
        <div className="control-group">
          <label>Dev Mode:</label>
          <button onClick={skinHook.enableDevMode}>
            Enable
          </button>
          <button onClick={skinHook.disableDevMode}>
            Disable
          </button>
        </div>
        
        <div className="control-group">
          <label>Actions:</label>
          <button onClick={skinHook.resetConfig}>Reset Config</button>
          <button onClick={() => skinHook.copyConfig()}>Copy Config</button>
          <button onClick={() => console.log(skinHook.getDebugInfo())}>Debug Info</button>
        </div>
        
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? 'Close' : 'Open'} Activity Detail
        </button>
      </div>
      
      {/* Validation status */}
      <div className="validation-status">
        <h4>Validation Status:</h4>
        <p>Valid: {skinHook.isValid ? '✅' : '❌'}</p>
        {skinHook.errors.length > 0 && (
          <ul>
            {skinHook.errors.map((error, index) => (
              <li key={index} className="error">{error}</li>
            ))}
          </ul>
        )}
        {skinHook.warnings.length > 0 && (
          <ul>
            {skinHook.warnings.map((warning, index) => (
              <li key={index} className="warning">{warning}</li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Performance metrics */}
      <div className="performance-metrics">
        <h4>Performance:</h4>
        <p>Loading: {skinHook.isLoading ? '⏳' : '✅'}</p>
        <p>Refreshing: {skinHook.isRefreshing ? '⏳' : '✅'}</p>
        <p>Cache Hit: {skinHook.cacheHit ? '✅' : '❌'}</p>
        <p>Last Refresh: {new Date(skinHook.lastRefresh).toLocaleTimeString()}</p>
      </div>
      
      <ActivityCapsuleDetailSkinAware
        activityId="hook-example"
        name="Mystic Portal"
        type="Dimensional Travel"
        subtitle="Open a portal to another realm"
        status="in-progress"
        progress={0.35}
        duration={9000}
        elapsed={3150}
        slots={mockSlots}
        maxSlots={4}
        durationDisplay="2.5 hours"
        rewardDisplay="Dimensional Shard x3, Experience x750"
        etaDisplay="1 hour 35 minutes"
        telemetry={mockTelemetry}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onStart={() => console.log('Activity started')}
        onCancel={() => console.log('Activity cancelled')}
        onCollect={() => console.log('Rewards collected')}
        onSlotAssign={(slotId) => console.log('Slot assigned:', slotId)}
        onSlotDetach={(slotId) => console.log('Slot detached:', slotId)}
        skinPresetId={currentPreset}
        pillar="wilderness"
        motionLevel="full"
        enableDevTools={skinHook.config.enableDevTools}
        onValidationError={skinHook.onValidationError}
        onSkinChange={skinHook.onSkinChange}
        data-testid="hook-activity-capsule-detail"
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: HARNESS SYSTEM
// ============================================================================

export function HarnessSystemExample() {
  const [isOpen, setIsOpen] = useState(true);
  const [currentPreset, setCurrentPreset] = useState<SkinPresetId>('gilded-observatory');
  
  const harness = useActivityCapsuleDetailSkinHarness();
  const componentIntegration = useActivityCapsuleDetailSkinHarnessIntegration(
    'harness-example',
    getActivityCapsuleDetailSkinConfigWithPreset(currentPreset, 'empire', 'full')
  );
  
  const handleGlobalPresetChange = (presetId: SkinPresetId) => {
    setCurrentPreset(presetId);
    harness.actions.applyPreset(presetId, 'empire', 'full');
  };
  
  const handleComponentUpdate = () => {
    componentIntegration.updateConfig({
      header: {
        nameColor: '#ff6b6b',
        typeColor: '#4ecdc4',
      },
    });
  };
  
  const handleBatchUpdate = () => {
    const updates = new Map([
      ['harness-example', { poi: { idleColor: '#45b7d1' } }],
      ['another-component', { cta: { startButtonBackground: '#ff6b6b' } }],
    ]);
    harness.actions.batchUpdateComponents(updates);
  };
  
  return (
    <div className="example-container">
      <h2>Harness System Example</h2>
      <p>Demonstrates the harness system for centralized skin management.</p>
      
      <div className="controls">
        <div className="control-group">
          <label>Global Preset:</label>
          <select value={currentPreset} onChange={(e) => handleGlobalPresetChange(e.target.value as SkinPresetId)}>
            <option value="gilded-observatory">Gilded Observatory</option>
            <option value="minimal-empire">Minimal Empire</option>
            <option value="neon-cyber">Neon Cyber</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Harness Actions:</label>
          <button onClick={() => harness.actions.applyGlobalToAll()}>Apply to All</button>
          <button onClick={() => harness.actions.resetAllComponents()}>Reset All</button>
          <button onClick={handleBatchUpdate}>Batch Update</button>
          <button onClick={() => harness.actions.enableDevMode()}>Enable Dev Mode</button>
        </div>
        
        <div className="control-group">
          <label>Component Actions:</label>
          <button onClick={handleComponentUpdate}>Update Component</button>
          <button onClick={() => console.log(componentIntegration.validation)}>Check Validation</button>
          <button onClick={() => console.log(componentIntegration.metrics)}>Show Metrics</button>
        </div>
        
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? 'Close' : 'Open'} Activity Detail
        </button>
      </div>
      
      {/* Harness metrics */}
      <div className="harness-metrics">
        <h4>Harness Metrics:</h4>
        <p>Total Components: {harness.state.metrics.totalComponents}</p>
        <p>Active Components: {harness.state.metrics.activeComponents}</p>
        <p>Cache Hits: {harness.state.metrics.cacheHits}</p>
        <p>Cache Misses: {harness.state.metrics.cacheMisses}</p>
        <p>Validation Errors: {harness.state.metrics.validationErrors}</p>
        <p>Avg Render Time: {harness.state.metrics.averageRenderTime}ms</p>
        <p>Dev Mode: {harness.state.devMode ? '✅' : '❌'}</p>
      </div>
      
      <ActivityCapsuleDetailSkinAware
        activityId="harness-example"
        name="Imperial Ceremony"
        type="Royal Event"
        subtitle="Attend the emperor's grand ceremony"
        status="idle"
        progress={0}
        duration={3600}
        elapsed={0}
        slots={mockSlots}
        maxSlots={4}
        durationDisplay="1 hour"
        rewardDisplay="Imperial Favor x10, Gold x500"
        etaDisplay="N/A"
        telemetry={mockTelemetry}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onStart={() => console.log('Activity started')}
        onCancel={() => console.log('Activity cancelled')}
        onCollect={() => console.log('Rewards collected')}
        onSlotAssign={(slotId) => console.log('Slot assigned:', slotId)}
        onSlotDetach={(slotId) => console.log('Slot detached:', slotId)}
        skinPresetId={currentPreset}
        pillar="empire"
        motionLevel="full"
        data-testid="harness-activity-capsule-detail"
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: MOTION LEVEL ADAPTATION
// ============================================================================

export function MotionLevelAdaptationExample() {
  const [isOpen, setIsOpen] = useState(true);
  const [motionLevel, setMotionLevel] = useState<MotionLevel>('full');
  const [showAnimations, setShowAnimations] = useState(true);
  
  const motionConfigs = {
    minimal: {
      animation: {
        windowEntryAnimation: 'fade' as const,
        windowEntryDuration: '0.2s',
        poiIdleAnimation: 'none',
        slotIdleAnimation: 'none',
        progressAnimation: 'stepped' as const,
        uiAnimationDuration: '0.1s',
        hoverAnimationDuration: '0.1s',
        clickAnimationDuration: '0.05s',
      },
      poi: {
        entryAnimation: 'none',
        hoverAnimation: 'none',
        hoverScale: 1,
        clickAnimation: 'none',
        clickScale: 1,
      },
      slotRack: {
        slotEntryAnimation: 'none',
        slotHoverAnimation: 'none',
        slotHoverScale: 1,
        slotClickAnimation: 'none',
        slotClickScale: 1,
      },
      cta: {
        buttonHoverAnimation: 'none',
        buttonActiveScale: 1,
        buttonDisabledScale: 1,
      },
    },
    reduced: {
      animation: {
        windowEntryAnimation: 'fade' as const,
        windowEntryDuration: '0.3s',
        poiIdleAnimation: 'none',
        slotIdleAnimation: 'none',
        progressAnimation: 'stepped' as const,
        uiAnimationDuration: '0.2s',
        hoverAnimationDuration: '0.15s',
        clickAnimationDuration: '0.1s',
      },
      poi: {
        entryAnimation: 'fade',
        entryDuration: '0.2s',
        hoverAnimation: 'none',
        hoverScale: 1,
        clickAnimation: 'none',
        clickScale: 1,
      },
      slotRack: {
        slotEntryAnimation: 'fade',
        slotEntryDuration: '0.2s',
        slotHoverAnimation: 'none',
        slotHoverScale: 1,
        slotClickAnimation: 'none',
        slotClickScale: 1,
      },
      cta: {
        buttonHoverAnimation: 'none',
        buttonActiveScale: 0.98,
        buttonDisabledScale: 1,
      },
    },
    full: {},
  };
  
  return (
    <div className="example-container">
      <h2>Motion Level Adaptation Example</h2>
      <p>Demonstrates motion level adaptations for accessibility and performance.</p>
      
      <div className="controls">
        <div className="control-group">
          <label>Motion Level:</label>
          <select value={motionLevel} onChange={(e) => setMotionLevel(e.target.value as MotionLevel)}>
            <option value="minimal">Minimal (No animations)</option>
            <option value="reduced">Reduced (Subtle animations)</option>
            <option value="full">Full (Rich animations)</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Show Animations:</label>
          <input 
            type="checkbox" 
            checked={showAnimations}
            onChange={(e) => setShowAnimations(e.target.checked)}
          />
        </div>
        
        <div className="control-group">
          <label>System Preference:</label>
          <button onClick={() => {
            const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            setMotionLevel(prefersReduced ? 'minimal' : 'full');
          }}>
            Detect System Preference
          </button>
        </div>
        
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? 'Close' : 'Open'} Activity Detail
        </button>
      </div>
      
      <div className="motion-info">
        <h4>Motion Level: {motionLevel}</h4>
        <p>
          {motionLevel === 'minimal' && 'All animations are disabled for maximum accessibility and performance.'}
          {motionLevel === 'reduced' && 'Animations are reduced to essential transitions for better accessibility.'}
          {motionLevel === 'full' && 'Full animation suite is enabled for rich interactive experience.'}
        </p>
      </div>
      
      <ActivityCapsuleDetailSkinAware
        activityId="motion-example"
        name="Time Portal"
        type="Temporal Magic"
        subtitle="Manipulate the flow of time"
        status="in-progress"
        progress={0.75}
        duration={4800}
        elapsed={3600}
        slots={mockSlots}
        maxSlots={4}
        durationDisplay="1.3 hours"
        rewardDisplay="Time Crystal x2, Chrono Essence x5"
        etaDisplay="12 minutes"
        telemetry={mockTelemetry}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onStart={() => console.log('Activity started')}
        onCancel={() => console.log('Activity cancelled')}
        onCollect={() => console.log('Rewards collected')}
        onSlotAssign={(slotId) => console.log('Slot assigned:', slotId)}
        onSlotDetach={(slotId) => console.log('Slot detached:', slotId)}
        motionLevel={motionLevel}
        skinConfigOverride={showAnimations ? motionConfigs[motionLevel] : motionConfigs.minimal}
        data-testid="motion-activity-capsule-detail"
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: DEVELOPMENT TOOLS
// ============================================================================

export function DevelopmentToolsExample() {
  const [isOpen, setIsOpen] = useState(true);
  const [devMode, setDevMode] = useState(true);
  const [showValidation, setShowValidation] = useState(true);
  const [showTelemetry, setShowTelemetry] = useState(true);
  
  const skinHook = useActivityCapsuleDetailSkinDev('dev-tools-example', {
    enableDevTools: devMode,
    enableValidation: showValidation,
    enableTelemetry: showTelemetry,
    onValidationError: (validation) => {
      console.log('Validation error:', validation);
    },
  });
  
  const handleExportConfig = () => {
    const config = skinHook.exportConfig();
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity-capsule-detail-skin-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const config = e.target?.result as string;
        const success = skinHook.importConfig(config);
        if (success) {
          console.log('Configuration imported successfully');
        } else {
          console.error('Failed to import configuration');
        }
      };
      reader.readAsText(file);
    }
  };
  
  return (
    <div className="example-container">
      <h2>Development Tools Example</h2>
      <p>Demonstrates development tools, validation, telemetry, and configuration management.</p>
      
      <div className="controls">
        <div className="control-group">
          <label>Dev Mode:</label>
          <input 
            type="checkbox" 
            checked={devMode}
            onChange={(e) => {
              setDevMode(e.target.checked);
              if (e.target.checked) {
                skinHook.enableDevMode();
              } else {
                skinHook.disableDevMode();
              }
            }}
          />
        </div>
        
        <div className="control-group">
          <label>Validation:</label>
          <input 
            type="checkbox" 
            checked={showValidation}
            onChange={(e) => setShowValidation(e.target.checked)}
          />
        </div>
        
        <div className="control-group">
          <label>Telemetry:</label>
          <input 
            type="checkbox" 
            checked={showTelemetry}
            onChange={(e) => setShowTelemetry(e.target.checked)}
          />
        </div>
        
        <div className="control-group">
          <label>Config Management:</label>
          <button onClick={handleExportConfig}>Export Config</button>
          <input type="file" accept=".json" onChange={handleImportConfig} style={{ display: 'none' }} />
          <button onClick={() => document.querySelector('input[type="file"]')?.click()}>
            Import Config
          </button>
          <button onClick={() => skinHook.copyConfig()}>Copy to Clipboard</button>
        </div>
        
        <div className="control-group">
          <label>Debug Actions:</label>
          <button onClick={() => console.log(skinHook.getDebugInfo())}>Debug Info</button>
          <button onClick={() => skinHook.validateConfig()}>Validate Now</button>
          <button onClick={() => skinHook.refreshConfig()}>Refresh Config</button>
        </div>
        
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? 'Close' : 'Open'} Activity Detail
        </button>
      </div>
      
      {/* Development status panel */}
      <div className="dev-status">
        <h4>Development Status:</h4>
        <div className="status-grid">
          <div>Dev Mode: {devMode ? '✅' : '❌'}</div>
          <div>Validation: {showValidation ? '✅' : '❌'}</div>
          <div>Telemetry: {showTelemetry ? '✅' : '❌'}</div>
          <div>Loading: {skinHook.isLoading ? '⏳' : '✅'}</div>
          <div>Valid: {skinHook.isValid ? '✅' : '❌'}</div>
          <div>Cache Hit: {skinHook.cacheHit ? '✅' : '❌'}</div>
          <div>Bound: {skinHook.isBound ? '✅' : '❌'}</div>
          <div>Refreshing: {skinHook.isRefreshing ? '⏳' : '✅'}</div>
        </div>
        
        {skinHook.errors.length > 0 && (
          <div className="errors">
            <h5>Errors:</h5>
            <ul>
              {skinHook.errors.map((error, index) => (
                <li key={index} className="error">{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {skinHook.warnings.length > 0 && (
          <div className="warnings">
            <h5>Warnings:</h5>
            <ul>
              {skinHook.warnings.map((warning, index) => (
                <li key={index} className="warning">{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <ActivityCapsuleDetailSkinAware
        activityId="dev-tools-example"
        name="Debug Portal"
        type="Development Test"
        subtitle="Testing skin system features"
        status="in-progress"
        progress={0.5}
        duration={1800}
        elapsed={900}
        slots={mockSlots}
        maxSlots={4}
        durationDisplay="30 minutes"
        rewardDisplay="Debug Points x100, Test Data x50"
        etaDisplay="15 minutes"
        telemetry={mockTelemetry}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onStart={() => console.log('Activity started')}
        onCancel={() => console.log('Activity cancelled')}
        onCollect={() => console.log('Rewards collected')}
        onSlotAssign={(slotId) => console.log('Slot assigned:', slotId)}
        onSlotDetach={(slotId) => console.log('Slot detached:', slotId)}
        enableDevTools={devMode}
        enableValidation={showValidation}
        enableTelemetry={showTelemetry}
        onValidationError={showValidation ? skinHook.onValidationError : undefined}
        onSkinChange={skinHook.onSkinChange}
        data-testid="dev-tools-activity-capsule-detail"
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: COMPREHENSIVE DEMO
// ============================================================================

export function ComprehensiveDemo() {
  const [selectedExample, setSelectedExample] = useState<string>('basic');
  
  const examples = [
    { id: 'basic', name: 'Basic Usage', component: BasicUsageExample },
    { id: 'preset', name: 'Preset Theming', component: PresetThemingExample },
    { id: 'custom', name: 'Advanced Customization', component: AdvancedCustomizationExample },
    { id: 'hook', name: 'Hook Integration', component: HookIntegrationExample },
    { id: 'harness', name: 'Harness System', component: HarnessSystemExample },
    { id: 'motion', name: 'Motion Adaptation', component: MotionLevelAdaptationExample },
    { id: 'devtools', name: 'Development Tools', component: DevelopmentToolsExample },
  ];
  
  const SelectedExample = examples.find(ex => ex.id === selectedExample)?.component || BasicUsageExample;
  
  return (
    <div className="comprehensive-demo">
      <h1>ActivityCapsuleDetail Skin Integration Examples</h1>
      <p>Comprehensive examples demonstrating WL-STY-011 ActivityCapsuleDetail skin system integration.</p>
      
      <div className="example-selector">
        <label>Select Example:</label>
        <select value={selectedExample} onChange={(e) => setSelectedExample(e.target.value)}>
          {examples.map(example => (
            <option key={example.id} value={example.id}>{example.name}</option>
          ))}
        </select>
      </div>
      
      <div className="example-content">
        <SelectedExample />
      </div>
      
      <div className="example-info">
        <h3>About This Example</h3>
        <p>
          {selectedExample === 'basic' && 'Shows the simplest way to use ActivityCapsuleDetailSkinAware with default settings and minimal configuration.'}
          {selectedExample === 'preset' && 'Demonstrates different preset themes, pillar adaptations, and motion level configurations.'}
          {selectedExample === 'custom' && 'Shows how to create custom skin configurations with dynamic theming and real-time updates.'}
          {selectedExample === 'hook' && 'Illustrates advanced hook usage with validation, telemetry, caching, and development tools.'}
          {selectedExample === 'harness' && 'Demonstrates the harness system for centralized skin management across multiple components.'}
          {selectedExample === 'motion' && 'Shows motion level adaptations for accessibility and performance optimization.'}
          {selectedExample === 'devtools' && 'Illustrates development tools, configuration management, and debugging features.'}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN DEMO COMPONENT WITH HARNESS PROVIDER
// ============================================================================

export default function ActivityCapsuleDetailSkinExamples() {
  return (
    <ActivityCapsuleDetailSkinHarnessProvider
      config={{
        enableGlobalOverrides: true,
        enableBatchOperations: true,
        enablePerformanceMonitoring: true,
        enableDevTools: true,
        enableTelemetry: true,
        enableValidationWarnings: true,
        enableHotReload: true,
        enableExperimentalPresets: true,
        logLevel: 'info',
      }}
      initialPreset="minimal-frontier"
      initialPillar="frontier"
      initialMotionLevel="full"
    >
      <div className="activity-capsule-detail-skin-examples">
        <ComprehensiveDemo />
      </div>
    </ActivityCapsuleDetailSkinHarnessProvider>
  );
}
