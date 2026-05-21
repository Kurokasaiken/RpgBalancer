import React, { useState, useEffect } from 'react';

/**
 * MinimalClockPage
 *
 * Isolated test page for ClockWidget component.
 * Shows time display and speed controls.
 *
 * Route: /minimal-clock
 * Spec: src/docs/docs/minimal_slice/04_clock.md
 */

export default function MinimalClockPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [gameTime, setGameTime] = useState({ day: 1, hour: 0, minute: 0 });

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setGameTime((prev) => {
        let { day, hour, minute } = prev;
        const increment = speed; // Each tick advances by speed (minutes)
        minute += increment;

        if (minute >= 60) {
          hour += Math.floor(minute / 60);
          minute = minute % 60;
        }

        if (hour >= 24) {
          day += Math.floor(hour / 24);
          hour = hour % 24;
        }

        return { day, hour, minute };
      });
    }, 1000 / speed); // Faster interval for 2x, 4x speed

    return () => clearInterval(interval);
  }, [isRunning, speed]);

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const formatTime = (hour: number, minute: number) => {
    const h = String(hour).padStart(2, '0');
    const m = String(minute).padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ClockWidget Isolated Test</h1>
      <p style={styles.subtitle}>Route: /minimal-clock | Spec: src/docs/docs/minimal_slice/04_clock.md</p>

      <div style={styles.clockPanel}>
        <div style={styles.timeDisplay} data-testid="time-display">
          <div style={styles.dayLabel}>Day {gameTime.day}</div>
          <div style={styles.timeValue} data-testid="time-value">
            {formatTime(gameTime.hour, gameTime.minute)}
          </div>
          <div style={styles.statusLabel}>
            {isRunning ? '▶ Running' : '⏸ Paused'} @ {speed}x
          </div>
        </div>

        <div style={styles.controls}>
          <button
            onClick={() => setIsRunning(!isRunning)}
            style={{
              ...styles.button,
              backgroundColor: isRunning ? '#ff6b6b' : '#51cf66',
            }}
            data-testid="play-pause-button"
          >
            {isRunning ? '⏸ Pause' : '▶ Play'}
          </button>
        </div>

        <div style={styles.speedControls}>
          <div style={styles.speedLabel}>Speed:</div>
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              style={{
                ...styles.speedButton,
                backgroundColor: speed === s ? '#4ecdc4' : '#f0f0f0',
                color: speed === s ? '#fff' : '#333',
              }}
              data-testid={`speed-${s}x-button`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div style={styles.info}>
        <h2>Test Information</h2>
        <ul>
          <li><strong>Component:</strong> ClockWidget</li>
          <li><strong>Test Cases:</strong> 28 (rendering, time display, speed control, state, edge cases)</li>
          <li><strong>Test File:</strong> tests/e2e/minimal_slice_04_clock.spec.ts</li>
          <li><strong>Features:</strong> Play/Pause, Speed (1x/2x/4x), Day/Hour/Minute display</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  } as React.CSSProperties,
  title: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
    color: '#333',
  } as React.CSSProperties,
  subtitle: {
    color: '#666',
    marginBottom: '2rem',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  clockPanel: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  } as React.CSSProperties,
  timeDisplay: {
    textAlign: 'center',
    marginBottom: '2rem',
    padding: '2rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
  } as React.CSSProperties,
  dayLabel: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#666',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  timeValue: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  statusLabel: {
    fontSize: '0.9rem',
    color: '#999',
  } as React.CSSProperties,
  controls: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '2rem',
  } as React.CSSProperties,
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  } as React.CSSProperties,
  speedControls: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    alignItems: 'center',
  } as React.CSSProperties,
  speedLabel: {
    fontWeight: 'bold',
    marginRight: '1rem',
    color: '#333',
  } as React.CSSProperties,
  speedButton: {
    padding: '0.5rem 1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  } as React.CSSProperties,
  info: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
};
