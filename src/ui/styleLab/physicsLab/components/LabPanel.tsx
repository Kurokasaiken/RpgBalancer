/**
 * Lab Panel Component
 *
 * Main panel container for Physics Lab with Style Laboratory integration.
 * Provides tabbed interface for Physics, Materials, FX, and Outcomes.
 */

import React, { useState } from 'react';
import { type PhysicsPreset } from '@/ui/styleLab/config/physicsPresets';

export interface LabPanelProps {
  /** Current physics preset configuration */
  config: PhysicsPreset;
  /** Callback when preset is updated */
  onUpdateConfig: (updates: Partial<PhysicsPreset>) => void;
  /** Available preset IDs for selection */
  availablePresets: string[];
  /** Callback to apply a preset */
  onApplyPreset: (presetId: string) => void;
  /** Optional className for styling */
  className?: string;
}

type TabType = 'physics' | 'materials' | 'fx' | 'outcomes' | 'audio';

/**
 * Main panel component with tabbed interface for Physics Lab controls.
 * Integrates with Style Laboratory tokens for consistent theming.
 */
export const LabPanel: React.FC<LabPanelProps> = ({
  config,
  onUpdateConfig,
  availablePresets,
  onApplyPreset,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('physics');

  const tabs: Array<{ key: TabType; label: string; icon: string }> = [
    { key: 'physics', label: 'Physics', icon: '⚛️' },
    { key: 'materials', label: 'Materials', icon: '🎨' },
    { key: 'fx', label: 'FX', icon: '✨' },
    { key: 'audio', label: 'Audio', icon: '🔊' },
    { key: 'outcomes', label: 'Outcomes', icon: '📊' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'physics':
        return (
          <div className="physics-tab">
            <h3>Physics Parameters</h3>
            <div className="control-group">
              <label>Lift Scale: {config.liftScale.toFixed(2)}</label>
              <input
                type="range"
                min="1.01"
                max="1.20"
                step="0.01"
                value={config.liftScale}
                onChange={(e) => onUpdateConfig({
                  liftScale: parseFloat(e.target.value)
                })}
                style={{
                  background: `linear-gradient(to right, #d4aa50 0%, #d4aa50 ${((config.liftScale - 1.01) / 0.19) * 100}%, #1a2620 ${((config.liftScale - 1.01) / 0.19) * 100}%, #1a2620 100%)`
                }}
              />
            </div>
            
            <div className="control-group">
              <label>Spring Stiffness: {config.spring.stiffness}</label>
              <input
                type="range"
                min="30"
                max="600"
                step="10"
                value={config.spring.stiffness}
                onChange={(e) => onUpdateConfig({
                  spring: { ...config.spring, stiffness: parseInt(e.target.value) }
                })}
              />
            </div>

            <div className="control-group">
              <label>Mass: {config.mass.toFixed(1)}</label>
              <input
                type="range"
                min="0.3"
                max="6"
                step="0.1"
                value={config.mass}
                onChange={(e) => onUpdateConfig({
                  mass: parseFloat(e.target.value)
                })}
              />
            </div>
          </div>
        );

      case 'materials':
        return (
          <div className="materials-tab">
            <h3>Material Properties</h3>
            <p>Material configuration coming in PL-MAT phase.</p>
            <div className="placeholder-content">
              <div className="placeholder-card">
                <span className="placeholder-icon">🎨</span>
                <span className="placeholder-text">Material presets will be available here</span>
              </div>
            </div>
          </div>
        );

      case 'fx':
        return (
          <div className="fx-tab">
            <h3>Visual Effects</h3>
            <div className="control-group">
              <label>Slot Glow Intensity: {config.slotGlow.intensity.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.slotGlow.intensity}
                onChange={(e) => onUpdateConfig({
                  slotGlow: { ...config.slotGlow, intensity: parseFloat(e.target.value) }
                })}
              />
            </div>

            <div className="control-group">
              <label>Particle Density: {config.fxProfile.particleDensity.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.fxProfile.particleDensity}
                onChange={(e) => onUpdateConfig({
                  fxProfile: { ...config.fxProfile, particleDensity: parseFloat(e.target.value) }
                })}
              />
            </div>

            <div className="control-group">
              <label>Vignette Strength: {config.fxProfile.vignetteStrength.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.fxProfile.vignetteStrength}
                onChange={(e) => onUpdateConfig({
                  fxProfile: { ...config.fxProfile, vignetteStrength: parseFloat(e.target.value) }
                })}
              />
            </div>

            <div className="control-group">
              <label>Cursor Trail</label>
              <select
                value={config.cursor.trail}
                onChange={(e) => onUpdateConfig({
                  cursor: { ...config.cursor, trail: e.target.value as any }
                })}
              >
                <option value="ember">Ember</option>
                <option value="aether">Aether</option>
                <option value="frost">Frost</option>
              </select>
            </div>

            <div className="control-group">
              <label>FX Profile</label>
              <select
                value={config.fxProfile.id}
                onChange={(e) => onUpdateConfig({
                  fxProfile: { ...config.fxProfile, id: e.target.value as any }
                })}
              >
                <option value="gildedObservatory">Gilded Observatory</option>
                <option value="obsidianPulse">Obsidian Pulse</option>
                <option value="blizzardVeil">Blizzard Veil</option>
              </select>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="audio-tab">
            <h3>Audio & Haptics</h3>
            <div className="placeholder-content">
              <div className="placeholder-card">
                <span className="placeholder-icon">🔊</span>
                <span className="placeholder-text">Audio controls available in PL-AUD phase</span>
              </div>
            </div>
            <div className="control-group">
              <label>Sound Pack: {config.audioProfile.soundPack}</label>
              <select
                value={config.audioProfile.soundPack}
                onChange={(e) => onUpdateConfig({
                  audioProfile: { ...config.audioProfile, soundPack: e.target.value as 'gilded' | 'obsidian' | 'blizzard' }
                })}
              >
                <option value="gilded">Gilded</option>
                <option value="obsidian">Obsidian</option>
                <option value="blizzard">Blizzard</option>
              </select>
            </div>
            <div className="control-group">
              <label>Master Volume: {Math.round(config.audioProfile.masterVolume * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.audioProfile.masterVolume}
                onChange={(e) => onUpdateConfig({
                  audioProfile: { ...config.audioProfile, masterVolume: parseFloat(e.target.value) }
                })}
              />
            </div>
            <div className="control-group">
              <label>Max Concurrent Cues: {config.audioProfile.maxConcurrentCues}</label>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={config.audioProfile.maxConcurrentCues}
                onChange={(e) => onUpdateConfig({
                  audioProfile: { ...config.audioProfile, maxConcurrentCues: parseInt(e.target.value) }
                })}
              />
            </div>
            <div className="control-group">
              <label>
                <input
                  type="checkbox"
                  checked={config.audioProfile.ducking.enabled}
                  onChange={(e) => onUpdateConfig({
                    audioProfile: { 
                      ...config.audioProfile, 
                      ducking: { ...config.audioProfile.ducking, enabled: e.target.checked }
                    }
                  })}
                />
                Enable Ducking
              </label>
            </div>
            <div className="placeholder-content">
              <div className="placeholder-card">
                <span className="placeholder-icon">📳</span>
                <span className="placeholder-text">Advanced audio controls in PL-AUD phase</span>
              </div>
            </div>
          </div>
        );

      case 'outcomes':
        return (
          <div className="outcomes-tab">
            <h3>Analysis & Export</h3>
            <div className="preset-selector">
              <label>Active Preset:</label>
              <select
                value={config.id}
                onChange={(e) => onApplyPreset(e.target.value)}
              >
                {availablePresets.map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>

            <div className="export-section">
              <h4>Export Configuration</h4>
              <button 
                className="export-button"
                onClick={() => {
                  // TODO: Implement export functionality
                  console.log('Export preset:', config);
                }}
              >
                📤 Export as JSON
              </button>
              <button 
                className="export-button"
                onClick={() => {
                  // TODO: Implement copy to clipboard
                  navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                }}
              >
                📋 Copy to Clipboard
              </button>
            </div>

            <div className="metrics-section">
              <h4>Current Metrics</h4>
              <div className="metric-item">
                <span className="metric-label">Lift Scale:</span>
                <span className="metric-value">{config.liftScale.toFixed(2)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Spring Stiffness:</span>
                <span className="metric-value">{config.spring.stiffness}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Mass:</span>
                <span className="metric-value">{config.mass.toFixed(1)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Button Squash:</span>
                <span className="metric-value">{config.buttonSquash.toFixed(2)}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className={`lab-panel ${className}`}
      style={{
        backgroundColor: '#1a2620',
        border: '1px solid #44c470',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Tab Navigation */}
      <div 
        className="tab-navigation"
        style={{
          borderBottom: '1px solid #44c470',
          padding: '8px',
          display: 'flex',
          gap: '8px',
        }}
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '4px 12px',
              backgroundColor: activeTab === tab.key ? '#d4aa50' : 'transparent',
              color: activeTab === tab.key ? '#04060a' : '#f5edd8',
              border: `1px solid ${activeTab === tab.key ? '#d4aa50' : '#44c470'}`,
              borderRadius: '2px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ marginRight: '4px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div 
        className="tab-content"
        style={{
          padding: '16px',
          minHeight: '300px',
        }}
      >
        {renderTabContent()}
      </div>

      {/* Panel Footer */}
      <div 
        className="panel-footer"
        style={{
          borderTop: '1px solid #44c470',
          padding: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          color: '#f5edd8',
        }}
      >
        <span>Physics Lab v1.0</span>
        <span>Preset: {config.label}</span>
      </div>
    </div>
  );
};
