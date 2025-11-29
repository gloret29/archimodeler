# Analyse de l'Application ArchiModeler

## 📊 Vue d'ensemble

**ArchiModeler** est une plateforme collaborative de modélisation d'architecture d'entreprise basée sur le standard ArchiMate 3.2. L'application combine une interface utilisateur moderne (type Figma) avec une architecture de données hybride pour permettre la modélisation, l'analyse et la gouvernance des architectures complexes.

---

## 🏗️ Architecture Technique

### Structure du Monorepo (Turborepo)

```
archimodeler/
├── apps/
│   ├── web/          # Frontend Next.js 16 (App Router)
│   ├── server/       # Backend NestJS
│   └── docs/         # Documentation Next.js
├── packages/
│   ├── database/     # Schéma Prisma (PostgreSQL)
│   ├── types/        # Types TypeScript partagés
│   ├── ui/           # Composants UI réutilisables
│   └── eslint-config/
└── docker-compose.yml
```

### Stack Technologique

#### Frontend
- **Framework** : Next.js 16.0.5 (App Router)
- **Langage** : TypeScript
- **Diagramming** : @xyflow/react (React Flow)
- **Styling** : Tailwind CSS 4.x
- **UI Components** : shadcn/ui (Radix UI)
- **State Management** : Zustand (multi-onglets, collaboration)
- **Internationalisation** : next-intl (EN/FR)
- **Collaboration** : WebSocket (Socket.io)

#### Backend
- **Framework** : NestJS 11
- **Langage** : TypeScript
- **ORM** : Prisma 5.22.0
- **Database** : PostgreSQL 15 (via Prisma)
- **Search** : OpenSearch 2.11.0
- **Authentification** : JWT + Passport.js
- **RBAC** : Rôles et Permissions
- **Versioning** : Octokit (GitHub API) - prévu

#### Infrastructure de Données
- **PostgreSQL 15** : Base de données principale
  - Objets (Elements)
  - Relations (Relationships)
  - Vues (Views)
  - Packages de modèles (ModelPackage)
  - Utilisateurs, Rôles, Permissions
  - Configuration système
  - Métamodèle ArchiMate
  - Stéréotypes et métadonnées
- **OpenSearch 2.11** : Moteur de recherche
  - Indexation des éléments
  - Recherche full-text

---

## 📦 Modules Backend (NestJS)

### 1. **AuthModule** - Authentification & Autorisation
- **Stratégies** : JWT, Local, SAML
- **Guards** : JWT Guard, Roles Guard
- **Endpoints** :
  - `POST /auth/login` - Connexion
  - `POST /auth/register` - Inscription
  - `GET /auth/profile` - Profil utilisateur

### 2. **ModelModule** - Gestion des Modèles
- **Services** : ModelService
- **Controllers** :
  - `ModelController` - CRUD Elements (`/model/elements`)
  - `ModelPackageController` - CRUD Packages (`/model/packages`)
  - `FolderController` - CRUD Folders (`/model/folders`)
  - `ViewController` - CRUD Views (`/model/views`)
  - `RelationshipsController` - CRUD Relationships (`/model/relationships`)
- **Fonctionnalités** :
  - Création automatique de ConceptType
  - Gestion des packages de modèles (ModelPackage)
  - Gestion du "Default Package"

### 3. **ModelModule** - Gestion des Modèles et Relations
- **Services** :
  - `ModelService` - CRUD des éléments, vues, dossiers, packages
  - `RelationshipsService` - CRUD des relations (PostgreSQL)
