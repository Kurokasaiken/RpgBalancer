/**
 * PhysicsLab.tsx
 * Pagina principale del Physics Laboratory.
 *
 * Layout: canvas (sinistra, 60%) + control panel (destra, 340px fissi)
 * Il pannello di controllo usa gli stessi materiali del gioco (ferro brunito,
 * oro araldico, deep black) — non Tailwind generico.
 *
 * Dipendenze esterne: framer-motion v11, il tuo PersistenceService
 * Token CSS richiesti: --acc-*, --go-*, --iron-*, --t0/1/2/3, --void, --base, etc.
 * Font richiesti: Cinzel, Cinzel Decorative, EB Garamond (già caricati nel progetto)
 */

'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { usePhysicsConfig } from './hooks/usePhysicsConfig';
import { DraggableCard } from './components/DraggableCard';
import { SunkenSlot } from './components/SunkenSlot';
import { PhysicalButton } from './components/PhysicalButton';
import { PhysicsSlider } from './components/PhysicsSlider';
import { SLIDER_DEFS, SECTIONS, type PhysicsConfig } from './config/physicsDefaults';

// ─────────────────────────────────────────────────────────────
// TRAUMA SHAKE HOOK
// Sistema: trauma (0–1) decade esponenzialmente ogni frame.
// Offset = trauma² * maxShake — non lineare = più naturale.
// ─────────────────────────────────────────────────────────────
function useTraumaShake(maxShake = 9) {
  const trauma = useRef(0);
  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    tickRef.current = () => {
      trauma.current = Math.max(0, trauma.current - 0.055);
      const t2 = trauma.current * trauma.current;
      if (t2 > 0.0001) {
        shakeX.set((Math.random() * 2 - 1) * t2 * maxShake);
        shakeY.set((Math.random() * 2 - 1) * t2 * maxShake * 0.6);
        rafRef.current = requestAnimationFrame(tickRef.current!);
      } else {
        shakeX.set(0);
        shakeY.set(0);
        rafRef.current = null;
      }
    };
  }, [maxShake, shakeX, shakeY]);

  const addTrauma = useCallback(
    (amount: number) => {
      trauma.current = Math.min(1, trauma.current + amount);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tickRef.current!);
    },
    [],
  );

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return { shakeX, shakeY, addTrauma };
}

// ─────────────────────────────────────────────────────────────
// DESIGN TOKEN HELPERS (usano i token CSS del progetto)
// ─────────────────────────────────────────────────────────────

/** Panel in ferro brunito — il materiale principale del gioco */
const panelStyle: React.CSSProperties = {
  position: 'relative',
  background: `
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.5' numOctaves='4' seed='7' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0.18'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E"),
    linear-gradient(162deg, var(--iron-rim, #242c38) 0%, var(--iron-md, #181c24) 50%, var(--iron-dk, #0c0e12) 100%)
  `,
  border: '1px solid var(--go3, #786000)',
  borderRadius: '4px',
  padding: '10px',
  boxShadow: `
    0 20px 60px rgba(0,0,0,.98),
    0 6px 18px rgba(0,0,0,1),
    0 0 0 1px rgba(100,80,0,.08),
    inset 0 2px 0 rgba(255,255,255,.06),
    inset 0 -2px 0 rgba(0,0,0,.9)
  `,
};

/** Pseudo-corners e filigrana oro — replicata con CSS gradient */
const panelBeforeStyle: React.CSSProperties = {
  content: '""',
  position: 'absolute',
  inset: 0,
  borderRadius: '3px',
  pointerEvents: 'none',
  zIndex: 10,
  background: `
    radial-gradient(circle 5px at 9px 9px, var(--go6,#e0bc50) 0%, var(--go4,#a08020) 45%, transparent 70%),
    radial-gradient(circle 5px at calc(100% - 9px) 9px, var(--go6,#e0bc50) 0%, var(--go4,#a08020) 45%, transparent 70%),
    radial-gradient(circle 5px at 9px calc(100% - 9px), var(--go6,#e0bc50) 0%, var(--go4,#a08020) 45%, transparent 70%),
    radial-gradient(circle 5px at calc(100% - 9px) calc(100% - 9px), var(--go6,#e0bc50) 0%, var(--go4,#a08020) 45%, transparent 70%),
    linear-gradient(90deg, transparent 13px, var(--go3,#786000) 28%, var(--go5,#c8a030) 50%, var(--go3,#786000) 72%, transparent calc(100% - 13px)) 0 0 / 100% 1px no-repeat,
    linear-gradient(90deg, transparent 13px, var(--go3,#786000) 28%, var(--go5,#c8a030) 50%, var(--go3,#786000) 72%, transparent calc(100% - 13px)) 0 100% / 100% 1px no-repeat
  `,
};

