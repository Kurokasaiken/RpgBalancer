/**
 * Minimal Polished Page – Final Polish
 *
 * HUD stilizzato (resource bars, fatigue), log eventi e modal game over.
 * Config tuning per playtesting bilanciato.
 */

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { initializeMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

/**
 * Styled HUD Resource Bar Component
 */
function ResourceBar({ 
  label, 
  current, 
  max, 
  color, 
  backgroundColor 
}: { 
  label: string; 
  current: number; 
  max: number; 
  color: string; 
  backgroundColor: string; 
}): JSX.Element {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  
  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: '8px',
      border: `1px solid ${color}33`,
      background: `${backgroundColor}22`,
      boxShadow: `0 2px 8px ${color}11`,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
      }}>
        <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color }}>
          {label}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color }}>
          {current} / {max}
        </span>
      </div>
      <div style={{
        height: '6px',
        borderRadius: '3px',
        background: '#e5e7eb',
        overflow: 'hidden',
      }}>
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: color,
            transition: 'width 0.3s ease',
            borderRadius: '3px',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Fatigue Bar Component
 */
function FatigueBar({ fatigue }: { fatigue: number }): JSX.Element {
  const percentage = fatigue;
  const color = percentage > 80 ? '#ef4444' : percentage > 50 ? '#f59e0b' : '#22c55e';
  
  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: '8px',
      border: `1px solid ${color}33`,
      background: `${color}22`,
      boxShadow: `0 2px 8px ${color}11`,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
      }}>
        <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color }}>
          Fatigue
        </span>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color }}>
          {Math.round(fatigue)}%
        </span>
      </div>
      <div style={{
        height: '6px',
        borderRadius: '3px',
        background: '#e5e7eb',
        overflow: 'hidden',
      }}>
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: color,
            transition: 'width 0.3s ease',
            borderRadius: '3px',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Event Log Component
 */
