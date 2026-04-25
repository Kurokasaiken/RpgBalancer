/**
 * WebGPU Shader Component for Physics Lab FX
 *
 * Renders shader effects with WebGPU/WebGL2 fallback.
 */

import { useWebGPUShaders } from '../hooks/useWebGPUShaders';

/**
 * Shader configuration interface
 */
export interface ShaderConfig {
  viscosity: number;
  turbulence: number;
  foilShimmer: number;
  color: string;
  intensity: number;
}

/**
 * WebGPU Shader Component
 */
export const WebGPUShaders = ({ config, _initialShaderType = 'liquid-gauge' }: {
  config: ShaderConfig;
  initialShaderType?: 'liquid-gauge' | 'fog-slot' | 'foil-card';
}) => {
  const { canvasRef, isWebGPUSupported, fallbackReason, shaderType, setShaderType, start, stop } = useWebGPUShaders(config);

  /**
   * Handle shader type change
   */
  const handleShaderTypeChange = (newType: 'liquid-gauge' | 'fog-slot' | 'foil-card') => {
    setShaderType(newType);
  };

  return (
    <div className="webgpu-shaders">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          border: '1px solid #333',
          borderRadius: '8px',
          background: '#000',
        }}
      />
      
      <div className="shader-controls" style={{ marginTop: '16px' }}>
        <div>WebGPU Support: {isWebGPUSupported ? '✅' : '❌'}</div>
        {fallbackReason && <div>Fallback: {fallbackReason}</div>}
        <div>Current Shader: {shaderType}</div>
        
        <div style={{ marginTop: '8px' }}>
          <button
            onClick={() => handleShaderTypeChange('liquid-gauge')}
            disabled={shaderType === 'liquid-gauge'}
            style={{
              marginRight: '8px',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #666',
              background: shaderType === 'liquid-gauge' ? '#333' : '#222',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Liquid Gauge
          </button>
          
          <button
            onClick={() => handleShaderTypeChange('fog-slot')}
            disabled={shaderType === 'fog-slot'}
            style={{
              marginRight: '8px',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #666',
              background: shaderType === 'fog-slot' ? '#333' : '#222',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Fog Slot
          </button>
          
          <button
            onClick={() => handleShaderTypeChange('foil-card')}
            disabled={shaderType === 'foil-card'}
            style={{
              marginRight: '8px',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #666',
              background: shaderType === 'foil-card' ? '#333' : '#222',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Foil Card
          </button>
        </div>
        
        <div style={{ marginTop: '8px' }}>
          <button
            onClick={start}
            style={{
              marginRight: '8px',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #666',
              background: '#222',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Start
          </button>
          
          <button
            onClick={stop}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #666',
              background: '#222',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Stop
          </button>
        </div>
      </div>
    </div>
  );
};
