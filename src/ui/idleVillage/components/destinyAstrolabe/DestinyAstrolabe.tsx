/**
 * DestinyAstrolabe — native (no-iframe) D100 skill-check astrolabe.
 *
 * Owns a real <canvas> driven by the extracted engine factory, renders the
 * cinematic chrome (brass frame, arena, overlays, verdict card) and hooks into
 * the Idle Village skin system like every other certified component.
 *
 * Single-line usage:
 *   <DestinyAstrolabe skills={skills} onResolve={(r) => ...} autoStart />
 */
import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useSkinBinding } from '@/ui/idleVillage/hooks/useSkinBinding';
import { createDestinyAstrolabeEngine } from './engine';
import type {
  AstrolabeSkill,
  AstrolabeConfig,
  AstrolabeResult,
  AstrolabeEngineHandle,
} from './engine';
import { ASTROLABE_MARKUP } from './markup';
import { SkillCheckLegend } from './SkillCheckLegend';
import { useAstrolabeAudio } from './useAstrolabeAudio';
import './astrolabe.css';
import './astrolabe-ui.css';

export type { AstrolabeSkill, AstrolabeConfig, AstrolabeResult };

export interface DestinyAstrolabeHandle {
  roll: () => void;
  throw: () => void;
}

export interface DestinyAstrolabeProps {
  skills: AstrolabeSkill[];
  config?: AstrolabeConfig & { mode?: string };
  onResolve?: (result: AstrolabeResult) => void;
  autoStart?: boolean;
  autoThrow?: boolean;
  skipAnimation?: boolean;
  removeSounds?: boolean;
  hideThrowControls?: boolean;
  className?: string;
}

const SKIN_BINDING = {
  componentId: 'DestinyAstrolabe',
  name: 'DestinyAstrolabe',
  description: 'D100 skill-check astrolabe with per-axis geometry and ball physics',
  version: '1.0.0',
  defaultPreset: 'gilded-observatory',
  supportedPillars: ['frontier', 'wilderness', 'empire'],
  supportedMotionLevels: ['minimal', 'reduced', 'full'],
  cssClassBase: 'destiny-astrolabe',
  dataAttributePrefix: 'destiny-astrolabe',
  supportsMotionLevel: true,
  supportsTelemetry: true,
  supportsPillarSwitching: true,
  requiredProperties: [],
  optionalProperties: ['skillCount'],
  category: 'interactive',
  priority: 1,
  tags: ['skillcheck', 'd100', 'astrolabe'],
} as any;

/** Compute TST from a skill (mirrors engine logic: clamp(50+(stat-difficulty),1,99)) */
function computeTST(skill: AstrolabeSkill): number {
  return Math.max(1, Math.min(99, 50 + (skill.stat - skill.difficulty)));
}

// ── PhaseCommentary (pillar labels) ────────────────────────────────────

/**
 * Contextual chip at the bottom of the arena explaining the current phase:
 *  threat-slam  → black obelisks = Difficoltà
 *  agency-burst → white obelisks = Fortitudine
 *  risk-pour    → risk roll results
 */
function PhaseCommentary({
  gameState,
  skills,
  config,
}: {
  gameState: string;
  skills: AstrolabeSkill[];
  config?: AstrolabeConfig & { mode?: string };
}) {
  const isThreat = gameState === 'threat-slam';
  const isAgency = gameState === 'agency-burst';
  const isRisk   = gameState === 'risk-pour';
  if ((!isThreat && !isAgency && !isRisk) || !skills.length) return null;

  const dead: number  = (config as any)?.dead  ?? 5;
  const wound: number = (config as any)?.wound ?? 10;
  const avgDiff = Math.round(skills.reduce((s, sk) => s + sk.difficulty, 0) / skills.length);
  const avgStat = Math.round(skills.reduce((s, sk) => s + sk.stat, 0) / skills.length);

  return (
    <div className="da-phase-commentary" aria-hidden="true">
      {isThreat && (
        <div className="da-phase-chip da-phase-chip--threat">
          <span className="da-phase-chip-icon">◼</span>
          <span className="da-phase-chip-label">Difficoltà</span>
          <span className="da-phase-chip-value">{avgDiff}</span>
        </div>
      )}
      {isAgency && (
        <div className="da-phase-chip da-phase-chip--agency">
          <span className="da-phase-chip-icon">◻</span>
          <span className="da-phase-chip-label">Fortitudine</span>
          <span className="da-phase-chip-value">{avgStat}</span>
        </div>
      )}
      {isRisk && (
        <div className="da-phase-chip da-phase-chip--risk">
          <span className="da-phase-risk-item da-phase-risk--dead">⬤ {dead}% Morte</span>
          <span className="da-phase-risk-sep">·</span>
          <span className="da-phase-risk-item da-phase-risk--wound">⬤ {wound}% Ferita</span>
        </div>
      )}
    </div>
  );
}

