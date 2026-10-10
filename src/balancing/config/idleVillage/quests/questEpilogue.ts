/**
 * questEpilogue — config-first return-report sections (PLAN-019-S4 T-2).
 *
 * The report is extensible by construction: a new category is a new id in
 * `EPILOGUE_SECTION_IDS`, a row in `sections`, an i18n label and a resolver
 * line in `buildQuestEpilogue` — nothing else. Sections render only when
 * they carry at least one line; categories without a village-side system
 * today (titles, diseases, lore) arrive through the authored `epilogue`
 * seam on the scenario, never fabricated at runtime.
 */
import { z } from 'zod';

/** Every section id the report knows — order here is the display order. */
export const EPILOGUE_SECTION_IDS = [
  'dead',
  'wounded',
  'consumed',
  'reward',
  'loot',
  'xp',
  'info',
  'titles',
  'diseases',
  'lore',
] as const;

export type EpilogueSectionId = (typeof EPILOGUE_SECTION_IDS)[number];

const questEpilogueSchema = z
  .object({
    /** Ordered sections of the expedition report — the renderer walks this
     *  list and shows each section only when it produced lines. */
    sections: z.array(z.enum(EPILOGUE_SECTION_IDS)).min(1),
  })
  .strict();

export type QuestEpilogueConfig = z.infer<typeof questEpilogueSchema>;

export const QUEST_EPILOGUE: QuestEpilogueConfig = questEpilogueSchema.parse({
  /* The cost first (what the expedition paid), then what it brought back. */
  sections: [
    'dead',
    'wounded',
    'consumed',
    'reward',
    'loot',
    'xp',
    'info',
    'titles',
    'diseases',
    'lore',
  ],
});
