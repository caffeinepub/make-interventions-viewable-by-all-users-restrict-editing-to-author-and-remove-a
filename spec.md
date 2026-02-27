# Specification

## Summary
**Goal:** Fix the crash that shows "Une erreur s'est produite / Erreur inconnue" before the login screen loads on app startup.

**Planned changes:**
- Identify and fix the root cause of the unhandled error thrown during the app initialization phase (before Internet Identity/authentication loads) in App.tsx or related bootstrap code
- Wrap all async initialization steps (AuthClient init, IndexedDB setup, service worker registration) in try/catch blocks so errors are caught and logged without propagating to the React ErrorBoundary
- Ensure the app falls back gracefully to the LoginPage when a non-critical initialization step fails, instead of rendering the error card
- Add a safe wrapper/provider around the initialization sequence without modifying `useInternetIdentity.ts` or `main.tsx` directly

**User-visible outcome:** Opening the app on mobile (Android Chrome) or any browser reliably shows the login/authentication screen on first load instead of the "Une erreur s'est produite" crash card.
