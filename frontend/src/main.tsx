import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { injectSeedCases } from './data/seedCases'

// Seed realistic threat cases so Campaign Graph, Evidence Vault, etc.
// are populated on first load (instead of showing empty "0" states).
injectSeedCases();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)