/**
 * DestinyAstrolabeV63 — V6 with a credible tar-goo challenge surface (R-032).
 *
 * Same contract, markup, audio and CSS as V6; the only change is the engine,
 * whose challenge surface is a WebGL2 SDF tar mass (viscous spring rim +
 * droplet metaballs + specular/fresnel material) instead of a flat fill.
 *
 * Single-line usage:
 *   <DestinyAstrolabeV63 skills={skills} onResolve={(r) => ...} autoStart />
 */
import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useSkinBinding } from '@/ui/idleVillage/hooks/useSkinBinding';
import { createDestinyAstrolabeV63Engine } from './engine';
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

export interface DestinyAstrolabeV63Handle {
  roll: () => void;
  throw: () => void;
}

export interface DestinyAstrolabeV63Props {
  skills: AstrolabeSkill[];
  config?: AstrolabeConfig & { mode?: string };
  onResolve?: (result: AstrolabeResult) => void;
  autoStart?: boolean;
  removeSounds?: boolean;
  className?: string;
}

const SKIN_BINDING = {
  componentId: 'DestinyAstrolabeV63',
  name: 'DestinyAstrolabeV63',
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

export const DestinyAstrolabeV63 = memo(
  forwardRef<DestinyAstrolabeV63Handle, DestinyAstrolabeV63Props>(function DestinyAstrolabeV63(
    {
      skills,
      config,
      onResolve,
      autoStart = true,
      removeSounds = false,
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

      const engine = createDestinyAstrolabeV63Engine(root, {
        skills,
        config,
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
      engineRef.current?.setConfig(skills, config);
    }, [skills, config]);

    useImperativeHandle(
      ref,
      () => ({ roll: () => engineRef.current?.roll(), throw: () => engineRef.current?.throw() }),
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

DestinyAstrolabeV63.displayName = 'DestinyAstrolabeV63';
