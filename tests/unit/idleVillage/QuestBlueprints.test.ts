import { describe, expect, it } from 'vitest';

import {
  defaultQuestBlueprints,
  getQuestPhase,
  loadQuestBlueprint,
  validateQuestBlueprints,
} from '../../../src/balancing/config/idleVillage/quests/questBlueprints';
import { QuestBlueprintsSchema } from '../../../src/balancing/config/idleVillage/quests/questBlueprints.schema';

describe('QuestBlueprints config', () => {
  it('parses default quest blueprint catalog without errors', () => {
    expect(() => QuestBlueprintsSchema.parse(defaultQuestBlueprints)).not.toThrow();
  });

  it('rejects invalid quest blueprint payloads', () => {
    const invalidBlueprints = {
      broken_blueprint: {
        id: 'broken_blueprint',
        // missing name/title/telemetry and other required fields
        activityId: 'quest_city_rats',
        phases: [],
      },
    };

    expect(() => validateQuestBlueprints(invalidBlueprints)).toThrowErrorMatchingInlineSnapshot(
      `"QuestBlueprintSchema" must contain at least 1 phase`
    );
  });

  it('loads quest blueprint by id and exposes phases', () => {
    const blueprint = loadQuestBlueprint('quest_city_rats');
    expect(blueprint.name).toBe('Cull Rats – Sequenza Narrativa');
    expect(blueprint.phases).toHaveLength(3);
  });

  it('returns specific quest phase when requested', () => {
    const blueprint = loadQuestBlueprint('quest_city_rats');
    const phase = getQuestPhase(blueprint, 1);
    expect(phase.title).toBe('Spezza il Nido');
    expect(phase.type).toBe('fight');
  });

  it('keeps quest_city_rats blueprint stable', () => {
    const blueprint = loadQuestBlueprint('quest_city_rats');
    expect(blueprint).toMatchInlineSnapshot(`
      {
        "activityId": "quest_city_rats",
        "difficulty": "dangerous",
        "icon": "🐀",
        "id": "quest_city_rats",
        "name": "Cull Rats – Sequenza Narrativa",
        "narrative": "Tre battute successive per liberare i tunnel dai ratti e purificare le bocche di scarico. Blueprint dimostrativa per la Quest Chronicle.",
        "phases": [
          {
            "copy": {
              "callToAction": "Schiera i lantern scout per rivelare i nidi principali.",
              "narrative": "Le squadre di scout percorrono i condotti laterali lasciando segnali alchemici per guidare i combattenti.",
              "summary": "Lanterniere e ausiliari marcano i tunnel infestati prima dell’incursione.",
            },
            "durationUnits": "hours",
            "durationValue": 2,
            "icon": "🕯️",
            "id": "scout_tunnels",
            "requirements": {
              "statRequirement": {
                "allOf": [
                  "lantern",
                ],
                "label": "Lantern Scout",
              },
            },
            "riskProfile": {
              "deathChance": 0,
              "fatigueCost": 4,
              "injuryChance": 5,
              "threatLabel": "Bassa",
            },
            "successEffects": {
              "notes": "Rivela i nodi infestati e riduce il rischio del combattimento.",
            },
            "telemetryTags": [
              "quest_city_rats",
              "phase:scout",
            ],
            "title": "Ispeziona i Tunnel",
            "type": "check",
          },
          {
            "copy": {
              "callToAction": "Ingaggia il branco principale nei tunnel centrali.",
              "narrative": "I combattenti calano nei tunnel principali, usano incendiari controllati e riportano le carcasse per l’analisi.",
              "summary": "Squadre leggere eliminano il nucleo della covata e riportano campioni contaminati.",
            },
            "durationUnits": "hours",
            "durationValue": 3,
            "icon": "⚔️",
            "id": "crush_brood",
            "requirements": {
              "custom": {
                "recommendedPower": 2,
              },
              "encounterId": "city_rats_pack",
            },
            "riskProfile": {
              "deathChance": 12,
              "fatigueCost": 9,
              "injuryChance": 28,
              "threatLabel": "Alta",
            },
            "successEffects": {
              "resources": [
                {
                  "amountFormula": "1",
                  "resourceId": "materials",
                },
              ],
              "unlockActivityIds": [
                "quest_city_rats_cleanup",
              ],
            },
            "telemetryTags": [
              "quest_city_rats",
              "phase:fight",
            ],
            "title": "Spezza il Nido",
            "type": "fight",
          },
          {
            "copy": {
              "callToAction": "Spendi materiali per completare la purga finale.",
              "narrative": "Le squadre di supporto versano reagenti nelle bocche di scarico e rinforzano i sigilli di pietra.",
              "summary": "Gli alchimisti bruciano i residui e rafforzano i sigilli superiori.",
            },
            "durationUnits": "hours",
            "durationValue": 1,
            "icon": "🧪",
            "id": "purge_vents",
            "requirements": {
              "materials": [
                {
                  "amountFormula": "1",
                  "resourceId": "materials",
                },
              ],
            },
            "riskProfile": {
              "deathChance": 0,
              "fatigueCost": 3,
              "injuryChance": 6,
              "threatLabel": "Moderata",
            },
            "successEffects": {
              "notes": "Riduce il rischio di reinfestazione per 3 giorni in game.",
              "reputation": {
                "lantern_guild": 1,
              },
            },
            "telemetryTags": [
              "quest_city_rats",
              "phase:purge",
            ],
            "title": "Sigilla le Bocche",
            "type": "trap",
          },
        ],
        "rewards": {
          "items": {
            "city_rats_trophy": 1,
          },
          "reputation": {
            "lantern_guild": 2,
          },
          "resources": [
            {
              "amountFormula": "2",
              "resourceId": "materials",
            },
            {
              "amountFormula": "1",
              "resourceId": "renown",
            },
          ],
        },
        "slotId": "village_square",
        "tags": [
          "quest",
          "city",
          "purge",
        ],
        "telemetry": {
          "enabled": true,
          "eventId": "quest_blueprint_city_rats",
          "tags": [
            "quest",
            "city_rats",
          ],
        },
      }
    `);
  });
});
