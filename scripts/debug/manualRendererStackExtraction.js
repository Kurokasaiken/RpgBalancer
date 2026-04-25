/**
 * Manual Renderer Stack Data Extraction Script
 * 
 * Run this script in the browser console on both /test and /minimal-gameplay pages
 * to extract renderer stack data manually.
 */

// Function to extract and save renderer stack data
function extractRendererStackData() {
  console.log('🔍 Extracting renderer stack data...');
  
  // Check if renderer stack data is available
  if (!window.__RENDERER_STACK_DATA__) {
    console.error('❌ No renderer stack data found. Make sure the page has loaded residents.');
    return null;
  }
  
  const data = window.__RENDERER_STACK_DATA__;
  console.log('✅ Renderer stack data found:');
  console.log(`   Page: ${data.page}`);
  console.log(`   Timestamp: ${data.timestamp}`);
  console.log(`   Components: ${data.stackData.length}`);
  
  // Log component details
  data.stackData.forEach((component, index) => {
    console.log(`   ${index + 1}. ${component.component} (${component.page})`);
  });
  
  // Create downloadable JSON
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Create download link
  const link = document.createElement('a');
  link.href = url;
  link.download = `renderer-stack-${data.page}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('📁 Data downloaded as JSON file');
  return data;
}

// Function to check if residents are loaded
function checkResidentsLoaded() {
  const pgCards = document.querySelectorAll('[data-testid="pg-card"]');
  console.log(`👥 Found ${pgCards.length} resident cards`);
  
  if (pgCards.length === 0) {
    console.log('⚠️  No residents found. You may need to:');
    console.log('   1. Load residents from Character Manager');
    console.log('   2. Refresh the page');
    console.log('   3. Check console for errors');
  } else {
    console.log('✅ Residents are loaded and rendering');
  }
  
  return pgCards.length;
}

// Function to manually trigger instrumentation (for testing)
function triggerManualInstrumentation() {
  console.log('🔧 Manually triggering instrumentation...');
  
  // Try to access the instrumentation system
  if (window.rendererStackInstrumentation) {
    console.log('✅ Renderer stack instrumentation available');
    
    // Get current residents if available
    const pgCards = document.querySelectorAll('[data-testid="pg-card"]');
    if (pgCards.length > 0) {
      console.log('📊 Triggering manual data capture...');
      
      // Expose fresh data
      window.rendererStackInstrumentation.exposeRendererStackData();
      
      console.log('✅ Manual instrumentation complete');
    } else {
      console.log('❌ No residents found to instrument');
    }
  } else {
    console.log('❌ Renderer stack instrumentation not available');
  }
}

// Export functions to global scope
window.extractRendererStackData = extractRendererStackData;
window.checkResidentsLoaded = checkResidentsLoaded;
window.triggerManualInstrumentation = triggerManualInstrumentation;

console.log('🚀 Renderer stack extraction tools loaded!');
console.log('Available commands:');
console.log('  checkResidentsLoaded() - Check if residents are loaded');
console.log('  triggerManualInstrumentation() - Manually trigger instrumentation');
console.log('  extractRendererStackData() - Extract and download data');
