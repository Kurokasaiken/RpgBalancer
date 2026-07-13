/**
 * DestinyAstrolabeV2 — V9-skinned skill-check astrolabe (ground-up rewrite).
 *
 * Canvas scene lives in engineV2 (faceted crystal + threshold dial + a
 * decelerating pointer). This host renders the V9 bezel, the prominent SOGLIA
 * badge, the hero-number payoff, the gem THROW button and the juice overlays
 * (hit-stop, screen bloom, screen-shake). All colours flow from `--skin-*`.
 */
import React, {
  forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState,
} from 'react';
import { useSkinBinding } from '@/ui/idleVillage/hooks/useSkinBinding';
import { useAstrolabeAudio } from '../destinyAstrolabe/useAstrolabeAudio';
import { createDestinyAstrolabeV2Engine } from './engineV2';
import type {
  AstrolabeSkill, AstrolabeConfig, AstrolabeResult, AstrolabeV2Handle,
} from './engineV2';
import './astrolabe-v2.css';

export type { AstrolabeSkill, AstrolabeConfig, AstrolabeResult };

export interface DestinyAstrolabeV2Handle { roll: () => void; throw: () => void; }

export interface DestinyAstrolabeV2Props {
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
  componentId: 'DestinyAstrolabeV2',
  name: 'DestinyAstrolabeV2',
  description: 'V9-skinned D100 skill-check astrolabe (crystal + threshold dial)',
  version: '2.0.0',
  defaultPreset: 'base',
  cssClassBase: 'destiny-astrolabe-v2',
  dataAttributePrefix: 'destiny-astrolabe-v2',
  category: 'interactive',
  priority: 1,
  tags: ['skillcheck', 'd100', 'astrolabe', 'v2'],
} as any;

const VERDICT_TEXT: Record<string, string> = {
  bigwin: 'Trionfo',
  win: 'Vittoria',
  almost: 'Per un soffio',
  fail: 'Sconfitta',
  epicfail: 'Rovina',
};

const computeTST = (s: AstrolabeSkill) => Math.max(1, Math.min(99, 50 + (s.stat - s.difficulty)));
const STUDS = 12;

