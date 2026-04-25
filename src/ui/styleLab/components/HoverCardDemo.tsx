/**
 * Hover Card Demo Component
 * 
 * Demonstrates hover card with continuous hover effect and content rotation.
 * Uses Style Lab tokens for consistent styling.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStyleLabTokens } from '../hooks/useStyleLabTokens';
import type { HoverCardConfig } from '../config/demoConfig';

interface HoverCardDemoProps {
  config: HoverCardConfig;
  isActive: boolean;
}

/**
 * Main HoverCardDemo component
 */
export function HoverCardDemo({ config, isActive }: HoverCardDemoProps) {
  const [isHovered, setIsHovered] = useState(config.isHovered);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hover logic
  useEffect(() => {
    if (!isActive || !config.autoHover || isPaused) return;

    const hoverCycle = () => {
      setIsHovered(true);

      // Unhover after delay
      timeoutRef.current = setTimeout(() => {
        setIsHovered(false);

        // Restart cycle after pause
        timeoutRef.current = setTimeout(() => {
          hoverCycle();
        }, 1000);
      }, config.hoverDelay);
    };

    // Start first hover after delay
    const initialTimeout = setTimeout(hoverCycle, 1000);

    return () => {
      clearTimeout(initialTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, config.autoHover, config.hoverDelay, isPaused]);

  // Content rotation logic
  useEffect(() => {
    if (!config.contentRotation || isPaused) return;

    const rotateContent = () => {
      setCurrentContentIndex(prev => (prev + 1) % config.content.length);
    };

    const interval = setInterval(rotateContent, 3000 / config.rotationSpeed);

    return () => clearInterval(interval);
  }, [config.contentRotation, config.rotationSpeed, config.content.length, isPaused]);

  const handleHover = () => {
    setIsHovered(true);
    setIsPaused(true);
    // Resume auto-hover after 3 seconds of inactivity
    timeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  };

  const handleUnhover = () => {
    setIsHovered(false);
  };

  const tokens = useStyleLabTokens({});

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Title */}
        <div className="text-center">
          <h3 className={`text-xl font-bold mb-2`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Hover Card Demo
          </h3>
          <p className={`text-sm opacity-70`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            {config.autoHover ? 'Auto-hovering card' : 'Manual hover control'}
            {isPaused && ' (Paused)'}
          </p>
        </div>

        {/* Hover Card */}
        <div className="flex justify-center">
          <motion.div
            className="relative cursor-pointer"
            style={{
              width: `${config.cardWidth}px`,
              height: `${config.cardHeight}px`,
            }}
            onHoverStart={handleHover}
            onHoverEnd={handleUnhover}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Card Background */}
            <motion.div
              className="absolute inset-0 rounded-lg border-2 flex items-center justify-center p-6"
              style={{
                borderColor: isHovered ? tokens.modifierScopes.GLOBAL.background : tokens.preset.surfaces.card.borderColor || '#444',
                backgroundColor: String(tokens.preset.surfaces.card.background || 'rgba(255,255,255,0.05)'),
              }}
              animate={{
                boxShadow: isHovered && config.showShadow 
                  ? `0 20px 40px ${tokens.modifierScopes.GLOBAL.background}40` 
                  : `0 4px 12px ${tokens.preset.surfaces.panel.borderColor || '#666'}40`,
              }}
            />

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentContentIndex}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut",
                }}
              >
                <div 
                  className={`text-lg font-semibold mb-2`}
                  style={{ color: isHovered ? tokens.modifierScopes.GLOBAL.background : tokens.preset.surfaces.panel.color || '#fff' }}
                >
                  {config.content[currentContentIndex]}
                </div>
                <div 
                  className={`text-sm opacity-70`}
                  style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}
                >
                  Content {currentContentIndex + 1} of {config.content.length}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Hover Effect Overlay */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: `linear-gradient(135deg, ${tokens.modifierScopes.GLOBAL.background}20, transparent)`,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Glow Effect */}
            {isHovered && (
              <motion.div
                className="absolute inset-0 rounded-lg pointer-events-none"
                animate={{
                  boxShadow: `0 0 30px ${tokens.modifierScopes.GLOBAL.background}60`,
                }}
              />
            )}
          </motion.div>
        </div>

        {/* Status Display */}
        <motion.div
          className="text-center"
          key={isHovered ? 'hovered' : 'normal'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className={`text-lg font-semibold`} style={{ color: isHovered ? tokens.modifierScopes.GLOBAL.background : tokens.preset.surfaces.panel.color || '#fff' }}>
            {isHovered ? 'Hovering' : 'Normal'}
          </div>
          <div className={`text-sm opacity-70`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Card is {isHovered ? 'active' : 'inactive'}
          </div>
          {config.contentRotation && (
            <div className={`text-xs opacity-60 mt-2`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
              Rotating content: {config.content[currentContentIndex]}
            </div>
          )}
        </motion.div>

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
            onClick={() => setCurrentContentIndex((prev) => (prev + 1) % config.content.length)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors`}
            style={{
              background: 'transparent',
              color: tokens.preset.surfaces.panel.color || '#fff',
              border: `1px solid ${tokens.preset.surfaces.card.borderColor || '#444'}`,
            }}
          >
            Next Content
          </button>
        </div>

        {/* Configuration Info */}
        <div className="text-center space-y-2">
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Hover Delay: {config.hoverDelay}ms
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Card Size: {config.cardWidth}×{config.cardHeight}px
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Rotation Speed: {config.rotationSpeed}x
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Auto Hover: {config.autoHover ? 'Enabled' : 'Disabled'}
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Content Rotation: {config.contentRotation ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {/* Visual Indicator */}
        <div className="flex justify-center">
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: isHovered ? tokens.modifierScopes.GLOBAL.background : `${tokens.preset.surfaces.panel.color || '#fff'}30`,
            }}
            animate={{
              scale: isHovered ? [1, 1.2, 1] : 1,
              boxShadow: isHovered ? `0 0 10px ${tokens.modifierScopes.GLOBAL.background}` : 'none',
            }}
            transition={{
              duration: 0.5,
              repeat: isHovered ? Infinity : 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}
