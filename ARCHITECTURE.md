# Architecture Technique ArchiModeler

## 🏗️ Vue d'ensemble

ArchiModeler repose sur une architecture moderne, modulaire et hybride, conçue pour la scalabilité et la collaboration temps réel.

## 📂 Structure du Monorepo (Turborepo)

- **`apps/web`** : Frontend Next.js (App Router)
  - Interface Studio (React Flow)
  - Portail Collaboratif
  - Gestion de l'état global (Zustand)
- **`apps/server`** : Backend NestJS
  - API REST
  - Services Métier (Model, Search, Workflow)
  - Gestion des packages de modèles
  - Intégration GitHub (prévu)
- **`packages/database`** : Couche de données
  - Schéma Prisma (PostgreSQL)
  - Migrations & Seeds
- **`packages/types`** : Bibliothèque de types partagés
  - DTOs, Interfaces, Enums
- **`packages/ui`** : Système de Design
  - Composants React réutilisables (basés sur shadcn/ui)

## 🚀 Stack Technologique

### Frontend
- **Framework** : Next.js 16
- **Langage** : TypeScript
- **Diagramming** : React Flow (@xyflow/react)
- **Styling** : Tailwind CSS
- **UI Components** : shadcn/ui + Lucide React
- **State Management** : Zustand

### Backend
- **Framework** : NestJS
- **Langage** : TypeScript
- **ORM** : Prisma
- **Database** : PostgreSQL 15
- **Versioning** : Octokit (GitHub API) - prévu
- **Search** : OpenSearch 2.11

### Infrastructure de Données
- **PostgreSQL 15** : *Base de données principale*
  - Objets (Elements)
  - Relations (Relationships)
  - Vues (Views)
  - Packages de modèles (ModelPackage)
  - Utilisateurs, Rôles, Permissions
  - Configuration système
  - Métamodèle ArchiMate
  - Stéréotypes et métadonnées
- **OpenSearch 2.11** : *Moteur de recherche*
  - Indexation des éléments
  - Recherche full-text
- **GitHub** : *Versioning Engine* (prévu - Historique, Diff, Blame)

## 🔐 Sécurité & Authentification
- **Auth** : JWT + Passport.js
- **RBAC** : Rôles (Admin, Designer, Contributor, Consumer)
- **API** : Validation DTO (class-validator)

## 🛠️ Démarrage
Utiliser `npm run dev` à la racine pour lancer tous les services (Web + Server).
Assurez-vous que les conteneurs Docker (PostgreSQL, OpenSearch) sont actifs.
