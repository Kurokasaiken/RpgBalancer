/**
 * Drag & Drop Demo Component
 * 
 * Demonstrates drag and drop functionality with automatic looping.
 * Shows visual animation even without user interaction.
 */

import React, { useState, useEffect, useRef } from 'react';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { useStyleLabTokens } from '../hooks/useStyleLabTokens';
import type { DragDropConfig } from '../config/demoConfig';

interface DragDropDemoProps {
  config: DragDropConfig;
  isActive: boolean;
}

interface DraggableCardProps {
  id: string;
  children: React.ReactNode;
  isAnimating: boolean;
  animationPhase: 'idle' | 'dragging' | 'success' | 'fail' | 'return';
  springStiffness: number;
}

interface DroppableSlotProps {
  id: string;
  isOccupied: boolean;
  children: React.ReactNode;
}

/**
 * Draggable card component using dnd-kit with visual animation support
 */
function DraggableCard({ id, children, isAnimating, animationPhase, springStiffness }: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id });

  const tokens = useStyleLabTokens({});
  
  // Animation transforms for auto-loop
  const animationTransform = isAnimating ? {
    x: animationPhase === 'dragging' ? 150 : animationPhase === 'return' ? 0 : 0,
    y: animationPhase === 'dragging' ? 100 : animationPhase === 'return' ? 0 : 0,
    scale: animationPhase === 'dragging' ? 1.1 : animationPhase === 'success' ? 0.95 : 1,
    rotate: animationPhase === 'dragging' ? 5 : animationPhase === 'return' ? -5 : 0,
  } : {};
  
  const finalTransform = transform ? 
    `translate3d(${transform.x}px, ${transform.y}px, 0)` : 
    animationTransform.x !== undefined ? 
      `translate3d(${animationTransform.x}px, ${animationTransform.y}px, 0) scale(${animationTransform.scale}) rotate(${animationTransform.rotate}deg)` : 
      undefined;
  
  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: finalTransform,
        cursor: isDragging ? 'grabbing' : 'grab',
        background: `linear-gradient(135deg, ${tokens.modifierScopes.GLOBAL.background}, ${tokens.modifierScopes.QUEST.background})`,
        boxShadow: isDragging || animationPhase === 'dragging' 
          ? `0 10px 30px ${tokens.modifierStatus.active.border}80`
          : `0 4px 15px ${tokens.preset.surfaces.panel.borderColor}40`,
      }}
      className={`
        px-6 py-3 rounded-lg font-semibold
        text-white relative
        transition-all duration-300
        ${isDragging || animationPhase === 'dragging' ? 'z-50' : 'z-10'}
      `}
      animate={{
        scale: isAnimating && animationPhase === 'dragging' ? 1.05 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: springStiffness,
        damping: 25,
      }}
    >
      {/* Glow effect during drag/animation */}
      {(isDragging || animationPhase === 'dragging') && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          animate={{
            boxShadow: `0 0 30px ${tokens.modifierStatus.active.border}60`,
          }}
        />
      )}
      {children}
    </motion.div>
  );
}

/**
 * Droppable slot component with visual feedback
 */
function DroppableSlot({ id, isOccupied, children }: DroppableSlotProps) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const tokens = useStyleLabTokens({});

  return (
    <motion.div
      ref={setNodeRef}
      className={`
        relative w-full h-32 rounded-lg border-2 border-dashed
        flex items-center justify-center
        transition-all duration-300
        ${isOccupied ? 'border-solid' : ''}
      `}
      animate={{
        borderColor: isOver ? tokens.modifierStatus.active.border : tokens.preset.surfaces.card.borderColor || '#ccc',
        backgroundColor: isOver ? `${tokens.modifierStatus.active.background}40` : 'transparent',
        scale: isOver ? 1.05 : 1,
      }}
      whileHover={{ scale: isOccupied ? 1 : 1.02 }}
    >
      {isOver && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          animate={{
            boxShadow: `0 0 20px ${tokens.modifierStatus.active.border}60`,
          }}
        />
      )}
      {children}
    </motion.div>
  );
}

/**
 * Main DragDropDemo component
 */
