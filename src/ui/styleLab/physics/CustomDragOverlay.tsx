/**
 * CustomDragOverlay.tsx
 *
 * UNICO FILE MODIFICATO nell'architettura esistente.
 *
 * Sostituisce il CustomDragOverlay esistente aggiungendo:
 * - Ghost fisico con spring physics (posizione, tilt, lift)
 * - Ombra asimmetrica al suolo
 * - Anticipazione al pickup
 * - Effetti al drop: squash/overshoot, screen shake, flash, spark
 * - Rubber-band al drop fallito
 *
 * Il DragOverlay nativo di dnd-kit rimane ma è opacity:0 —
 * serve per collision detection e annunci ARIA screen reader.
 * Keyboard navigation (Space/frecce/Enter) funziona invariata.
 *
 * Dipendenze nuove:
 *   - useDragPhysicsEngine
 *   - useDragPhysicsConfig (dal context globale)
 *
 * Dipendenze esistenti invariate:
 *   - DragOverlay da @dnd-kit/core
 *   - useDndMonitor per eventi drag
 *   - PgCard (o qualsiasi card tu usi)
 */

'use client';

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { DragOverlay, useDndMonitor } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useDragPhysicsEngine, type GhostStyle, type ShadowStyle } from './useDragPhysicsEngine';
import { useDragPhysicsConfig } from './useDragPhysicsHooks';
import PgCard from '@/ui/idleVillage/components/PgCard';

// Import esistente invariato — adatta al tuo path
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

// ─────────────────────────────────────────────────────────────
// TYPES — adatta a quelli esistenti nel tuo codebase
// ─────────────────────────────────────────────────────────────
interface ActiveDragData {
  workerId: string;
  label: string;
  portraitUrl?: string;
  resident?: ResidentState;
  // ... altri campi che hai già in data: { ... }
}

// ─────────────────────────────────────────────────────────────
// SPARK PARTICLES — canvas overlay
// ─────────────────────────────────────────────────────────────
interface Spark {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  color: string;
  trail: { x: number; y: number }[];
}

function useSparks() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sparksRef = useRef<Spark[]>([]);
  const rafRef    = useRef<number | null>(null);
  const loopRef = useRef<(() => void) | null>(null);

  const initCanvas = useCallback(() => {
    if (canvasRef.current) return canvasRef.current;
    const c = document.createElement('canvas');
    c.style.cssText = 'position:fixed;inset:0;z-index:10001;pointer-events:none';
    c.width  = window.innerWidth;
    c.height = window.innerHeight;
    document.body.appendChild(c);
    canvasRef.current = c;
    window.addEventListener('resize', () => {
      if (canvasRef.current) {
        canvasRef.current.width  = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    });
    return c;
  }, []);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sparks = sparksRef.current;

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.trail.push({ x: s.x, y: s.y });
      if (s.trail.length > 7) s.trail.shift();
      s.x  += s.vx;
      s.y  += s.vy;
      s.vy += 0.20;
      s.vx *= 0.95;
      s.life -= 0.026;

      const alpha = Math.max(0, s.life / s.maxLife);
      for (let t = 0; t < s.trail.length - 1; t++) {
        const ta = (t / s.trail.length) * alpha * 0.45;
        ctx.beginPath();
        ctx.strokeStyle = s.color + ta + ')';
        ctx.lineWidth   = s.size * (t / s.trail.length) * 0.65;
        ctx.moveTo(s.trail[t].x, s.trail[t].y);
        ctx.lineTo(s.trail[t + 1].x, s.trail[t + 1].y);
        ctx.stroke();
      }
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 2.2);
      g.addColorStop(0, s.color + alpha + ')');
      g.addColorStop(1, s.color + '0)');
      ctx.beginPath();
      ctx.fillStyle = g;
      ctx.arc(s.x, s.y, s.size * 2.2, 0, Math.PI * 2);
      ctx.fill();

      if (s.life <= 0) sparks.splice(i, 1);
    }

    if (sparks.length > 0) rafRef.current = requestAnimationFrame(loopRef.current!);
    else rafRef.current = null;
  }, []);

  // Store the latest loop function
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  const spawnSparks = useCallback((x: number, y: number, count: number) => {
    initCanvas();
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.9;
      const speed = 2.5 + Math.random() * 4.5;
      const life  = 0.65 + Math.random() * 0.40;
      sparksRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.2,
        life, maxLife: life,
        size: 2.0 + Math.random() * 3.2,
        color: `hsla(${42 + Math.random() * 18},90%,${60 + Math.random() * 22}%,`,
        trail: [],
      });
    }

    if (!rafRef.current) {
      const currentLoop = loopRef.current;
      if (currentLoop) {
        rafRef.current = requestAnimationFrame(currentLoop);
      }
    }
  }, [initCanvas, loop]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (canvasRef.current) canvasRef.current.remove();
  }, []);

  return { spawnSparks };
}

