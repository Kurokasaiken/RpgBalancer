import { useMemo, useState, useCallback } from 'react';
import type { StressTestArchetype } from '@/balancing/stressTesting/types';
import { useBalancerConfig } from '@/balancing/hooks/useBalancerConfig';

/**
 * Props for StatProfileRadar component
 */
export interface StatProfileRadarProps {
  profiles: StressTestArchetype[];
  baselineProfile?: StressTestArchetype;
  className?: string;
  interactive?: boolean;
  exportable?: boolean;
}

/**
 * Configuration for radar chart visualization
 */
const RADAR_CONFIG = {
  size: 400,
  levels: 5,
  angleStep: (Math.PI * 2) / 6, // Default for 6 stats, will be recalculated
  colors: {
    baseline: 'rgba(59, 130, 246, 0.8)',
    baselineBorder: 'rgb(59, 130, 246)',
    primary: 'rgba(236, 72, 153, 0.8)',
    primaryBorder: 'rgb(236, 72, 153)',
    secondary: 'rgba(34, 197, 94, 0.8)',
    secondaryBorder: 'rgb(34, 197, 94)',
    tertiary: 'rgba(251, 146, 60, 0.8)',
    tertiaryBorder: 'rgb(251, 146, 60)',
    grid: 'rgba(148, 163, 184, 0.2)',
    text: 'rgb(203, 213, 225)',
    hover: 'rgba(251, 191, 36, 0.3)',
  }
} as const;

/**
 * Enhanced StatProfileRadar component with SVG radar chart and interactive features
 */
