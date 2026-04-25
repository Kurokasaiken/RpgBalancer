import { runStatStressTests } from './runStatStressTests';

async function main() {
  try {
    console.log('Running stat stress tests (1000 iterations per archetype tier)...');
    const results = await runStatStressTests(1000);

    console.log('\nSingle stats:', results.singleStats.length);
    const sampleSingles = results.singleStats.slice(0, 5);
    for (const s of sampleSingles) {
      console.log(`- ${s.statId} @ ${s.pointsPerStat}pt -> winRate=${(s.winRate * 100).toFixed(1)}%, hpEff=${s.hpTradeEfficiency.toFixed(3)}, turns=${s.avgTurns.toFixed(2)}`);
    }

    console.log('\nPair stats:', results.pairStats.length);
    const samplePairs = results.pairStats.slice(0, 5);
    for (const p of samplePairs) {
      const a = p.statA;
      const b = p.statB;
      console.log(`- ${a}+${b} @ ${p.pointsPerStat}pt -> combined=${(p.combinedWinRate * 100).toFixed(1)}%, expected=${(p.expectedWinRate * 100).toFixed(1)}%, synergy=${p.synergyRatio.toFixed(3)} (${p.assessment})`);
    }
  } catch (err) {
    console.error('Error while running stat stress tests:', err);
  }
}

main();