/** Body interno del panel — superficie incavata */
const panelBodyStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  borderRadius: '2px',
  background: `
    radial-gradient(ellipse 72% 58% at 50% 44%, rgba(22,20,14,0) 0%, rgba(8,6,2,.55) 68%, rgba(0,0,0,.92) 100%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' seed='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0.12'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='0.048'/%3E%3C/svg%3E"),
    linear-gradient(162deg, var(--raised,#14181f) 0%, var(--surface,#0f1218) 42%, var(--base,#0a0c14) 80%, var(--deep,#060810) 100%)
  `,
  padding: '18px 20px 20px',
  boxShadow: `
    inset 4px 4px 18px rgba(0,0,0,.88),
    inset -2px -2px 8px rgba(0,0,0,.62),
    inset 0 0 44px rgba(0,0,0,.42)
  `,
};

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

function PanelHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div
      className="flex items-center gap-2"
      style={{
        margin: '-18px -20px 14px',
        padding: '10px 20px',
        borderBottom: '1px solid rgba(100,80,0,.22)',
        background: 'linear-gradient(90deg, transparent, rgba(58,42,0,.14), transparent)',
      }}
    >
      {/* Gem */}
      <div
        className="w-[5px] h-[5px] flex-shrink-0"
        style={{
          background: 'radial-gradient(circle, var(--go7,#f0d47a) 0%, var(--go5,#c8a030) 60%, var(--go3,#786000) 100%)',
          transform: 'rotate(45deg)',
          boxShadow: '0 0 5px var(--go5,#c8a030), 0 0 12px var(--acc-glow,rgba(200,160,48,.38))',
        }}
      />
      <span
        className="font-cinzel text-[9px] font-bold tracking-[.28em] uppercase flex-1"
        style={{
          color: 'var(--go5, #c8a030)',
          textShadow: '0 0 10px var(--acc-glow,rgba(200,160,48,.38))',
        }}
      >
        {title}
      </span>
      {sub && (
        <span className="text-[10px] italic" style={{ color: 'var(--t2,#806858)' }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function OrnDivider() {
  return (
    <div className="flex items-center gap-2 my-3">
      <div
        className="flex-1 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--go3,#786000), var(--go4,#a08020), var(--go3,#786000), transparent)',
        }}
      />
      <div
        className="w-[5px] h-[5px]"
        style={{
          background: 'radial-gradient(circle, var(--go7,#f0d47a), var(--go5,#c8a030))',
          transform: 'rotate(45deg)',
          boxShadow: '0 0 5px var(--go5,#c8a030)',
        }}
      />
      <div
        className="flex-1 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--go3,#786000), var(--go4,#a08020), var(--go3,#786000), transparent)',
        }}
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-[6px] font-cinzel text-[7px] tracking-[.38em] uppercase"
      style={{
        color: 'var(--go4,#a08020)',
        borderBottom: '1px solid rgba(100,80,0,.18)',
        paddingBottom: '8px',
        marginBottom: '14px',
      }}
    >
      <span
        className="w-[4px] h-[4px] flex-shrink-0"
        style={{
          background: 'var(--go5,#c8a030)',
          transform: 'rotate(45deg)',
          boxShadow: '0 0 4px var(--go5,#c8a030)',
          display: 'inline-block',
        }}
      />
      {children}
    </div>
  );
}

// Toast
interface ToastState { msg: string; visible: boolean }

function useToast() {
  const [toast, setToast] = useState<ToastState>({ msg: '', visible: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string, dur = 2400) => {
    setToast({ msg, visible: true });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(s => ({ ...s, visible: false })), dur);
  }, []);

  return { toast, show };
}

// Float text
interface FloatItem { id: number; x: number; y: number; text: string }

