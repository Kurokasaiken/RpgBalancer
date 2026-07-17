/**
 * @trailer-only
 *
 * TrailerViewer — shell with scene routing for the full 55-second Steam teaser.
 *
 * This component is part of the Steam teaser trailer production pipeline.
 * It is exempt from gameplay architecture requirements but must preserve
 * presentation architecture requirements.
 *
 * NO gameplay logic
 * NO persistence
 * NO i18n
 * NO telemetry
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { trailerConfig, type TrailerSceneId } from '@/balancing/config/idleVillage/trailerConfig';
import { AstrolabeTrailerController } from './AstrolabeTrailerController';
import { TrailerThreat } from './TrailerThreat';
import { TrailerChoice } from './TrailerChoice';
import { TrailerPreparation } from './TrailerPreparation';
import { TrailerConsequence } from './TrailerConsequence';
import { TrailerLegacy } from './TrailerLegacy';
import { TrailerOutro } from './TrailerOutro';
import type { TrailerSceneProps } from './types';
import './trailer.css';

type SceneComponent = React.FC<TrailerSceneProps>;

const sceneComponents: Record<TrailerSceneId, SceneComponent> = {
  threat: TrailerThreat,
  choice: TrailerChoice,
  preparation: TrailerPreparation,
  risk: AstrolabeTrailerController as unknown as SceneComponent,
  consequence: TrailerConsequence,
  legacy: TrailerLegacy,
  outro: TrailerOutro,
};

const sceneLabels: Record<TrailerSceneId, string> = {
  threat: 'Threat',
  choice: 'Choice',
  preparation: 'Preparation',
  risk: 'Risk',
  consequence: 'Consequence',
  legacy: 'Legacy',
  outro: 'Outro',
};

const sceneOrder = trailerConfig.sceneOrder;

function isTrailerSceneId(value: string | null): value is TrailerSceneId {
  return !!value && sceneOrder.includes(value as TrailerSceneId);
}

function getNextScene(current: TrailerSceneId): TrailerSceneId | null {
  const index = sceneOrder.indexOf(current);
  if (index < 0 || index >= sceneOrder.length - 1) return null;
  return sceneOrder[index + 1];
}

export interface TrailerViewerProps {
  /** Whether the full trailer sequence should start automatically. */
  autoPlay?: boolean;
  /** Capture mode hides debug controls and starts from the first scene. */
  captureMode?: boolean;
  /** Callback when the full sequence finishes. */
  onComplete?: () => void;
}

/**
 * TrailerViewer — deterministic scene router.
 *
 * Reads `?scene=<id>` to show a single scene, `?capture=true` for clean
 * capture playback, and `?autoplay=false` to start paused. In auto mode each
 * scene calls `onComplete` and the viewer advances to the next scene.
 */
export default function TrailerViewer({
  autoPlay: propAutoPlay,
  captureMode: propCaptureMode,
  onComplete,
}: TrailerViewerProps) {
  const query = useMemo(() => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const requestedScene = query.get(trailerConfig.capture.sceneParamName);
  const captureMode =
    propCaptureMode ?? (query.get('capture') === 'true' || query.get('capture') === '1');
  const autoPlayParam = query.get('autoplay');
  const autoPlay = propAutoPlay ?? (autoPlayParam !== 'false' && autoPlayParam !== '0');

  const initialScene: TrailerSceneId = isTrailerSceneId(requestedScene)
    ? requestedScene
    : sceneOrder[0];

  const [currentScene, setCurrentScene] = useState<TrailerSceneId>(initialScene);
  const [isAuto, setIsAuto] = useState(autoPlay && !isTrailerSceneId(requestedScene));

  // Keep document title clean in capture mode.
  useEffect(() => {
    if (captureMode && typeof document !== 'undefined') {
      document.title = 'Wanderlust — Steam Trailer';
    }
  }, [captureMode]);

  const handleSceneComplete = useCallback(() => {
    if (!isAuto) return;
    const next = getNextScene(currentScene);
    if (next) {
      setCurrentScene(next);
    } else {
      setIsAuto(false);
      onComplete?.();
    }
  }, [isAuto, currentScene, onComplete]);

  const handleSelectScene = useCallback((sceneId: TrailerSceneId) => {
    setIsAuto(false);
    setCurrentScene(sceneId);
  }, []);

  const handlePlay = useCallback(() => {
    setIsAuto(true);
    if (currentScene === sceneOrder[sceneOrder.length - 1]) {
      setCurrentScene(sceneOrder[0]);
    }
  }, [currentScene]);

  const SceneComponent = sceneComponents[currentScene];

  return (
    <div
      className={`trailer-root trailer-background ${captureMode ? 'trailer-capture-mode' : ''}`}
      style={{
        width: '100%',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SceneComponent
        key={currentScene}
        autoStart={isAuto}
        captureMode={captureMode}
        onComplete={handleSceneComplete}
      />

      {!captureMode && (
        <div
          className="trailer-debug"
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(6, 6, 8, 0.92)',
            border: '1px solid rgba(216,177,62,0.35)',
            color: 'var(--trailer-parchment, #ede0c4)',
            fontSize: '12px',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--trailer-gold, #d8b13e)', marginBottom: '4px' }}>
            Trailer Controls
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {sceneOrder.map((sceneId) => (
              <button
                key={sceneId}
                type="button"
                onClick={() => handleSelectScene(sceneId)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(216,177,62,0.4)',
                  background: currentScene === sceneId ? 'rgba(216,177,62,0.25)' : 'rgba(0,0,0,0.4)',
                  color: 'var(--trailer-parchment, #ede0c4)',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                {sceneLabels[sceneId]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
            <button
              type="button"
              onClick={handlePlay}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(123,201,111,0.5)',
                background: 'rgba(0,0,0,0.4)',
                color: '#7bc96f',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              {isAuto ? 'Running…' : 'Play'}
            </button>
            <span style={{ opacity: 0.7 }}>Auto: {isAuto ? 'on' : 'off'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
