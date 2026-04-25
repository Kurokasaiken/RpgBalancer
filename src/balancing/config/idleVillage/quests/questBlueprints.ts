import { QuestBlueprintsSchema, type QuestBlueprint, type QuestPhase } from './questBlueprints.schema';

/**
 * Untyped blueprint payloads authored via config. Validated once to produce
 * {@link defaultQuestBlueprints} that downstream systems can trust.
 */
const RAW_DEFAULT_BLUEPRINTS: Record<string, QuestBlueprint> = {
  quest_city_rats: {
    id: 'quest_city_rats',
    name: 'Cull Rats – Sequenza Narrativa',
    activityId: 'quest_city_rats',
    slotId: 'village_square',
    tags: ['quest', 'city', 'purge'],
    difficulty: 'dangerous',
    narrative:
      'Tre battute successive per liberare i tunnel dai ratti e purificare le bocche di scarico. Blueprint dimostrativa per la Quest Chronicle.',
    icon: '🐀',
    rewards: {
      resources: [
        { resourceId: 'materials', amountFormula: '2' },
        { resourceId: 'renown', amountFormula: '1' },
      ],
      items: {
        city_rats_trophy: 1,
      },
      reputation: {
        lantern_guild: 2,
      },
    },
    telemetry: {
      eventId: 'quest_blueprint_city_rats',
      enabled: true,
      tags: ['quest', 'city_rats'],
    },
    phases: [
      {
        id: 'scout_tunnels',
        title: 'Ispeziona i Tunnel',
        type: 'check',
        durationValue: 2,
        durationUnits: 'hours',
        requirements: {
          statRequirement: {
            label: 'Lantern Scout',
            allOf: ['lantern'],
          },
        },
        successEffects: {
          notes: 'Rivela i nodi infestati e riduce il rischio del combattimento.',
        },
        failureEffects: {
          notes: 'Aumenta l’iniziativa dei ratti nella fase successiva.',
        },
        copy: {
          summary: 'Lanterniere e ausiliari marcano i tunnel infestati prima dell’incursione.',
          narrative:
            'Le squadre di scout percorrono i condotti laterali lasciando segnali alchemici per guidare i combattenti.',
          callToAction: 'Schiera i lantern scout per rivelare i nidi principali.',
        },
        icon: '🕯️',
        telemetryTags: ['quest_city_rats', 'phase:scout'],
        riskProfile: {
          injuryChance: 5,
          deathChance: 0,
          fatigueCost: 4,
          threatLabel: 'Bassa',
        },
      },
      {
        id: 'crush_brood',
        title: 'Spezza il Nido',
        type: 'fight',
        durationValue: 3,
        durationUnits: 'hours',
        requirements: {
          encounterId: 'city_rats_pack',
          custom: {
            recommendedPower: 2,
          },
        },
        successEffects: {
          resources: [{ resourceId: 'materials', amountFormula: '1' }],
          unlockActivityIds: ['quest_city_rats_cleanup'],
        },
        failureEffects: {
          reputation: {
            lantern_guild: -1,
          },
          notes: 'Il nido sopravvive, bisogna ripetere la fase.',
        },
        copy: {
          summary: 'Squadre leggere eliminano il nucleo della covata e riportano campioni contaminati.',
          narrative:
            'I combattenti calano nei tunnel principali, usano incendiari controllati e riportano le carcasse per l’analisi.',
          callToAction: 'Ingaggia il branco principale nei tunnel centrali.',
        },
        icon: '⚔️',
        telemetryTags: ['quest_city_rats', 'phase:fight'],
        riskProfile: {
          injuryChance: 28,
          deathChance: 12,
          fatigueCost: 9,
          threatLabel: 'Alta',
        },
      },
      {
        id: 'purge_vents',
        title: 'Sigilla le Bocche',
        type: 'trap',
        durationValue: 1,
        durationUnits: 'hours',
        requirements: {
          materials: [{ resourceId: 'materials', amountFormula: '1' }],
        },
        successEffects: {
          reputation: {
            lantern_guild: 1,
          },
          notes: 'Riduce il rischio di reinfestazione per 3 giorni in game.',
        },
        failureEffects: {
          notes: 'La purga non prende, il rischio torna medio.',
        },
        copy: {
          summary: 'Gli alchimisti bruciano i residui e rafforzano i sigilli superiori.',
          narrative:
            "Le squadre di supporto versano reagenti nelle bocche di scarico e rinforzano i sigilli di pietra.",
          callToAction: 'Spendi materiali per completare la purga finale.',
        },
        icon: '🧪',
        telemetryTags: ['quest_city_rats', 'phase:purge'],
        riskProfile: {
          injuryChance: 6,
          deathChance: 0,
          fatigueCost: 3,
          threatLabel: 'Moderata',
        },
      },
    ],
  },
};

/**
 * Default quest blueprint dictionary used by Idle Village sandboxes + tests.
 */
export const defaultQuestBlueprints = QuestBlueprintsSchema.parse(RAW_DEFAULT_BLUEPRINTS);

/**
 * Loads a quest blueprint by id, throwing a descriptive error when missing.
 *
 * @param blueprintId - Identifier to locate.
 * @param blueprints - Optional override dictionary (defaults to validated defaults).
 */
export function loadQuestBlueprint(
  blueprintId: string,
  blueprints: Record<string, QuestBlueprint> = defaultQuestBlueprints,
): QuestBlueprint {
  const blueprint = blueprints[blueprintId];
  if (!blueprint) {
    throw new Error(`Quest blueprint with id "${blueprintId}" was not found.`);
  }
  return blueprint;
}

/**
 * Returns the quest phase at the provided index, ensuring bounds safety.
 *
 * @param blueprint - Target quest blueprint.
 * @param phaseIndex - Zero-based phase index.
 */
export function getQuestPhase(blueprint: QuestBlueprint, phaseIndex: number): QuestPhase {
  const phase = blueprint.phases[phaseIndex];
  if (!phase) {
    throw new Error(
      `Quest phase at index ${phaseIndex} does not exist for blueprint ${blueprint.id}.`,
    );
  }
  return phase;
}

/**
 * Validates an unknown payload against the QuestBlueprints schema.
 *
 * @param value - Raw blueprint dictionary to validate.
 * @returns Sanitised quest blueprint dictionary.
 */
export function validateQuestBlueprints(value: unknown): Record<string, QuestBlueprint> {
  return QuestBlueprintsSchema.parse(value);
}
