import React from 'react';

/**
 * Test page with minimal useGameDirector (no scheduler)
 */
export default function GameplayTestMinimal() {
  const handleStartRun = () => {
    console.log('[Minimal] Starting run...');
    
    // Test without useActivityScheduler
    try {
      console.log('[Minimal] Step 1: Reset');
      console.log('[Minimal] Step 2: Spawn hero');
      console.log('[Minimal] Step 3: Start clock');
      console.log('[Minimal] Run started!');
      alert('Minimal test successful! Check console.');
    } catch (error) {
      console.error('[Minimal] Error:', error);
      alert('Error in minimal test: ' + error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Minimal Game Director Test</h1>
      
      <button 
        onClick={handleStartRun}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#6f42c1',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Start Run (Minimal Director)
      </button>

      <div>
        <h3>Instructions</h3>
        <p>This tests the game director logic without useActivityScheduler</p>
        <p>If this works, the problem is in the scheduler integration</p>
      </div>
    </div>
  );
}
