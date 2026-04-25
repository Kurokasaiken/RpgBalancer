/**
 * Style Lab Roster Demo Component
 * 
 * Adapts Idle Village roster components for Style Laboratory demonstration
 * with configurable bloom effects, drag preview, and card glow.
 */

import React, { useState, useRef, useEffect } from 'react';
import { DndContext, type DragEndEvent, type DragStartEvent, useDraggable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';
import type { RosterConfig } from '@/ui/styleLab/config/demoConfig';

/**
 * Mock worker data for demo
 */
interface MockWorker {
  id: string;
  name: string;
  hp: number;
  fatigue: number;
  portraitUrl?: string;
}

const mockWorkers: MockWorker[] = [
  { id: 'worker-1', name: 'Marcus', hp: 85, fatigue: 20 },
  { id: 'worker-2', name: 'Lena', hp: 92, fatigue: 15 },
  { id: 'worker-3', name: 'Kael', hp: 67, fatigue: 45 },
  { id: 'worker-4', name: 'Sora', hp: 78, fatigue: 30 },
];

/**
 * Draggable worker card component
 */
interface DraggableWorkerCardProps {
  worker: MockWorker;
  config: RosterConfig;
  isDragging?: boolean;
}

const DraggableWorkerCard: React.FC<DraggableWorkerCardProps> = ({ 
  worker, 
  config, 
  isDragging = false 
}) => {
  const tokens = useStyleLabTokens();
  const [isHovering, setIsHovering] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({ 
    id: worker.id,
    disabled: worker.fatigue > 90 || worker.hp < 10 
  });

  const isExhausted = worker.fatigue > 90;
  const isDisabled = worker.fatigue > 90 || worker.hp < 10;

  const cardStyle: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? config.dragScale : 1,
    scale: isDragging ? config.dragScale : 1,
    background: tokens.preset.surfaces.card.background as string,
    border: `2px solid ${isDisabled ? '#666' : config.cardGlowColor}`,
    borderRadius: '8px',
    padding: '12px',
    margin: '8px',
    cursor: isDisabled ? 'not-allowed' : 'grab',
    boxShadow: isHovering ? `0 0 ${20 * config.bloomIntensity}px ${config.cardGlowColor}` : '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease-out',
    position: 'relative',
    overflow: 'hidden',
    color: tokens.preset.surfaces.card.color as string,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={cardStyle}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      className="worker-card"
      data-testid={`worker-card-${worker.id}`}
    >
      {/* Bloom effect overlay */}
      <AnimatePresence>
        {(isHovering || isDragging) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 * config.bloomIntensity }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at center, ${config.cardGlowColor} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Worker info */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '600',
          color: '#333',
          marginBottom: '4px' 
        }}>
          {worker.name}
        </div>
        
        <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
          <div style={{ color: '#22c55e' }}>
            HP: {worker.hp}%
          </div>
          <div style={{ color: isExhausted ? '#ef4444' : '#f59e0b' }}>
            Fatigue: {worker.fatigue}%
          </div>
        </div>

        {isExhausted && (
          <div style={{ 
            fontSize: '11px', 
            color: '#ef4444',
            marginTop: '4px' 
          }}>
            😴 Exhausted
          </div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Roster demo component props
 */
export interface RosterDemoProps {
  config: RosterConfig;
  onConfigChange?: (config: Partial<RosterConfig>) => void;
}

/**
 * Main roster demo component
 */
export const RosterDemo: React.FC<RosterDemoProps> = ({ 
  config, 
  onConfigChange 
}) => {
  const tokens = useStyleLabTokens();
  const [draggedWorker, setDraggedWorker] = useState<MockWorker | null>(null);
  const [isAutoLooping, setIsAutoLooping] = useState(config.autoLoop);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-loop functionality
  useEffect(() => {
    if (isAutoLooping && config.autoLoop) {
      intervalRef.current = setInterval(() => {
        // Simulate drag and return animation
        const availableWorkers = mockWorkers.filter(w => w.fatigue <= 90 && w.hp >= 10);
        if (availableWorkers.length > 0) {
          const randomWorker = availableWorkers[Math.floor(Math.random() * availableWorkers.length)];
          setDraggedWorker(randomWorker);
          
          // Return after animation duration
          setTimeout(() => {
            setDraggedWorker(null);
          }, config.returnAnimationMs);
        }
      }, config.loopTiming);
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
  }, [isAutoLooping, config.autoLoop, config.loopTiming, config.returnAnimationMs]);

  const handleDragStart = (event: DragStartEvent) => {
    const worker = mockWorkers.find(w => w.id === event.active.id);
    if (worker) {
      setDraggedWorker(worker);
    }
  };

  const handleDragEnd = (_event: DragEndEvent) => {
    setDraggedWorker(null);
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

  const workersGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={containerStyle} data-testid="roster-demo">
        <div style={headerStyle}>
          <span>Worker Roster Demo</span>
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
          </div>
        </div>

        <div style={workersGridStyle}>
          {mockWorkers.map((worker) => (
            <DraggableWorkerCard
              key={worker.id}
              worker={worker}
              config={config}
              isDragging={draggedWorker?.id === worker.id}
            />
          ))}
        </div>

        {draggedWorker && (
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
            Dragging: {draggedWorker.name}
          </div>
        )}
      </div>
    </DndContext>
  );
};

export default RosterDemo;
