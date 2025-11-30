# ArchiModeler 🏗️

> Plateforme collaborative de modélisation d'architecture d'entreprise basée sur ArchiMate 3.2

[![Next.js](https://img.shields.io/badge/Next.js-16.0.5-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-Latest-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [Documentation](#-documentation)
- [Contribution](#-contribution)

## 🎯 Vue d'ensemble

ArchiModeler est une application web moderne pour créer, gérer et visualiser des modèles d'architecture d'entreprise conformes au standard ArchiMate 3.2. Elle offre une expérience utilisateur intuitive avec des fonctionnalités avancées de modélisation collaborative.

### Pourquoi ArchiModeler ?

- ✅ **Conforme ArchiMate 3.2** - Respect strict du métamodèle
- 🎨 **Interface Moderne** - UI/UX inspirée de Figma avec support thème sombre
- 🚀 **Performance** - Architecture optimisée avec React Flow
- 🔒 **Sécurisé** - Authentification JWT et RBAC
- 📱 **Responsive** - Fonctionne sur tous les appareils
- 🌐 **Collaboratif** - Édition multi-utilisateurs en temps réel avec chat intégré
- 🌍 **Multilingue** - Support complet de l'internationalisation (i18n) avec français et anglais

## ✨ Fonctionnalités

### Modélisation

- **Palette ArchiMate** - Tous les éléments ArchiMate 3.2 organisés par couche avec symboles SVG officiels
- **Palette Configurable** - Personnalisez les éléments visibles dans la palette via les paramètres admin
- **Drag & Drop** - Glissez-déposez des éléments sur le canvas
- **Smart Connectors** - Validation automatique des relations selon les règles ArchiMate
- **Menu Contextuel** - Actions rapides par clic droit sur les éléments et les dossiers
- **Renommage Élégant** - Dialog moderne pour renommer les éléments
- **Mise en Forme** - Panneau de personnalisation des styles (couleurs, bordures, polices, opacité)
- **Organisation Automatique** - Layouts automatiques (circular, hierarchical, grid, force-directed)

### Gestion

- **Repository** - Organisation hiérarchique des éléments avec dossiers imbriqués
- **Repository Redimensionnable** - Ajustez la largeur du panneau repository selon vos besoins
- **Relations Visibles** - Affichage des relations dans le repository avec leurs types et éléments connectés
- **Miniatures** - Visualisation des objets avec leurs symboles ArchiMate dans le repository
- **Tooltips Informatifs** - Informations détaillées sur les objets au survol
- **Menu Contextuel Dossiers** - Créez des sous-dossiers et des éléments directement depuis le menu contextuel
- **Vues Multiples** - Créez et gérez plusieurs diagrammes avec onglets
- **Recherche** - Trouvez rapidement vos éléments
- **Dossiers** - Organisez vos modèles de manière hiérarchique
- **Duplication de Packages** - Dupliquez un ModelPackage avec toutes ses données (éléments, relations, vues, dossiers)
- **Export/Import** - Exportez et importez des packages complets incluant les relations

### Édition

- **Double-clic pour Renommer** - Renommage rapide des éléments
- **Suppression Intelligente** - Supprimez de la vue ou du repository avec confirmation
- **Sauvegarde des Vues** - Sauvegarde automatique du contenu du canvas (positions, styles, relations)
- **Personnalisation Visuelle** - Personnalisez l'apparence de vos diagrammes (couleurs, styles, opacité)
- **Thème Sombre** - Support complet du thème sombre avec adaptation automatique des couleurs et SVG
- **Undo/Redo** - Annulez vos actions (roadmap)

### Collaboration

- **Édition Temps Réel** - Plusieurs utilisateurs peuvent éditer simultanément la même vue
- **Curseurs Collaboratifs** - Visualisez les curseurs des autres utilisateurs avec leurs noms
- **Utilisateurs Actifs** - Liste des utilisateurs actifs dans le Studio avec leurs noms
- **Chat Direct** - Chat en temps réel entre utilisateurs actifs
- **Notifications de Chat** - Alertes visuelles (toast) pour les nouveaux messages
- **Badge Messages Non Lus** - Indicateur de messages non lus sur les avatars
- **Gestion des Conversations** - Accès rapide aux conversations depuis l'avatar utilisateur
- **Commentaires et Annotations** - Système de commentaires sur les éléments et relations
  - Threads de discussion sur les éléments
  - Mentions d'utilisateurs (@username) avec autocomplétion
  - Annotations visuelles sur le canvas (badges de commentaires)
  - Notifications pour les réponses et mentions
  - Résolution/marquage des commentaires comme résolus
  - Panneau de commentaires repliable dans le panneau des propriétés

### Notifications

- **Centre de Notifications** - Badge avec compteur de notifications non lues
- **Notifications Workflow** - Notifications automatiques pour les change requests (création, soumission, approbation, rejet, publication)
- **Notifications en Temps Réel** - Réception instantanée via WebSocket
- **Gestion des Notifications** - Marquer comme lues, supprimer, tout marquer comme lu

### Internationalisation (i18n)

- **Multilingue** - Support complet de l'internationalisation avec next-intl
- **Langues Disponibles** - Français et Anglais (extensible)
- **Changement de Langue** - Sélection de langue dans les paramètres avec application immédiate
- **Persistance** - La langue est sauvegardée dans le profil utilisateur
- **Interface Traduite** - Toutes les pages principales sont traduites (Studio, Admin, Settings, etc.)
- **Synchronisation** - Synchronisation automatique de la langue entre les sessions

### Système de Dialogues

- **Dialog Context** - Système centralisé de gestion des dialogues
- **AlertDialog** - Dialogues d'alerte pour les confirmations importantes
- **MessageDialog** - Dialogues d'information avec messages personnalisés
- **PromptDialog** - Dialogues de saisie pour les entrées utilisateur
- **API Unifiée** - Hook `useDialog` pour un accès simple et cohérent

## 🏗️ Architecture

### Stack Technologique

```
┌─────────────────────────────────────────┐
│           Frontend (Next.js)            │
│  - React 18 + TypeScript                │
│  - React Flow (diagramming)             │
│  - Tailwind CSS + shadcn/ui             │
│  - Zustand (state management)           │
│  - Socket.io Client (collaboration)     │
│  - next-intl (internationalisation)     │
└─────────────────────────────────────────┘
                    ↕ HTTP/REST + WebSocket
┌─────────────────────────────────────────┐
│           Backend (NestJS)              │
│  - TypeScript                           │
│  - Prisma ORM                           │
│  - JWT Authentication                   │
│  - WebSocket Gateway (Socket.io)        │
│  - Notifications Service                │
│  - Collaboration Service                │
│  - Search Service                       │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│         Database (PostgreSQL)           │
│  - Metamodel                            │
│  - Elements & Relations                 │
│  - Views & Packages                     │
│  - Users & Notifications                │
└─────────────────────────────────────────┘
```

### Structure du Projet

```
archimodeler/
├── apps/
│   ├── web/              # Frontend Next.js
│   │   ├── app/          # Pages (App Router)
│   │   ├── components/   # Composants React
│   │   │   ├── canvas/   # Composants de diagramming
│   │   │   ├── studio/   # Composants du studio
│   │   │   ├── collaboration/ # Chat et collaboration
│   │   │   ├── notifications/ # Centre de notifications
│   │   │   ├── common/   # Composants communs
│   │   │   │   ├── LocaleSwitcher.tsx
│   │   │   │   ├── LocaleSync.tsx
│   │   │   │   ├── AlertDialog.tsx
│   │   │   │   ├── MessageDialog.tsx
│   │   │   │   └── PromptDialog.tsx
│   │   │   └── ui/       # Composants UI réutilisables
│   │   ├── hooks/        # Hooks React personnalisés
│   │   │   └── useDialog.tsx
│   │   ├── contexts/     # Contextes React
│   │   │   └── DialogContext.tsx
│   │   ├── messages/     # Fichiers de traduction i18n
│   │   │   ├── en.json
│   │   │   └── fr.json
│   │   └── lib/          # Utilitaires et helpers
│   ├── server/           # Backend NestJS
│   │   └── src/
│   │       ├── model/    # Gestion des modèles
│   │       ├── search/   # Service de recherche
│   │       ├── auth/     # Authentification
│   │       ├── collaboration/ # WebSocket & collaboration
│   │       ├── notifications/ # Service de notifications
│   │       └── users/    # Gestion des utilisateurs
│   └── docs/             # Documentation
├── packages/
│   ├── database/         # Schéma Prisma
│   ├── types/            # Types TypeScript partagés
│   └── ui/               # Composants UI partagés
└── turbo.json            # Configuration Turborepo
```

## 🚀 Installation

### Prérequis

- Node.js 22.17.0 ou supérieur
- PostgreSQL 14 ou supérieur
- npm ou pnpm

### Étapes

1. **Cloner le repository**
```bash
git clone https://github.com/gloret29/archimodeler.git
cd archimodeler
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer la base de données**

Créez un fichier `.env` dans `packages/database/` :
```env
DATABASE_URL="postgresql://user:password@localhost:5432/archimodeler"
```

4. **Initialiser la base de données**
```bash
cd packages/database
npx prisma generate
npx prisma migrate dev
npx ts-node prisma/seed.ts
cd ../..
```

5. **Lancer l'application**
```bash
npm run dev
```

L'application sera accessible à :
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Documentation Swagger: http://localhost:3001/api

## 📖 Utilisation

### Créer un Élément

1. Glissez un élément depuis la palette (gauche) vers le canvas
2. L'élément est automatiquement créé dans le repository
3. Double-cliquez pour renommer

### Créer une Relation

1. Cliquez sur le point de connexion d'un élément source
2. Glissez vers l'élément cible
3. Si plusieurs relations sont possibles, choisissez dans le menu
4. La relation est créée avec validation ArchiMate

### Sauvegarder une Vue

1. Cliquez sur l'icône "Save" (disquette) en haut à droite
2. Le contenu actuel du canvas (éléments, positions, styles, relations) est sauvegardé
3. La vue est mise à jour et accessible depuis le repository

### Personnaliser l'Apparence

1. Sélectionnez un ou plusieurs éléments sur le canvas
2. Le panneau de mise en forme apparaît automatiquement en bas
3. Personnalisez les couleurs, bordures, polices et opacité
4. Les modifications sont appliquées en temps réel

### Organiser Automatiquement

1. Cliquez sur le bouton "Auto Layout" en haut à droite du canvas
2. Choisissez un algorithme de layout :
   - **Circular** : Disposition en cercle
   - **Hierarchical** : Organisation hiérarchique selon les connexions
   - **Grid** : Disposition en grille régulière
   - **Force-Directed** : Simulation de forces pour une disposition naturelle
3. Les éléments sont automatiquement réorganisés

### Commenter un Élément

1. Sélectionnez un élément ou une relation sur le canvas
2. Le panneau des propriétés s'affiche à droite
3. Cliquez sur l'onglet "Comments" (ou utilisez le panneau repliable)
4. Tapez votre commentaire dans la zone de texte
5. Mentionnez des utilisateurs avec @username (autocomplétion disponible)
6. Cliquez sur "Start Discussion" pour créer un thread
7. Les autres utilisateurs peuvent répondre et être notifiés
8. Les éléments avec commentaires affichent un badge sur le canvas

### Menu Contextuel

**Sur un élément** (clic droit) :
- **Rename** - Renommer l'élément
- **Remove from View** - Retirer de la vue actuelle
- **Delete from Repository** - Supprimer complètement

**Sur un dossier** (clic droit) :
- **New Folder** - Créer un sous-dossier
- **Create ArchiMate Element** - Créer directement un élément dans le dossier (organisé par couche)

## 📚 Documentation

### Pour les Utilisateurs
- [Manuel Utilisateur](./USER_MANUAL.md) - Guide complet pour utiliser ArchiModeler

### Pour les Développeurs
- [Spécifications Techniques](./SPECIFICATIONS.md) - Architecture et implémentation détaillée
- [Guide de Développement](./DEV_GUIDE.md) - Guide pour les développeurs
- [Architecture Technique](./ARCHITECTURE.md) - Vue d'ensemble de l'architecture
- [Status d'Implémentation](./IMPLEMENTATION_STATUS.md) - Fonctionnalités implémentées
- [Internationalisation (i18n)](./docs/I18N.md) - Guide complet de l'internationalisation
- [Guide de Test i18n](./docs/I18N_TEST_GUIDE.md) - Guide de test de l'internationalisation
- [Déploiement Proxmox](./DEPLOY_PROXMOX.md) - Guide de déploiement sur Proxmox
- [Base de Données](./README_DATABASE.md) - Documentation de la base de données
- [Modèle de Données](./DATABASE_MODEL.md) - Documentation détaillée du modèle de données

## 🛠️ Développement

### Commandes Utiles

```bash
# Développement
npm run dev              # Lance tous les services

# Build
npm run build            # Build tous les packages

# Linting
npm run lint             # Lint tous les packages

# Base de données
cd packages/database
npx prisma studio        # Interface graphique Prisma
npx prisma migrate dev   # Créer une migration
npx prisma generate      # Générer le client Prisma
npx prisma migrate deploy # Appliquer les migrations (production)

# Déploiement Proxmox
chmod +x scripts/deploy-proxmox.sh
./scripts/deploy-proxmox.sh [container-id] [container-name]
```

### Tests

```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Conventions

- **Commits** : Utilisez les [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` - Nouvelle fonctionnalité
  - `fix:` - Correction de bug
  - `docs:` - Documentation
  - `style:` - Formatage
  - `refactor:` - Refactoring
  - `test:` - Tests
  - `chore:` - Maintenance

- **Code** : Suivez les règles ESLint du projet
- **TypeScript** : Utilisez des types stricts

## 🗺️ Roadmap
(Voir [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) pour le suivi détaillé)

### Phase 1 : Architecture & Données (Terminé)
- [x] Gestion des relations PostgreSQL
- [x] Système de packages de modèles (ModelPackage)
- [x] Isolation des données par package
- [ ] Versioning via GitHub
- [ ] Système de Backup & Export

### Phase 2 : Administration & Utilisateurs (Terminé)
- [x] Page d'administration (Utilisateurs, Rôles, Paramètres)
- [x] Gestion des packages de modèles
- [x] Duplication de packages avec toutes les données
- [x] Configuration de la palette
- [x] Gestion des stéréotypes
- [x] Système de notifications (Phase 15.2)
- [ ] Dashboard personnalisé

### Phase 3 : Modélisation Avancée (Terminé)
- [x] Édition multi-onglets
- [x] Collaboration temps réel avec curseurs
- [x] Chat collaboratif entre utilisateurs actifs
- [x] Commentaires et annotations sur les éléments
- [x] Mentions d'utilisateurs dans les commentaires
- [x] Affichage des relations dans le repository
- [x] Export/Import des relations
- [x] Support thème sombre complet
- [x] Stéréotypes & Propriétés étendues
- [x] Indicateur de modification des vues

### Phase 4 : Analyse
- [ ] Analyse de graphe (PostgreSQL)
- [ ] Visualisation avancée des impacts

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

- **Gaël Loret** - Développeur Principal - [@gloret29](https://github.com/gloret29)

## 🙏 Remerciements

- [ArchiMate®](https://www.opengroup.org/archimate-forum) - The Open Group
- [React Flow](https://reactflow.dev/) - Diagramming library
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Prisma](https://www.prisma.io/) - ORM
- [NestJS](https://nestjs.com/) - Backend framework

## 📞 Support

- 📧 Email: support@archimodeler.com
- 💬 Discord: [Rejoindre notre serveur](https://discord.gg/archimodeler)
- 🐛 Issues: [GitHub Issues](https://github.com/gloret29/archimodeler/issues)

---

**Fait avec ❤️ par l'équipe ArchiModeler**
