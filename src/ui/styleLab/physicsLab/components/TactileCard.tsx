/**
 * Tactile Card Component
 *
 * Interactive draggable card component extracted from Physics Lab.
 * Provides tactile feedback with lift, tilt, and visual effects.
 */

import React, { useRef, useEffect, useState } from 'react';
import { type PhysicsPreset } from '@/ui/styleLab/config/physicsPresets';

export interface TactileCardProps {
  /** Current physics preset configuration */
  config: PhysicsPreset;
  /** Optional className for styling */
  className?: string;
  /** Card title/name */
  title?: string;
  /** Card subtitle/type */
  subtitle?: string;
  /** Card icon/emoji */
  icon?: string;
  /** Stats to display on card */
  stats?: Array<{ label: string; value: string; negative?: boolean }>;
  /** Callback when card is dragged */
  onDragStart?: () => void;
  /** Callback when card is dropped */
  onDragEnd?: () => void;
}

/**
 * Interactive tactile card component with physics-based interactions.
 * Supports lift, tilt, and visual feedback based on physics preset.
 */
export const TactileCard: React.FC<TactileCardProps> = ({
  config,
  className = '',
  title = 'Blade of Ruin',
  subtitle = 'Legendary Sword',
  icon = '⚔️',
  stats = [
    { label: 'ATK', value: '+14–18' },
    { label: 'Crit', value: '+8%' },
    { label: 'SPD', value: '−3', negative: true },
  ],
  onDragStart,
  onDragEnd,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isLifted, setIsLifted] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseDown = (e: MouseEvent) => {
      setIsLifted(true);
      onDragStart?.();

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = (moveEvent.clientX - centerX) / rect.width;
        const deltaY = (moveEvent.clientY - centerY) / rect.height;
        
        const maxTilt = config.spring.tiltIntensity;
        setTilt({
          x: Math.max(-maxTilt, Math.min(maxTilt, deltaX * maxTilt)),
          y: Math.max(-maxTilt, Math.min(maxTilt, deltaY * maxTilt)),
        });
      };

      const handleMouseUp = () => {
        setIsLifted(false);
        setTilt({ x: 0, y: 0 });
        onDragEnd?.();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    card.addEventListener('mousedown', handleMouseDown);
    return () => card.removeEventListener('mousedown', handleMouseDown);
  }, [config, onDragStart, onDragEnd]);

  return (
    <div
      ref={cardRef}
      className={`tactile-card ${isLifted ? 'lifted' : ''} ${className}`}
      style={{
        width: '160px',
        cursor: isLifted ? 'grabbing' : 'grab',
        userSelect: 'none',
        position: 'relative',
        borderRadius: '4px',
        padding: '13px',
        touchAction: 'none',
        background: `
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' seed='11'/%3E%3CfeColorMatrix type='saturate' values='0.15'/%3E%3C/filter%3E%3Crect width='128' height='128' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E"),
          radial-gradient(ellipse 65% 55% at 50% 42%, rgba(28,24,16,0) 0%, rgba(8,6,2,0.62) 75%, rgba(0,0,0,0.95) 100%),
          linear-gradient(158deg, #1a2620 0%, #141d18 45%, #0f1512 80%, #0b0f0e 100%
        `,
        border: '1px solid #242c38',
        boxShadow: isLifted
          ? `0 20px 60px rgba(0,0,0,0.95), 0 8px 24px rgba(0,0,0,1), 0 0 0 1px rgba(200,160,48,0.2), inset 0 2px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.9)`
          : `0 8px 28px rgba(0,0,0,0.95), 0 3px 8px rgba(0,0,0,1), 0 0 0 1px rgba(80,64,0,0.08), inset 0 2px 0 rgba(255,255,255,0.055), inset 0 -2px 0 rgba(0,0,0,0.88)`,
        transform: `
          translateY(${isLifted ? config.liftScale * 10 : 0}px) 
          rotateX(${tilt.y}deg) 
          rotateY(${tilt.x}deg)
        `,
        transition: isLifted 
          ? `transform ${config.spring.stiffness}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
          : 'transform 0.2s ease',
        willChange: 'transform, box-shadow',
      }}
    >
      {/* Rarity Bar */}
      <div
        className="card-rarity-bar"
        style={{
          position: 'absolute',
          top: '0',
          left: '13px',
          right: '13px',
          height: '2px',
          borderRadius: '0 0 2px 2px',
          background: 'linear-gradient(90deg, transparent, #a08020, #f0d47a, #faeaaa, #f0d47a, #a08020, transparent)',
          boxShadow: '0 0 8px #c8a030',
        }}
      />

      {/* Holographic Foil */}
      <div
        className="card-holographic"
        style={{
          content: '""',
          position: 'absolute',
          inset: '0',
          borderRadius: '4px',
          pointerEvents: 'none',
          zIndex: '5',
          mixBlendMode: 'screen',
          background: `linear-gradient(
            calc(135deg + ${tilt.x * 28}deg),
            transparent 18%, rgba(255,220,80,0.07) 34%,
            rgba(80,200,255,0.09) 50%, rgba(200,80,255,0.07) 66%,
            transparent 82%
          )`,
          opacity: isLifted ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Card Icon */}
      <div
        className="card-icon"
        style={{
          fontSize: '24px',
          textAlign: 'center',
          marginBottom: '5px',
          filter: 'drop-shadow(0 3px 8px rgba(0,0,0,1))',
        }}
      >
        {icon}
      </div>

      {/* Card Name */}
      <div
        className="card-name"
        style={{
          fontFamily: '"Cinzel", serif',
          fontSize: '9.5px',
          fontWeight: '700',
          textAlign: 'center',
          color: '#faeaaa',
          letterSpacing: '0.05em',
          textShadow: '0 0 10px rgba(200,160,48,0.38)',
        }}
      >
        {title}
      </div>

      {/* Card Type */}
      <div
        className="card-type"
        style={{
          fontSize: '9.5px',
          fontStyle: 'italic',
          textAlign: 'center',
          color: '#806858',
          marginTop: '2px',
        }}
      >
        {subtitle}
      </div>

      {/* Separator */}
      <div
        className="card-separator"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(100,80,0,0.38), transparent)',
          margin: '8px 0',
        }}
      />

      {/* Stats */}
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`card-stat ${stat.negative ? 'negative' : ''}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10.5px',
            color: stat.negative ? '#e04040' : '#c8b88a',
            margin: '2px 0',
          }}
        >
          <span>{stat.label}</span>
          <b style={{ color: stat.negative ? '#e04040' : '#faeaaa', fontStyle: 'normal', fontWeight: '600' }}>
            {stat.value}
          </b>
        </div>
      ))}
    </div>
  );
};