/** Radial countdown SVG — drains from full to empty over `durationMs` */
function RadialTimer({ durationMs }: { durationMs: number }) {
  const RADIUS = 52;
  const CIRC = 2 * Math.PI * RADIUS;
  return (
    <svg
      className="da-radial-timer"
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      <circle
        cx="60" cy="60" r={RADIUS}
        fill="none"
        stroke="var(--v8-sun-bronze-dark, #602c08)"
        strokeWidth="4"
        opacity="0.35"
      />
      <circle
        cx="60" cy="60" r={RADIUS}
        fill="none"
        stroke="var(--v8-sun-bronze-light, #e4b048)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset="0"
        transform="rotate(-90 60 60)"
        style={{
          animation: `da-timer-drain ${durationMs}ms linear forwards`,
          '--da-timer-circ': `${CIRC}px`,
        } as React.CSSProperties}
      />
    </svg>
  );
}

/** Skill name + TST badge, shown from agency-burst through resolution */
function SkillBadge({ skills, gameState }: { skills: AstrolabeSkill[]; gameState: string }) {
  const visible = ['agency-burst', 'risk-pour', 'action-trigger', 'the-spin', 'magnetic-snap'].includes(gameState);
  if (!visible || skills.length === 0) return null;
  return (
    <div className="da-skill-badge" aria-hidden="true">
      {skills.map((skill, i) => {
        const tst = Math.max(1, Math.min(99, 50 + (skill.stat - skill.difficulty)));
        return (
          <div key={i} className="da-skill-pill">
            <span className="da-skill-name">{skill.name}</span>
            <span className="da-skill-sep">—</span>
            <span className="da-skill-tst">{tst}</span>
          </div>
        );
      })}
    </div>
  );
}

