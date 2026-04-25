/**
 * Spell Analysis Script
 * 
 * Analyzes all spells and generates a rebalancing report
 * showing current vs recommended mana costs.
 * 
 * Run with: npm run test -- SpellAnalysis
 */

import { describe, it } from 'vitest';
import { DEFAULT_SPELLS } from '../defaultSpells';
import { SpellCostModule } from '../modules/spellcost';
import type { Spell } from '../spellTypes';

interface SpellAnalysis {
    name: string;
    type: Spell['type'];
    currentMana: number;
    recommendedMana: number;
    power: number;
    powerBreakdown: {
        direct: number;
        dot: number;
        shield: number;
        buff: number;
        aoe: number;
        hitChance: number;
    };
    isBalanced: boolean;
    change: number;
    percentChange: number;
}

describe('Spell Analysis Report', () => {
    it('should analyze all spells and show rebalancing recommendations', () => {
        const analyses: SpellAnalysis[] = [];

        for (const spell of DEFAULT_SPELLS) {
            const powerData = SpellCostModule.calculateSpellPower(spell);
            const recommended = SpellCostModule.calculateManaCost(spell);
            const current = spell.manaCost || 0;
            const change = recommended - current;
            const percentChange = current > 0 ? (change / current) * 100 : 0;

            analyses.push({
                name: spell.name,
                type: spell.type,
                currentMana: current,
                recommendedMana: recommended,
                power: powerData.totalPower,
                powerBreakdown: {
                    direct: powerData.directDamage + powerData.directHeal,
                    dot: powerData.dotPower + powerData.hotPower,
                    shield: powerData.shieldPower,
                    buff: powerData.buffPower + powerData.debuffPower,
                    aoe: powerData.aoeMultiplier,
                    hitChance: powerData.hitChanceAdjustment
                },
                isBalanced: SpellCostModule.isBalanced(spell, 0.25),
                change,
                percentChange
            });
        }

        // Print comprehensive report
        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║           SPELL REBALANCING ANALYSIS REPORT                   ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');

        // Statistics
        const total = analyses.length;
        const balanced = analyses.filter(a => a.isBalanced).length;
        const needsIncrease = analyses.filter(a => a.change > 0).length;
        const needsDecrease = analyses.filter(a => a.change < 0).length;

        console.log(`📊 SUMMARY:`);
        console.log(`   Total Spells: ${total}`);
        console.log(`   ✅ Balanced: ${balanced} (${((balanced / total) * 100).toFixed(1)}%)`);
        console.log(`   ⬆️  Need Cost Increase: ${needsIncrease}`);
        console.log(`   ⬇️  Need Cost Decrease: ${needsDecrease}\n`);

        // Sort by absolute change
        const sorted = [...analyses].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

        console.log('🔥 TOP 10 BIGGEST CHANGES NEEDED:\n');
        sorted.slice(0, 10).forEach((a, i) => {
            const arrow = a.change > 0 ? '⬆️' : a.change < 0 ? '⬇️' : '➡️';
            const status = a.isBalanced ? '✅' : '❌';
            console.log(`${i + 1}. ${status} ${a.name.padEnd(25)} (${a.type.padEnd(7)})`);
            console.log(`   ${arrow} Mana: ${a.currentMana.toString().padStart(3)} → ${a.recommendedMana.toString().padEnd(3)} (${a.change >= 0 ? '+' : ''}${a.change})`);
            console.log(`   💪 Power: ${a.power.toFixed(1)} HP-equivalent`);
            console.log(`   📦 Breakdown: Direct=${a.powerBreakdown.direct.toFixed(1)} DoT=${a.powerBreakdown.dot.toFixed(1)} AoE×${a.powerBreakdown.aoe.toFixed(1)}\n`);
        });

        // Special spells needing attention
        console.log('⚠️  SPECIAL ATTENTION NEEDED:\n');
        const special = analyses.filter(a =>
            !a.isBalanced && (
                a.type === 'cc' ||
                Math.abs(a.percentChange) > 50 ||
                a.recommendedMana > 150 ||
                a.power > 200
            )
        );

        if (special.length > 0) {
            special.forEach(a => {
                console.log(`❗ ${a.name} (${a.type})`);
                console.log(`   Current: ${a.currentMana} mana, Recommended: ${a.recommendedMana} mana`);
                console.log(`   Power: ${a.power.toFixed(1)} HP-eq, Change: ${a.percentChange.toFixed(0)}%\n`);
            });
        } else {
            console.log('   ✓ No spells need special attention\n');
        }

        // JSON update suggestions
        console.log('📝 SUGGESTED UPDATES FOR spells.json:\n');
        const unbalanced = sorted.filter(a => !a.isBalanced);

        if (unbalanced.length > 0) {
            console.log('   Update these spell mana costs:\n');
            unbalanced.slice(0, 15).forEach(a => {
                console.log(`   "${a.name}": manaCost ${a.currentMana} → ${a.recommendedMana}`);
            });

            if (unbalanced.length > 15) {
                console.log(`\n   ... and ${unbalanced.length - 15} more spells`);
            }
        } else {
            console.log('   ✅ All spells are balanced!');
        }

        console.log('\n╚════════════════════════════════════════════════════════════════╝\n');

        // Log for programmatic access
        console.log('Full analysis data available in test output.');
    });
});
