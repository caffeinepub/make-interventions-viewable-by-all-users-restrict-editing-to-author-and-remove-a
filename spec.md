# Vial Traite Service

## Current State
The backend has `isCallerApproved()`, `hasAdminRegistered()`, and `claimAdminIfNoneExists()`, but is missing `isCallerAdmin()`. The frontend hook `useIsCallerAdmin` calls `actor.isCallerAdmin()` which does not exist, so it always returns false (caught error), causing all users including the real admin to be treated as non-admin.

## Requested Changes (Diff)

### Add
- `isCallerAdmin()` query function in backend that returns true if the caller is the stored admin principal

### Modify
- Nothing else changes

### Remove
- Nothing

## Implementation Plan
1. Add `public query isCallerAdmin` function to main.mo that checks caller against `adminPrincipal` and `accessControlState`
