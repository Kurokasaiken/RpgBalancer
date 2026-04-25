/**
 * Text Field Demo Component
 * 
 * Demonstrates text input field with automatic focus/unfocus loop and placeholder animation.
 * Uses Style Lab tokens for consistent styling.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStyleLabTokens } from '../hooks/useStyleLabTokens';
import type { TextFieldConfig } from '../config/demoConfig';

interface TextFieldDemoProps {
  config: TextFieldConfig;
  isActive: boolean;
}

/**
 * Main TextFieldDemo component
 */
export function TextFieldDemo({ config, isActive }: TextFieldDemoProps) {
  const [value, setValue] = useState(config.value);
  const [isFocused, setIsFocused] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus logic
  useEffect(() => {
    if (!isActive || !config.autoFocus || isPaused) return;

    const focusCycle = () => {
      setIsFocused(true);
      if (inputRef.current) {
        inputRef.current.focus();
      }

      // Unfocus after interval
      timeoutRef.current = setTimeout(() => {
        setIsFocused(false);
        if (inputRef.current) {
          inputRef.current.blur();
        }

        // Restart cycle after pause
        timeoutRef.current = setTimeout(() => {
          focusCycle();
        }, 1000);
      }, config.focusInterval);
    };

    // Start first cycle after delay
    const initialTimeout = setTimeout(focusCycle, 1000);

    return () => {
      clearTimeout(initialTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, config.autoFocus, config.focusInterval, isPaused]);

  const handleFocus = () => {
    setIsFocused(true);
    setIsPaused(true);
    // Resume auto-focus after 3 seconds of inactivity
    timeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= config.maxLength) {
      setValue(newValue);
    }
  };

  const handleClear = () => {
    setValue('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const tokens = useStyleLabTokens({});

  const getInputType = () => {
    switch (config.fieldType) {
      case 'email': return 'email';
      case 'password': return 'password';
      case 'search': return 'search';
      default: return 'text';
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Title */}
        <div className="text-center">
          <h3 className={`text-xl font-bold mb-2`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Text Field Demo
          </h3>
          <p className={`text-sm opacity-70`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            {config.autoFocus ? 'Auto-focusing field' : 'Manual text input'}
            {isPaused && ' (Paused)'}
          </p>
        </div>

        {/* Text Field */}
        <div className="relative">
          <motion.div
            className="relative"
            animate={{
              scale: isFocused ? 1.02 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
          >
            {/* Input Field */}
            <input
              ref={inputRef}
              type={getInputType()}
              value={value}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={config.placeholder}
              maxLength={config.maxLength}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 outline-none`}
              style={{
                borderColor: isFocused ? tokens.modifierScopes.GLOBAL.background : tokens.preset.surfaces.card.borderColor || '#444',
                backgroundColor: String(tokens.preset.surfaces.card.background || 'rgba(255,255,255,0.05)'),
                color: tokens.preset.surfaces.panel.color || '#fff',
              }}
            />

            {/* Focus Glow */}
            {isFocused && (
              <motion.div
                className="absolute inset-0 rounded-lg pointer-events-none"
                animate={{
                  boxShadow: `0 0 20px ${tokens.modifierScopes.GLOBAL.background}40`,
                }}
              />
            )}

            {/* Clear Button */}
            {config.showClearButton && value.length > 0 && (
              <motion.button
                onClick={handleClear}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors`}
                style={{
                  backgroundColor: tokens.modifierScopes.GLOBAL.background,
                  color: '#fff',
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
            )}
          </motion.div>

          {/* Character Count */}
          <div className="absolute -bottom-6 right-0">
            <div 
              className={`text-xs opacity-60`}
              style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}
            >
              {value.length}/{config.maxLength}
            </div>
          </div>
        </div>

        {/* Status Display */}
        <motion.div
          className="text-center"
          key={isFocused ? 'focused' : 'blurred'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className={`text-lg font-semibold`} style={{ color: isFocused ? tokens.modifierScopes.GLOBAL.background : tokens.preset.surfaces.panel.color || '#fff' }}>
            {isFocused ? 'Focused' : 'Blurred'}
          </div>
          <div className={`text-sm opacity-70`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Field is {isFocused ? 'active' : 'inactive'}
          </div>
          {value && (
            <div className={`text-xs opacity-60 mt-2`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
              Current value: "{value}"
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
            onClick={() => {
              setValue('');
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors`}
            style={{
              background: 'transparent',
              color: tokens.preset.surfaces.panel.color || '#fff',
              border: `1px solid ${tokens.preset.surfaces.card.borderColor || '#444'}`,
            }}
          >
            Clear
          </button>
        </div>

        {/* Configuration Info */}
        <div className="text-center space-y-2">
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Focus Interval: {config.focusInterval}ms
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Max Length: {config.maxLength}
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Field Type: {config.fieldType}
          </div>
          <div className={`text-xs opacity-60`} style={{ color: tokens.preset.surfaces.panel.color || '#fff' }}>
            Auto Focus: {config.autoFocus ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {/* Visual Indicator */}
        <div className="flex justify-center">
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: isFocused ? tokens.modifierScopes.GLOBAL.background : `${tokens.preset.surfaces.panel.color || '#fff'}30`,
            }}
            animate={{
              scale: isFocused ? [1, 1.2, 1] : 1,
              boxShadow: isFocused ? `0 0 10px ${tokens.modifierScopes.GLOBAL.background}` : 'none',
            }}
            transition={{
              duration: 0.5,
              repeat: isFocused ? Infinity : 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}
