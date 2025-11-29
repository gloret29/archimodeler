# Suivi de l'Implémentation ArchiModeler

Ce fichier retrace l'historique du développement et définit la roadmap des futures fonctionnalités.

## ✅ Phase 1 : Initialisation et Socle Technique (Terminé)

- [x] **Configuration du Workspace**
  - [x] Initialisation Monorepo (Turborepo)
  - [x] Application Server (NestJS)
  - [x] Application Web (Next.js, Tailwind, Shadcn/UI)
  - [x] Packages Partagés (Database, Types)
  - [x] Infrastructure (Docker Compose PostgreSQL)

- [x] **Sécurité et IAM**
  - [x] Module Auth (Passport.js)
  - [x] Modèles Prisma (User, Role, Permission, Group)
  - [x] Seeding des Rôles (RBAC)
  - [x] Guards NestJS

## ✅ Phase 2 : Moteur de Métamodèle (Terminé)

- [x] **Moteur Dynamique**
  - [x] Modèles de données (Metamodel, ConceptType, Element, Relationship)
  - [x] Logique de Versionning (Time Travel)
  - [x] API Import Métamodèle

- [x] **Standard ArchiMate**
  - [x] Implémentation ArchiMate 3.1/3.2
  - [x] Types et Relations standards

## ✅ Phase 3 : Interface de Modélisation (Terminé)

- [x] **Canvas React Flow**
  - [x] Composant ModelingCanvas
  - [x] Palette d'Objets (Stencil)
  - [x] Drag-and-Drop
  - [x] Personnalisation des Nœuds

- [x] **Smart Connectors**
  - [x] Interception création de liens
  - [x] Menu contextuel "Quick Create"
  - [x] Validation dynamique des relations
  - [x] Relations Dérivées

## ✅ Phase 4 : Scripting et Automatisation (Terminé)

- [x] **Moteur de Scripting**
  - [x] Service ScriptingEngine (vm2/sandbox)
  - [x] DSL (Domain Specific Language)
  - [x] Endpoint d'exécution

## ✅ Phase 5 : Portail Collaboratif (Terminé)

- [x] **Dashboards & Recherche**
  - [x] Intégration OpenSearch
  - [x] Page Dashboard (Charts)

- [x] **Workflow**
  - [x] Machine à États (Draft -> Published)
  - [x] Moteur de Règles de Qualité
  - [x] Interface de Revue

## ✅ Phase 6 : Intégration (Terminé)

- [x] **Connecteurs**
  - [x] Module Data Connectors
  - [x] API REST "Open API"
  - [x] Connecteur ServiceNow

## ✅ Phase 7 : Intelligence Artificielle (Terminé)

- [x] **Assistants IA**
  - [x] Service Diagram Describer (GenAI)
  - [x] Chatbot Coach (RAG)

## ✅ Phase 8 : Améliorations UX (Terminé)

- [x] **Gestion des Éléments**
  - [x] Dialog de renommage moderne (RenameDialog)
  - [x] Menu contextuel complet
  - [x] Gestion du "Default Package"

---

## 🟡 Phase 9 : Infrastructure Hybride et Administration (En cours)

### 9.1 Intégration Neo4j
**Statut**: 🟢 **Terminé**
- [x] Installer et configurer Neo4j (docker-compose)
- [x] Créer un module Neo4j dans le backend
- [x] Créer un service pour gérer les relations (CRUD)
- [x] Adapter les endpoints existants pour utiliser Neo4j pour les relations
- [x] Créer des migrations pour transférer les relations existantes (Endpoint /model/relationships/migrate)

### 9.2 Page d'Administration
**Statut**: � **Terminé**
- [x] Créer la route `/admin` protégée (Role Admin)
- [x] Interface de gestion des paramètres globaux
- [x] Configuration des connecteurs (GitHub, Neo4j)

### 9.3 Gestion Utilisateurs et Rôles
**Statut**: 🔴 **À faire**
- [ ] CRUD Utilisateurs
- [ ] CRUD Rôles et Permissions
- [ ] Assignation des rôles

## 🔴 Phase 10 : Personnalisation (À faire)

### 10.1 Expérience Utilisateur
- [ ] Paramètres utilisateur (Thème, Langue)
- [ ] Page d'accueil personnalisable (Raccourcis Vues)
- [ ] Panneau d'information contextuel (Détails sélection)

## 🔴 Phase 11 : Modélisation Avancée (À faire)

### 11.1 Édition et Collaboration
- [ ] Système multi-onglets pour les vues
- [ ] Collaboration temps réel (WebSocket/Socket.io)
- [ ] Gestion des conflits et curseurs distants

### 11.2 Conformité et Qualité
- [ ] Styles visuels stricts ArchiMate 3.2
- [ ] Prévention des doublons de relations
- [ ] Validation temps réel

## 🔴 Phase 12 : Stéréotypes et Métadonnées (À faire)

### 12.1 Système de Stéréotypes
- [ ] Modèle de données pour Stéréotypes (Objets & Relations)
- [ ] Interface d'administration des stéréotypes
- [ ] Propriétés étendues dynamiques

## 🔴 Phase 13 : Versioning (À faire)

### 13.1 Intégration GitHub
- [ ] Configuration du dépôt cible
- [ ] Service de synchronisation Octokit
- [ ] Mapping Modèle <-> Fichiers

### 13.2 Workflow de Versioning
- [ ] Historique des modifications (Objets & Vues)
- [ ] Actions Commit / Rollback
- [ ] Visualisation des diffs

## 🔴 Phase 14 : Export et Sécurité (À faire)

### 14.1 Exports
- [ ] Export Images (PNG, SVG, PDF)
- [ ] Export Données (JSON, XML)

### 14.2 Backup et Maintenance
- [ ] Backup automatisé PostgreSQL + Neo4j
- [ ] Suppression non-destructive (Soft Delete)

## 🔴 Phase 15 : Analyse Avancée (À faire)

### 15.1 Analyse de Graphe
- [ ] Page d'exploration Neo4j "No-Code"
- [ ] Filtres et visualisations avancées

### 15.2 Notifications
- [ ] Système de notifications global
- [ ] Centre de notifications utilisateur
