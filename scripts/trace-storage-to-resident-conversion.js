#!/usr/bin/env node

/**
 * Storage-to-Resident Conversion Trace Script
 * 
 * This script traces the exact path from localStorage 'idle_combat_characters' 
 * to the final residents used by /test, identifying where HP and portrait values diverge.
 */

const fs = require('fs');
const path = require('path');

// Simulate the key functions from the codebase
const STORAGE_KEY = 'idle_combat_characters';
const FALLBACK_MAX_HP = 100;

function readLocalSnapshot() {
    console.log('\n=== STEP 1: readLocalSnapshot() ===');
    
    if (typeof localStorage === 'undefined') {
        console.log('❌ localStorage not available, using fallback');
        return [];
    }
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        console.log('❌ No stored data found');
        return [];
    }
    
    try {
        const parsed = JSON.parse(stored);
        console.log(`✅ Found ${parsed.length} characters in storage`);
        
        // Log each character's storage values
        parsed.forEach((char, index) => {
            console.log(`  Character ${index + 1}: ${char.name}`);
            console.log(`    id: ${char.id}`);
            console.log(`    currentHp: ${char.currentHp}`);
            console.log(`    maxHp: ${char.maxHp}`);
            console.log(`    statBlock.hp: ${char.statBlock?.hp}`);
            console.log(`    portraitUrl: ${char.portraitUrl}`);
            console.log(`    statSnapshot.portraitUrl: ${char.statSnapshot?.portraitUrl}`);
        });
        
        // Apply DEFAULT_STATS merge (from characterStorage.ts line 83-89)
        const DEFAULT_STATS = { hp: 100, damage: 10, htk: 10 };
        const withDefaults = parsed.map((char) => ({
            ...char,
            statBlock: {
                ...DEFAULT_STATS,
                ...char.statBlock,
            },
        }));
        
        console.log('\n📊 After DEFAULT_STATS merge:');
        withDefaults.forEach((char, index) => {
            console.log(`  Character ${index + 1}: ${char.name}`);
            console.log(`    statBlock.hp: ${char.statBlock?.hp}`);
        });
        
        return withDefaults;
    } catch (error) {
        console.warn('❌ Storage corrupted:', error);
        return [];
    }
}

function savedCharacterToResident(character, options = {}) {
    console.log(`\n=== STEP 2: savedCharacterToResident(${character.name}) ===`);
    
    const statBlock = character.statBlock ?? {};
    const hpValue = typeof statBlock.hp === 'number' && Number.isFinite(statBlock.hp) ? statBlock.hp : FALLBACK_MAX_HP;
    const defaultFatigue = typeof options.defaultFatigue === 'number' && Number.isFinite(options.defaultFatigue) ? options.defaultFatigue : 0;
    
    console.log(`  Input statBlock.hp: ${statBlock.hp}`);
    console.log(`  Calculated hpValue: ${hpValue}`);
    console.log(`  Input currentHp: ${character.currentHp}`);
    console.log(`  Input maxHp: ${character.maxHp}`);
    
    const resolvedStatSnapshot = character.statSnapshot && Object.keys(character.statSnapshot).length > 0
        ? { ...character.statSnapshot }
        : { ...statBlock };
    
    const resolvedCurrentHp = typeof character.currentHp === 'number' && Number.isFinite(character.currentHp) ? character.currentHp : hpValue;
    const resolvedMaxHp = typeof character.maxHp === 'number' && Number.isFinite(character.maxHp) ? character.maxHp : hpValue;
    
    console.log(`  Resolved currentHp: ${resolvedCurrentHp}`);
    console.log(`  Resolved maxHp: ${resolvedMaxHp}`);
    console.log(`  Resolved statSnapshot.hp: ${resolvedStatSnapshot.hp}`);
    
    const baseResident = {
        id: character.id,
        displayName: character.name,
        status: character.status ?? 'available',
        fatigue: defaultFatigue,
        statProfileId: character.statProfileId ?? character.aiBehavior,
        visualProfileId: character.visualProfileId,
        portraitUrl: character.portraitUrl,
        fullFigureUrl: character.fullFigureUrl,
        portraitCrop: character.portraitCrop,
        statTags: [], // simplified for trace
        statSnapshot: resolvedStatSnapshot,
        currentHp: resolvedCurrentHp,
        maxHp: resolvedMaxHp,
        isHero: character.isHero ?? false,
        isInjured: character.isInjured ?? false,
        injuryRecoveryTime: character.injuryRecoveryTime,
        survivalCount: character.survivalCount ?? 0,
        survivalScore: character.survivalScore ?? 0,
    };
    
    console.log(`  Base resident portraitUrl: ${baseResident.portraitUrl}`);
    console.log(`  Base resident statSnapshot.portraitUrl: ${baseResident.statSnapshot.portraitUrl}`);
    
    // Portrait resolution simulation
    const resolvedPortrait = resolveResidentPortrait(baseResident);
    
    const finalResident = {
        ...baseResident,
        portraitUrl: resolvedPortrait.portraitUrl,
        fullFigureUrl: baseResident.fullFigureUrl ?? resolvedPortrait.fullFigureUrl,
        portraitCrop: baseResident.portraitCrop ?? resolvedPortrait.crop,
    };
    
    console.log(`  Final resident portraitUrl: ${finalResident.portraitUrl}`);
    console.log(`  Portrait source: ${resolvedPortrait.source}`);
    
    return finalResident;
}

