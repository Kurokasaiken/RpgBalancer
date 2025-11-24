// src/balancing/defaultSpells.ts - Base spells BALANCED correctly

import type { Spell } from './spellTypes';

export const DEFAULT_SPELLS: Spell[] = [
    {
        id: 'basic-attack',
        name: 'Basic Attack',
        type: 'damage',
        effect: 100,      // 100% del danno base
        scale: 0,         // No scaling
        cooldown: 0,      // Sempre disponibile
        eco: 1,           // Danno istantaneo
        aoe: 1,           // Singolo target
        dangerous: 0,   // Sempre colpisce
        pierce: 0,        // No pierce
        castTime: 0.5,
        range: 1,
        priority: 0,
        doubleSpell: false,
        legendary: false,
        spellLevel: 0     // Gratis
    },
    {
        id: 'fireball',
        name: 'Fireball',
        type: 'damage',
        effect: 150,      // 150% deldanno (forte)
        scale: 0,
        cooldown: 3,      // 3 secondi cd
        eco: 1,
        aoe: 1,
        dangerous: 90,    // 90% hit chance
        pierce: 0,
        castTime: 1.0,
        range: 5,
        priority: 0,
        doubleSpell: false,
        legendary: false,
        spellLevel: 15
    },
    {
        id: 'poison',
        name: 'Poison',
        type: 'damage',
        effect: 50,       // 50% per tick (2 tick = 100% totale) BILANCIATO!
        scale: 0,
        cooldown: 4,
        eco: 2,           // 2 tick di danno
        aoe: 1,
        dangerous: 95,
        pierce: 0,
        castTime: 0.6,
        range: 4,
        priority: 0,
        doubleSpell: false,
        legendary: false,
        spellLevel: 12
    },
    {
        id: 'heal',
        name: 'Heal',
        type: 'heal',
        effect: 100,      // 100% healing
        scale: 0,
        cooldown: 4,
        eco: 1,
        aoe: 1,
        dangerous: 100,
        pierce: 0,
        castTime: 0.8,
        range: 3,
        priority: 0,
        doubleSpell: false,
        legendary: false,
        spellLevel: 15
    },
    {
        id: 'shield',
        name: 'Shield',
        type: 'shield',
        effect: 40,       // Shield per tick (3 tick = 120% totale)
        scale: 0,
        cooldown: 5,
        eco: 3,          // 3 round di shield
        aoe: 1,
        dangerous: 100,
        pierce: 0,
        castTime: 0.5,
        range: 2,
        priority: 1,
        doubleSpell: false,
        legendary: false,
        spellLevel: 18
    },
    {
        id: 'lightning-bolt',
        name: 'Lightning Bolt',
        type: 'damage',
        effect: 120,      // 120% danno (bilanciato con pierce)
        scale: 0,
        cooldown: 6,
        eco: 1,
        aoe: 1,
        dangerous: 85,    // Lower hit chance
        pierce: 20,       // 20% pierce
        castTime: 1.2,
        range: 7,
        priority: 0,
        doubleSpell: false,
        legendary: false,
        spellLevel: 22
    },
    {
        id: 'holy-light',
        name: 'Holy Light',
        type: 'heal',
        effect: 100,      // 100% healing AoE
        scale: 0,
        cooldown: 6,
        eco: 1,
        aoe: 3,          // AoE 3 targets
        dangerous: 100,
        pierce: 0,
        castTime: 1.5,
        range: 5,
        priority: 0,
        doubleSpell: false,
        legendary: false,
        spellLevel: 25
    },
    {
        id: 'stun',
        name: 'Stun',
        type: 'cc',
        effect: 30,      // Danno minimo (è CC)
        scale: 0,
        cooldown: 8,
        eco: 1,
        aoe: 1,
        dangerous: 75,   // 75% chance to hit
        pierce: 0,
        castTime: 0.3,
        range: 2,
        priority: -1,
        ccEffect: 'stun',
        doubleSpell: false,
        legendary: false,
        spellLevel: 20
    },
    {
        id: 'ice-barrier',
        name: 'Ice Barrier',
        type: 'shield',
        effect: 50,      // Shield + reflection
        scale: 0,
        cooldown: 8,
        eco: 3,
        aoe: 1,
        dangerous: 100,
        pierce: 0,
        castTime: 0.7,
        range: 1,
        priority: 2,
        reflection: 20,   // 20% reflection
        doubleSpell: false,
        legendary: false,
        spellLevel: 28
    },
    {
        id: 'meteor',
        name: 'Meteor',
        type: 'damage',
        effect: 80,      // 80% per target (5 target = 400% totale, ma distribuito)
        scale: 0,
        cooldown: 10,
        eco: 1,
        aoe: 5,          // Massive AoE
        dangerous: 80,
        pierce: 30,
        castTime: 2.0,
        range: 8,
        priority: 0,
        doubleSpell: false,
        legendary: true,
        spellLevel: 50
    }
];
