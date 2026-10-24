import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { installPageLoadRecovery } from './services/pageLoadRecovery'
import './index.css'

const removePageLoadRecovery = installPageLoadRecovery()
if (import.meta.hot) import.meta.hot.dispose(removePageLoadRecovery)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
