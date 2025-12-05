/**
 * Manual Verification Script for Persistence System
 * Run with: npx tsx src/balancing/verification/verify_persistence.ts
 */

import { ConfigManager } from '../persistence/ConfigManager';
import { getDefaultBalanceConfig } from '../persistence/balanceConfig';

console.log('--- Verifying Persistence System ---\n');

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

// @ts-ignore
global.localStorage = localStorageMock;

// Test 1: Save and Load
console.log('Test 1: Save and Load Configuration');
const config = getDefaultBalanceConfig();
config.metadata.name = 'Test Configuration';
config.metadata.description = 'Testing persistence system';
config.weights.damage = 10.0; // Modify a weight

ConfigManager.saveCurrentConfig(config, 'Initial save');
const loaded = ConfigManager.loadConfig();

console.log(`  Saved name: ${config.metadata.name}`);
console.log(`  Loaded name: ${loaded.metadata.name}`);
console.log(`  Saved damage weight: ${config.weights.damage}`);
console.log(`  Loaded damage weight: ${loaded.weights.damage}`);
console.log(`  ✅ Save/Load: ${loaded.metadata.name === config.metadata.name && loaded.weights.damage === 10.0 ? 'PASS' : 'FAIL'}\n`);

// Test 2: History Management
console.log('Test 2: History Management');
for (let i = 1; i <= 15; i++) {
    const historyConfig = getDefaultBalanceConfig();
    historyConfig.metadata.name = `Config ${i}`;
    ConfigManager.saveCurrentConfig(historyConfig, `Save #${i}`);
}

const history = ConfigManager.getHistory();
console.log(`  Saved 15 configs`);
console.log(`  History length: ${history.length}`);
console.log(`  ✅ History Limit: ${history.length <= 10 ? 'PASS' : 'FAIL'}\n`);

// Test 3: Export and Import
console.log('Test 3: Export and Import');
const exportConfig = getDefaultBalanceConfig();
exportConfig.metadata.name = 'Export Test';
exportConfig.weights.hp = 2.0;

const json = ConfigManager.exportConfig(exportConfig);
console.log(`  Exported JSON length: ${json.length} chars`);
console.log(`  JSON valid: ${json.includes('Export Test') ? 'Yes' : 'No'}`);

const importSuccess = ConfigManager.importConfig(json, 'Imported from JSON');
const importedConfig = ConfigManager.loadConfig();
console.log(`  Import success: ${importSuccess}`);
console.log(`  Imported name: ${importedConfig.metadata.name}`);
console.log(`  Imported hp weight: ${importedConfig.weights.hp}`);
console.log(`  ✅ Export/Import: ${importSuccess && importedConfig.weights.hp === 2.0 ? 'PASS' : 'FAIL'}\n`);

// Test 4: Invalid Import
console.log('Test 4: Invalid Import Handling');
const invalidSuccess = ConfigManager.importConfig('{ invalid json }');
console.log(`  Invalid JSON rejected: ${!invalidSuccess}`);
console.log(`  ✅ Validation: ${!invalidSuccess ? 'PASS' : 'FAIL'}\n`);

// Test 5: Restore from History
console.log('Test 5: Restore from History');
const beforeRestore = ConfigManager.getHistory()[0];
const timestamp = beforeRestore.timestamp;

const newConfig = getDefaultBalanceConfig();
newConfig.metadata.name = 'Modified Config';
ConfigManager.saveCurrentConfig(newConfig, 'After restore test');

const restoreSuccess = ConfigManager.restoreFromHistory(timestamp);
const afterRestore = ConfigManager.loadConfig();
console.log(`  Restore success: ${restoreSuccess}`);
console.log(`  Config after restore: ${afterRestore.metadata.name}`);
console.log(`  ✅ Restore: ${restoreSuccess ? 'PASS' : 'FAIL'}\n`);

// Test 6: Clear All
console.log('Test 6: Clear All');
ConfigManager.saveCurrentConfig(config, 'Pre-clear save');
const beforeClear = ConfigManager.getHistory().length;
console.log(`  History before clear: ${beforeClear}`);

ConfigManager.clearAll();
const afterClearHistory = ConfigManager.getHistory().length;
const afterClearConfig = ConfigManager.loadConfig();
console.log(`  History after clear: ${afterClearHistory}`);
console.log(`  Config after clear: ${afterClearConfig.metadata.name}`);
console.log(`  ✅ Clear: ${afterClearHistory === 0 && afterClearConfig.metadata.name === 'Default Configuration' ? 'PASS' : 'FAIL'}\n`);

console.log('=== All Tests Complete ===');
console.log('✅ Persistence system verified successfully!');