// ─────────────────────────────────────────────────────────────
// FLASH
// ─────────────────────────────────────────────────────────────
function useFlash() {
  const [opacity, setOpacity] = useState(0);
  const rafRef = useRef<number | null>(null);

  const trigger = useCallback((strength: number) => {
    setOpacity(strength);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const decay = () => {
      setOpacity(prev => {
        const next = prev - 0.044;
        if (next > 0) { rafRef.current = requestAnimationFrame(decay); return next; }
        return 0;
      });
    };
    rafRef.current = requestAnimationFrame(decay);
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const el = opacity > 0 ? (
    <div
      style={{
        position: 'fixed', inset: 0, background: '#fff',
        opacity, pointerEvents: 'none', zIndex: 10000,
      }}
    />
  ) : null;

  return { trigger, el };
}

// ─────────────────────────────────────────────────────────────
// SCREEN SHAKE — trauma system
// ─────────────────────────────────────────────────────────────
function useScreenShake(targetRef: React.RefObject<HTMLElement | null>) {
  const traumaRef = useRef(0);
  const rafRef    = useRef<number | null>(null);
  const tickRef   = useRef<(() => void) | null>(null);

  const tick = useCallback(() => {
    traumaRef.current = Math.max(0, traumaRef.current - 0.054);
    const t2 = traumaRef.current * traumaRef.current;
    const el = targetRef.current;
    if (t2 > 0.0002 && el) {
      const sx = (Math.random() * 2 - 1) * t2 * 12;
      const sy = (Math.random() * 2 - 1) * t2 *  7;
      el.style.transform = `translate(${sx}px,${sy}px)`;
      rafRef.current = requestAnimationFrame(tickRef.current!);
    } else {
      if (el) el.style.transform = '';
      rafRef.current = null;
    }
  }, [targetRef]);

  // Store ref assignment in effect
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const addTrauma = useCallback((amount: number) => {
    traumaRef.current = Math.min(1, traumaRef.current + amount);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tickRef.current!);
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return { addTrauma };
}

// ─────────────────────────────────────────────────────────────
// ANTICIPATION — micro-squash prima del lift
// ─────────────────────────────────────────────────────────────
function useAnticipation(cardRef: React.RefObject<HTMLElement | null>) {
  const anticipate = useCallback(
    (duration: number, squash: number, onDone: () => void) => {
      const el = cardRef.current;
      if (!el) { onDone(); return; }

      el.style.transition = `transform ${duration}ms ease-in`;
      el.style.transform  = `scaleY(${squash}) scaleX(${(2 - squash).toFixed(3)})`;

      const timer = setTimeout(() => {
        el.style.transition = '';
        el.style.transform  = '';
        onDone();
      }, duration);

      return () => clearTimeout(timer);
    },
    [cardRef],
  );

  return { anticipate };
}

// ─────────────────────────────────────────────────────────────
// THUD — squash/overshoot sulla card al drop
// ─────────────────────────────────────────────────────────────
function useThud(cardRef: React.RefObject<HTMLElement | null>) {
  const thud = useCallback((squashY: number, overshootY: number) => {
    const el = cardRef.current;
    if (!el) return;

    // Phase 1: squash
    el.style.transition = 'transform .06s ease-in';
    el.style.transform  = `scaleY(${squashY}) scaleX(${(2 - squashY).toFixed(3)})`;

    setTimeout(() => {
      // Phase 2: overshoot
      el.style.transition = 'transform .38s cubic-bezier(.34,1.56,.64,1)';
      el.style.transform  = `scaleY(${overshootY}) scaleX(${(2 - overshootY).toFixed(3)})`;

      setTimeout(() => {
        // Phase 3: settle
        el.style.transition = 'transform .26s ease';
        el.style.transform  = '';
        setTimeout(() => { el.style.transition = ''; }, 280);
      }, 145);
    }, 62);
  }, [cardRef]);

  return { thud };
}

// ─────────────────────────────────────────────────────────────
// RUBBER BAND — drop fallito
// ─────────────────────────────────────────────────────────────
function useRubberBand(cardRef: React.RefObject<HTMLElement | null>) {
  const rubberBand = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;

    el.style.transition = 'transform .07s ease-in';
    el.style.transform  = 'scaleX(1.07) scaleY(0.95)';

    setTimeout(() => {
      el.style.transition = 'transform .52s cubic-bezier(.34,1.56,.64,1)';
      el.style.transform  = 'scaleX(0.96) scaleY(1.04)';

      setTimeout(() => {
        el.style.transition = 'transform .30s ease';
        el.style.transform  = '';
        setTimeout(() => {
          el.style.transition = '';
          // Micro-shake laterale
          let n = 0;
          const shake = () => {
            n++;
            el.style.transition = 'none';
            el.style.transform  = `translateX(${n % 2 === 0 ? 3 : -3}px)`;
            if (n < 6) requestAnimationFrame(shake);
            else { el.style.transform = ''; el.style.transition = ''; }
          };
          setTimeout(shake, 60);
        }, 310);
      }, 145);
    }, 72);
  }, [cardRef]);

  return { rubberBand };
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
interface CustomDragOverlayProps {
  _residentsById?: Record<string, ResidentState>;
}

export function CustomDragOverlay({ _residentsById }: CustomDragOverlayProps = {}) {
  const cfg = useDragPhysicsConfig();

  // ── Engine ───────────────────────────────────────────────
  const engine = useDragPhysicsEngine(cfg);

  // ── FX ───────────────────────────────────────────────────
  const { spawnSparks } = useSparks();
  const flash           = useFlash();
  const canvasShakeRef  = useRef<HTMLDivElement | null>(null);
  const { addTrauma }   = useScreenShake(canvasShakeRef);

  // ── Refs per animazioni sulla card originale ─────────────
  // Questi puntano al DOM node di PgCard durante il drag
  const cardNodeRef = useRef<HTMLElement | null>(null);
  const { anticipate }  = useAnticipation(cardNodeRef);
  const { thud }        = useThud(cardNodeRef);
  const { rubberBand }  = useRubberBand(cardNodeRef);

  // ── Active drag data ─────────────────────────────────────
  const [activeData, setActiveData] = useState<ActiveDragData | null>(null);
  const [cardOpacity, setCardOpacity] = useState(1);

  // ── dnd-kit event monitor ─────────────────────────────────
  useDndMonitor({
    onDragStart(event) {
      const data = event.active.data.current as ActiveDragData | undefined;
      if (!data) return;
      setActiveData(data);

      // Trova il DOM node della card originale
      // dnd-kit espone il node via event.active.rect — oppure
      // cerca nel DOM tramite data-worker-id se ce l'hai
      const node = document.querySelector(
        `[data-worker-id="${data.workerId}"]` 
      ) as HTMLElement | null;
      cardNodeRef.current = node;

      // 1. Anticipazione sul node originale
      anticipate(cfg.anticDuration, cfg.anticSquash, () => {
        // 2. Dopo anticipazione: ghost appare, card si scurisce
        setCardOpacity(0.14);
        // Cursor position al drag start: usiamo il centro del node
        if (node) {
          const r = node.getBoundingClientRect();
          engine.startDrag(r.left + r.width / 2, r.top + r.height / 2);
        }
      });
    },

    onDragEnd(event: DragEndEvent) {
      engine.stopDrag();
      setCardOpacity(1);
      setActiveData(null);

      const isSuccess = !!event.over;
      const _ex = event.delta.x; // pixel delta — non la pos assoluta
      // Per la posizione assoluta al drop, usa il center dello slot
      const overEl = event.over?.id
        ? document.querySelector(`[data-slot-id="${event.over.id}"]`)
        : null;
      const dropX = overEl
        ? overEl.getBoundingClientRect().left + overEl.getBoundingClientRect().width / 2
        : window.innerWidth / 2;
      const dropY = overEl
        ? overEl.getBoundingClientRect().top
        : window.innerHeight / 2;

      if (isSuccess) {
        // Thud sulla card originale
        thud(cfg.dropSquashY, cfg.dropOvershootY);
        // FX globali
        addTrauma(cfg.dropTrauma);
        flash.trigger(cfg.dropFlash);
        spawnSparks(dropX, dropY, cfg.dropSparks);
      } else {
        // Rubber-band
        rubberBand();
      }
    },
  });

  // ── Pointer events per aggiornare il motore ──────────────
  // dnd-kit gestisce il pointer capture — noi leggiamo solo la posizione
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (activeData) engine.moveDrag(e.clientX, e.clientY);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [activeData, engine]);

  // ── Opacity sulla card originale ─────────────────────────
  useEffect(() => {
    if (!cardNodeRef.current) return;
    cardNodeRef.current.style.opacity = cardOpacity.toString();
    cardNodeRef.current.style.transition = 'opacity .1s ease';
  }, [cardOpacity]);

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <>
      {/* Flash overlay */}
      {flash.el}

      {/* Ombra al suolo */}
      {activeData && (
        <div
          style={{
            position: 'fixed',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 9997,
            willChange: 'transform, left, top',
            ...engine.shadowStyle,
          }}
        />
      )}

      {/* Ghost fisico — SOPRA l'ombra */}
      {activeData && (
        <div
          style={{
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 9998,
            willChange: 'transform, left, top',
            width: 172,
            ...engine.ghostStyle,
          }}
        >
          {/*
            Qui dentro metti il tuo PgCard in modalità ghost.
            Adatta i props al tuo componente effettivo.
          */}
          <PgCard
            workerId={activeData.workerId}
            label={activeData.label}
            hp={activeData.resident?.currentHp ?? 100}
            fatigue={activeData.resident?.fatigue ?? 0}
            isDragging={true}
            portraitUrl={activeData.portraitUrl}
          />
        </div>
      )}

      {/*
        DragOverlay nativo — VISIVAMENTE NASCOSTO.
        Non rimuovere: serve per collision detection e screen reader.
        dropAnimation={null} perché gestiamo noi la rubber-band.
      */}
      <DragOverlay dropAnimation={null}>
        {activeData ? (
          <div style={{ opacity: 0, pointerEvents: 'none', width: 172 }}>
            <PgCard
              workerId={activeData.workerId}
              label={activeData.label}
              hp={activeData.resident?.currentHp ?? 100}
              fatigue={activeData.resident?.fatigue ?? 0}
              isDragging={true}
              portraitUrl={activeData.portraitUrl}
            />
          </div>
        ) : null}
      </DragOverlay>
    </>
  );
}
