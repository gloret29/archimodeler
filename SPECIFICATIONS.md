# ArchiModeler - Spécifications Techniques et Fonctionnelles

## 1. Vue d'ensemble

ArchiModeler est une plateforme collaborative de modélisation d'architecture d'entreprise basée sur le standard ArchiMate 3.2. Elle combine une interface utilisateur moderne (type Figma) avec une architecture de données hybride robuste pour permettre la modélisation, l'analyse et la gouvernance des architectures complexes.

## 2. Architecture Technique

### 2.1 Stack Technologique

#### Frontend
- **Framework**: Next.js 16.0.5 (App Router)
- **Langage**: TypeScript
- **UI Components**: 
  - shadcn/ui (Radix UI + Tailwind CSS)
  - Lucide React (icônes)
- **Diagramming**: @xyflow/react (React Flow)
- **State Management**: Zustand (Support multi-onglets et collaboration)
- **Collaboration**: Socket.io Client (WebSocket pour collaboration temps réel)
- **Internationalisation**: next-intl

#### Backend
- **Framework**: NestJS
- **Langage**: TypeScript
- **ORM**: Prisma 5.22.0 (PostgreSQL)
- **Database**: PostgreSQL 15 (via Prisma)
- **WebSocket**: Socket.io (collaboration temps réel)
- **Versioning**: Octokit (GitHub API)
- **Authentification**: JWT + RBAC (Passport.js)
- **Services**: Model, Search, Workflow, Notifications, Comments

#### Infrastructure de Données
- **PostgreSQL 15** : Base de données principale pour :
  - Définitions des objets (Elements)
  - Relations entre objets (Relationships)
  - Définitions des vues (Views)
  - Packages de modèles (ModelPackage)
  - Utilisateurs, Rôles, Permissions
  - Notifications
  - Commentaires et annotations (CommentThread, Comment, CommentMention)
  - Configuration et Stéréotypes
  - Isolation des données par package
- **OpenSearch 2.11** : Moteur de recherche pour :
  - Indexation des éléments
  - Recherche full-text
- **GitHub** : Backend de versioning (prévu) pour :
  - Historique des modifications (Commit/Rollback)
  - Diff et Blame

### 2.2 Modèle de Données (PostgreSQL)

```prisma
// Métamodèle ArchiMate
model Metamodel {
  id          String        @id @default(uuid())
  name        String        @unique
  version     String
  conceptTypes ConceptType[]
}

// Types de concepts (Business Actor, Application Component, etc.)
model ConceptType {
  id           String    @id @default(uuid())
  name         String
  category     String    // Layer
  metamodelId  String
  metamodel    Metamodel @relation(fields: [metamodelId], references: [id])
  elements     Element[]
}

// Éléments du modèle
model Element {
  id             String      @id @default(uuid())
  name           String
  documentation  String?
  conceptTypeId  String
  conceptType    ConceptType @relation(fields: [conceptTypeId], references: [id])
  properties     Json?       // Propriétés étendues (Stéréotypes)
  stereotypeId   String?     // Lien vers définition de stéréotype
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}

// Vues
model View {
  id             String       @id @default(uuid())
  name           String
  content        Json         // Layout (Nodes positions)
  version        String?      // Hash du commit GitHub
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
}

// Utilisateurs et Rôles
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  roles     Role[]
  settings  Json?    // Préférences utilisateur
}

model Role {
  id          String       @id @default(uuid())
  name        String       @unique
  permissions Permission[]
  users       User[]
}
```

## 3. Fonctionnalités Détaillées

### 3.1 Administration et Sécurité

#### Page d'Administration
- **Accès** : Réservé aux utilisateurs avec le rôle `ADMIN`.
- **Gestion des Utilisateurs** : CRUD complet, assignation des rôles.
- **Gestion des Rôles** : Création de rôles personnalisés, gestion des permissions.
- **Configuration** :
  - Paramétrage du dépôt GitHub pour le versioning.
  - Configuration des connecteurs (ServiceNow, etc.).
- **Gestion des Stéréotypes** :
  - Définition des stéréotypes pour les objets et les relations.
  - Définition des propriétés étendues associées à chaque stéréotype.

#### Expérience Utilisateur
- **Dashboard Personnalisé** : Chaque utilisateur peut organiser ses vues favorites en raccourcis sur sa page d'accueil (Drag & Drop).
- **Notifications** : 
  - Centre de notifications avec badge de compteur non lus
  - Notifications automatiques pour les change requests (création, soumission, approbation, rejet, publication)
  - Notifications pour les mentions dans les commentaires
  - Notifications pour les réponses aux commentaires
  - Notifications en temps réel via WebSocket
  - Gestion des notifications (marquer comme lues, supprimer)
