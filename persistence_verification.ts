// Mock localStorage BEFORE imports
const mockStorage: Record<string, string> = {};
global.localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => { mockStorage[key] = value; },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { },
    key: (index: number) => '',
    length: 0
} as Storage;

async function runVerification() {
    const { BalanceConfigStore } = await import('./src/balancing/persistence/BalanceConfigStore');
    const { BalanceConfigManager } = await import('./src/balancing/BalanceConfigManager');

    console.log("🧪 Starting Persistence Verification...");

    // 1. Test Save
    console.log("\n1. Testing Save...");
    const testWeights = { damage: 10, armor: 5 };
    BalanceConfigStore.save('weights', testWeights, "Initial Save");
    const loaded = BalanceConfigStore.load('weights');
    console.log("Saved:", testWeights);
    console.log("Loaded:", loaded);

    if (JSON.stringify(loaded) === JSON.stringify(testWeights)) {
        console.log("✅ Save/Load Successful");
    } else {
        console.error("❌ Save/Load Failed");
    }

    // 2. Test History
    console.log("\n2. Testing History...");
    BalanceConfigStore.save('weights', { damage: 20, armor: 5 }, "Second Save");
    BalanceConfigStore.save('weights', { damage: 30, armor: 5 }, "Third Save");

    const history = BalanceConfigStore.getHistory('weights');
    console.log(`History Length: ${history.length} (Expected 3)`);
    console.log("Latest Description:", history[0].description);

    if (history.length === 3 && history[0].description === "Third Save") {
        console.log("✅ History Tracking Successful");
    } else {
        console.error("❌ History Tracking Failed");
    }

    // 3. Test Manager Integration
    console.log("\n3. Testing Manager Integration...");
    BalanceConfigManager.saveCurrentState("Manager Save");
    const managerHistory = BalanceConfigStore.getHistory('weights');
    console.log("Manager Save Description:", managerHistory[0].description);

    if (managerHistory[0].description === "Manager Save") {
        console.log("✅ Manager Integration Successful");
    } else {
        console.error("❌ Manager Integration Failed");
    }

    console.log("\n✨ Verification Complete");
}

runVerification().catch(console.error);
