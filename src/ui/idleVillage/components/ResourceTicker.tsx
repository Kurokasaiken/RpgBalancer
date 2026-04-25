/**
 * Resource Ticker Component
 *
 * Shows animated resource deltas with odometer-style animations and config-first tooltips.
 * Displays changes in gold, food, and other resources with smooth transitions.
 * Uses Framer Motion for smooth, performant animations without React update loops.
 */

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import type { MinimalGameplayResourceTickerConfig } from '@/balancing/config/idleVillage/minimalGameplayConfig';

interface ResourceDelta {
  gold?: number;
  food?: number;
  day?: number;
  fatigue?: number;
}

interface ResourceTickerProps {
  resources: {
    gold: number;
    food: number;
    day: number;
    fatigue: number;
  };
  deltas: ResourceDelta;
  tickerConfig: MinimalGameplayResourceTickerConfig;
  tooltips?: {
    gold?: string;
    food?: string;
    day?: string;
    fatigue?: string;
  };
  onAnimationComplete?: () => void;
}

/**
 * Sotto-componente per animare il singolo numero (Rolling Number)
 */
const AnimatedValue = ({ value, isInt = true }: { value: number; isInt?: boolean }) => {
  // Configurazione fisica della molla: rigida ma smorzata (effetto odometro)
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  
  // Trasforma il valore in stringa formattata
  const display = useTransform(spring, (current) => 
    isInt ? Math.round(current).toLocaleString() : current.toFixed(1)
  );

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span className="font-mono tabular-nums">{display}</motion.span>;
};

/**
 * Sotto-componente per il Delta (+10) che appare e scompare
 */
const FloatingDelta = ({ value, color }: { value: number; color: string }) => {
  if (value === 0) return null;
  
  return (
    <AnimatePresence mode='wait'>
      <motion.span
        key={value} // Riavvia l'animazione se il valore cambia
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, transition: { duration: 0.5 } }}
        className="ml-2 text-xs font-bold"
        style={{ color }}
      >
        {value > 0 ? '+' : ''}{value}
      </motion.span>
    </AnimatePresence>
  );
};

export function ResourceTicker({
  resources,
  deltas,
  tickerConfig,
  tooltips,
  onAnimationComplete,
}: ResourceTickerProps) {
  // Stato locale solo per gestire la visibilità temporanea dei Delta
  const [visibleDeltas, setVisibleDeltas] = useState<ResourceDelta>({});

  // Effect separato solo per triggerare i popup dei Delta
  useEffect(() => {
    // Se c'è un cambiamento significativo, mostralo
    if (deltas.gold || deltas.food || deltas.fatigue) {
      setVisibleDeltas(deltas);
      
      // Nascondi dopo 2 secondi e chiama callback
      const timer = setTimeout(() => {
        setVisibleDeltas({});
        onAnimationComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [deltas.gold, deltas.food, deltas.fatigue]); // Dipende SOLO dai valori grezzi

  if (!tickerConfig.enabled) return null;

  return (
    <div className="flex flex-wrap gap-6 text-sm">
      {/* Gold */}
      <div className="flex items-center gap-2" title={tooltips?.gold}>
        <span className="text-amber-400 text-lg">💰</span>
        <div className="text-white">
          <AnimatedValue value={resources.gold} />
        </div>
        <FloatingDelta 
            value={visibleDeltas.gold ?? 0} 
            color={tickerConfig.positiveColor || '#4ade80'} 
        />
      </div>

      {/* Food */}
      <div className="flex items-center gap-2" title={tooltips?.food}>
        <span className="text-red-400 text-lg">🍖</span>
        <div className="text-white">
          <AnimatedValue value={resources.food} />
        </div>
        <FloatingDelta 
            value={visibleDeltas.food ?? 0} 
            color={tickerConfig.positiveColor || '#4ade80'} 
        />
      </div>

      {/* Day */}
      <div className="flex items-center gap-2" title={tooltips?.day}>
        <span className="text-blue-400 text-lg">📅</span>
        <span className="text-slate-400 mr-1">Day</span>
        <div className="text-white">
           <AnimatedValue value={resources.day} />
        </div>
      </div>

      {/* Fatigue */}
      {tickerConfig.showFatigueDelta && (
        <div className="flex items-center gap-2" title={tooltips?.fatigue}>
          <span className="text-purple-400 text-lg">⚡</span>
           <div className="text-white">
              <AnimatedValue value={resources.fatigue * 100} isInt={false} />%
           </div>
           <FloatingDelta 
               value={(visibleDeltas.fatigue ?? 0) * 100} 
               color={tickerConfig.negativeColor || '#ef4444'} 
            />
        </div>
      )}
    </div>
  );
}

export default ResourceTicker;
