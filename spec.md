# Vial Traite Service

## Current State
- Access requires admin approval: new users enter their name, submit an access request, and wait for admin approval
- Admin dashboard has an "Accès" tab showing pending approval requests with Approve/Reject buttons
- `isCallerApproved` checks UserApproval status; unapproved users see a PendingApprovalPage
- Backend `checkAccess` already has a fallback: allows any user with a registered profile

## Requested Changes (Diff)

### Add
- New `getAllUserProfiles` backend function (admin-only) returning all registered profiles
- New "Profil" tab in admin dashboard listing all registered users (name + connection info)

### Modify
- `isCallerApproved` backend: return true for any caller who has a saved profile (no more approval gate)
- Frontend auth flow: after saving profile name, user goes directly to the dashboard (no access request step)
- Admin dashboard: rename "Accès" tab to "Profil", replace approval management UI with a simple list of all registered profiles
- Remove PendingApprovalPage / access request form (replaced by direct access)

### Remove
- `requestApproval` call from frontend flow
- Approval request UI ("Votre demande est en attente...")
- Approve/Reject/Revoke buttons in admin dashboard (no longer needed)

## Implementation Plan
1. Backend: add `getAllUserProfiles` query (admin-only), modify `isCallerApproved` to return true if profile exists
2. Frontend: update auth flow to skip approval step — saving profile name gives immediate access
3. Frontend: update admin dashboard — rename "Accès" tab to "Profil", replace AccessManagementTab with ProfileListTab showing all users
