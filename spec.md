# Vial Traite Service

## Current State
Application de gestion clients/interventions/planning sur Internet Computer. De nombreux bugs critiques persistent :
- Erreur "impossible de se connecter au serveur" au démarrage (initialisation bloquante)
- Admin non reconnu après redéploiement, bouton "Je suis l'administrateur" absent
- Onglet "Gestion des accès" absent du tableau de bord admin
- Crash feuille d'heures (React error #185, boucle infinie)
- Erreur chargement clients

## Requested Changes (Diff)

### Add
- Architecture d'authentification entièrement refaite : connexion non bloquante, initialisation async isolée
- Backend avec stockage stable (`adminPrincipal` en `stable var`) pour persistance admin après redéploiement
- Fonction `claimAdmin` sans vérification préalable (premier appel = admin)
- Flux utilisateur : saisie nom → demande d'accès OU claim admin (si aucun admin)
- Onglet "Accès" dans tableau de bord admin avec liste des demandes + nom de profil
- Feuille d'heures sans références d'objets instables (useMemo pour éviter React error #185)

### Modify
- Toute l'architecture frontend d'authentification : jamais bloquante, retry silencieux
- Tableau de bord : onglets Accueil + Accès (visible uniquement pour admin)
- Gestion clients : fonction `getClientsWithIds` correctement exposée dans bindings

### Remove
- Appels d'initialisation synchrones qui bloquaient la connexion
- Logique de vérification admin par cache (cause de disparition de l'onglet)

## Implementation Plan
1. Backend Motoko avec stable storage pour admin, gestion profils, clients, interventions, planning, feuilles d'heures
2. Fonctions clés : `claimAdmin`, `isCallerAdmin`, `saveUserProfile`, `requestAccess`, `approveAccess`, `revokeAccess`, `getPendingAccessRequests`
3. Frontend : flux auth en 4 états clairs (loading → name-entry → pending-approval → app)
4. Admin bypass complet : si `isCallerAdmin()` = true, jamais de blocage
5. Toutes les connexions au canister dans try/catch, jamais bloquantes
6. Feuille d'heures avec useMemo strict, pas de tableaux recréés à chaque render
7. Planning hebdomadaire, signatures électroniques, dossier technique
