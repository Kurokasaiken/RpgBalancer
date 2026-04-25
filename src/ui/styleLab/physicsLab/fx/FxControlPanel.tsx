/**
 * FX Control Panel Component
 *
 * Control panel for Physics Lab FX effects and shaders.
 * Provides sliders and controls for particle effects, cursor avatars, and shader parameters.
 */

import React, { useState, useCallback } from 'react';
import { type PhysicsPreset } from '@/ui/styleLab/config/physicsPresets';
import { ParticleEngineDemo } from './particleEngineDemo';
import { 
  getCursorPreset, 
  getEnabledCursorPresets, 
  type CursorPresetType 
} from './cursorPresets';
import { 
  type LiquidGaugeConfig,
  type FogSlotConfig,
  type FoilCardConfig
} from './shaders';

export interface FxControlPanelProps {
  /** Current physics preset configuration */
  config: PhysicsPreset;
  /** Callback when preset is updated */
  onUpdateConfig: (updates: Partial<PhysicsPreset>) => void;
  /** Performance mode flag */
  performanceMode?: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * FX Control Panel component.
 * Provides comprehensive controls for all FX effects and shader parameters.
 */
export const FxControlPanel: React.FC<FxControlPanelProps> = ({
  config,
  onUpdateConfig,
  performanceMode = false,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'particles' | 'cursor' | 'shaders'>('particles');
  const [selectedCursorPreset, setSelectedCursorPreset] = useState<CursorPresetType>('gauntlet');

  // Shader configurations
  const [liquidGaugeConfig, setLiquidGaugeConfig] = useState<Partial<LiquidGaugeConfig>>({});
  const [fogSlotConfig, setFogSlotConfig] = useState<Partial<FogSlotConfig>>({});
  const [foilCardConfig, setFoilCardConfig] = useState<Partial<FoilCardConfig>>({});

  /**
   * Export current FX configuration as JSON.
   */
  const exportFxConfig = useCallback(() => {
    const fxConfig = {
      particleDensity: config.fxProfile.particleDensity,
      vignetteStrength: config.fxProfile.vignetteStrength,
      cursorPreset: selectedCursorPreset,
      liquidGauge: liquidGaugeConfig,
      fogSlot: fogSlotConfig,
      foilCard: foilCardConfig,
      performanceMode,
    };

    const dataStr = JSON.stringify(fxConfig, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `physics-fx-config-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [config.fxProfile, selectedCursorPreset, liquidGaugeConfig, fogSlotConfig, foilCardConfig, performanceMode]);

  /**
   * Render particle controls tab.
   */
  const renderParticlesTab = () => (
    <div style={{ padding: '16px' }}>
      <h4 style={{
        color: '#faeaaa',
        fontSize: '14px',
        marginBottom: '16px',
        fontFamily: '"Cinzel", serif',
      }}>
        Particle Effects
      </h4>

      {/* Particle Density Control */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          color: '#f5edd8',
          fontSize: '12px',
          marginBottom: '4px',
        }}>
          Particle Density: {config.fxProfile.particleDensity.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={config.fxProfile.particleDensity}
          onChange={(e) => onUpdateConfig({
            fxProfile: { ...config.fxProfile, particleDensity: parseFloat(e.target.value) }
          })}
          style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#1a2620',
            outline: 'none',
            borderRadius: '2px',
          }}
        />
      </div>

      {/* Vignette Strength Control */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          color: '#f5edd8',
          fontSize: '12px',
          marginBottom: '4px',
        }}>
          Vignette Strength: {config.fxProfile.vignetteStrength.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={config.fxProfile.vignetteStrength}
          onChange={(e) => onUpdateConfig({
            fxProfile: { ...config.fxProfile, vignetteStrength: parseFloat(e.target.value) }
          })}
          style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#1a2620',
            outline: 'none',
            borderRadius: '2px',
          }}
        />
      </div>

      {/* Particle Engine Demo */}
      <div style={{ marginBottom: '16px' }}>
        <h5 style={{
          color: '#faeaaa',
          fontSize: '12px',
          marginBottom: '8px',
        }}>
          Particle Engine Demo
        </h5>
        <ParticleEngineDemo config={config} performanceMode={performanceMode} />
      </div>
    </div>
  );

  /**
   * Render cursor controls tab.
   */
  const renderCursorTab = () => {
    const cursorPresets = getEnabledCursorPresets();
    const currentPreset = getCursorPreset(selectedCursorPreset);

    return (
      <div style={{ padding: '16px' }}>
        <h4 style={{
          color: '#faeaaa',
          fontSize: '14px',
          marginBottom: '16px',
          fontFamily: '"Cinzel", serif',
        }}>
          Cursor Avatar
        </h4>

        {/* Cursor Preset Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#f5edd8',
            fontSize: '12px',
            marginBottom: '4px',
          }}>
            Cursor Preset
          </label>
          <select
            value={selectedCursorPreset}
            onChange={(e) => setSelectedCursorPreset(e.target.value as CursorPresetType)}
            style={{
              width: '100%',
              padding: '4px 8px',
              backgroundColor: '#1a2620',
              color: '#f5edd8',
              border: '1px solid #44c470',
              borderRadius: '2px',
              fontSize: '12px',
            }}
          >
            {cursorPresets.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        {/* Current Preset Info */}
        <div style={{
          padding: '8px',
          backgroundColor: '#141d18',
          border: '1px solid #44c470',
          borderRadius: '2px',
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '11px', color: '#f5edd8', marginBottom: '4px' }}>
            <strong>{currentPreset.name}</strong>
          </div>
          <div style={{ fontSize: '10px', color: '#f5edd8', opacity: 0.8 }}>
            {currentPreset.description}
          </div>
        </div>

        {/* Trail Length Control */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#f5edd8',
            fontSize: '12px',
            marginBottom: '4px',
          }}>
            Trail Length: {currentPreset.trail.trailLength.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={currentPreset.trail.trailLength}
            disabled
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#1a2620',
              outline: 'none',
              borderRadius: '2px',
              opacity: 0.5,
            }}
          />
          <div style={{ fontSize: '10px', color: '#f5edd8', opacity: 0.6, marginTop: '2px' }}>
            (Configured by preset)
          </div>
        </div>

        {/* Glow Intensity Control */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#f5edd8',
            fontSize: '12px',
            marginBottom: '4px',
          }}>
            Glow Intensity: {currentPreset.trail.glowIntensity.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={currentPreset.trail.glowIntensity}
            disabled
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#1a2620',
              outline: 'none',
              borderRadius: '2px',
              opacity: 0.5,
            }}
          />
          <div style={{ fontSize: '10px', color: '#f5edd8', opacity: 0.6, marginTop: '2px' }}>
            (Configured by preset)
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render shader controls tab.
   */
  const renderShadersTab = () => (
    <div style={{ padding: '16px' }}>
      <h4 style={{
        color: '#faeaaa',
        fontSize: '14px',
        marginBottom: '16px',
        fontFamily: '"Cinzel", serif',
      }}>
        Shader Effects
      </h4>

      {/* Liquid Gauge Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h5 style={{
          color: '#faeaaa',
          fontSize: '12px',
          marginBottom: '8px',
        }}>
          Liquid Gauge
        </h5>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{
            display: 'block',
            color: '#f5edd8',
            fontSize: '11px',
            marginBottom: '2px',
          }}>
            Viscosity: {(liquidGaugeConfig.viscosity ?? 0.3).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={liquidGaugeConfig.viscosity ?? 0.3}
            onChange={(e) => setLiquidGaugeConfig({ 
              ...liquidGaugeConfig, 
              viscosity: parseFloat(e.target.value) 
            })}
            style={{
              width: '100%',
              height: '3px',
              backgroundColor: '#1a2620',
              outline: 'none',
              borderRadius: '2px',
            }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{
            display: 'block',
            color: '#f5edd8',
            fontSize: '11px',
            marginBottom: '2px',
          }}>
            Turbulence: {(liquidGaugeConfig.turbulence ?? 0.2).toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={liquidGaugeConfig.turbulence ?? 0.2}
            onChange={(e) => setLiquidGaugeConfig({ 
              ...liquidGaugeConfig, 
              turbulence: parseFloat(e.target.value) 
            })}
            style={{
              width: '100%',
              height: '3px',
              backgroundColor: '#1a2620',
              outline: 'none',
              borderRadius: '2px',
            }}
          />
        </div>
      </div>

      {/* Fog Slot Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h5 style={{
          color: '#faeaaa',
          fontSize: '12px',
          marginBottom: '8px',
        }}>
          Fog Slot
        </h5>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{
            display: 'block',
            color: '#f5edd8',
            fontSize: '11px',
            marginBottom: '2px',
          }}>
            Density: {(fogSlotConfig.density ?? 0.6).toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={fogSlotConfig.density ?? 0.6}
            onChange={(e) => setFogSlotConfig({ 
              ...fogSlotConfig, 
              density: parseFloat(e.target.value) 
            })}
            style={{
              width: '100%',
              height: '3px',
              backgroundColor: '#1a2620',
              outline: 'none',
              borderRadius: '2px',
            }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{
            display: 'block',
            color: '#f5edd8',
            fontSize: '11px',
            marginBottom: '2px',
          }}>
            Movement Speed: {(fogSlotConfig.movementSpeed ?? 0.8).toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={fogSlotConfig.movementSpeed ?? 0.8}
            onChange={(e) => setFogSlotConfig({ 
              ...fogSlotConfig, 
              movementSpeed: parseFloat(e.target.value) 
            })}
            style={{
              width: '100%',
              height: '3px',
              backgroundColor: '#1a2620',
              outline: 'none',
              borderRadius: '2px',
            }}
          />
        </div>
      </div>

      {/* Foil Card Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h5 style={{
          color: '#faeaaa',
          fontSize: '12px',
          marginBottom: '8px',
        }}>
          Foil Card
        </h5>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{
            display: 'block',
            color: '#f5edd8',
            fontSize: '11px',
            marginBottom: '2px',
          }}>
            Shimmer Intensity: {(foilCardConfig.shimmerIntensity ?? 0.8).toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={foilCardConfig.shimmerIntensity ?? 0.8}
            onChange={(e) => setFoilCardConfig({ 
              ...foilCardConfig, 
              shimmerIntensity: parseFloat(e.target.value) 
            })}
            style={{
              width: '100%',
              height: '3px',
              backgroundColor: '#1a2620',
              outline: 'none',
              borderRadius: '2px',
            }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{
            display: 'block',
            color: '#f5edd8',
            fontSize: '11px',
            marginBottom: '2px',
          }}>
            Metallic Reflection: {(foilCardConfig.metallicReflection ?? 0.7).toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={foilCardConfig.metallicReflection ?? 0.7}
            onChange={(e) => setFoilCardConfig({ 
              ...foilCardConfig, 
              metallicReflection: parseFloat(e.target.value) 
            })}
            style={{
              width: '100%',
              height: '3px',
              backgroundColor: '#1a2620',
              outline: 'none',
              borderRadius: '2px',
            }}
          />
        </div>
      </div>

      {/* Export Shader Configs */}
      <div>
        <button
          onClick={exportFxConfig}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: '#786000',
            color: '#03040a',
            border: '1px solid #c8a030',
            borderRadius: '2px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: '"Cinzel", serif',
            textTransform: 'uppercase',
          }}
        >
          📤 Export FX Configuration
        </button>
      </div>
    </div>
  );

  return (
    <div className={`fx-control-panel ${className}`} style={{
      backgroundColor: '#1a2620',
      border: '1px solid #44c470',
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Tab Navigation */}
      <div style={{
        borderBottom: '1px solid #44c470',
        padding: '8px',
        display: 'flex',
        gap: '8px',
      }}>
        {[
          { key: 'particles', label: 'Particles', icon: '✨' },
          { key: 'cursor', label: 'Cursor', icon: '👆' },
          { key: 'shaders', label: 'Shaders', icon: '🎨' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'particles' | 'cursor' | 'shaders')}
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
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'particles' && renderParticlesTab()}
        {activeTab === 'cursor' && renderCursorTab()}
        {activeTab === 'shaders' && renderShadersTab()}
      </div>

      {/* Performance Mode Indicator */}
      {performanceMode && (
        <div style={{
          borderTop: '1px solid #44c470',
          padding: '8px',
          backgroundColor: '#141d18',
          textAlign: 'center',
          fontSize: '10px',
          color: '#faeaaa',
          fontWeight: 'bold',
        }}>
          ⚡ PERFORMANCE MODE ENABLED
        </div>
      )}
    </div>
  );
};