export function DragDropDemo({ config, isActive }: DragDropDemoProps) {
  const [isOccupied, setIsOccupied] = useState(false);
  const [loopPhase, setLoopPhase] = useState<'idle' | 'dragging' | 'success' | 'fail' | 'return'>('idle');
  const [attemptCount, setAttemptCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-loop logic: success on even attempts, fail on odd attempts
  useEffect(() => {
    if (!isActive || !config.autoLoop) return;

    const startLoop = () => {
      setLoopPhase('dragging');
      
      // Simulate drop result after 1 second
      setTimeout(() => {
        const shouldSucceed = attemptCount % 2 === 0; // Success on even attempts
        
        if (shouldSucceed) {
          setIsOccupied(true);
          setLoopPhase('success');
        } else {
          setIsOccupied(false);
          setLoopPhase('fail');
        }
        
        // Return to start after hold duration
        timeoutRef.current = setTimeout(() => {
          setIsOccupied(false);
          setLoopPhase('return');
          
          // Reset and restart loop with incremented attempt
          timeoutRef.current = setTimeout(() => {
            setLoopPhase('idle');
            setAttemptCount(prev => prev + 1);
            startLoop();
          }, 500);
        }, config.holdDuration);
      }, 1000);
    };

    // Start loop after initial delay
    const initialTimeout = setTimeout(startLoop, config.loopTiming);
    
    return () => {
      clearTimeout(initialTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, config.autoLoop, config.loopTiming, config.holdDuration, attemptCount]);

  const handleDragStart = () => {
    setLoopPhase('dragging');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;
    const shouldSucceed = attemptCount % 2 === 0;
    
    if (over && shouldSucceed) {
      setIsOccupied(true);
      setLoopPhase('success');
    } else {
      setIsOccupied(false);
      setLoopPhase('fail');
    }
    
    // Auto-return after delay
    setTimeout(() => {
      setIsOccupied(false);
      setLoopPhase('return');
      setTimeout(() => {
        setLoopPhase('idle');
        setAttemptCount(prev => prev + 1);
      }, 500);
    }, config.holdDuration);
  };

  const tokens = useStyleLabTokens({});

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Title */}
        <div className="text-center">
          <h3 className={`text-xl font-bold mb-2`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Drag & Drop Demo
          </h3>
          <p className={`text-sm opacity-70`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            {loopPhase === 'idle' && 'Ready to demonstrate drag & drop'}
            {loopPhase === 'dragging' && 'Dragging card to slot...'}
            {loopPhase === 'success' && 'Successfully dropped!'}
            {loopPhase === 'fail' && 'Drop failed!'}
            {loopPhase === 'return' && 'Returning to start...'}
          </p>
        </div>

        {/* Drag & Drop Area */}
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="space-y-6">
            {/* Draggable Card */}
            <div className="flex justify-center">
              <DraggableCard 
                id="demo-card" 
                isAnimating={isActive && config.autoLoop}
                animationPhase={loopPhase}
                springStiffness={config.springStiffness}
              >
                <div className={`
                  px-6 py-3 rounded-lg font-semibold
                  text-white
                `}
                style={{
                  background: `linear-gradient(to right, ${tokens.modifierScopes.GLOBAL.background}, ${tokens.modifierScopes.QUEST.background})`,
                }}>
                  Drag Me
                </div>
              </DraggableCard>
            </div>

            {/* Droppable Slot */}
            <DroppableSlot id="demo-slot" isOccupied={isOccupied}>
              {isOccupied && loopPhase === 'success' ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`
                    px-6 py-3 rounded-lg font-semibold
                    text-white
                  `}
                  style={{
                    background: `linear-gradient(to right, ${tokens.modifierStatus.active.background}, #10b981)`,
                  }}
                >
                  Success!
                </motion.div>
              ) : loopPhase === 'fail' ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`
                    px-6 py-3 rounded-lg font-semibold
                    text-white
                  `}
                  style={{
                    background: `linear-gradient(to right, ${tokens.modifierScopes.GLOBAL.background}, #ef4444)`,
                  }}
                >
                  Failed!
                </motion.div>
              ) : (
                <div style={{ color: tokens.preset.surfaces.panel.color || '#fff', opacity: 0.5 }}>
                  Drop Zone
                </div>
              )}
            </DroppableSlot>
          </div>
        </DndContext>

        {/* Status Indicator */}
        <div className="flex justify-center">
          <motion.div
            className={`w-3 h-3 rounded-full`}
            style={{
              backgroundColor: 
                loopPhase === 'idle' ? `${tokens.preset.surfaces.panel.color || '#fff'}30` :
                loopPhase === 'dragging' ? tokens.modifierScopes.GLOBAL.background :
                loopPhase === 'success' ? tokens.modifierStatus.active.background :
                loopPhase === 'fail' ? '#ef4444' :
                tokens.modifierScopes.QUEST.background,
            }}
            animate={{
              scale: loopPhase !== 'idle' ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: loopPhase !== 'idle' ? Infinity : 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}
