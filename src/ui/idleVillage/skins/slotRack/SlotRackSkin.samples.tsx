/**
 * SlotRack Skin Samples
 * 
 * Style Lab samples for SlotRackRenderer comparing Iron Bronze vs Minimal Frontier presets.
 * Provides visual reference for skin variations and demonstrates CSS custom property consumption.
 * 
 * @fileoverview
 * - Iron Bronze sample with oxidized iron tray and bronze bezel
 * - Minimal Frontier sample with clean, lightweight design
 * - Screenshot-ready components for documentation
 * - Data attributes for CSS targeting
 * 
 * @see SlotRackRenderer.tsx
 * @see slotRackSkinConfig.ts
 * @see .windsurf/plans/style-lab-wanderlust-refinement-9c241b.md
 */

import React from 'react';
import SlotRackRenderer from './SlotRackRenderer';
import { SLOT_RACK_IRON_BRONZE_CONFIG, MINIMAL_FRONTIER_SLOT_RACK_CONFIG } from '../slotRackSkinConfig';

export interface SlotRackSampleProps {
  /** Sample type for identification */
  sampleType: 'iron-bronze' | 'minimal-frontier';
  /** Number of slots to display */
  slotCount?: number;
  /** Rack type variation */
  rackType?: 'A' | 'B' | 'detail';
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * SlotRack Sample Component
 * 
 * Renders a slot rack sample with specified skin configuration for Style Lab
 * comparison and documentation purposes.
 */
const SlotRackSample: React.FC<SlotRackSampleProps> = ({
  sampleType,
  slotCount = 6,
  rackType = 'A',
  className = '',
  'data-testid': testId = `slot-rack-sample-${sampleType}`,
}) => {
  // Get skin configuration based on sample type
  const skinConfig = React.useMemo(() => {
    switch (sampleType) {
      case 'iron-bronze':
        return SLOT_RACK_IRON_BRONZE_CONFIG;
      case 'minimal-frontier':
        return MINIMAL_FRONTIER_SLOT_RACK_CONFIG;
      default:
        return MINIMAL_FRONTIER_SLOT_RACK_CONFIG;
    }
  }, [sampleType]);

  return (
    <div
      className={`slot-rack-sample ${className}`}
      data-testid={testId}
      data-sample-type={sampleType}
      data-rack-type={rackType}
      data-slot-count={slotCount}
      style={{
        // Apply CSS custom properties from skin config
        ...(skinConfig.cssVars || {}),
        // Sample container styling
        padding: '20px',
        background: '#1a1a1a',
        borderRadius: '8px',
        display: 'inline-block',
        margin: '10px',
      }}
    >
      {/* Sample label */}
      <div
        className="slot-rack-sample-label"
        style={{
          color: '#ffffff',
          fontSize: '12px',
          marginBottom: '10px',
          textAlign: 'center',
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        {sampleType === 'iron-bronze' ? 'Iron Bronze' : 'Minimal Frontier'}
        {' • '}
        {rackType.toUpperCase()} Rack • {slotCount} Slots
      </div>

      {/* Slot rack renderer */}
      <SlotRackRenderer
        skinConfig={skinConfig}
        rackType={rackType}
        slotCount={slotCount}
        className={`slot-rack-renderer-${sampleType}`}
      />

      {/* Sample metadata */}
      <div
        className="slot-rack-sample-metadata"
        style={{
          color: '#888888',
          fontSize: '10px',
          marginTop: '10px',
          textAlign: 'center',
          fontFamily: 'monospace',
          lineHeight: '1.4',
        }}
      >
        <div>Skin ID: {skinConfig.id}</div>
        <div>Version: {skinConfig.version}</div>
        <div>Supported: {skinConfig.supportedPresets.join(', ')}</div>
        {skinConfig.audioProfile && (
          <div>Audio: {skinConfig.audioProfile}</div>
        )}
      </div>
    </div>
  );
};

/**
 * SlotRack Sample Gallery
 * 
 * Renders multiple slot rack samples for comparison and documentation.
 * Includes all rack types and slot count variations.
 */
export const SlotRackSampleGallery: React.FC = () => {
  return (
    <div
      className="slot-rack-sample-gallery"
      style={{
        padding: '40px',
        background: '#0f0f0f',
        minHeight: '100vh',
      }}
    >
      {/* Gallery header */}
      <div
        className="gallery-header"
        style={{
          color: '#ffffff',
          textAlign: 'center',
          marginBottom: '40px',
        }}
      >
        <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>
          Slot Rack Skin Samples
        </h1>
        <p style={{ fontSize: '14px', color: '#888888' }}>
          Iron Bronze vs Minimal Frontier • All Rack Types • Various Slot Counts
        </p>
      </div>

      {/* Sample grid */}
      <div
        className="sample-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '20px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Iron Bronze samples */}
        <div className="sample-section">
          <h2
            style={{
              color: '#ffd84a',
              fontSize: '18px',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            Iron Bronze Preset
          </h2>
          
          {/* Rack A - 6 slots */}
          <SlotRackSample
            sampleType="iron-bronze"
            rackType="A"
            slotCount={6}
          />
          
          {/* Rack B - 4 slots */}
          <SlotRackSample
            sampleType="iron-bronze"
            rackType="B"
            slotCount={4}
          />
          
          {/* Detail - 3 slots */}
          <SlotRackSample
            sampleType="iron-bronze"
            rackType="detail"
            slotCount={3}
          />
        </div>

        {/* Minimal Frontier samples */}
        <div className="sample-section">
          <h2
            style={{
              color: '#94a3b8',
              fontSize: '18px',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            Minimal Frontier Preset
          </h2>
          
          {/* Rack A - 6 slots */}
          <SlotRackSample
            sampleType="minimal-frontier"
            rackType="A"
            slotCount={6}
          />
          
          {/* Rack B - 4 slots */}
          <SlotRackSample
            sampleType="minimal-frontier"
            rackType="B"
            slotCount={4}
          />
          
          {/* Detail - 3 slots */}
          <SlotRackSample
            sampleType="minimal-frontier"
            rackType="detail"
            slotCount={3}
          />
        </div>
      </div>

      {/* CSS Variables reference */}
      <div
        className="css-variables-reference"
        style={{
          marginTop: '60px',
          padding: '20px',
          background: '#1a1a1a',
          borderRadius: '8px',
          color: '#ffffff',
        }}
      >
        <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>
          CSS Custom Properties Reference
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '10px',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        >
          <div>--slot-rack-bg-gradient</div>
          <div>--slot-rack-halo-color</div>
          <div>--slot-rack-tray-ridge-color</div>
          <div>--slot-rack-gap</div>
          <div>--slot-rack-padding</div>
          <div>--slot-rack-border-radius</div>
          <div>--slot-rack-border</div>
          <div>--slot-rack-slot-bg</div>
          <div>--slot-rack-slot-border-*</div>
          <div>--slot-rack-slot-text</div>
        </div>
      </div>
    </div>
  );
};

export default SlotRackSample;
