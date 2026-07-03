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

/** Arc on the outer ring showing the success probability during the-spin */
function SweetSpotRing({ tst }: { tst: number }) {
  const R = 56;
  const CIRC = 2 * Math.PI * R;
  const successFrac = Math.max(0.01, Math.min(0.99, tst / 100));
  const successDash = successFrac * CIRC;
  const almostFrac = 5 / 100;
  const almostDash = almostFrac * CIRC;

  return (
    <svg
      className="da-sweetspot"
      viewBox="0 0 120 120"
      aria-hidden="true"
    >
      {/* failure arc (background) */}
      <circle
        cx="60" cy="60" r={R}
        fill="none"
        stroke="rgba(220,38,38,0.22)"
        strokeWidth="6"
      />
      {/* success arc — green, drawn first from top */}
      <circle
        cx="60" cy="60" r={R}
        fill="none"
        stroke="rgba(16,185,129,0.55)"
        strokeWidth="6"
        strokeLinecap="butt"
        strokeDasharray={`${successDash} ${CIRC - successDash}`}
        strokeDashoffset={CIRC * 0.25}
        transform="rotate(0 60 60)"
      />
      {/* almost arc — purple transition zone, offset by success arc */}
      <circle
        cx="60" cy="60" r={R}
        fill="none"
        stroke="rgba(139,92,246,0.6)"
        strokeWidth="6"
        strokeLinecap="butt"
        strokeDasharray={`${almostDash} ${CIRC - almostDash}`}
        strokeDashoffset={CIRC * 0.25 - successDash}
        transform="rotate(0 60 60)"
      />
      {/* glow pulse overlay */}
      <circle
        cx="60" cy="60" r={R}
        fill="none"
        stroke="rgba(16,185,129,0.2)"
        strokeWidth="10"
        strokeDasharray={`${successDash} ${CIRC - successDash}`}
        strokeDashoffset={CIRC * 0.25}
        style={{ animation: 'da-sweetspot-pulse 1.2s ease-in-out infinite' }}
      />
    </svg>
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

    // TST for sweet spot indicator (primary skill)
    const primaryTST = skills.length > 0 ? computeTST(skills[0]) : 65;
    const showSweetSpot = gameState === 'the-spin';
    const showRadialTimer = armed && autoThrowEnabled && !skipAnimationEnabled;
    const showThrowButton = armed && !skipAnimationEnabled && !autoThrowEnabled;
    const isSnapping = gameState === 'magnetic-snap';

    return (
      <div className="destiny-astrolabe-wrap" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: '50%' }}>
        {/* Engine canvas */}
        <div
          ref={rootRef}
          data-testid="destiny-astrolabe"
          className={`destiny-astrolabe ${classes.join(' ')} ${className ?? ''}`.trim()}
          {...attributes}
          style={styles}
        />

        {/* Impact freeze-frame overlay — 200ms flash at magnetic-snap */}
        {isSnapping && <div className="da-freeze-frame" aria-hidden="true" />}

        {/* Screen flash at resolution */}
        {screenFlash && (
          <div
            className={`da-screen-flash da-screen-flash--${screenFlash}`}
            aria-hidden="true"
          />
        )}

        {/* Sweet spot ring — visible during the-spin */}
        {showSweetSpot && <SweetSpotRing tst={primaryTST} />}

        {/* Radial countdown timer — visible when auto-throw is armed */}
        {showRadialTimer && <RadialTimer durationMs={500} />}

        {/* Manual throw button */}
        {showThrowButton && (
          <button
            type="button"
            className={`da-tira wanderlust-artifact${flash ? ' da-tira--flash' : ''}`}
            onClick={doThrow}
            aria-label="Throw"
          >
            THROW
          </button>
        )}

        {/* Info toggle — always visible, top-right corner */}
        <button
          type="button"
          className="da-legend-toggle"
          onClick={() => setLegendOpen(v => !v)}
          aria-label="Toggle skill check legend"
          title="How to read the astrolabe"
        >
          ?
        </button>

        {/* Legend overlay */}
        <SkillCheckLegend open={legendOpen} onClose={() => setLegendOpen(false)} />

        {/* Throw controls */}
        {!hideThrowControls && (
          <fieldset className="da-throw-controls">
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
      </div>
    );
  }),
);

DestinyAstrolabe.displayName = 'DestinyAstrolabe';
