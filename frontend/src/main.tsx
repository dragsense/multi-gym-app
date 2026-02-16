
// Import reflect-metadata first, before any other imports
import 'reflect-metadata'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import 'react-phone-number-input/style.css'
import 'react-quill/dist/quill.snow.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
) 
