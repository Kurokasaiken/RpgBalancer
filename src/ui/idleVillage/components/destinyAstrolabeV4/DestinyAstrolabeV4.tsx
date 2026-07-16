/**
 * DestinyAstrolabeV4 — host React dell'engine V4.
 * Differenze estetiche dalla V3 (assi rubati alla V1):
 *  - CLIMAX TIPOGRAFICO: verdetto monumentale con lettere in stagger che si
 *    assestano (successo) o si sgretolano (fallimento), in fascia alta —
 *    l'arena e il landing point restano SEMPRE visibili;
 *  - screen-punch (shake) sul contatto finale;
 *  - placche label spinte fuori dal bordo sfida (anti-collisione).
 */
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  createAstrolabeV4Engine,
  type AstrolabeV4EngineHandle,
  type AstrolabeV4Result,
  type EnginePhase,
} from './engineV4';
import type { AstrolabeSkill, GeometryInput } from '../destinyAstrolabeV3/geometry';
import type { AstrolabeModifier } from '../destinyAstrolabeV3/modifiers';
import type { AstrolabeV3Config } from '@/balancing/config/idleVillage/destinyAstrolabeV3/astrolabeV3Config';
import {
  shouldShowOnboarding,
  recordOnboardingView,
} from '../destinyAstrolabeV3/onboarding';
import './astrolabe-v4.css';

export interface DestinyAstrolabeV4Handle {
  roll: () => void;
  throw: () => void;
  previewModifier: (m: AstrolabeModifier) => void;
  clearPreview: () => void;
  applyModifier: (m: AstrolabeModifier) => void;
  revokeModifier: (id: string) => void;
}

export interface DestinyAstrolabeV4Props {
  skills: AstrolabeSkill[];
  difficulty?: number;
  critPct?: number;
  woundPct?: number;
  deathPct?: number;
  config?: Partial<AstrolabeV3Config>;
  onResolve?: (r: AstrolabeV4Result) => void;
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
  'agency-burst': 'astrolabeV3.onboardingStar',
  'risk-pour': 'astrolabeV3.onboardingRisk',
  'action-trigger': 'astrolabeV3.onboardingThrow',
};

/** Lettere del verdetto con offset/rotazioni deterministici per indice. */
function verdictLetters(title: string) {
  return [...title].map((ch, i) => {
    const dx = (Math.sin(i * 12.9898) * 4).toFixed(1);
    const dy = (6 + ((Math.sin(i * 78.233) + 1) / 2) * 10).toFixed(1);
    const rot = (Math.sin(i * 43.758) * 5).toFixed(1);
    const del = (0.05 + ((Math.sin(i * 91.7) + 1) / 2) * 0.3).toFixed(2);
    return { ch, dx, dy, rot, del, key: i };
  });
}

