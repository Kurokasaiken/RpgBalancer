import React from 'react';
import type { Point } from './types';

interface RiskVisualizationProps {
  width: number;
  height: number;
  injuryPct: number;
  deathPct: number;
  questCardAttr: string;
  heroCardPath: string;
  ballPosition?: Point | null;
}

export function RiskVisualization({
  width,
  height,
  injuryPct,
  deathPct,
  questCardAttr,
  heroCardPath,
  ballPosition,
}: RiskVisualizationProps) {
  // Assicurati che le percentuali siano valide
  const safeInjuryPct = Math.max(0, Math.min(100, injuryPct));
  const safeDeathPct = Math.max(0, Math.min(100, deathPct));
  
  // Calcola le posizioni delle linee di divisione
  const safeY = height * (1 - (safeInjuryPct + safeDeathPct) / 100);
  const dangerY = height * (1 - safeDeathPct / 100);

  return (
    <svg 
      width={width} 
      height={height} 
      className="rounded-xl border border-slate-800 bg-slate-950/60"
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        {/* Gradiente per le aree di rischio */}
        <linearGradient id="riskGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
          <stop offset={`${100 - (safeInjuryPct + safeDeathPct)}%`} stopColor="#10b981" stopOpacity="0.1" />
          <stop offset={`${100 - (safeInjuryPct + safeDeathPct)}%`} stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset={`${100 - safeDeathPct}%`} stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset={`${100 - safeDeathPct}%`} stopColor="#ef4444" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Sfondo con gradiente di rischio */}
      <polygon 
        points={questCardAttr} 
        fill="url(#riskGradient)"
        className="transition-all duration-300"
      />

      {/* Linee divisorie */}
      {safeInjuryPct > 0 && (
        <line 
          x1="0" 
          y1={safeY} 
          x2={width} 
          y2={safeY} 
          className="stroke-yellow-400/60"
          strokeWidth={0.8}
          strokeDasharray="2,2"
        />
      )}
      
      {safeDeathPct > 0 && (
        <line 
          x1="0" 
          y1={dangerY} 
          x2={width} 
          y2={dangerY} 
          className="stroke-red-400/70"
          strokeWidth={0.8}
          strokeDasharray="2,2"
        />
      )}

      {/* Etichette delle aree */}
      <text 
        x={width - 8} 
        y={safeY + 12} 
        textAnchor="end" 
        className="text-[8px] font-mono fill-yellow-300/80 pointer-events-none"
      >
        {safeInjuryPct}% Ferita
      </text>
      
      <text 
        x={width - 8} 
        y={dangerY + 12} 
        textAnchor="end" 
        className="text-[8px] font-mono fill-red-300/80 pointer-events-none"
      >
        {safeDeathPct}% Morte
      </text>

      {/* Contorno del poligono */}
      <polygon 
        points={questCardAttr} 
        className="fill-transparent stroke-cyan-300/60" 
        strokeWidth={1.2}
      />

      {/* Poligono dell'eroe */}
      <path 
        d={heroCardPath} 
        className="fill-none stroke-emerald-300" 
        strokeWidth={1.4} 
      />
      
      {/* Pallina */}
      {ballPosition && (
        <circle 
          cx={ballPosition.x} 
          cy={ballPosition.y} 
          r={5} 
          fill="#f97316" 
          stroke="#fde68a" 
          strokeWidth={1} 
          className="transition-all duration-75"
        />
      )}
    </svg>
  );
}

export default RiskVisualization;
