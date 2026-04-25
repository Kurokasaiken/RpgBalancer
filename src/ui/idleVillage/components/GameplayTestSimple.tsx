import React from 'react';

/**
 * Minimal test page - no hooks, just basic HTML
 */
export default function GameplayTestSimple() {
  const handleClick = () => {
    alert('Button clicked!');
    console.log('Simple button clicked!');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Simple Test Page</h1>
      
      <button 
        onClick={handleClick}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Click Me (Simple)
      </button>

      <div>
        <h3>Instructions</h3>
        <p>If this button works, the problem is in useGameDirector</p>
        <p>If this button also breaks, the problem is in the page itself</p>
      </div>
    </div>
  );
}
