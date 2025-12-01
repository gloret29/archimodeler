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
  - [x] Authentification locale (email/password)
  - [ ] Authentification SAML 2.0
    - [x] Stratégie SAML (SamlStrategy) - Structure de base
    - [ ] Configuration dynamique SAML (variables d'environnement)
    - [ ] Endpoints SAML dans AuthController (`/auth/saml`, `/auth/saml/callback`)
    - [ ] Intégration de la stratégie SAML dans AuthModule
    - [ ] Gestion de la création automatique d'utilisateurs depuis SAML
    - [ ] Mapping des attributs SAML vers les rôles utilisateur
    - [ ] Interface frontend pour le bouton de connexion SAML
    - [ ] Support de multiples IdP (Identity Providers)
    - [ ] Documentation de configuration SAML

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
  - [x] Suppression des vues (Non-destructive pour les éléments)
  - [x] Confirmation contextuelle (Popover) pour suppression

## ✅ Phase 9 : Infrastructure Hybride et Administration (Terminé)

### 9.1 Gestion des Relations
**Statut**: 🟢 **Terminé**
- [x] ~~Installer et configurer Neo4j (docker-compose)~~ (Migré vers PostgreSQL)
- [x] ~~Créer un module Neo4j dans le backend~~ (Remplacé par service Prisma)
- [x] Créer un service pour gérer les relations (CRUD) - Basé sur PostgreSQL/Prisma
- [x] Adapter les endpoints existants pour utiliser PostgreSQL pour les relations
- [x] Migration complète de Neo4j vers PostgreSQL (Relations stockées dans le modèle Relationship)
- [x] Suppression des dépendances Neo4j

### 9.2 Page d'Administration
**Statut**: 🟢 **Terminé**
- [x] Créer la route `/admin` protégée (Role Admin)
- [x] Interface de gestion des paramètres globaux
- [x] Configuration des connecteurs (GitHub)

## ✅ Phase 10 : Personnalisation (Terminé)

### 10.1 Expérience Utilisateur
**Statut**: 🟢 **Terminé**
- [x] Paramètres utilisateur (Profil, Préférences)
- [x] Thème (Sombre/Clair)
- [x] Internationalisation (i18n)
  - [x] Configuration next-intl
  - [x] Fichiers de traduction (EN/FR)
  - [x] Mise à jour des pages (Studio, Settings, Profile, Appearance, Admin, Dashboard, Home)
  - [x] Page de sélection de langue
  - [x] Changement de langue en temps réel
  - [x] Composant LocaleSwitcher
  - [x] Composant LocaleSync pour synchronisation avec le backend
  - [x] Migration de base de données pour stocker la locale utilisateur
  - [x] Persistance de la langue dans le profil utilisateur
  - [x] Routes avec locale (`/en/*`, `/fr/*`)
  - [x] Navigation i18n-aware
- [x] Système de Dialogues
  - [x] DialogContext pour gestion centralisée
  - [x] Hook useDialog pour API unifiée
  - [x] Composants AlertDialog, MessageDialog, PromptDialog
  - [x] Intégration dans tous les composants nécessaires
  - [x] Support i18n dans les dialogues

### 10.2 Accessibilité
**Statut**: 🟢 **Terminé**
- [x] Navigation au clavier
  - [x] Composant "Skip to content" pour navigation rapide
  - [x] Hooks pour gestion des raccourcis clavier (useKeyboardNavigation, useKeyboardShortcuts)
  - [x] Navigation Tab/Shift+Tab dans tous les composants interactifs
  - [x] Support des flèches haut/bas pour navigation dans les listes
  - [x] Raccourcis clavier globaux (Enter, Escape, Home, End)
- [x] Support lecteur d'écran
  - [x] Composant LiveRegion pour annonces aux lecteurs d'écran
  - [x] Attributs ARIA (aria-label, aria-describedby, roles, aria-live)
  - [x] Attributs ARIA sur les formulaires (aria-required, aria-invalid)
  - [x] Rôles sémantiques (main, navigation, banner, list, listitem)
  - [x] Support des régions live (polite, assertive)
- [x] Contraste et lisibilité
  - [x] Classes utilitaires pour contraste élevé (prefers-contrast: high)
  - [x] Support du mode réduit de mouvement (prefers-reduced-motion)
  - [x] Styles de focus visibles pour navigation clavier
  - [x] Tailles de cible tactiles minimales (44x44px)
  - [x] Classes sr-only pour contenu accessible uniquement aux lecteurs d'écran

## ✅ Phase 11 : Collaboration Temps Réel (Terminé)

### 11.1 Système d'Onglets Multiples
**Statut**: 🟢 **Terminé**
- [x] Store Zustand pour gérer les onglets
- [x] Composant ViewTabs pour afficher les onglets
- [x] Ouvrir plusieurs vues simultanément
- [x] Basculer entre les vues
- [x] Fermer des onglets individuels
- [x] Créer de nouvelles vues

### 11.2 WebSocket et Collaboration
**Statut**: 🟢 **Terminé**
- [x] Gateway WebSocket NestJS
- [x] Module de collaboration backend
- [x] Hook useCollaboration frontend
- [x] Gestion des sessions par vue
- [x] Broadcasting des événements

### 11.3 Indicateurs de Présence
**Statut**: 🟢 **Terminé**
- [x] Curseurs collaboratifs colorés
- [x] Affichage des noms d'utilisateurs
- [x] Liste des utilisateurs actifs
- [x] Indicateur de connexion
- [x] Badge de nombre d'utilisateurs

### 11.4 Synchronisation (Partielle)
**Statut**: 🟢 **Terminé**
- [x] Infrastructure de synchronisation
- [x] Événements de curseur
- [x] Synchronisation complète des nœuds
- [x] Synchronisation complète des relations
- [ ] Gestion des conflits (OT/CRDT)
- [x] Sélection collaborative
- [x] Verrouillage d'éléments (Lock sur sélection distante)

### 11.5 Conformité et Qualité
**Statut**: 🟢 **Terminé**
- [x] Styles visuels stricts ArchiMate 3.2 (Formes arrondies/carrées selon le type)
- [x] Prévention des doublons de relations
- [x] Validation temps réel (Drag & Drop)

### 11.6 Chat et Communication
**Statut**: 🟢 **Terminé**
- [x] Système de chat en temps réel entre utilisateurs
- [x] Interface de chat dans la liste des utilisateurs actifs
- [x] Notifications toast pour les nouveaux messages
- [x] Pastille sur l'avatar de l'utilisateur connecté pour les messages non lus
- [x] Liste des conversations dans le menu utilisateur
- [x] Ouverture du chat depuis le menu utilisateur
- [x] Compteur de messages non lus par utilisateur
- [x] Enregistrement des expéditeurs de messages pour la liste des conversations

## 🔴 Phase 11.7 : Améliorations Collaboration (À faire)

### 11.7.1 Gestion des Conflits
**Statut**: 🔴 **À faire**
- [ ] Implémentation OT (Operational Transform) ou CRDT pour la résolution de conflits
- [ ] Détection automatique des modifications simultanées
- [ ] Résolution intelligente des conflits (merge automatique quand possible)
- [ ] Interface de résolution manuelle des conflits
- [ ] Historique des opérations pour le rollback

### 11.7.2 Commentaires et Annotations
**Statut**: 🟢 **Terminé**
- [x] Système de commentaires sur les éléments et relations
- [x] Annotations visuelles sur le canvas (badges de commentaires)
- [x] Threads de discussion sur les éléments
- [x] Mentions d'utilisateurs dans les commentaires (@username)
- [x] Notifications pour les réponses aux commentaires
- [x] Notifications pour les mentions dans les commentaires
- [x] Résolution/marquage des commentaires comme résolus
- [x] Panneau de commentaires repliable dans PropertiesPanel
- [x] Mises à jour en temps réel via WebSocket

### 11.7.3 Partage et Permissions
**Statut**: 🔴 **À faire**
- [ ] Partage de vues avec permissions granulaires (lecture seule, édition, commentaire)
- [ ] Liens de partage avec expiration
- [ ] Invitations par email pour rejoindre une vue
- [ ] Gestion des accès par rôle ou utilisateur spécifique
- [ ] Mode "présentation" pour les vues partagées

### 11.7.4 Présence Avancée
**Statut**: 🔴 **À faire**
- [ ] Indicateur de ce que fait l'utilisateur (édition, sélection, navigation)
- [ ] Zone de focus visible (ce que l'utilisateur regarde)
- [ ] Indicateur de modification en temps réel (élément en cours d'édition)
- [ ] Statut de disponibilité (disponible, occupé, absent)
- [ ] Historique de présence dans une vue

### 11.7.5 Historique et Versioning Collaboratif
**Statut**: 🔴 **À faire**
- [ ] Historique des modifications collaboratives (qui a fait quoi et quand)
- [ ] Timeline des changements dans une vue
- [ ] Annulation/Refaire collaboratif (undo/redo partagé)
- [ ] Points de restauration (snapshots) collaboratifs
- [ ] Comparaison de versions (diff visuel)

### 11.7.6 Améliorations du Chat
**Statut**: 🔴 **À faire**
- [ ] Mentions d'utilisateurs dans le chat (@username)
- [ ] Réactions aux messages (emoji)
- [ ] Partage de fichiers/images dans le chat
- [ ] Historique des conversations persistantes
- [ ] Recherche dans les conversations
- [ ] Chat de groupe (plusieurs utilisateurs)
- [ ] Partage de liens vers des éléments/vues dans le chat
- [ ] Prévisualisation des éléments partagés dans le chat

### 11.7.7 Sessions de Travail
**Statut**: 🔴 **À faire**
- [ ] Création de "salles de travail" collaboratives
- [ ] Invitation à rejoindre une session de travail
- [ ] Enregistrement des sessions (replay)
- [ ] Partage d'écran ou de vue spécifique
- [ ] Mode "suivre" un utilisateur (caméra collaborative)
- [ ] Notes de session partagées

### 11.7.8 Notifications Collaboratives
**Statut**: 🔴 **À faire**
- [ ] Notifications pour les modifications importantes (création/suppression d'éléments)
- [x] Notifications pour les mentions dans les commentaires (déjà implémenté dans 11.7.2)
- [ ] Notifications pour les invitations à collaborer
- [ ] Préférences de notification par utilisateur
- [ ] Notifications push (si supporté par le navigateur)
- [ ] Résumé quotidien/hebdomadaire des activités collaboratives

### 11.7.9 Performance et Optimisation
**Statut**: 🔴 **À faire**
- [ ] Optimisation de la synchronisation pour de grandes vues (debouncing, throttling)
- [ ] Compression des données WebSocket
- [ ] Gestion des reconnexions automatiques avec récupération d'état
- [ ] Cache local pour réduire la charge serveur
- [ ] Limitation du nombre d'utilisateurs simultanés par vue (si nécessaire)
- [ ] Métriques de performance collaborative

## ✅ Phase 12 : Améliorations Interface et Expérience Utilisateur (Terminé)

### 12.1 Symboles ArchiMate Officiels
**Statut**: 🟢 **Terminé**
- [x] Intégration des symboles SVG officiels ArchiMate
- [x] Remplacement des icônes génériques par les symboles officiels
- [x] Affichage des symboles dans le canvas et la palette
- [x] Support de tous les types d'éléments ArchiMate

### 12.2 Amélioration du Repository
**Statut**: 🟢 **Terminé**
- [x] Redimensionnement du panneau repository
- [x] Affichage des miniatures avec symboles ArchiMate
- [x] Tooltips informatifs sur les objets (type, catégorie)
- [x] Menu contextuel sur les dossiers (création de sous-dossiers et éléments)
- [x] Correction de l'affichage des objets dans les dossiers imbriqués
- [x] Filtrage correct des éléments non catégorisés

### 12.3 Configuration de la Palette
**Statut**: 🟢 **Terminé**
- [x] Page de configuration admin pour la palette
- [x] Cases à cocher pour activer/désactiver les types d'objets
- [x] Filtrage dynamique de la palette selon la configuration
- [x] Sauvegarde de la configuration dans les paramètres système

### 12.4 Mise en Forme des Diagrammes
**Statut**: 🟢 **Terminé**
- [x] Panneau de mise en forme pour les éléments sélectionnés
- [x] Personnalisation des couleurs (fond, bordure, texte)
- [x] Personnalisation des bordures (largeur)
- [x] Personnalisation des polices (taille, couleur)
- [x] Contrôle de l'opacité
- [x] Personnalisation des arêtes (couleur, largeur, style de ligne)
- [x] Application en temps réel des modifications

### 12.5 Organisation Automatique
**Statut**: 🟢 **Terminé**
- [x] Système d'organisation automatique des objets
- [x] Layout Circular (disposition en cercle)
- [x] Layout Hierarchical (organisation hiérarchique)
- [x] Layout Grid (disposition en grille)
- [x] Layout Force-Directed (simulation de forces)
- [x] Interface utilisateur pour sélectionner le layout

### 12.6 Sauvegarde des Vues
**Statut**: 🟢 **Terminé**
- [x] Correction de la sauvegarde du contenu actuel du canvas
- [x] Récupération automatique des nodes et edges
- [x] Nettoyage des propriétés temporaires avant sauvegarde
- [x] Sauvegarde des positions, styles et relations
- [x] Amélioration du feedback utilisateur

## ✅ Phase 13 : Stéréotypes et Métadonnées (Terminé)

### 13.1 Système de Stéréotypes
**Statut**: 🟢 **Terminé**
- [x] Modèle de données pour Stéréotypes (Objets & Relations)
- [x] Interface d'administration des stéréotypes
- [x] Propriétés étendues dynamiques
- [x] Application de stéréotypes aux éléments et relations
- [x] Panneau de gestion des stéréotypes dans le canvas
- [x] Attribution de stéréotypes à des types d'objets/relations spécifiques
- [x] Interface de création d'attributs pour les stéréotypes (tableau avec types)

## ✅ Phase 13.5 : Packages de Modèles et Isolation (Terminé)

### 13.5.1 Système de Packages
**Statut**: 🟢 **Terminé**
- [x] Modèle de données ModelPackage
- [x] Isolation des éléments, relations, vues et dossiers par package
- [x] Sélection de package lors de l'ouverture du studio
- [x] Filtrage automatique du repository par package
- [x] Gestion des packages dans l'administration (création, modification, suppression)
- [x] Indicateur visuel de modification dans les onglets (point orange)
- [x] Documentation Swagger de l'API

## 🔴 Phase 14 : Versioning (À faire)

### 14.1 Intégration GitHub
- [ ] Configuration du dépôt cible
- [ ] Service de synchronisation Octokit
- [ ] Mapping Modèle <-> Fichiers

### 14.2 Workflow de Versioning
- [ ] Historique des modifications (Objets & Vues)
- [ ] Actions Commit / Rollback
- [ ] Visualisation des diffs

## 🔴 Phase 15 : Analyse Avancée (À faire)

### 15.1 Analyse de Graphe
- [ ] Page d'exploration de graphe "No-Code" (basée sur PostgreSQL)
- [ ] Filtres et visualisations avancées
- [ ] Requêtes de parcours de relations

### 15.2 Notifications
**Statut**: 🟢 **Terminé**
- [x] Système de notifications global
  - [x] Modèle de données Notification (Prisma)
  - [x] Service de notifications backend (CRUD)
  - [x] API REST pour les notifications
  - [x] Intégration WebSocket pour notifications en temps réel
  - [x] Notifications automatiques pour les change requests (création, approbation, rejet, publication)
- [x] Centre de notifications utilisateur
  - [x] Composant NotificationCenter avec badge de compteur
  - [x] Affichage des notifications avec filtres (lues/non lues)
  - [x] Actions: marquer comme lue, supprimer, marquer tout comme lu
  - [x] Intégration dans la page d'accueil
  - [x] Support multilingue (FR/EN)

## 🔴 Phase 16 : Export et Sécurité (À faire)

### 16.1 Export des Vues
- [ ] Export Images (PNG, SVG)
  - [ ] Résolution des problèmes de compatibilité avec html2canvas et les fonctions de couleur CSS modernes (lab(), oklch())
  - [ ] Export PNG haute qualité
  - [ ] Export SVG avec symboles ArchiMate intégrés
- [ ] Export vers le presse-papiers (Clipboard)
- [ ] Export PDF
- [ ] Export Données (JSON, XML, ArchiMate XML)

### 16.2 Backup et Maintenance
- [ ] Backup automatisé PostgreSQL
- [ ] Suppression non-destructive (Soft Delete)

### 16.3 Authentification SAML 2.0 Complète
**Statut**: 🟡 **Partiellement implémenté**
- [x] Stratégie SAML de base (SamlStrategy)
- [ ] Configuration complète SAML
  - [ ] Variables d'environnement pour la configuration SAML (entryPoint, issuer, cert, etc.)
  - [ ] Support de la configuration via l'interface d'administration
  - [ ] Validation de la configuration SAML
- [ ] Endpoints backend
  - [ ] `GET /auth/saml` - Initie l'authentification SAML
  - [ ] `POST /auth/saml/callback` - Gère le callback après authentification
  - [ ] Gestion des erreurs d'authentification SAML
- [ ] Intégration utilisateur
  - [ ] Création automatique d'utilisateurs depuis le profil SAML
  - [ ] Synchronisation des attributs utilisateur (email, nom, etc.)
  - [ ] Mapping des groupes/rôles SAML vers les rôles ArchiModeler
  - [ ] Mise à jour des utilisateurs existants lors de la connexion SAML
- [ ] Interface frontend
  - [ ] Bouton "Se connecter avec SAML" sur la page de connexion
  - [ ] Gestion du retour après authentification SAML
  - [ ] Messages d'erreur pour les échecs d'authentification SAML
  - [ ] Support de multiples IdP (sélection du fournisseur d'identité)
- [ ] Documentation
  - [ ] Guide de configuration SAML pour les administrateurs
  - [ ] Documentation des attributs SAML requis
  - [ ] Exemples de configuration pour différents IdP (Azure AD, Okta, etc.)
