/** cameraEval unit tests — pure camera evaluation + precedence (PLAN-046). */

import { describe, expect, it } from 'vitest';
import { DEFAULT_QUEST_THEATRE_FX, type CameraShot } from '@/balancing/config/idleVillage/quests/questTheatreFx';
import { resolveShot } from '@/ui/idleVillage/questS1Lab/render/cameraEval';
import { cameraAt } from '@/ui/idleVillage/questS1Lab/render/depthTransform';

const CAM = DEFAULT_QUEST_THEATRE_FX.camera;

describe('cameraAt — pure evaluator at start/middle/end', () => {
  const shot: CameraShot = {
    zoomFrom: 1,
    zoomTo: 1.1,
    panTo: [0.02, 0],
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
  it('carries camVec + ampMul through', () => {
    const s = cameraAt(shot, 500);
    expect(s.camVec).toEqual([0.5, 0]);
    expect(s.ampMul).toBe(1);
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
