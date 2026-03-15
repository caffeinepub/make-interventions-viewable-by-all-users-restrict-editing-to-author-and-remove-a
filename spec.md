# Vial Traite Service

## Current State
Application complète de gestion clients/interventions avec :
- Authentification Internet Identity avec contrôle d'accès admin unique
- Gestion clients, interventions nominatives, dossier technique
- Planning hebdomadaire avec assignation d'interventions par salarié et signatures électroniques
- Navigation mobile avec 4 onglets : Clients, Planning, Tableau de bord, Dossier Technique
- Export de données

## Requested Changes (Diff)

### Add
- **Backend** : nouveau type `WorkHours` avec champs `employee`, `date {day, month, year}`, `morningStart`, `morningEnd`, `afternoonStart`, `afternoonEnd` (tous Text optionnels)
- **Backend** : `saveWorkHours(day, month, year, morningStart, morningEnd, afternoonStart, afternoonEnd)` — seul le caller peut sauvegarder ses propres heures
- **Backend** : `getWorkHoursForMonth(employee: Principal, month, year)` — retourne la liste des WorkHours du mois pour cet employé (lecture par tous les utilisateurs approuvés)
- **Backend** : `getAllEmployeesWorkHoursForMonth(month, year)` — retourne les WorkHours de tous les employés pour le mois (lecture par tous)
- **Frontend** : nouvelle page `TimesheetPage` avec :
  - Navigation par semaine (flèches précédent/suivant) et par mois
  - Vue semaine : grille Lun-Ven, saisie matin (début/fin) et après-midi (début/fin) pour chaque jour
  - Total journalier calculé automatiquement (en heures)
  - Total hebdomadaire et mensuel affichés automatiquement
  - Seul l'utilisateur connecté peut modifier ses propres heures (formulaire en lecture seule pour les autres)
  - Sélecteur d'employé pour voir les heures des autres salariés (lecture seule)
- **Frontend** : ajout de l'onglet "Feuille d'heures" dans MobileLayout (icône Clock)
- **Frontend** : nouvelle route `/timesheet` dans App.tsx

### Modify
- `MobileLayout.tsx` : ajouter l'onglet Feuille d'heures avec icône Clock
- `App.tsx` : ajouter la route `/timesheet`

### Remove
- Rien

## Implementation Plan
1. Ajouter le type `WorkHours` et la map `workHoursStore` dans le backend Motoko
2. Implémenter `saveWorkHours`, `getWorkHoursForMonth`, `getAllEmployeesWorkHoursForMonth`
3. Mettre à jour `backend.d.ts` avec les nouvelles interfaces
4. Créer `TimesheetPage.tsx` avec navigation semaine/mois, saisie détaillée, totaux automatiques
5. Mettre à jour `MobileLayout.tsx` et `App.tsx`
