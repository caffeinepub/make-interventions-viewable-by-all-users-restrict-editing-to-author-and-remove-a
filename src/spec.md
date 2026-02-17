# Specification

## Summary
**Goal:** Add a global, non-client-specific Technical Folder in the dashboard where authenticated users can upload, view, and manage PDF, image, and video files.

**Planned changes:**
- Add a backend Technical Folder data model and methods for authenticated users to list and upload files, and to delete files with uploader/admin authorization.
- Persist Technical Folder items using the existing Storage.ExternalBlob pattern and add stable-state migration if required.
- Add a new authenticated dashboard route/page for the Technical Folder and a clear navigation entry point from the main dashboard (clients list).
- Build the Technical Folder UI: upload flow, list rendering (thumbnails/previews/links), and delete actions with loading/empty states and React Query refresh.
- Extend or add a file picker to support selecting PDFs (application/pdf) without breaking existing image/video flows, and add React Query hooks for list/upload/delete with basic error handling (English UI text).

**User-visible outcome:** Authenticated users can open a “Technical Folder” from the dashboard to upload PDFs/photos/videos, see them listed with previews/links and timestamps, and delete allowed items; the list updates without a full page refresh.
