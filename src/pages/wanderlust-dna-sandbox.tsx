/**
 * Wanderlust DNA V2 — sandbox di verifica (route /wanderlust-dna).
 *
 * Orchestra i tre componenti V2:
 *  1. HeroToken   — moneta battuta a mano + parallasse 2.5D WebGL
 *  2. SnapSlot    — ghiera bronzo, overshoot duro, shudder, flash anisotropico
 *  3. LensPanel   — rifrazione a barilotto + aberrazione cromatica + incisioni
 *
 * Il drag è gestito qui (pointer events + ref writes, zero re-render per
 * move). Allo snap il gettone viene teletrasportato a 40px dal centro lungo
 * il vettore d'approccio, poi percorre l'ultimo tratto con il bezier
 * overshoot: 40px × ~8% ≈ 3px oltre il centro, rimbalzo e blocco in 0.15s.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { HeroToken, type HeroTokenHandle } from '@/ui/wanderlustDna/HeroToken';
import { SnapSlot, type SnapSlotHandle } from '@/ui/wanderlustDna/SnapSlot';
import { LensPanel } from '@/ui/wanderlustDna/LensPanel';
import { makeSceneTexture } from '@/ui/wanderlustDna/proceduralTextures';
import '@/ui/wanderlustDna/wanderlustDna.css';

const TOKEN_SIZE = 128;
const SLOT_SIZE = 176;
const SNAP_RADIUS = 80; // px from slot center that counts as a valid drop
const SNAP_APPROACH = 40; // handoff distance so bezier overshoot ≈ 3px
const TOKEN_HOME = { x: 28, y: 120 };

export function WanderlustDnaSandbox() {
  const stageRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const slotAnchorRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HeroTokenHandle>(null);
  const slotRef = useRef<SnapSlotHandle>(null);

  const posRef = useRef({ ...TOKEN_HOME });
  const grabOffsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const snapTimerRef = useRef(0);

  const [locked, setLocked] = useState(false);

  // Baked once: stage background AND lens refraction source (same pixels).
  const sceneTexture = useMemo(() => makeSceneTexture(1280, 800), []);
  const sceneUrl = useMemo(() => sceneTexture.toDataURL('image/png'), [sceneTexture]);

  const writeTransform = useCallback(() => {
    const shell = shellRef.current;
    if (shell) {
      shell.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
    }
  }, []);

  const slotCenterInStage = useCallback(() => {
    const stage = stageRef.current;
    const anchor = slotAnchorRef.current;
    if (!stage || !anchor) return null;
    const stageRect = stage.getBoundingClientRect();
    const slotRect = anchor.getBoundingClientRect();
    return {
      x: slotRect.left - stageRect.left + slotRect.width / 2,
      y: slotRect.top - stageRect.top + slotRect.height / 2,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const shell = shellRef.current;
      const stage = stageRef.current;
      if (!shell || !stage) return;

      window.clearTimeout(snapTimerRef.current);
      if (locked) setLocked(false); // grabbing a locked token releases the ghiera

      const stageRect = stage.getBoundingClientRect();
      grabOffsetRef.current = {
        x: e.clientX - stageRect.left - posRef.current.x,
        y: e.clientY - stageRect.top - posRef.current.y,
      };
      draggingRef.current = true;
      shell.classList.remove('is-snapping', 'is-releasing');
      shell.classList.add('is-dragging');
      try {
        shell.setPointerCapture(e.pointerId);
      } catch {
        // synthetic/expired pointers can't be captured — drag still works
      }
    },
    [locked]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const stage = stageRef.current;
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    posRef.current.x = e.clientX - stageRect.left - grabOffsetRef.current.x;
    posRef.current.y = e.clientY - stageRect.top - grabOffsetRef.current.y;
    writeTransform();
    // Drag inertia feeds the 2.5D parallax under the coin glass.
    tokenRef.current?.kick(e.movementX || 0, e.movementY || 0);
  }, [writeTransform]);

  const handlePointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const shell = shellRef.current;
    if (!shell) return;
    shell.classList.remove('is-dragging');

    const center = slotCenterInStage();
    if (!center) return;
    const tokenCenter = {
      x: posRef.current.x + TOKEN_SIZE / 2,
      y: posRef.current.y + TOKEN_SIZE / 2,
    };
    const dx = tokenCenter.x - center.x;
    const dy = tokenCenter.y - center.y;
    const dist = Math.hypot(dx, dy);

    const target = { x: center.x - TOKEN_SIZE / 2, y: center.y - TOKEN_SIZE / 2 };

    if (dist <= SNAP_RADIUS) {
      // Normalized handoff: teleport to 40px out along the approach vector,
      // then let the hard-overshoot bezier close the gap (≈3px past center).
      if (dist > SNAP_APPROACH) {
        const k = SNAP_APPROACH / dist;
        posRef.current.x = target.x + dx * k;
        posRef.current.y = target.y + dy * k;
        writeTransform();
      }
      // Commit the teleport synchronously, then engage the snap transition.
      // Forced reflow (not rAF) so the handoff survives tab throttling.
      void shell.offsetWidth;
      shell.classList.add('is-snapping');
      posRef.current = { ...target };
      writeTransform();
      // Contact instant = end of the 0.15s travel → ghiera + shudder + flash.
      snapTimerRef.current = window.setTimeout(() => {
        shell.classList.remove('is-snapping');
        setLocked(true);
        slotRef.current?.playLockFx();
      }, 150);
    } else {
      // Miss: the piece falls back to the bench with a heavy metal ease.
      shell.classList.add('is-releasing');
      posRef.current = { ...TOKEN_HOME };
      writeTransform();
      snapTimerRef.current = window.setTimeout(
        () => shell.classList.remove('is-releasing'),
        300
      );
    }
  }, [slotCenterInStage, writeTransform]);

  return (
    <div style={{ minHeight: '100vh', background: '#05090c', padding: 24, fontFamily: 'Cinzel, serif' }}>
      <header style={{ marginBottom: 16 }}>
        <p className="wdna-engraved" style={{ margin: 0, fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          UI V2 · Wanderlust DNA
        </p>
        <h1 className="wdna-engraved" style={{ margin: '4px 0 0', fontSize: 26, letterSpacing: '0.08em' }}>
          Strumento Meccanico Rinascimentale
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(202, 166, 79, 0.7)', fontFamily: 'Georgia, serif' }}>
          Trascina il gettone nella ghiera. Clic sul gettone incastonato per sganciarlo.
        </p>
      </header>

      <div
        ref={stageRef}
        style={{
          position: 'relative',
          height: 620,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundImage: `url(${sceneUrl})`,
          backgroundSize: '100% 100%', // linear mapping: lens UVs match exactly
          border: '1px solid rgba(223, 184, 87, 0.25)',
        }}
      >
        {/* Slot anchor: center-top of the bench, viewport-independent */}
        <div
          ref={slotAnchorRef}
          style={{
            position: 'absolute',
            left: '50%',
            top: 96,
            width: SLOT_SIZE,
            height: SLOT_SIZE,
            marginLeft: -SLOT_SIZE / 2,
          }}
        >
          <SnapSlot ref={slotRef} size={SLOT_SIZE} locked={locked} />
        </div>

        {/* Draggable coin shell */}
        <div
          ref={shellRef}
          className="wdna-drag-shell"
          style={{ transform: `translate3d(${TOKEN_HOME.x}px, ${TOKEN_HOME.y}px, 0)` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <HeroToken ref={tokenRef} name="Giggiolillo" seed={42} size={TOKEN_SIZE} />
        </div>

        {/* The Lens — refracts the very backdrop it sits on */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 28,
            transform: 'translateX(-50%)',
            width: 'min(360px, calc(100% - 48px))',
          }}
        >
          <LensPanel
            title="Dangerous Hunt"
            subtitle="Verifica dei requisiti — Lente dell'Alchimista"
            stats={[
              { label: 'Forza', value: 45, requirement: 40 },
              { label: 'Destrezza', value: 38, requirement: 50 },
              { label: 'Costituzione', value: 42, requirement: 40 },
            ]}
            sceneTexture={sceneTexture}
            stageRef={stageRef}
            width="100%"
          />
        </div>
      </div>
    </div>
  );
}

export default WanderlustDnaSandbox;