export const DestinyAstrolabe = memo(
  forwardRef<DestinyAstrolabeHandle, DestinyAstrolabeProps>(function DestinyAstrolabe(
    {
      skills,
      config,
      onResolve,
      autoStart = true,
      autoThrow = false,
      skipAnimation = false,
      removeSounds = false,
      hideThrowControls = false,
      className,
    },
    ref,
  ) {
    const rootRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<AstrolabeEngineHandle | null>(null);
    const onResolveRef = useRef(onResolve);
    onResolveRef.current = onResolve;

    const [armed, setArmed] = useState(false);
    const [flash, setFlash] = useState(false);
    const [autoThrowEnabled, setAutoThrowEnabled] = useState(autoThrow);
    const [skipAnimationEnabled, setSkipAnimationEnabled] = useState(skipAnimation);
    const [removeSoundsEnabled, setRemoveSoundsEnabled] = useState(removeSounds);

    // Polish state
    const [gameState, setGameState] = useState('idle');
    const [screenFlash, setScreenFlash] = useState<'success' | 'failure' | null>(null);
    const [legendOpen, setLegendOpen] = useState(false);

    // Canvas bounds — measured after engine mount so overlays align with the actual canvas,
    // not the full wrap (which can be landscape while the canvas is square).
    const [cvBounds, setCvBounds] = useState<{ l: number; t: number; s: number } | null>(null);

    const play = useAstrolabeAudio(removeSoundsEnabled);

    const { classes, attributes, styles } = useSkinBinding(SKIN_BINDING, {
      properties: { skillCount: skills.length },
    });

    const doThrow = useCallback(() => {
      engineRef.current?.throw();
      setFlash(true);
      window.setTimeout(() => setFlash(false), 260);
    }, []);

    // Wire engine + audio + state tracking
    useEffect(() => {
      const root = rootRef.current;
      if (!root) return;
      root.innerHTML = ASTROLABE_MARKUP;

      // Inject parallax starfield canvas behind the engine canvas
      const arena = root.querySelector('#arena') as HTMLElement | null;
      let starRaf = 0;
      let cleanupStars: (() => void) | null = null;
      if (arena) {
        const sc = document.createElement('canvas');
        sc.className = 'da-stars-extra';
        // Inline style beats .arena canvas { position: relative } from auto-generated CSS
        sc.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
        arena.insertBefore(sc, arena.firstChild);
        const ctx = sc.getContext('2d');
        if (ctx) {
          const W = 800;
          sc.width = W; sc.height = W;
          const TAU = Math.PI * 2;
          type Star = { x: number; y: number; r: number; ph: number };
          const layers: Star[][] = [
            Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * W, r: 0.3 + Math.random() * 0.55, ph: Math.random() * TAU })),
            Array.from({ length: 45 }, () => ({ x: Math.random() * W, y: Math.random() * W, r: 0.55 + Math.random() * 0.75, ph: Math.random() * TAU })),
            Array.from({ length: 18 }, () => ({ x: Math.random() * W, y: Math.random() * W, r: 0.85 + Math.random() * 1.1, ph: Math.random() * TAU })),
          ];
          const speeds = [0.6, 1.0, 1.5];
          const baseAlpha = [0.18, 0.28, 0.42];
          let t = 0;
          let tx = 0, ty = 0, cx = 0, cy = 0;
          const onMove = (e: MouseEvent) => {
            const rect = sc.getBoundingClientRect();
            if (!rect.width) return;
            tx = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
            ty = ((e.clientY - rect.top) / rect.height - 0.5) * 14;
          };
          document.addEventListener('mousemove', onMove);
          const draw = () => {
            cx += (tx - cx) * 0.035;
            cy += (ty - cy) * 0.035;
            ctx.clearRect(0, 0, W, W);
            layers.forEach((layer, li) => {
              const depth = (li + 1) / 3;
              const ox = cx * depth, oy = cy * depth;
              layer.forEach(star => {
                const a = baseAlpha[li] + baseAlpha[li] * 0.55 * Math.sin(t * speeds[li] + star.ph);
                ctx.beginPath();
                ctx.arc(star.x + ox, star.y + oy, star.r, 0, TAU);
                ctx.fillStyle = `rgba(210,228,255,${a})`;
                ctx.fill();
              });
            });
            t += 0.016;
            starRaf = requestAnimationFrame(draw);
          };
          draw();
          cleanupStars = () => {
            cancelAnimationFrame(starRaf);
            document.removeEventListener('mousemove', onMove);
          };
        }
      }

      const engine = createDestinyAstrolabeEngine(root, {
        skills,
        config,
        onResolve: (r) => {
          onResolveRef.current?.(r);
          const isSuccess = r.verdict === 'bigwin' || r.verdict === 'win' || r.verdict === 'almost';
          setScreenFlash(isSuccess ? 'success' : 'failure');
          window.setTimeout(() => setScreenFlash(null), 700);
          play(isSuccess ? 'success' : 'failure', { volume: 0.75 });
        },
        onArmed: (a) => setArmed(a),
        onState: (s) => {
          setGameState(s);
          if (s === 'action-trigger') play('arm', { volume: 0.6 });
          if (s === 'the-spin') play('spin', { volume: 0.5 });
          if (s === 'magnetic-snap') play('snap', { volume: 0.8 });
        },
      });
      engineRef.current = engine;
      if (autoStart) engine.roll();
      return () => {
        cleanupStars?.();
        engine.destroy();
        engineRef.current = null;
        setArmed(false);
        setGameState('idle');
        root.innerHTML = '';
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Push live prop changes into the running engine (no remount)
    useEffect(() => {
      engineRef.current?.setConfig(skills, config);
    }, [skills, config]);

    // Measure the actual canvas position relative to the wrap so all overlays align correctly.
    // Double-rAF ensures the engine has had time to render and size the canvas.
    useEffect(() => {
      let raf: number;
      const measure = () => {
        const root = rootRef.current;
        if (!root) return;
        const wrap = root.parentElement;
        const cv = root.querySelector('#cv') as HTMLElement | null;
        if (!wrap || !cv) { raf = requestAnimationFrame(measure); return; }
        const wr = wrap.getBoundingClientRect();
        const cr = cv.getBoundingClientRect();
        if (!cr.width) { raf = requestAnimationFrame(measure); return; }
        setCvBounds({
          l: Math.round(cr.left - wr.left),
          t: Math.round(cr.top  - wr.top),
          s: Math.round(Math.min(cr.width, cr.height)),
        });
      };
      raf = requestAnimationFrame(() => requestAnimationFrame(measure));
      return () => cancelAnimationFrame(raf);
    }, []);

    // Skip Animation: throw immediately when armed
    useEffect(() => {
      if (!armed || !skipAnimationEnabled) return;
      doThrow();
    }, [armed, skipAnimationEnabled, doThrow]);

    // Auto-Throw: throw 500ms after arming
    useEffect(() => {
      if (!armed || !autoThrowEnabled || skipAnimationEnabled) return;
      const id = window.setTimeout(() => doThrow(), 500);
      return () => window.clearTimeout(id);
    }, [armed, autoThrowEnabled, skipAnimationEnabled, doThrow]);

    useImperativeHandle(
      ref,
      () => ({ roll: () => engineRef.current?.roll(), throw: () => engineRef.current?.throw() }),
      [],
    );

    const showRadialTimer = armed && autoThrowEnabled && !skipAnimationEnabled;
    const showThrowButton = armed && !skipAnimationEnabled && !autoThrowEnabled;

    // Canvas-aligned overlay style — positions all UI relative to the actual square canvas,
    // not the (potentially landscape) wrap container.
    const overlayStyle: React.CSSProperties = cvBounds
      ? { position: 'absolute', left: cvBounds.l, top: cvBounds.t, width: cvBounds.s, height: cvBounds.s }
      : { position: 'absolute', inset: 0 };

    return (
      <div className="destiny-astrolabe-wrap" style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Engine canvas */}
        <div
          ref={rootRef}
          data-testid="destiny-astrolabe"
          className={`destiny-astrolabe ${classes.join(' ')} ${className ?? ''}`.trim()}
          {...attributes}
          style={styles}
        />

        {/* ── Canvas-aligned overlay wrapper ──────────────────────────────
            All UI is positioned relative to the measured canvas bounds,
            so the ring/badge/button all align with the circular arena.   */}
        <div className="da-canvas-overlay" style={{ ...overlayStyle, pointerEvents: 'none' }}>

          {/* Circular clip — constrains flashes to the arena circle */}
          <div className="da-canvas-clip">
            {screenFlash && (
              <div className={`da-screen-flash da-screen-flash--${screenFlash}`} aria-hidden="true" />
            )}
          </div>

          {/* Content overlays (positioned by their own CSS, relative to canvas) */}
          <SkillBadge skills={skills} gameState={gameState} />
          <PhaseCommentary gameState={gameState} skills={skills} config={config} />
          {showRadialTimer && <RadialTimer durationMs={500} />}

          {/* Risk zone narrator — slides in from the right during risk-pour */}
          {(() => {
            const visible = gameState === 'risk-pour' || gameState === 'action-trigger';
            const dead: number  = (config as any)?.dead  ?? 5;
            const wound: number = (config as any)?.wound ?? 10;
            return (
              <div className={`da-narrator${visible ? ' da-narrator--visible' : ''}`} aria-hidden="true">
                <div className="da-narrator-item">
                  <span className="da-narrator-dot da-narrator-dot--wound" />
                  <span>
                    <span className="da-narrator-label">FERITA {wound}%</span>
                    <br />
                    <span className="da-narrator-sub">Corona cremisi — zona di rischio attorno alla stella</span>
                  </span>
                </div>
                <div className="da-narrator-item">
                  <span className="da-narrator-dot da-narrator-dot--dead" />
                  <span>
                    <span className="da-narrator-label">MORTE {dead}%</span>
                    <br />
                    <span className="da-narrator-sub">Voragini viola — nelle valli, caduta letale</span>
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Interactive overlays — opt in to pointer events */}
          {showThrowButton && (
            <button
              type="button"
              className={`da-tira wanderlust-artifact${flash ? ' da-tira--flash' : ''}`}
              onClick={doThrow}
              aria-label="Throw"
              style={{ pointerEvents: 'auto' }}
            >
              THROW
            </button>
          )}

          <button
            type="button"
            className="da-legend-toggle"
            onClick={() => setLegendOpen(v => !v)}
            aria-label="Toggle skill check legend"
            title="How to read the astrolabe"
            style={{ pointerEvents: 'auto' }}
          >
            ?
          </button>

          <SkillCheckLegend open={legendOpen} onClose={() => setLegendOpen(false)} />

          {!hideThrowControls && (
            <fieldset className="da-throw-controls" style={{ pointerEvents: 'auto' }}>
              <legend className="sr-only">Throw controls</legend>

              <label className="da-control-label">
                <input
                  type="checkbox"
                  className="da-toggle"
                  checked={skipAnimationEnabled}
                  onChange={(e) => setSkipAnimationEnabled(e.target.checked)}
                />
                <span className="da-toggle-track" aria-hidden="true" />
                <span className="da-toggle-label">Skip</span>
              </label>

              <label className="da-control-label">
                <input
                  type="checkbox"
                  className="da-toggle"
                  checked={autoThrowEnabled}
                  onChange={(e) => setAutoThrowEnabled(e.target.checked)}
                  disabled={skipAnimationEnabled}
                  title={skipAnimationEnabled ? 'Disabled when Skip is active' : 'Auto-throw 0.5s after arming'}
                />
                <span className="da-toggle-track" aria-hidden="true" />
                <span className="da-toggle-label">Auto</span>
              </label>

              <label className="da-control-label">
                <input
                  type="checkbox"
                  className="da-toggle"
                  checked={removeSoundsEnabled}
                  onChange={(e) => setRemoveSoundsEnabled(e.target.checked)}
                />
                <span className="da-toggle-track" aria-hidden="true" />
                <span className="da-toggle-label">Mute</span>
              </label>
            </fieldset>
          )}

        </div>{/* /da-canvas-overlay */}
      </div>
    );
  }),
);

DestinyAstrolabe.displayName = 'DestinyAstrolabe';
