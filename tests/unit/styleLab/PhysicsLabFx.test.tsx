/**
 * Physics Lab FX Unit Tests
 *
 * Test suite for particle engine, cursor presets, and shader configurations.
 * Covers WebGPU fallback detection and FX control panel functionality.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParticleEngineDemo } from '@/ui/styleLab/physicsLab/fx/particleEngineDemo';
import { FxControlPanel } from '@/ui/styleLab/physicsLab/fx/FxControlPanel';
import { 
  getCursorPreset, 
  getEnabledCursorPresets, 
  validateCursorPreset,
  exportCursorPreset,
  importCursorPreset,
  type CursorPresetType 
} from '@/ui/styleLab/physicsLab/fx/cursorPresets';
import { 
  detectWebGPUSupport,
  detectWebGL2Support,
  useWebGPUFallback,
  type ShaderConfig 
} from '@/ui/styleLab/physicsLab/fx/hooks/useWebGPUFallback';
import { 
  createLiquidGaugeShaderConfig,
  createFogSlotShaderConfig,
  createFoilCardShaderConfig,
  DEFAULT_LIQUID_GAUGE_CONFIG,
  DEFAULT_FOG_SLOT_CONFIG,
  DEFAULT_FOIL_CARD_CONFIG
} from '@/ui/styleLab/physicsLab/fx/shaders';
import { type PhysicsPreset } from '@/ui/styleLab/config/physicsPresets';

// Mock canvas for WebGPU tests
const mockCanvas = {
  getContext: vi.fn(),
  width: 512,
  height: 512,
  style: {},
} as any as HTMLCanvasElement;

// Mock navigator for WebGPU detection
const mockNavigator = {
  gpu: {
    requestAdapter: vi.fn(),
  },
} as any;

describe('ParticleEngineDemo', () => {
  const mockConfig: PhysicsPreset = {
    id: 'minimalFrontier',
    label: 'Minimal Frontier',
    description: 'Test preset',
    liftScale: 1.08,
    spring: { stiffness: 180, tiltIntensity: 8 },
    mass: 1.2,
    damping: { coefficient: 22, friction: 0.32 },
    buttonSquash: 0.94,
    slotGlow: { intensity: 0.6, chroma: 0.42 },
    cursor: { trail: 'ember', velocityScale: 1.2, emittersEnabled: true },
    fxProfile: { id: 'gildedObservatory', particleDensity: 0.5, vignetteStrength: 0.35 },
    audioProfile: { 
      soundPack: 'gilded',
      masterVolume: 0.8,
      maxConcurrentCues: 4,
      ducking: { enabled: true, amount: 0.3, fadeTimeMs: 100 }
    },
    metadata: { summary: 'Test preset' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders particle engine demo with correct initial state', () => {
    render(<ParticleEngineDemo config={mockConfig} />);
    
    expect(screen.getByText('Particle Engine Demo')).toBeInTheDocument();
    expect(screen.getByText('Click canvas to trigger effect')).toBeInTheDocument();
    expect(screen.getByText('Performance Mode: OFF')).toBeInTheDocument();
  });

  it('shows performance mode indicator when enabled', () => {
    render(<ParticleEngineDemo config={mockConfig} performanceMode={true} />);
    
    expect(screen.getByText('Performance Mode: ON')).toBeInTheDocument();
  });

  it('allows switching between effect types', () => {
    render(<ParticleEngineDemo config={mockConfig} />);
    
    const flyToButton = screen.getByText('fly-to');
    const burstButton = screen.getByText('burst');
    const shatterButton = screen.getByText('shatter');
    
    expect(flyToButton).toBeInTheDocument();
    expect(burstButton).toBeInTheDocument();
    expect(shatterButton).toBeInTheDocument();
    
    fireEvent.click(burstButton);
    expect(burstButton).toHaveStyle({ backgroundColor: '#d4aa50' });
  });

  it('displays particle count information', () => {
    render(<ParticleEngineDemo config={mockConfig} />);
    
    // Initially should show 0 particles
    expect(screen.getByText(/Particles:/)).toBeInTheDocument();
  });
});

describe('Cursor Presets', () => {
  it('returns correct cursor preset for gauntlet', () => {
    const preset = getCursorPreset('gauntlet');
    
    expect(preset.id).toBe('gauntlet');
    expect(preset.name).toBe('Gauntlet');
    expect(preset.trail.trailLength).toBe(1.2);
    expect(preset.avatar.icon).toBe('👊');
  });

  it('returns correct cursor preset for arcane wand', () => {
    const preset = getCursorPreset('arcaneWand');
    
    expect(preset.id).toBe('arcaneWand');
    expect(preset.name).toBe('Arcane Wand');
    expect(preset.trail.trailLength).toBe(1.8);
    expect(preset.avatar.icon).toBe('🪄');
  });

  it('returns correct cursor preset for sword', () => {
    const preset = getCursorPreset('sword');
    
    expect(preset.id).toBe('sword');
    expect(preset.name).toBe('Sword');
    expect(preset.trail.trailLength).toBe(0.8);
    expect(preset.avatar.icon).toBe('⚔️');
  });

  it('returns enabled cursor presets sorted by priority', () => {
    const presets = getEnabledCursorPresets();
    
    expect(presets).toHaveLength(3);
    expect(presets[0].priority).toBe(1); // gauntlet
    expect(presets[1].priority).toBe(2); // arcane wand
    expect(presets[2].priority).toBe(3); // sword
  });

  it('validates correct cursor preset', () => {
    const validPreset = getCursorPreset('gauntlet');
    expect(validateCursorPreset(validPreset)).toBe(true);
  });

  it('rejects invalid cursor preset', () => {
    const invalidPreset = { id: 'invalid', name: 'Invalid' };
    expect(validateCursorPreset(invalidPreset)).toBe(false);
  });

  it('exports cursor preset as JSON', () => {
    const jsonString = exportCursorPreset('gauntlet');
    const parsed = JSON.parse(jsonString);
    
    expect(parsed.id).toBe('gauntlet');
    expect(parsed.name).toBe('Gauntlet');
  });

  it('imports valid cursor preset from JSON', () => {
    const validJson = JSON.stringify(getCursorPreset('sword'));
    const imported = importCursorPreset(validJson);
    
    expect(imported?.id).toBe('sword');
    expect(imported?.name).toBe('Sword');
  });

  it('returns null for invalid JSON import', () => {
    const invalidJson = '{ invalid json }';
    const imported = importCursorPreset(invalidJson);
    
    expect(imported).toBeNull();
  });
});

describe('Shader Configurations', () => {
  it('creates liquid gauge shader config with defaults', () => {
    const config = createLiquidGaugeShaderConfig();
    
    expect(config.uniforms.viscosity.value).toBe(DEFAULT_LIQUID_GAUGE_CONFIG.viscosity);
    expect(config.uniforms.turbulence.value).toBe(DEFAULT_LIQUID_GAUGE_CONFIG.turbulence);
    expect(config.vertexShader).toContain('Vertex shader for liquid gauge effect');
    expect(config.fragmentShader).toContain('Fragment shader for liquid gauge effect');
  });

  it('creates liquid gauge shader config with custom values', () => {
    const customConfig = {
      viscosity: 0.8,
      turbulence: 0.5,
      fluidColor: '#ff0000',
    };
    
    const config = createLiquidGaugeShaderConfig(customConfig);
    
    expect(config.uniforms.viscosity.value).toBe(0.8);
    expect(config.uniforms.turbulence.value).toBe(0.5);
    expect(config.uniforms.fluidColor.value).toEqual([1, 0, 0]); // #ff0000 -> RGB
  });

  it('creates fog slot shader config with defaults', () => {
    const config = createFogSlotShaderConfig();
    
    expect(config.uniforms.density.value).toBe(DEFAULT_FOG_SLOT_CONFIG.density);
    expect(config.uniforms.movementSpeed.value).toBe(DEFAULT_FOG_SLOT_CONFIG.movementSpeed);
    expect(config.vertexShader).toContain('Vertex shader for fog slot effect');
    expect(config.fragmentShader).toContain('Fragment shader for fog slot effect');
  });

  it('creates foil card shader config with defaults', () => {
    const config = createFoilCardShaderConfig();
    
    expect(config.uniforms.shimmerIntensity.value).toBe(DEFAULT_FOIL_CARD_CONFIG.shimmerIntensity);
    expect(config.uniforms.metallicReflection.value).toBe(DEFAULT_FOIL_CARD_CONFIG.metallicReflection);
    expect(config.vertexShader).toContain('Vertex shader for foil card effect');
    expect(config.fragmentShader).toContain('Fragment shader for foil card effect');
  });
});

describe('WebGPU Fallback Hook', () => {
  beforeEach(() => {
    // Reset navigator mock
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
    });
  });

  it('detects WebGPU support when available', () => {
    expect(detectWebGPUSupport()).toBe(true);
  });

  it('detects WebGL2 support when available', () => {
    expect(detectWebGL2Support()).toBe(true);
  });

  it('returns correct initial state', () => {
    const TestComponent = () => {
      const hook = useWebGPUFallback({
        uniforms: { time: { type: 'float', value: 0 } },
        vertexShader: 'test vertex',
        fragmentShader: 'test fragment',
      });

      return (
        <div>
          <div data-testid="status">{hook.status}</div>
          <div data-testid="webgpu-supported">{hook.isWebGPUSupported.toString()}</div>
          <div data-testid="webgl2-supported">{hook.isWebGL2Supported.toString()}</div>
          <div data-testid="shaders-ready">{hook.shadersReady.toString()}</div>
        </div>
      );
    };

    render(<TestComponent />);
    
    expect(screen.getByTestId('status')).toHaveTextContent('webgpu');
    expect(screen.getByTestId('webgpu-supported')).toHaveTextContent('true');
    expect(screen.getByTestId('webgl2-supported')).toHaveTextContent('true');
    expect(screen.getByTestId('shaders-ready')).toHaveTextContent('false');
  });
});

describe('FX Control Panel', () => {
  const mockConfig: PhysicsPreset = {
    id: 'minimalFrontier',
    label: 'Minimal Frontier',
    description: 'Test preset',
    liftScale: 1.08,
    spring: { stiffness: 180, tiltIntensity: 8 },
    mass: 1.2,
    damping: { coefficient: 22, friction: 0.32 },
    buttonSquash: 0.94,
    slotGlow: { intensity: 0.6, chroma: 0.42 },
    cursor: { trail: 'ember', velocityScale: 1.2, emittersEnabled: true },
    fxProfile: { id: 'gildedObservatory', particleDensity: 0.5, vignetteStrength: 0.35 },
    audioProfile: { 
      soundPack: 'gilded',
      masterVolume: 0.8,
      maxConcurrentCues: 4,
      ducking: { enabled: true, amount: 0.3, fadeTimeMs: 100 }
    },
    metadata: { summary: 'Test preset' }
  };

  const mockOnUpdateConfig = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders FX control panel with tabs', () => {
    render(
      <FxControlPanel 
        config={mockConfig} 
        onUpdateConfig={mockOnUpdateConfig}
      />
    );
    
    expect(screen.getByText('Particles')).toBeInTheDocument();
    expect(screen.getByText('Cursor')).toBeInTheDocument();
    expect(screen.getByText('Shaders')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    render(
      <FxControlPanel 
        config={mockConfig} 
        onUpdateConfig={mockOnUpdateConfig}
      />
    );
    
    const cursorTab = screen.getByText('Cursor');
    fireEvent.click(cursorTab);
    
    await waitFor(() => {
      expect(screen.getByText('Cursor Avatar')).toBeInTheDocument();
    });
  });

  it('updates particle density when slider changes', async () => {
    render(
      <FxControlPanel 
        config={mockConfig} 
        onUpdateConfig={mockOnUpdateConfig}
      />
    );
    
    const particleDensitySlider = screen.getByDisplayValue('0.5');
    fireEvent.change(particleDensitySlider, { target: { value: '0.8' } });
    
    expect(mockOnUpdateConfig).toHaveBeenCalledWith({
      fxProfile: { ...mockConfig.fxProfile, particleDensity: 0.8 }
    });
  });

  it('shows performance mode indicator when enabled', () => {
    render(
      <FxControlPanel 
        config={mockConfig} 
        onUpdateConfig={mockOnUpdateConfig}
        performanceMode={true}
      />
    );
    
    expect(screen.getByText('⚡ PERFORMANCE MODE ENABLED')).toBeInTheDocument();
  });

  it('exports FX configuration when export button is clicked', async () => {
    // Mock URL.createObjectURL and download
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    const linkMock = {
      setAttribute: vi.fn(),
      click: vi.fn(),
    } as any;
    
    vi.spyOn(document, 'createElement').mockReturnValue(linkMock);
    
    render(
      <FxControlPanel 
        config={mockConfig} 
        onUpdateConfig={mockOnUpdateConfig}
      />
    );
    
    // Switch to shaders tab
    const shadersTab = screen.getByText('Shaders');
    fireEvent.click(shadersTab);
    
    await waitFor(() => {
      expect(screen.getByText('Export FX Configuration')).toBeInTheDocument();
    });
    
    const exportButton = screen.getByText('Export FX Configuration');
    fireEvent.click(exportButton);
    
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(linkMock.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('physics-fx-config-'));
    expect(linkMock.click).toHaveBeenCalled();
  });
});
