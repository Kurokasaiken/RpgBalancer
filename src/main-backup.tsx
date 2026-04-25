console.log('[BOOT] main.tsx starting');

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from './shared/components/Toaster'
import { DensityProvider } from './contexts/DensityContext'
import { createHeadlessDiagnostics } from './shared/telemetry/headlessDiagnostics'

console.log('[BOOT] imports done');

declare global {
  interface Window {
    __bootLog?: string[]
    __idleVillageAppBoot?: {
      mainLoaded?: boolean
      reactRendered?: boolean
      renderError?: {
        message: string
        stack?: string
      }
    }
  }
}

const diagnostics = createHeadlessDiagnostics('ServiceWorkerRegistration');

const isLocalPreviewContext =
  typeof window !== 'undefined' &&
  (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '' ||
    window.location.protocol === 'http:' ||
    window.location.hostname.endsWith('.local')
  );

const shouldRegisterServiceWorker =
  'serviceWorker' in navigator &&
  import.meta.env.PROD &&
  import.meta.env.VITE_DISABLE_SW !== 'true' &&
  typeof window !== 'undefined' &&
  !isLocalPreviewContext;

// Register service worker for offline functionality
if (shouldRegisterServiceWorker) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        diagnostics.info('Service Worker registered successfully', {
          scope: registration.scope,
          state: registration.active?.state
        });

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                diagnostics.info('New service worker available, will activate on next page load');
              }
            });
          }
        });
      })
      .catch((error) => {
        diagnostics.error('Service Worker registration failed', error);
      });
  });
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element "#root" not found')
}

diagnostics.info('boot:start');

// TEMP instrumentation to debug blank page boot sequence
if (typeof window !== 'undefined') {
  window.__idleVillageAppBoot ??= {};
  window.__idleVillageAppBoot.mainLoaded = true;
}

try {
  diagnostics.info('boot:rendering');
  console.info('[boot] createRoot rendering...');
  createRoot(rootElement).render(
    <StrictMode>
      <DensityProvider>
        <App />
        <Toaster />
      </DensityProvider>
    </StrictMode>
  )

  if (typeof window !== 'undefined') {
    window.__idleVillageAppBoot ??= {};
    window.__idleVillageAppBoot.reactRendered = true;
  }
  diagnostics.info('boot:render-success');
  console.info('[boot] render success');
} catch (error) {
  diagnostics.error('boot:render-error', error);
  console.error('[boot] render error', error);
  if (typeof window !== 'undefined') {
    window.__idleVillageAppBoot ??= {};
    window.__idleVillageAppBoot.renderError =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { message: String(error) }
  }
  throw error
}
