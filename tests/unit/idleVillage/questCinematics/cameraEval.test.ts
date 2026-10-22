/** cameraEval unit tests — pure camera evaluation + precedence (PLAN-046). */

import { describe, expect, it } from 'vitest';
import { DEFAULT_QUEST_THEATRE_FX, type CameraShot } from '@/balancing/config/idleVillage/quests/questTheatreFx';
import { resolveShot, shotEpochFor } from '@/ui/idleVillage/questS1Lab/render/cameraEval';
import { cameraAt } from '@/ui/idleVillage/questS1Lab/render/depthTransform';

const CAM = DEFAULT_QUEST_THEATRE_FX.camera;

describe('shotEpochFor — clock-domain alignment', () => {
  it('roots frozen captures and loop clocks at elapsed time zero', () => {
    expect(shotEpochFor('live', 2400, 987654)).toBe(0);
    expect(shotEpochFor('loop', null, 987654)).toBe(0);
  });

  it('uses an absolute origin only for the live document clock', () => {
    expect(shotEpochFor('live', null, 987654)).toBe(987654);
  });
});

describe('cameraAt — pure evaluator at start/middle/end', () => {
  const shot: CameraShot = {
    zoomFrom: 1,
    zoomTo: 1.1,
    panFrom: [0, 0],
    panTo: [0.02, 0],
    blurFrom: 0,
    blurTo: 0,
    durMs: 1000,
    ease: 'linear',
    camVec: [0.5, 0],
    ampMul: 1,
  };

  it('t=0 returns the shot start exactly', () => {
    const s = cameraAt(shot, 0);
    expect(s.e).toBe(0);
    expect(s.zoom).toBe(1);
    expect(s.pan[0]).toBe(0);
  });
  it('mid-shot interpolates (linear)', () => {
    const s = cameraAt(shot, 500);
    expect(s.zoom).toBeCloseTo(1.05);
    expect(s.pan[0]).toBeCloseTo(0.01);
  });
  it('past the end it holds the end state', () => {
    const s = cameraAt(shot, 99999);
    expect(s.zoom).toBeCloseTo(1.1);
    expect(s.pan[0]).toBeCloseTo(0.02);
  });
  it('negative t clamps to start', () => {
    expect(cameraAt(shot, -50).e).toBe(0);
  });
  it('durMs=0 snaps to the end immediately', () => {
    const s = cameraAt({ ...shot, durMs: 0 }, 0);
    expect(s.zoom).toBeCloseTo(1.1);
  });
  it('ramps depth parallax from zero to the authored vector over the shot', () => {
    const start = cameraAt(shot, 0);
    const s = cameraAt(shot, 500);
    const end = cameraAt(shot, 1000);
    expect(start.camVec).toEqual([0, 0]);
    expect(s.camVec).toEqual([0.25, 0]);
    expect(end.camVec).toEqual([0.5, 0]);
    expect(s.ampMul).toBe(1);
  });
  it('entrance shot interpolates panFrom→panTo and blurFrom→blurTo', () => {
    const enter: CameraShot = {
      ...shot,
      zoomFrom: 1.14,
      zoomTo: 1,
      panFrom: [-0.045, 0],
      panTo: [0, 0],
      blurFrom: 3,
      durMs: 650,
    };
    const start = cameraAt(enter, 0);
    expect(start.pan[0]).toBeCloseTo(-0.045);
    expect(start.blur).toBeCloseTo(3);
    const mid = cameraAt(enter, 325);
    expect(mid.pan[0]).toBeCloseTo(-0.0225);
    expect(mid.blur).toBeCloseTo(1.5);
    const end = cameraAt(enter, 99999);
    expect(end.pan[0]).toBeCloseTo(0);
    expect(end.blur).toBeCloseTo(0);
    expect(end.zoom).toBeCloseTo(1);
  });
  it('blurSettleFrac resolves focus before the camera settles', () => {
    const enter: CameraShot = {
      ...shot,
      blurFrom: 2,
      blurTo: 0,
      blurSettleFrac: 0.4,
      durMs: 2000,
      ease: 'linear',
    };
    /* Focus fully resolved by 40% of the shot; zoom still travelling. */
    const at40 = cameraAt(enter, 800);
    expect(at40.blur).toBeCloseTo(0);
    expect(at40.e).toBeCloseTo(0.4);
    /* Mid-window interpolation still follows the shot's easing. */
    const at20 = cameraAt(enter, 400);
    expect(at20.blur).toBeCloseTo(1);
  });
});

