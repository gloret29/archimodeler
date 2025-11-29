# Backlog ArchiModeler

Ce fichier suit l'avancement des fonctionnalités définies dans la roadmap.

## 1. Architecture & Données

- [ ] **Intégration Neo4j**
  - [ ] Configurer la connexion à Neo4j dans le backend.
  - [ ] Migrer/Stocker les relations entre objets et entre objets/vues dans Neo4j.
  - [ ] Garder PostgreSQL comme référentiel principal des objets et vues.
  - [ ] Assurer la synchronisation entre PostgreSQL (objets) et Neo4j (relations).

- [ ] **Système de Versioning (GitHub)**
  - [ ] Ajouter le paramétrage du dépôt GitHub dans la page d'administration.
  - [ ] Implémenter la logique de versioning pour les objets et les vues via l'API GitHub.
  - [ ] Désactiver le versioning si aucun dépôt n'est configuré.
  - [ ] Interface utilisateur (Clic droit) pour voir l'historique, commit, rollback.
  - [ ] Prévisualisation des changements (diff) avant validation (commit/rollback).

- [ ] **Backup & Export**
  - [ ] Système de backup de la base de données PostgreSQL.
  - [ ] Système d'export des vues et des objets (format à définir, ex: XML, JSON).

## 2. Administration & Utilisateurs

- [ ] **Page d'Administration**
  - [ ] Créer une interface d'administration sécurisée (RBAC: rôle admin requis).
  - [ ] Gestion des utilisateurs (CRUD).
  - [ ] Gestion des rôles (CRUD).
  - [ ] Gestion des paramètres de l'application (dont dépôt GitHub).
  - [ ] Gestion des stéréotypes (Objets et Relations).

- [ ] **Expérience Utilisateur**
  - [ ] Paramètres propres à chaque utilisateur.
  - [ ] Dashboard personnalisable : organisation des vues en raccourci sur la page d'accueil.
  - [ ] Système de notification global (bandeau d'alerte en haut de page).

## 3. Modélisation & Édition

- [ ] **Édition Avancée**
  - [ ] **Multi-onglets** : Pouvoir éditer plusieurs vues simultanément dans l'interface.
  - [ ] **Collaboration Temps Réel** : Édition concurrente non bloquante avec visualisation instantanée des modifications des autres utilisateurs.
  - [ ] **Panneau de Détails** : Affichage des propriétés de l'objet/relation sélectionné dans une zone à droite (sous le repository).

- [ ] **Stéréotypes & Propriétés Étendues**
  - [ ] Définition des stéréotypes pour les objets Archimate (stockage PG, gestion Admin).
  - [ ] Définition des stéréotypes pour les relations.
  - [ ] "Augmentation" des objets/relations : ajout de propriétés dynamiques basées sur le stéréotype.

- [ ] **Règles & Conformité**
  - [ ] Unicité des relations : Interdire les doublons de relations de même type entre deux mêmes objets.
  - [ ] Respect strict de la norme ArchiMate pour l'affichage des relations.
  - [ ] Suppression de vue non destructive : Supprimer une vue ne doit pas supprimer les objets ni leurs relations.

## 4. Analyse & Visualisation

- [ ] **Analyse de Graphe**
  - [ ] Page dédiée à l'analyse des liens (Neo4j).
  - [ ] Interface visuelle "No-Code" (sans connaître Cypher) pour explorer le graphe.

---
*Généré à partir de NEW_ROADMAP.md*