function useFloatText() {
  const [items, setItems] = useState<FloatItem[]>([]);
  const counter = useRef(0);

  const spawn = useCallback((x: number, y: number, text: string) => {
    const id = ++counter.current;
    setItems(s => [...s, { id, x, y, text }]);
    setTimeout(() => setItems(s => s.filter(i => i.id !== id)), 1100);
  }, []);

  return { items, spawn };
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export function PhysicsLab() {
  const { cfg, setCfg, reset, exportJson } = usePhysicsConfig();
  const slotRef    = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLDivElement>(null);

  const [isOverSlot,   setIsOverSlot]   = useState(false);
  const [droppedIcon,  setDroppedIcon]  = useState<string | undefined>();
  const [flashOpacity, setFlashOpacity] = useState(0);

  const { toast, show: showToast } = useToast();
  const { items: floats, spawn: spawnFloat } = useFloatText();
  const { shakeX, shakeY, addTrauma } = useTraumaShake(9);

  // ── Flash decay ──────────────────────────────────────────
  const flashRef = useRef<number | null>(null);
  const triggerFlash = useCallback((strength: number) => {
    setFlashOpacity(strength);
    if (flashRef.current) cancelAnimationFrame(flashRef.current);
    const decay = () => {
      setFlashOpacity(prev => {
        const next = prev - 0.045;
        if (next > 0) { flashRef.current = requestAnimationFrame(decay); return next; }
        return 0;
      });
    };
    flashRef.current = requestAnimationFrame(decay);
  }, []);

  useEffect(() => () => { if (flashRef.current) cancelAnimationFrame(flashRef.current); }, []);

  // ── Drop handler — ora riceve anche x,y per il float text ─
  const handleDrop = useCallback(
    (success: boolean, x: number, y: number) => {
      if (success) {
        // Effetti impatto
        addTrauma(0.72);
        triggerFlash(0.55);
        spawnFloat(x, y, 'Equipped! ✓');
        setDroppedIcon('⚔️');
        showToast('Card equipaggiata — trascina di nuovo per ritestare');
        setTimeout(() => setDroppedIcon(undefined), 1800);
      }
    },
    [addTrauma, triggerFlash, spawnFloat, showToast],
  );

  const handleExport = useCallback(() => {
    const json = exportJson();
    navigator.clipboard.writeText(json)
      .then(() => showToast('Config copiata negli appunti ✓'))
      .catch(() => showToast('Copia manuale: ' + json.slice(0, 40) + '…'));
  }, [exportJson, showToast]);

  const handleButtonClick = useCallback(
    (e: React.MouseEvent) => {
      spawnFloat(e.clientX, e.clientY, '+12 ◆');
      addTrauma(0.18);
    },
    [spawnFloat, addTrauma],
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--void,#000)', color: 'var(--t0,#f5edd8)' }}
    >
      {/* ══════════════════════════════════════════
          CANVAS — sinistra (shake wrapper)
      ══════════════════════════════════════════ */}
      <motion.div
        ref={canvasRef}
        className="flex-1 flex flex-col items-center justify-center gap-7 p-8 overflow-y-auto relative"
        style={{
          borderRight: '1px solid rgba(100,80,0,.14)',
          x: shakeX,
          y: shakeY,
        }}
      >
        {/* Flash overlay — bianco su drop pesante */}
        <div
          className="absolute inset-0 pointer-events-none z-[9990]"
          style={{
            background: 'rgba(255,255,255,1)',
            opacity: flashOpacity,
          }}
        />

        {/* Label */}
        <p
          className="font-cinzel text-[7.5px] tracking-[.45em] uppercase"
          style={{ color: 'var(--t3,#3c2c20)' }}
        >
          Trascina la card nello slot
        </p>

        {/* DRAG & DROP PANEL */}
        <div style={{ ...panelStyle, width: '100%', maxWidth: '500px' }}>
          <div style={panelBeforeStyle} />
          <div style={panelBodyStyle}>
            <PanelHeader title="Physics Sandbox" sub="Drag · Drop · Hover" />
            <div className="flex items-center justify-center gap-10 py-2">
              <DraggableCard
                cfg={cfg}
                slotRef={slotRef as React.RefObject<HTMLElement>}
                onDragOverSlot={setIsOverSlot}
                onDrop={handleDrop}
              />
              <SunkenSlot
                ref={slotRef}
                cfg={cfg}
                isOver={isOverSlot}
                droppedIcon={droppedIcon}
              />
            </div>
          </div>
        </div>

        {/* BUTTON PANEL */}
        <div style={{ ...panelStyle, width: '100%', maxWidth: '500px' }}>
          <div style={panelBeforeStyle} />
          <div style={{ ...panelBodyStyle, padding: '14px 18px' }}>
            <PanelHeader title="Physical Buttons" sub="Hover · Click · Disabled" />
            <div
              className="flex flex-wrap gap-3 justify-center"
              style={{ paddingTop: '4px' }}
              onClick={handleButtonClick}
            >
              <PhysicalButton cfg={cfg} label="Begin Expedition" icon="⚔" variant="primary" />
              <PhysicalButton cfg={cfg} label="Return" icon="↩" variant="ghost" />
              <PhysicalButton cfg={cfg} label="Locked" icon="🔒" variant="disabled" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════
          CONTROL PANEL — destra (340px fissi)
      ══════════════════════════════════════════ */}
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: '340px',
          flexShrink: 0,
          background: 'rgba(3,4,10,.78)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderLeft: '1px solid rgba(100,80,0,.14)',
        }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 px-5 py-4"
          style={{ borderBottom: '1px solid rgba(100,80,0,.16)' }}
        >
          <p
            className="font-cinzel text-[7.5px] tracking-[.45em] uppercase mb-1"
            style={{ color: 'var(--go4,#a08020)' }}
          >
            Physics Laboratory
          </p>
          <p
            className="text-[11px] italic leading-[1.5]"
            style={{ color: 'var(--t2,#806858)' }}
          >
            Muovi gli slider e trascina la card.
            <br />
            Senti la differenza in tempo reale.
          </p>
        </div>

        {/* Sliders body */}
        <div className="flex-1 overflow-y-auto px-5 py-4"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--go3,#786000) transparent',
          }}
        >
          {SECTIONS.map((sec, si) => (
            <React.Fragment key={sec.id}>
              <div className="mb-1">
                <SectionTitle>{sec.label}</SectionTitle>
                {SLIDER_DEFS
                  .filter(d => d.section === sec.id)
                  .map(def => (
                    <PhysicsSlider
                      key={def.key}
                      def={def}
                      value={cfg[def.key]}
                      onChange={(key, val) => setCfg({ [key]: val } as Partial<PhysicsConfig>)}
                    />
                  ))}
              </div>
              {si < SECTIONS.length - 1 && <OrnDivider />}
            </React.Fragment>
          ))}

          {/* Spacer */}
          <div className="h-4" />
        </div>

        {/* Footer actions */}
        <div
          className="flex-shrink-0 px-5 pb-5 pt-3 flex flex-col gap-2"
          style={{ borderTop: '1px solid rgba(100,80,0,.14)' }}
        >
          <button
            onClick={handleExport}
            className="w-full py-[10px] font-cinzel text-[8px] tracking-[.28em] uppercase rounded-[2px] transition-all"
            style={{
              border: '1px solid var(--go4,#a08020)',
              background: 'linear-gradient(155deg, rgba(80,64,0,.4) 0%, rgba(120,96,0,.4) 100%)',
              color: 'var(--go7,#f0d47a)',
              boxShadow: '0 0 18px rgba(100,76,0,.15)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.filter = 'brightness(1.14)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 28px var(--acc-glow,rgba(200,160,48,.38))';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.filter = '';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 18px rgba(100,76,0,.15)';
            }}
          >
            ⬡ Export Config JSON
          </button>

          <button
            onClick={reset}
            className="w-full py-[8px] font-cinzel text-[7.5px] tracking-[.25em] uppercase rounded-[2px] transition-all"
            style={{
              border: '1px solid rgba(100,80,0,.22)',
              background: 'transparent',
              color: 'var(--t2,#806858)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--t1,#c8b88a)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(100,80,0,.42)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--t2,#806858)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(100,80,0,.22)';
            }}
          >
            ↺ Reset defaults
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FLOAT TEXTS
      ══════════════════════════════════════════ */}
      {floats.map(f => (
        <motion.div
          key={f.id}
          className="fixed pointer-events-none z-[9998] font-cinzel font-bold text-[15px]"
          style={{
            left: f.x - 20,
            top: f.y - 10,
            color: 'var(--go7,#f0d47a)',
            textShadow: '0 0 10px var(--acc-glow,rgba(200,160,48,.38)), 0 2px 4px rgba(0,0,0,.9)',
          }}
          initial={{ opacity: 1, y: 0, scale: 1.15 }}
          animate={{ opacity: 0, y: -52, scale: 0.82 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          {f.text}
        </motion.div>
      ))}

      {/* ══════════════════════════════════════════
          TOAST
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            className="fixed bottom-[22px] left-1/2 z-[9999] pointer-events-none"
            style={{ x: '-50%' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <div
              className="font-cinzel text-[8.5px] tracking-[.2em] uppercase px-5 py-[9px] rounded-[2px]"
              style={{
                border: '1px solid var(--go5,#c8a030)',
                background: 'rgba(12,10,4,.96)',
                backdropFilter: 'blur(20px)',
                color: 'var(--go7,#f0d47a)',
                boxShadow: '0 0 28px var(--acc-glow,rgba(200,160,48,.38)), 0 10px 40px rgba(0,0,0,.8)',
                whiteSpace: 'nowrap',
              }}
            >
              {toast.msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
