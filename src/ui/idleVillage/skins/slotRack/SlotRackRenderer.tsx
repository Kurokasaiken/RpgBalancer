/**
 * SlotRack Renderer Component
 * 
 * React SVG renderer for slot rack visual elements that consumes CSS custom properties
 * from SlotRackSkinConfig and provides layered rendering for tray, halo, rivet, and medal mount.
 * 
 * @fileoverview
 * - Renders slot rack background, tray, and decorative elements
 * - Consumes CSS custom properties from skin config
 * - Provides data attributes for CSS targeting
 * - Integrates with SkinSlot for dynamic skin binding
 * - Supports Iron Bronze and Minimal Frontier presets
 * 
 * @see SlotRackSkinConfig.ts for CSS custom properties
 * @see ResidentSlotRackSkin.tsx for wrapper integration
 * @see .windsurf/plans/style-lab-wanderlust-refinement-9c241b.md
 */

import React, { memo, useMemo } from 'react';
import type { SlotRackSkinConfig } from '../slotRackSkinConfig';

export interface SlotRackRendererProps {
  /** Skin configuration for styling */
  skinConfig?: SlotRackSkinConfig;
  /** Rack type for layout variations */
  rackType?: 'A' | 'B' | 'detail';
  /** Number of slots in the rack */
  slotCount?: number;
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * SlotRack Renderer Component
 * 
 * Renders the slot rack visual elements using SVG and CSS custom properties.
 * Provides layered rendering for:
 * - Tray background with gradient
 * - Halo effects for slot highlighting
 * - Rivet decorations for industrial aesthetic
 * - Medal mount areas for slot placement
 */
const SlotRackRenderer = memo<SlotRackRendererProps>(({
  skinConfig,
  rackType = 'A',
  slotCount = 6,
  className = '',
  'data-testid': testId = 'slot-rack-renderer',
}) => {
  // TODO: Integrate with SkinSlot when useSkinSlot is available
  // const { binding } = useSkinSlot({
  //   componentId: `slot-rack-renderer-${rackType}`,
  //   componentType: 'SlotRackRenderer',
  //   enabled: !!skinConfig,
  //   priority: 'normal',
  // });

  // Calculate layout based on rack type and slot count
  const layout = useMemo(() => {
    const baseWidth = 400;
    const baseHeight = 120;
    const slotSize = 64;
    const gap = 22;
    
    // Calculate rack dimensions based on slot count and type
    const totalWidth = slotCount * slotSize + (slotCount - 1) * gap + 80; // padding
    const totalHeight = baseHeight + (rackType === 'detail' ? 40 : 0);
    
    return {
      width: totalWidth,
      height: totalHeight,
      slotSize,
      gap,
      padding: 40,
    };
  }, [rackType, slotCount]);

  // Generate slot positions
  const slotPositions = useMemo(() => {
    const positions = [];
    const startX = layout.padding;
    const centerY = layout.height / 2;
    
    for (let i = 0; i < slotCount; i++) {
      const x = startX + i * (layout.slotSize + layout.gap);
      positions.push({ x, y: centerY - layout.slotSize / 2 });
    }
    
    return positions;
  }, [layout, slotCount]);

  // Generate rivet positions
  const rivetPositions = useMemo(() => {
    const rivets = [];
    const rivetRadius = 4;
    const margin = 16;
    
    // Corner rivets
    rivets.push(
      { x: margin, y: margin },
      { x: layout.width - margin, y: margin },
      { x: margin, y: layout.height - margin },
      { x: layout.width - margin, y: layout.height - margin }
    );
    
    // Side rivets for larger racks
    if (slotCount > 4) {
      const sideY = layout.height / 2;
      rivets.push(
        { x: margin, y: sideY },
        { x: layout.width - margin, y: sideY }
      );
    }
    
    return rivets;
  }, [layout, slotCount]);

  return (
    <div
      className={`slot-rack-renderer ${className}`}
      data-testid={testId}
      data-rack-type={rackType}
      data-slot-count={slotCount}
      data-skin-binding={undefined} // TODO: Add binding when SkinSlot is integrated
      style={{
        width: `${layout.width}px`,
        height: `${layout.height}px`,
        position: 'relative',
        // Apply CSS custom properties from skin config
        ...(skinConfig?.cssVars || {}),
      }}
    >
      {/* SVG Renderer */}
      <svg
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="slot-rack-svg"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        {/* Definitions for gradients and filters */}
        <defs>
          {/* Background gradient */}
          <linearGradient
            id="rack-bg-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor="var(--slot-rack-bg-gradient-start, #131518)" />
            <stop offset="45%" stopColor="var(--slot-rack-bg-gradient-mid, #0e0f10)" />
            <stop offset="78%" stopColor="var(--slot-rack-bg-gradient-end, #0b0c0e)" />
            <stop offset="100%" stopColor="var(--slot-rack-bg-gradient-final, #0f1012)" />
          </linearGradient>
          
          {/* Halo gradient for slot highlighting */}
          <radialGradient
            id="slot-halo-gradient"
            cx="50%"
            cy="50%"
            r="50%"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor="var(--slot-rack-halo-color, rgba(185, 108, 15, 0.55))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--slot-rack-halo-color, rgba(185, 108, 15, 0.55))" stopOpacity="0" />
          </radialGradient>
          
          {/* Tray ridge gradient */}
          <linearGradient
            id="tray-ridge-gradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor="var(--slot-rack-tray-ridge-color, #3a2008)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="var(--slot-rack-tray-ridge-color, #3a2008)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--slot-rack-tray-ridge-color, #3a2008)" stopOpacity="0.6" />
          </linearGradient>
          
          {/* Drop shadow filter */}
          <filter
            id="rack-drop-shadow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
            <feOffset dx="0" dy="4" result="offsetblur" />
            <feFlood floodColor="#000000" floodOpacity="0.3" />
            <feComposite in2="offsetblur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Main tray background */}
        <rect
          x="0"
          y="0"
          width={layout.width}
          height={layout.height}
          rx="var(--slot-rack-border-radius, 28px)"
          ry="var(--slot-rack-border-radius, 28px)"
          fill="url(#rack-bg-gradient)"
          stroke="var(--slot-rack-border, #3a2008)"
          strokeWidth="2"
          filter="url(#rack-drop-shadow)"
          className="rack-tray"
        />
        
        {/* Tray ridge for depth */}
        <rect
          x="4"
          y="4"
          width={layout.width - 8}
          height={layout.height - 8}
          rx="var(--slot-rack-border-radius, 24px)"
          ry="var(--slot-rack-border-radius, 24px)"
          fill="none"
          stroke="url(#tray-ridge-gradient)"
          strokeWidth="1"
          opacity="0.6"
          className="rack-ridge"
        />
        
        {/* Slot halo areas */}
        {slotPositions.map((pos, index) => (
          <g key={`slot-halo-${index}`} className="slot-halo-group">
            <circle
              cx={pos.x + layout.slotSize / 2}
              cy={pos.y + layout.slotSize / 2}
              r={layout.slotSize / 2 + 8}
              fill="url(#slot-halo-gradient)"
              opacity="0"
              className="slot-halo"
            />
          </g>
        ))}
        
        {/* Medal mount areas */}
        {slotPositions.map((pos, index) => (
          <g key={`slot-mount-${index}`} className="slot-mount-group">
            <circle
              cx={pos.x + layout.slotSize / 2}
              cy={pos.y + layout.slotSize / 2}
              r={layout.slotSize / 2 - 4}
              fill="none"
              stroke="var(--slot-rack-border, #3a2008)"
              strokeWidth="1"
              opacity="0.3"
              className="slot-mount"
            />
          </g>
        ))}
        
        {/* Rivets */}
        {rivetPositions.map((pos, index) => (
          <g key={`rivet-${index}`} className="rivet-group">
            <circle
              cx={pos.x}
              cy={pos.y}
              r="4"
              fill="var(--slot-rack-tray-ridge-color, #3a2008)"
              stroke="rgba(0, 0, 0, 0.3)"
              strokeWidth="0.5"
              className="rivet"
            />
            <circle
              cx={pos.x - 1}
              cy={pos.y - 1}
              r="1"
              fill="rgba(255, 255, 255, 0.2)"
              className="rivet-highlight"
            />
          </g>
        ))}
      </svg>
      
      {/* Slot content overlay */}
      <div
        className="slot-content-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {slotPositions.map((pos, index) => (
          <div
            key={`slot-content-${index}`}
            className="slot-content-area"
            style={{
              position: 'absolute',
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              width: `${layout.slotSize}px`,
              height: `${layout.slotSize}px`,
              pointerEvents: 'auto',
            }}
            data-slot-index={index}
          />
        ))}
      </div>
    </div>
  );
});

SlotRackRenderer.displayName = 'SlotRackRenderer';

export default SlotRackRenderer;
