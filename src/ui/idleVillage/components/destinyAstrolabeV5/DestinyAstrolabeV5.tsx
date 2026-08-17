/**
 * DestinyAstrolabeV5 — host React del reliquiario.
 *
 * Il canvas è creato e posseduto dall'ENGINE: il div `.dav5-board` resta vuoto.
 * Qui vive solo ciò che deve restare NITIDO e IMMOBILE: la result plate, la
 * CTA, i toggle e la lista accessibile.
 *
 * Perché la plate è DOM e non canvas: durante il terremoto il canvas scuote e
 * la plate no. Quella immobilità è una prova visiva — ciò che ha detto il
 * risultato non è ciò che si è rotto.
 *
 * Le DUE righe della plate (PROVA / RISCHIO) esistono entrambe dall'arm, anche
 * quando il rischio è zero. Se la riga RISCHIO comparisse solo quando c'è un
 * pericolo, la sua sola apparizione sarebbe uno spoiler.
 *
 * Uso: <DestinyAstrolabeV5 skills={skills} onResolve={...} autoStart />
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
  createAstrolabeV5Engine,
  type AstrolabeV5EngineHandle,
  type AstrolabeV5Result,
  type EnginePhaseV5,
  type PillarReadout,
} from './engineV5';
import { pillarTierFor } from './pillars';
import type { AstrolabeSkill, GeometryInput } from '@/ui/idleVillage/components/destinyAstrolabeV3/geometry';
import type { AstrolabeV5Config } from '@/balancing/config/idleVillage/destinyAstrolabeV5/astrolabeV5Config';
import './astrolabe-v5.css';

export type { AstrolabeSkill, AstrolabeV5Result };

/** Contratto identico a `DestinyAstrolabeHandle` della V1: la promozione è una
 *  riga di import, non una migrazione. */
export interface DestinyAstrolabeV5Handle {
  roll: () => void;
  throw: () => void;
  skip: () => void;
}

export interface DestinyAstrolabeV5Props {
  skills: AstrolabeSkill[];
  difficulty?: number;
  critPct?: number;
  woundPct?: number;
  deathPct?: number;
  config?: Partial<AstrolabeV5Config>;
  onResolve?: (r: AstrolabeV5Result) => void;
  autoStart?: boolean;
  /** In partita i toggle di debug non si vedono. */
  hideThrowControls?: boolean;
  className?: string;
}

interface RiskState {
  declared: { deathPct: number; woundPct: number } | null;
  resolved: { riskRoll: number; wounded: boolean; dead: boolean } | null;
}

