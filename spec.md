# Vial Traite Service

## Current State
Les variables `adminAssigned` et `adminPrincipal` dans le backend sont déclarées avec `var` (non stables). À chaque redéploiement du canister, elles se remettent à zéro : `adminAssigned = false` et `adminPrincipal = null`. Conséquence : tous les utilisateurs voient le bouton "Je suis l'administrateur" même quand un admin existe déjà.

## Requested Changes (Diff)

### Add
- Rien

### Modify
- Changer `var adminPrincipal` et `var adminAssigned` en `stable var` dans le backend pour persister à travers les upgrades

### Remove
- Rien

## Implementation Plan
1. Remplacer `var adminPrincipal : ?Principal = null` par `stable var adminPrincipal : ?Principal = null`
2. Remplacer `var adminAssigned : Bool = false` par `stable var adminAssigned : Bool = false`
