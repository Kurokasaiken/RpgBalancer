import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WanderlustMedalOverlay } from './WanderlustMedalOverlay';
import { getDragConfig } from '../config/dragConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

interface FlightProxyProps {
  residentId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  onComplete: (residentId: string, slotId?: string) => void;
  slotId?: string;
  residentsById: Record<string, ResidentState>;
}

export function FlightProxy({ 
  residentId, 
  fromX, 
  fromY, 
  toX, 
  toY, 
  onComplete, 
  slotId,
  residentsById
}: FlightProxyProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const proxyRef = useRef<HTMLDivElement>(null);

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
        duration: '160ms'
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
    // Auto-complete after animation - simple timeout is fine for UI animation
    const timer = setTimeout(() => {
      setIsAnimating(false);
      onComplete(residentId, slotId);
    }, 160); // Fixed duration for flight

    return () => clearTimeout(timer);
  }, [residentId, slotId, onComplete]);

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
            duration: 0.16,
            ease: [0.4, 0, 0.2, 1], // Smooth ease-out
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
