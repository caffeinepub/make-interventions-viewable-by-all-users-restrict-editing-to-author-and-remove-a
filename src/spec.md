# Specification

## Summary
**Goal:** Fix critical navigation and data access issues in the Vial Traite Service application, including non-responsive client folder button, missing intervention access, and lost technical folder data.

**Planned changes:**
- Fix non-responsive 'Dossier Client' button to enable proper navigation to client folder section
- Restore full access to interventions from within the client folder view
- Recover and restore lost technical folder data with all files and folders
- Add comprehensive French error messages for data loading and navigation failures
- Implement loading spinners throughout the application for all data fetch operations
- Add automatic retry logic with exponential backoff for failed data operations
- Add data export functionality (PDF and JSON) for backup purposes
- Strengthen data persistence and synchronization to prevent future data loss

**User-visible outcome:** Users can reliably access the client folder section, view all interventions, see their complete technical folder data, receive clear error messages in French when issues occur, see loading indicators during operations, and export their data for backup.
