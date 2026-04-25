/**
 * Chaos Mode Component for Physics Lab FX
 *
 * Integrates particle engine and custom cursor layer with controls
 * for density, lifetime, color, draw mode, and performance settings.
 */

import React, { useState } from 'react';
import { useParticleEngine, ENABLE_FX_PERF_MODE } from './ParticleEngine';
import { useCustomCursorLayer } from './CustomCursorLayer';
import { useWebGPUShaders } from './WebGPUShaders';
import type { ParticleEngineConfig } from './ParticleEngine.types';
import type { CustomCursorConfig } from './CustomCursorLayer';
import type { ShaderConfig } from './WebGPUShaders';

/**
 * Chaos Mode configuration interface
 */
interface ChaosModeConfig {
  particleEngine: ParticleEngineConfig;
  cursorLayer: CustomCursorConfig;
  webGPUShaders: ShaderConfig;
  enabled: boolean;
}

/**
 * Default Chaos Mode configuration
 */
const DEFAULT_CHAOS_CONFIG: ChaosModeConfig = {
  particleEngine: {
    density: 0.5,
    lifetime: 2000,
    color: '#c8a030',
    drawMode: 'points',
    performanceMode: ENABLE_FX_PERF_MODE,
  },
  cursorLayer: {
    preset: 'gauntlet',
    trailLength: 1.5,
    glowIntensity: 0.7,
    easing: 'ease-out',
  },
  webGPUShaders: {
    viscosity: 0.8,
    turbulence: 0.3,
    foilShimmer: 0.5,
    color: '#8b5cf6',
    intensity: 0.6,
  },
  enabled: false,
};

/**
 * Chaos Mode Component
 */
