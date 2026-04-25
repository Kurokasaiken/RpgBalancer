/**
 * WebGPU Fallback Hook
 *
 * Detects WebGPU support and provides fallback to WebGL2 when needed.
 * Handles shader compilation, pipeline creation, and rendering context management.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * WebGPU support status.
 */
export type WebGPUSupportStatus = 'webgpu' | 'webgl2' | 'none';

/**
 * Shader configuration interface.
 */
export interface ShaderConfig {
  uniforms: Record<string, { type: string; value: number | number[] }>;
  vertexShader: string;
  fragmentShader: string;
  vertexShaderWebGL2?: string;
  fragmentShaderWebGL2?: string;
}

/**
 * WebGPU fallback hook return value.
 */
export interface UseWebGPUFallbackReturn {
  /** Current rendering backend status */
  status: WebGPUSupportStatus;
  /** Whether WebGPU is supported */
  isWebGPUSupported: boolean;
  /** Whether WebGL2 is supported */
  isWebGL2Supported: boolean;
  /** Canvas rendering context */
  context: GPUCanvasContext | WebGL2RenderingContext | null;
  /** Whether shaders are ready */
  shadersReady: boolean;
  /** Error message if setup failed */
  error: string | null;
  /** Initialize rendering context */
  initializeContext: (canvas: HTMLCanvasElement) => Promise<boolean>;
  /** Update shader uniforms */
  updateUniforms: (uniforms: Record<string, number | number[]>) => void;
  /** Render frame */
  render: (time: number) => void;
  /** Cleanup resources */
  cleanup: () => void;
}

/**
 * Detects WebGPU support in the current browser.
 * @returns True if WebGPU is supported.
 */
export const detectWebGPUSupport = (): boolean => {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
};

/**
 * Detects WebGL2 support in the current browser.
 * @returns True if WebGL2 is supported.
 */
export const detectWebGL2Support = (): boolean => {
  if (typeof document === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  return gl !== null;
};

/**
 * Creates WebGPU rendering pipeline.
 * @param device - WebGPU device.
 * @param config - Shader configuration.
 * @returns Render pipeline or null if failed.
 */
export const createWebGPUPipeline = async (
  device: GPUDevice,
  config: ShaderConfig
): Promise<GPURenderPipeline | null> => {
  try {
    // Create shader module
    const shaderModule = device.createShaderModule({
      code: config.vertexShader + config.fragmentShader,
    });

    // Create pipeline layout
    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [],
    });

    // Create render pipeline
    const pipeline = await device.createRenderPipelineAsync({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'main',
        buffers: [],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'main',
        targets: [
          {
            format: 'bgra8unorm',
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });

    return pipeline;
  } catch (error) {
    console.error('Failed to create WebGPU pipeline:', error);
    return null;
  }
};

/**
 * Creates WebGL2 shader program.
 * @param gl - WebGL2 context.
 * @param config - Shader configuration.
 * @returns Shader program or null if failed.
 */
export const createWebGL2Program = (
  gl: WebGL2RenderingContext,
  config: ShaderConfig
): WebGLProgram | null => {
  try {
    // Use WebGL2 shaders if available, otherwise try to convert
    const vertexShaderSource = config.vertexShaderWebGL2 || convertWGSLToGLSL(config.vertexShader, 'vertex');
    const fragmentShaderSource = config.fragmentShaderWebGL2 || convertWGSLToGLSL(config.fragmentShader, 'fragment');

    // Create shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) return null;

    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Vertex shader compilation failed:', gl.getShaderInfoLog(vertexShader));
      gl.deleteShader(vertexShader);
      return null;
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) {
      gl.deleteShader(vertexShader);
      return null;
    }

    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader compilation failed:', gl.getShaderInfoLog(fragmentShader));
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    // Create program
    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking failed:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    // Clean up shaders (they're linked to the program)
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
  } catch (error) {
    console.error('Failed to create WebGL2 program:', error);
    return null;
  }
};

/**
 * Basic WGSL to GLSL converter (simplified).
 * This is a minimal converter for basic shader structures.
 * @param wgsl - WGSL shader code.
 * @param type - Shader type ('vertex' or 'fragment').
 * @returns GLSL shader code.
 */
