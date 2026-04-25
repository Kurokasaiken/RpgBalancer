/**
 * Particle Engine Demo Component
 *
 * Demonstrates particle effects for Physics Lab FX integration.
 * Supports resource fly-to, completion burst, and stone shatter effects.
 * Configurable density, lifetime, color, and draw modes.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { type PhysicsPreset } from '@/ui/styleLab/config/physicsPresets';

export interface ParticleEngineDemoProps {
  /** Current physics preset configuration */
  config: PhysicsPreset;
  /** Performance mode flag for stress testing */
  performanceMode?: boolean;
  /** Optional className for styling */
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifetime: number;
  maxLifetime: number;
  size: number;
  color: string;
  type: 'fly-to' | 'burst' | 'shatter';
  targetX?: number;
  targetY?: number;
}

/**
 * Particle engine demo with configurable effects.
 * Provides visual feedback for drag operations and completions.
 */
export const ParticleEngineDemo: React.FC<ParticleEngineDemoProps> = ({
  config,
  performanceMode = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [effectType, setEffectType] = useState<'fly-to' | 'burst' | 'shatter'>('fly-to');
  const [particleCount, setParticleCount] = useState(0);
  const _particleDensity = config.fxProfile.particleDensity;
  const _particleColor = '#faeaaa';
  const _drawMode: 'circles' | 'squares' | 'triangles' = 'circles';

  const maxParticles = performanceMode ? 50 : 200;
  const densityMultiplier = performanceMode ? 0.5 : 1;

  /**
   * Creates particles for fly-to effect (resource collection).
   */
  const createFlyToParticles = useCallback((startX: number, startY: number, targetX: number, targetY: number) => {
    const particleCount = Math.floor(20 * _particleDensity * densityMultiplier);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      
      particles.push({
        id: Date.now() + i,
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        lifetime: 0,
        maxLifetime: 60 + Math.random() * 30,
        size: 2 + Math.random() * 3,
        color: _particleColor,
        type: 'fly-to',
        targetX,
        targetY,
      });
    }

    return particles;
  }, [_particleDensity, _particleColor, densityMultiplier]);

  /**
   * Creates particles for burst effect (completion celebration).
   */
  const createBurstParticles = useCallback((x: number, y: number) => {
    const particleCount = Math.floor(30 * _particleDensity * densityMultiplier);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 3 + Math.random() * 5;
      
      particles.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        lifetime: 0,
        maxLifetime: 40 + Math.random() * 20,
        size: 3 + Math.random() * 4,
        color: _particleColor,
        type: 'burst',
      });
    }

    return particles;
  }, [_particleDensity, _particleColor, densityMultiplier]);

  /**
   * Creates particles for shatter effect (destruction).
   */
  const createShatterParticles = useCallback((x: number, y: number) => {
    const particleCount = Math.floor(25 * _particleDensity * densityMultiplier);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      
      particles.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 2,
        lifetime: 0,
        maxLifetime: 50 + Math.random() * 30,
        size: 2 + Math.random() * 5,
        color: _particleColor,
        type: 'shatter',
      });
    }

    return particles;
  }, [_particleDensity, _particleColor, densityMultiplier]);

  /**
   * Updates particle positions and removes dead particles.
   */
  const updateParticles = useCallback(() => {
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.lifetime++;

      // Remove dead particles
      if (particle.lifetime >= particle.maxLifetime) {
        return false;
      }

      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Apply gravity for shatter effect
      if (particle.type === 'shatter') {
        particle.vy += 0.2;
      }

      // Fly-to effect: curve toward target
      if (particle.type === 'fly-to' && particle.targetX !== undefined && particle.targetY !== undefined) {
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
          const attractionForce = 0.1;
          particle.vx += (dx / distance) * attractionForce;
          particle.vy += (dy / distance) * attractionForce;
          particle.vx *= 0.95; // Damping
          particle.vy *= 0.95;
        }
      }

      // Apply damping
      particle.vx *= 0.98;
      particle.vy *= 0.98;

      return true;
    });

    // Update particle count state
    setParticleCount(particlesRef.current.length);
  }, []);

  /**
   * Renders particles on canvas.
   */
  const renderParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw particles
    particlesRef.current.forEach(particle => {
      const opacity = 1 - (particle.lifetime / particle.maxLifetime);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = particle.color;

      const progress = particle.lifetime / particle.maxLifetime;
      const currentSize = particle.size * (1 - progress * 0.5); // Shrink over time

      if (_drawMode === 'circles') {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
      } else if (_drawMode === 'squares') {
        ctx.fillRect(
          particle.x - currentSize,
          particle.y - currentSize,
          currentSize * 2,
          currentSize * 2
        );
      } else if (_drawMode === 'triangles') {
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y - currentSize);
        ctx.lineTo(particle.x - currentSize, particle.y + currentSize);
        ctx.lineTo(particle.x + currentSize, particle.y + currentSize);
        ctx.closePath();
        ctx.fill();
      }
    });

    ctx.globalAlpha = 1;
  }, [_drawMode]);

  /**
   * Starts particle animation.
   */
  const startAnimation = useCallback(() => {
    if (isRunning) return;
    
    setIsRunning(true);
    const animationLoop = () => {
      updateParticles();
      renderParticles();
      animationRef.current = requestAnimationFrame(animationLoop);
    };
    animationLoop();
  }, [isRunning, updateParticles, renderParticles]);

  /**
   * Stops particle animation.
   */
  const stopAnimation = useCallback(() => {
    if (!isRunning) return;
    
    setIsRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [isRunning]);

  /**
   * Triggers a particle effect at the specified position.
   */
  const triggerEffect = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let newParticles: Particle[] = [];

    switch (effectType) {
      case 'fly-to':
        newParticles = createFlyToParticles(x, y, canvas.width / 2, 50);
        break;
      case 'burst':
        newParticles = createBurstParticles(x, y);
        break;
      case 'shatter':
        newParticles = createShatterParticles(x, y);
        break;
    }

    // Add particles if under limit
    const availableSlots = maxParticles - particlesRef.current.length;
    if (availableSlots > 0) {
      particlesRef.current.push(...newParticles.slice(0, availableSlots));
    }
  }, [effectType, createFlyToParticles, createBurstParticles, createShatterParticles, maxParticles]);

  // Handle canvas click
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    triggerEffect(x, y);
  }, [triggerEffect]);

  // Set up canvas and animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Start animation loop
    const startEffect = () => startAnimation();
    startEffect();

    return () => {
      stopAnimation();
    };
  }, [startAnimation, stopAnimation]);

  return (
    <div className={`particle-engine-demo ${className}`} style={{
      position: 'relative',
      width: '100%',
      height: '200px',
      backgroundColor: '#04060a',
      border: '1px solid #44c470',
      borderRadius: '4px',
      overflow: 'hidden',
    }}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'crosshair',
        }}
      />

      {/* Controls Overlay */}
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        backgroundColor: 'rgba(26, 38, 32, 0.9)',
        border: '1px solid #44c470',
        borderRadius: '2px',
        padding: '8px',
        fontSize: '10px',
        color: '#f5edd8',
      }}>
        <div style={{ marginBottom: '4px' }}>
          <strong>Particle Engine Demo</strong>
        </div>
        <div style={{ marginBottom: '4px' }}>
          Click canvas to trigger effect
        </div>
        <div style={{ marginBottom: '4px' }}>
          Particles: {particleCount} / {maxParticles}
        </div>
        <div style={{ marginBottom: '4px' }}>
          Performance Mode: {performanceMode ? 'ON' : 'OFF'}
        </div>
      </div>

      {/* Effect Type Selector */}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        display: 'flex',
        gap: '4px',
      }}>
        {(['fly-to', 'burst', 'shatter'] as const).map(type => (
          <button
            key={type}
            onClick={() => setEffectType(type)}
            style={{
              padding: '4px 8px',
              backgroundColor: effectType === type ? '#d4aa50' : 'transparent',
              color: effectType === type ? '#04060a' : '#f5edd8',
              border: `1px solid ${effectType === type ? '#d4aa50' : '#44c470'}`,
              borderRadius: '2px',
              fontSize: '9px',
              cursor: 'pointer',
            }}
          >
            {type.replace('-', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
};
