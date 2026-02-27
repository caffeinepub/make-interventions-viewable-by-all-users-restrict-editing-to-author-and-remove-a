# Specification

## Summary
**Goal:** Restore the Vial Traite Service application to its last known working state after the draft expired, rebuilding both backend and frontend with all existing features and data models intact.

**Planned changes:**
- Rebuild the Motoko backend (single actor in `backend/main.mo`) with all data models: clients, interventions, user profiles, media/blob storage, technical folder, blacklist management, and role-based access control.
- Restore the frontend with all pages: Dashboard (calendar + interventions by date), Clients (list with search and blacklist badges), Client Dossiers (contact info, blacklist status, intervention history), Interventions (add/edit/delete/view with media attachments), and Technical Folder (upload, create folders, rename, move, view files).
- Restore Internet Identity authentication with proper post-login redirect.
- Restore offline sync functionality: outbox, sync engine, and connectivity status bar.
- Restore PWA manifest and service worker for installability.
- Restore data export (JSON/PDF) dialog.
- Preserve existing brand color theme defined in `frontend/src/index.css`.

**User-visible outcome:** The app deploys, opens without crashing, and all existing features are fully functional — authentication, client management, interventions, technical folder, dashboard calendar, offline sync, PWA install, role-based access, and data export.
