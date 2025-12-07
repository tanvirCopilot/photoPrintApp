import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary';
import { usePhotoStore } from './store/photoStore';

// expose simple store getter for quick debugging in console
// (use: usePhotoStore.getState() or window.__STORE__())
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__STORE__ = usePhotoStore.getState;

// quick mount log
// eslint-disable-next-line no-console
console.log('Mounting App...');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
