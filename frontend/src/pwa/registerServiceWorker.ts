export function registerServiceWorker() {
  console.log('registerServiceWorker: Checking for service worker support');
  
  if ('serviceWorker' in navigator) {
    // Delay registration to not block initial render
    setTimeout(() => {
      console.log('registerServiceWorker: Starting registration');
      
      try {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
              console.log('SW registered successfully:', registration);
            })
            .catch((error) => {
              console.error('SW registration failed:', error);
            });
        });
      } catch (error) {
        console.error('Error setting up service worker:', error);
      }
    }, 1000);
  } else {
    console.log('registerServiceWorker: Service workers not supported');
  }
}
