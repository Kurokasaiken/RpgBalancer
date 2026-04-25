/**
 * useDragPhysicsEngine.ts
 *
 * Motore fisico per il drag. Gestisce:
 * - Spring loop via requestAnimationFrame (F = K*dx - D*vx / M)
 * - Posizione ghost (centrata sul cursore con ritardo fisico)
 * - Tilt da velocità EMA del cursore
 * - Ombra asimmetrica al suolo (tilt → asimmetria, lift → blur/offset)
 * - Magnetic snap verso lo slot target
 *
 * Non dipende da dnd-kit. Funziona con Pointer Events raw.
 * Il DragOverlay di dnd-kit rimane opacity:0 per la collision detection.
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import type { DragPhysicsConfig } from './dragPhysicsPresets';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface GhostStyle {
  left: string;
  top: string;
  transform: string;
  boxShadow: string;
  opacity: number;
}

export interface ShadowStyle {
  left: string;
  top: string;
  width: string;
  height: string;
  opacity: number;
  filter: string;
  transform: string;
  background: string;
}

export interface DragPhysicsEngineAPI {
  /** Chiama al pointer down per iniziare il drag */
  startDrag: (cx: number, cy: number) => void;
  /** Chiama al pointer move per aggiornare il target */
  moveDrag: (cx: number, cy: number) => void;
  /** Chiama al pointer up per terminare il drag */
  stopDrag: () => void;
  /** Aggiorna lo snap target (centro slot quando il ghost è vicino) */
  setSnapTarget: (target: { x: number; y: number } | null) => void;
  /** Stili calcolati per il ghost element */
  ghostStyle: GhostStyle;
  /** Stili calcolati per l'ombra al suolo */
  shadowStyle: ShadowStyle;
  /** True durante il drag attivo */
  isDragging: boolean;
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const GHOST_W = 172;  // px — deve corrispondere alla larghezza di PgCard
const GHOST_H = 200;  // px — altezza approssimativa di PgCard

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────
export function useDragPhysicsEngine(
  cfg: DragPhysicsConfig,
): DragPhysicsEngineAPI {
  // ── Refs per il loop RAF (evita closure stale) ────────────
  const cfgRef = useRef(cfg);
  useEffect(() => { cfgRef.current = cfg; }, [cfg]);

  const rafRef    = useRef<number | null>(null);
  const activeRef = useRef(false);

  // Spring state
  const spRef = useRef({
    tx: 0, ty: 0,        // target raw (cursore)
    sx: 0, sy: 0,        // posizione spring attuale
    vx: 0, vy: 0,        // velocità spring
    cvx: 0, cvy: 0,      // velocità cursore EMA (per tilt)
    lx: 0, ly: 0,        // ultima pos cursore
    snapTarget: null as { x: number; y: number } | null,
  });

  // ── Stato per i styles (React re-render) ─────────────────
  const [ghostStyle, setGhostStyle] = useState<GhostStyle>({
    left: '-9999px', top: '-9999px',
    transform: '', boxShadow: '', opacity: 0,
  });
  const [shadowStyle, setShadowStyle] = useState<ShadowStyle>({
    left: '-9999px', top: '-9999px',
    width: '0px', height: '0px',
    opacity: 0, filter: '', transform: '', background: '',
  });
  const [isDragging, setIsDragging] = useState(false);

  // ── Spring tick ───────────────────────────────────────────
  const tickRef = useRef<(() => void) | null>(null);
  
  const tick = useCallback(() => {
    if (!activeRef.current) return;
    const sp  = spRef.current;
    const c   = cfgRef.current;

    // Resolve target: raw cursor + snap influence
    let tx = sp.tx, ty = sp.ty;
    if (sp.snapTarget) {
      const str = c.snapStrength;
      tx = tx + (sp.snapTarget.x - tx) * str;
      ty = ty + (sp.snapTarget.y - ty) * str;
    }

    // Spring force: F = (K*dx - D*vx) / M
    const K  = c.stiffness * 0.001;
    const D  = c.damping * 0.001;
    const M  = c.mass * 0.001;

    // Update velocity and position
    sp.vx += (K * (tx - sp.sx) - D * sp.vx) / M;
    sp.vy += (K * (ty - sp.sy) - D * sp.vy) / M;
    sp.sx += sp.vx;
    sp.sy += sp.vy;

    // Apply constraints
    if (sp.sx < c.bounds.minX) { sp.sx = c.bounds.minX; sp.vx *= -c.bounce; }
    if (sp.sx > c.bounds.maxX) { sp.sx = c.bounds.maxX; sp.vx *= -c.bounce; }
    if (sp.sy < c.bounds.minY) { sp.sy = c.bounds.minY; sp.vy *= -c.bounce; }
    if (sp.sy > c.bounds.maxY) { sp.sy = c.bounds.maxY; sp.vy *= -c.bounce; }

    // Tilt da EMA cursor velocity
    const tiltZ = Math.max(
      -c.tiltMax,
      Math.min(c.tiltMax, sp.cvx * c.tiltMax * 0.11),
    );
    const tiltX = Math.max(-7, Math.min(7, sp.cvy * 0.32));

    // Lift ratio: 0 → 1
    const lift = c.liftScale - 1;  // es. 0.08 per liftScale 1.08

    // ── Ghost styles ────────────────────────────────────────
    const bsY  = Math.round(12 + lift * 180);
    const bsB  = Math.round(22 + lift * 200);

    setGhostStyle({
      left:      `${sp.sx}px`,
      top:       `${sp.sy}px`,
      transform: `scale(${c.liftScale}) rotate(${tiltZ}deg) perspective(700px) rotateX(${-tiltX}deg)`,
      opacity:   0.93,
      boxShadow: [
        `0 ${bsY}px ${bsB}px rgba(0,0,0,.97)`,
        `0 0 0 1px rgba(251,191,36,0.5)`,   // amber — usa il colore esistente
        `0 0 56px rgba(251,191,36,0.22)`,
        `inset 0 2px 0 rgba(255,255,255,.06)`,
        `inset 0 -2px 0 rgba(0,0,0,.80)`,
      ].join(','),
    });

    // ── Shadow styles ────────────────────────────────────────
    const baseW   = GHOST_W * (1 + lift * (c.shadowSpread - 1));
    const baseH   = baseW * 0.26;
    const blur    = c.shadowBlur * (1 + lift * 0.9);
    const opacity = c.shadowOpacity * (1 - lift * 0.30);
    const offsetY = lift * 34 + GHOST_H * 0.48;

    // Asimmetria: tilt positivo (destra) → ombra si estende a sinistra
    const asymX = -tiltZ * lift * 3.2;
    const asymW = 1 + Math.abs(tiltZ) * lift * 0.035;

    const sw = baseW * asymW * 1.55;
    const sh = baseH * 1.55;

    setShadowStyle({
      left:      (sp.sx + asymX - sw / 2) + 'px',
      top:       (sp.sy + offsetY - sh / 2) + 'px',
      width:     sw + 'px',
      height:    sh + 'px',
      opacity,
      filter:    `blur(${blur}px)`,
      transform: `rotate(${tiltZ * 0.28}deg) scaleX(${asymW})`,
      background: 'radial-gradient(ellipse,rgba(0,0,0,.92) 0%,rgba(0,0,0,.55) 38%,rgba(0,0,0,0) 72%)',
    });

    // Use the function itself to avoid recursion issues
    rafRef.current = requestAnimationFrame(tickRef.current!);
  }, [setGhostStyle, setShadowStyle]);

  // ── Store ref assignment in effect ───────────────────────────────────────────────
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  // ── Cleanup ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── Public API ────────────────────────────────────────────

  const startDrag = useCallback((cx: number, cy: number) => {
    const sp = spRef.current;
    sp.tx = cx; sp.ty = cy;
    sp.sx = cx; sp.sy = cy;
    sp.vx = 0;  sp.vy = 0;
    sp.cvx = 0; sp.cvy = 0;
    sp.lx = cx; sp.ly = cy;
    sp.snapTarget = null;
    activeRef.current = true;
    setIsDragging(true);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const moveDrag = useCallback((cx: number, cy: number) => {
    const sp = spRef.current;
    // EMA velocity per tilt
    sp.cvx = sp.cvx * 0.52 + (cx - sp.lx) * 0.48;
    sp.cvy = sp.cvy * 0.52 + (cy - sp.ly) * 0.48;
    sp.lx = cx; sp.ly = cy;
    sp.tx = cx; sp.ty = cy;
  }, []);

  const stopDrag = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setIsDragging(false);
    setGhostStyle(s => ({ ...s, opacity: 0 }));
    setShadowStyle(s => ({ ...s, opacity: 0 }));
    spRef.current.snapTarget = null;
  }, []);

  const setSnapTarget = useCallback(
    (target: { x: number; y: number } | null) => {
      spRef.current.snapTarget = target;
    },
    [],
  );

  return { startDrag, moveDrag, stopDrag, setSnapTarget, ghostStyle, shadowStyle, isDragging };
}
