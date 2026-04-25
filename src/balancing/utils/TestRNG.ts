// Deterministic RNG for test snapshots
export class TestRNG {
    private seed: number;
    constructor(seed: number = 42) {
        this.seed = seed;
    }
    next() {
        // Simple LCG (Linear Congruential Generator)
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }

    getSeed(): number {
        return this.seed;
    }
}

export function createTestRNG(seed: number = 42) {
    const rng = new TestRNG(seed);
    return () => rng.next();
}
