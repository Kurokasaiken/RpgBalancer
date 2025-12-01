import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from './shared/components/Toaster'
import { DensityProvider } from './contexts/DensityContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DensityProvider>
      <App />
      <Toaster />
    </DensityProvider>
  </StrictMode>,
)
