import React, { useEffect, useState } from 'react';
import { ClockPoiSkin } from '../idleVillage/components/minimal/ClockPoiSkin';

export const ClockPoiTestPage: React.FC = () => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isDayPhase, setIsDayPhase] = useState(true);
  const CYCLE_DURATION = 30000; // 30 seconds per phase (day/night)

  useEffect(() => {
    if (!isRunning) return;

    const startTime = Date.now();
    const loop = () => {
      const now = Date.now();
      const elapsed = (now - startTime + elapsedMs) % (CYCLE_DURATION * 2); // Cycle through day and night
      setElapsedMs(elapsed);

      // Switch phase at halfway point
      const currentPhase = Math.floor((elapsed / CYCLE_DURATION) % 2) === 0;
      setIsDayPhase(currentPhase);

      requestAnimationFrame(loop);
    };

    const frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isRunning, elapsedMs]);

  const cycleProgress = (elapsedMs % CYCLE_DURATION) / CYCLE_DURATION;

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '40px 24px',
        background: 'linear-gradient(135deg, rgba(20,15,10,0.95) 0%, rgba(30,22,15,0.95) 100%)',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1
          style={{
            color: 'rgba(210,180,150,0.9)',
            textAlign: 'center',
            marginBottom: 40,
            fontFamily: 'var(--skin-font-display, serif)',
            fontSize: 24,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          Clock POI Skin Test
        </h1>

        <div
          style={{
            padding: '32px 24px',
            background: 'linear-gradient(135deg, rgba(20,15,10,0.95) 0%, rgba(30,22,15,0.95) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(192,160,60,0.2)',
            marginBottom: 32,
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--skin-font-display, serif)',
              fontSize: 14,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--skin-title-color, rgba(210,180,150,0.9))',
              margin: '0 0 16px',
            }}
          >
            Clock POI — Day/Night Dial
          </h3>

          <p
            style={{
              fontFamily: 'var(--skin-font-serif, serif)',
              fontSize: 13,
              color: 'rgba(210,180,150,0.8)',
              margin: '0 0 12px',
              lineHeight: 1.5,
            }}
          >
            Corona halo with day/night phase. Same aesthetic as POI countdown,
            but logicremains separate: no expiry escalation, just cycle progress.
            Colors: warm gold (day) ↔ cool blue (night).
          </p>

          <div
            style={{
              display: 'flex',
              gap: '32px',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              marginBottom: '20px',
            }}
          >
            <ClockPoiSkin
              isDayPhase={isDayPhase}
              cycleProgress={cycleProgress}
              isPaused={!isRunning}
              size={140}
              enableHover={true}
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
                <div>
                  Phase: <span style={{ color: 'rgba(255,200,100,0.9)' }}>{isDayPhase ? 'DAY' : 'NIGHT'}</span>
                </div>
                <div>
                  Progress: <span style={{ color: 'rgba(255,200,100,0.9)' }}>{(cycleProgress * 100).toFixed(1)}%</span>
                </div>
                <div style={{ marginTop: '8px' }}>
                  Color:{' '}
                  <span
                    style={{
                      color: isDayPhase ? 'rgba(255,215,110,0.9)' : 'rgba(150,190,255,0.9)',
                    }}
                  >
                    {isDayPhase ? 'Warm Gold' : 'Cool Blue'}
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
                  color: 'var(--skin-title-color, rgba(210,180,150,0.9))',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'var(--skin-font-display, serif)',
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
              <strong style={{ color: 'rgba(255,200,100,0.8)' }}>Cycle behavior:</strong>
            </div>
            <div>↻ Day phase: 0-100% (warm gold halo)</div>
            <div>↻ Night phase: 0-100% (cool blue halo)</div>
            <div>↻ Progress arc: fills orario from top, resets at phase change</div>
            <div>↻ Icon: sun (day) ↔ moon (night) — not implemented yet, placeholder</div>
            <div style={{ marginTop: '8px', color: 'rgba(255,150,100,0.7)' }}>
              ✓ Same corona aesthetic as POI expiry, but no escalation or rotation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClockPoiTestPage;
