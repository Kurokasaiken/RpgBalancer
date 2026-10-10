/**
 * questTraits — the persistent narrative trait registry (PLAN-026 T5).
 *
 * A trait is a persistent property of a party member (`LabMember.traits`,
 * `ResidentState.traits`, `ReferenceMember.traits`) that changes what a
 * quest run CAN do or CAN become: it gates options (`requiresTrait` /
 * `hiddenIfTrait`) and arms run-start twists (`ArmRoll.requiresTrait`).
 * Traits carry no numeric effect themselves — they open routes the
 * scenario authors/generators hang on them. The party IS a twist
 * vector: composition changes the run's possibility space, not its odds.
 *
 * Registry role: the id set is CLOSED — scenario data referencing an
 * unknown id fails schema validation, so a typo is a data error, not a
 * silently dead gate.
 */

import { z } from 'zod';

/** A persistent narrative trait — identity plus player-facing copy. */
export const QuestTraitSchema = z
  .object({
    /** Stable id used in scenario data (`requiresTrait` etc.). */
    id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'trait id deve essere kebab-case'),
    /** Short display label (Italian). */
    label: z.string().min(1).max(24),
    /** One-line description of what the trait means for the member. */
    description: z.string().min(1).max(200),
    /** What the trait typically does in quest structure — doc only,
     *  the mechanics live in the scenario data that references the id. */
    mechanicalNote: z.string().min(1).max(240),
  })
  .strict();
export type QuestTrait = z.infer<typeof QuestTraitSchema>;

/**
 * The three prototype traits (contract scope: 3 definitions).
 * - `avido` — greed: opens the deepest loot lines, arms greed twists.
 * - `prudente` — caution: buys time/safety the structure otherwise denies.
 * - `scavezzacollo` — daredevil: arms the pursuit twist, unlocks
 *   all-or-nothing routes.
 */
export const QUEST_TRAITS: Readonly<Record<string, QuestTrait>> = {
  avido: QuestTraitSchema.parse({
    id: 'avido',
    label: 'Avido',
    description: 'Non sa quando smettere: se c’è un pezzo in più da prendere, lo prende.',
    mechanicalNote: 'Sblocca opzioni di bottino extra (es. ultimo carico) e arma twist di avidità a inizio run (es. cassa-madre).',
  }),
  prudente: QuestTraitSchema.parse({
    id: 'prudente',
    label: 'Prudente',
    description: 'Conta i passi prima di farli: compra tempo dove la struttura lo nega.',
    mechanicalNote: 'Sblocca opzioni difensive (es. puntellare la falla, attesa) — di solito una volta sola, a costo di tempo.',
  }),
  scavezzacollo: QuestTraitSchema.parse({
    id: 'scavezzacollo',
    label: 'Scavezzacollo',
    description: 'Se c’è un varco impossibile, lo tenta: il pericolo lo attira.',
    mechanicalNote: 'Arma twist di inseguimento/rischio a inizio run e sblocca rotte tutto-o-niente.',
  }),
};

/** True iff `id` is a registered quest trait. */
export function isQuestTrait(id: string): boolean {
  return id in QUEST_TRAITS;
}
