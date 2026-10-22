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
/** Default entrance personality when the art changes but the scene's
 *  manifest entry authors none (artifact: ingresso × posa grammar). */
const DEFAULT_ENTRANCE: CameraShotId = 'enter-settle';

/**
 * PLAN-050 §3/§7 — scene context for the ingresso × posa grammar.
 *  `artChanged` = the beat lands on artwork different from what was on
 *  stage (the only moment an entrance may fire); `entrance`/`pose` are the
 *  manifest's authored personalities for this scene, when it has one.
 */
export interface CameraSceneCtx {
  artChanged?: boolean;
  entrance?: CameraShotId;
  pose?: CameraShotId;
}

/**
 * Resolve the active camera shot for a beat.
 * `cueTags` is the already-resolved cut list (stageDirection.cut ?? cutOn).
 */
export function resolveShot(
  beat: CameraBeatLike | null | undefined,
  node: CameraNodeLike | null | undefined,
  cueTags: readonly CinemaCutTag[],
  cfg: QuestCameraFx,
  scene?: CameraSceneCtx,
): CameraShot {
  const authored = node?.stageDirection?.camera;
  if (authored && CameraShotIdSchema.safeParse(authored).success) {
    return cfg.shots[authored as CameraShotId];
  }
  /* Ingresso × posa: a scene beat on NEW art enters with the authored
   *  personality (or the default settle); a scene beat on the SAME art
   *  never re-enters — it takes the authored hold pose instead. Only when
   *  the manifest ships an entrance/pose pair does this branch engage —
   *  legacy art keeps the kind-based chain below. */
  if (beat?.kind === 'scene' && scene && (scene.entrance || scene.pose)) {
    if (scene.artChanged) return cfg.shots[scene.entrance ?? DEFAULT_ENTRANCE];
    if (scene.pose) return cfg.shots[scene.pose];
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
 * Resolve a shot's time origin in the same domain as the lab clock.
 * Frozen captures and modulo-loop clocks are elapsed-time domains rooted at
 * zero; only the live document timeline uses an absolute epoch.
 */
export function shotEpochFor(
  clockMode: 'live' | 'loop',
  frozenT: number | null,
  liveEpoch: number,
): number {
  return frozenT != null || clockMode === 'loop' ? 0 : liveEpoch;
}

/**
 * Production clock: the document timeline (same clock Web Animations use —
 * DOM FX and GPU uniforms cannot drift apart). In tests inject a manual one.
 */
export const documentClock: CameraClock = () =>
  typeof document !== 'undefined' && document.timeline?.currentTime != null
    ? (document.timeline.currentTime as number)
    : performance.now();
