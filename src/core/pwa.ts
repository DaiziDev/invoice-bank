/**
 * État PWA partagé : capture de l'invite d'installation du navigateur.
 * `beforeinstallprompt` est capturé au démarrage (main.tsx) ; le bouton
 * « Installer » du header le déclenche quand il est disponible. Sur iOS
 * (pas d'invite natif), le bouton affiche plutôt la marche à suivre.
 */
type InstallPromptEvent = Event & { prompt?: () => void };

let deferred: InstallPromptEvent | null = null;

export function captureInstallPrompt(e: Event) {
  e.preventDefault();
  deferred = e as InstallPromptEvent;
  window.dispatchEvent(new Event('pwa-installable'));
}

export function canInstall() {
  return deferred != null;
}

export function promptInstall() {
  deferred?.prompt?.();
}

/** L'app tourne déjà comme application installée. */
export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
