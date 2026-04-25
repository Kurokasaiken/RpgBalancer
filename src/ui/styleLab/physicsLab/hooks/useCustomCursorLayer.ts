/**
 * Custom Cursor Layer Hook for Physics Lab FX
 *
 * Provides configurable cursor presets (gauntlet, arcane wand, sword) with
 * trail effects, glow intensity, and easing functions.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { CursorPresetSchema } from '../config/cursorPresets';

/**
 * Custom cursor configuration interface
 */
export interface CustomCursorConfig {
  preset: 'gauntlet' | 'arcaneWand' | 'sword';
  trailLength: number;
  glowIntensity: number;
  easing: 'linear' | 'ease-out' | 'ease-in-out' | 'bounce';
}

/**
 * Hook for managing custom cursor layer
 */
export const useCustomCursorLayer = (config: CustomCursorConfig) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailElementsRef = useRef<HTMLDivElement[]>([]);
  const animationRef = useRef<number>();
  const positionRef = useRef({ x: 0, y: 0 });
  const trailPositionsRef = useRef<Array<{ x: number; y: number; timestamp: number }>>([]);

  /**
   * Update cursor position
   */
  const updateCursorPosition = useCallback((x: number, y: number) => {
    positionRef.current = { x, y };
    
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }
    
    // Update trail
    const now = Date.now();
    trailPositionsRef.current.push({ x, y, timestamp: now });
    
    // Keep only recent positions
    trailPositionsRef.current = trailPositionsRef.current.filter(
      pos => now - pos.timestamp < 1000
    );
    
    // Update trail elements
    trailElementsRef.current.forEach((element, index) => {
      const trailPos = trailPositionsRef.current[index];
      if (trailPos) {
        element.style.transform = `translate(${trailPos.x}px, ${trailPos.y}px)`;
        element.style.opacity = String((1 - index / config.trailLength) * config.glowIntensity);
      }
    });
  }, [config.trailLength, config.glowIntensity]);

  /**
   * Start cursor tracking
   */
  const startTracking = useCallback(() => {
    const handleMouseMove = (e: MouseEvent) => {
      updateCursorPosition(e.clientX, e.clientY);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [updateCursorPosition]);

  /**
   * Apply cursor preset
   */
  const applyPreset = useCallback((preset: CursorPresetSchema) => {
    if (cursorRef.current) {
      cursorRef.current.style.cursor = preset.cursor;
    }
  }, []);

  useEffect(() => {
    const cleanup = startTracking();
    return cleanup;
  }, [startTracking]);

  return {
    cursorRef,
    trailElementsRef,
    positionRef,
    updateCursorPosition,
    applyPreset,
  };
};
