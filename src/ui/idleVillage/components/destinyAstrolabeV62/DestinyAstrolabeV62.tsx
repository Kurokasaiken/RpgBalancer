/**
 * DestinyAstrolabeV62 — V6 with a credible tar-goo challenge surface (R-032).
 *
 * Same contract, markup, audio and CSS as V6; the only change is the engine,
 * whose challenge surface is a WebGL2 SDF tar mass (viscous spring rim +
 * droplet metaballs + specular/fresnel material) instead of a flat fill.
 *
 * Single-line usage:
 *   <DestinyAstrolabeV62 skills={skills} onResolve={(r) => ...} autoStart />
 */
import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useSkinBinding } from '@/ui/idleVillage/hooks/useSkinBinding';
import { createDestinyAstrolabeV62Engine } from './engine';
import type {
  AstrolabeSkill,
  AstrolabeConfig,
  AstrolabeResult,
  AstrolabeEngineHandle,
} from './engine';
import { ASTROLABE_MARKUP } from '@/ui/idleVillage/components/destinyAstrolabeV6/markup';
import { useAstrolabeAudio } from '@/ui/idleVillage/components/destinyAstrolabeV6/useAstrolabeAudio';
import '@/ui/idleVillage/components/destinyAstrolabeV6/astrolabe.css';
import '@/ui/idleVillage/components/destinyAstrolabeV6/astrolabe-ui.css';

export type { AstrolabeSkill, AstrolabeConfig, AstrolabeResult };

export interface DestinyAstrolabeV62Handle {
  roll: () => void;
  throw: () => void;
  /** Presentation-only skip — settles the frame and resolves immediately. */
  skipToResult: () => void;
  /** One repaint while the loop is parked in settledIdle (no loop restart). */
  redrawOnce: () => void;
}

export interface DestinyAstrolabeV62Props {
  skills: AstrolabeSkill[];
  /** R-253: display-only per-axis silhouette override (`{stat, difficulty}`
   *  per astrolabe axis) — paints the board's shape from real check/party
   *  data while `skills` still owns the verdict's skill-pick semantics. */
  axisProfile?: { stat: number; difficulty: number }[];
  config?: AstrolabeConfig & { mode?: string };
  onResolve?: (result: AstrolabeResult) => void;
  autoStart?: boolean;
  removeSounds?: boolean;
  className?: string;
  /** Global pace multiplier — folded into the engine config (PLAN-023). */
  speed?: number;
  /** PLAN-043 WS-4: suppress the internal `#card` — the host paints its own
   *  Verdict Card below the board. */
  hideInternalCard?: boolean;
  /** PLAN-043 WS-4: park the rAF loop once the verdict settles; a host
   *  resize triggers exactly one redraw via `redrawOnce()`. */
  settledIdle?: boolean;
}

const SKIN_BINDING = {
  componentId: 'DestinyAstrolabeV62',
  name: 'DestinyAstrolabeV62',
  description: 'D100 skill-check astrolabe with viscous tar challenge surface',
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
  tags: ['skillcheck', 'd100', 'astrolabe', 'tar-goo'],
} as any;

export const DestinyAstrolabeV62 = memo(
  forwardRef<DestinyAstrolabeV62Handle, DestinyAstrolabeV62Props>(function DestinyAstrolabeV62(
    {
      skills,
      axisProfile,
      config,
      onResolve,
      autoStart = true,
      removeSounds = false,
      className,
      speed,
      hideInternalCard,
      settledIdle,
    },
    ref,
  ) {
    const rootRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<AstrolabeEngineHandle | null>(null);
    const onResolveRef = useRef(onResolve);
    onResolveRef.current = onResolve;

    const [armed, setArmed] = useState(false);
    const [flash, setFlash] = useState(false);

    const play = useAstrolabeAudio(removeSounds);

    const { classes, attributes, styles } = useSkinBinding(SKIN_BINDING, {
      properties: { skillCount: skills.length },
    });

    const doThrow = useCallback(() => {
      engineRef.current?.throw();
      setFlash(true);
      window.setTimeout(() => setFlash(false), 260);
    }, []);

    useEffect(() => {
      const root = rootRef.current;
      if (!root) return;
      root.innerHTML = ASTROLABE_MARKUP;

      const engine = createDestinyAstrolabeV62Engine(root, {
        skills,
        axisProfile,
        config: { ...config, ...(speed ? { speed } : null), ...(hideInternalCard ? { hideInternalCard } : null), ...(settledIdle ? { settledIdle } : null) },
        onResolve: (r) => {
          onResolveRef.current?.(r);
          const isSuccess = r.verdict === 'bigwin' || r.verdict === 'win' || r.verdict === 'almost';
          play(isSuccess ? 'success' : 'failure', { volume: 0.75 });
        },
        onArmed: (a) => setArmed(a),
        onState: (s) => {
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
        root.innerHTML = '';
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      engineRef.current?.setConfig(skills, { ...config, ...(hideInternalCard ? { hideInternalCard } : null), ...(settledIdle ? { settledIdle } : null) });
    }, [skills, config, hideInternalCard, settledIdle]);

    /* WS-4 settledIdle: while the loop is parked a resize still deserves a
     *  repaint — `redrawOnce()` fires exactly one frame and parks again. */
    useEffect(() => {
      if (!settledIdle) return undefined;
      const root = rootRef.current;
      if (!root || typeof ResizeObserver === 'undefined') return undefined;
      const observer = new ResizeObserver(() => engineRef.current?.redrawOnce());
      observer.observe(root);
      return () => observer.disconnect();
    }, [settledIdle]);

    useImperativeHandle(
      ref,
      () => ({
        roll: () => engineRef.current?.roll(),
        throw: () => engineRef.current?.throw(),
        skipToResult: () => engineRef.current?.skipToResult(),
        redrawOnce: () => engineRef.current?.redrawOnce(),
      }),
      [],
    );

    return (
      <div className="destiny-astrolabe-wrap" style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div
          ref={rootRef}
          data-testid="destiny-astrolabe-v62"
          className={`destiny-astrolabe ${classes.join(' ')} ${className ?? ''}`.trim()}
          {...attributes}
          style={styles}
        />

        {armed && (
          <button
            type="button"
            className={`da-tira wanderlust-artifact${flash ? ' da-tira--flash' : ''}`}
            onClick={doThrow}
            aria-label="Throw"
            /* Il centraggio vive in .da-tira (left/top 50% + translate -50%).
               Nessun override inline: `inset:0` sovrascriveva left/top e la
               translate residua spostava il bottone di 46px in alto a sinistra. */
            style={{ pointerEvents: 'auto' }}
          >
            THROW
          </button>
        )}
      </div>
    );
  }),
);

DestinyAstrolabeV62.displayName = 'DestinyAstrolabeV62';