export const convertWGSLToGLSL = (wgsl: string, type: 'vertex' | 'fragment'): string => {
  let glsl = wgsl;

  // Add version directive
  glsl = `#version 300 es\nprecision highp float;\n\n${glsl}`;

  // Replace WGSL types with GLSL types
  glsl = glsl.replace(/vec2<f32>/g, 'vec2');
  glsl = glsl.replace(/vec3<f32>/g, 'vec3');
  glsl = glsl.replace(/vec4<f32>/g, 'vec4');
  glsl = glsl.replace(/mat4x4<f32>/g, 'mat4');
  glsl = glsl.replace(/f32/g, 'float');
  glsl = glsl.replace(/i32/g, 'int');
  glsl = glsl.replace(/u32/g, 'uint');

  // Replace WGSL builtins with GLSL
  glsl = glsl.replace(/@builtin\(position\)/g, type === 'vertex' ? 'gl_Position' : '');
  glsl = glsl.replace(/@location\(0\)/g, type === 'vertex' ? 'layout(location = 0)' : 'layout(location = 0) out');
  glsl = glsl.replace(/@location\(1\)/g, type === 'vertex' ? 'layout(location = 1)' : 'layout(location = 1) out');
  glsl = glsl.replace(/@location\(2\)/g, type === 'vertex' ? 'layout(location = 2)' : 'layout(location = 2) out');

  // Replace function attributes
  glsl = glsl.replace(/@vertex/g, '');
  glsl = glsl.replace(/@fragment/g, '');
  glsl = glsl.replace(/@group\(0\) @binding\(0\)/g, 'uniform');

  // Replace struct declarations
  glsl = glsl.replace(/struct (\w+) \{([^}]+)\}/g, 'struct $1 {$2};');

  // Replace variable declarations
  glsl = glsl.replace(/var<uniform> (\w+): (\w+) =/g, 'uniform $2 $1;');

  // Replace function definitions
  glsl = glsl.replace(/fn main\(/g, 'void main(');

  // Replace return types
  glsl = glsl.replace(/-> (\w+)/g, '');

  return glsl;
};

/**
 * WebGPU fallback hook.
 * @param config - Shader configuration.
 * @returns Hook return value.
 */
