import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

/** Capture l'invite d'installation pour la proposer depuis le mode présentateur. */
let deferred: Event & { prompt?: () => void } | null = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e as Event & { prompt?: () => void };
  window.dispatchEvent(new Event('pwa-installable'));
});
window.addEventListener('pwa-install', () => { deferred?.prompt?.(); });

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);
