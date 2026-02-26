# Specification

## Summary
**Goal:** Fix the blank white screen that appears on app startup before authentication completes.

**Planned changes:**
- Add an ErrorBoundary in `App.tsx` to catch initialization errors and display a readable fallback UI instead of a blank screen.
- Fix the initialization sequence in `App.tsx` so that route rendering only begins after the authentication state is fully initialized.
- Update the `AuthenticatedOnly` guard to show a loading spinner while authentication state is still initializing, preventing access to undefined identity state.
- Ensure the `QueryClientProvider` and router are set up in an order that prevents queries from firing before the identity is ready.
- Display a loading spinner or the login page immediately on app launch instead of a blank screen.

**User-visible outcome:** The app no longer shows a blank white screen on startup; users see a loading spinner or the login page immediately and can authenticate without needing to manually reload.