- **Thème Sombre** : Support complet du thème sombre avec adaptation automatique des couleurs et SVG.
- **Commentaires et Annotations** :
  - Système de commentaires sur les éléments et relations
  - Threads de discussion avec réponses imbriquées
  - Mentions d'utilisateurs (@username) avec autocomplétion
  - Annotations visuelles sur le canvas (badges de commentaires)
  - Notifications automatiques pour les mentions et réponses
  - Résolution/marquage des commentaires comme résolus
  - Panneau de commentaires repliable dans le panneau des propriétés
  - Mises à jour en temps réel via WebSocket
- **Préférences** : Stockage des paramètres utilisateur (Thème, Langue, Affichage par défaut).

### 3.2 Modélisation Avancée

#### Édition et Navigation
- **Multi-onglets** : Possibilité d'ouvrir et d'éditer plusieurs vues simultanément dans des onglets au sein de l'application.
- **Panneau de Détails** : Lorsqu'un objet ou une relation est sélectionné, ses propriétés (y compris les propriétés étendues des stéréotypes) s'affichent dans un panneau dédié à droite, sous le repository.

#### Collaboration Temps Réel
- **Édition Concurrente** : Plusieurs utilisateurs peuvent éditer la même vue sans blocage.
- **Synchronisation** : Les modifications (déplacement, ajout, suppression) sont répercutées instantanément sur les écrans des autres utilisateurs via WebSocket.
- **Curseurs** : Affichage des curseurs des autres utilisateurs avec leur nom.
- **Utilisateurs Actifs** : Liste des utilisateurs actifs dans le Studio avec leurs noms.
- **Chat Direct** : Chat en temps réel entre utilisateurs actifs avec notifications visuelles (toast).
- **Badge Messages Non Lus** : Indicateur de messages non lus sur les avatars des utilisateurs.
- **Gestion des Conversations** : Accès rapide aux conversations depuis l'avatar de l'utilisateur connecté.

#### Relations et Stéréotypes
- **Stéréotypes** :
  - Les objets et les relations peuvent être stéréotypés.
  - Un stéréotype ajoute des champs de données spécifiques (ex: "Application Critique" ajoute "RTO/RPO").
- **Règles de Modélisation** :
  - **Unicité** : Interdiction de créer des doublons de relations de même type entre deux mêmes objets.
  - **Conformité ArchiMate** : L'affichage des relations (flèches, traits) doit respecter strictement la norme ArchiMate 3.2.
- **Suppression Non-destructive** : Supprimer une vue ne supprime JAMAIS les objets ou les relations qu'elle contient du repository.

### 3.3 Versioning (GitHub)

- **Configuration** : Le dépôt cible est configuré dans l'admin. Si non configuré, le versioning est désactivé.
- **Actions Utilisateur** :
  - **Clic Droit** sur un objet/vue -> "History".
  - **Commit** : Valider un ensemble de changements avec un message.
  - **Rollback** : Revenir à une version précédente.
- **Sécurité** : Prévisualisation des impacts (objets/relations modifiés) avant toute action de Commit ou Rollback.

### 3.4 Analyse et Données (Neo4j)

- **Stockage Graph** :
  - Les relations entre objets sont stockées dans Neo4j pour la performance des traversées.
  - Les liens entre Vues et Objets sont aussi dans Neo4j (pour savoir "Dans quelles vues apparaît cet objet ?").
- **Analyse d'Impact** :
  - Page dédiée "Graph Analysis".
  - Interface "No-Code" pour explorer le graphe (filtres visuels, expansion de nœuds) sans écrire de Cypher.

### 3.5 Export et Backup

- **Export** :
  - Export des Vues (PNG, SVG, PDF).
  - Export des Données (JSON, XML ArchiMate Exchange Format).
  - Export des Packages complets incluant les relations (relationships).
- **Import** :
  - Import de Packages complets avec reconstruction des relations.
  - Gestion des ID et mapping lors de l'import.
- **Duplication** :
  - Duplication de ModelPackage avec toutes les données (éléments, relations, vues, dossiers).
- **Backup** :
  - Sauvegarde automatisée de la base PostgreSQL.
  - Sauvegarde synchronisée de la base Neo4j.

## 4. Roadmap d'Implémentation

Voir le fichier [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) pour le suivi détaillé des tâches et l'ordre de priorité.

---
**Version**: 2.0.0
**Date**: 29 Novembre 2025