export function StatProfileRadar({ 
  profiles, 
  baselineProfile, 
  className = '',
  interactive = true,
  exportable = true 
}: StatProfileRadarProps) {
  const { config } = useBalancerConfig();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  const statConfig = config?.stats ?? null;

  const radarData = useMemo(() => {
    if (!statConfig || profiles.length === 0) {
      return null;
    }

    const statIds = Object.keys(statConfig)
      .filter(id => !statConfig[id].isDerived && !statConfig[id].isHidden)
      .slice(0, 8); // Limit to 8 stats for readability

    const maxValue = Math.max(
      ...statIds.map(statId => statConfig[statId]?.max || 100),
      ...profiles.flatMap(profile => statIds.map(statId => profile.stats[statId] || 0))
    );

    const allProfiles = baselineProfile ? [baselineProfile, ...profiles] : profiles;

    return {
      statIds,
      maxValue,
      angleStep: (Math.PI * 2) / statIds.length,
      profiles: allProfiles.map((profile, index) => ({
        name: profile.name,
        id: profile.id,
        color: index === 0 && baselineProfile ? RADAR_CONFIG.colors.baseline : 
              index === 1 ? RADAR_CONFIG.colors.primary :
              index === 2 ? RADAR_CONFIG.colors.secondary :
              RADAR_CONFIG.colors.tertiary,
        borderColor: index === 0 && baselineProfile ? RADAR_CONFIG.colors.baselineBorder :
                   index === 1 ? RADAR_CONFIG.colors.primaryBorder :
                   index === 2 ? RADAR_CONFIG.colors.secondaryBorder :
                   RADAR_CONFIG.colors.tertiaryBorder,
        values: statIds.map(statId => ({
          statId,
          label: statConfig[statId]?.label || statId,
          value: profile.stats[statId] || 0,
          normalized: ((profile.stats[statId] || 0) / maxValue) * 100,
        })),
      })),
    };
  }, [statConfig, profiles, baselineProfile]);

  const generateRadarPoints = useCallback((values: { normalized: number }[], angleStep: number, centerX: number, centerY: number, radius: number) => {
    return values.map((value, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const distance = (value.normalized / 100) * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      return `${x},${y}`;
    }).join(' ');
  }, []);

  const exportRadarData = useCallback(() => {
    if (!radarData) return '{}';
    
    const exportData = {
      metadata: {
        timestamp: Date.now(),
        stats: radarData.statIds,
        maxValue: radarData.maxValue,
        config: RADAR_CONFIG,
      },
      profiles: radarData.profiles.map(profile => ({
        name: profile.name,
        id: profile.id,
        values: profile.values.map(v => ({
          stat: v.statId,
          label: v.label,
          value: v.value,
          normalized: v.normalized,
        })),
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }, [radarData]);

  if (!radarData) {
    return (
      <div className={`observatory-card ${className}`}>
        <h3 className="text-xl font-semibold text-indigo-200 mb-4">Stat Profile Radar</h3>
        <p className="text-slate-400 text-sm">No data available for radar chart.</p>
      </div>
    );
  }

  const centerX = RADAR_CONFIG.size / 2;
  const centerY = RADAR_CONFIG.size / 2;
  const radius = Math.min(centerX, centerY) - 40;

  return (
    <div className={`observatory-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-indigo-200 mb-2">Stat Profile Radar</h3>
          <p className="text-sm text-slate-400">
            Comparative radar chart for stat profiles
          </p>
        </div>
        
        {exportable && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className="px-3 py-1 text-xs rounded-full border border-indigo-500/60 text-indigo-200 hover:bg-indigo-500/10 transition-colors"
            >
              {showGrid ? 'Hide' : 'Show'} Grid
            </button>
            <button
              onClick={() => setShowLabels(!showLabels)}
              className="px-3 py-1 text-xs rounded-full border border-indigo-500/60 text-indigo-200 hover:bg-indigo-500/10 transition-colors"
            >
              {showLabels ? 'Hide' : 'Show'} Labels
            </button>
            <button
              onClick={() => {
                const data = exportRadarData();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'stat-radar.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1 text-xs rounded-full border border-cyan-500/60 text-cyan-200 hover:bg-cyan-500/10 transition-colors"
            >
              Export
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Radar Chart */}
        <div className="flex-1 flex justify-center">
          <svg 
            width={RADAR_CONFIG.size} 
            height={RADAR_CONFIG.size}
            className="border border-slate-700 rounded-lg bg-slate-900/50"
          >
            {/* Grid */}
            {showGrid && (
              <g>
                {Array.from({ length: RADAR_CONFIG.levels }, (_, level) => {
                  const levelRadius = (radius / RADAR_CONFIG.levels) * (level + 1);
                  const points = radarData.statIds.map((_, index) => {
                    const angle = radarData.angleStep * index - Math.PI / 2;
                    const x = centerX + Math.cos(angle) * levelRadius;
                    const y = centerY + Math.sin(angle) * levelRadius;
                    return `${x},${y}`;
                  }).join(' ');
                  
                  return (
                    <polygon
                      key={level}
                      points={points}
                      fill="none"
                      stroke={RADAR_CONFIG.colors.grid}
                      strokeWidth="1"
                    />
                  );
                })}
                
                {/* Axes */}
                {radarData.statIds.map((_, index) => {
                  const angle = radarData.angleStep * index - Math.PI / 2;
                  const x = centerX + Math.cos(angle) * radius;
                  const y = centerY + Math.sin(angle) * radius;
                  
                  return (
                    <line
                      key={index}
                      x1={centerX}
                      y1={centerY}
                      x2={x}
                      y2={y}
                      stroke={RADAR_CONFIG.colors.grid}
                      strokeWidth="1"
                    />
                  );
                })}
              </g>
            )}

            {/* Data Polygons */}
            {radarData.profiles.map((profile) => {
              const isHovered = selectedProfile === profile.id;
              const points = generateRadarPoints(profile.values, radarData.angleStep, centerX, centerY, radius);
              
              return (
                <g key={profile.id}>
                  <polygon
                    points={points}
                    fill={profile.color}
                    fillOpacity={isHovered ? 0.6 : 0.3}
                    stroke={profile.borderColor}
                    strokeWidth={isHovered ? 3 : 2}
                    className={interactive ? "cursor-pointer transition-all" : ""}
                    onMouseEnter={() => interactive && setSelectedProfile(profile.id)}
                    onMouseLeave={() => interactive && setSelectedProfile(null)}
                  />
                </g>
              );
            })}

            {/* Labels */}
            {showLabels && (
              <g>
                {radarData.statIds.map((statId, index) => {
                  const angle = radarData.angleStep * index - Math.PI / 2;
                  const labelRadius = radius + 20;
                  const x = centerX + Math.cos(angle) * labelRadius;
                  const y = centerY + Math.sin(angle) * labelRadius;
                  const isHovered = hoveredStat === statId;
                  
                  return (
                    <text
                      key={statId}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isHovered ? 'rgb(251, 191, 36)' : RADAR_CONFIG.colors.text}
                      fontSize="12"
                      fontWeight={isHovered ? "bold" : "normal"}
                      className={interactive ? "cursor-pointer" : ""}
                      onMouseEnter={() => interactive && setHoveredStat(statId)}
                      onMouseLeave={() => interactive && setHoveredStat(null)}
                    >
                      {config.stats[statId]?.label || statId}
                    </text>
                  );
                })}
              </g>
            )}

            {/* Center point */}
            <circle
              cx={centerX}
              cy={centerY}
              r="3"
              fill={RADAR_CONFIG.colors.text}
            />
          </svg>
        </div>

        {/* Legend and Details */}
        <div className="lg:w-80">
          {/* Legend */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-indigo-200 mb-3">Profiles</h4>
            <div className="space-y-2">
              {radarData.profiles.map((profile) => (
                <div
                  key={profile.id}
                  className={`flex items-center gap-3 p-2 rounded border transition-all cursor-pointer ${
                    selectedProfile === profile.id 
                      ? 'border-cyan-500/40 bg-cyan-500/10' 
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  onMouseEnter={() => interactive && setSelectedProfile(profile.id)}
                  onMouseLeave={() => interactive && setSelectedProfile(null)}
                >
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ 
                      backgroundColor: profile.color,
                      border: `2px solid ${profile.borderColor}`
                    }}
                  ></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-indigo-200">{profile.name}</div>
                    <div className="text-xs text-slate-400">
                      {profile.values.length} stats • Max: {Math.max(...profile.values.map(v => v.value)).toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Profile Details */}
          {selectedProfile && (
            <div className="p-4 bg-slate-800/50 rounded-lg border border-cyan-500/40">
              <h4 className="text-sm font-semibold text-cyan-200 mb-3">
                {radarData.profiles.find(p => p.id === selectedProfile)?.name}
              </h4>
              <div className="space-y-2 text-sm">
                {radarData.profiles
                  .find(p => p.id === selectedProfile)
                  ?.values.map(stat => (
                    <div key={stat.statId} className="flex justify-between">
                      <span className="text-slate-300">{stat.label}</span>
                      <span className="font-mono text-indigo-200">{stat.value.toFixed(1)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Hovered Stat Details */}
          {hoveredStat && (
            <div className="p-3 bg-slate-800/30 rounded-lg border border-amber-500/40">
              <h4 className="text-sm font-semibold text-amber-200 mb-2">
                {config.stats[hoveredStat]?.label || hoveredStat}
              </h4>
              <div className="space-y-1 text-xs">
                {radarData.profiles.map(profile => {
                  const statValue = profile.values.find(v => v.statId === hoveredStat);
                  return (
                    <div key={profile.id} className="flex justify-between">
                      <span className="text-slate-400">{profile.name}</span>
                      <span className="font-mono text-indigo-200">
                        {statValue?.value.toFixed(1) || '0'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