export const DestinyAstrolabeV2 = memo(
  forwardRef<DestinyAstrolabeV2Handle, DestinyAstrolabeV2Props>(function DestinyAstrolabeV2(
    {
      skills, config, onResolve,
      autoStart = true, autoThrow = false, skipAnimation = false,
      removeSounds = false, hideThrowControls = false, className,
    },
    ref,
  ) {
    const arenaRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<AstrolabeV2Handle | null>(null);
    const onResolveRef = useRef(onResolve);
    onResolveRef.current = onResolve;

    const [armed, setArmed] = useState(false);
    const [gameState, setGameState] = useState('idle');
    const [flash, setFlash] = useState(false);
    const [freeze, setFreeze] = useState(false);
    const [shake, setShake] = useState(false);
    const [bloom, setBloom] = useState<'success' | 'failure' | null>(null);
    const [result, setResult] = useState<AstrolabeResult | null>(null);
    const [legendOpen, setLegendOpen] = useState(false);

    const [autoThrowEnabled, setAutoThrowEnabled] = useState(autoThrow);
    const [skipEnabled, setSkipEnabled] = useState(skipAnimation);
    const [muted, setMuted] = useState(removeSounds);

    const play = useAstrolabeAudio(muted);
    const { classes, attributes, styles } = useSkinBinding(SKIN_BINDING, {
      properties: { skillCount: skills.length },
    });

    const doThrow = useCallback(() => {
      engineRef.current?.throw();
      setFlash(true);
      window.setTimeout(() => setFlash(false), 200);
    }, []);

    // mount engine once
    useEffect(() => {
      const arena = arenaRef.current;
      if (!arena) return;
      const engine = createDestinyAstrolabeV2Engine(arena, {
        skills, config,
        onResolve: (r) => {
          onResolveRef.current?.(r);
          setResult(r);
          const ok = r.verdict === 'bigwin' || r.verdict === 'win' || r.verdict === 'almost';
          setBloom(ok ? 'success' : 'failure');
          window.setTimeout(() => setBloom(null), 760);
          play(ok ? 'success' : 'failure', { volume: 0.75 });
        },
        onArmed: (a) => setArmed(a),
        onState: (s) => {
          setGameState(s);
          if (s === 'ring-lock') setResult(null);
          if (s === 'action-trigger') play('arm', { volume: 0.55 });
          if (s === 'the-spin') play('spin', { volume: 0.5 });
          if (s === 'magnetic-snap') play('snap', { volume: 0.85 });
        },
        onSnap: () => {
          setFreeze(true); setShake(true);
          window.setTimeout(() => setFreeze(false), 150);
          window.setTimeout(() => setShake(false), 240);
        },
      });
      engineRef.current = engine;
      if (autoStart) engine.roll();
      return () => { engine.destroy(); engineRef.current = null; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // live config → engine
    useEffect(() => { engineRef.current?.setConfig(skills, config); }, [skills, config]);

    // skip: throw immediately once armed
    useEffect(() => { if (armed && skipEnabled) doThrow(); }, [armed, skipEnabled, doThrow]);
    // auto: throw 0.5s after arming
    useEffect(() => {
      if (!armed || !autoThrowEnabled || skipEnabled) return;
      const id = window.setTimeout(doThrow, 500);
      return () => window.clearTimeout(id);
    }, [armed, autoThrowEnabled, skipEnabled, doThrow]);

    useImperativeHandle(ref, () => ({
      roll: () => engineRef.current?.roll(),
      throw: () => engineRef.current?.throw(),
    }), []);

    const primaryTST = skills.length ? computeTST(skills[0]) : 65;
    const showGem = armed && !skipEnabled && !autoThrowEnabled && gameState === 'action-trigger';
    const isResolved = gameState === 'resolution' && !!result;
    const success = !!result && ['bigwin', 'win', 'almost'].includes(result.verdict);

    return (
      <div
        className={`da2-wrap destiny-astrolabe-v2 ${classes.join(' ')} ${shake ? 'is-shaking' : ''} ${className ?? ''}`.trim()}
        data-state={gameState}
        data-armed={armed ? 'true' : 'false'}
        {...attributes}
        style={styles}
      >
        <div className="da2-stage">
          <div className="da2-bezel" aria-hidden="true" />
          {Array.from({ length: STUDS }).map((_, i) => {
            const a = (i / STUDS) * Math.PI * 2 - Math.PI / 2;
            const rr = 48.3;
            return (
              <span
                key={i}
                className="da2-stud"
                aria-hidden="true"
                style={{
                  left: `calc(50% + ${Math.cos(a) * rr}% - 1.6%)`,
                  top: `calc(50% + ${Math.sin(a) * rr}% - 1.6%)`,
                }}
              />
            );
          })}
          <div className="da2-bezel-inner" aria-hidden="true" />

          {/* Canvas scene */}
          <div ref={arenaRef} className="da2-arena" data-testid="destiny-astrolabe-v2" />

          {/* Screen bloom (success = gold/azure, fail = cool) — NOT a full yellow filter */}
          {bloom && <div className={`da2-bloom is-${bloom}`} aria-hidden="true" />}
          {/* hit-stop flash */}
          {freeze && <div className="da2-freeze" aria-hidden="true" />}

          {/* SOGLIA badge — the DC, prominent */}
          <div className="da2-soglia" aria-hidden={!armed && gameState !== 'the-spin'}>
            <span className="da2-soglia__label">Soglia</span>
            <span className="da2-soglia__value">{primaryTST}</span>
          </div>

          {/* Hero number + delta + verdict */}
          {isResolved && result && (
            <div
              className="da2-hero is-on"
              style={{
                ['--da2-hero-glow' as any]: success ? 'rgba(247,221,128,0.55)' : 'rgba(217,138,74,0.45)',
                ['--da2-delta' as any]: success ? 'var(--da2-warm)' : 'var(--da2-danger)',
              }}
            >
              <div className="da2-hero__roll">{result.roll}</div>
              <div className="da2-hero__delta">
                {success
                  ? `▲ ${Math.max(0, result.tst - result.roll)} sotto la soglia`
                  : `▼ ${Math.max(1, result.roll - result.tst)} oltre la soglia`}
              </div>
              <div className="da2-hero__verdict">{VERDICT_TEXT[result.verdict] ?? result.verdict}</div>
              {(result.dead || result.wounded) && (
                <div className="da2-hero__chips">
                  <span className="da2-hero__chip">{result.dead ? 'Caduto' : 'Ferito'}</span>
                </div>
              )}
            </div>
          )}

          {/* Gem THROW button */}
          {showGem && (
            <button
              type="button"
              className={`da2-gem${flash ? ' is-flash' : ''}`}
              onClick={doThrow}
              aria-label="Lancia"
            >
              TIRA
            </button>
          )}

          {/* Info toggle + legend */}
          <button
            type="button"
            className="da2-legend-toggle"
            onClick={() => setLegendOpen((v) => !v)}
            aria-label="Come si legge l'astrolabio"
            title="Come si legge l'astrolabio"
          >
            ?
          </button>
          {legendOpen && (
            <div className="da2-legend" role="dialog" aria-label="Legenda">
              <h3>Come leggere l'astrolabio</h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                <li><span className="swatch" style={{ background: 'var(--da2-gold)' }} /><b>Arco dorato</b> — zona di successo: tanto più ampia quanto più alta è la tua soglia (SOGLIA {primaryTST}).</li>
                <li><span className="swatch" style={{ background: 'var(--da2-danger)' }} /><b>Arco arancio</b> — zona di fallimento.</li>
                <li><span className="swatch" style={{ background: 'var(--da2-azure)' }} /><b>Cristallo centrale</b> — la minaccia: più è grande, più il check è difficile.</li>
                <li><span className="swatch" style={{ background: 'var(--da2-warm)' }} /><b>Aghi d'oro</b> — le tue statistiche.</li>
                <li>La <b>lancetta</b> decelera sul quadrante: dove si ferma decide il tuo D100.</li>
              </ul>
            </div>
          )}

          {/* Throw controls */}
          {!hideThrowControls && (
            <fieldset className="da2-controls">
              <legend className="sr-only">Controlli</legend>
              <label className="da2-control">
                <input type="checkbox" checked={skipEnabled} onChange={(e) => setSkipEnabled(e.target.checked)} />
                <span>Skip</span>
              </label>
              <label className="da2-control">
                <input type="checkbox" checked={autoThrowEnabled} disabled={skipEnabled} onChange={(e) => setAutoThrowEnabled(e.target.checked)} />
                <span>Auto</span>
              </label>
              <label className="da2-control">
                <input type="checkbox" checked={muted} onChange={(e) => setMuted(e.target.checked)} />
                <span>Mute</span>
              </label>
            </fieldset>
          )}
        </div>
      </div>
    );
  }),
);

DestinyAstrolabeV2.displayName = 'DestinyAstrolabeV2';
