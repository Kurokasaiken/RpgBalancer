import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from './shared/components/Toaster'
import { DensityProvider } from './contexts/DensityContext'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element "#root" not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <DensityProvider>
      <App />
      <Toaster />
    </DensityProvider>
  </StrictMode>,
)
