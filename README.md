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
- 🎨 **Interface Moderne** - UI/UX inspirée de Figma
- 🚀 **Performance** - Architecture optimisée avec React Flow
- 🔒 **Sécurisé** - Authentification JWT et RBAC
- 📱 **Responsive** - Fonctionne sur tous les appareils
- 🌐 **Collaboratif** - Édition multi-utilisateurs (roadmap)

## ✨ Fonctionnalités

### Modélisation

- **Palette ArchiMate** - Tous les éléments ArchiMate 3.2 organisés par couche
- **Drag & Drop** - Glissez-déposez des éléments sur le canvas
- **Smart Connectors** - Validation automatique des relations
- **Menu Contextuel** - Actions rapides par clic droit
- **Renommage Élégant** - Dialog moderne pour renommer les éléments

### Gestion

- **Repository** - Organisation hiérarchique des éléments
- **Vues Multiples** - Créez et gérez plusieurs diagrammes
- **Recherche** - Trouvez rapidement vos éléments
- **Dossiers** - Organisez vos modèles

### Édition

- **Double-clic pour Renommer** - Renommage rapide
- **Suppression Intelligente** - Supprimez de la vue ou du repository
- **Undo/Redo** - Annulez vos actions (roadmap)
- **Auto-save** - Sauvegarde automatique (roadmap)

## 🏗️ Architecture

### Stack Technologique

```
┌─────────────────────────────────────────┐
│           Frontend (Next.js)            │
│  - React 18 + TypeScript                │
│  - React Flow (diagramming)             │
│  - Tailwind CSS + shadcn/ui             │
│  - Zustand (state management)           │
└─────────────────────────────────────────┘
                    ↕ HTTP/REST
┌─────────────────────────────────────────┐
│           Backend (NestJS)              │
│  - TypeScript                           │
│  - Prisma ORM                           │
│  - JWT Authentication                   │
│  - Search Service                       │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│         Database (PostgreSQL)           │
│  - Metamodel                            │
│  - Elements & Relations                 │
│  - Views & Packages                     │
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
│   │   │   └── ui/       # Composants UI réutilisables
│   │   └── lib/          # Utilitaires et helpers
│   ├── server/           # Backend NestJS
│   │   └── src/
│   │       ├── model/    # Gestion des modèles
│   │       ├── search/   # Service de recherche
│   │       └── auth/     # Authentification
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
- Backend API: http://localhost:3002
- Documentation: http://localhost:3001

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

1. Cliquez sur "Save View" en haut à droite
2. Donnez un nom à votre vue
3. La vue est sauvegardée et accessible depuis le repository

### Menu Contextuel

Clic droit sur un élément pour :
- **Rename** - Renommer l'élément
- **Remove from View** - Retirer de la vue actuelle
- **Delete from Repository** - Supprimer complètement

## 📚 Documentation

- [Spécifications Techniques](./SPECIFICATIONS.md) - Architecture et implémentation détaillée
- [Guide de Développement](./DEV_GUIDE.md) - Guide pour les développeurs
- [Status d'Implémentation](./IMPLEMENTATION_STATUS.md) - Fonctionnalités implémentées

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

### Version 1.1 (Q1 2026)
- [ ] Collaboration temps réel avec Yjs
- [ ] Export PNG/SVG/PDF
- [ ] Import/Export ArchiMate XML
- [ ] Undo/Redo complet

### Version 1.2 (Q2 2026)
- [ ] Templates de modèles
- [ ] Analyse d'impact
- [ ] Génération de documentation
- [ ] Thèmes personnalisables

### Version 2.0 (Q3 2026)
- [ ] IA pour suggestions
- [ ] Versioning des modèles
- [ ] API publique
- [ ] Plugins système

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