export const DestinyAstrolabeV4 = memo(
  forwardRef<DestinyAstrolabeV4Handle, DestinyAstrolabeV4Props>(function DestinyAstrolabeV4(
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
    const engineRef = useRef<AstrolabeV4EngineHandle | null>(null);
    const onResolveRef = useRef(onResolve);
    onResolveRef.current = onResolve;

    const [phase, setPhase] = useState<EnginePhase>('idle');
    const [armed, setArmed] = useState(false);
    const [result, setResult] = useState<AstrolabeV4Result | null>(null);
    const [anchors, setAnchors] = useState<Anchor[]>([]);
    const [mute, setMute] = useState(false);
    const [autoThrow, setAutoThrow] = useState(false);
    const [skipAnim, setSkipAnim] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [punch, setPunch] = useState(false);
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
      const engine = createAstrolabeV4Engine(root, {
        input: inputRef.current,
        config,
        reducedMotion,
        onState: (s) => {
          setPhase(s);
          if (s === 'ring-lock') setResult(null);
          if (s === 'magnetic-snap' && !reducedMotion) {
            setPunch(true);
            window.setTimeout(() => setPunch(false), 450);
          }
        },
        onArmed: setArmed,
        onResolve: (r) => {
          setResult(r);
          onResolveRef.current?.(r);
        },
        onLayout: setAnchors,
        onSound: () => {
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

    /* Skip attivato durante lo spin/reveal → salto a snap+resolution (§5) */
    useEffect(() => {
      if (
        skipAnim &&
        ['the-spin', 'ring-lock', 'threat-slam', 'agency-burst', 'risk-pour'].includes(phase)
      ) {
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

    const verdict = useMemo(() => {
      if (!result) return null;
      const { outcome } = result;
      const key = outcome.success
        ? 'astrolabeV3.verdictSuccess'
        : outcome.nearMiss
          ? 'astrolabeV3.verdictNearMiss'
          : outcome.crit
            ? 'astrolabeV3.verdictCrit'
            : 'astrolabeV3.verdictFail';
      const subKey = outcome.success
        ? 'astrolabeV4.subSuccess'
        : outcome.nearMiss
          ? 'astrolabeV4.subNearMiss'
          : outcome.crit
            ? 'astrolabeV4.subCrit'
            : 'astrolabeV4.subFail';
      return {
        title: t(key),
        sub: t(subKey, { defaultValue: '' }),
        tone: outcome.success ? 'success' : outcome.nearMiss ? 'almost' : 'failure',
        letters: verdictLetters(t(key)),
      };
    }, [result, t]);

    const showLabels = phase !== 'idle' && phase !== 'ring-lock' && anchors.length > 0;
    const onboardingKey = showOnboarding ? ONBOARDING_STEPS[phase] : undefined;

    return (
      <div
        className={`dav4-wrap ${punch ? 'dav4-wrap--punch' : ''} ${className ?? ''}`.trim()}
        data-phase={phase}
      >
        <div ref={rootRef} className="dav4-canvas-root" data-testid="destiny-astrolabe-v4" />

        {showLabels &&
          anchors.map((an) => {
            const skill = skills[an.skill];
            if (!skill) return null;
            return (
              <div key={an.axis} className="dav4-obelisk-plaque" style={{ left: an.x, top: an.y }}>
                <span className="dav4-plaque-name">{skill.name}</span>
                <span className="dav4-plaque-value">{skill.stat}</span>
              </div>
            );
          })}

        {onboardingKey && (
          <div className="dav4-onboarding" role="status">
            {t(onboardingKey, { defaultValue: '' })}
          </div>
        )}

        {/* CLIMAX TIPOGRAFICO — fascia alta, arena sempre visibile */}
        {phase === 'resolution' && verdict && (
          <div className={`dav4-verdict dav4-verdict--${verdict.tone}`} role="status">
            <div className="dav4-verdict-title" aria-label={verdict.title}>
              {verdict.letters.map((l) => (
                <span
                  key={l.key}
                  className="dav4-ch"
                  style={
                    {
                      '--dx': `${l.dx}px`,
                      '--dy': `${l.dy}px`,
                      '--rot': `${l.rot}deg`,
                      '--del': `${l.del}s`,
                    } as React.CSSProperties
                  }
                >
                  {l.ch === ' ' ? ' ' : l.ch}
                </span>
              ))}
            </div>
            {verdict.sub && <div className="dav4-verdict-sub">{verdict.sub}</div>}
            <div className="dav4-verdict-chips">
              {result?.outcome.wounded && (
                <span className="dav4-chip dav4-chip--wound">{t('astrolabeV3.wounded')}</span>
              )}
              {result?.outcome.dead && (
                <span className="dav4-chip dav4-chip--death">{t('astrolabeV3.dead')}</span>
              )}
            </div>
          </div>
        )}

        {armed && !skipAnim && !autoThrow && (
          <button type="button" className="dav4-throw" onClick={doThrow}>
            {t('THROW', { defaultValue: 'THROW' })}
          </button>
        )}
        {phase === 'resolution' && (
          <button
            type="button"
            className="dav4-throw dav4-throw--again"
            onClick={() => engineRef.current?.roll()}
          >
            {t('astrolabeV3.rollAgain')}
          </button>
        )}

        <fieldset className="dav4-controls">
          <legend className="sr-only">{t('astrolabeV3.throwControls')}</legend>
          <label className="dav4-toggle">
            <input
              type="checkbox"
              checked={skipAnim}
              onChange={(e) => setSkipAnim(e.target.checked)}
            />
            <span>{t('astrolabeV3.skip')}</span>
          </label>
          <label className="dav4-toggle">
            <input
              type="checkbox"
              checked={autoThrow}
              disabled={skipAnim}
              onChange={(e) => setAutoThrow(e.target.checked)}
            />
            <span>{t('astrolabeV3.auto')}</span>
          </label>
          <label className="dav4-toggle">
            <input type="checkbox" checked={mute} onChange={(e) => setMute(e.target.checked)} />
            <span>{t('astrolabeV3.mute')}</span>
          </label>
        </fieldset>
      </div>
    );
  }),
);

DestinyAstrolabeV4.displayName = 'DestinyAstrolabeV4';

export default DestinyAstrolabeV4;
