import React, { useEffect, useState } from 'react';
import { HaloCorona } from './HaloCorona';

export const HaloCoronaLab: React.FC = () => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const TOTAL_DURATION = 30000; // 30 seconds for demo

  useEffect(() => {
    if (!isRunning) return;

    const startTime = Date.now();
    const loop = () => {
      const now = Date.now();
      const elapsed = (now - startTime + elapsedMs) % (TOTAL_DURATION * 2); // Cycle through twice
      setElapsedMs(elapsed);
      requestAnimationFrame(loop);
    };

    const frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isRunning, elapsedMs]);

  const timeRemaining = Math.max(0, TOTAL_DURATION - elapsedMs);
  const fraction = timeRemaining / TOTAL_DURATION;

  return (
    <div
      style={{
        padding: '32px 24px',
        background: 'linear-gradient(135deg, rgba(20,15,10,0.95) 0%, rgba(30,22,15,0.95) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(192,160,60,0.2)',
        marginTop: '32px',
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <h3
          style={{
            fontFamily: 'var(--skin-font-display)',
            fontSize: 14,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--skin-title-color)',
            margin: '0 0 16px',
          }}
        >
          Halo Corona — Countdown Stages
        </h3>
        <p
          style={{
            fontFamily: 'var(--skin-font-serif)',
            fontSize: 13,
            color: 'rgba(210,180,150,0.8)',
            margin: '0 0 12px',
            lineHeight: 1.5,
          }}
        >
          Three-stage escalation: <strong>calm</strong> {'>'} 50% → <strong>alert</strong> {'>'} 15% → <strong>critical</strong> {'<'} 15%.
          The halo fills from bottom-right (12 o'clock) antiorario (CCW) on alert/critical states. Color and pulse intensity escalate monotonously.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '32px',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <HaloCorona
          timeRemainingMs={timeRemaining}
          totalDurationMs={TOTAL_DURATION}
          size={140}
          showDebug={true}
        />

        <div
          style={{
            flex: 1,
            minWidth: 200,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: 12, color: 'rgba(210,180,150,0.7)', fontFamily: 'monospace' }}>
            <div>Time remaining: <span style={{ color: 'rgba(255,200,100,0.9)' }}>{timeRemaining.toFixed(0)}ms</span></div>
            <div>Fraction: <span style={{ color: 'rgba(255,200,100,0.9)' }}>{(fraction * 100).toFixed(1)}%</span></div>
            <div style={{ marginTop: '8px' }}>
              Stage:{' '}
              <span
                style={{
                  color:
                    fraction > 0.5
                      ? 'rgba(100,200,100,0.9)'
                      : fraction > 0.15
                        ? 'rgba(255,180,60,0.9)'
                        : 'rgba(255,80,80,0.9)',
                }}
              >
                {fraction > 0.5 ? 'CALM' : fraction > 0.15 ? 'ALERT' : 'CRITICAL'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsRunning(!isRunning)}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: 'rgba(192,160,60,0.15)',
              border: '1px solid rgba(192,160,60,0.4)',
              color: 'var(--skin-title-color)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'var(--skin-font-display)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(192,160,60,0.25)';
              e.currentTarget.style.borderColor = 'rgba(192,160,60,0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(192,160,60,0.15)';
              e.currentTarget.style.borderColor = 'rgba(192,160,60,0.4)';
            }}
          >
            {isRunning ? '⏸ Pause' : '▶ Play'}
          </button>
        </div>
      </div>

      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '6px',
          fontSize: 11,
          color: 'rgba(210,180,150,0.6)',
          fontFamily: 'monospace',
          lineHeight: 1.6,
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          <strong style={{ color: 'rgba(255,200,100,0.8)' }}>Stage transitions:</strong>
        </div>
        <div>{'>'} 50%: Calm (base color, no rotation)</div>
        <div>{'≤'} 50%: Alert (color shift, CCW rotation, medium pulse)</div>
        <div>{'≤'} 15%: Critical (max color shift, max rotation + tremor, aggressive pulse)</div>
        <div style={{ marginTop: '8px', color: 'rgba(255,150,100,0.7)' }}>
          ↪ Halo fills antiorario from top (12 o'clock), discharged when timer reaches zero.
        </div>
      </div>
    </div>
  );
};
