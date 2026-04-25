/**
 * Button Demo Component
 * 
 * Demonstrates button interactions with squash animation and automatic looping.
 * Uses Style Lab tokens for consistent styling.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStyleLabTokens } from '../hooks/useStyleLabTokens';
import type { ButtonConfig } from '../config/demoConfig';

interface ButtonDemoProps {
  config: ButtonConfig;
  isActive: boolean;
}

/**
 * Main ButtonDemo component
 */
export function ButtonDemo({ config, isActive }: ButtonDemoProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [loopPhase, setLoopPhase] = useState<'idle' | 'pressing' | 'pressed' | 'releasing'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-loop logic
  useEffect(() => {
    if (!isActive || !config.autoLoop) return;

    const startLoop = () => {
      setLoopPhase('pressing');
      setIsPressed(true);
      
      // Hold for specified duration
      timeoutRef.current = setTimeout(() => {
        setLoopPhase('pressed');
        
        // Release after hold duration
        timeoutRef.current = setTimeout(() => {
          setIsPressed(false);
          setLoopPhase('releasing');
          
          // Reset and restart loop
          timeoutRef.current = setTimeout(() => {
            setLoopPhase('idle');
            startLoop();
          }, 500);
        }, config.holdDuration);
      }, 300); // Press animation duration
    };

    // Start loop after initial delay
    const initialTimeout = setTimeout(startLoop, config.clickTiming);
    
    return () => {
      clearTimeout(initialTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, config.autoLoop, config.clickTiming, config.holdDuration]);

  const handlePressStart = () => {
    if (!config.autoLoop) {
      setIsPressed(true);
      setLoopPhase('pressing');
    }
  };

  const handlePressEnd = () => {
    if (!config.autoLoop) {
      setIsPressed(false);
      setLoopPhase('releasing');
      setTimeout(() => setLoopPhase('idle'), 500);
    }
  };

  const tokens = useStyleLabTokens({});

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Title */}
        <div className="text-center">
          <h3 className={`text-xl font-bold mb-2`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Button Demo
          </h3>
          <p className={`text-sm opacity-70`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            {loopPhase === 'idle' && 'Ready to demonstrate button interactions'}
            {loopPhase === 'pressing' && 'Pressing button...'}
            {loopPhase === 'pressed' && 'Button held down'}
            {loopPhase === 'releasing' && 'Releasing button...'}
          </p>
        </div>

        {/* Button */}
        <div className="flex justify-center">
          <motion.button
            className={`
              relative px-8 py-4 rounded-lg font-semibold text-white
              transition-all duration-200
              cursor-pointer select-none
            `}
            style={{
              background: isPressed 
                ? tokens.modifierScopes.GLOBAL.background
                : `linear-gradient(135deg, ${tokens.modifierScopes.GLOBAL.background}, ${tokens.modifierScopes.QUEST.background})`,
              boxShadow: isPressed
                ? `inset 0 4px 8px rgba(0,0,0,0.3)`
                : `0 8px 16px ${tokens.modifierScopes.GLOBAL.background}40`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: config.squashFactor }}
            animate={{
              scale: isPressed ? config.squashFactor : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
          >
            {/* Ripple effect */}
            {config.showRipple && isPressed && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                  background: `radial-gradient(circle, ${tokens.modifierScopes.GLOBAL.foreground}20, transparent)`,
                }}
              />
            )}
            
            <span className="relative z-10">
              {isPressed ? 'Pressed!' : 'Click Me'}
            </span>
          </motion.button>
        </div>

        {/* Status Indicator */}
        <div className="flex justify-center">
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: 
                loopPhase === 'idle' ? `${tokens.preset.surfaces.panel.color || '#fff'}30` :
                loopPhase === 'pressing' ? tokens.modifierScopes.GLOBAL.background :
                loopPhase === 'pressed' ? tokens.modifierStatus.active.background :
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

        {/* Configuration Info */}
        <div className="text-center space-y-2">
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Squash Factor: {config.squashFactor}
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Hold Duration: {config.holdDuration}ms
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Auto Loop: {config.autoLoop ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>
    </div>
  );
}
