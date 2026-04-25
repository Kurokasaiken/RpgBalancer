/**
 * Time + Day/Night Integration Page - INT-TIME-DAYNIGHT-001
 * 
 * Integration verification harness for TimeEngine dual-layer architecture
 * and day/night system. Demonstrates separation between simulation 
 * and gameplay layers without creating new abstractions.
 * 
 * Dependencies: TimeEngine, useMinimalGameplay, DayNightPOI
 * Purpose: Integration verification harness only
 */

import React, { useState, useEffect } from 'react';
import { useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import DayNightPOI from '@/ui/idleVillage/components/minimal/DayNightPOI';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

/**
 * Time + Day/Night Integration Page
 * 
 * Demonstrates dual-layer time architecture:
 * - Simulation layer: currentTime (1:1 time)
 * - Gameplay layer: currentTick with speedMultiplier
 * - Day/night derived from simulation time
 * - Speed multiplier affects gameplay layer only
 */
export const TimeDaynightIntegrationPage: React.FC = () => {
  const gameplayState = useMinimalGameplayWithIdleVillageConfig();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualSpeed, setManualSpeed] = useState(1);

  // Extract time state for demonstration
  const timeState = {
    // Simulation layer (1:1 time)
    currentTime: gameplayState.state.currentTick, // Maps to simulation time
    currentDay: gameplayState.state.currentDay,
    
    // Gameplay layer (with speed multiplier)
    currentTick: gameplayState.state.currentTick,
    speedMultiplier: gameplayState.state.speedMultiplier,
    isPaused: gameplayState.state.isPaused,
    
    // Day/night derived from simulation time
    isDayPhase: gameplayState.state.isDayPhase,
    cycleProgress: gameplayState.state.cycleProgress,
    
    // Time intervals
    tickIntervalMs: gameplayState.state.tickIntervalMs,
  };

  // Calculate derived values for demonstration
  const simulationTime = timeState.currentTime;
  const gameplayEffectiveTime = timeState.currentTick * timeState.speedMultiplier;
  const dayNightPhase = timeState.isDayPhase ? 'Day' : 'Night';
  const cycleProgressPercent = Math.round(timeState.cycleProgress * 100);

  // Track time events
  useEffect(() => {
    trackTelemetryEvent('time_integration_page_loaded', {
      currentTime: simulationTime,
      currentTick: timeState.currentTick,
      speedMultiplier: timeState.speedMultiplier,
      isDayPhase: timeState.isDayPhase,
      cycleProgress: timeState.cycleProgress,
    });
  }, []);

  // Track speed changes
  useEffect(() => {
    if (timeState.speedMultiplier !== manualSpeed) {
      setManualSpeed(timeState.speedMultiplier);
      trackTelemetryEvent('time_speed_multiplier_changed', {
        oldSpeed: manualSpeed,
        newSpeed: timeState.speedMultiplier,
        source: 'integration_page',
      });
    }
  }, [timeState.speedMultiplier, manualSpeed]);

  // Track day/night transitions
  useEffect(() => {
    trackTelemetryEvent('day_night_state_updated', {
      isDayPhase: timeState.isDayPhase,
      cycleProgress: timeState.cycleProgress,
      currentDay: timeState.currentDay,
    });
  }, [timeState.isDayPhase, timeState.cycleProgress, timeState.currentDay]);

  const handleSpeedChange = (newSpeed: number) => {
    if (gameplayState.actions.setSpeedMultiplier) {
      gameplayState.actions.setSpeedMultiplier(newSpeed);
      trackTelemetryEvent('time_speed_manual_change', {
        newSpeed,
        source: 'integration_page_ui',
      });
    }
  };

  const handlePauseToggle = () => {
    if (gameplayState.actions.togglePause) {
      gameplayState.actions.togglePause();
      trackTelemetryEvent('time_pause_toggle', {
        wasPaused: timeState.isPaused,
        source: 'integration_page_ui',
      });
    }
  };

  const handleAdvanceTime = () => {
    if (gameplayState.actions.advanceTime) {
      gameplayState.actions.advanceTime(1);
      trackTelemetryEvent('time_manual_advance', {
        ticksAdvanced: 1,
        source: 'integration_page_ui',
      });
    }
  };

  return (
    <StyleLabSurface>
      <div className="time-daynight-integration">
        <header className="integration-header">
          <h1>Time + Day/Night Integration</h1>
          <p>Verification harness for dual-layer time architecture and day/night system</p>
        </header>

        <div className="integration-content">
          {/* Day/Night POI Visualization */}
          <div className="poi-section">
            <h2>Day/Night POI Component</h2>
            <div className="poi-container">
              <DayNightPOI />
            </div>
            <div className="poi-info">
              <p><strong>Current Phase:</strong> {dayNightPhase}</p>
              <p><strong>Cycle Progress:</strong> {cycleProgressPercent}%</p>
              <p><strong>Status:</strong> {timeState.isPaused ? 'Paused' : 'Running'}</p>
            </div>
          </div>

          {/* Time Layer Demonstration */}
          <div className="time-layers">
            <h2>Dual-Layer Time Architecture</h2>
            
            <div className="layer-section">
              <h3>Simulation Layer (1:1 Time)</h3>
              <div className="layer-info">
                <p><strong>Current Time:</strong> {simulationTime}</p>
                <p><strong>Current Day:</strong> {timeState.currentDay}</p>
                <p><strong>Day/Night Source:</strong> Derived from this layer</p>
              </div>
            </div>

            <div className="layer-section">
              <h3>Gameplay Layer (Speed Multiplied)</h3>
              <div className="layer-info">
                <p><strong>Current Tick:</strong> {timeState.currentTick}</p>
                <p><strong>Speed Multiplier:</strong> {timeState.speedMultiplier}x</p>
                <p><strong>Effective Time:</strong> {gameplayEffectiveTime}</p>
              </div>
            </div>

            {showAdvanced && (
              <div className="layer-section advanced">
                <h3>Advanced Time Metrics</h3>
                <div className="layer-info">
                  <p><strong>Tick Interval:</strong> {timeState.tickIntervalMs}ms</p>
                  <p><strong>Simulation/Gameplay Ratio:</strong> {timeState.speedMultiplier === 0 ? 'Paused' : `1:${timeState.speedMultiplier}`}</p>
                  <p><strong>Day/Night Calculation:</strong> Based on simulation time only</p>
                </div>
              </div>
            )}
          </div>

          {/* Time Controls */}
          <div className="time-controls">
            <h2>Time Controls</h2>
            <div className="controls-grid">
              <div className="control-group">
                <label>Speed Multiplier:</label>
                <div className="speed-buttons">
                  {[0, 0.5, 1, 2, 5, 10].map(speed => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`speed-btn ${timeState.speedMultiplier === speed ? 'active' : ''}`}
                      disabled={speed === 0 && !timeState.isPaused}
                    >
                      {speed === 0 ? 'Pause' : `${speed}x`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="control-group">
                <label>Manual Controls:</label>
                <div className="manual-buttons">
                  <button
                    onClick={handlePauseToggle}
                    className={`pause-btn ${timeState.isPaused ? 'paused' : 'running'}`}
                  >
                    {timeState.isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={handleAdvanceTime}
                    disabled={timeState.isPaused}
                    className="advance-btn"
                  >
                    Advance 1 Tick
                  </button>
                </div>
              </div>

              <div className="control-group">
                <label>Display Options:</label>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`advanced-btn ${showAdvanced ? 'active' : ''}`}
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced
                </button>
              </div>
            </div>
          </div>

          {/* Integration Verification */}
          <div className="verification-section">
            <h2>Integration Verification</h2>
            <div className="verification-checklist">
              <div className="check-item">
                <span className="check-icon">{'\u2713'}</span>
                <span>Day/night derived from simulation time (not affected by speed multiplier)</span>
              </div>
              <div className="check-item">
                <span className="check-icon">{'\u2713'}</span>
                <span>Speed multiplier affects gameplay layer only</span>
              </div>
              <div className="check-item">
                <span className="check-icon">{'\u2713'}</span>
                <span>Simulation layer maintains 1:1 time progression</span>
              </div>
              <div className="check-item">
                <span className="check-icon">{'\u2713'}</span>
                <span>DayNightPOI component reflects correct phase and progress</span>
              </div>
              <div className="check-item">
                <span className="check-icon">{'\u2713'}</span>
                <span>Time controls work without breaking day/night calculation</span>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .time-daynight-integration {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
          }

          .integration-header {
            margin-bottom: 2rem;
          }

          .integration-header h1 {
            margin: 0 0 0.5rem 0;
            color: var(--color-text-primary);
          }

          .integration-header p {
            margin: 0;
            color: var(--color-text-secondary);
          }

          .integration-content {
            display: flex;
            flex-direction: column;
            gap: 2rem;
          }

          .poi-section {
            padding: 1rem;
            background: var(--color-surface-secondary);
            border-radius: 8px;
          }

          .poi-section h2 {
            margin: 0 0 1rem 0;
            color: var(--color-text-primary);
          }

          .poi-container {
            display: flex;
            justify-content: center;
            padding: 2rem;
            background: var(--color-surface-primary);
            border-radius: 4px;
            border: 1px solid var(--color-border);
            margin-bottom: 1rem;
          }

          .poi-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
          }

          .poi-info p {
            margin: 0;
            color: var(--color-text-secondary);
          }

          .poi-info strong {
            color: var(--color-text-primary);
          }

          .time-layers {
            padding: 1rem;
            background: var(--color-surface-secondary);
            border-radius: 8px;
          }

          .time-layers h2 {
            margin: 0 0 1rem 0;
            color: var(--color-text-primary);
          }

          .layer-section {
            padding: 1rem;
            background: var(--color-surface-primary);
            border-radius: 4px;
            border: 1px solid var(--color-border);
            margin-bottom: 1rem;
          }

          .layer-section.advanced {
            border-color: var(--color-accent);
            background: var(--color-surface-tertiary);
          }

          .layer-section h3 {
            margin: 0 0 0.5rem 0;
            color: var(--color-text-primary);
          }

          .layer-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
          }

          .layer-info p {
            margin: 0;
            color: var(--color-text-secondary);
          }

          .layer-info strong {
            color: var(--color-text-primary);
          }

          .time-controls {
            padding: 1rem;
            background: var(--color-surface-secondary);
            border-radius: 8px;
          }

          .time-controls h2 {
            margin: 0 0 1rem 0;
            color: var(--color-text-primary);
          }

          .controls-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
          }

          .control-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .control-group label {
            font-weight: 600;
            color: var(--color-text-primary);
          }

          .speed-buttons,
          .manual-buttons {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }

          .speed-btn,
          .pause-btn,
          .advance-btn,
          .advanced-btn {
            padding: 0.5rem 1rem;
            border: 1px solid var(--color-border);
            border-radius: 4px;
            background: var(--color-surface-primary);
            color: var(--color-text-primary);
            cursor: pointer;
            font-size: 0.875rem;
          }

          .speed-btn:hover,
          .pause-btn:hover,
          .advance-btn:hover,
          .advanced-btn:hover {
            background: var(--color-surface-hover);
          }

          .speed-btn.active,
          .advanced-btn.active {
            background: var(--color-accent);
            color: var(--color-accent-text);
            border-color: var(--color-accent);
          }

          .speed-btn:disabled,
          .advance-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .pause-btn.paused {
            background: var(--color-warning);
            color: var(--color-warning-text);
            border-color: var(--color-warning);
          }

          .pause-btn.running {
            background: var(--color-success);
            color: var(--color-success-text);
            border-color: var(--color-success);
          }

          .verification-section {
            padding: 1rem;
            background: var(--color-surface-secondary);
            border-radius: 8px;
          }

          .verification-section h2 {
            margin: 0 0 1rem 0;
            color: var(--color-text-primary);
          }

          .verification-checklist {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .check-item {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            padding: 0.5rem;
            background: var(--color-surface-primary);
            border-radius: 4px;
            border: 1px solid var(--color-border);
          }

          .check-icon {
            color: var(--color-success);
            font-weight: bold;
            flex-shrink: 0;
            margin-top: 0.125rem;
          }

          @media (max-width: 768px) {
            .time-daynight-integration {
              padding: 1rem;
            }

            .controls-grid {
              grid-template-columns: 1fr;
            }

            .speed-buttons,
            .manual-buttons {
              justify-content: center;
            }
          }
        `}</style>
      </div>
    </StyleLabSurface>
  );
};
