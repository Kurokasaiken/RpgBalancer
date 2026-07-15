/**
 * DestinyAstrolabeV3 — host React del canvas engine V3.
 *
 * Layer React: testo nitido (verdetto, label obelischi, tooltips onboarding),
 * THROW, toggle Skip/Auto/Mute. L'arena resta SEMPRE visibile alla resolution
 * (banner in fascia alta, mai fog sopra il punto di atterraggio).
 *
 * Uso: <DestinyAstrolabeV3 skills={skills} onResolve={...} autoStart />
 */
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  createAstrolabeV3Engine,
  type AstrolabeV3EngineHandle,
  type AstrolabeV3Result,
  type EnginePhase,
} from './engineV3';
import type { AstrolabeSkill, GeometryInput } from './geometry';
import type { AstrolabeModifier } from './modifiers';
import type { AstrolabeV3Config } from '@/balancing/config/idleVillage/destinyAstrolabeV3/astrolabeV3Config';
import { shouldShowOnboarding, recordOnboardingView } from './onboarding';
import './astrolabe-v3.css';

export interface DestinyAstrolabeV3Handle {
  roll: () => void;
  throw: () => void;
  previewModifier: (m: AstrolabeModifier) => void;
  clearPreview: () => void;
  applyModifier: (m: AstrolabeModifier) => void;
  revokeModifier: (id: string) => void;
}

export interface DestinyAstrolabeV3Props {
  skills: AstrolabeSkill[];
  difficulty?: number;
  critPct?: number;
  woundPct?: number;
  deathPct?: number;
  config?: Partial<AstrolabeV3Config>;
  onResolve?: (r: AstrolabeV3Result) => void;
  autoStart?: boolean;
  className?: string;
}

interface Anchor {
  x: number;
  y: number;
  axis: number;
  skill: number;
}

const ONBOARDING_STEPS: Record<string, string> = {
  'agency-burst': 'onboardingStar',
  'risk-pour': 'onboardingRisk',
  'action-trigger': 'onboardingThrow',
};

