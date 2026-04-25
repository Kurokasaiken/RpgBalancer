# Manual Renderer Stack Data Extraction Guide

## Overview
This guide provides step-by-step instructions for manually extracting renderer stack data from both `/test` and `/minimal-gameplay` pages to identify divergence points.

## Prerequisites
1. Development server running (`npm run dev`)
2. Residents loaded in the application
3. Browser console access

## Step-by-Step Instructions

### 1. Load Residents
If residents are not already loaded:
1. Navigate to `http://localhost:5173/`
2. Open Character Manager
3. Load or create residents
4. Verify residents appear in the roster

### 2. Extract Data from /test Page
1. Navigate to `http://localhost:5173/test`
2. Wait for page to load completely (residents should be visible)
3. Open browser console (F12)
4. Paste and run this script:

```javascript
// Extract renderer stack data from /test page
function extractTestPageData() {
  console.log('🔍 Extracting data from /test page...');
  
  // Check if data is available
  if (!window.__RENDERER_STACK_DATA__) {
    console.error('❌ No renderer stack data found');
    return null;
  }
  
  const data = window.__RENDERER_STACK_DATA__;
  console.log('✅ Data extracted:');
  console.log('   Page:', data.page);
  console.log('   Components:', data.stackData.length);
  
  // Log component details
  data.stackData.forEach((comp, i) => {
    console.log(`   ${i+1}. ${comp.component}`);
  });
  
  // Download as JSON
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `renderer-stack-test-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('📁 Data downloaded');
  return data;
}

extractTestPageData();
```

### 3. Extract Data from /minimal-gameplay Page
1. Navigate to `http://localhost:5173/minimal-gameplay`
2. Wait for page to load completely
3. Open browser console (F12)
4. Paste and run this script:

```javascript
// Extract renderer stack data from /minimal-gameplay page
function extractMinimalGameplayPageData() {
  console.log('🔍 Extracting data from /minimal-gameplay page...');
  
  // Check if data is available
  if (!window.__RENDERER_STACK_DATA__) {
    console.error('❌ No renderer stack data found');
    return null;
  }
  
  const data = window.__RENDERER_STACK_DATA__;
  console.log('✅ Data extracted:');
  console.log('   Page:', data.page);
  console.log('   Components:', data.stackData.length);
  
  // Log component details
  data.stackData.forEach((comp, i) => {
    console.log(`   ${i+1}. ${comp.component}`);
  });
  
  // Download as JSON
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `renderer-stack-minimal-gameplay-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('📁 Data downloaded');
  return data;
}

extractMinimalGameplayPageData();
```

### 4. Compare Data Manually
1. Open both downloaded JSON files
2. Compare the structure and values field by field
3. Look for the first difference between the two files
4. Note the component, field, and values that differ

### 5. Alternative: Run Comparison Script
After extracting both files, you can run this comparison script:

```javascript
// Load both files and compare them (run in console on any page)
async function compareRendererStackData() {
  console.log('🔍 Comparing renderer stack data...');
  
  // Prompt user to paste data
  const testData = prompt('Paste /test page data:');
  const minimalGameData = prompt('Paste /minimal-gameplay page data:');
  
  if (!testData || !minimalGameData) {
    console.error('❌ Both data sets required');
    return;
  }
  
  try {
    const testObj = JSON.parse(testData);
    const minimalObj = JSON.parse(minimalGameData);
    
    console.log('📊 Comparison Results:');
    console.log('   /test components:', testObj.stackData.length);
    console.log('   /minimal-gameplay components:', minimalObj.stackData.length);
    
    // Simple comparison
    const differences = [];
    
    for (let i = 0; i < Math.max(testObj.stackData.length, minimalObj.stackData.length); i++) {
      const testComp = testObj.stackData[i];
      const minComp = minimalObj.stackData[i];
      
      if (!testComp && minComp) {
        differences.push(`Component ${minComp.component} exists only in /minimal-gameplay`);
      } else if (testComp && !minComp) {
        differences.push(`Component ${testComp.component} exists only in /test`);
      } else if (testComp && minComp) {
        // Compare component data
        const compDiff = compareObjects(testComp, minComp, testComp.component);
        differences.push(...compDiff);
      }
    }
    
    if (differences.length === 0) {
      console.log('✅ No differences found - renderer stacks are identical');
    } else {
      console.log(`🎯 Found ${differences.length} differences:`);
      differences.forEach((diff, i) => {
        console.log(`   ${i+1}. ${diff}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error parsing data:', error);
  }
}

function compareObjects(obj1, obj2, path = '') {
  const differences = [];
  
  const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
  
  for (const key of keys) {
    const val1 = obj1[key];
    const val2 = obj2[key];
    const currentPath = path ? `${path}.${key}` : key;
    
    if (val1 === undefined && val2 !== undefined) {
      differences.push(`${currentPath}: exists only in /minimal-gameplay`);
    } else if (val1 !== undefined && val2 === undefined) {
      differences.push(`${currentPath}: exists only in /test`);
    } else if (typeof val1 !== typeof val2) {
      differences.push(`${currentPath}: type mismatch (${typeof val1} vs ${typeof val2})`);
    } else if (typeof val1 === 'object' && val1 !== null && val2 !== null) {
      differences.push(...compareObjects(val1, val2, currentPath));
    } else if (val1 !== val2) {
      differences.push(`${currentPath}: /test=${JSON.stringify(val1)} vs /minimal-gameplay=${JSON.stringify(val2)}`);
    }
  }
  
  return differences;
}

compareRendererStackData();
```

## Expected Output
The extraction should capture data from these components:
1. **VillageRosterSection** - Input residents data
2. **ResidentRosterPanel** - Props passed to DragTestContainer
3. **DragTestContainer** - Processed residents and PgCard props
4. **PgCard** - Final displayed values for each resident card

## Troubleshooting
- If no data is found, ensure residents are loaded and visible
- If components show 0 data, try refreshing the page
- Check browser console for any errors during extraction
- Make sure both pages have the same residents loaded

## Next Steps
Once you have the comparison results, identify the first exact divergence point:
- Component name
- Field path  
- Value in /test
- Value in /minimal-gameplay

This will help isolate where the renderer stacks differ between the two pages.
