/**
 * Progress Ring Demo Component
 * 
 * Demonstrates circular progress ring with fill/drain animation and percentage display.
 * Uses Style Lab tokens for consistent styling.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStyleLabTokens } from '../hooks/useStyleLabTokens';
import type { ProgressRingConfig } from '../config/demoConfig';

interface ProgressRingDemoProps {
  config: ProgressRingConfig;
  isActive: boolean;
}

/**
 * Main ProgressRingDemo component
 */
export function ProgressRingDemo({ config, isActive }: ProgressRingDemoProps) {
  const [percentage, setPercentage] = useState(config.percentage);
  const [isPaused, setIsPaused] = useState(false);
  const [isFilling, setIsFilling] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-fill/drain logic
  useEffect(() => {
    if (!isActive || !config.autoFill || isPaused) return;

    const animateProgress = () => {
      setPercentage(prev => {
        let newValue = prev;
        
        if (isFilling) {
          newValue = prev + config.fillSpeed;
          if (newValue >= 100) {
            newValue = 100;
            setIsFilling(false);
            // Start draining after a pause
            timeoutRef.current = setTimeout(() => {
              setIsFilling(false);
            }, 1000);
          }
        } else {
          newValue = prev - config.fillSpeed;
          if (newValue <= 0) {
            newValue = 0;
            setIsFilling(true);
            // Start filling after a pause
            timeoutRef.current = setTimeout(() => {
              setIsFilling(true);
            }, 1000);
          }
        }
        
        return Math.max(0, Math.min(100, newValue));
      });
    };

    const interval = setInterval(animateProgress, 50);
    
    return () => {
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, config.autoFill, config.fillSpeed, isFilling, isPaused]);

  const handleReset = () => {
    setPercentage(0);
    setIsFilling(true);
    setIsPaused(true);
    // Resume after 2 seconds
    timeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 2000);
  };

  const tokens = useStyleLabTokens({});

  // Calculate SVG circle properties
  const radius = (config.ringSize - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Title */}
        <div className="text-center">
          <h3 className={`text-xl font-bold mb-2`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Progress Ring Demo
          </h3>
          <p className={`text-sm opacity-70`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            {config.autoFill ? 'Auto-filling ring' : 'Manual progress control'}
            {isPaused && ' (Paused)'}
          </p>
        </div>

        {/* Progress Ring */}
        <div className="flex justify-center">
          <div className="relative" style={{ width: config.ringSize, height: config.ringSize }}>
            {/* SVG Ring */}
            <svg
              width={config.ringSize}
              height={config.ringSize}
              className="transform -rotate-90"
            >
              {/* Background circle */}
              <circle
                cx={config.ringSize / 2}
                cy={config.ringSize / 2}
                r={radius}
                stroke={tokens.preset.surfaces.card.borderColor || '#444'}
                strokeWidth={config.strokeWidth}
                fill="none"
              />

              {/* Progress circle */}
              <motion.circle
                cx={config.ringSize / 2}
                cy={config.ringSize / 2}
                r={radius}
                stroke={tokens.modifierScopes.GLOBAL.background}
                strokeWidth={config.strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                animate={{
                  strokeDashoffset: strokeDashoffset,
                }}
                transition={{
                  duration: 0.1,
                  ease: "linear",
                }}
              />
            </svg>

            {/* Percentage Display */}
            {config.showPercentage && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                key={percentage}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center">
                  <div 
                    className={`text-3xl font-bold`} 
                    style={{ color: tokens.modifierScopes.GLOBAL.background }}
                  >
                    {Math.round(percentage)}%
                  </div>
                  <div 
                    className={`text-xs opacity-70`} 
                    style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}
                  >
                    {isFilling ? 'Filling' : 'Draining'}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Glow effect */}
            {percentage > 0 && (
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  boxShadow: `0 0 ${20 + percentage / 5}px ${tokens.modifierScopes.GLOBAL.background}40`,
                }}
              />
            )}
          </div>
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
            onClick={handleReset}
            className={`px-4 py-2 rounded-lg font-medium transition-colors`}
            style={{
              background: 'transparent',
              color: tokens.preset.surfaces.panel.color || '#fff',
              border: `1px solid ${tokens.preset.surfaces.card.borderColor || '#444'}`,
            }}
          >
            Reset
          </button>
          <button
            onClick={() => setIsFilling(!isFilling)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors`}
            style={{
              background: 'transparent',
              color: tokens.preset.surfaces.panel.color || '#fff',
              border: `1px solid ${tokens.preset.surfaces.card.borderColor || '#444'}`,
            }}
          >
            {isFilling ? 'Drain' : 'Fill'}
          </button>
        </div>

        {/* Configuration Info */}
        <div className="text-center space-y-2">
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Fill Speed: {config.fillSpeed}x
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Ring Size: {config.ringSize}px
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Stroke Width: {config.strokeWidth}px
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Auto Fill: {config.autoFill ? 'Enabled' : 'Disabled'}
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Direction: {config.clockwise ? 'Clockwise' : 'Counter-clockwise'}
          </div>
        </div>

        {/* Visual Indicator */}
        <div className="flex justify-center">
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: percentage > 0 ? tokens.modifierScopes.GLOBAL.background : `${tokens.preset.surfaces.panel.color || '#fff'}30`,
            }}
            animate={{
              scale: percentage > 0 ? [1, 1.2, 1] : 1,
              boxShadow: percentage > 0 ? `0 0 10px ${tokens.modifierScopes.GLOBAL.background}` : 'none',
            }}
            transition={{
              duration: 0.5,
              repeat: percentage > 0 ? Infinity : 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}
