/**
 * TheaterLabPage — /theater-lab, dev-only eye-check + evidence capture for
 * PLAN-046 slice 1 (depth-parallax quest cinematics).
 *
 * Query params:
 *   scene   art id (default `agguato-foresta`) — anything unlisted in the
 *           manifest exercises the no-depth DOM path;
 *   shot    shot id or `idle` (default `push-in`);
 *   t       frozen shot time in ms (omit = live clock; `loop` repeats);
 *   amp     amplitude multiplier on top of the manifest ampMul (default 1,
 *           e.g. `3` for the exaggerated comparison strip);
 *   aspect  view aspect (default 2.4);
 *   dom=1   force the DOM path (depth pipeline disabled);
 *   width   theater width in px (default 960).
 *
 * Every variant mounts the same DepthScene the real Theater mounts — what
 * the Director reviews here is what runs on /game.
 */

import React, { useMemo } from 'react';
import { DepthScene } from '@/ui/idleVillage/questS1Lab/render/DepthScene';
import { documentClock } from '@/ui/idleVillage/questS1Lab/render/cameraEval';
import { SCENE_CINEMATICS, artIdFromSrc } from '@/ui/idleVillage/questS1Lab/render/sceneManifest';
import { NODE_ART } from '@/ui/idleVillage/questS1Lab/questArt';
import {
  DEFAULT_QUEST_THEATRE_FX,
  CameraShotIdSchema,
  type CameraShot,
} from '@/balancing/config/idleVillage/quests/questTheatreFx';

/** All art srcs keyed by their manifest art id (for the scene picker). */
const ART_BY_ID: Record<string, { src: string; fit: string }> = Object.fromEntries(
  Object.entries(NODE_ART).map(([k, v]) => [artIdFromSrc(v.src), v]),
);

export const TheaterLabPage: React.FC = () => {
  const q = useMemo(() => new URLSearchParams(window.location.search), []);
  const sceneId = q.get('scene') ?? 'agguato-foresta';
  const shotId = q.get('shot') ?? 'push-in';
  const aspect = Number(q.get('aspect') ?? 2.4);
  const width = Number(q.get('width') ?? 960);
  const amp = Number(q.get('amp') ?? 1);
  const domOnly = q.get('dom') === '1';
  const loop = q.get('t') === 'loop';
  const frozenT = q.get('t') != null && !loop ? Number(q.get('t')) : null;

  const art = ART_BY_ID[sceneId];
  const entry = SCENE_CINEMATICS[sceneId];
  const cam = DEFAULT_QUEST_THEATRE_FX.camera;
  const shot: CameraShot =
    shotId === 'idle' || !CameraShotIdSchema.safeParse(shotId).success
      ? cam.idleDrift
      : cam.shots[CameraShotIdSchema.parse(shotId)];

  const cfg = useMemo(
    () => ({ ...DEFAULT_QUEST_THEATRE_FX.depth, enabled: !domOnly }),
    [domOnly],
  );

  /* Frozen clock for deterministic captures; live/loop for the eye-check. */
  const clock = useMemo(() => {
    if (frozenT != null) return () => frozenT;
    if (loop && shot.durMs > 0) return () => documentClock() % shot.durMs;
    return () => documentClock();
  }, [frozenT, loop, shot.durMs]);

  const src = art?.src;
  const depthSrc = entry?.depth ?? '/assets/depth/agguato-foresta.webp';
  const imgAspect = entry?.imgAspect ?? 2.357;
  const hasDepth = !!entry && art?.fit === 'cover';

  return (
    <div data-testid="theater-lab" style={{ minHeight: '100vh', background: '#0b0d10', padding: 24, color: '#cfd3d8', fontFamily: 'monospace' }}>
      <div style={{ marginBottom: 12, fontSize: 12, lineHeight: 1.7 }}>
        theater-lab — scene={sceneId} shot={shotId} t={q.get('t') ?? 'live'} amp={amp} aspect={aspect}
        {domOnly ? ' [DOM]' : ''}
        {!hasDepth ? ' [no manifest entry → DOM path]' : ''}
      </div>
      <div
        data-testid="theater-lab-frame"
        style={{
          position: 'relative',
          width,
          aspectRatio: String(aspect),
          overflow: 'hidden',
          borderRadius: 6,
          border: '1px solid #2a2e33',
          background: '#05070a',
        }}
      >
        {src && hasDepth ? (
          <DepthScene
            src={src}
            depthSrc={depthSrc}
            imgAspect={imgAspect}
            viewAspect={aspect}
            ampMul={amp * (entry?.ampMul ?? 1)}
            shot={shot}
            shotEpoch={0}
            cfg={cfg}
            reducedMotion={window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false}
            clock={clock}
          />
        ) : (
          src && (
            /* No manifest entry / non-cover art — the same DOM fallback the
             *  real Theater mounts (missing-depth path, OB-3). */
            <img
              src={src}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 40%' }}
            />
          )
        )}
      </div>
    </div>
  );
};

export default TheaterLabPage;
