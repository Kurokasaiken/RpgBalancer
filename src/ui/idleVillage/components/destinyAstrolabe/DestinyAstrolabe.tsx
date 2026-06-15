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
import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef } from 'react';
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

export type { AstrolabeSkill, AstrolabeConfig, AstrolabeResult };

export interface DestinyAstrolabeHandle {
  /** Programmatically launch a roll. */
  roll: () => void;
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
    { skills, config, onResolve, autoStart = true, className },
    ref,
  ) {
    const rootRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<AstrolabeEngineHandle | null>(null);
    const onResolveRef = useRef(onResolve);
    onResolveRef.current = onResolve;

    const { classes, attributes, styles } = useSkinBinding(SKIN_BINDING, {
      properties: { skillCount: skills.length },
    });

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
      });
      engineRef.current = engine;
      if (autoStart) engine.roll();
      return () => {
        engine.destroy();
        engineRef.current = null;
        root.innerHTML = '';
      };
      // mount-once: engine is long-lived; prop updates go through the effect below
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Push live prop changes into the running engine (no remount).
    useEffect(() => {
      engineRef.current?.setConfig(skills, config);
    }, [skills, config]);

    useImperativeHandle(ref, () => ({ roll: () => engineRef.current?.roll() }), []);

    return (
      <div
        ref={rootRef}
        data-testid="destiny-astrolabe"
        className={`destiny-astrolabe ${classes.join(' ')} ${className ?? ''}`.trim()}
        {...attributes}
        style={styles}
      />
    );
  }),
);

DestinyAstrolabe.displayName = 'DestinyAstrolabe';
