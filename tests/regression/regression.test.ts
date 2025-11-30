// Matrix NxN deterministic (modalità B)
function runMatrix(archetypes, seed) {
  const results = [];
  for (const att of archetypes) {
    for (const def of archetypes) {
      // Nuova API: chiamata statica
      const rng = new SeededRNG(seed);
      const result = CombatSimulator.simulate({
        entity1: att,
        entity2: def,
        turnLimit: 20
      }, rng);
      results.push(result);
    }
  }
  return results;
}