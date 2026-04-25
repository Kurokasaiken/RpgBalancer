/**
 * Sunken Slot Component
 *
 * Interactive drop zone component extracted from Physics Lab.
 * Provides visual feedback for drag-and-drop operations.
 */

import React, { useRef, useEffect, useState } from 'react';
import { type PhysicsPreset } from '@/ui/styleLab/config/physicsPresets';

export interface SunkenSlotProps {
  /** Current physics preset configuration */
  config: PhysicsPreset;
  /** Optional className for styling */
  className?: string;
  /** Slot label text */
  label?: string;
  /** Whether slot is currently active/valid drop target */
  isActive?: boolean;
  /** Callback when item is dropped on slot */
  onDrop?: () => void;
}

/**
 * Interactive sunken slot component with physics-based visual feedback.
 * Provides drop zone with glow effects based on physics preset.
 */
export const SunkenSlot: React.FC<SunkenSlotProps> = ({
  config,
  className = '',
  label = 'Weapon Slot',
  isActive = false,
  onDrop,
}) => {
  const slotRef = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsOver(true);
    };

    const handleDragLeave = () => {
      setIsOver(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      onDrop?.();
    };

    slot.addEventListener('dragover', handleDragOver);
    slot.addEventListener('dragleave', handleDragLeave);
    slot.addEventListener('drop', handleDrop);

    return () => {
      slot.removeEventListener('dragover', handleDragOver);
      slot.removeEventListener('dragleave', handleDragLeave);
      slot.removeEventListener('drop', handleDrop);
    };
  }, [onDrop]);

  const glowIntensity = config.slotGlow.intensity;
  const glowChroma = config.slotGlow.chroma;
  
  return (
    <div
      ref={slotRef}
      className={`sunken-slot ${isOver ? 'over' : ''} ${isActive ? 'active' : ''} ${className}`}
      style={{
        width: '140px',
        height: '160px',
        borderRadius: '3px',
        background: 'linear-gradient(150deg, #020304 0%, #030508 100%)',
        border: `1px solid rgba(${50 + glowIntensity * 50}, ${40 + glowIntensity * 40}, 0, ${0.18 + glowIntensity * 0.3})`,
        boxShadow: isOver
          ? `
            inset 5px 5px 20px rgba(0,0,0,0.95),
            inset 0 0 28px rgba(0,0,0,0.8),
            0 0 28px rgba(${200 + glowChroma * 55}, ${160 + glowChroma * 40}, ${48 + glowChroma * 2}, ${glowIntensity}),
            0 0 0 1px rgba(${180 + glowChroma * 40}, ${140 + glowChroma * 20}, 20, ${0.15 + glowIntensity * 0.1})
          `
          : `
            inset 5px 5px 20px rgba(0,0,0,1),
            inset 3px 3px 7px rgba(0,0,0,0.98),
            inset -1px -1px 3px rgba(255,255,255,0.016),
            inset 0 0 30px rgba(0,0,0,0.88),
            0 1px 0 rgba(255,255,255,0.018)
          `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        position: 'relative',
        animation: isOver ? `slot-pulse ${0.6 / config.slotGlow.intensity}s ease-in-out infinite` : 'none',
      }}
    >
      <span
        className="slot-label"
        style={{
          fontFamily: '"Cinzel", serif',
          fontSize: '6.5px',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: '#3c2c20',
        }}
      >
        {label}
      </span>

      <style>
        {`
          @keyframes slot-pulse {
            0%, 100% {
              box-shadow: 
                inset 5px 5px 20px rgba(0,0,0,0.95),
                inset 0 0 28px rgba(0,0,0,0.8),
                0 0 22px rgba(${200 + glowChroma * 55}, ${160 + glowChroma * 40}, ${48 + glowChroma * 2}, ${glowIntensity});
            }
            50% {
              box-shadow: 
                inset 5px 5px 20px rgba(0,0,0,0.95),
                inset 0 0 28px rgba(0,0,0,0.8),
                0 0 42px rgba(${200 + glowChroma * 55}, ${160 + glowChroma * 40}, ${48 + glowChroma * 2}, ${glowIntensity});
            }
          }
        `}
      </style>
    </div>
  );
};
