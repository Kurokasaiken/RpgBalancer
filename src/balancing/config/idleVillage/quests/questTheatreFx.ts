/**
 * Quest theatre — cinema FX configuration (PLAN-025 T-009).
 *
 * Everything about the cinematic accents of the quest window lives here:
 * which beat kinds earn letterboxing, the verdict-edge flash, and the
 * typewriter reveal. No component hardcodes durations, heights or the
 * beat→fx mapping; colors stay in skin tokens at render time.
 */

import { z } from 'zod';
import { EASING_IDS } from './questCameraEasings';

/** Which committed-beat kinds trigger the letterbox. Tone changes only —
 *  a choice scene or a routine check does not earn the bars (Director:
 *  letterbox on the ambush, combat, deaths — not everywhere). */
/** PLAN-043 WS-4 / artifact-r003 §4: the ratified cinema layer/tag vocabulary.
 *  A beat's cut is the ordered set of these tags its stage renders —
 *  authored per-node via `QuestNode.stageDirection.cut`, defaulted per
 *  beat kind via `cinema.cutOn` below. */
/** Camera shot ids — orthogonal to cut tags (artifact-r011 C3). */
export const CameraShotIdSchema = z.enum(['push-in', 'pan-lateral', 'hold', 'verdict-zoom']);
export type CameraShotId = z.infer<typeof CameraShotIdSchema>;

/** Scene node kinds that a beat can carry (mirrors quest runtime node kinds). */
export const CinemaNodeKindSchema = z.enum(['choice', 'check', 'info', 'harm', 'combat', 'end']);
export type CinemaNodeKind = z.infer<typeof CinemaNodeKindSchema>;

/**
 * A camera shot: zoom/pan trajectory + depth-parallax drive.
 * `camVec` is the parallax direction (|v|≤1); `panTo` is a fractional
 * view offset consumed by the edge-safety proof (artifact-r011 §5).
 */
export const CameraShotSchema = z.object({
  zoomFrom: z.number().positive().default(1),
  zoomTo: z.number().positive().default(1),
  panTo: z.tuple([z.number(), z.number()]).default([0, 0]),
  durMs: z.number().int().min(0).default(1600),
  ease: z.enum(EASING_IDS as [string, ...string[]]).default('linear'),
  camVec: z.tuple([z.number().min(-1).max(1), z.number().min(-1).max(1)]).default([0, 0]),
  ampMul: z.number().min(0).default(1),
});
export type CameraShot = z.infer<typeof CameraShotSchema>;

/** Depth-parallax renderer + proof parameters (artifact-r011 §2/§5). */
export const QuestDepthFxSchema = z.object({
  /** Rollout gate: scenes without a manifest entry keep the DOM path. */
  enabled: z.boolean().default(true),
  /** Parallax amplitude as fraction of view width (claude's 0.012). */
  amp: z.number().positive().max(0.1).default(0.012),
  /** Focal depth plane: d<focal moves with the camera, d>focal against. */
  focal: z.number().min(0).max(1).default(0.5),
  /** Shrink factor hiding exposed edges; s_base is DERIVED 1/(1−overscan). */
  overscan: z.number().min(0.01).max(0.1).default(0.04),
  /** Positive safety margin on the edge-safety bound. */
  epsilon: z.number().positive().max(0.05).default(0.002),
  /** Depth sampling taps (1 = single sample; higher = future smoothing). */
  taps: z.number().int().min(1).max(4).default(1),
  dprCap: z.number().min(1).max(3).default(2),
  renderScale: z.number().positive().max(1).default(1),
  /**
   * Supported theater view-aspect range, pinned from gameFrameConfig
   * (expanded 2.1 → classic 2.4, with margin). All proofs evaluate at the
   * range endpoints.
   */
  viewAspectRange: z.tuple([z.number().positive(), z.number().positive()]).default([2.05, 2.45]),
  bake: z
    .object({
      half: z.boolean().default(true),
      blurRadius: z.number().min(0).default(1.5),
      bilateral: z.boolean().default(false),
      maxBytes: z.number().int().positive().default(200 * 1024),
    })
    .prefault({}),
});
export type QuestDepthFx = z.infer<typeof QuestDepthFxSchema>;