function resolveResidentPortrait(resident) {
    console.log(`\n=== STEP 3: resolveResidentPortrait(${resident.displayName}) ===`);
    
    const snapshot = (resident.statSnapshot ?? {});
    const snapshotPortrait = typeof snapshot.portraitUrl === 'string' ? snapshot.portraitUrl : undefined;
    
    console.log(`  resident.portraitUrl: ${resident.portraitUrl}`);
    console.log(`  statSnapshot.portraitUrl: ${snapshotPortrait}`);
    
    if (typeof resident.portraitUrl === 'string' && resident.portraitUrl.trim().length > 0) {
        console.log(`  ✅ Using resident.portraitUrl (source: resident_override)`);
        return {
            portraitUrl: resident.portraitUrl,
            source: 'resident_override',
        };
    }
    
    if (snapshotPortrait && snapshotPortrait.trim().length > 0) {
        console.log(`  ✅ Using statSnapshot.portraitUrl (source: snapshot)`);
        return {
            portraitUrl: snapshotPortrait,
            source: 'snapshot',
        };
    }
    
    console.log(`  ❌ Using fallback portrait (source: profile)`);
    return {
        portraitUrl: '', // fallback would be generated
        source: 'profile',
    };
}

function loadResidentsFromCharacterManager(options = {}) {
    console.log('\n=== STEP 4: loadResidentsFromCharacterManager() ===');
    
    const defaultFatigue = options.config?.globalRules ? 20 : undefined; // simplified
    const characters = readLocalSnapshot();
    
    console.log(`  Converting ${characters.length} characters with defaultFatigue: ${defaultFatigue}`);
    
    return characters.map((character) => savedCharacterToResident(character, { defaultFatigue }));
}

// Main trace execution
function runTrace() {
    console.log('🔍 STORAGE-TO-RESIDENT CONVERSION TRACE');
    console.log('=====================================');
    
    // Check if we're in browser context
    if (typeof localStorage === 'undefined') {
        console.log('❌ Cannot run trace - localStorage not available');
        console.log('💡 Run this in browser console or use the TestRosterPage');
        return;
    }
    
    // Get current storage values
    console.log('\n📦 CURRENT STORAGE VALUES:');
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        console.log('❌ No data in storage');
        return;
    }
    
    const storageData = JSON.parse(stored);
    storageData.forEach((char, index) => {
        console.log(`\n${index + 1}. ${char.name}:`);
        console.log(`   Storage currentHp: ${char.currentHp}`);
        console.log(`   Storage maxHp: ${char.maxHp}`);
        console.log(`   Storage statBlock.hp: ${char.statBlock?.hp}`);
        console.log(`   Storage portraitUrl: ${char.portraitUrl}`);
        console.log(`   Storage statSnapshot.portraitUrl: ${char.statSnapshot?.portraitUrl}`);
    });
    
    // Run the conversion
    console.log('\n🔄 CONVERSION PROCESS:');
    const residents = loadResidentsFromCharacterManager();
    
    // Show final values
    console.log('\n🎯 FINAL RESIDENT VALUES:');
    residents.forEach((resident, index) => {
        console.log(`\n${index + 1}. ${resident.displayName}:`);
        console.log(`   Final currentHp: ${resident.currentHp}`);
        console.log(`   Final maxHp: ${resident.maxHp}`);
        console.log(`   Final statSnapshot.hp: ${resident.statSnapshot.hp}`);
        console.log(`   Final portraitUrl: ${resident.portraitUrl}`);
        console.log(`   Portrait source: ${resident.portraitSource || 'unknown'}`);
    });
    
    // Identify divergences
    console.log('\n🚨 DIVERGENCE ANALYSIS:');
    storageData.forEach((storageChar, index) => {
        const resident = residents[index];
        console.log(`\n${index + 1}. ${storageChar.name}:`);
        
        // HP divergence check
        const storageHp = storageChar.currentHp ?? storageChar.statBlock?.hp ?? 100;
        const finalHp = resident.currentHp;
        
        if (storageHp !== finalHp) {
            console.log(`   ❌ HP DIVERGENCE: ${storageHp} → ${finalHp}`);
        } else {
            console.log(`   ✅ HP OK: ${storageHp}`);
        }
        
        // Portrait divergence check
        const storagePortrait = storageChar.portraitUrl ?? storageChar.statSnapshot?.portraitUrl;
        const finalPortrait = resident.portraitUrl;
        
        if (storagePortrait !== finalPortrait) {
            console.log(`   ❌ PORTRAIT DIVERGENCE: "${storagePortrait}" → "${finalPortrait}"`);
        } else {
            console.log(`   ✅ PORTRAIT OK: "${storagePortrait}"`);
        }
    });
}

// Export for use in browser console
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTrace, readLocalSnapshot, savedCharacterToResident, resolveResidentPortrait, loadResidentsFromCharacterManager };
} else {
    // Auto-run if executed directly
    runTrace();
}
