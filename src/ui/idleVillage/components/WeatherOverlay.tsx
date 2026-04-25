/**
 * NP-032 – Idle Village Weather Impact Simulation
 * 
 * Weather overlay visualization component for displaying weather
 * conditions, impacts, and effects on the village map.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  WeatherCondition,
  WeatherOverlayConfig,
  WeatherImpactResult,
  WeatherType,
  WeatherSeverity,
} from '../types/weatherSimulation';

export interface WeatherOverlayProps {
  weatherCondition: WeatherCondition;
  impacts: WeatherImpactResult[];
  overlayConfig: WeatherOverlayConfig;
  visible: boolean;
  opacity: number;
  interactive: boolean;
  onWeatherClick?: (condition: WeatherCondition) => void;
  onImpactClick?: (impact: WeatherImpactResult) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const WeatherOverlay: React.FC<WeatherOverlayProps> = ({
  weatherCondition,
  impacts,
  overlayConfig,
  visible,
  opacity,
  interactive,
  onWeatherClick,
  onImpactClick,
  className = '',
  style = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<WeatherParticle[]>([]);

  // Weather particle interface
  interface WeatherParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    color: string;
    type: 'rain' | 'snow' | 'fog' | 'wind' | 'lightning';
    lifetime: number;
  }

  // Get weather color based on type and severity
  const getWeatherColor = useCallback((type: WeatherType, severity: WeatherSeverity): string => {
    const colors = overlayConfig.style.colors;
    const baseColor = colors[type] || '#87CEEB';
    
    // Adjust color based on severity
    if (severity === 'extreme') {
      return '#8B0000'; // Dark red for extreme
    } else if (severity === 'severe') {
      return '#FF4500'; // Orange red for severe
    } else if (severity === 'moderate') {
      return '#FFD700'; // Gold for moderate
    }
    
    return baseColor;
  }, [overlayConfig.style.colors]);

  // Create weather particles
  const createWeatherParticles = useCallback((condition: WeatherCondition): WeatherParticle[] => {
    const particles: WeatherParticle[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return particles;

    const { width, height } = canvas;
    const particleCount = Math.floor(width * height / 10000); // Scale with canvas size

    for (let i = 0; i < particleCount; i++) {
      let particle: WeatherParticle;

      switch (condition.type) {
        case 'rainy':
          particle = {
            x: Math.random() * width,
            y: Math.random() * height - height,
            vx: Math.random() * 2 - 1,
            vy: 5 + Math.random() * 3,
            size: 1 + Math.random() * 2,
            opacity: 0.3 + Math.random() * 0.4,
            color: '#4682B4',
            type: 'rain',
            lifetime: 1000 + Math.random() * 2000,
          };
          break;

        case 'snowy':
          particle = {
            x: Math.random() * width,
            y: Math.random() * height - height,
            vx: Math.random() * 2 - 1,
            vy: 1 + Math.random() * 2,
            size: 2 + Math.random() * 3,
            opacity: 0.6 + Math.random() * 0.4,
            color: '#F0F8FF',
            type: 'snow',
            lifetime: 2000 + Math.random() * 3000,
          };
          break;

        case 'foggy':
          particle = {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: Math.random() * 0.5 - 0.25,
            vy: Math.random() * 0.5 - 0.25,
            size: 20 + Math.random() * 30,
            opacity: 0.1 + Math.random() * 0.2,
            color: '#D3D3D3',
            type: 'fog',
            lifetime: 5000 + Math.random() * 5000,
          };
          break;

        case 'windy':
          particle = {
            x: Math.random() * width - width,
            y: Math.random() * height,
            vx: 10 + Math.random() * 5,
            vy: Math.random() * 2 - 1,
            size: 1 + Math.random() * 2,
            opacity: 0.2 + Math.random() * 0.3,
            color: '#B0C4DE',
            type: 'wind',
            lifetime: 1000 + Math.random() * 1000,
          };
          break;

        case 'stormy':
          if (Math.random() < 0.1) { // 10% chance of lightning
            particle = {
              x: Math.random() * width,
              y: 0,
              vx: 0,
              vy: height,
              size: 2 + Math.random() * 3,
              opacity: 0.8 + Math.random() * 0.2,
              color: '#FFD700',
              type: 'lightning',
              lifetime: 100,
            };
          } else {
            // Rain particles for storm
            particle = {
              x: Math.random() * width,
              y: Math.random() * height - height,
              vx: Math.random() * 4 - 2,
              vy: 8 + Math.random() * 4,
              size: 2 + Math.random() * 2,
              opacity: 0.4 + Math.random() * 0.4,
              color: '#2F4F4F',
              type: 'rain',
              lifetime: 800 + Math.random() * 1200,
            };
          }
          break;

        default:
          // No particles for clear, cloudy, extreme
          continue;
      }

      particles.push(particle);
    }

    return particles;
  }, []);

  // Update particles
  const updateParticles = useCallback((particles: WeatherParticle[], deltaTime: number): WeatherParticle[] => {
    const canvas = canvasRef.current;
    if (!canvas) return particles;

    const { width, height } = canvas;

    return particles
      .map(particle => {
        const updated = { ...particle };
        
        // Update position
        updated.x += updated.vx * deltaTime / 16;
        updated.y += updated.vy * deltaTime / 16;
        
        // Update lifetime
        updated.lifetime -= deltaTime;
        
        // Update opacity for fading
        if (updated.lifetime < 500) {
          updated.opacity *= updated.lifetime / 500;
        }
        
        return updated;
      })
      .filter(particle => {
        // Remove particles that are out of bounds or expired
        return particle.lifetime > 0 && 
               particle.x >= -50 && particle.x <= width + 50 &&
               particle.y >= -50 && particle.y <= height + 50;
      });
  }, []);

  // Draw weather overlay
  const drawWeatherOverlay = useCallback((ctx: CanvasRenderingContext2D, condition: WeatherCondition) => {
    const canvas = ctx.canvas;
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background gradient based on weather
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    const baseColor = getWeatherColor(condition.type, condition.severity);
    
    // Create gradient stops
    const alpha = opacity * 0.3;
    gradient.addColorStop(0, `${baseColor}00`);
    gradient.addColorStop(0.5, `${baseColor}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, `${baseColor}00`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw particles
    particlesRef.current.forEach(particle => {
      ctx.save();
      
      ctx.globalAlpha = particle.opacity * opacity;
      ctx.fillStyle = particle.color;
      
      switch (particle.type) {
        case 'rain':
          // Draw rain as lines
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = particle.size;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x - particle.vx * 2, particle.y - particle.vy * 2);
          ctx.stroke();
          break;
          
        case 'snow':
          // Draw snow as circles
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'fog':
          // Draw fog as blurred circles
          ctx.filter = 'blur(5px)';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.filter = 'none';
          break;
          
        case 'wind':
          // Draw wind as lines
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = particle.size;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x + particle.vx * 5, particle.y);
          ctx.stroke();
          break;
          
        case 'lightning':
          // Draw lightning as zigzag
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = particle.size;
          ctx.beginPath();
          ctx.moveTo(particle.x, 0);
          
          let currentX = particle.x;
          let currentY = 0;
          
          while (currentY < height) {
            currentX += (Math.random() - 0.5) * 20;
            currentY += 20;
            ctx.lineTo(currentX, currentY);
          }
          
          ctx.stroke();
          
          // Add glow effect
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;
          break;
      }
      
      ctx.restore();
    });

    // Draw weather info overlay
    if (interactive) {
      ctx.save();
      ctx.globalAlpha = opacity * 0.8;
      
      // Draw weather info box
      const padding = 10;
      const boxHeight = 80;
      const boxY = 10;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, boxY, 200, boxHeight);
      
      // Draw weather text
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.fillText(`${condition.type} - ${condition.severity}`, 20, boxY + 25);
      ctx.fillText(`Temp: ${condition.temperature.current}°C`, 20, boxY + 45);
      ctx.fillText(`Wind: ${condition.wind.speed} km/h`, 20, boxY + 65);
      
      ctx.restore();
    }

    // Draw impact indicators
    impacts.forEach((impact, index) => {
      const x = width - 210;
      const y = 10 + index * 90;
      
      ctx.save();
      ctx.globalAlpha = opacity * 0.7;
      
      // Draw impact box
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(x, y, 200, 80);
      
      // Draw impact text
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.fillText(`${impact.targetType}`, x + 10, y + 20);
      ctx.fillText(`Success: ${(impact.impacts.successRate.modified * 100).toFixed(1)}%`, x + 10, y + 35);
      ctx.fillText(`Fatigue: ${(impact.impacts.fatigue.modified * 100).toFixed(1)}%`, x + 10, y + 50);
      ctx.fillText(`Confidence: ${(impact.confidence * 100).toFixed(1)}%`, x + 10, y + 65);
      
      ctx.restore();
    });
  }, [opacity, interactive, impacts, getWeatherColor]);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update particles
    particlesRef.current = updateParticles(particlesRef.current, 16);

    // Add new particles if needed
    const targetCount = Math.floor(canvas.width * canvas.height / 10000);
    if (particlesRef.current.length < targetCount) {
      const newParticles = createWeatherParticles(weatherCondition);
      particlesRef.current = [...particlesRef.current, ...newParticles].slice(0, targetCount);
    }

    // Draw overlay
    drawWeatherOverlay(ctx, weatherCondition);

    animationRef.current = requestAnimationFrame(animate);
  }, [weatherCondition, updateParticles, createWeatherParticles, drawWeatherOverlay]);

  // Handle canvas click
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is on weather info area
    if (x >= 10 && x <= 210 && y >= 10 && y <= 90) {
      onWeatherClick?.(weatherCondition);
      return;
    }

    // Check if click is on impact areas
    impacts.forEach((impact, index) => {
      const impactX = canvas.width - 210;
      const impactY = 10 + index * 90;
      
      if (x >= impactX && x <= impactX + 200 && y >= impactY && y <= impactY + 80) {
        onImpactClick?.(impact);
      }
    });
  }, [interactive, impacts, weatherCondition, onWeatherClick, onImpactClick]);

  // Handle canvas resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }, []);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    handleResize();
    
    // Initialize particles
    particlesRef.current = createWeatherParticles(weatherCondition);

    // Start animation
    if (visible) {
      animate();
    }

    // Handle resize
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [visible, weatherCondition, handleResize, animate, createWeatherParticles]);

  // Update particles when weather changes
  useEffect(() => {
    particlesRef.current = createWeatherParticles(weatherCondition);
  }, [weatherCondition, createWeatherParticles]);

  // Memoize overlay style
  const overlayStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: interactive ? 'auto' : 'none',
    zIndex: overlayConfig.zIndex,
    opacity: visible ? opacity : 0,
    transition: 'opacity 0.3s ease-in-out',
    ...style,
  }), [interactive, overlayConfig.zIndex, visible, opacity, style]);

  if (!visible) {
    return null;
  }

  return (
    <div className={`weather-overlay ${className}`} style={overlayStyle}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          cursor: interactive ? 'pointer' : 'default',
        }}
      />
    </div>
  );
};

export default WeatherOverlay;
