# Specification

## Summary
**Goal:** Allow all authenticated users to manage the shared blacklist without any admin unlock, while keeping interventions visible to all authenticated users but editable/deletable only by their author.

**Planned changes:**
- Update backend authorization so any authenticated user can mark/unmark clients as blacklisted; keep unauthenticated users blocked.
- Remove the frontend “admin unlock/admin code” flow for blacklist management and make the blacklist panel usable by any authenticated user.
- Update blacklist-related user-facing text to English and remove admin-specific wording.
- Enforce intervention edit/delete permissions so only the intervention creator can edit/delete, while all authenticated users can view interventions; align frontend UI controls with backend rules.

**User-visible outcome:** Logged-in users can add or remove clients from the shared blacklist without entering an admin code, and can view all interventions while only being able to edit/delete interventions they created.