/**
 * Camera namespace: presets/shots orthogonal to cut tags, plus the
 * precedence chain `stageDirection.camera > byNodeKind > byBeatKind >
 * cutOn > idleDrift` (cutOn stays in `cinema` — it selects cut tags).
 */
export const QuestCameraFxSchema = z.object({
  /** The always-on drift — the current 16s Ken Burns, in shot form. */
  idleDrift: CameraShotSchema,
  shots: z.record(CameraShotIdSchema, CameraShotSchema),
  byNodeKind: z.partialRecord(CinemaNodeKindSchema, CameraShotIdSchema).default({}),
  /** For beats without a node kind (scene/check/harm/end/recap). */
  byBeatKind: z.partialRecord(z.enum(['scene', 'check', 'harm', 'end', 'recap']), CameraShotIdSchema).default({}),
});
export type QuestCameraFx = z.infer<typeof QuestCameraFxSchema>;

export const CinemaCutTagSchema = z.enum([
  'reveal',
  'impact',
  'breath',
  'push',
  'bars',
  'j-cut',
  'expanded',
]);
export type CinemaCutTag = z.infer<typeof CinemaCutTagSchema>;

/** Which committed-beat kinds the cue projection knows about. */
export const QuestTheatreBeatKindSchema = z.enum(['scene', 'check', 'harm', 'end', 'recap']);
export type QuestTheatreBeatKind = z.infer<typeof QuestTheatreBeatKindSchema>;

export const QuestTheatreLetterboxOnSchema = z.object({
  /** Scene beat arriving on a `kind:'harm'` node (the goblin ambush). */
  harmScene: z.boolean().default(true),
  /** Scene beat arriving on a `kind:'combat'` node. */
  combatScene: z.boolean().default(true),
  /** Check beat produced by a combat turn (kills tracked). */
  combatTurn: z.boolean().default(true),
  /** Harm beat with `kind:'death'` — the weight stays in the colour (D-8). */
  death: z.boolean().default(true),
  /** Terminal beat — the curtain closing on the run. */
  end: z.boolean().default(true),
});

