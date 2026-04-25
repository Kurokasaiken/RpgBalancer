console.log('[TEST] main-test.tsx loaded');

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

console.log('[TEST] React imports done');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

console.log('[TEST] About to render');

createRoot(rootElement).render(
  <StrictMode>
    <div style={{ color: 'white', padding: '20px' }}>
      <h1>Test App Loaded</h1>
      <p>If you see this, the basic rendering works.</p>
    </div>
  </StrictMode>
);

console.log('[TEST] Render complete');