describe('resolveShot — precedence stageDirection.camera > byNodeKind > byBeatKind > cutOn > idleDrift', () => {
  it('authored node camera wins over everything', () => {
    const shot = resolveShot(
      { kind: 'scene' },
      { kind: 'combat', stageDirection: { camera: 'hold' } },
      ['push'],
      CAM,
    );
    expect(shot).toBe(CAM.shots.hold);
  });
  it('byNodeKind beats byBeatKind and cutOn', () => {
    const shot = resolveShot({ kind: 'scene' }, { kind: 'info' }, ['push'], CAM);
    expect(shot).toBe(CAM.shots['pan-lateral']);
  });
  it('byBeatKind applies when there is no node kind', () => {
    const shot = resolveShot({ kind: 'harm' }, undefined, ['impact'], CAM);
    expect(shot).toBe(CAM.shots['push-in']);
  });
  it('an unknown authored camera id falls through to the next layer', () => {
    const shot = resolveShot(
      { kind: 'scene' },
      { kind: 'combat', stageDirection: { camera: 'not-a-shot' } },
      [],
      CAM,
    );
    expect(shot).toBe(CAM.shots['push-in']); // byNodeKind combat
  });
  it('cutOn "push" maps to the push-in shot (legacy compat)', () => {
    const shot = resolveShot({ kind: 'scene' }, { kind: 'choice' }, ['reveal', 'push'], CAM);
    // choice → byNodeKind 'hold' wins over cutOn
    expect(shot).toBe(CAM.shots.hold);
    const noNode = resolveShot({ kind: 'scene' }, undefined, ['reveal', 'push'], CAM);
    expect(noNode).toBe(CAM.shots['push-in']);
  });
  it('falls back to idleDrift', () => {
    const shot = resolveShot(undefined, undefined, [], CAM);
    expect(shot).toBe(CAM.idleDrift);
  });
});

describe('resolveShot — PLAN-050 ingresso × posa (scene ctx)', () => {
  const scene = { kind: 'scene' as const };
  const node = { kind: 'choice' }; // would map to 'hold' via byNodeKind

  it('new art + authored entrance → the entrance fires (not the kind chain)', () => {
    const shot = resolveShot(scene, node, [], CAM, {
      artChanged: true,
      entrance: 'enter-creep',
      pose: 'pose-watch',
    });
    expect(shot).toBe(CAM.shots['enter-creep']);
  });
  it('new art + manifest pose but NO entrance → the default entrance still fires', () => {
    const shot = resolveShot(scene, node, [], CAM, {
      artChanged: true,
      pose: 'pose-watch',
    });
    expect(shot).toBe(CAM.shots['enter-settle']);
  });
  it('same art + authored pose → the hold pose, never a re-entrance', () => {
    const shot = resolveShot(scene, node, [], CAM, {
      artChanged: false,
      entrance: 'enter-creep',
      pose: 'pose-watch',
    });
    expect(shot).toBe(CAM.shots['pose-watch']);
  });
  it('same art + entrance only (no pose) → falls to the kind chain', () => {
    const shot = resolveShot(scene, node, [], CAM, {
      artChanged: false,
      entrance: 'enter-creep',
    });
    expect(shot).toBe(CAM.shots.hold); // byNodeKind choice
  });
  it('non-scene beats ignore the scene ctx entirely', () => {
    const shot = resolveShot({ kind: 'harm' }, undefined, ['impact'], CAM, {
      artChanged: true,
      entrance: 'enter-creep',
      pose: 'pose-watch',
    });
    expect(shot).toBe(CAM.shots['push-in']); // byBeatKind harm
  });
  it('scene ctx without any authored pair → legacy chain untouched', () => {
    const shot = resolveShot(scene, node, [], CAM, { artChanged: true });
    expect(shot).toBe(CAM.shots.hold);
  });
  it('authored stageDirection.camera still wins over the manifest pair', () => {
    const shot = resolveShot(
      scene,
      { kind: 'choice', stageDirection: { camera: 'pan-lateral' } },
      [],
      CAM,
      { artChanged: true, entrance: 'enter-creep', pose: 'pose-watch' },
    );
    expect(shot).toBe(CAM.shots['pan-lateral']);
  });
});
