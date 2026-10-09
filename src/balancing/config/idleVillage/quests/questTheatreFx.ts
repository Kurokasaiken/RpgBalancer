/**
 * Quest theatre — cinema FX configuration (PLAN-025 T-009).
 *
 * Everything about the cinematic accents of the quest window lives here:
 * which beat kinds earn letterboxing, the verdict-edge flash, and the
 * typewriter reveal. No component hardcodes durations, heights or the
 * beat→fx mapping; colors stay in skin tokens at render time.
 */

import { z } from 'zod';

/** Which committed-beat kinds trigger the letterbox. Tone changes only —
 *  a choice scene or a routine check does not earn the bars (Director:
 *  letterbox on the ambush, combat, deaths — not everywhere). */
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
});

export type QuestTheatreFxConfig = z.infer<typeof QuestTheatreFxSchema>;
export type QuestTheatreLetterboxOn = z.infer<typeof QuestTheatreLetterboxOnSchema>;

/** The shipped default — validated once at module load. */
export const DEFAULT_QUEST_THEATRE_FX: QuestTheatreFxConfig = QuestTheatreFxSchema.parse({});
