import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { WanderlustMedalOverlay } from './WanderlustMedalOverlay';
import { getDragConfig } from '../config/dragConfig';
import { getHudZoomFactor } from './gameFrame/hudScale';
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
    /* R-269: the proxy does NOT unmount itself — the parent's flight state
     * owns the lifecycle (`DragOutcomeFlight` renders it while
     * `mode==='flight'`). Self-unmounting urgently raced the deferred
     * carrier handoff (assign/unlock land in a transition): a painted frame
     * with neither proxy nor carrier. The timer only reports landing; the
     * parent settles the flight state in the same commit the carrier takes
     * the medallion, so the proxy parks at its destination until then. */
    const timer = setTimeout(() => {
      // Call onComplete to notify parent that flight animation is done
      onCompleteRef.current(residentIdRef.current, slotIdRef.current, isInsetRef.current);
    }, FLIGHT_DURATION_MS); // Fixed duration for flight

    return () => {
      clearTimeout(timer);
    };
  }, []); // Empty dependency array - run once on mount

  /* PLAN-043 WS-5 DEF-06: the proxy mounts inside the CSS-zoomed chrome
   *  layer — `left/top` and motion deltas are chrome units, while the
   *  from/to coords arrive as device px (pointer release, slot rects).
   *  `getHudZoomFactor()` is 1 where no chrome zoom applies. */
  const z = getHudZoomFactor();
  const medalPx = getDragConfig().overlay.medalSizePx;

  return (
    <motion.div
      data-testid="flight-proxy"
      ref={proxyRef}
      className="fixed pointer-events-none z-9999"
      style={{
        left: fromX / z - medalPx / 2,
        top: fromY / z - medalPx / 2,
        width: medalPx,
        height: medalPx,
      }}
      initial={{
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
      }}
      animate={{
        x: (toX - fromX) / z,
        y: (toY - fromY) / z,
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
  );
}
