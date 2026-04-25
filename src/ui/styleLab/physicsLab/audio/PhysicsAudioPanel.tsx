/**
 * PL-AUD – Physics Lab Audio & Haptics Harness
 * 
 * Audio control panel for Physics Lab with volume controls,
 * sound pack selection, ducking settings, and spam test utilities.
 * 
 * @since 2026-02-19
 * @author Cascade
 */

import React, { useState } from 'react';
import { usePhysicsLabAudio, type PhysicsLabAudioConfig, type HapticPattern } from './usePhysicsLabAudio';
import { type PhysicsPreset } from '@/ui/styleLab/config/physicsPresets';

/**
 * Audio panel component props
 */
export interface PhysicsAudioPanelProps {
  /** Current physics preset (for integration) */
  preset?: PhysicsPreset;
  /** Panel title override */
  title?: string;
  /** Show advanced controls */
  showAdvanced?: boolean;
}

/**
 * Physics Lab Audio Panel Component
 */
export const PhysicsAudioPanel: React.FC<PhysicsAudioPanelProps> = ({
  preset,
  title = 'Audio & Haptics',
  showAdvanced = true,
}) => {
  const {
    config,
    updateConfig,
    resetConfig,
    playCue,
    stopAllCues,
    enqueueHapticPattern,
    clearHapticQueue,
    runSpamTest,
    activeCues,
    isInitialized,
    error,
  } = usePhysicsLabAudio(preset);

  const [spamTestCount, setSpamTestCount] = useState(10);
  const [spamTestInterval, setSpamTestInterval] = useState(100);
  const [isSpamTestRunning, setIsSpamTestRunning] = useState(false);

  /**
   * Handle sound pack change
   */
  const handleSoundPackChange = (pack: PhysicsLabAudioConfig['soundPack']) => {
    updateConfig({ soundPack: pack });
  };

  /**
   * Handle spam test execution
   */
  const handleSpamTest = async () => {
    setIsSpamTestRunning(true);
    try {
      await runSpamTest(spamTestCount, spamTestInterval);
    } finally {
      setIsSpamTestRunning(false);
    }
  };

  /**
   * Test individual audio cue
   */
  const handleTestCue = async (eventType: Parameters<typeof playCue>[0]) => {
    await playCue(eventType);
  };

  /**
   * Test haptic pattern
   */
  const handleTestHaptic = () => {
    const pattern: HapticPattern = {
      id: `test-${Date.now()}`,
      pattern: [10, 50, 10, 50, 10],
      intensity: 'medium',
      duration: 130,
    };
    enqueueHapticPattern(pattern);
  };

  if (!isInitialized) {
    return (
      <div className="physics-audio-panel" style={{
        padding: '16px',
        backgroundColor: '#04060a',
        border: '1px solid rgba(100, 80, 0, 0.2)',
        borderRadius: '4px',
        color: '#f4e8d0',
        fontFamily: '"EB Garamond", serif',
      }}>
        <div style={{ textAlign: 'center', opacity: 0.7 }}>
          Initializing Audio System...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="physics-audio-panel" style={{
        padding: '16px',
        backgroundColor: '#04060a',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '4px',
        color: '#f4e8d0',
        fontFamily: '"EB Garamond", serif',
      }}>
        <div style={{ color: '#ef4444', textAlign: 'center' }}>
          Audio Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="physics-audio-panel" style={{
      padding: '20px',
      backgroundColor: '#04060a',
      border: '1px solid rgba(100, 80, 0, 0.2)',
      borderRadius: '4px',
      color: '#f4e8d0',
      fontFamily: '"EB Garamond", serif',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(100, 80, 0, 0.2)',
        paddingBottom: '12px',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 600,
          color: '#d4aa50',
          fontFamily: '"Cinzel", serif',
          letterSpacing: '0.1em',
        }}>
          {title}
        </h3>
        <div style={{
          fontSize: '12px',
          color: '#7a6858',
        }}>
          Active Cues: {activeCues}
        </div>
      </div>

      {/* Master Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{
          margin: 0,
          fontSize: '14px',
          color: '#c8b090',
          fontFamily: '"Cinzel", serif',
        }}>
          Master Controls
        </h4>
        
        {/* Enable/Disable */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px' }}>Enabled:</label>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => updateConfig({ enabled: e.target.checked })}
            style={{ accentColor: '#d4aa50' }}
          />
        </div>

        {/* Master Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', minWidth: '80px' }}>Master Vol:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.masterVolume}
            onChange={(e) => updateConfig({ masterVolume: parseFloat(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'right' }}>
            {Math.round(config.masterVolume * 100)}%
          </span>
        </div>

        {/* Max Concurrent Cues */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', minWidth: '80px' }}>Max Cues:</label>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={config.maxConcurrentCues}
            onChange={(e) => updateConfig({ maxConcurrentCues: parseInt(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'right' }}>
            {config.maxConcurrentCues}
          </span>
        </div>
      </div>

      {/* Sound Pack Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{
          margin: 0,
          fontSize: '14px',
          color: '#c8b090',
          fontFamily: '"Cinzel", serif',
        }}>
          Sound Pack
        </h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['gilded', 'obsidian', 'blizzard'] as const).map((pack) => (
            <button
              key={pack}
              onClick={() => handleSoundPackChange(pack)}
              style={{
                padding: '6px 12px',
                backgroundColor: config.soundPack === pack ? '#d4aa50' : 'rgba(100, 80, 0, 0.2)',
                border: `1px solid ${config.soundPack === pack ? '#d4aa50' : 'rgba(100, 80, 0, 0.3)'}`,
                borderRadius: '3px',
                color: config.soundPack === pack ? '#04060a' : '#c8b090',
                fontSize: '12px',
                fontFamily: '"Cinzel", serif',
                textTransform: 'capitalize',
                cursor: 'pointer',
              }}
            >
              {pack}
            </button>
          ))}
        </div>
      </div>

      {/* Ducking Settings */}
      {showAdvanced && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{
            margin: 0,
            fontSize: '14px',
            color: '#c8b090',
            fontFamily: '"Cinzel", serif',
          }}>
            Ducking
          </h4>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '13px' }}>Enabled:</label>
            <input
              type="checkbox"
              checked={config.ducking.enabled}
              onChange={(e) => updateConfig({ 
                ducking: { ...config.ducking, enabled: e.target.checked }
              })}
              style={{ accentColor: '#d4aa50' }}
            />
          </div>

          {config.ducking.enabled && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '13px', minWidth: '80px' }}>Amount:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.ducking.amount}
                  onChange={(e) => updateConfig({ 
                    ducking: { ...config.ducking, amount: parseFloat(e.target.value) }
                  })}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'right' }}>
                  {Math.round(config.ducking.amount * 100)}%
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '13px', minWidth: '80px' }}>Fade Time:</label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={config.ducking.fadeTimeMs}
                  onChange={(e) => updateConfig({ 
                    ducking: { ...config.ducking, fadeTimeMs: parseInt(e.target.value) }
                  })}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'right' }}>
                  {config.ducking.fadeTimeMs}ms
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Event Volume Controls */}
      {showAdvanced && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{
            margin: 0,
            fontSize: '14px',
            color: '#c8b090',
            fontFamily: '"Cinzel", serif',
          }}>
            Event Volumes
          </h4>
          {Object.entries(config.eventVolumes).map(([eventType, volume]) => (
            <div key={eventType} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ 
                fontSize: '12px', 
                minWidth: '120px',
                textTransform: 'capitalize',
              }}>
                {eventType.replace('_', ' ')}:
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => updateConfig({
                  eventVolumes: {
                    ...config.eventVolumes,
                    [eventType]: parseFloat(e.target.value),
                  }
                })}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'right' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Test Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{
          margin: 0,
          fontSize: '14px',
          color: '#c8b090',
          fontFamily: '"Cinzel", serif',
        }}>
          Test Controls
        </h4>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['button_press', 'drag_start', 'slot_snap', 'float_text_spawn', 'preset_change'] as const).map((eventType) => (
            <button
              key={eventType}
              onClick={() => handleTestCue(eventType)}
              disabled={!config.enabled}
              style={{
                padding: '4px 8px',
                backgroundColor: config.enabled ? 'rgba(100, 80, 0, 0.2)' : 'rgba(100, 80, 0, 0.1)',
                border: `1px solid rgba(100, 80, 0, 0.3)`,
                borderRadius: '3px',
                color: config.enabled ? '#c8b090' : '#7a6858',
                fontSize: '11px',
                fontFamily: '"Cinzel", serif',
                textTransform: 'capitalize',
                cursor: config.enabled ? 'pointer' : 'not-allowed',
              }}
            >
              {eventType.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleTestHaptic}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(100, 80, 0, 0.2)',
              border: '1px solid rgba(100, 80, 0, 0.3)',
              borderRadius: '3px',
              color: '#c8b090',
              fontSize: '12px',
              fontFamily: '"Cinzel", serif',
              cursor: 'pointer',
            }}
          >
            Test Haptic
          </button>
          
          <button
            onClick={stopAllCues}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '3px',
              color: '#ef4444',
              fontSize: '12px',
              fontFamily: '"Cinzel", serif',
              cursor: 'pointer',
            }}
          >
            Stop All
          </button>
        </div>
      </div>

      {/* Spam Test */}
      {showAdvanced && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{
            margin: 0,
            fontSize: '14px',
            color: '#c8b090',
            fontFamily: '"Cinzel", serif',
          }}>
            Spam Test
          </h4>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '13px', minWidth: '60px' }}>Count:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={spamTestCount}
              onChange={(e) => setSpamTestCount(parseInt(e.target.value) || 10)}
              style={{
                width: '60px',
                padding: '4px',
                backgroundColor: 'rgba(100, 80, 0, 0.1)',
                border: '1px solid rgba(100, 80, 0, 0.3)',
                borderRadius: '3px',
                color: '#c8b090',
                fontSize: '12px',
              }}
            />
            
            <label style={{ fontSize: '13px', minWidth: '60px' }}>Interval:</label>
            <input
              type="number"
              min="10"
              max="1000"
              step="10"
              value={spamTestInterval}
              onChange={(e) => setSpamTestInterval(parseInt(e.target.value) || 100)}
              style={{
                width: '60px',
                padding: '4px',
                backgroundColor: 'rgba(100, 80, 0, 0.1)',
                border: '1px solid rgba(100, 80, 0, 0.3)',
                borderRadius: '3px',
                color: '#c8b090',
                fontSize: '12px',
              }}
            />
            <span style={{ fontSize: '12px', color: '#7a6858' }}>ms</span>
          </div>
          
          <button
            onClick={handleSpamTest}
            disabled={!config.enabled || isSpamTestRunning}
            style={{
              padding: '8px 16px',
              backgroundColor: config.enabled && !isSpamTestRunning 
                ? 'rgba(100, 80, 0, 0.2)' 
                : 'rgba(100, 80, 0, 0.1)',
              border: `1px solid rgba(100, 80, 0, 0.3)`,
              borderRadius: '3px',
              color: config.enabled && !isSpamTestRunning ? '#c8b090' : '#7a6858',
              fontSize: '12px',
              fontFamily: '"Cinzel", serif',
              cursor: config.enabled && !isSpamTestRunning ? 'pointer' : 'not-allowed',
            }}
          >
            {isSpamTestRunning ? 'Running...' : `Run Spam Test (${spamTestCount} cues)`}
          </button>
        </div>
      )}

      {/* Reset Controls */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={resetConfig}
          style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '3px',
            color: '#ef4444',
            fontSize: '12px',
            fontFamily: '"Cinzel", serif',
            cursor: 'pointer',
          }}
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};
