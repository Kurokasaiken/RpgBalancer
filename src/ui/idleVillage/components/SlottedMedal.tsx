/**
 * SlottedMedal Component
 * 
 * Main medal component that orchestrates the modular skin, halo, and resist ring.
 * Integrates dnd-kit drag logic with Framer Motion animations and behavior hook.
 */

import React, { memo, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import { useSlottedMedalBehavior, type MedalBehaviorConfig } from '@/ui/idleVillage/hooks/useSlottedMedalBehavior';
import SlottedMedalSkin from './SlottedMedalSkin';
import SlottedMedalHaloCanvas from './SlottedMedalHaloCanvas';
import SlottedMedalResistRing from './SlottedMedalResistRing';

export interface SlottedMedalProps {
  /** Unique medal identifier */
  id: string;
  /** Medal type for visual styling */
  type: 'bronze' | 'silver' | 'gold' | 'platinum';
  /** Current assigned resident (if any) */
  residentId?: string;
  /** Whether the medal is currently active in a slot */
  isActive?: boolean;
  /** Configuration for behavior */
  behaviorConfig?: MedalBehaviorConfig;
  /** Skin preset for visual variations */
  skinPreset?: 'minimal' | 'enhanced' | 'ceremonial';
  /** Custom className */
  className?: string;
  /** Data-testid for testing */
  'data-testid'?: string;
  /** Optional skin-driven styling configuration */
  medalStyleConfig?: {
    skinPreset?: 'minimal' | 'enhanced' | 'ceremonial';
    variants?: Record<string, any>;
    interactionPhysics?: {
      mass: number;
      damping: number;
      stiffness: number;
      shadowDepth: 'shallow' | 'medium' | 'deep';
      bloomIntensity: number;
    };
  };
}

const SlottedMedal = memo(forwardRef<any, SlottedMedalProps>(({
  id,
  type,
  residentId,
  isActive = false,
  behaviorConfig,
  skinPreset = 'minimal',
  className = '',
  medalStyleConfig,
  'data-testid': testId = 'slotted-medal',
}, ref) => {
  // dnd-kit drag logic
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `medal-${id}`,
    data: {
      type: 'medal',
      medalId: id,
      medalType: type,
      residentId,
    },
  });

  // Medal behavior state machine
  const behavior = useSlottedMedalBehavior(behaviorConfig);
  const medalRef = useRef<HTMLDivElement>(null);

  // Determine if currently being dragged
  const isDragging = transform !== null;

  // Coordinate debugging for slot interactions
  useEffect(() => {
    const debugTimer = setTimeout(() => {
      if (medalRef.current) {
        const rect = medalRef.current.getBoundingClientRect();
        console.log('=== SLOTTED MEDAL DEBUG ===');
        console.log('Medal ID:', id);
        console.log('Resident ID:', residentId || 'none');
        console.log('Behavior state:', behavior.state);
        console.log('Is dragging:', isDragging);
        console.log('Medal position:', {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
        
        // Check for teleportation (position at 0,0 or sudden large changes)
        if (rect.left === 0 && rect.top === 0) {
          console.log('TELEPORTATION DETECTED: Medal at (0,0)');
        }
        
        // Check transform from dnd-kit
        if (transform) {
          console.log('DND transform:', { x: transform.x, y: transform.y });
        }
        
        console.log('========================');
      }
    }, 50);
    
    return () => clearTimeout(debugTimer);
  }, [id, residentId, behavior.state, isDragging, transform]);

  // Expose behavior controls via ref
  useImperativeHandle(ref, () => behavior, [behavior]);

  // Use skin-driven interaction physics if provided
  const motionPhysics = medalStyleConfig?.interactionPhysics || {
    mass: 1,
    damping: 0.2,
    stiffness: 400,
  };

  return (
    <motion.div
      ref={(node) => {
        setNodeRef(node);
        medalRef.current = node;
      }}
      {...attributes}
      {...listeners}
      data-testid={testId}
      className={className}
      style={{
        position: 'relative',
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
      }}
      animate={behavior.animationControls}
      initial={{ scale: 1, opacity: 1 }}
      whileHover={{ 
        scale: behavior.state === 'active' ? 1 : 1.05,
        transition: { type: 'spring' as const, stiffness: motionPhysics.stiffness, damping: motionPhysics.damping * 100 }
      }}
      whileTap={{ 
        scale: 0.95,
        transition: { type: 'spring' as const, stiffness: motionPhysics.stiffness * 1.5, damping: motionPhysics.damping * 150 }
      }}
      drag={behavior.state !== 'active'}
      dragElastic={0.2}
      dragTransition={{ 
        power: 0.3,
        timeConstant: 300,
        bounceStiffness: motionPhysics.stiffness * 0.75,
        bounceDamping: motionPhysics.damping * 150,
      }}
      onDragStart={() => {
        if (behavior.state === 'active') {
          behavior.resistStart();
        }
      }}
      onDragEnd={() => {
        if (behavior.state === 'active') {
          // Handle detach attempt
          behavior.triggerDetach();
        }
      }}
    >
      {/* Base medal skin */}
      <SlottedMedalSkin
        id={id}
        type={type}
        isActive={isActive}
        skinPreset={skinPreset}
        transform={transform}
        isDragging={isDragging}
      />

      {/* Animated halo canvas */}
      <SlottedMedalHaloCanvas
        state={behavior.state}
        medalType={type}
        medalId={id}
        sizePreset={skinPreset === 'ceremonial' ? 'large' : 'medium'}
        animationLevel={skinPreset === 'ceremonial' ? 'intense' : 'normal'}
      />

      {/* Resistance ring (shown when locked or resisting) */}
      <SlottedMedalResistRing
        isResisting={behavior.state === 'locked'}
        medalType={type}
        resistanceProgress={behavior.state === 'locked' ? 0.7 : 0}
        magneticPullEnabled={true}
        sizePreset={skinPreset === 'ceremonial' ? 'large' : 'medium'}
        showTimer={true}
        resistanceDuration={1500}
        medalState={behavior.state}
      />
    </motion.div>
  );
}));

SlottedMedal.displayName = 'SlottedMedal';

export default SlottedMedal;

// Export the behavior controls type for external usage
export type { MedalBehaviorControls } from '@/ui/idleVillage/hooks/useSlottedMedalBehavior';
