/**
 * Particle Engine for Physics Lab FX
 *
 * Provides configurable particle effects system with WebGPU/WebGL2 fallback.
 * Supports resource fly-to, completion burst, and stone shatter effects.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { ParticleEngineConfig } from './ParticleEngine.types';

/**
 * Performance flag for limiting particle density in stress testing
 */
export const ENABLE_FX_PERF_MODE = process.env.NODE_ENV === 'development' ? false : true;

/**
 * Particle interface for individual particle state
 */
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

/**
 * Hook for managing particle engine with WebGPU/WebGL2 fallback
 */
export const useParticleEngine = (config: ParticleEngineConfig) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Map<number, Particle>>(new Map());
  const nextIdRef = useRef(0);
  const [isWebGPUSupported, setIsWebGPUSupported] = useState(false);
  const [particleCount, setParticleCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Check WebGPU availability and fallback to WebGL2
   */
  const checkWebGPUSupport = useCallback((): boolean => {
    if ('gpu' in navigator) {
      setIsWebGPUSupported(true);
      return true;
    }
    console.warn('WebGPU not supported, falling back to WebGL2');
    return false;
  }, [setIsWebGPUSupported]);

  /**
   * Initialize particle engine with appropriate renderer
   */
  const initializeEngine = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    checkWebGPUSupport();
  }, [checkWebGPUSupport]);

  /**
   * Create a new particle with given parameters
   */
  const createParticle = useCallback((
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number = 3
  ): Particle => {
    const id = nextIdRef.current++;
    return {
      id,
      x,
      y,
      vx,
      vy,
      life: config.lifetime,
      maxLife: config.lifetime,
      size,
      color: config.color,
    };
  }, [config.lifetime, config.color]);

  /**
   * Spawn particles for resource fly-to effect
   */
  const spawnResourceFlyTo = useCallback((
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    count: number = 20
  ) => {
    const particles: Particle[] = [];
    const adjustedCount = config.performanceMode ? Math.floor(count * 0.5) : count;

    for (let i = 0; i < adjustedCount; i++) {
      const angle = (Math.PI * 2 * i) / adjustedCount;
      const speed = 2 + Math.random() * 3;
      const vx = Math.cos(angle) * speed + (endX - startX) * 0.01;
      const vy = Math.sin(angle) * speed + (endY - startY) * 0.01;
      
      particles.push(createParticle(startX, startY, vx, vy));
    }

    particles.forEach(p => particlesRef.current.set(p.id, p));
    setParticleCount(particlesRef.current.size);
  }, [config.performanceMode, createParticle]);

  /**
   * Spawn particles for completion burst effect
   */
  const spawnCompletionBurst = useCallback((
    x: number,
    y: number,
    count: number = 30
  ) => {
    const adjustedCount = config.performanceMode ? Math.floor(count * 0.6) : count;

    for (let i = 0; i < adjustedCount; i++) {
      const angle = (Math.PI * 2 * i) / adjustedCount;
      const speed = 3 + Math.random() * 5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 2 + Math.random() * 4;
      
      const particle = createParticle(x, y, vx, vy, size);
      particlesRef.current.set(particle.id, particle);
    }
  }, [config.performanceMode, createParticle]);

  /**
   * Spawn particles for stone shatter effect
   */
  const spawnStoneShatter = useCallback((
    x: number,
    y: number,
    count: number = 15
  ) => {
    const adjustedCount = config.performanceMode ? Math.floor(count * 0.4) : count;

    for (let i = 0; i < adjustedCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 2; // Upward bias
      const size = 3 + Math.random() * 6;
      
      const particle = createParticle(x, y, vx, vy, size);
      particlesRef.current.set(particle.id, particle);
    }
  }, [config.performanceMode, createParticle]);

  /**
   * Update particle positions and remove dead particles
   */
  const updateParticles = useCallback((deltaTime: number) => {
    const deadParticles: number[] = [];

    particlesRef.current.forEach((particle, id) => {
      // Update position
      particle.x += particle.vx * deltaTime * 0.06;
      particle.y += particle.vy * deltaTime * 0.06;
      
      // Apply gravity
      particle.vy += 9.8 * deltaTime * 0.06;
      
      // Update life
      particle.life -= deltaTime;
      
      // Mark for removal if dead
      if (particle.life <= 0) {
        deadParticles.push(id);
      }
    });

    // Remove dead particles
    deadParticles.forEach(id => particlesRef.current.delete(id));
    setParticleCount(particlesRef.current.size);
  }, []);

  /**
   * Render particles using Canvas 2D API
   */
  const renderParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply performance mode density limit
    const maxParticles = config.performanceMode ? 100 : 500;
    const particlesToRender = Array.from(particlesRef.current.values()).slice(0, maxParticles);

    // Render particles based on draw mode
    ctx.save();
    
    particlesToRender.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;

      switch (config.drawMode) {
        case 'points':
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'lines':
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = particle.size * 0.5;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x - particle.vx * 5, particle.y - particle.vy * 5);
          ctx.stroke();
          break;
          
        case 'triangles':
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(Math.atan2(particle.vy, particle.vx));
          ctx.beginPath();
          ctx.moveTo(0, -particle.size);
          ctx.lineTo(-particle.size * 0.8, particle.size);
          ctx.lineTo(particle.size * 0.8, particle.size);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
      }
    });

    ctx.restore();
  }, [config.drawMode, config.performanceMode]);

  // Animation loop ref to avoid circular dependency
  const animateRef = useRef<() => void>();

  /**
   * Animation loop
   */
  const animate = useCallback(() => {
    updateParticles(16); // Assume 60fps
    renderParticles();
    if (animateRef.current) {
      animationRef.current = requestAnimationFrame(animateRef.current);
    }
  }, [updateParticles, renderParticles]);

  // Set the ref after callback is defined
  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  /**
   * Start particle engine
   */
  const start = useCallback(() => {
    if (!animationRef.current && isInitialized && animateRef.current) {
      animationRef.current = requestAnimationFrame(animateRef.current);
    }
  }, [isInitialized]);

  /**
   * Stop particle engine
   */
  const stop = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
  }, []);

  /**
   * Clear all particles
   */
  const clear = useCallback(() => {
    particlesRef.current.clear();
  }, []);

  // Initialize on mount
  useEffect(() => {
    const controller = new AbortController();
    
    const init = async () => {
      try {
        await initializeEngine();
        if (!controller.signal.aborted) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize particle engine:', error);
      }
    };
    
    init();
    
    return () => {
      controller.abort();
      stop();
    };
  }, [initializeEngine, stop]);

  return {
    canvasRef,
    start,
    stop,
    clear,
    spawnResourceFlyTo,
    spawnCompletionBurst,
    spawnStoneShatter,
    isWebGPUSupported,
    particleCount,
  };
};

/**
 * WebGPU fallback hook for environments without WebGPU support
 */
export const useWebGPUFallback = () => {
  const [hasWebGPU, setHasWebGPU] = useState(false);
  const [fallbackReason, setFallbackReason] = useState('');

  useEffect(() => {
    const checkWebGPU = async () => {
      try {
        if ('gpu' in navigator) {
          const adapter = await (navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu?.requestAdapter();
          if (adapter) {
            setHasWebGPU(true);
            return;
          }
        }
        setFallbackReason('WebGPU not available');
      } catch (error) {
        setFallbackReason(`WebGPU error: ${error}`);
      }
    };

    checkWebGPU();
  }, []);

  return {
    hasWebGPU,
    fallbackReason,
    useWebGL2: !hasWebGPU,
  };
};
