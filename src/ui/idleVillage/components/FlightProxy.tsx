import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WanderlustMedalOverlay } from './WanderlustMedalOverlay';
import { getDragConfig } from '../config/dragConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

/** Flight duration — long enough for the slow-in/fast-out magnetic feel to read. */
const FLIGHT_DURATION_MS = 280;

interface FlightProxyProps {
  residentId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  onComplete: (residentId: string, slotId?: string, isInset?: boolean) => void;
  slotId?: string;
  residentsById: Record<string, ResidentState>;
  isInset?: boolean;
}

export function FlightProxy({ 
  residentId, 
  fromX, 
  fromY, 
  toX, 
  toY, 
  onComplete, 
  slotId,
  residentsById,
  isInset
}: FlightProxyProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const proxyRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  const residentIdRef = useRef(residentId);
  const slotIdRef = useRef(slotId);
  const isInsetRef = useRef(isInset);
  
  // Keep refs updated without triggering re-renders
  useEffect(() => {
    onCompleteRef.current = onComplete;
    residentIdRef.current = residentId;
    slotIdRef.current = slotId;
    isInsetRef.current = isInset;
  }, [onComplete, residentId, slotId, isInset]);

  useEffect(() => {
    // Hide animation after duration and call onComplete
    const timer = setTimeout(() => {
      setIsAnimating(false);
      // Call onComplete to notify parent that flight animation is done
      onCompleteRef.current(residentIdRef.current, slotIdRef.current, isInsetRef.current);
    }, FLIGHT_DURATION_MS); // Fixed duration for flight

    return () => {
      clearTimeout(timer);
    };
  }, []); // Empty dependency array - run once on mount

  return (
    <AnimatePresence>
      {isAnimating && (
        <motion.div
          data-testid="flight-proxy"
          ref={proxyRef}
          className="fixed pointer-events-none z-9999"
          style={{
            left: fromX - getDragConfig().overlay.medalSizePx / 2,
            top: fromY - getDragConfig().overlay.medalSizePx / 2,
            width: getDragConfig().overlay.medalSizePx,
            height: getDragConfig().overlay.medalSizePx,
          }}
          initial={{
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: toX - fromX,
            y: toY - fromY,
            scale: 1, // No scale changes - linear flight
            opacity: 1,
          }}
          transition={{
            duration: FLIGHT_DURATION_MS / 1000,
            // Magnetic feel: starts slow, then accelerates into the slot
            ease: [0.55, 0.06, 0.85, 0.4],
          }}
        >
          <WanderlustMedalOverlay
            portraitUrl={residentsById?.[residentId]?.portraitUrl}
            isDragging={false}
            sizePx={getDragConfig().overlay.medalSizePx}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
