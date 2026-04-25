// src/balancing/leagueSpells.ts

import type { Spell } from "./spellTypes";

/**
 * A small set of iconic League of Legends abilities/summoner spells
 * expressed using the extended Spell model. Values are illustrative and
 * balanced to cost 0 according to the current point‑buy algorithm.
 */
export const LEAGUE_SPELLS: Spell[] = [
    // Flash – instant movement, no damage, no cost.
    {
        id: "flash",
        name: "Flash",
        type: "buff",
        effect: 0,
        scale: 0,
        eco: 1,
        aoe: 1,
        precision: 0,
        dangerous: 100,
        pierce: 0,
        castTime: 0,
        cooldown: 5,
        range: 5,
        priority: 0,
        doubleSpell: false,
        legendary: false,
        scalingStat: "attack",
        slots: [],
        spellLevel: 0,
    },
    // Ignite – damage over time, high dangerous, short cast.
    {
        id: "ignite",
        name: "Ignite",
        type: "damage",
        effect: 150,
        scale: 0,
        eco: 3, // DOT 3 rounds
        aoe: 1,
        precision: 0,
        dangerous: 100,
        pierce: 0,
        castTime: 0.2,
        cooldown: 4,
        range: 4,
        priority: 0,
        doubleSpell: false,
        legendary: false,
        scalingStat: "attack",
        slots: [],
        spellLevel: 0,
    },
    // Heal – instant heal, no dangerous, short cast.
    {
        id: "heal",
        name: "Heal",
        type: "heal",
        effect: 120,
        scale: 0,
        eco: 1,
        aoe: 1,
        precision: 0,
        dangerous: 100,
        pierce: 0,
        castTime: 0.5,
        cooldown: 3,
        range: 3,
        priority: 0,
        doubleSpell: false,
        legendary: false,
        scalingStat: "magic",
        slots: [],
        spellLevel: 0,
    },
    // Barrier – shield that reflects a portion of incoming damage.
    {
        id: "barrier",
        name: "Barrier",
        type: "shield",
        effect: 80,
        scale: 0,
        eco: 1,
        aoe: 1,
        precision: 0,
        dangerous: 100,
        pierce: 0,
        castTime: 0.6,
        cooldown: 4,
        range: 2,
        priority: 0,
        doubleSpell: false,
        legendary: false,
        reflection: 30,
        scalingStat: "magic",
        slots: [],
        spellLevel: 0,
    },
    // Ravenous Hydra – AoE damage on attack, adds life steal.
    {
        id: "ravenous_hydra",
        name: "Ravenous Hydra",
        type: "damage",
        effect: 100,
        scale: 0,
        eco: 1,
        aoe: 3,
        precision: 0,
        dangerous: 100,
        pierce: 0,
        castTime: 0.5,
        cooldown: 0,
        range: 1,
        priority: 0,
        doubleSpell: false,
        legendary: false,
        // lifeSteal is represented via a situational modifier that adds % heal.
        situationalModifiers: [
            { condition: "On hit", adjustment: 20 }, // +20% life steal
        ],
        scalingStat: "attack",
        slots: [],
        spellLevel: 0,
    },
];
