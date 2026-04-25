import React from 'react';
import { normalizeRiskPercentages } from '@/analytics/telemetry/telemetryProvider';

export interface QuestPolygonProps {
  /** Normalized injury percentage (0-100) */
  injuryPercentage: number;
  /** Normalized death percentage (0-100) */
  deathPercentage: number;
  className?: string;
}

/**
 * Quest polygon component with vertical risk stripes (yellow for injury, red for death).
 * Uses config-first data and Gilded Observatory styling.
 * Receives normalized percentages via props.
 */
export const QuestPolygon: React.FC<QuestPolygonProps> = ({ 
  injuryPercentage, 
  deathPercentage, 
  className 
}) => {
  // Normalize inputs as additional safety
  const { injuryPercentage: normalizedInjury, deathPercentage: normalizedDeath } = normalizeRiskPercentages({
    injury: injuryPercentage,
    death: deathPercentage,
  });

  return (
    <div
      className={`relative w-32 h-32 ${className}`}
      data-testid="quest-polygon"
    >
      {/* Polygon shape using clip-path */}
      <div
        className="w-full h-full bg-gradient-to-br from-amber-400/20 via-transparent to-cyan-400/15 border-2 border-amber-300/60 clip-path-polygon"
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }}
      />

      {/* Injury band (yellow) */}
      <div
        className="absolute bottom-0 left-0 w-1/2 bg-warning/80 transition-all duration-300"
        style={{
          height: `${normalizedInjury}%`,
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }}
        data-testid="quest-risk-injury"
        data-percentage={normalizedInjury}
      />

      {/* Death band (red) */}
      <div
        className="absolute bottom-0 right-0 w-1/2 bg-error/80 transition-all duration-300"
        style={{
          height: `${normalizedDeath}%`,
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }}
        data-testid="quest-risk-death-band"
        data-percentage={normalizedDeath}
      />
    </div>
  );
};

export default QuestPolygon;
