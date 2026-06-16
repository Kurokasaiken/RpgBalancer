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
import './astrolabe.css';
import './astrolabe-ui.css';

export type { AstrolabeSkill, AstrolabeConfig, AstrolabeResult };

export interface DestinyAstrolabeHandle {
  /** Programmatically launch a roll (plays the reveal, then waits for throw). */
  roll: () => void;
  /** Throw (TIRA) — start the spin; warps past any still-playing reveal. */
  throw: () => void;
}

export interface DestinyAstrolabeProps {
  /** Skills under test (1–5). White obelisk = stat, black obelisk = difficulty. */
  skills: AstrolabeSkill[];
  /** Risk chances + scene timings + forced verdict ('mode'). */
  config?: AstrolabeConfig & { mode?: string };
  /** Fired with the typed result when a roll resolves. */
  onResolve?: (result: AstrolabeResult) => void;
  /** Auto-launch a roll on mount. Default true. */
  autoStart?: boolean;
  /** Initial state of the Auto-Tiro toggle. Default false. */
  autoThrow?: boolean;
  /** Hide the built-in Auto-Tiro toggle (e.g. when the host owns pacing). */
  hideAutoThrowToggle?: boolean;
  /** Extra classes on the root. */
  className?: string;
}

/** Skin binding descriptor — mirrors the certified-component pattern (see PgCard). */
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

export const DestinyAstrolabe = memo(
  forwardRef<DestinyAstrolabeHandle, DestinyAstrolabeProps>(function DestinyAstrolabe(
    { skills, config, onResolve, autoStart = true, autoThrow = false, hideAutoThrowToggle = false, className },
    ref,
  ) {
    const rootRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<AstrolabeEngineHandle | null>(null);
    const onResolveRef = useRef(onResolve);
    onResolveRef.current = onResolve;

    const [armed, setArmed] = useState(false);   // true → show the TIRA button
    const [flash, setFlash] = useState(false);   // click feedback
    const [autoTiro, setAutoTiro] = useState(autoThrow);

    const { classes, attributes, styles } = useSkinBinding(SKIN_BINDING, {
      properties: { skillCount: skills.length },
    });

    const doThrow = useCallback(() => {
      engineRef.current?.throw();
      setFlash(true);
      window.setTimeout(() => setFlash(false), 260);
    }, []);

    // Mount the chrome + engine. Re-injecting the markup here (instead of
    // dangerouslySetInnerHTML) guarantees a clean DOM per mount, so a
    // StrictMode double-invoke can't leave two engines fighting over one canvas.
    useEffect(() => {
      const root = rootRef.current;
      if (!root) return;
      root.innerHTML = ASTROLABE_MARKUP;
      const engine = createDestinyAstrolabeEngine(root, {
        skills,
        config,
        onResolve: (r) => onResolveRef.current?.(r),
        onArmed: (a) => setArmed(a),
      });
      engineRef.current = engine;
      if (autoStart) engine.roll();
      return () => {
        engine.destroy();
        engineRef.current = null;
        setArmed(false);
        root.innerHTML = '';
      };
      // mount-once: engine is long-lived; prop updates go through the effect below
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Push live prop changes into the running engine (no remount).
    useEffect(() => {
      engineRef.current?.setConfig(skills, config);
    }, [skills, config]);

    // Auto-Tiro: throw 0.5s after the button arms (uses base stats, no precision bonus).
    useEffect(() => {
      if (!armed || !autoTiro) return;
      const id = window.setTimeout(() => doThrow(), 500);
      return () => window.clearTimeout(id);
    }, [armed, autoTiro, doThrow]);

    useImperativeHandle(
      ref,
      () => ({ roll: () => engineRef.current?.roll(), throw: () => engineRef.current?.throw() }),
      [],
    );

    return (
      <div className="destiny-astrolabe-wrap" style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div
          ref={rootRef}
          data-testid="destiny-astrolabe"
          className={`destiny-astrolabe ${classes.join(' ')} ${className ?? ''}`.trim()}
          {...attributes}
          style={styles}
        />

        {/* TIRA — chiseled bronze coin inlay at the centre of the flower */}
        {armed && (
          <button
            type="button"
            className={`da-tira wanderlust-artifact${flash ? ' da-tira--flash' : ''}`}
            onClick={doThrow}
            aria-label="Tira"
          >
            TIRA
          </button>
        )}

        {/* Auto-Tiro toggle */}
        {!hideAutoThrowToggle && (
          <label
            className="da-autotiro"
            title="Auto-throw uses base stats, no precision bonus"
          >
            <input
              type="checkbox"
              checked={autoTiro}
              onChange={(e) => setAutoTiro(e.target.checked)}
            />
            <span>Auto-Tiro</span>
          </label>
        )}
      </div>
    );
  }),
);

DestinyAstrolabe.displayName = 'DestinyAstrolabe';