export const DestinyAstrolabeV5 = memo(
  forwardRef<DestinyAstrolabeV5Handle, DestinyAstrolabeV5Props>(function DestinyAstrolabeV5(
    {
      skills,
      difficulty = 50,
      critPct = 5,
      woundPct = 10,
      deathPct = 5,
      config,
      onResolve,
      autoStart = true,
      hideThrowControls = false,
      className,
    },
    ref,
  ) {
    const { t } = useTranslation('idleVillage');
    const rootRef = useRef<HTMLDivElement>(null);
    const boardRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<AstrolabeV5EngineHandle | null>(null);
    const onResolveRef = useRef(onResolve);
    onResolveRef.current = onResolve;

    const [phase, setPhase] = useState<EnginePhaseV5>('idle');
    const [armed, setArmed] = useState(false);
    const [result, setResult] = useState<AstrolabeV5Result | null>(null);
    const [risk, setRisk] = useState<RiskState>({ declared: null, resolved: null });
    const [readout, setReadout] = useState<PillarReadout[]>([]);
    const [boardPx, setBoardPx] = useState(380);
    const [mute, setMute] = useState(false);
    const [autoThrow, setAutoThrow] = useState(false);
    const [skipAnim, setSkipAnim] = useState(false);
    const muteRef = useRef(mute);
    muteRef.current = mute;

    const input: GeometryInput = { stats: skills, difficulty, critPct, woundPct, deathPct };
    const inputRef = useRef(input);

    useEffect(() => {
      const board = boardRef.current;
      if (!board) return;
      const reducedMotion =
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      const engine = createAstrolabeV5Engine(board, {
        input: inputRef.current,
        config,
        reducedMotion,
        onState: (s) => {
          setPhase(s);
          /* l'arm è il solo momento in cui il risultato precedente sparisce */
          if (s === 'arm' || s === 'ready') setResult(null);
        },
        onArmed: setArmed,
        onResolve: (r) => {
          setResult(r);
          onResolveRef.current?.(r);
        },
        onReadout: setReadout,
        onRiskDeclared: (d) => setRisk({ declared: d, resolved: null }),
        onRiskRevealed: (r) => setRisk((prev) => ({ ...prev, resolved: r })),
        onSound: () => {
          if (muteRef.current) return;
          /* la libreria suoni condivisa si aggancia qui */
        },
      });
      engineRef.current = engine;
      if (autoStart) engine.roll();

      /* il tier serve al CSS per decidere l'altezza del chrome */
      const ro = new ResizeObserver(() => {
        const w = board.getBoundingClientRect().width;
        if (w > 1) setBoardPx(Math.round(w));
      });
      ro.observe(board);

      return () => {
        ro.disconnect();
        engine.destroy();
        engineRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* push live dei cambi stat/difficoltà nel motore (morph) */
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

    useEffect(() => {
      if (skipAnim && (phase === 'arm' || phase === 'the-spin' || phase === 'risk')) {
        engineRef.current?.skip();
      }
    }, [skipAnim, phase]);

    useImperativeHandle(
      ref,
      () => ({
        roll: () => engineRef.current?.roll(),
        throw: doThrow,
        skip: () => engineRef.current?.skip(),
      }),
      [doThrow],
    );

    /* ── riga PROVA ── */
    const verdictKey = result
      ? result.outcome.success
        ? 'astrolabeV5.verdictSuccess'
        : result.outcome.nearMiss
          ? 'astrolabeV5.verdictNearMiss'
          : result.outcome.crit
            ? 'astrolabeV5.verdictCrit'
            : 'astrolabeV5.verdictFail'
      : null;

    /* ── riga RISCHIO ──────────────────────────────────────────────────────
       Tre stati, e ognuno dice una cosa diversa:
         1. dichiarato   → "quanto è pericoloso" (dall'arm, PRIMA del lancio:
            è ciò su cui il giocatore decide se spendere un consumabile)
         2. risolto      → "è successo / non è successo" (dopo il verdetto)
         3. nessuno      → il tiro non ha rischio, e lo dice comunque         */
    const totalRiskPct = (risk.declared?.deathPct ?? deathPct) + (risk.declared?.woundPct ?? woundPct);
    let riskText: string;
    let riskKind: string | undefined;
    let riskPending = false;
    if (risk.resolved) {
      if (risk.resolved.dead) {
        riskText = t('astrolabeV5.riskDead');
        riskKind = 'dead';
      } else if (risk.resolved.wounded) {
        riskText = t('astrolabeV5.riskWounded');
        riskKind = 'wound';
      } else {
        riskText = t('astrolabeV5.riskHeld');
      }
    } else if (totalRiskPct <= 0) {
      riskText = t('astrolabeV5.riskNone');
      riskPending = true;
    } else {
      riskText = t('astrolabeV5.riskDeclared', {
        death: risk.declared?.deathPct ?? deathPct,
        wound: risk.declared?.woundPct ?? woundPct,
      });
      riskPending = true;
    }

    const tier = pillarTierFor(boardPx);
    const showThrow = armed && !skipAnim;

    return (
      <div
        ref={rootRef}
        className={`dav5-box${className ? ` ${className}` : ''}`}
        data-tier={tier}
        data-phase={phase}
        data-testid="destiny-astrolabe-v5"
      >
        <div ref={boardRef} className="dav5-board" />

        <div className="dav5-chrome">
          <div className="dav5-plate">
            <div className="dav5-plate-row">
              <span className="dav5-plate-label">{t('astrolabeV5.trackCheck')}</span>
              <span className="dav5-plate-value" data-pending={!result} data-kind={result?.outcome.success ? 'success' : undefined}>
                {verdictKey ? t(verdictKey) : t('astrolabeV5.awaiting')}
              </span>
              <span className="dav5-plate-roll" data-pending={!result}>
                {result ? `d100 ${result.outcome.roll}` : 'd100 —'}
              </span>
            </div>
            <div className="dav5-plate-row">
              <span className="dav5-plate-label">{t('astrolabeV5.trackRisk')}</span>
              <span className="dav5-plate-value" data-pending={riskPending} data-kind={riskKind}>
                {riskText}
              </span>
              <span className="dav5-plate-roll" data-pending={!risk.resolved}>
                {risk.resolved ? `d100 ${risk.resolved.riskRoll}` : 'd100 —'}
              </span>
            </div>
          </div>

          <div className="dav5-cta-row">
            <button type="button" className="dav5-throw" onClick={doThrow} disabled={!showThrow}>
              {phase === 'done' ? t('astrolabeV5.rollAgain') : t('astrolabeV5.throw')}
            </button>
            {!hideThrowControls && (
              <fieldset className="dav5-controls">
                <legend className="dav5-sr-only">{t('astrolabeV5.throwControls')}</legend>
                <label className="dav5-toggle">
                  <input type="checkbox" checked={skipAnim} onChange={(e) => setSkipAnim(e.target.checked)} />
                  {t('astrolabeV5.skip')}
                </label>
                <label className="dav5-toggle">
                  <input type="checkbox" checked={autoThrow} disabled={skipAnim} onChange={(e) => setAutoThrow(e.target.checked)} />
                  {t('astrolabeV5.auto')}
                </label>
                <label className="dav5-toggle">
                  <input type="checkbox" checked={mute} onChange={(e) => setMute(e.target.checked)} />
                  {t('astrolabeV5.mute')}
                </label>
              </fieldset>
            )}
          </div>
        </div>

        {/* il confronto stat-vs-difficoltà è disegnato sui monoliti; qui la sua
            versione accessibile, che sostituisce le placche DOM ancorate di V3 */}
        <ul className="dav5-sr-only">
          {readout.map((r) => (
            <li key={r.axis}>
              {t('astrolabeV5.axisReadout', {
                skill: r.skillName,
                stat: r.stat,
                difficulty: r.difficulty,
                relation: t(`astrolabeV5.relation_${r.relation}`),
              })}
            </li>
          ))}
        </ul>
      </div>
    );
  }),
);

export default DestinyAstrolabeV5;
