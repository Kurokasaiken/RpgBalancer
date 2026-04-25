/**
 * Slider Demo Component
 * 
 * Demonstrates slider functionality with automatic movement and real-time value display.
 * Uses Style Lab tokens for consistent styling.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStyleLabTokens } from '../hooks/useStyleLabTokens';
import type { SliderConfig } from '../config/demoConfig';

interface SliderDemoProps {
  config: SliderConfig;
  isActive: boolean;
}

/**
 * Main SliderDemo component
 */
export function SliderDemo({ config, isActive }: SliderDemoProps) {
  const [currentValue, setCurrentValue] = useState(config.currentValue);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-move logic
  useEffect(() => {
    if (!isActive || !config.autoMove || isPaused) return;

    const moveSlider = () => {
      setCurrentValue(prev => {
        let newValue = prev;
        
        switch (config.moveDirection) {
          case 'forward':
            newValue = prev + config.stepSize * config.moveSpeed;
            if (newValue >= config.maxValue) {
              newValue = config.maxValue;
              // Reset after reaching max
              timeoutRef.current = setTimeout(() => {
                setCurrentValue(config.minValue);
              }, 1000);
            }
            break;
          case 'backward':
            newValue = prev - config.stepSize * config.moveSpeed;
            if (newValue <= config.minValue) {
              newValue = config.minValue;
              // Reset after reaching min
              timeoutRef.current = setTimeout(() => {
                setCurrentValue(config.maxValue);
              }, 1000);
            }
            break;
          case 'random':
            newValue = config.minValue + Math.random() * (config.maxValue - config.minValue);
            break;
        }
        
        return Math.max(config.minValue, Math.min(config.maxValue, newValue));
      });
    };

    const interval = setInterval(moveSlider, 50);
    
    return () => {
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, config.autoMove, config.moveSpeed, config.moveDirection, config.stepSize, config.minValue, config.maxValue, isPaused]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(Number(e.target.value));
    setIsPaused(true);
    // Resume auto-move after 2 seconds of inactivity
    timeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 2000);
  };

  const tokens = useStyleLabTokens({});

  const percentage = ((currentValue - config.minValue) / (config.maxValue - config.minValue)) * 100;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Title */}
        <div className="text-center">
          <h3 className={`text-xl font-bold mb-2`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Slider Demo
          </h3>
          <p className={`text-sm opacity-70`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            {config.autoMove ? 'Auto-moving slider' : 'Manual slider control'}
            {isPaused && ' (Paused)'}
          </p>
        </div>

        {/* Slider */}
        <div className="space-y-4">
          {/* Slider Track */}
          <div className="relative">
            <div 
              className="w-full rounded-full"
              style={{ 
                height: `${config.trackHeight}px`,
                backgroundColor: tokens.preset.surfaces.card.borderColor || '#444'
              }}
            >
              {/* Filled portion */}
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${percentage}%`,
                  background: `linear-gradient(to right, ${tokens.modifierScopes.GLOBAL.background}, ${tokens.modifierScopes.QUEST.background})`,
                }}
                animate={{
                  boxShadow: `0 0 20px ${tokens.modifierScopes.GLOBAL.background}40`,
                }}
              />
            </div>

            {/* Slider Input */}
            <input
              type="range"
              min={config.minValue}
              max={config.maxValue}
              step={config.stepSize}
              value={currentValue}
              onChange={handleSliderChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ cursor: isPaused ? 'pointer' : 'grab' }}
            />

            {/* Slider Thumb */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full cursor-grab active:cursor-grabbing"
              style={{
                left: `${percentage}%`,
                transform: 'translate(-50%, -50%)',
                background: tokens.modifierScopes.GLOBAL.background,
                boxShadow: `0 4px 12px ${tokens.modifierScopes.GLOBAL.background}60`,
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          </div>

          {/* Value Display */}
          {config.showValue && (
            <motion.div
              className="text-center"
              key={currentValue}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`text-3xl font-bold`} style={{ color: tokens.modifierScopes.GLOBAL.background }}>
                {Math.round(currentValue)}
              </div>
              <div className={`text-sm opacity-70`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
                {config.minValue} - {config.maxValue}
              </div>
            </motion.div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors`}
            style={{
              background: isPaused ? tokens.modifierScopes.GLOBAL.background : 'transparent',
              color: isPaused ? '#fff' : tokens.preset.surfaces.panel.color || '#fff',
              border: `1px solid ${tokens.modifierScopes.GLOBAL.background}`,
            }}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => setCurrentValue(config.minValue)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors`}
            style={{
              background: 'transparent',
              color: tokens.preset.surfaces.panel.color || '#fff',
              border: `1px solid ${tokens.preset.surfaces.card.borderColor || '#444'}`,
            }}
          >
            Reset
          </button>
        </div>

        {/* Configuration Info */}
        <div className="text-center space-y-2">
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Move Speed: {config.moveSpeed}x
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Direction: {config.moveDirection}
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Auto Move: {config.autoMove ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>
    </div>
  );
}
