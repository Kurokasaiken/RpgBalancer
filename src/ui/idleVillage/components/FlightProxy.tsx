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
  console.log('=== FLIGHT PROXY MOUNTED ===');
  console.log('Props:', { residentId, fromX, fromY, toX, toY, slotId, isInset });
  
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

  // Debug coordinate tracking
  useEffect(() => {
    // Delay debugging to ensure DOM is fully mounted
    const debugTimer = setTimeout(() => {
      console.log('=== FLIGHT PROXY DEBUG ===');
      console.log('Resident ID:', residentId);
      console.log('Flight coordinates (passed):', {
        from: { x: Math.round(fromX), y: Math.round(fromY) },
        to: { x: Math.round(toX), y: Math.round(toY) },
        distance: Math.round(Math.hypot(toX - fromX, toY - fromY)),
        duration: `${FLIGHT_DURATION_MS}ms`
      });
      console.log('Is animating:', isAnimating);
      
      if (proxyRef.current) {
        const rect = proxyRef.current.getBoundingClientRect();
        console.log('Proxy element rect (actual):', {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
        
        // Also check computed style position
        const computedStyle = window.getComputedStyle(proxyRef.current);
        console.log('Proxy CSS position:', {
          left: computedStyle.left,
          top: computedStyle.top,
          position: computedStyle.position,
          transform: computedStyle.transform
        });
      }
      console.log('========================');
    }, 50); // Small delay to ensure DOM is ready
    
    return () => clearTimeout(debugTimer);
  }, [residentId, fromX, fromY, toX, toY, isAnimating]);

  useEffect(() => {
    console.log('=== FLIGHT PROXY USE EFFECT RUNNING ===');
    console.log(`Will hide animation in ${FLIGHT_DURATION_MS}ms`);
    
    // Hide animation after duration and call onComplete
    const timer = setTimeout(() => {
      console.log('=== TIMEOUT FIRED - HIDING ANIMATION AND CALLING ONCOMPLETE ===');
      setIsAnimating(false);
      // Call onComplete to notify parent that flight animation is done
      onCompleteRef.current(residentIdRef.current, slotIdRef.current, isInsetRef.current);
    }, FLIGHT_DURATION_MS); // Fixed duration for flight

    return () => {
      console.log('=== FLIGHT PROXY CLEANUP (unmount) ===');
      clearTimeout(timer);
    };
  }, []); // Empty dependency array - run once on mount

  return (
    <AnimatePresence>
      {isAnimating && (
        <motion.div
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
