/**
 * DestinyAstrolabeV64 — V6 with a credible tar-goo challenge surface (R-032).
 *
 * Same contract, markup, audio and CSS as V6; the only change is the engine,
 * whose challenge surface is a WebGL2 SDF tar mass (viscous spring rim +
 * droplet metaballs + specular/fresnel material) instead of a flat fill.
 *
 * Single-line usage:
 *   <DestinyAstrolabeV64 skills={skills} onResolve={(r) => ...} autoStart />
 */
import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from '@/localization/useTranslation';
import { useSkinBinding } from '@/ui/idleVillage/hooks/useSkinBinding';
import { createDestinyAstrolabeV64Engine } from './engine';
import type {
  AstrolabeSkill,
  AstrolabeConfig,
  AstrolabeResult,
  AstrolabeEngineHandle,
  AstrolabePhase,
} from './astrolabeV64.types';
import { ASTROLABE_MARKUP } from '@/ui/idleVillage/components/destinyAstrolabeV6/markup';
import { useAstrolabeAudio } from '@/ui/idleVillage/components/destinyAstrolabeV6/useAstrolabeAudio';
import { astrolabeV64Config } from '@/balancing/config/idleVillage/astrolabeV64Config';
import '@/ui/idleVillage/components/destinyAstrolabeV6/astrolabe.css';
import '@/ui/idleVillage/components/destinyAstrolabeV6/astrolabe-ui.css';

export type { AstrolabeSkill, AstrolabeConfig, AstrolabeResult };

export interface DestinyAstrolabeV64Handle {
  roll: () => void;
  throw: () => void;
}