export const QuestTheatreFxSchema = z.object({
  /** Black bars closing in from top/bottom over the theater image. */
  letterbox: z
    .object({
      enabled: z.boolean().default(true),
      /** Each bar's height as % of the theater's height. */
      heightPct: z.number().min(1).max(50).default(12),
      inMs: z.number().int().min(0).default(400),
      outMs: z.number().int().min(0).default(350),
      on: QuestTheatreLetterboxOnSchema.prefault({}),
    })
    .prefault({}),

  /** A one-shot coloured edge flash over the beat stage, keyed per beat —
   *  reads the verdict before the text (verdict → skin tone, configured here). */
  edgeFlash: z
    .object({
      enabled: z.boolean().default(true),
      durationMs: z.number().int().min(0).default(450),
      verdictTones: z
        .object({
          bigwin: z.string().default('ok'),
          win: z.string().default('ok'),
          almost: z.string().default('warn'),
          fail: z.string().default('danger'),
          epicfail: z.string().default('death'),
        })
        .prefault({}),
    })
    .prefault({}),

  /** Character-by-character reveal — only where it earns the cost. */
  typewriter: z
    .object({
      enabled: z.boolean().default(true),
      charsPerSecond: z.number().positive().default(55),
      on: z
        .object({
          /** Scene body while a scene beat is on stage. */
          sceneBody: z.boolean().default(true),
          /** Authored verdict flavor on check beats. */
          checkFlavor: z.boolean().default(false),
        })
        .prefault({}),
    })
    .prefault({}),

  /** The -HP floater rising over the hit member's combat cell (T-010):
   *  one per harm beat, keyed by beat id. */
  damageFloater: z
    .object({
      enabled: z.boolean().default(true),
      durationMs: z.number().int().min(0).default(900),
      risePx: z.number().min(0).default(18),
    })
    .prefault({}),

  /** PLAN-043 WS-4 / artifact-r003 §4: the cinema layer system. Each beat's
   *  `QuestTheatreCue` is an ordered set of tags rendered by dedicated
   *  primitives in `cinemaFx.tsx`; authored `stageDirection.cut` on the
   *  node overrides `cutOn[kind]`. */
  cinema: z
    .object({
      /** Center-aperture reveal for scene cuts; reduced-motion swaps it for
       *  a `reducedMotionFadeMs` fade (BV-09). */
      revealMs: z.number().int().min(0).default(1400),
      reducedMotionFadeMs: z.number().int().min(0).default(150),
      /** Impact shake for check verdicts / harm beats. */
      impact: z
        .object({
          enabled: z.boolean().default(true),
          /** Shake amplitude, px. */
          ampPx: z.number().positive().default(6),
          durationMs: z.number().int().min(0).default(260),
        })
        .prefault({}),
      /** Pre-verdict breath: a brief saturate/contrast pulse on the theatre
       *  frame while the check's outcome is about to land. `usesFilter`
       *  flips to false on engines where the filter costs p95 >16.6ms
       *  (BV-14) — a solid fallback keeps the beat readable. */
      breath: z
        .object({
          enabled: z.boolean().default(true),
          durationMs: z.number().int().min(0).default(100),
          usesFilter: z.boolean().default(true),
        })
        .prefault({}),
      /** Slow push-in (Ken Burns dolly) on the theatre scene. */
      push: z
        .object({
          enabled: z.boolean().default(true),
          scaleTo: z.number().min(1).default(1.06),
          durationMs: z.number().int().min(0).default(1600),
        })
        .prefault({}),
      /** J-cut lead: the beat's audio cue fires this many ms before its
       *  visual cut lands. */
      jCutLeadMs: z.number().int().min(0).default(450),
      /** Default cut tags per beat kind when the node has no
       *  `stageDirection.cut`. `expanded` widens the stage (BV-11). */
      cutOn: z
        .object({
          scene: z.array(CinemaCutTagSchema).default(['reveal', 'push']),
          check: z.array(CinemaCutTagSchema).default(['impact', 'breath', 'j-cut']),
          harm: z.array(CinemaCutTagSchema).default(['impact']),
          end: z.array(CinemaCutTagSchema).default(['bars', 'reveal']),
          recap: z.array(CinemaCutTagSchema).default([]),
        })
        .prefault({}),
    })
    .prefault({}),

  /** PLAN-046 / artifact-r011 C3: camera shots live in an orthogonal
   *  namespace — cut tags keep their meaning, presets carry the
   *  camera-move semantics (push-in combat, pan travel, hold dialogue,
   *  zoom verdict). */
  camera: QuestCameraFxSchema.prefault({
    idleDrift: { zoomTo: 1.05, durMs: 16000, ease: 'sineInOut', camVec: [0.5, 0.12], ampMul: 1 },
    shots: {
      'push-in': { zoomTo: 1.06, durMs: 1600, ease: 'linear', camVec: [0.35, 0.12], ampMul: 1 },
      'pan-lateral': { zoomTo: 1.05, panTo: [0.012, 0], durMs: 6000, ease: 'sineInOut', camVec: [0.55, 0], ampMul: 1 },
      hold: { zoomTo: 1, durMs: 0, ease: 'linear', camVec: [0, 0], ampMul: 0.5 },
      'verdict-zoom': { zoomTo: 1.12, durMs: 900, ease: 'quadInOut', camVec: [0.5, 0.2], ampMul: 1 },
    },
    byNodeKind: {
      combat: 'push-in',
      harm: 'push-in',
      check: 'verdict-zoom',
      info: 'pan-lateral',
      choice: 'hold',
      end: 'verdict-zoom',
    },
    byBeatKind: { check: 'hold', harm: 'push-in', end: 'verdict-zoom', recap: 'hold' },
  }),

  /** PLAN-046 §4: depth-parallax renderer parameters + proof inputs. */
  depth: QuestDepthFxSchema.prefault({}),
});

export type QuestTheatreFxConfig = z.infer<typeof QuestTheatreFxSchema>;
export type QuestTheatreLetterboxOn = z.infer<typeof QuestTheatreLetterboxOnSchema>;

/** The shipped default — validated once at module load. */
export const DEFAULT_QUEST_THEATRE_FX: QuestTheatreFxConfig = QuestTheatreFxSchema.parse({});