- **Fonctionnalités** :
  - Gestion des packages de modèles (ModelPackage)
  - Isolation des données par package
  - Création/suppression de relations
  - Requêtes de graphe (relations d'un élément, relations entre éléments)
  - Migration des relations existantes
  - Synchronisation avec PostgreSQL

### 4. **MetamodelModule** - Métamodèle ArchiMate
- **Fonctionnalités** :
  - Import du métamodèle ArchiMate 3.1/3.2
  - Gestion des ConceptTypes et RelationTypes
  - Règles de validation des relations

### 5. **WorkflowModule** - Gouvernance
- **Endpoints** :
  - `POST /workflow/change-requests` - Créer une demande de changement
  - `GET /workflow/change-requests` - Lister les demandes
  - `PUT /workflow/change-requests/:id/submit` - Soumettre pour revue
  - `PUT /workflow/change-requests/:id/approve` - Approuver
  - `PUT /workflow/change-requests/:id/reject` - Rejeter
  - `PUT /workflow/change-requests/:id/publish` - Publier
- **États** : DRAFT → IN_REVIEW → APPROVED → PUBLISHED → ARCHIVED

### 6. **SearchModule** - Recherche
- **Intégration** : OpenSearch
- **Fonctionnalités** :
  - Indexation automatique des éléments
  - Recherche full-text
  - Filtres avancés

### 7. **ScriptingModule** - Automatisation
- **Service** : ScriptingEngine (vm2/sandbox)
- **DSL** : Domain Specific Language pour requêtes
- **Endpoint** : `POST /scripting/execute`

### 8. **ConnectorsModule** - Intégrations Externes
- **Connecteurs** :
  - ServiceNow
  - API REST générique
- **Endpoints** :
  - `POST /connectors` - Créer un connecteur
  - `GET /connectors` - Lister les connecteurs
  - `POST /connectors/:id/sync` - Synchroniser

### 9. **AiModule** - Intelligence Artificielle
- **Services** :
  - Diagram Describer (GenAI)
  - Coach Chatbot (RAG)
- **Endpoints** :
  - `POST /ai/describe` - Décrire un diagramme
  - `POST /ai/coach` - Poser une question au coach

### 10. **CollaborationModule** - Collaboration Temps Réel
- **Gateway** : WebSocket Gateway
- **Fonctionnalités** :
  - Sessions par vue
  - Curseurs collaboratifs
  - Indicateurs de présence
  - Broadcasting des événements

### 11. **SettingsModule** - Configuration Système
- **Fonctionnalités** :
  - Paramètres globaux
  - Configuration GitHub
  - Configuration Neo4j

### 12. **RolesModule** - Gestion des Rôles
- **Rôles** : Consumer, Contributor, Designer, Lead Designer, System Administrator

### 13. **UsersModule** - Gestion des Utilisateurs
- **Fonctionnalités** : CRUD utilisateurs

---

## 🎨 Pages Frontend (Next.js)

### Routes Principales

#### 1. **Studio** (`/studio`)
- **Composants** :
  - `ModelingCanvas` - Canvas React Flow
  - `Stencil` - Palette d'objets ArchiMate
  - `ModelTree` - Arborescence du repository
  - `ViewTabs` - Onglets multiples
  - `CoachChat` - Chatbot IA
- **Fonctionnalités** :
  - Modélisation visuelle
  - Drag-and-drop
  - Création de relations
  - Collaboration temps réel
  - Multi-onglets

#### 2. **Dashboard** (`/dashboard`)
- **Fonctionnalités** :
  - Statistiques du modèle
  - Graphiques (Recharts)
  - Vue d'ensemble

#### 3. **Home** (`/home`)
- **Fonctionnalités** :
  - Page d'accueil personnalisable
  - Raccourcis vers les vues favorites

#### 4. **Administration** (`/admin`)
- **Sous-pages** :
  - `/admin/users` - Gestion des utilisateurs
  - `/admin/roles` - Gestion des rôles
  - `/admin/settings` - Paramètres système
- **Protection** : Role Admin uniquement

#### 5. **Settings** (`/settings`)
- **Sous-pages** :
  - `/settings/profile` - Profil utilisateur
  - `/settings/appearance` - Thème (sombre/clair)
  - `/settings/language` - Langue (EN/FR)

#### 6. **Governance** (`/governance`)
- **Fonctionnalités** :
  - Liste des demandes de changement
  - Interface de revue

#### 7. **Connectors** (`/connectors`)
- **Fonctionnalités** :
  - Liste des connecteurs
  - Configuration et synchronisation

---

## 🗄️ Modèle de Données (PostgreSQL)

### Entités Principales

#### 1. **User** - Utilisateurs
- `id`, `email`, `password`, `name`
- Relations : `roles[]`, `groups[]`

#### 2. **Role** - Rôles RBAC
- `id`, `name`, `description`
- Relations : `users[]`, `permissions[]`

#### 3. **ModelPackage** - Packages de Modèles
- `id`, `name`, `description`, `status`
- Relations : `elements[]`, `relationships[]`, `folders[]`, `views[]`

#### 4. **Element** - Éléments ArchiMate
- `id`, `name`, `documentation`, `properties` (JSONB)
- Relations : `conceptType`, `modelPackage`, `folder`, `dataSource`
- Versioning : `validFrom`, `validTo`, `versionId`

#### 5. **Relationship** - Relations
- `id`, `name`, `documentation`, `properties` (JSONB)
- Relations : `relationType`, `source`, `target`, `modelPackage`
- **Note** : Les relations sont stockées dans PostgreSQL et isolées par ModelPackage

#### 6. **View** - Vues de Diagrammes
- `id`, `name`, `description`, `content` (JSONB - layout)
- Relations : `modelPackage`, `folder`

#### 7. **Metamodel** - Métamodèle
- `id`, `name`, `version`, `description`
- Relations : `conceptTypes[]`, `relationTypes[]`

#### 8. **ConceptType** - Types de Concepts
- `id`, `name`, `category`
- Relations : `metamodel`, `elements[]`

#### 9. **RelationType** - Types de Relations
- `id`, `name`
- Relations : `metamodel`, `allowedSourceTypes[]`, `allowedTargetTypes[]`

#### 10. **DataSource** - Sources de Données Externes
- `id`, `name`, `type`, `config` (JSONB), `mapping` (JSONB)
- Relations : `elements[]`

#### 11. **Folder** - Dossiers
- `id`, `name`
- Relations : `parent`, `children[]`, `elements[]`, `views[]`

#### 12. **ChangeRequest** - Demandes de Changement
- `id`, `title`, `description`, `status`
- Relations : `modelPackage`, `requester`, `reviewer`

#### 13. **SystemSetting** - Paramètres Système
- `key`, `value` (JSONB), `description`

---

## 🔄 Flux de Données

### Architecture de Données

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │ HTTP/REST + WebSocket
         ▼
┌─────────────────┐
│   Backend       │
│   (NestJS)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Principal)   │
│  - Elements     │
│  - Relations    │
│  - Views        │
│  - Packages     │
│  - Users        │
└─────────────────┘
```

### Gestion des Données

1. **Création d'élément** :
   - PostgreSQL : Création de l'Element avec association au ModelPackage

2. **Création de relation** :
   - PostgreSQL : Création de la Relationship avec validation des types
   - Isolation par ModelPackage (les relations ne peuvent lier que des éléments du même package)

3. **Suppression d'élément** :
   - PostgreSQL : Suppression en cascade des relations associées
   - Suppression de l'Element

---

## ✅ Fonctionnalités Implémentées

### Phase 1-8 : Terminées ✅
- ✅ Initialisation et socle technique
- ✅ Moteur de métamodèle dynamique
- ✅ Interface de modélisation (React Flow)
- ✅ Scripting et automatisation
- ✅ Portail collaboratif
- ✅ Intégrations (ServiceNow)
- ✅ Intelligence artificielle
- ✅ Améliorations UX

### Phase 9 : Infrastructure Hybride ✅
- ✅ Gestion des relations PostgreSQL
- ✅ Page d'administration
- ✅ Gestion des paramètres système

### Phase 10 : Personnalisation ✅
- ✅ Paramètres utilisateur
- ✅ Thème (sombre/clair)
- ✅ Internationalisation (EN/FR)

### Phase 11 : Collaboration Temps Réel ✅ (Partiel)
- ✅ Système d'onglets multiples
- ✅ WebSocket et infrastructure de collaboration
- ✅ Indicateurs de présence
- 🟡 Synchronisation complète (en cours)
- ❌ Gestion des conflits (OT/CRDT) - À faire

---

## 🔴 Fonctionnalités À Faire

### Phase 12 : Stéréotypes et Métadonnées
- ❌ Modèle de données pour Stéréotypes
- ❌ Interface d'administration des stéréotypes
- ❌ Propriétés étendues dynamiques

### Phase 13 : Versioning
- ❌ Intégration GitHub complète
- ❌ Historique des modifications
- ❌ Actions Commit / Rollback
- ❌ Visualisation des diffs

### Phase 14 : Export et Sécurité
- ❌ Export Images (PNG, SVG, PDF)
- ❌ Export Données (JSON, XML)
- ❌ Backup automatisé
- ❌ Suppression non-destructive

### Phase 15 : Analyse Avancée
- ❌ Page d'exploration PostgreSQL "No-Code"
- ❌ Système de notifications global

### Autres
- ❌ Styles visuels stricts ArchiMate 3.2
- ❌ Prévention des doublons de relations
- ❌ Validation temps réel
- ❌ Accessibilité (navigation clavier, lecteur d'écran)

---

## 🔐 Sécurité

### Authentification
- **JWT** : Tokens stockés en localStorage
- **Passport.js** : Stratégies JWT, Local, SAML
- **Guards** : Protection des routes

### Autorisation (RBAC)
- **Rôles** :
  - Consumer : Lecture seule
  - Contributor : Lecture + Commentaires
  - Designer : Création/Modification
  - Lead Designer : Approbation
  - System Administrator : Administration complète

### Validation
- **DTOs** : Validation des données d'entrée
- **Guards** : Vérification des rôles

---

## 📊 Points Forts

1. **Architecture Moderne** : Monorepo, TypeScript, Next.js 16, NestJS 11
2. **Données Hybrides** : PostgreSQL + Neo4j pour optimiser les performances
3. **Collaboration** : WebSocket pour le temps réel
4. **Extensibilité** : Métamodèle dynamique, scripting, connecteurs
5. **UX Moderne** : Interface type Figma, multi-onglets, thème sombre/clair
6. **Internationalisation** : Support EN/FR
7. **IA Intégrée** : Description de diagrammes, chatbot coach

---

## ⚠️ Points d'Attention

1. **Synchronisation** : La synchronisation complète en temps réel n'est pas encore implémentée
2. **Gestion des Conflits** : Pas de système OT/CRDT pour résoudre les conflits
3. **Versioning** : L'intégration GitHub n'est pas complète
4. **Tests** : Pas de tests unitaires/intégration visibles
5. **Documentation API** : Pas de Swagger/OpenAPI visible
6. **Performance** : Pas d'optimisation visible pour les gros modèles
7. **Accessibilité** : Pas d'implémentation d'accessibilité

---

## 🚀 Recommandations

### Court Terme
1. Compléter la synchronisation temps réel
2. Implémenter la gestion des conflits (OT/CRDT)
3. Ajouter des tests unitaires et d'intégration
4. Documenter l'API (Swagger)

### Moyen Terme
1. Finaliser l'intégration GitHub
2. Implémenter le système de stéréotypes
3. Ajouter les exports (PNG, SVG, PDF)
4. Améliorer l'accessibilité

### Long Terme
1. Optimiser les performances pour les gros modèles
2. Ajouter des analyses avancées basées sur PostgreSQL
3. Implémenter le système de notifications
4. Ajouter plus de connecteurs (Excel, CSV, etc.)

---

## 📈 Métriques de Code

- **Backend** : ~15 modules NestJS
- **Frontend** : ~10 pages principales, ~20 composants
- **Base de données** : 13 modèles Prisma
- **Infrastructure** : 3 services Docker (PostgreSQL, OpenSearch, Dashboards)

---

*Analyse effectuée le 29 novembre 2025*


