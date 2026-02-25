# Specification

## Summary
**Goal:** Fix the client dossier page so it is accessible from the clients list, displays full client data, and allows editing client information.

**Planned changes:**
- Fix the TanStack Router route definition for `/clients/:clientId` to correctly register the dynamic `clientId` parameter.
- Ensure the `AuthenticatedOnly` guard does not block navigation to client dossier sub-routes.
- Fix `ClientDossierPage` to correctly read the `clientId` route parameter and fetch the client's data.
- Ensure the client dossier page displays the client's name, contact information, blacklist status, and intervention list without errors.
- Fix the edit button on `ClientDossierPage` to open `EditClientDialog` pre-populated with the client's existing data.
- Ensure the edit form submits via `useUpdateClient` and reflects changes on the page with a success toast.

**User-visible outcome:** Users can click on a client in the clients list to open their full dossier page, view all their details, and edit their information successfully.
