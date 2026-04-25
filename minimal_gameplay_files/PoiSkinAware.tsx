/**
 * POI Skin-Aware Component
 * 
 * POI component that integrates with the temporary skin system
 * and applies POI-specific styling from poiAmberSkinConfig.
 */

import React, { memo, useMemo } from 'react';
import { getPoiAmberSkinConfig } from '../skins/poi/poiAmberSkinConfig';
import { getTemporarySkinConfig } from '../skins/temporary/temporarySkinRegistry';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { StyleLabPillar } from '@/ui/styleLab/config/demoConfig';

export interface PoiSkinAwareProps {
  /** POI identifier */
  poiId: string;
  /** POI name/title */
  name: string;
  /** POI type/category */
  type: string;
  /** POI status */
  status: 'idle' | 'active' | 'completed' | 'blocked';
  /** Progress percentage (0-1) */
  progress?: number;
  /** Whether POI is interactive */
  isInteractive?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Optional pillar override */
  pillar?: StyleLabPillar;
}

/**
 * POI component with temporary skin system integration
 */
export const PoiSkinAware = memo(({
  poiId,
  name,
  type,
  status,
  progress = 0,
  isInteractive = true,
  onClick,
  className = '',
  'data-testid': testId,
  pillar,
}: PoiSkinAwareProps) => {
  // Get the POI amber skin configuration
  const skinConfig = useMemo(() => getPoiAmberSkinConfig(), []);
  
  // Track component events
  React.useEffect(() => {
    trackTelemetryEvent('poi_rendered', {
      poiId,
      name,
      type,
      status,
      progress,
      isInteractive,
      skinId: skinConfig.id,
    });
  }, [poiId, name, type, status, progress, isInteractive, skinConfig.id]);

  // Determine visual state based on status
  const statusClasses = useMemo(() => {
    switch (status) {
      case 'active':
        return 'poi-active';
      case 'completed':
        return 'poi-completed';
      case 'blocked':
        return 'poi-blocked';
      default:
        return 'poi-idle';
    }
  }, [status]);

  const handleClick = () => {
    if (isInteractive && onClick) {
      trackTelemetryEvent('poi_clicked', {
        poiId,
        name,
        status,
        skinId: skinConfig.id,
      });
      onClick();
    }
  };

  return (
    <div
      data-testid={testId || `poi-${poiId}`}
      data-poi-id={poiId}
      data-poi-type={type}
      data-poi-status={status}
      data-poi-progress={progress}
      data-poi-interactive={isInteractive ? 'true' : 'false'}
      role={isInteractive ? 'button' : 'presentation'}
      tabIndex={isInteractive ? 0 : -1}
      aria-label={`${name} - ${type} - ${status}`}
      className={[
        'poi-amber-skin',
        statusClasses,
        isInteractive ? 'cursor-pointer hover:scale-105' : 'cursor-default',
        className,
      ].filter(Boolean).join(' ')}
      style={{
        // Add progress indicator if applicable
        ...(progress > 0 && {
          '--poi-progress': `${progress * 100}%`,
        } as React.CSSProperties),
      }}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: skinConfig.htmlTemplate }}
    />
  );
});

PoiSkinAware.displayName = 'PoiSkinAware';

export default PoiSkinAware;
