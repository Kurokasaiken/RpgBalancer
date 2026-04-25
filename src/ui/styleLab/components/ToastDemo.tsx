/**
 * Toast Demo Component
 * 
 * Demonstrates notification toast with automatic appear/disappear animation.
 * Uses Style Lab tokens for consistent styling.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStyleLabTokens } from '../hooks/useStyleLabTokens';
import type { ToastConfig } from '../config/demoConfig';

interface ToastDemoProps {
  config: ToastConfig;
  isActive: boolean;
}

/**
 * Main ToastDemo component
 */
export function ToastDemo({ config, isActive }: ToastDemoProps) {
  const [isVisible, setIsVisible] = useState(config.isVisible);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-show logic
  useEffect(() => {
    if (!isActive || !config.autoShow || isPaused) return;

    const showToast = () => {
      setIsVisible(true);

      // Hide after duration
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, config.duration);

      // Show next toast after interval
      timeoutRef.current = setTimeout(() => {
        showToast();
      }, config.showInterval);
    };

    // Start first toast after delay
    const initialTimeout = setTimeout(showToast, 1000);

    return () => {
      clearTimeout(initialTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, config.autoShow, config.duration, config.showInterval, isPaused]);

  const handleShowToast = () => {
    setIsVisible(true);
    setIsPaused(true);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIsPaused(false);
      }, 1000);
    }, config.duration);
  };

  const getPositionStyles = () => {
    switch (config.position) {
      case 'top-left':
        return { top: 20, left: 20 };
      case 'top-right':
        return { top: 20, right: 20 };
      case 'bottom-left':
        return { bottom: 20, left: 20 };
      case 'bottom-right':
        return { bottom: 20, right: 20 };
      case 'center':
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      default:
        return { top: 20, right: 20 };
    }
  };

  const getTypeColors = () => {
    switch (config.type) {
      case 'success':
        return { bg: '#22c55e', border: '#16a34a', icon: '✓' };
      case 'error':
        return { bg: '#ef4444', border: '#dc2626', icon: '✗' };
      case 'warning':
        return { bg: '#f59e0b', border: '#d97706', icon: '⚠' };
      case 'info':
      default:
        return { bg: '#3b82f6', border: '#2563eb', icon: 'ℹ' };
    }
  };

  const tokens = useStyleLabTokens({});
  const typeColors = getTypeColors();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Title */}
        <div className="text-center">
          <h3 className={`text-xl font-bold mb-2`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Toast Demo
          </h3>
          <p className={`text-sm opacity-70`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            {config.autoShow ? 'Auto-showing notifications' : 'Manual toast control'}
            {isPaused && ' (Paused)'}
          </p>
        </div>

        {/* Toast Container */}
        <div className="relative" style={{ height: '200px' }}>
          <AnimatePresence>
            {isVisible && (
              <motion.div
                className="absolute"
                style={getPositionStyles()}
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              >
                <div
                  className="px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3"
                  style={{
                    backgroundColor: typeColors.bg,
                    border: `1px solid ${typeColors.border}`,
                    color: '#fff',
                    minWidth: '250px',
                  }}
                >
                  {/* Icon */}
                  {config.showIcon && (
                    <motion.div
                      className="text-xl font-bold"
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                    >
                      {typeColors.icon}
                    </motion.div>
                  )}

                  {/* Message */}
                  <div className="flex-1">
                    <div className="font-medium">{config.message}</div>
                    <div className="text-xs opacity-80">
                      {config.type.charAt(0).toUpperCase() + config.type.slice(1)} notification
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setIsVisible(false)}
                    className="text-white opacity-70 hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Display */}
        <motion.div
          className="text-center"
          key={isVisible ? 'visible' : 'hidden'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className={`text-lg font-semibold`} style={{ color: isVisible ? typeColors.bg : tokens.preset.surfaces.panel.color || '#fff' }}>
            {isVisible ? 'Toast Visible' : 'Toast Hidden'}
          </div>
          <div className={`text-sm opacity-70`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Notification is {isVisible ? 'showing' : 'hidden'}
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleShowToast}
            className={`px-4 py-2 rounded-lg font-medium transition-colors`}
            style={{
              background: typeColors.bg,
              color: '#fff',
              border: `1px solid ${typeColors.border}`,
            }}
          >
            Show Toast
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors`}
            style={{
              background: 'transparent',
              color: tokens.preset.surfaces.panel.color || '#fff',
              border: `1px solid ${tokens.preset.surfaces.card.borderColor || '#444'}`,
            }}
          >
            Hide
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors`}
            style={{
              background: isPaused ? typeColors.bg : 'transparent',
              color: isPaused ? '#fff' : tokens.preset.surfaces.panel.color || '#fff',
              border: `1px solid ${typeColors.border}`,
            }}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>

        {/* Configuration Info */}
        <div className="text-center space-y-2">
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Show Interval: {config.showInterval}ms
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Duration: {config.duration}ms
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Position: {config.position}
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Type: {config.type}
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Auto Show: {config.autoShow ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {/* Visual Indicator */}
        <div className="flex justify-center">
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: isVisible ? typeColors.bg : `${tokens.preset.surfaces.panel.color || '#fff'}30`,
            }}
            animate={{
              scale: isVisible ? [1, 1.2, 1] : 1,
              boxShadow: isVisible ? `0 0 10px ${typeColors.bg}` : 'none',
            }}
            transition={{
              duration: 0.5,
              repeat: isVisible ? Infinity : 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}