function EventLog({ events }: { events: Array<{ time: number; type: string; message: string }> }): JSX.Element {
  const displayEvents = events.slice(-5).reverse();
  
  return (
    <div style={{
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      background: '#f9fafb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
        Event Log
      </h3>
      {displayEvents.length === 0 ? (
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
          No events yet
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {displayEvents.map((event, index) => (
            <div
              key={`${event.time}-${index}`}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                fontSize: '12px',
                lineHeight: '1.4',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>
                  {event.type}
                </span>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                  Day {Math.floor(event.time / 24)}:{(event.time % 24).toString().padStart(2, '0')}
                </span>
              </div>
              <div style={{ color: '#6b7280' }}>
                {event.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Game Over Modal Component
 */
function GameOverModal({ reason, onRestart }: { reason: string; onRestart: () => void }): JSX.Element {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
        }}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
          Game Over
        </h2>
        <p style={{ margin: '0 0 24px 0', fontSize: '16px', color: '#6b7280', lineHeight: '1.5' }}>
          {reason}
        </p>
        <button
          onClick={onRestart}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            background: '#3b82f6',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          Restart
        </button>
      </div>
    </div>
  );
}

/**
 * Main polished page.
 */
export function MinimalPolishedPage(): JSX.Element {
  const [initialized, setInitialized] = useState(false);
  const [mockEvents, setMockEvents] = useState<Array<{ time: number; type: string; message: string }>>([]);
  
  const state = useMinimalGameplayStore((s) => s.state);
  const isLoading = useMinimalGameplayStore((s) => s.isLoading);
  const error = useMinimalGameplayStore((s) => s.error);
  const gameOver = useMinimalGameplayStore((s) => s.gameOver());
  const daysRemaining = useMinimalGameplayStore((s) => s.daysRemaining());
  
  const tick = useMinimalGameplayStore((s) => s.tick);
  const pauseGame = useMinimalGameplayStore((s) => s.pauseGame);
  const resumeGame = useMinimalGameplayStore((s) => s.resumeGame);
  const resetGame = useMinimalGameplayStore((s) => s.resetGame);
  const buyFood = useMinimalGameplayStore((s) => s.buyFood);
  const startActivity = useMinimalGameplayStore((s) => s.startActivity);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      initializeMinimalGameplayStore().catch((err) => {
        console.error('Failed to initialize minimal gameplay store:', err);
      });
    }
  }, [initialized]);

  // Mock event generation for demo
  useEffect(() => {
    if (!isLoading && !error && state.activeActivities.length > 0) {
      const timer = setInterval(() => {
        const newEvent = {
          time: state.currentDay,
          type: 'activity_progress',
          message: `Activities in progress: ${state.activeActivities.length}`,
        };
        setMockEvents((prev) => [...prev.slice(-9), newEvent]);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [isLoading, error, state.currentDay, state.activeActivities.length]);

  // Track page load telemetry
  useEffect(() => {
    if (!isLoading && !error) {
      trackTelemetryEvent('minimal_polished_page_loaded', {
        source: 'MinimalPolishedPage',
        timestamp: Date.now(),
        gold: state.gold,
        food: state.food,
        residents: state.residents.length,
        day: state.currentDay,
      } as Record<string, unknown>);
    }
  }, [isLoading, error, state]);

  // Track game over telemetry
  useEffect(() => {
    if (gameOver.isOver) {
      trackTelemetryEvent('game_over_polished', {
        source: 'MinimalPolishedPage',
        timestamp: Date.now(),
        reason: gameOver.reason,
        day: state.currentDay,
        gold: state.gold,
        food: state.food,
      } as Record<string, unknown>);
    }
  }, [gameOver.isOver, gameOver.reason, state.currentDay, state.gold, state.food]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  const averageFatigue = state.residents.length > 0 
    ? state.residents.reduce((sum, r) => sum + r.fatigue, 0) / state.residents.length 
    : 0;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '14px', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>
          Minimal Polished Gameplay
        </h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '16px', color: '#6b7280' }}>
          Styled HUD, event log, and game over modal with config tuning.
        </p>
      </header>

      {/* Game Over Modal */}
      {gameOver.isOver && (
        <GameOverModal 
          reason={gameOver.reason || 'Unknown reason'} 
          onRestart={resetGame} 
        />
      )}

      {/* Status Bar */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            Status
          </h3>
          <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
            <div><strong>Day:</strong> {state.currentDay}</div>
            <div><strong>Paused:</strong> {state.isPaused ? 'Yes' : 'No'}</div>
            <div><strong>Days Remaining:</strong> {daysRemaining === Infinity ? '∞' : daysRemaining}</div>
          </div>
        </div>
      </div>

      {/* Resource HUD */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#111827' }}>
          Resources
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <ResourceBar
            label="Gold"
            current={state.gold}
            max={9999}
            color="#f59e0b"
            backgroundColor="#fef3c7"
          />
          <ResourceBar
            label="Food"
            current={state.food}
            max={state.maxFood}
            color="#10b981"
            backgroundColor="#d1fae5"
          />
          <FatigueBar fatigue={averageFatigue} />
        </div>
      </div>

      {/* Event Log */}
      <div style={{ marginBottom: '24px' }}>
        <EventLog events={mockEvents} />
      </div>

      {/* Controls */}
      <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#111827' }}>
          Controls
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={tick}
            disabled={state.isPaused}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: state.isPaused ? '#9ca3af' : '#3b82f6',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: state.isPaused ? 'not-allowed' : 'pointer',
            }}
          >
            Tick
          </button>
          <button
            onClick={state.isPaused ? resumeGame : pauseGame}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: state.isPaused ? '#10b981' : '#f59e0b',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            {state.isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => buyFood(5)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: '#8b5cf6',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Buy 5 Food
          </button>
          <button
            onClick={resetGame}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', fontSize: '12px', color: '#6b7280' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
          Debug Info
        </h3>
        <div style={{ display: 'grid', gap: '4px' }}>
          <div><strong>Active Activities:</strong> {state.activeActivities.length}</div>
          <div><strong>Residents:</strong> {state.residents.length}</div>
          <div><strong>Injured:</strong> {state.residents.filter(r => r.isInjured).length}</div>
          <div><strong>Working:</strong> {state.residents.filter(r => r.isWorking).length}</div>
        </div>
      </div>
    </div>
  );
}