export const DestinyAstrolabeV3 = memo(
  forwardRef<DestinyAstrolabeV3Handle, DestinyAstrolabeV3Props>(function DestinyAstrolabeV3(
    {
      skills,
      difficulty = 50,
      critPct = 5,
      woundPct = 10,
      deathPct = 5,
      config,
      onResolve,
      autoStart = true,
      className,
    },
    ref,
  ) {
    const { t } = useTranslation('idleVillage');
    const rootRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<AstrolabeV3EngineHandle | null>(null);
    const onResolveRef = useRef(onResolve);
    onResolveRef.current = onResolve;

    const [phase, setPhase] = useState<EnginePhase>('idle');
    const [armed, setArmed] = useState(false);
    const [result, setResult] = useState<AstrolabeV3Result | null>(null);
    const [anchors, setAnchors] = useState<Anchor[]>([]);
    const [mute, setMute] = useState(false);
    const [autoThrow, setAutoThrow] = useState(false);
    const [skipAnim, setSkipAnim] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const muteRef = useRef(mute);
    muteRef.current = mute;

    const input: GeometryInput = { stats: skills, difficulty, critPct, woundPct, deathPct };
    const inputRef = useRef(input);

    useEffect(() => {
      let mounted = true;
      shouldShowOnboarding().then((show) => {
        if (mounted && show) {
          setShowOnboarding(true);
          void recordOnboardingView();
        }
      });
      return () => {
        mounted = false;
      };
    }, []);

    useEffect(() => {
      const root = rootRef.current;
      if (!root) return;
      const reducedMotion =
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      const engine = createAstrolabeV3Engine(root, {
        input: inputRef.current,
        config,
        reducedMotion,
        onState: (s) => {
          setPhase(s);
          if (s === 'ring-lock') setResult(null);
        },
        onArmed: setArmed,
        onResolve: (r) => {
          setResult(r);
          onResolveRef.current?.(r);
        },
        onLayout: setAnchors,
        onSound: () => {
          /* hook sonoro a stadi (§6): silenziato via toggle; l'audio reale
             arriverà con la libreria suoni condivisa */
          if (muteRef.current) return;
        },
      });
      engineRef.current = engine;
      if (autoStart) engine.roll();
      return () => {
        engine.destroy();
        engineRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* push live dei cambi config/stat nel motore (morph 300ms) */
    useEffect(() => {
      inputRef.current = input;
      engineRef.current?.setInput(input);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(input)]);

    const doThrow = useCallback(() => engineRef.current?.throw(), []);

    useEffect(() => {
      if (!armed) return;
      if (skipAnim) {
        doThrow();
        return;
      }
      if (autoThrow) {
        const id = window.setTimeout(doThrow, 500);
        return () => window.clearTimeout(id);
      }
    }, [armed, skipAnim, autoThrow, doThrow]);

    /* Skip attivato durante lo spin → salto diretto a snap+resolution (§5) */
    useEffect(() => {
      if (skipAnim && (phase === 'the-spin' || phase === 'ring-lock' || phase === 'threat-slam' || phase === 'agency-burst' || phase === 'risk-pour')) {
        engineRef.current?.skip();
      }
    }, [skipAnim, phase]);

    useImperativeHandle(
      ref,
      () => ({
        roll: () => engineRef.current?.roll(),
        throw: doThrow,
        previewModifier: (m) => engineRef.current?.previewModifier(m),
        clearPreview: () => engineRef.current?.clearPreview(),
        applyModifier: (m) => engineRef.current?.applyModifier(m),
        revokeModifier: (id) => engineRef.current?.revokeModifier(id),
      }),
      [doThrow],
    );

    const verdictKey = result
      ? result.outcome.success
        ? 'astrolabeV3.verdictSuccess'
        : result.outcome.nearMiss
          ? 'astrolabeV3.verdictNearMiss'
          : result.outcome.crit
            ? 'astrolabeV3.verdictCrit'
            : 'astrolabeV3.verdictFail'
      : null;

    const showLabels = phase !== 'idle' && phase !== 'ring-lock' && anchors.length > 0;
    const onboardingKey = showOnboarding ? ONBOARDING_STEPS[phase] : undefined;

    return (
      <div className={`dav3-wrap ${className ?? ''}`.trim()} data-phase={phase}>
        <div ref={rootRef} className="dav3-canvas-root" data-testid="destiny-astrolabe-v3" />

        {/* label obelischi su placche laterali (testo nitido nel layer React) */}
        {showLabels &&
          anchors.map((an) => {
            const skill = skills[an.skill];
            if (!skill) return null;
            return (
              <div
                key={an.axis}
                className="dav3-obelisk-plaque"
                style={{ left: an.x, top: an.y }}
              >
                <span className="dav3-plaque-name">{skill.name}</span>
                <span className="dav3-plaque-value">{skill.stat}</span>
              </div>
            );
          })}

        {/* onboarding contestuale — micro-tooltip sincronizzati con le fasi */}
        {onboardingKey && (
          <div className="dav3-onboarding" role="status">
            {t(onboardingKey, { defaultValue: '' })}
          </div>
        )}

        {/* verdetto: fascia alta, l'arena resta visibile */}
        {result && verdictKey && (
          <div
            className={`dav3-verdict dav3-verdict--${
              result.outcome.success ? 'success' : 'failure'
            }`}
            role="status"
          >
            <span className="dav3-verdict-title">{t(verdictKey)}</span>
            <span className="dav3-verdict-chips">
              {result.outcome.wounded && (
                <span className="dav3-chip dav3-chip--wound">{t('astrolabeV3.wounded')}</span>
              )}
              {result.outcome.dead && (
                <span className="dav3-chip dav3-chip--death">{t('astrolabeV3.dead')}</span>
              )}
            </span>
          </div>
        )}

        {/* THROW — unico attore oro caldo */}
        {armed && !skipAnim && !autoThrow && (
          <button type="button" className="dav3-throw" onClick={doThrow}>
            {t('THROW', { defaultValue: 'THROW' })}
          </button>
        )}
        {phase === 'resolution' && (
          <button
            type="button"
            className="dav3-throw dav3-throw--again"
            onClick={() => engineRef.current?.roll()}
          >
            {t('astrolabeV3.rollAgain')}
          </button>
        )}

        {/* controlli lancio */}
        <fieldset className="dav3-controls">
          <legend className="sr-only">{t('astrolabeV3.throwControls')}</legend>
          <label className="dav3-toggle">
            <input
              type="checkbox"
              checked={skipAnim}
              onChange={(e) => setSkipAnim(e.target.checked)}
            />
            <span>{t('astrolabeV3.skip')}</span>
          </label>
          <label className="dav3-toggle">
            <input
              type="checkbox"
              checked={autoThrow}
              disabled={skipAnim}
              onChange={(e) => setAutoThrow(e.target.checked)}
            />
            <span>{t('astrolabeV3.auto')}</span>
          </label>
          <label className="dav3-toggle">
            <input type="checkbox" checked={mute} onChange={(e) => setMute(e.target.checked)} />
            <span>{t('astrolabeV3.mute')}</span>
          </label>
        </fieldset>
      </div>
    );
  }),
);

DestinyAstrolabeV3.displayName = 'DestinyAstrolabeV3';

export default DestinyAstrolabeV3;
