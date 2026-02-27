export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker enregistré:', registration.scope);
          })
          .catch((error) => {
            console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
          });
      }, 1000);
    });
  }
}
