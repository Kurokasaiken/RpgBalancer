/**
 * Custom Cursor Layer Component for Physics Lab FX
 *
 * Renders the cursor layer with trail effects and configurable presets.
 */

import { useCustomCursorLayer } from '../hooks/useCustomCursorLayer';

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
 * Custom Cursor Layer Component
 */
export const CustomCursorLayer = (config: CustomCursorConfig) => {
  const { cursorRef, trailElementsRef } = useCustomCursorLayer(config);

  /**
   * Render trail elements
   */
  const renderTrailElements = () => {
    return Array.from({ length: config.trailLength }, (_, index) => (
      <div
        key={index}
        ref={(el) => {
          if (el) trailElementsRef.current[index] = el;
        }}
        className="cursor-trail-element"
        style={{
          position: 'fixed',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: config.preset === 'gauntlet' ? '#ff6b6b' : 
                     config.preset === 'arcaneWand' ? '#4ecdc4' : '#45b7d1',
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'opacity 0.3s ease-out',
        }}
      />
    ));
  };

  return (
    <>
      <div
        ref={cursorRef}
        className="custom-cursor"
        style={{
          position: 'fixed',
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: config.preset === 'gauntlet' ? '#ff6b6b' : 
                     config.preset === 'arcaneWand' ? '#4ecdc4' : '#45b7d1',
          pointerEvents: 'none',
          zIndex: 10000,
          transition: 'transform 0.1s ease-out',
        }}
      />
      {renderTrailElements()}
    </>
  );
};
