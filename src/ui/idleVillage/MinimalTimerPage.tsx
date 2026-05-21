/**
 * MinimalTimerPage — Fase 5: Activity Timer Logic Test
 *
 * Pagina per testare il timer di attività.
 * Un resident assegnato a uno slot con timer che decrementa.
 *
 * URL: /minimal-timer
 * Purpose: Test timer logic, skill checks, activity completion
 */

import React, { useState, useEffect } from 'react';

interface ActivityTimer {
  slotId: string;
  residentId: string;
  activityId: string;
  duration: number; // in seconds
  elapsedTime: number;
  remainingTime: number;
  isRunning: boolean;
  skillCheckResult: 'pending' | 'success' | 'failure' | null;
}

export function MinimalTimerPage() {
  const [timers, setTimers] = useState<Map<string, ActivityTimer>>(new Map());
  const [eventLog, setEventLog] = useState<string[]>([]);

  // Add timer
  const addTimer = (slotId: string, residentId: string, duration: number) => {
    const timer: ActivityTimer = {
      slotId,
      residentId,
      activityId: `activity-${Date.now()}`,
      duration,
      elapsedTime: 0,
      remainingTime: duration,
      isRunning: true,
      skillCheckResult: null,
    };

    setTimers((prev) => new Map(prev).set(slotId, timer));
    addLog(`Timer started: ${slotId} (${duration}s)`);
  };

  // Pause timer
  const pauseTimer = (slotId: string) => {
    setTimers((prev) => {
      const updated = new Map(prev);
      const timer = updated.get(slotId);
      if (timer) {
        updated.set(slotId, { ...timer, isRunning: false });
      }
      return updated;
    });
    addLog(`Timer paused: ${slotId}`);
  };

  // Resume timer
  const resumeTimer = (slotId: string) => {
    setTimers((prev) => {
      const updated = new Map(prev);
      const timer = updated.get(slotId);
      if (timer) {
        updated.set(slotId, { ...timer, isRunning: true });
      }
      return updated;
    });
    addLog(`Timer resumed: ${slotId}`);
  };

  // Cancel timer
  const cancelTimer = (slotId: string) => {
    setTimers((prev) => {
      const updated = new Map(prev);
      updated.delete(slotId);
      return updated;
    });
    addLog(`Timer cancelled: ${slotId}`);
  };

  // Skill check (called when timer reaches 0)
  const performSkillCheck = (timer: ActivityTimer): 'success' | 'failure' => {
    // Simple RNG: 60% success, 40% failure
    return Math.random() < 0.6 ? 'success' : 'failure';
  };

  // Timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = new Map(prev);
        let hasCompleted = false;

        updated.forEach((timer, slotId) => {
          if (timer.isRunning && timer.remainingTime > 0) {
            const newRemaining = timer.remainingTime - 1;
            const newElapsed = timer.elapsedTime + 1;

            if (newRemaining === 0) {
              // Timer complete: perform skill check
              const result = performSkillCheck(timer);
              updated.set(slotId, {
                ...timer,
                remainingTime: 0,
                elapsedTime: newElapsed,
                isRunning: false,
                skillCheckResult: result,
              });
              addLog(`Activity completed: ${slotId} → ${result}`);
              hasCompleted = true;
            } else {
              updated.set(slotId, {
                ...timer,
                remainingTime: newRemaining,
                elapsedTime: newElapsed,
              });
            }
          }
        });

        return updated;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const addLog = (message: string) => {
    setEventLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  return (
    <div
      style={{
        padding: '20px',
        fontFamily: 'monospace',
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ color: '#4ec9b0' }}>Fase 5: Activity Timer Logic</h1>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => addTimer('slot-1', 'res-1', 5)} style={{ padding: '8px 12px', marginRight: '8px' }}>
          Start 5s Timer (Slot 1)
        </button>
        <button onClick={() => addTimer('slot-2', 'res-2', 10)} style={{ padding: '8px 12px', marginRight: '8px' }}>
          Start 10s Timer (Slot 2)
        </button>
        <button onClick={() => pauseTimer('slot-1')} style={{ padding: '8px 12px', marginRight: '8px' }}>
          Pause Slot 1
        </button>
        <button onClick={() => resumeTimer('slot-1')} style={{ padding: '8px 12px', marginRight: '8px' }}>
          Resume Slot 1
        </button>
        <button onClick={() => cancelTimer('slot-1')} style={{ padding: '8px 12px' }}>
          Cancel Slot 1
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        {/* TIMERS SECTION */}
        <div
          style={{
            border: '2px solid #569cd6',
            padding: '15px',
            borderRadius: '8px',
            backgroundColor: '#252526',
          }}
        >
          <h2 style={{ color: '#569cd6' }}>Active Timers</h2>
          {timers.size === 0 ? (
            <p style={{ color: '#858585' }}>No active timers</p>
          ) : (
            Array.from(timers.entries()).map(([slotId, timer]) => (
              <div
                key={slotId}
                style={{
                  border: '1px solid #3e3e42',
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: '#1e1e1e',
                  borderRadius: '4px',
                }}
              >
                <div style={{ color: '#ce9178' }}>
                  <strong>Slot:</strong> {slotId}
                </div>
                <div style={{ color: '#ce9178' }}>
                  <strong>Resident:</strong> {timer.residentId}
                </div>
                <div style={{ color: '#9cdcfe' }}>
                  <strong>Elapsed:</strong> {timer.elapsedTime}s / {timer.duration}s
                </div>
                <div
                  style={{
                    color: timer.remainingTime > 2 ? '#4ec9b0' : '#ff6b6b',
                    fontSize: '18px',
                  }}
                >
                  <strong>Remaining:</strong> {timer.remainingTime}s
                </div>
                <div style={{ color: timer.isRunning ? '#6a9955' : '#d16969' }}>
                  <strong>Status:</strong> {timer.isRunning ? 'RUNNING' : 'PAUSED'}
                </div>
                {timer.skillCheckResult && (
                  <div
                    style={{
                      color: timer.skillCheckResult === 'success' ? '#4ec9b0' : '#ff6b6b',
                      fontWeight: 'bold',
                    }}
                  >
                    <strong>Result:</strong> {timer.skillCheckResult.toUpperCase()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* EVENT LOG SECTION */}
        <div
          style={{
            border: '2px solid #646695',
            padding: '15px',
            borderRadius: '8px',
            backgroundColor: '#252526',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          <h2 style={{ color: '#646695' }}>Event Log</h2>
          {eventLog.length === 0 ? (
            <p style={{ color: '#858585' }}>No events yet</p>
          ) : (
            eventLog.map((log, idx) => (
              <div key={idx} style={{ fontSize: '12px', marginBottom: '4px', color: '#858585' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* TIMER STATE TABLE */}
      <div>
        <h3 style={{ color: '#569cd6' }}>Timer State Details</h3>
        {timers.size === 0 ? (
          <p style={{ color: '#858585' }}>No timers to display</p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#252526',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#1e1e1e' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #3e3e42' }}>Slot ID</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #3e3e42' }}>Resident</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #3e3e42' }}>Duration</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #3e3e42' }}>Elapsed</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #3e3e42' }}>Remaining</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #3e3e42' }}>Status</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #3e3e42' }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(timers.entries()).map(([slotId, timer]) => (
                <tr key={slotId} style={{ borderBottom: '1px solid #3e3e42' }}>
                  <td style={{ padding: '8px', color: '#ce9178' }}>{slotId}</td>
                  <td style={{ padding: '8px', color: '#ce9178' }}>{timer.residentId}</td>
                  <td style={{ padding: '8px', color: '#9cdcfe' }}>{timer.duration}s</td>
                  <td style={{ padding: '8px', color: '#9cdcfe' }}>{timer.elapsedTime}s</td>
                  <td
                    style={{
                      padding: '8px',
                      color: timer.remainingTime > 2 ? '#4ec9b0' : '#ff6b6b',
                      fontWeight: 'bold',
                    }}
                  >
                    {timer.remainingTime}s
                  </td>
                  <td style={{ padding: '8px', color: timer.isRunning ? '#6a9955' : '#d16969' }}>
                    {timer.isRunning ? 'RUNNING' : 'PAUSED'}
                  </td>
                  <td
                    style={{
                      padding: '8px',
                      color: timer.skillCheckResult === 'success' ? '#4ec9b0' : '#ff6b6b',
                    }}
                  >
                    {timer.skillCheckResult || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
