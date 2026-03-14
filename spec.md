# Vial Traite Service

## Current State

L'application gère des clients, interventions, un dossier technique, et un contrôle d'accès (admin + salariés approuvés). Les interventions sont liées aux fiches clients, nominatives, avec médias. Un tableau de bord avec calendrier permet de retrouver les interventions par date. Pas de planning hebdomadaire ni de signatures électroniques.

## Requested Changes (Diff)

### Add
- Type `ScheduledIntervention` : id, clientId, assignedEmployee (Principal), reason (motif), startTime (Text HH:MM), endTime (Text HH:MM), description, media ([ExternalBlob]), employeeSignature (?Text base64), clientSignature (?Text base64), date {day, month, year}, weekYear (Nat), weekNumber (Nat), createdBy (Principal), createdAt (Time)
- Backend : `createScheduledIntervention`, `updateScheduledIntervention`, `deleteScheduledIntervention`, `getScheduledInterventionsByWeek(weekNumber, year)`, `getScheduledInterventionById`
- Page `/planning` : vue grille hebdomadaire — lignes = jours (Lun–Ven), colonnes = salariés approuvés ; navigation semaine précédente/suivante
- Formulaire d'intervention planifiée : recherche client existant ou création rapide, motif, horaires début/fin, description, ajout photos/vidéos, signatures électroniques (canvas dessin au doigt/souris) pour le salarié et le client
- Page de détail intervention planifiée : lecture seule avec affichage des signatures et médias
- Lien vers `/planning` depuis la navigation principale (MobileLayout)

### Modify
- `MobileLayout` : ajouter lien de navigation vers `/planning`
- `App.tsx` : ajouter la route `/planning` et `/planning/$interventionId`
- Backend `main.mo` : ajouter les fonctions et types pour les interventions planifiées

### Remove
- Rien

## Implementation Plan

1. Ajouter type `ScheduledIntervention` et map `scheduledInterventions` dans `main.mo`
2. Implémenter `createScheduledIntervention`, `updateScheduledIntervention`, `deleteScheduledIntervention`, `getScheduledInterventionsByWeek`, `getScheduledInterventionById`
3. Générer les bindings TypeScript
4. Créer page `PlanningPage.tsx` avec grille Lun–Ven × salariés
5. Créer `ScheduledInterventionFormDialog.tsx` avec canvas signature
6. Créer `ScheduledInterventionDetailPage.tsx`
7. Ajouter routes dans `App.tsx`
8. Ajouter lien planning dans `MobileLayout`
