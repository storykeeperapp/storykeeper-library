import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App, { initBooksStorage } from './App.jsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Books library must finish loading (from IndexedDB, migrating from localStorage
// on first run if needed) before the app renders, since components read the
// in-memory book cache synchronously.
initBooksStorage().finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
