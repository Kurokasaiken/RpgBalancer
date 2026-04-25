import React, { useState, useEffect, useRef } from 'react';
import { useGameDirectorSimple } from '../hooks/useGameDirectorScheduler';

/**
 * Simple test page to verify the game director works
 * Just a "Start Run" button and console output
 */
export default function GameplayTestPage() {
  const { startRun } = useGameDirectorSimple();
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const handleButtonClick = async () => {
    if (isRunning) {
      console.log('[GameplayTestPage] Already running, ignoring click');
      return;
    }

    setIsRunning(true);
    setStatus('starting');

    try {
      console.log('[GameplayTestPage] Button clicked!');
      setStatus('running');
      
      // startRun is sync but we handle it as async for future compatibility
      await Promise.resolve(startRun());
      
      setStatus('completed');
      console.log('[GameplayTestPage] Run completed successfully');
    } catch (error) {
      setStatus('error');
      console.error('[GameplayTestPage] Run failed:', error);
    } finally {
      // Auto-reset after a delay
      timeoutRef.current = setTimeout(() => {
        setIsRunning(false);
        if (status !== 'error') {
          setStatus('idle');
        }
      }, 2000);
    }
  };

  // Helper for status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'idle': return '#28a745';
    case 'starting': return '#ffc107';
    case 'running': return '#17a2b8';
    case 'completed': return '#28a745';
    case 'error': return '#dc3545';
    default: return '#6c757d';
  }
};

// Helper for button text
const getButtonText = (status: string) => {
  switch (status) {
    case 'idle': return 'Start Run';
    case 'starting': return 'Starting...';
    case 'running': return 'Running...';
    case 'completed': return 'Completed!';
    case 'error': return 'Error - Try Again';
    default: return 'Start Run';
  }
};

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Game Director Test</h1>
      
      {/* Status Display */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        border: `2px solid ${getStatusColor(status)}`,
        borderRadius: '4px'
      }}>
        <strong>Status:</strong> {status.toUpperCase()}
      </div>
      
      {/* Start/Stop Button */}
      <button 
        onClick={handleButtonClick}
        disabled={isRunning && status !== 'error'}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: isRunning && status !== 'error' ? '#6c757d' : getStatusColor(status),
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isRunning && status !== 'error' ? 'not-allowed' : 'pointer',
          marginBottom: '20px',
          opacity: isRunning && status !== 'error' ? 0.7 : 1,
          transition: 'all 0.2s ease'
        }}
      >
        {getButtonText(status)}
      </button>

      {/* Reset Button */}
      {status === 'error' && (
        <button 
          onClick={() => {
            setIsRunning(false);
            setStatus('idle');
          }}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '20px',
            marginLeft: '10px'
          }}
        >
          Reset
        </button>
      )}

      <div>
        <h3>Instructions</h3>
        <p>1. Click "Start Run" to begin the game</p>
        <p>2. Open browser console to see game director logs</p>
        <p>3. The game should:</p>
        <ul>
          <li>Reset game state</li>
          <li>Spawn a hero</li>
          <li>Start the clock (1 tick/sec)</li>
          <li>Spawn world events progressively</li>
          <li>Trigger wave at 5 minutes</li>
          <li>Game over if no defensive preparation</li>
        </ul>
        
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px' }}>
          <strong>Safety Features:</strong>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            <li>Prevents double clicks</li>
            <li>Shows real-time status</li>
            <li>Error handling with reset</li>
            <li>Auto-disable during execution</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