export interface DestinyAstrolabeV64Props {
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
  componentId: 'DestinyAstrolabeV64',
  name: 'DestinyAstrolabeV64',
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

export const DestinyAstrolabeV64 = memo(
  forwardRef<DestinyAstrolabeV64Handle, DestinyAstrolabeV64Props>(function DestinyAstrolabeV64(
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

    const { t } = useTranslation('idleVillage');
    const [armed, setArmed] = useState(false);
    const [flash, setFlash] = useState(false);
    const [autoThrowEnabled, setAutoThrowEnabled] = useState(autoThrow);
    const [autoThrowMs, setAutoThrowMs] = useState(0);
    const [skipAnimationEnabled, setSkipAnimationEnabled] = useState(skipAnimation);
    const [removeSoundsEnabled, setRemoveSoundsEnabled] = useState(removeSounds);
    const [currentState, setCurrentState] = useState<AstrolabePhase>('idle');
    const [boardInfo, setBoardInfo] = useState<{ skills: AstrolabeSkill[]; axisSkill: number[]; activeSkillIndex: number } | null>(null);

    const play = useAstrolabeAudio(removeSoundsEnabled);

    /* R-067: copy i18n iniettata nell'engine via config.copy — nessuna stringa
       utente nuova hardcoded nel motore (fallback interni restano per la pagina
       standalone senza i18n). */
    const copy = React.useMemo(() => {
      const narrativeFor = (skillName: string, verdict: string) => {
        const fallback = t(`astrolabeV64.narrative.${verdict}`);
        return t(`astrolabeV64.narrative.${skillName}.${verdict}`, { defaultValue: fallback });
      };
      const narrativeFlavors: Record<string, Record<string, string>> = {};
      skills.forEach((sk) => {
        narrativeFlavors[sk.name] = {};
        ['bigwin', 'win', 'almost', 'fail', 'epicfail'].forEach((v) => {
          narrativeFlavors[sk.name][v] = narrativeFor(sk.name, v);
        });
      });
      return {
        mathFmt: t('astrolabeV64.mathFmt'),
        chips: {
          wounded: t('astrolabeV64.riskWounded'),
          dead: t('astrolabeV64.riskDead'),
        },
        verdicts: {
          bigwin: { title: t('astrolabeV64.verdict.bigwin'), sub: t('astrolabeV64.narrative.bigwin') },
          win: { title: t('astrolabeV64.verdict.win'), sub: t('astrolabeV64.narrative.win') },
          almost: { title: t('astrolabeV64.verdict.almost'), sub: t('astrolabeV64.narrative.almost') },
          fail: { title: t('astrolabeV64.verdict.fail'), sub: t('astrolabeV64.narrative.fail') },
          epicfail: { title: t('astrolabeV64.verdict.epicfail'), sub: t('astrolabeV64.narrative.epicfail') },
        },
        narrativeFlavors,
      };
    }, [t, skills]);
    const engineConfig = React.useMemo(
      () => ({ ...(config ?? {}), copy }),
      [config, copy],
    );

    const { classes, attributes, styles } = useSkinBinding(SKIN_BINDING, {
      properties: { skillCount: skills.length },
    });

    const doThrow = useCallback(() => {
      engineRef.current?.throw();
      setFlash(true);
      window.setTimeout(() => setFlash(false), 260);
    }, []);

    // Skip Animation: throw immediately when armed
    useEffect(() => {
      if (!armed || !skipAnimationEnabled) return;
      doThrow();
    }, [armed, skipAnimationEnabled, doThrow]);

    // Auto-Throw: throw 500ms after arming with a visible countdown
    useEffect(() => {
      if (!armed || !autoThrowEnabled || skipAnimationEnabled) return;
      const total = 500;
      setAutoThrowMs(total);
      const start = Date.now();
      const display = window.setInterval(() => {
        setAutoThrowMs(Math.max(0, total - (Date.now() - start)));
      }, 50);
      const fire = window.setTimeout(() => {
        window.clearInterval(display);
        setAutoThrowMs(0);
        doThrow();
      }, total);
      return () => {
        window.clearTimeout(fire);
        window.clearInterval(display);
      };
    }, [armed, autoThrowEnabled, skipAnimationEnabled, doThrow]);

    // Space/Enter trigger CHECK while armed (ignore inputs/textareas)
    useEffect(() => {
      if (!armed) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
        e.preventDefault();
        doThrow();
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [armed, doThrow]);

    useEffect(() => {
      const root = rootRef.current;
      if (!root) return;
      root.innerHTML = ASTROLABE_MARKUP;

      const engine = createDestinyAstrolabeV64Engine(root, {
        skills,
        config: engineConfig,
        onResolve: (r) => {
          onResolveRef.current?.(r);
          const isSuccess = r.verdict === 'bigwin' || r.verdict === 'win' || r.verdict === 'almost';
          play(isSuccess ? 'success' : 'failure', { volume: 0.75 });
        },
        onArmed: (a) => setArmed(a),
        onState: (s) => {
          setCurrentState(s);
          if (s === 'action-trigger') play('arm', { volume: 0.6 });
          if (s === 'the-spin') play('spin', { volume: 0.5 });
          if (s === 'magnetic-snap') play('snap', { volume: 0.8 });
        },
        onInfo: (info) => setBoardInfo({ skills: info.skills, axisSkill: info.axisSkill, activeSkillIndex: info.activeSkillIndex }),
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
      engineRef.current?.setConfig(skills, engineConfig);
    }, [skills, engineConfig]);

    useImperativeHandle(
      ref,
      () => ({ roll: () => engineRef.current?.roll(), throw: () => engineRef.current?.throw() }),
      [],
    );

    return (
      <div className="destiny-astrolabe-wrap da-v64" style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div
          ref={rootRef}
          data-testid="destiny-astrolabe-v64"
          className={`destiny-astrolabe ${classes.join(' ')} ${className ?? ''}`.trim()}
          {...attributes}
          style={styles}
        />

        {boardInfo && (
          <svg
            className={`da-skill-plaques${currentState === 'action-trigger' ? ' da-skill-plaques--armed' : ''}`}
            viewBox="-100 -100 1200 1200"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const skillIdx = boardInfo.axisSkill[i];
              if (skillIdx == null) return null;
              const sk = boardInfo.skills[skillIdx];
              if (!sk) return null;
              const isActive = skillIdx === boardInfo.activeSkillIndex;
              const N = 5;
              const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
              const CX = 500;
              const CY = 500;
              const r = 500 * astrolabeV64Config.perimeterPlaques.radiusFactor;
              const x = CX + Math.cos(angle) * r;
              const y = CY + Math.sin(angle) * r;
              const { width: pw, height: ph, activeScale } = astrolabeV64Config.perimeterPlaques;
              const show = currentState === 'action-trigger';
              const scale = show ? (isActive ? activeScale : 1) : 0.85;
              return (
                <g
                  key={i}
                  className={`da-skill-plaque${isActive ? ' da-skill-plaque--active' : ''}`}
                  style={{
                    transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(3)})`,
                    opacity: show ? 1 : 0,
                    transitionDelay: `${i * 60}ms`,
                  }}
                >
                  <rect
                    x={-pw / 2}
                    y={-ph / 2}
                    width={pw}
                    height={ph}
                    rx={ph / 4}
                    className="da-skill-plaque__bg"
                  />
                  <text
                    className="da-skill-plaque__text"
                    x={0}
                    y={0}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {sk.icon ? `${sk.icon} ${sk.name}` : sk.name}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {armed && (
          <button
            type="button"
            className={`da-skill-core${flash ? ' da-skill-core--implode' : ''}`}
            onClick={doThrow}
            aria-label={t('astrolabeV64.check')}
            style={{ pointerEvents: 'auto' }}
          >
            <span className="da-skill-core__rune" aria-hidden="true">✦</span>
            <span className="da-skill-core__label">{t('astrolabeV64.check')}</span>
            {autoThrowEnabled && armed && autoThrowMs > 0 && (
              <span className="da-skill-core__countdown" aria-hidden="true">
                {(Math.ceil(autoThrowMs / 100) / 10).toFixed(1)}s
              </span>
            )}
          </button>
        )}

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
      </div>
    );
  }),
);

DestinyAstrolabeV64.displayName = 'DestinyAstrolabeV64';
