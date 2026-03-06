# Dossiers Clients - Vial Traite Service

## Current State
L'application est fonctionnelle (Version 31) avec gestion des clients, interventions, dossier technique, et contrôle d'accès par approbation admin. Le problème actuel : l'administrateur se retrouve bloqué sur la page "Accès requis" car `getUserRole` déclenche un trap si le principal n'est pas dans la map des rôles (ex. après un redéploiement), ce qui bloque même l'admin.

## Requested Changes (Diff)

### Add
- Nouvelle fonction backend `hasAdminRegistered() : Bool` — retourne true si au moins un admin est enregistré dans le système
- Nouvelle fonction backend `claimAdminIfNoneExists()` — permet au premier appelant de se déclarer admin si aucun admin n'existe encore (auto-bootstrap sans token)
- Sur la page PendingApprovalPage : si `hasAdminRegistered()` retourne false, afficher un bouton "Je suis l'administrateur" permettant d'appeler `claimAdminIfNoneExists()`

### Modify
- `access-control.mo` : `hasPermission` et `isAdmin` ne doivent plus appeler `getUserRole` qui fait un trap — utiliser une version sûre qui retourne false si le principal n'est pas trouvé
- `checkAccess` dans `main.mo` : utiliser la version sécurisée sans trap
- `isCallerApproved` dans `main.mo` : utiliser `hasPermissionSafe` pour éviter tout trap

### Remove
- Rien à supprimer

## Implementation Plan
1. Régénérer le backend Motoko avec :
   - `hasPermissionSafe` dans access-control (switch sur la map, retourne false si absent)
   - `hasAdminRegistered()` public query
   - `claimAdminIfNoneExists()` public shared — assigne #admin au caller si `adminAssigned == false`
   - `checkAccess` et `isCallerApproved` utilisent la version sécurisée
2. Mettre à jour PendingApprovalPage :
   - Appeler `hasAdminRegistered()` au chargement
   - Si false : afficher bouton "Je suis l'administrateur" → appelle `claimAdminIfNoneExists()` puis redirige vers l'app
   - Si true : comportement normal (demande d'accès)
3. Valider et déployer
