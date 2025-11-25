/**
 * Spell Rebalancing Script
 * 
 * Automatically rebalances all spells using SpellCostModule
 * to calculate optimal mana costs based on HP-equivalent power.
 */

import { loadSpells, upsertSpell } from '../balancing/spellStorage';
import { SpellCostModule } from '../balancing/modules/spellcost';
import type { Spell } from '../balancing/spellTypes';

interface RebalanceReport {
    spellName: string;
    type: Spell['type'];
    oldMana: number;
    newMana: number;
    power: number;
    change: number;
    percentChange: number;
}

/**
 * Rebalance all spells and generate report
 */
export function rebalanceAllSpells(): RebalanceReport[] {
    const spells = loadSpells();
    const report: RebalanceReport[] = [];

    for (const spell of spells) {
        // Skip if spell has no mana cost field
        if (spell.manaCost === undefined) continue;

        const oldMana = spell.manaCost;
        const power = SpellCostModule.calculateSpellPower(spell).totalPower;
        const newMana = SpellCostModule.calculateManaCost(spell);

        // Update spell with new mana cost
        spell.manaCost = newMana;

        // Remove legendary field if it exists
        if ('legendary' in spell) {
            delete (spell as any).legendary;
        }

        // Save updated spell
        upsertSpell(spell);

        // Add to report
        const change = newMana - oldMana;
        const percentChange = oldMana > 0 ? (change / oldMana) * 100 : 0;

        report.push({
            spellName: spell.name,
            type: spell.type,
            oldMana,
            newMana,
            power,
            change,
            percentChange
        });
    }

    return report;
}

/**
 * Print rebalancing report
 */
export function printReport(report: RebalanceReport[]) {
    console.log('\n=== SPELL REBALANCING REPORT ===\n');

    // Sort by absolute change
    const sorted = [...report].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    console.log('Spells with biggest changes:');
    sorted.slice(0, 10).forEach(r => {
        const arrow = r.change > 0 ? '↑' : r.change < 0 ? '↓' : '=';
        const color = r.change > 0 ? '\x1b[31m' : r.change < 0 ? '\x1b[32m' : '\x1b[37m';
        console.log(
            `${color}${arrow} ${r.spellName.padEnd(30)} ${r.type.padEnd(8)} ` +
            `${r.oldMana.toString().padStart(4)} → ${r.newMana.toString().padEnd(4)} ` +
            `(${r.change >= 0 ? '+' : ''}${r.change}) [Power: ${r.power.toFixed(1)}]\x1b[0m`
        );
    });

    console.log('\n=== STATISTICS ===');
    const totalSpells = report.length;
    const increased = report.filter(r => r.change > 0).length;
    const decreased = report.filter(r => r.change < 0).length;
    const unchanged = report.filter(r => r.change === 0).length;

    console.log(`Total spells: ${totalSpells}`);
    console.log(`Increased cost: ${increased} (${((increased / totalSpells) * 100).toFixed(1)}%)`);
    console.log(`Decreased cost: ${decreased} (${((decreased / totalSpells) * 100).toFixed(1)}%)`);
    console.log(`Unchanged: ${unchanged} (${((unchanged / totalSpells) * 100).toFixed(1)}%)`);

    const avgChange = report.reduce((sum, r) => sum + r.change, 0) / totalSpells;
    console.log(`Average change: ${avgChange.toFixed(2)} mana`);

    console.log('\n=== SPECIAL SPELLS (Manual Review Needed) ===');
    const specialSpells = report.filter(r =>
        r.type === 'cc' ||
        Math.abs(r.percentChange) > 50 ||
        r.newMana > 100
    );

    if (specialSpells.length > 0) {
        specialSpells.forEach(r => {
            console.log(`⚠️  ${r.spellName} (${r.type}): ${r.oldMana} → ${r.newMana} (${r.percentChange.toFixed(0)}% change)`);
        });
    } else {
        console.log('✓ No special spells need review');
    }

    console.log('\n');
}

/**
 * Run if executed directly
 */
if (require.main === module) {
    console.log('Starting spell rebalancing...');
    const report = rebalanceAllSpells();
    printReport(report);
    console.log('✓ Rebalancing complete! All spells saved.');
}
