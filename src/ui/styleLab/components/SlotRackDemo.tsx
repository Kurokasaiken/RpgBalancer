/**
 * Style Lab Slot Rack Demo Component
 * 
 * Adapts Idle Village slot system for Style Laboratory demonstration
 * with configurable bloom effects, snap animations, and drop feedback.
 */

import React, { useState, useRef, useEffect } from 'react';
import { DndContext, type DragEndEvent, type DragStartEvent, useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';
import type { SlotRackConfig } from '@/ui/styleLab/config/demoConfig';

/**
 * Mock slot data for demo
 */
interface MockSlot {
  id: string;
  iconName: string;
  label: string;
  assignedWorkerName?: string;
  isValidDrop: boolean;
}

const mockSlots: MockSlot[] = [
  { id: 'slot-1', iconName: 'forest', label: 'Forest Work', isValidDrop: true },
  { id: 'slot-2', iconName: 'mine', label: 'Mining', isValidDrop: true },
  { id: 'slot-3', iconName: 'farm', label: 'Farming', isValidDrop: false },
  { id: 'slot-4', iconName: 'lab', label: 'Research', isValidDrop: true },
];

/**
 * Droppable slot component with bloom effects
 */
interface DroppableSlotProps {
  slot: MockSlot;
  config: SlotRackConfig;
  isOver?: boolean;
}

const DroppableSlot: React.FC<DroppableSlotProps> = ({ 
  slot, 
  config, 
  isOver = false 
}) => {
  const tokens = useStyleLabTokens();
  const [isHovering, setIsHovering] = useState(false);
  
  const { setNodeRef, isOver: dndIsOver } = useDroppable({ 
    id: slot.id,
    disabled: !slot.isValidDrop 
  });

  const isActive = isOver || dndIsOver;
  const showBloom = (isActive && slot.isValidDrop) || isHovering;

  const slotStyle: React.CSSProperties = {
    background: tokens.preset.surfaces.card.background as string,
    border: `2px solid ${isActive && slot.isValidDrop ? config.slotGlowColor : '#ddd'}`,
    borderRadius: '12px',
    padding: '20px',
    margin: '12px',
    minHeight: '120px',
    cursor: slot.isValidDrop ? 'pointer' : 'not-allowed',
    position: 'relative',
    overflow: 'hidden',
    transform: showBloom ? `scale(${config.highlightScale})` : 'scale(1)',
    transition: 'all 0.3s ease-out',
    opacity: slot.isValidDrop ? 1 : 0.5,
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '32px',
    marginBottom: '8px',
    opacity: slot.isValidDrop ? 1 : 0.5,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  };

  const assignedStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={slotStyle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      whileHover={{ scale: slot.isValidDrop ? 1.05 : 1 }}
      className="slot-demo"
      data-testid={`slot-${slot.id}`}
    >
      {/* Bloom effect overlay */}
      <AnimatePresence>
        {showBloom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 * config.bloomIntensity }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at center, ${config.slotGlowColor} 0%, transparent 60%)`,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Slot content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={iconStyle}>
          {slot.iconName === 'forest' && '🌲'}
          {slot.iconName === 'mine' && '⛏️'}
          {slot.iconName === 'farm' && '🌾'}
          {slot.iconName === 'lab' && '🔬'}
        </div>
        
        <div style={labelStyle}>
          {slot.label}
        </div>

        {slot.assignedWorkerName ? (
          <div style={assignedStyle}>
            Assigned: {slot.assignedWorkerName}
          </div>
        ) : (
          <div style={{ 
            fontSize: '11px', 
            color: slot.isValidDrop ? '#22c55e' : '#ef4444',
            marginTop: '4px' 
          }}>
            {slot.isValidDrop ? '✓ Valid drop' : '✗ Locked'}
          </div>
        )}

        {!slot.isValidDrop && (
          <div style={{ 
            fontSize: '10px', 
            color: '#ef4444',
            marginTop: '4px' 
          }}>
            Night phase locked
          </div>
        )}
      </div>

      {/* Snap animation indicator */}
      <AnimatePresence>
        {isActive && slot.isValidDrop && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.8 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: config.snapAnimationMs / 1000 }}
            style={{
              position: 'absolute',
              inset: 0,
              border: `3px solid ${config.slotGlowColor}`,
              borderRadius: '12px',
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Slot rack demo component props
 */
export interface SlotRackDemoProps {
  config: SlotRackConfig;
  onConfigChange?: (config: Partial<SlotRackConfig>) => void;
}

/**
 * Main slot rack demo component
 */
export const SlotRackDemo: React.FC<SlotRackDemoProps> = ({ 
  config, 
  onConfigChange 
}) => {
  const tokens = useStyleLabTokens();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isAutoLooping, setIsAutoLooping] = useState(true);
  const [slots, setSlots] = useState<MockSlot[]>(mockSlots);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-loop functionality - simulate drag and drop
  useEffect(() => {
    if (isAutoLooping) {
      intervalRef.current = setInterval(() => {
        // Simulate successful drop
        const validSlots = slots.filter(s => s.isValidDrop && !s.assignedWorkerName);
        if (validSlots.length > 0) {
          const randomSlot = validSlots[Math.floor(Math.random() * validSlots.length)];
          const workerNames = ['Marcus', 'Lena', 'Kael', 'Sora'];
          const randomWorker = workerNames[Math.floor(Math.random() * workerNames.length)];
          
          setSlots(prev => prev.map(slot => 
            slot.id === randomSlot.id 
              ? { ...slot, assignedWorkerName: randomWorker }
              : slot
          ));

          setDraggedItem(randomSlot.id);
          
          // Clear assignment after animation
          setTimeout(() => {
            setSlots(prev => prev.map(slot => 
              slot.id === randomSlot.id 
                ? { ...slot, assignedWorkerName: undefined }
                : slot
            ));
            setDraggedItem(null);
          }, config.snapAnimationMs + 1000);
        }
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoLooping, slots, config.snapAnimationMs]);

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedItem(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && over.id !== active.id) {
      // Simulate successful assignment
      const workerNames = ['Marcus', 'Lena', 'Kael', 'Sora'];
      const randomWorker = workerNames[Math.floor(Math.random() * workerNames.length)];
      
      setSlots(prev => prev.map(slot => 
        slot.id === over.id 
          ? { ...slot, assignedWorkerName: randomWorker }
          : slot
      ));

      // Clear assignment after delay
      setTimeout(() => {
        setSlots(prev => prev.map(slot => 
          slot.id === over.id 
            ? { ...slot, assignedWorkerName: undefined }
            : slot
        ));
      }, 2000);
    }
    
    setDraggedItem(null);
  };

  const containerStyle: React.CSSProperties = {
    background: tokens.preset.surfaces.panel.background as string,
    border: `1px solid #ddd`,
    borderRadius: '12px',
    padding: '24px',
    minHeight: '300px',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    fontSize: '12px',
  };

  const slotsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={containerStyle} data-testid="slot-rack-demo">
        <div style={headerStyle}>
          <span>Slot Rack Demo</span>
          <div style={controlsStyle}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="checkbox"
                checked={isAutoLooping}
                onChange={(e) => setIsAutoLooping(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Auto Loop
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Bloom:
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={config.bloomIntensity}
                onChange={(e) => onConfigChange?.({ bloomIntensity: parseFloat(e.target.value) })}
                style={{ width: '80px' }}
              />
              {config.bloomIntensity.toFixed(1)}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Snap:
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={config.snapForce}
                onChange={(e) => onConfigChange?.({ snapForce: parseFloat(e.target.value) })}
                style={{ width: '80px' }}
              />
              {config.snapForce.toFixed(1)}
            </label>
          </div>
        </div>

        <div style={slotsGridStyle}>
          {slots.map((slot) => (
            <DroppableSlot
              key={slot.id}
              slot={slot}
              config={config}
              isOver={draggedItem === slot.id}
            />
          ))}
        </div>

        {draggedItem && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: tokens.preset.surfaces.card.background as string,
            border: `1px solid #ddd`,
            borderRadius: '8px',
            padding: '16px',
            fontSize: '12px',
            color: '#333',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            Dragging over slot...
          </div>
        )}
      </div>
    </DndContext>
  );
};

export default SlotRackDemo;
