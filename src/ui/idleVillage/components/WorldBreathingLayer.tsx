import React, { useId, useEffect, useRef } from 'react';
import { useBreather } from '../hooks/useBreather';

export interface WorldBreathingLayerProps {
  id: string;
  src: string;
  imageFit?: 'fill' | 'cover' | 'contain' | 'none';
  magnitudeScreenPx?: number;      // e.g., 1.5 (screen px)
  frequencyHz?: number;             // e.g., 0.06 (Hz)
  phaseRad?: number;                // e.g., 0 (radians)
  enabled?: boolean;
  displacementField?: string;       // path to displacement PNG
  style?: React.CSSProperties;
  alt?: string;
  isInteracting?: boolean;          // S3: pause/reduce during drag/zoom
}

/**
 * WorldBreathingLayer
 *
 * Wraps an image layer with SVG feDisplacementMap filter for subtle breathing animation.
 * The layer is wrapped in overflow:hidden to prevent edge bleed.
 * Displacement is applied via filter; if enabled=false, filter is bypassed.
 *
 * Props:
 *   - magnitudeScreenPx: displacement amplitude in screen pixels (~1–1.5 for MVP)
 *   - frequencyHz: oscillation frequency in Hz (~0.06 = 16.7s per cycle)
 *   - phaseRad: phase offset in radians for staggered animation across layers
 *   - enabled: toggle breathing on/off (instant fallback to static)
 *   - displacementField: PNG path for the displacement map (R/G channels = X/Y shift)
 */
export const WorldBreathingLayer: React.FC<WorldBreathingLayerProps> = ({
  id,
  src,
  imageFit = 'fill',
  magnitudeScreenPx = 1.5,
  frequencyHz = 0.06,
  phaseRad = 0,
  enabled = true,
  displacementField = '/assets/ui/glass_displacement.png',
  style,
  alt = `World layer ${id}`,
  isInteracting = false,
}) => {
  const { offset, pause } = useBreather(frequencyHz, magnitudeScreenPx, phaseRad);
  const filterId = useId().replace(/:/g, '');
  const uniqueFilterId = `breathing-${id}-${filterId}`;
  const displacementMapRef = useRef<SVGFEDisplacementMapElement>(null);

  // S3: Wire pause when interacting (dragging/zooming)
  useEffect(() => {
    pause(isInteracting);
  }, [isInteracting, pause]);

  // Breathing is implemented via opacity pulsing, not filter scale modulation.
  // The feDisplacementMap applies a subtle static deformation; opacity creates the breathing effect.

  // Map offset (-magnitude to +magnitude) to opacity (0.7 to 1.0)
  // When offset is at peak (±magnitude), opacity is 1.0
  // When offset is at trough (0), opacity is 0.7
  const breathingOpacity = 0.85 + 0.15 * Math.cos(Math.atan2(offset, magnitudeScreenPx));

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    opacity: breathingOpacity,
    ...style,
  };

  const imgStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: imageFit,
    filter: enabled ? `url(#${uniqueFilterId})` : 'none',
    // Small offset applied to container to follow oscillation (optional visual enhancement)
    // Kept minimal to avoid edge exposure
  };

  return (
    <div style={containerStyle}>
      {/* SVG filter definition (zero-dimension, doesn't occupy layout) */}
      <svg
        aria-hidden="true"
        focusable="false"
        style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
      >
        <defs>
          <filter id={uniqueFilterId} colorInterpolationFilters="sRGB" x="-10%" y="-10%" width="120%" height="120%">
            <feImage href={displacementField} result="displacement" preserveAspectRatio="xMidYMid slice" />
            <feDisplacementMap
              ref={displacementMapRef}
              in="SourceGraphic"
              in2="displacement"
              scale={magnitudeScreenPx}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Image layer with filter applied */}
      <img
        src={src}
        alt={alt}
        style={imgStyle}
        role="presentation"
      />
    </div>
  );
};

export default WorldBreathingLayer;
