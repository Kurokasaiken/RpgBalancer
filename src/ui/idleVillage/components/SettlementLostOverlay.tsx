/**
 * SettlementLostOverlay — the run-ending takeover (R-072 scene 5, direction C).
 *
 * Active when `useMinimalGameplayStore.gameOverState` is
 * `{ isGameOver: true, reason: 'settlement_lost' }`. The takeover sequence:
 *  1. `iris`    — a dark vignette sweeps over the viewport while the world
 *                 surface under it is re-graded to the oxidised ramp (the page
 *                 applies `filter: url(#<filterId>)` on its world container).
 *  2. `verdict` — the verdict card fades in: title, loss beats (narrative
 *                 flavour from config), real run stats from
 *                 `gameOverState.summary` when present, and the CTA.
 *
 * Blocking by design — Director ratified 2026-09-16: no ESC, no backdrop
 * dismiss, focus trapped until the run is acknowledged via `resetGame()`.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { settlementLostConfig } from '@/balancing/config/idleVillage/settlementLostConfig';
import { OxidizedGradeFilter } from './OxidizedGradeFilter';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

type Phase = 'iris' | 'verdict';

export const SettlementLostOverlay: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  const gameOverState = useMinimalGameplayStore((s) => s.gameOverState);
  const resetGame = useMinimalGameplayStore((s) => s.resetGame);
  const reducedMotion = useReducedMotion();

  const active = gameOverState.isGameOver && gameOverState.reason === 'settlement_lost';
  const [phase, setPhase] = useState<Phase>('iris');
  const dialogRef = useRef<HTMLDivElement>(null);
  const verdictShownRef = useRef(false);

  // The iris sweep is skipped entirely under reduced motion.
  useEffect(() => {
    if (!active) {
      setPhase('iris');
      verdictShownRef.current = false;
      return;
    }
    if (reducedMotion) {
      setPhase('verdict');
      return;
    }
    const timer = window.setTimeout(
      () => setPhase('verdict'),
      settlementLostConfig.irisDurationMs,
    );
    return () => window.clearTimeout(timer);
  }, [active, reducedMotion]);

  useEffect(() => {
    if (active && phase === 'verdict' && !verdictShownRef.current) {
      verdictShownRef.current = true;
      trackTelemetryEvent('settlement_lost_verdict_shown', {
        eventType: 'settlement_lost_verdict_shown',
        data: {
          daysSurvived: gameOverState.summary?.daysSurvived ?? 0,
          residentsLost: gameOverState.summary?.residentsLost ?? 0,
        },
        context: 'settlement-lost-overlay',
        timestamp: Date.now(),
        metadata: {},
      });
      dialogRef.current?.focus();
    }
  }, [active, phase, gameOverState.summary]);

  // Focus trap: Tab cycles inside the dialog, ESC is swallowed. The run is
  // over — the only way out is the CTA.
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      return;
    }
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) {
      e.preventDefault();
      dialogRef.current.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  const handleAcknowledge = useCallback(() => {
    trackTelemetryEvent('settlement_lost_verdict_ack', {
      eventType: 'settlement_lost_verdict_ack',
      data: { reason: gameOverState.reason },
      context: 'settlement-lost-overlay',
      timestamp: Date.now(),
      metadata: {},
    });
    resetGame();
  }, [resetGame, gameOverState.reason]);

  if (!active) return null;

  const { copy, lossBeatKeys, cardFadeDurationMs, irisDurationMs, backdropOpacity } =
    settlementLostConfig;
  const summary = gameOverState.summary;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 90, pointerEvents: 'auto' }}
      data-testid="settlement-lost-overlay"
    >
      <OxidizedGradeFilter />

      {/* Iris: vignette + backdrop sweep over the viewport. */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: irisDurationMs / 1000, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(4, 10, 9, ${backdropOpacity})`,
        }}
      />
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: irisDurationMs / 1000, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 22%, rgba(6, 14, 12, 0.92) 78%)',
        }}
      />

      {/* Verdict card */}
      <AnimatePresence>
        {phase === 'verdict' && (
          <motion.div
            key="verdict"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: cardFadeDurationMs / 1000, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              ref={dialogRef}
              role="alertdialog"
              aria-modal="true"
              aria-live="assertive"
              aria-labelledby="settlement-lost-title"
              aria-describedby="settlement-lost-subtitle"
              tabIndex={-1}
              onKeyDown={handleKeyDown}
              style={{
                maxWidth: 460,
                width: 'calc(100% - 32px)',
                borderRadius: 16,
                padding: 24,
                outline: 'none',
                color: '#d7e2dc',
                background:
                  'radial-gradient(ellipse at 25% 8%, rgba(255,255,255,.06), transparent 42%), ' +
                  'radial-gradient(ellipse at 85% 95%, rgba(58,142,120,.12), transparent 48%), ' +
                  'linear-gradient(135deg, #0b1512 0%, #101f1a 45%, #081310 100%)',
                boxShadow:
                  'inset 0 1px rgba(255,255,255,.09), inset 0 -2px rgba(0,0,0,.7), ' +
                  '0 4px 4px rgba(0,0,0,.5), 0 14px 30px rgba(0,0,0,.45)',
                border: '1px solid rgba(131, 153, 140, 0.35)',
              }}
            >
              <h1
                id="settlement-lost-title"
                style={{
                  margin: 0,
                  textAlign: 'center',
                  fontSize: 28,
                  letterSpacing: '0.14em',
                  color: '#e8efe9',
                  textShadow: '0 2px 12px rgba(0,0,0,.6)',
                }}
              >
                {t(copy.titleKey)}
              </h1>
              <p
                id="settlement-lost-subtitle"
                style={{ margin: '10px 0 0', textAlign: 'center', color: '#9fb3a8', fontSize: 14 }}
              >
                {t(copy.subtitleKey)}
              </p>

              <h2
                style={{
                  margin: '18px 0 8px',
                  fontSize: 12,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#7d938a',
                  textAlign: 'center',
                }}
              >
                {t(copy.lossesTitleKey)}
              </h2>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {lossBeatKeys.map((key) => (
                  <li
                    key={key}
                    style={{
                      padding: '6px 10px',
                      marginTop: 6,
                      borderRadius: 8,
                      background: 'rgba(255,255,255,.04)',
                      border: '1px solid rgba(131,153,140,.2)',
                      fontSize: 13,
                    }}
                  >
                    {t(key)}
                  </li>
                ))}
              </ul>

              {summary && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 8,
                    marginTop: 16,
                  }}
                >
                  {[
                    { label: t('world.settlementLost.stats.daysSurvived'), value: summary.daysSurvived },
                    { label: t('world.settlementLost.stats.residentsLost'), value: summary.residentsLost },
                    { label: t('world.settlementLost.stats.goldEarned'), value: summary.goldEarned },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      style={{
                        textAlign: 'center',
                        padding: '8px 4px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,.05)',
                        border: '1px solid rgba(131,153,140,.2)',
                      }}
                    >
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#e8efe9' }}>
                        {stat.value}
                      </div>
                      <div style={{ fontSize: 11, color: '#9fb3a8' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  autoFocus
                  style={{
                    padding: '10px 26px',
                    borderRadius: 10,
                    border: '1px solid rgba(131,153,140,.5)',
                    background: 'linear-gradient(180deg, #3a6b5e 0%, #2a5045 100%)',
                    color: '#eef4f0',
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                  }}
                >
                  {t(copy.ctaKey)}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettlementLostOverlay;