export const useWebGPUFallback = (config: ShaderConfig): UseWebGPUFallbackReturn => {
  const [status, setStatus] = useState<WebGPUSupportStatus>('none');
  const [context, setContext] = useState<GPUCanvasContext | WebGL2RenderingContext | null>(null);
  const [shadersReady, setShadersReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deviceRef = useRef<GPUDevice | null>(null);
  const pipelineRef = useRef<GPURenderPipeline | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const uniformLocationsRef = useRef<Record<string, WebGLUniformLocation | null>>({});

  const isWebGPUSupported = detectWebGPUSupport();
  const isWebGL2Supported = detectWebGL2Support();

  /**
   * Initialize WebGPU context.
   */
  const initializeWebGPU = useCallback(async (canvas: HTMLCanvasElement): Promise<boolean> => {
    try {
      if (!isWebGPUSupported) return false;

      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        setError('No WebGPU adapter found');
        return false;
      }

      const device = await adapter.requestDevice();
      deviceRef.current = device;

      const context = canvas.getContext('webgpu');
      if (!context) {
        setError('Failed to get WebGPU context');
        return false;
      }

      const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
      context.configure({
        device,
        format: presentationFormat,
        alphaMode: 'premultiplied',
      });

      const pipeline = await createWebGPUPipeline(device, config);
      if (!pipeline) {
        setError('Failed to create WebGPU pipeline');
        return false;
      }

      pipelineRef.current = pipeline;
      setContext(context);
      setShadersReady(true);
      setStatus('webgpu');

      return true;
    } catch (err) {
      setError(`WebGPU initialization failed: ${err}`);
      return false;
    }
  }, [isWebGPUSupported, config]);

  /**
   * Initialize WebGL2 context.
   */
  const initializeWebGL2 = useCallback((canvas: HTMLCanvasElement): boolean => {
    try {
      if (!isWebGL2Supported) return false;

      const gl = canvas.getContext('webgl2', {
        alpha: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
      });

      if (!gl) {
        setError('Failed to get WebGL2 context');
        return false;
      }

      const program = createWebGL2Program(gl, config);
      if (!program) {
        setError('Failed to create WebGL2 program');
        return false;
      }

      programRef.current = program;
      setContext(gl);
      setShadersReady(true);
      setStatus('webgl2');

      return true;
    } catch (err) {
      setError(`WebGL2 initialization failed: ${err}`);
      return false;
    }
  }, [isWebGL2Supported, config]);

  /**
   * Initialize rendering context.
   */
  const initializeContext = useCallback(async (canvas: HTMLCanvasElement): Promise<boolean> => {
    canvasRef.current = canvas;
    setError(null);

    // Try WebGPU first, then fallback to WebGL2
    if (isWebGPUSupported) {
      return await initializeWebGPU(canvas);
    } else if (isWebGL2Supported) {
      return initializeWebGL2(canvas);
    } else {
      setError('Neither WebGPU nor WebGL2 is supported');
      return false;
    }
  }, [isWebGPUSupported, isWebGL2Supported, initializeWebGPU, initializeWebGL2]);

  /**
   * Update shader uniforms.
   */
  const updateUniforms = useCallback((uniforms: Record<string, number | number[]>) => {
    if (!shadersReady || !context) return;

    if (status === 'webgpu' && deviceRef.current) {
      // WebGPU uniform updates would go here
      // This is a simplified implementation
      console.log('WebGPU uniform updates:', uniforms);
    } else if (status === 'webgl2' && programRef.current) {
      const gl = context as WebGL2RenderingContext;
      gl.useProgram(programRef.current);

      // Update uniform locations cache
      Object.keys(uniforms).forEach(name => {
        if (!(name in uniformLocationsRef.current)) {
          uniformLocationsRef.current[name] = gl.getUniformLocation(programRef.current!, name);
        }
      });

      // Set uniform values
      Object.entries(uniforms).forEach(([name, value]) => {
        const location = uniformLocationsRef.current[name];
        if (!location) return;

        const uniform = config.uniforms[name];
        if (!uniform) return;

        switch (uniform.type) {
          case 'float':
            gl.uniform1f(location, value as number);
            break;
          case 'vec2':
            gl.uniform2fv(location, value as number[]);
            break;
          case 'vec3':
            gl.uniform3fv(location, value as number[]);
            break;
          case 'vec4':
            gl.uniform4fv(location, value as number[]);
            break;
        }
      });
    }
  }, [shadersReady, context, status, config.uniforms]);

  /**
   * Render frame.
   */
  const render = useCallback((time: number) => {
    if (!shadersReady || !context || !canvasRef.current) return;

    // Update time uniform
    updateUniforms({ time: time * 0.001 });

    if (status === 'webgpu' && deviceRef.current && pipelineRef.current) {
      // WebGPU rendering would go here
      // This is a simplified implementation
      console.log('WebGPU render frame:', time);
    } else if (status === 'webgl2' && programRef.current) {
      const gl = context as WebGL2RenderingContext;
      
      gl.viewport(0, 0, canvasRef.current.width, canvasRef.current.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(programRef.current);

      // Draw a simple quad
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1,
      ]), gl.STATIC_DRAW);

      const positionLocation = gl.getAttribLocation(programRef.current, 'position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }, [shadersReady, context, status, updateUniforms]);

  /**
   * Cleanup resources.
   */
  const cleanup = useCallback(() => {
    if (deviceRef.current) {
      deviceRef.current.destroy();
      deviceRef.current = null;
    }

    if (programRef.current && context && status === 'webgl2') {
      const gl = context as WebGL2RenderingContext;
      gl.deleteProgram(programRef.current);
      programRef.current = null;
    }

    setContext(null);
    setShadersReady(false);
    setError(null);
  }, [context, status]);

  // Auto-detect support on mount
  useEffect(() => {
    if (isWebGPUSupported) {
      setStatus('webgpu');
    } else if (isWebGL2Supported) {
      setStatus('webgl2');
    } else {
      setStatus('none');
      setError('Neither WebGPU nor WebGL2 is supported');
    }
  }, [isWebGPUSupported, isWebGL2Supported]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    status,
    isWebGPUSupported,
    isWebGL2Supported,
    context,
    shadersReady,
    error,
    initializeContext,
    updateUniforms,
    render,
    cleanup,
  };
};
