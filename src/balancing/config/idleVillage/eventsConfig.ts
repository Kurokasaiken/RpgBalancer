/**
 * eventsConfig — Eventi strategici di medio/lungo termine (PLAN-117 rev. 5,
 * T0.4). Modello dati minimo per il componente timeline dedicato (F5, D-12):
 * gli Eventi NON sono mai marker sulla mappa.
 *
 * ## Inventario delle fonti esistenti (T0.4)
 *
 * - `src/ui/idleVillage/config/seaWonders.ts` — `seaWonderCatalog`: meraviglie
 *   marine con spawn defaults; semi di "evento a scadenza" positivo/neutro.
 * - `src/balancing/config/idleVillage/eventReminderTokens.ts` — band di
 *   reminder (`REMINDER_BANDS`, `bandForDays`): soglie temporali già
 *   quantizzate, riferimento per il render del countdown nelle voci timeline.
 * - `src/balancing/config/idleVillage/goblinEventModalTokens.ts` — token del
 *   (deprecato) modal evento goblin: riferimento tematico per `kind:
 *   'negative'`; il modal stesso viola GX-0042, non si riusa.
 * - `src/ui/idleVillage/components/ReminderComponentV2/V3.tsx` — reminder
 *   dorato/gilded obsoleto: riferimento di superficie per la timeline F5,
 *   non riuso diretto (stato `calm|urgent|active` già allineato alla logica
 *   "scadenza si avvicina").
 * - `src/ui/idleVillage/components/QuestDecisionFeed*.tsx` — feed decisioni:
 *   pattern lista ordinata + header + toolbar; riferimento di composizione
 *   per la timeline, non di semantica (qui le voci sono eventi, non log).
 * - `villageZoneManifest.ts` — zone del villaggio: gli eventi possono avere
 *   `placeId` per linkare un Luogo senza diventare marker.
 *
 * ## Modello (D-12)
 *
 * `StrategicEventDefinition`: obiettivo positivo o negativo con scadenza in
 * turni (`deadlineTurn`), ordinato per scadenza nel componente dedicato.
 * `placeId?` linka un Luogo autoriale quando l'evento è ancorato a un
 * territorio — il link non crea mai un marker (OB-11: test negativo).
 */
import { z } from 'zod';

export const StrategicEventKindSchema = z.enum(['positive', 'negative']);
export type StrategicEventKind = z.infer<typeof StrategicEventKindSchema>;

export const StrategicEventDefinitionSchema = z
  .object({
    id: z.string().min(1),
    /** Sign of the objective — readable via icon+glyph, never colour-only. */
    kind: StrategicEventKindSchema,
    /** Turn index at which the event lands (drives deadline ordering). */
    deadlineTurn: z.number().int().nonnegative(),
    /** Optional authored Place anchor — a link, never a map marker. */
    placeId: z.string().min(1).optional(),
    /** i18n key for the event title (idleVillage namespace). */
    titleKey: z.string().min(1),
    /** i18n key for the event body/description. */
    bodyKey: z.string().optional(),
    /** Marks authored-but-fake fixture content (D-2). */
    fixture: z.boolean().optional(),
  })
  .strict();
export type StrategicEventDefinition = z.infer<typeof StrategicEventDefinitionSchema>;

export const EventsConfigSchema = z
  .object({
    events: z.array(StrategicEventDefinitionSchema),
  })
  .strict();
export type EventsConfig = z.infer<typeof EventsConfigSchema>;

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
};

const RAW_EVENTS_CONFIG = {
  events: [
    {
      /** FIXTURE (D-2) — the canonical negative example from the Director. */
      id: 'event_fixture_goblin_invasion',
      kind: 'negative',
      deadlineTurn: 15,
      placeId: 'place_village_start',
      titleKey: 'idleVillage.events.goblinInvasion.title',
      bodyKey: 'idleVillage.events.goblinInvasion.body',
      fixture: true,
    },
  ],
} as const;

export const EVENTS_CONFIG: EventsConfig = deepFreeze(EventsConfigSchema.parse(RAW_EVENTS_CONFIG));

/**
 * Timeline ordering (F5 contract): earliest deadline first; ties keep the
 * authored order (stable). Never mutates the input.
 */
export function sortStrategicEvents(
  events: readonly StrategicEventDefinition[],
): StrategicEventDefinition[] {
  return [...events].sort((a, b) => a.deadlineTurn - b.deadlineTurn);
}