export const ChaosMode: React.FC = () => {
  const [config, setConfig] = useState<ChaosModeConfig>(DEFAULT_CHAOS_CONFIG);
  const [isExpanded, setIsExpanded] = useState(false);

  const particleEngine = useParticleEngine(config.particleEngine);
  const cursorLayer = useCustomCursorLayer(config.cursorLayer);
  const webGPUShaders = useWebGPUShaders(config.webGPUShaders);

  /**
   * Toggle Chaos Mode
   */
  const toggleChaosMode = () => {
    setConfig(prev => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  /**
   * Update particle engine configuration
   */
  const updateParticleEngine = (updates: Partial<ParticleEngineConfig>) => {
    setConfig(prev => ({
      ...prev,
      particleEngine: { ...prev.particleEngine, ...updates },
    }));
  };

  /**
   * Update cursor layer configuration
   */
  const updateCursorLayer = (updates: Partial<CustomCursorConfig>) => {
    setConfig(prev => ({
      ...prev,
      cursorLayer: { ...prev.cursorLayer, ...updates },
    }));
  };

  /**
   * Update WebGPU shaders configuration
   */
  const updateWebGPUShaders = (updates: Partial<ShaderConfig>) => {
    setConfig(prev => ({
      ...prev,
      webGPUShaders: { ...prev.webGPUShaders, ...updates },
    }));
  };

  /**
   * Spawn demo particle effects
   */
  const spawnDemoEffects = () => {
    if (!particleEngine.start) return;

    // Resource fly-to effect
    setTimeout(() => {
      particleEngine.spawnResourceFlyTo(100, 100, 200, 200, 30);
    }, 500);

    // Completion burst effect
    setTimeout(() => {
      particleEngine.spawnCompletionBurst(200, 200, 40);
    }, 1500);

    // Stone shatter effect
    setTimeout(() => {
      particleEngine.spawnStoneShatter(150, 150, 25);
    }, 2500);
  };

  if (!config.enabled) {
    return (
      <div className="chaos-mode">
        <h3>Chaos Mode</h3>
        <button className="chaos-button" onClick={toggleChaosMode}>
          🌪️ Enable Chaos Mode (PL-FX)
        </button>
        <p className="chaos-description">
          Advanced particle effects and physics distortions coming in Phase FX.
        </p>
      </div>
    );
  }

  return (
    <div className="chaos-mode">
      <h3>Chaos Mode</h3>
      <button className="chaos-button" onClick={toggleChaosMode}>
        🌪️ Disable Chaos Mode
      </button>
      
      {isExpanded && (
        <div className="chaos-controls">
          <div className="control-section">
            <h4>Particle Engine</h4>
            <div className="control-group">
              <label>
                Density:
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.particleEngine.density}
                  onChange={(e) => updateParticleEngine({ density: parseFloat(e.target.value) })}
                />
                <span>{config.particleEngine.density.toFixed(1)}</span>
              </label>
              <label>
                Lifetime (ms):
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={config.particleEngine.lifetime}
                  onChange={(e) => updateParticleEngine({ lifetime: parseInt(e.target.value) })}
                />
                <span>{config.particleEngine.lifetime}ms</span>
              </label>
              <label>
                Color:
                <input
                  type="color"
                  value={config.particleEngine.color}
                  onChange={(e) => updateParticleEngine({ color: e.target.value })}
                />
              </label>
              <label>
                Draw Mode:
                <select
                  value={config.particleEngine.drawMode}
                  onChange={(e) => updateParticleEngine({ drawMode: e.target.value as 'points' | 'lines' | 'triangles' })}
                >
                  <option value="points">Points</option>
                  <option value="lines">Lines</option>
                  <option value="triangles">Triangles</option>
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={config.particleEngine.performanceMode}
                  onChange={(e) => updateParticleEngine({ performanceMode: e.target.checked })}
                />
                Performance Mode
              </label>
            </div>
          </div>

          <div className="control-section">
            <h4>Cursor Layer</h4>
            <div className="control-group">
              <label>
                Preset:
                <select
                  value={config.cursorLayer.preset}
                  onChange={(e) => updateCursorLayer({ preset: e.target.value as 'gauntlet' | 'arcaneWand' | 'sword' })}
                >
                  <option value="gauntlet">Gauntlet</option>
                  <option value="arcaneWand">Arcane Wand</option>
                  <option value="sword">Sword</option>
                </select>
              </label>
              <label>
                Trail Length:
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={config.cursorLayer.trailLength}
                  onChange={(e) => updateCursorLayer({ trailLength: parseFloat(e.target.value) })}
                />
                <span>{config.cursorLayer.trailLength.toFixed(1)}</span>
              </label>
              <label>
                Glow Intensity:
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.cursorLayer.glowIntensity}
                  onChange={(e) => updateCursorLayer({ glowIntensity: parseFloat(e.target.value) })}
                />
                <span>{config.cursorLayer.glowIntensity.toFixed(1)}</span>
              </label>
              <label>
                Easing:
                <select
                  value={config.cursorLayer.easing}
                  onChange={(e) => updateCursorLayer({ easing: e.target.value as 'linear' | 'ease-out' | 'ease-in-out' | 'bounce' })}
                >
                  <option value="linear">Linear</option>
                  <option value="ease-out">Ease Out</option>
                  <option value="ease-in-out">Ease In Out</option>
                  <option value="bounce">Bounce</option>
                </select>
              </label>
            </div>
          </div>

          <div className="control-section">
            <h4>WebGPU Shaders</h4>
            <div className="control-group">
              <label>
                Shader Type:
                <select
                  value={webGPUShaders.shaderType}
                  onChange={(e) => webGPUShaders.setShaderType(e.target.value as 'liquid-gauge' | 'fog-slot' | 'foil-card')}
                >
                  <option value="liquid-gauge">Liquid Gauge</option>
                  <option value="fog-slot">Fog Slot</option>
                  <option value="foil-card">Foil Card</option>
                </select>
              </label>
              <label>
                Viscosity:
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={config.webGPUShaders.viscosity}
                  onChange={(e) => updateWebGPUShaders({ viscosity: parseFloat(e.target.value) })}
                />
                <span>{config.webGPUShaders.viscosity.toFixed(1)}</span>
              </label>
              <label>
                Turbulence:
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.webGPUShaders.turbulence}
                  onChange={(e) => updateWebGPUShaders({ turbulence: parseFloat(e.target.value) })}
                />
                <span>{config.webGPUShaders.turbulence.toFixed(1)}</span>
              </label>
              <label>
                Foil Shimmer:
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.webGPUShaders.foilShimmer}
                  onChange={(e) => updateWebGPUShaders({ foilShimmer: parseFloat(e.target.value) })}
                />
                <span>{config.webGPUShaders.foilShimmer.toFixed(1)}</span>
              </label>
              <label>
                Intensity:
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.webGPUShaders.intensity}
                  onChange={(e) => updateWebGPUShaders({ intensity: parseFloat(e.target.value) })}
                />
                <span>{config.webGPUShaders.intensity.toFixed(1)}</span>
              </label>
            </div>
          </div>

          <div className="control-actions">
            <button className="demo-button" onClick={spawnDemoEffects}>
              🎆 Spawn Demo Effects
            </button>
            <button className="export-button" onClick={webGPUShaders.exportShaderConfig}>
              📤 Export Shader Config
            </button>
            <button className="clear-button" onClick={() => particleEngine.clear()}>
              🗑️ Clear Particles
            </button>
          </div>
        </div>
      )}

      <div className="chaos-status">
        <div className="status-item">
          <span className="status-label">Particles:</span>
          <span className="status-value">{particleEngine.particleCount}</span>
        </div>
        <div className="status-item">
          <span className="status-label">WebGPU:</span>
          <span className={`status-value ${webGPUShaders.isWebGPUSupported ? 'success' : 'warning'}`}>
            {webGPUShaders.isWebGPUSupported ? '✅' : '⚠️'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Performance:</span>
          <span className={`status-value ${config.particleEngine.performanceMode ? 'warning' : 'success'}`}>
            {config.particleEngine.performanceMode ? '🚀' : '✅'}
          </span>
        </div>
      </div>

      <style jsx>{`
        .chaos-mode {
          padding: 16px;
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(200, 160, 48, 0.3);
          border-radius: 8px;
          color: #f5f5f4;
          font-family: "Cinzel", serif;
        }

        .chaos-button {
          background: linear-gradient(135deg, #c8a030, #a08020);
          border: 1px solid #c8a030;
          color: #f5f5f4;
          padding: 8px 16px;
          border-radius: 4px;
          font-family: "Cinzel", serif;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .chaos-button:hover {
          background: linear-gradient(135deg, #e0bc50, #c8a030);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(200, 160, 48, 0.3);
        }

        .chaos-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chaos-description {
          font-size: 12px;
          font-style: italic;
          opacity: 0.8;
          margin-top: 8px;
        }

        .chaos-controls {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .control-section {
          background: rgba(0, 0, 0, 0.4);
          padding: 12px;
          border-radius: 4px;
        }

        .control-section h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #e0bc50;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .control-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .control-group input[type="range"] {
          flex: 1;
          height: 4px;
        }

        .control-group select {
          flex: 1;
          padding: 2px;
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid #555;
          color: #f5f5f4;
          border-radius: 2px;
        }

        .control-group input[type="checkbox"] {
          width: 16px;
          height: 16px;
        }

        .control-group span {
          min-width: 60px;
          font-family: monospace;
          font-size: 11px;
        }

        .control-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }

        .demo-button,
        .export-button,
        .clear-button {
          padding: 6px 12px;
          border: 1px solid;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.6);
          color: #f5f5f4;
          font-family: "Cinzel", serif;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .demo-button {
          border-color: #e0bc50;
        }

        .export-button {
          border-color: #3b82f6;
        }

        .clear-button {
          border-color: #ef4444;
        }

        .demo-button:hover {
          background: rgba(224, 188, 80, 0.2);
          border-color: #e0bc50;
        }

        .export-button:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: #3b82f6;
        }

        .clear-button:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
        }

        .chaos-status {
          display: flex;
          gap: 16px;
          margin-top: 16px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 4px;
          font-size: 11px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .status-label {
          opacity: 0.7;
        }

        .status-value {
          font-family: monospace;
          font-weight: bold;
        }

        .status-value.success {
          color: #10b981;
        }

        .status-value.warning {
          color: #f59e0b;
        }

        .status-value.error {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
};
