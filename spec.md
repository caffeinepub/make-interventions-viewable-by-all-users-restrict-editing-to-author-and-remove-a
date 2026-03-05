# Vial Traite Service - Gestion Clientèle

## Current State
Application de gestion clientèle avec :
- Dossiers clients (coordonnées, interventions, liste noire)
- Dossier technique (fichiers PDF, photos, vidéos avec sous-dossiers)
- Système d'accès avec approbation par administrateur
- Mode hors-ligne avec synchronisation
- Design aux couleurs du logo Vial Traite Service

## Requested Changes (Diff)

### Add
- Rien à ajouter

### Modify
- **Bug critique** : `getUserRole` dans `access-control.mo` retourne `#guest` au lieu de faire `Runtime.trap("User is not registered")` quand l'utilisateur n'est pas enregistré. Cela empêche toute connexion, y compris pour l'administrateur, car `hasPermission` et `isAdmin` plantent avant que l'utilisateur puisse s'initialiser.
- `hasPermission` : vérification anonyme en premier, retourne `false` si anonyme
- `isAdmin` : vérification anonyme en premier, retourne `false` si anonyme
- `isCallerApproved` : doit retourner `true` si l'utilisateur est admin (via `Auth.isAdmin`) OU si approuvé dans `UserApproval`

### Remove
- Rien à supprimer

## Implementation Plan
1. Corriger `getUserRole` pour retourner `#guest` au lieu de `Runtime.trap` quand l'utilisateur n'est pas trouvé dans la map
2. Ajouter vérification anonyme dans `hasPermission` et `isAdmin`
3. S'assurer que `isCallerApproved` retourne `true` pour les admins
4. Conserver tout le reste de l'application identique
