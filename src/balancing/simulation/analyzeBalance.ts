import { runMatrix, calculateBalanceScore, findMostImbalanced } from '../1v1/matrixRunner';
import { getAllArchetypeIds } from '../1v1/testArchetypes';

/**
 * Balance Analysis Tool
 * 
 * Runs matrix simulations and analyzes balance issues:
 * - Overall balance score (deviation from 50% win rates)
 * - Most imbalanced matchups
 * - Win rate distribution per archetype
 */

async function analyzeBalance() {
    console.log('🔍 Running Balance Analysis...\n');

    const seed = 12345; // Fixed seed for reproducibility
    const archetypeIds = getAllArchetypeIds();

    console.log(`Archetypes: ${archetypeIds.join(', ')}`);
    console.log(`Seed: ${seed}\n`);

    // Run matrix
    const result = await runMatrix(archetypeIds, {
        seed,
        fast: false, // Use full simulation for accuracy
        onProgress: (current, total, info) => {
            process.stdout.write(`\rProgress: ${current}/${total} (${info})   `);
        }
    });

    console.log('\n\n✅ Simulation Complete\n');

    // Calculate balance score
    const balanceScore = calculateBalanceScore(result);
    console.log(`📊 Overall Balance Score: ${(balanceScore * 100).toFixed(2)}%`);
    console.log(`   (Lower is better, 0% = perfect balance)\n`);

    // Find most imbalanced matchups
    const imbalanced = findMostImbalanced(result, 10);
    console.log('⚠️  Top 10 Most Imbalanced Matchups:');
    console.log('────────────────────────────────────────────');
    imbalanced.forEach((m, i) => {
        const deviation = Math.abs(m.win_rate_row - 0.5);
        const winnerSide = m.win_rate_row > 0.5 ? m.row : m.col;
        const winRate = m.win_rate_row > 0.5 ? m.win_rate_row : (1 - m.win_rate_row);
        console.log(`${i + 1}. ${m.row} vs ${m.col}: ${(winRate * 100).toFixed(1)}% (${winnerSide} favored, Δ=${(deviation * 100).toFixed(1)}%)`);
    });

    console.log('\n');

    // Win rate summary per archetype
    console.log('📈 Win Rate Summary (vs all others):');
    console.log('────────────────────────────────────────────');

    const winRatesByArchetype: Record<string, number[]> = {};

    // Initialize
    archetypeIds.forEach(id => {
        winRatesByArchetype[id] = [];
    });

    // Collect non-mirror matchups
    result.matrix.forEach(m => {
        if (m.row !== m.col) {
            winRatesByArchetype[m.row].push(m.win_rate_row);
            winRatesByArchetype[m.col].push(1 - m.win_rate_row);
        }
    });

    // Calculate averages
    Object.entries(winRatesByArchetype).forEach(([id, rates]) => {
        const avg = rates.reduce((sum, r) => sum + r, 0) / rates.length;
        const min = Math.min(...rates);
        const max = Math.max(...rates);
        console.log(`${id.padEnd(10)} Avg: ${(avg * 100).toFixed(1)}%  Range: ${(min * 100).toFixed(1)}%-${(max * 100).toFixed(1)}%`);
    });

    console.log('\n');

    // Balance recommendations
    console.log('💡 Balance Recommendations:');
    console.log('────────────────────────────────────────────');

    Object.entries(winRatesByArchetype).forEach(([id, rates]) => {
        const avg = rates.reduce((sum, r) => sum + r, 0) / rates.length;

        if (avg > 0.65) {
            console.log(`⬇️  ${id}: TOO STRONG (${(avg * 100).toFixed(1)}% avg) - Consider nerfs`);
        } else if (avg < 0.35) {
            console.log(`⬆️  ${id}: TOO WEAK (${(avg * 100).toFixed(1)}% avg) - Consider buffs`);
        } else if (avg > 0.55 || avg < 0.45) {
            console.log(`⚠️  ${id}: SLIGHTLY IMBALANCED (${(avg * 100).toFixed(1)}% avg) - Minor adjustments`);
        } else {
            console.log(`✅ ${id}: BALANCED (${(avg * 100).toFixed(1)}% avg)`);
        }
    });

    console.log('\n');
}

analyzeBalance().catch(console.error);
