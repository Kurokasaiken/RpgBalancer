/**
 * cameraEval — shot resolution and the shared camera clock (PLAN-046).
 *
 * Precedence (artifact-r011 C3):
 *   stageDirection.camera > byNodeKind > byBeatKind > cutOn('push') > idleDrift.
 * The returned shot is consumed by BOTH the Pixi uniforms and the DOM
 * fallback transform, driven by one clock (document.timeline in prod —
 * injectable in tests).
 */

import {
  CameraShotIdSchema,
  type CameraShot,
  type CameraShotId,
  type QuestCameraFx,
} from '@/balancing/config/idleVillage/quests/questTheatreFx';
import type { CinemaCutTag } from '@/balancing/config/idleVillage/quests/questTheatreFx';

/** Beat shape the resolver needs — kept minimal on purpose. */
export interface CameraBeatLike {
  kind: 'scene' | 'check' | 'harm' | 'end' | 'recap';
}

/** Node shape the resolver needs (kind + authored camera override). */
export interface CameraNodeLike {
  kind?: string;
  stageDirection?: { camera?: string; cut?: CinemaCutTag[] };
}

/** Map legacy 'push' cut-tag behaviour onto the shot namespace. */
const PUSH_CUT_TO_SHOT: CameraShotId = 'push-in';

/**
 * Resolve the active camera shot for a beat.
 * `cueTags` is the already-resolved cut list (stageDirection.cut ?? cutOn).
 */
export function resolveShot(
  beat: CameraBeatLike | null | undefined,
  node: CameraNodeLike | null | undefined,
  cueTags: readonly CinemaCutTag[],
  cfg: QuestCameraFx,
): CameraShot {
  const authored = node?.stageDirection?.camera;
  if (authored && CameraShotIdSchema.safeParse(authored).success) {
    return cfg.shots[authored as CameraShotId];
  }
  if (node?.kind) {
    const byNode = cfg.byNodeKind[node.kind as keyof typeof cfg.byNodeKind];
    if (byNode) return cfg.shots[byNode];
  }
  if (beat) {
    const byBeat = cfg.byBeatKind[beat.kind];
    if (byBeat) return cfg.shots[byBeat];
  }
  if (cueTags.includes('push')) return cfg.shots[PUSH_CUT_TO_SHOT];
  return cfg.idleDrift;
}

export type CameraClock = () => number;

/**
 * Production clock: the document timeline (same clock Web Animations use —
 * DOM FX and GPU uniforms cannot drift apart). In tests inject a manual one.
 */
export const documentClock: CameraClock = () =>
  typeof document !== 'undefined' && document.timeline?.currentTime != null
    ? (document.timeline.currentTime as number)
    : performance.now();
