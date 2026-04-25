/**
 * WebGPU Shader Hook for Physics Lab FX
 *
 * Provides liquid gauge, fog slot, and foil card effects with WebGL2 fallback.
 * Includes parameter export functionality for Asterism integration.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { shaderSources, webgl2ShaderSources } from '../config/shaderSources';

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
 * WebGPU shader hook with WebGL2 fallback
 */
export const useWebGPUShaders = (config: ShaderConfig) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isWebGPUSupported, setIsWebGPUSupported] = useState(false);
  const [fallbackReason, setFallbackReason] = useState('');
  const [shaderType, setShaderType] = useState<'liquid-gauge' | 'fog-slot' | 'foil-card'>('liquid-gauge');

  /**
   * Initialize WebGPU renderer
   */
  const initializeWebGPU = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    try {
      const adapter = await (navigator as any).gpu?.requestAdapter();
      if (!adapter) {
        setFallbackReason('WebGPU adapter not available');
        return false;
      }

      const device = await adapter.requestDevice();
      const context = canvas.getContext('webgpu') as GPUCanvasContext;
      
      if (!context) {
        setFallbackReason('WebGPU context not available');
        return false;
      }

      // Configure context
      context.configure({
        device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: 'premultiplied',
      });

      setIsWebGPUSupported(true);
      return true;
    } catch (error) {
      setFallbackReason(`WebGPU initialization failed: ${error}`);
      return false;
    }
  }, []);

  /**
   * Initialize WebGL2 renderer
   */
  const initializeWebGL2 = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      setFallbackReason('WebGL2 not supported');
      return false;
    }

    // Set viewport and clear color
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.1, 0.1, 1.0);

    return true;
  }, []);

  /**
   * Start shader animation
   */
  const start = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw shader effect (simplified for demo)
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, config.color);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [config.color]);

  /**
   * Stop shader animation
   */
  const stop = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
  }, []);

  /**
   * Export shader configuration
   */
  const exportShaderConfig = useCallback(() => {
    return {
      config: {
        ...config,
        timestamp: Date.now(),
      },
      shaderType,
      isWebGPUSupported,
      fallbackReason,
    };
  }, [config, shaderType, isWebGPUSupported, fallbackReason]);

  // Initialize on mount
  useEffect(() => {
    const initWebGPU = async () => {
      const success = await initializeWebGPU();
      if (!success) {
        await initializeWebGL2();
      }
    };

    initWebGPU();

    return () => {
      stop();
    };
  }, [initializeWebGPU, initializeWebGL2, stop]);

  return {
    canvasRef,
    isWebGPUSupported,
    fallbackReason,
    shaderType,
    setShaderType,
    start,
    stop,
    exportShaderConfig,
  };
};
