# Specification

## Summary
**Goal:** Enable users to move uploaded files between different technical folders within a client dossier.

**Planned changes:**
- Add a 'Move' action to each file in the file list that opens a folder selection dialog
- Create a folder selection dialog component showing the technical folder hierarchy
- Implement backend function to move files between folders while preserving content and metadata
- Create React Query mutation hook for the move operation with proper query invalidation
- Update the technical folder page to refresh the file list after successful moves

**User-visible outcome:** Users can move files from one technical folder to another by clicking a 'Move' button, selecting a destination folder from a dialog, and having the file list automatically update to reflect the change.
