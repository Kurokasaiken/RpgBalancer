import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './ui/wanderlust-surface/layout/wanderlust-layout.css';
import './ui/wanderlust-surface/wanderlust-surface.css';
import V8GlobalFilters from './ui/styleLab/components/V8GlobalFilters';
import { WanderlustSurfaceDefs } from './ui/wanderlust-surface';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element "#root" not found');
}

const isMinimalEntry = import.meta.env?.VITE_MINIMAL_ENTRY === '1';

if (isMinimalEntry) {
  import('./AppMinimal')
    .then(({ AppMinimal }) => {
      createRoot(rootElement).render(
        <StrictMode>
          <V8GlobalFilters />
          <WanderlustSurfaceDefs />
          <AppMinimal />
        </StrictMode>
      );
    })
    .catch((error) => {
      console.error('[minimal boot] Failed to load AppMinimal:', error);
      rootElement.innerHTML = '<div style="color: red; padding: 20px;"><h1>Error loading minimal workspace</h1><pre>' + String(error) + '</pre></div>';
    });
} else {
  Promise.all([
    import('./App.tsx'),
    import('./shared/components/Toaster'),
    import('./contexts/DensityContext'),
    import('./shared/telemetry/headlessDiagnostics'),
  ])
    .then(([appModule, toasterModule, densityModule, diagnosticsModule]) => {
      const App = appModule.default;
      const { Toaster } = toasterModule;
      const { DensityProvider } = densityModule;
      const { createHeadlessDiagnostics } = diagnosticsModule;

      const diagnostics = createHeadlessDiagnostics('ServiceWorkerRegistration');

      const isLocalPreviewContext =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname === '' ||
          window.location.protocol === 'http:' ||
          window.location.hostname.endsWith('.local'));

      const shouldRegisterServiceWorker =
        'serviceWorker' in navigator &&
        import.meta.env.PROD &&
        import.meta.env.VITE_DISABLE_SW !== 'true' &&
        typeof window !== 'undefined' &&
        !isLocalPreviewContext;

      if (shouldRegisterServiceWorker) {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/service-worker.js')
            .then((registration) => {
              diagnostics.info('Service Worker registered successfully', {
                scope: registration.scope,
                state: registration.active?.state,
              });

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

      try {
        createRoot(rootElement).render(
          <StrictMode>
            <V8GlobalFilters />
            <WanderlustSurfaceDefs />
            <DensityProvider>
              <App />
              <Toaster />
            </DensityProvider>
          </StrictMode>
        );
      } catch (error) {
        diagnostics.error('boot:render-error', error);
        console.error('[boot] render error', error);
        throw error;
      }
    })
    .catch((error) => {
      console.error('[boot] Failed to load app:', error);
      rootElement.innerHTML = '<div style="color: red; padding: 20px;"><h1>Error loading app</h1><pre>' + String(error) + '</pre></div>';
    });
}
