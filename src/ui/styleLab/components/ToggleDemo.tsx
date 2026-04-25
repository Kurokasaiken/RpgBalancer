/**
 * Toggle Demo Component
 * 
 * Demonstrates toggle switch functionality with automatic on/off switching.
 * Uses Style Lab tokens for consistent styling.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStyleLabTokens } from '../hooks/useStyleLabTokens';
import type { ToggleConfig } from '../config/demoConfig';

interface ToggleDemoProps {
  config: ToggleConfig;
  isActive: boolean;
}

/**
 * Main ToggleDemo component
 */
export function ToggleDemo({ config, isActive }: ToggleDemoProps) {
  const [isOn, setIsOn] = useState(config.isOn);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-toggle logic
  useEffect(() => {
    if (!isActive || !config.autoToggle || isPaused) return;

    const interval = setInterval(() => {
      setIsOn(prev => !prev);
    }, config.toggleInterval);

    return () => {
      clearInterval(interval);
    };
  }, [isActive, config.autoToggle, config.toggleInterval, isPaused]);

  const handleToggle = () => {
    setIsOn(!isOn);
    setIsPaused(true);
    // Resume auto-toggle after 5 seconds of inactivity
    timeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 5000);
  };

  const tokens = useStyleLabTokens({});

  const getSwitchSize = () => {
    switch (config.switchSize) {
      case 'small': return { width: 40, height: 20, thumb: 16 };
      case 'large': return { width: 64, height: 32, thumb: 24 };
      default: return { width: 48, height: 24, thumb: 20 };
    }
  };

  const switchSize = getSwitchSize();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Title */}
        <div className="text-center">
          <h3 className={`text-xl font-bold mb-2`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Toggle Demo
          </h3>
          <p className={`text-sm opacity-70`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            {config.autoToggle ? 'Auto-toggling switch' : 'Manual toggle control'}
            {isPaused && ' (Paused)'}
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex justify-center">
          <motion.button
            onClick={handleToggle}
            className={`relative rounded-full cursor-pointer transition-colors`}
            style={{
              width: `${switchSize.width}px`,
              height: `${switchSize.height}px`,
              backgroundColor: isOn ? tokens.modifierScopes.GLOBAL.background : tokens.preset.surfaces.card.borderColor || '#444',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Thumb */}
            <motion.div
              className={`absolute top-1/2 rounded-full`}
              style={{
                width: `${switchSize.thumb}px`,
                height: `${switchSize.thumb}px`,
                backgroundColor: '#fff',
                left: isOn ? `${switchSize.width - switchSize.thumb - 4}px` : '4px',
                transform: 'translateY(-50%)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
              animate={
                config.toggleAnimation ? {
                  x: isOn ? switchSize.width - switchSize.thumb - 8 : 0,
                } : {}
              }
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
            />

            {/* Glow effect when on */}
            {isOn && (
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  boxShadow: `0 0 20px ${tokens.modifierScopes.GLOBAL.background}60`,
                }}
              />
            )}
          </motion.button>
        </div>

        {/* Status Display */}
        {config.showLabel && (
          <motion.div
            className="text-center"
            key={isOn ? 'on' : 'off'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`text-2xl font-bold`} style={{ color: isOn ? tokens.modifierScopes.GLOBAL.background : tokens.preset.surfaces.panel.color || '#fff' }}>
              {isOn ? 'ON' : 'OFF'}
            </div>
            <div className={`text-sm opacity-70`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
              Switch is {isOn ? 'active' : 'inactive'}
            </div>
          </motion.div>
        )}

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
            onClick={() => setIsOn(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors`}
            style={{
              background: 'transparent',
              color: tokens.preset.surfaces.panel.color || '#fff',
              border: `1px solid ${tokens.preset.surfaces.card.borderColor || '#444'}`,
            }}
          >
            Turn Off
          </button>
        </div>

        {/* Configuration Info */}
        <div className="text-center space-y-2">
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Toggle Interval: {config.toggleInterval}ms
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Switch Size: {config.switchSize}
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Auto Toggle: {config.autoToggle ? 'Enabled' : 'Disabled'}
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Animation: {config.toggleAnimation ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {/* Visual Indicator */}
        <div className="flex justify-center">
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: isOn ? tokens.modifierScopes.GLOBAL.background : `${tokens.preset.surfaces.panel.color || '#fff'}30`,
            }}
            animate={{
              scale: isOn ? [1, 1.2, 1] : 1,
              boxShadow: isOn ? `0 0 10px ${tokens.modifierScopes.GLOBAL.background}` : 'none',
            }}
            transition={{
              duration: 0.5,
              repeat: isOn ? Infinity : 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}
