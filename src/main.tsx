import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { captureInstallPrompt, promptInstall } from './core/pwa';
import './index.css';

/** Capture l'invite d'installation pour la proposer depuis le header et le studio. */
window.addEventListener('beforeinstallprompt', captureInstallPrompt);
window.addEventListener('pwa-install', () => { promptInstall(); });

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);
