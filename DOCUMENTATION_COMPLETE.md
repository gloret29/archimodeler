# Documentation Complète ArchiModeler

> Documentation exhaustive de toutes les fonctionnalités, du modèle de données et des technologies utilisées

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Fonctionnalités Complètes](#fonctionnalités-complètes)
3. [Modèle de Données Détaillé](#modèle-de-données-détaillé)
4. [Technologies Utilisées](#technologies-utilisées)
5. [Architecture Technique](#architecture-technique)

---

## Vue d'ensemble

ArchiModeler est une plateforme collaborative de modélisation d'architecture d'entreprise basée sur le standard **ArchiMate 3.2**. L'application permet de créer, gérer, visualiser et collaborer sur des modèles d'architecture complexes avec une interface moderne inspirée de Figma.

### Caractéristiques Principales

- ✅ **Conforme ArchiMate 3.2** - Respect strict du métamodèle
- 🎨 **Interface Moderne** - UI/UX inspirée de Figma avec support thème sombre
- 🚀 **Performance** - Architecture optimisée avec React Flow
- 🔒 **Sécurisé** - Authentification JWT et RBAC
- 📱 **Responsive** - Fonctionne sur tous les appareils
- 🌐 **Collaboratif** - Édition multi-utilisateurs en temps réel avec chat intégré
- 🌍 **Multilingue** - Support complet de l'internationalisation (i18n) avec français et anglais

---

## Fonctionnalités Complètes

### 1. Modélisation ArchiMate

#### 1.1 Palette d'Éléments
- **Palette ArchiMate Complète** : Tous les éléments ArchiMate 3.2 organisés par couche (Business, Application, Technology, Physical, Motivation, Strategy, Implementation & Migration)
- **Palette Configurable** : Personnalisation des éléments visibles dans la palette via les paramètres admin
- **Symboles SVG Officiels** : Intégration des symboles SVG officiels ArchiMate pour tous les types d'éléments
- **Organisation par Catégories** : Éléments organisés par couche avec recherche et filtrage
- **Drag & Drop** : Glisser-déposer des éléments depuis la palette vers le canvas

#### 1.2 Création et Gestion d'Éléments
- **Création Multiple** : 
  - Glisser-déposer depuis la palette
  - Menu contextuel sur les dossiers
  - Création directe dans le repository
- **Renommage Élégant** : Dialog moderne pour renommer les éléments (double-clic ou menu contextuel)
- **Documentation** : Ajout de documentation textuelle pour chaque élément
- **Propriétés Étendues** : Support des propriétés JSONB pour données flexibles
- **Versioning Temporel** : Système de versioning (Time Travel) avec `validFrom` et `validTo`

#### 1.3 Relations ArchiMate
- **Smart Connectors** : Validation automatique des relations selon les règles ArchiMate
- **Menu de Sélection** : Menu contextuel "Quick Create" lors de la création de relations
- **Relations Dérivées** : Support des relations dérivées selon le standard
- **Validation en Temps Réel** : Validation lors du drag & drop
- **Prévention des Doublons** : Interdiction de créer des doublons de relations de même type entre deux mêmes objets
- **Affichage dans Repository** : Visualisation des relations dans le repository avec leurs types et éléments connectés

#### 1.4 Vues et Diagrammes
- **Vues Multiples** : Création et gestion de plusieurs diagrammes avec onglets
- **Sauvegarde des Vues** : Sauvegarde automatique du contenu du canvas (positions, styles, relations)
- **Sauvegarde Sous** : Création de nouvelles vues à partir d'une vue existante
- **Indicateur de Modification** : Point orange sur les onglets pour les vues modifiées non sauvegardées
- **Contenu JSONB** : Stockage flexible du layout (nodes, edges, positions, styles)

### 2. Organisation et Gestion

#### 2.1 Repository
- **Organisation Hiérarchique** : Organisation des éléments avec dossiers imbriqués
- **Repository Redimensionnable** : Ajustement de la largeur du panneau repository
- **Miniatures** : Visualisation des objets avec leurs symboles ArchiMate dans le repository
- **Tooltips Informatifs** : Informations détaillées sur les objets au survol (type, catégorie)
- **Menu Contextuel Dossiers** : Création de sous-dossiers et d'éléments directement depuis le menu contextuel
- **Affichage des Relations** : Relations visibles dans le repository avec leurs types et éléments connectés

#### 2.2 Packages de Modèles
- **Isolation par Package** : Tous les éléments, relations, vues et dossiers isolés par package
- **Sélection de Package** : Sélection de package lors de l'ouverture du studio
- **Filtrage Automatique** : Filtrage automatique du repository par package
- **Gestion dans Admin** : Création, modification, suppression de packages dans l'administration
- **Duplication de Packages** : Duplication d'un ModelPackage avec toutes ses données (éléments, relations, vues, dossiers)
- **Export/Import** : Export et import de packages complets incluant les relations

#### 2.3 Recherche
- **Recherche Full-Text** : Recherche dans les éléments via OpenSearch
- **Recherche dans Repository** : Recherche rapide dans le repository
- **Filtrage** : Filtrage par type, catégorie, dossier

### 3. Personnalisation Visuelle

#### 3.1 Mise en Forme
- **Panneau de Mise en Forme** : Panneau pour personnaliser les styles des éléments sélectionnés
- **Couleurs** : Personnalisation des couleurs (fond, bordure, texte)
- **Bordures** : Contrôle de la largeur des bordures
- **Polices** : Personnalisation des polices (taille, couleur)
- **Opacité** : Contrôle de l'opacité des éléments
- **Arêtes** : Personnalisation des arêtes (couleur, largeur, style de ligne) pour les relations
- **Application en Temps Réel** : Modifications appliquées instantanément

#### 3.2 Organisation Automatique
- **Layout Circular** : Disposition en cercle des éléments
- **Layout Hierarchical** : Organisation hiérarchique selon les connexions
- **Layout Grid** : Disposition en grille régulière
- **Layout Force-Directed** : Simulation de forces pour une disposition naturelle
- **Interface de Sélection** : Interface utilisateur pour sélectionner le layout

#### 3.3 Thème Sombre
- **Support Complet** : Support complet du thème sombre avec adaptation automatique
- **Adaptation des Couleurs** : Adaptation automatique des couleurs et SVG
- **Persistance** : Préférence de thème sauvegardée dans le profil utilisateur

### 4. Collaboration Temps Réel

#### 4.1 Édition Collaborative
- **Édition Concurrente** : Plusieurs utilisateurs peuvent éditer simultanément la même vue
- **Synchronisation** : Synchronisation complète des nœuds et relations en temps réel
- **Curseurs Collaboratifs** : Visualisation des curseurs des autres utilisateurs avec leurs noms et couleurs
- **Utilisateurs Actifs** : Liste des utilisateurs actifs dans le Studio avec leurs noms
- **Badge de Connexion** : Indicateur de connexion avec nombre d'utilisateurs actifs
- **Sélection Collaborative** : Synchronisation des sélections entre utilisateurs
- **Verrouillage d'Éléments** : Verrouillage visuel sur sélection distante

#### 4.2 Chat et Communication
- **Chat Direct** : Chat en temps réel entre utilisateurs actifs
- **Interface de Chat** : Interface de chat dans la liste des utilisateurs actifs
- **Notifications Toast** : Alertes visuelles (toast) pour les nouveaux messages
- **Badge Messages Non Lus** : Pastille sur l'avatar de l'utilisateur connecté pour les messages non lus
- **Liste des Conversations** : Accès rapide aux conversations depuis l'avatar utilisateur
- **Ouverture du Chat** : Ouverture du chat depuis le menu utilisateur
- **Compteur de Messages** : Compteur de messages non lus par utilisateur
- **Historique des Conversations** : Enregistrement des expéditeurs de messages pour la liste des conversations

#### 4.3 Commentaires et Annotations
- **Système de Commentaires** : Commentaires sur les éléments, relations et vues
- **Threads de Discussion** : Threads de discussion avec réponses imbriquées
- **Mentions d'Utilisateurs** : Mentions d'utilisateurs (@username) avec autocomplétion
- **Annotations Visuelles** : Badges de commentaires sur le canvas (position X/Y)
- **Notifications Automatiques** : Notifications pour les réponses et mentions
- **Résolution de Threads** : Marquage des commentaires comme résolus
- **Panneau Repliable** : Panneau de commentaires repliable dans le panneau des propriétés
- **Mises à Jour Temps Réel** : Mises à jour en temps réel via WebSocket
- **Soft Delete** : Suppression douce des commentaires (champ `deletedAt`)

### 5. Notifications

#### 5.1 Centre de Notifications
- **Badge de Compteur** : Badge avec compteur de notifications non lues
- **Affichage des Notifications** : Liste des notifications avec filtres (lues/non lues)
- **Actions** : Marquer comme lue, supprimer, marquer tout comme lu
- **Intégration** : Intégration dans la page d'accueil
- **Support Multilingue** : Support multilingue (FR/EN)

#### 5.2 Types de Notifications
- **Change Requests** : Notifications automatiques pour les change requests (création, soumission, approbation, rejet, publication)
- **Commentaires** : Notifications pour les mentions dans les commentaires et les réponses
- **Éléments** : Notifications pour création/modification d'éléments
- **Relations** : Notifications pour création de relations
- **Vues** : Notifications pour création/modification de vues
- **Système** : Alertes système
- **Collaboration** : Invitations à collaborer
- **Chat** : Messages de chat reçus

#### 5.3 Notifications Temps Réel
- **WebSocket** : Réception instantanée via WebSocket
- **Sévérité** : Niveaux de sévérité (INFO, WARNING, ERROR, SUCCESS)
- **Métadonnées** : Métadonnées optionnelles pour lier aux entités (changeRequestId, elementId, viewId, threadId, commentId)

### 6. Workflow et Gouvernance

#### 6.1 Change Requests
- **Création** : Création de demandes de changement pour un package de modèle
- **Soumission** : Soumission pour révision
- **Approbation/Rejet** : Approbation ou rejet par un reviewer
- **Publication** : Publication des changements approuvés
- **Statuts** : Machine à états (DRAFT, IN_REVIEW, APPROVED, PUBLISHED, ARCHIVED)
- **Notifications** : Notifications automatiques pour chaque étape

#### 6.2 Règles de Qualité
- **Moteur de Règles** : Moteur de règles de qualité pour valider les modèles
- **Interface de Revue** : Interface de révision des modèles

### 7. Stéréotypes et Métadonnées

#### 7.1 Système de Stéréotypes
- **Définition de Stéréotypes** : Création de stéréotypes pour les objets et relations
- **Propriétés Étendues** : Définition de propriétés étendues dynamiques via schéma JSON
- **Application aux Types** : Attribution de stéréotypes à des types d'objets/relations spécifiques
- **Application aux Instances** : Application de stéréotypes aux éléments et relations
- **Panneau de Gestion** : Panneau de gestion des stéréotypes dans le canvas
- **Interface de Création** : Interface de création d'attributs pour les stéréotypes (tableau avec types)

#### 7.2 Propriétés Étendues
- **Schéma JSON** : Schéma JSON pour validation des propriétés étendues
- **Types de Données** : Support de différents types de données (string, number, enum, etc.)
- **Validation** : Validation automatique selon le schéma

### 8. Administration

#### 8.1 Gestion des Utilisateurs
- **CRUD Complet** : Création, lecture, mise à jour, suppression d'utilisateurs
- **Assignation de Rôles** : Gestion des rôles utilisateurs
- **Gestion des Groupes** : Création et gestion de groupes d'utilisateurs

#### 8.2 Gestion des Rôles et Permissions
- **Création de Rôles** : Création de rôles personnalisés
- **Gestion des Permissions** : Gestion des permissions par rôle
- **Rôles Standards** : Consumer, Contributor, Designer, Lead Designer, System Administrator

#### 8.3 Configuration Système
- **Paramètres Globaux** : Configuration des paramètres système
- **Configuration GitHub** : Paramétrage du dépôt GitHub pour le versioning (prévu)
- **Configuration Connecteurs** : Configuration des connecteurs (ServiceNow, etc.)
- **Configuration Palette** : Configuration de la palette ArchiMate

#### 8.4 Gestion des Packages
- **CRUD Packages** : Création, modification, suppression de packages
- **Duplication** : Duplication de packages avec toutes les données

### 9. Internationalisation (i18n)

#### 9.1 Support Multilingue
- **Langues Disponibles** : Français et Anglais (extensible)
- **Changement de Langue** : Sélection de langue dans les paramètres avec application immédiate
- **Persistance** : La langue est sauvegardée dans le profil utilisateur
- **Interface Traduite** : Toutes les pages principales sont traduites (Studio, Admin, Settings, etc.)
- **Synchronisation** : Synchronisation automatique de la langue entre les sessions

#### 9.2 Composants i18n
- **LocaleSwitcher** : Composant de sélection de langue
- **LocaleSync** : Composant de synchronisation avec le backend
- **Routes avec Locale** : Routes avec locale (`/en/*`, `/fr/*`)
- **Navigation i18n-aware** : Navigation consciente de la locale

### 10. Système de Dialogues

#### 10.1 Dialog Context
- **Système Centralisé** : Système centralisé de gestion des dialogues
- **Hook useDialog** : Hook `useDialog` pour un accès simple et cohérent
- **Support i18n** : Support i18n intégré dans tous les dialogues

#### 10.2 Types de Dialogues
- **AlertDialog** : Dialogues d'alerte pour les confirmations importantes
- **MessageDialog** : Dialogues d'information avec messages personnalisés
- **PromptDialog** : Dialogues de saisie pour les entrées utilisateur

### 11. Intelligence Artificielle

#### 11.1 Diagram Describer
- **Description Automatique** : Génération automatique de descriptions de diagrammes
- **Analyse de Modèles** : Analyse des modèles ArchiMate avec identification des flux de données, dépendances critiques et risques potentiels
- **Intégration OpenAI** : Utilisation de GPT-4-turbo pour l'analyse (avec fallback mock si API key non configurée)

#### 11.2 Coach Chatbot
- **Assistant IA** : Chatbot coach pour questions sur ArchiMate et modélisation
- **RAG (prévu)** : Système RAG pour réponses basées sur la documentation (prévu)
- **Intégration OpenAI** : Utilisation de GPT-4-turbo pour les réponses

### 12. Scripting et Automatisation

#### 12.1 Moteur de Scripting
- **DSL (Domain Specific Language)** : Langage spécifique pour manipulation de modèles
- **Sandbox VM2** : Exécution sécurisée dans un environnement sandboxé
- **Timeout** : Timeout de 5 secondes pour les scripts
- **API Model** : API pour rechercher, créer, mettre à jour des éléments
- **API Relations** : API pour récupérer les relations d'un élément

#### 12.2 Fonctionnalités DSL
- **Recherche d'Éléments** : `model.findAll(type)` pour rechercher tous les éléments d'un type
- **Recherche par ID** : `model.findById(id)` pour récupérer un élément avec ses relations
- **Création** : `model.create(data)` pour créer un nouvel élément
- **Mise à Jour** : `model.update(id, data)` pour mettre à jour un élément
- **Relations** : `element.getRelations(elementId, relationType?)` pour récupérer les relations

### 13. Connecteurs et Intégration

#### 13.1 Connecteurs de Données
- **ServiceNow** : Connecteur ServiceNow pour synchronisation de données
- **BizDesign** : Connecteur BizDesign pour import de modèles
- **API REST** : API REST "Open API" pour intégrations externes

#### 13.2 Sources de Données Externes
- **Configuration** : Configuration de sources de données (URL, credentials, mapping)
- **Synchronisation** : Synchronisation automatique selon planning (cron)
- **Mapping** : Configuration de mapping des colonnes
- **Éléments Externes** : Liaison d'éléments à des sources de données externes

### 14. Recherche

#### 14.1 OpenSearch
- **Indexation** : Indexation des éléments dans OpenSearch
- **Recherche Full-Text** : Recherche full-text dans les éléments
- **Dashboard** : Recherche avec résultats pour dashboard

### 15. Accessibilité

#### 15.1 Navigation Clavier
- **Skip to Content** : Composant "Skip to content" pour navigation rapide
- **Raccourcis Clavier** : Hooks pour gestion des raccourcis clavier
- **Navigation Tab** : Navigation Tab/Shift+Tab dans tous les composants interactifs
- **Flèches** : Support des flèches haut/bas pour navigation dans les listes
- **Raccourcis Globaux** : Raccourcis clavier globaux (Enter, Escape, Home, End)

#### 15.2 Support Lecteur d'Écran
- **LiveRegion** : Composant LiveRegion pour annonces aux lecteurs d'écran
- **Attributs ARIA** : Attributs ARIA complets (aria-label, aria-describedby, roles, aria-live)
- **Formulaires** : Attributs ARIA sur les formulaires (aria-required, aria-invalid)
- **Rôles Sémantiques** : Rôles sémantiques (main, navigation, banner, list, listitem)
- **Régions Live** : Support des régions live (polite, assertive)

#### 15.3 Contraste et Lisibilité
- **Contraste Élevé** : Classes utilitaires pour contraste élevé (prefers-contrast: high)
- **Mouvement Réduit** : Support du mode réduit de mouvement (prefers-reduced-motion)
- **Focus Visible** : Styles de focus visibles pour navigation clavier
- **Tailles Tactiles** : Tailles de cible tactiles minimales (44x44px)
- **Contenu Accessible** : Classes sr-only pour contenu accessible uniquement aux lecteurs d'écran

---

## Modèle de Données Détaillé

### Architecture du Modèle

Le modèle de données PostgreSQL est organisé en plusieurs domaines fonctionnels :

1. **Authentification et Autorisation** : User, Role, Permission, Group, Notification
2. **Métamodèle** : Metamodel, ConceptType, RelationType
3. **Modèles d'Architecture** : ModelPackage, Element, Relationship, Folder, View
4. **Stéréotypes** : Stereotype, ElementStereotype, RelationshipStereotype
5. **Workflow** : ChangeRequest, WorkflowStatus
6. **Intégration** : DataSource
7. **Configuration** : SystemSetting
8. **Collaboration** : ChatMessage
9. **Commentaires et Annotations** : CommentThread, Comment, CommentMention

### Tables Principales

#### User (Utilisateurs)
Représente un utilisateur de l'application avec les champs suivants :
- `id` : UUID (clé primaire)
- `email` : String unique (identifiant de connexion)
- `password` : String hashé (bcrypt)
- `name` : String optionnel (nom complet)
- `locale` : String optionnel (langue préférée, défaut 'en')
- `createdAt` : DateTime (date de création)
- `updatedAt` : DateTime (date de modification)

**Relations** :
- Many-to-Many avec `Role` (via table de liaison)
- Many-to-Many avec `Group` (via table de liaison)
- One-to-Many avec `ChangeRequest` (en tant que requester)
- One-to-Many avec `ChangeRequest` (en tant que reviewer)
- One-to-Many avec `Notification`
- One-to-Many avec `ChatMessage` (sentMessages)
- One-to-Many avec `ChatMessage` (receivedMessages)
- One-to-Many avec `Comment` (auteur)
- One-to-Many avec `CommentMention` (mentions)
- One-to-Many avec `CommentThread` (threads résolus)

#### Role (Rôles)
Définit les rôles utilisateurs avec :
- `id` : UUID (clé primaire)
- `name` : String unique (Consumer, Contributor, Designer, Lead Designer, System Administrator)
- `description` : String optionnel

**Relations** :
- Many-to-Many avec `User`
- Many-to-Many avec `Permission`

#### Permission (Permissions)
Définit les permissions disponibles :
- `id` : UUID (clé primaire)
- `name` : String unique
- `description` : String optionnel

**Relations** :
- Many-to-Many avec `Role`

#### ModelPackage (Packages de Modèles)
Conteneur principal pour organiser les modèles :
- `id` : UUID (clé primaire)
- `name` : String
- `description` : String optionnel
- `status` : WorkflowStatus (DRAFT, IN_REVIEW, APPROVED, PUBLISHED, ARCHIVED)
- `createdAt` : DateTime
- `updatedAt` : DateTime

**Relations** :
- One-to-Many avec `Element`
- One-to-Many avec `Relationship`
- One-to-Many avec `Folder`
- One-to-Many avec `View`
- One-to-Many avec `ChangeRequest`

#### Element (Éléments ArchiMate)
Représente un élément ArchiMate dans un modèle :
- `id` : UUID (clé primaire)
- `name` : String
- `documentation` : String optionnel
- `properties` : JSONB optionnel (propriétés additionnelles)
- `conceptTypeId` : UUID (référence à ConceptType)
- `modelPackageId` : UUID (référence à ModelPackage)
- `folderId` : UUID optionnel (référence à Folder)
- `validFrom` : DateTime (début de validité pour versioning)
- `validTo` : DateTime optionnel (fin de validité, NULL = version actuelle)
- `versionId` : UUID (groupe les versions d'un même élément logique)
- `externalId` : String optionnel (ID externe pour synchronisation)
- `dataSourceId` : UUID optionnel (référence à DataSource)

**Relations** :
- Many-to-One avec `ConceptType`
- Many-to-One avec `ModelPackage`
- Many-to-One avec `Folder` (optionnel)
- Many-to-One avec `DataSource` (optionnel)
- One-to-Many avec `Relationship` (en tant que source)
- One-to-Many avec `Relationship` (en tant que cible)
- One-to-Many avec `ElementStereotype`

#### Relationship (Relations ArchiMate)
Représente une relation ArchiMate entre deux éléments :
- `id` : UUID (clé primaire)
- `name` : String optionnel
- `documentation` : String optionnel
- `properties` : JSONB optionnel
- `relationTypeId` : UUID (référence à RelationType)
- `sourceId` : UUID (référence à Element source)
- `targetId` : UUID (référence à Element cible)
- `modelPackageId` : UUID (référence à ModelPackage)
- `validFrom` : DateTime (versioning)
- `validTo` : DateTime optionnel (versioning)
- `versionId` : UUID (versioning)

**Relations** :
- Many-to-One avec `RelationType`
- Many-to-One avec `Element` (source)
- Many-to-One avec `Element` (cible)
- Many-to-One avec `ModelPackage`
- One-to-Many avec `RelationshipStereotype`

#### View (Vues/Diagrammes)
Représente une vue/diagramme ArchiMate :
- `id` : UUID (clé primaire)
- `name` : String
- `description` : String optionnel
- `content` : JSONB optionnel (données de layout : nodes, edges, positions)
- `modelPackageId` : UUID (référence à ModelPackage)
- `folderId` : UUID optionnel (référence à Folder)
- `createdAt` : DateTime
- `updatedAt` : DateTime

**Relations** :
- Many-to-One avec `ModelPackage`
- Many-to-One avec `Folder` (optionnel)

#### Folder (Dossiers)
Représente un dossier pour organiser les éléments et vues :
- `id` : UUID (clé primaire)
- `name` : String
- `parentId` : UUID optionnel (référence à Folder parent pour hiérarchie)
- `modelPackageId` : UUID (référence à ModelPackage)
- `createdAt` : DateTime
- `updatedAt` : DateTime

**Relations** :
- Many-to-One avec `Folder` (parent, auto-référence)
- One-to-Many avec `Folder` (children, hiérarchie)
- Many-to-One avec `ModelPackage`
- One-to-Many avec `Element`
- One-to-Many avec `View`

#### Metamodel (Métamodèles)
Définit un métamodèle (ex: ArchiMate 3.1) :
- `id` : UUID (clé primaire)
- `name` : String unique (ex: "ArchiMate 3.1")
- `version` : String
- `description` : String optionnel

**Relations** :
- One-to-Many avec `ConceptType`
- One-to-Many avec `RelationType`

#### ConceptType (Types de Concepts)
Définit un type de concept ArchiMate (ex: BusinessActor, ApplicationComponent) :
- `id` : UUID (clé primaire)
- `name` : String (ex: "BusinessActor")
- `category` : String optionnel (ex: "Business Layer")
- `metamodelId` : UUID (référence à Metamodel)

**Relations** :
- Many-to-One avec `Metamodel`
- One-to-Many avec `Element`
- Many-to-Many avec `RelationType` (sourceRules)
- Many-to-Many avec `RelationType` (targetRules)
- One-to-Many avec `StereotypeConceptType`

#### RelationType (Types de Relations)
Définit un type de relation ArchiMate (ex: Assignment, Composition) :
- `id` : UUID (clé primaire)
- `name` : String (ex: "Assignment")
- `metamodelId` : UUID (référence à Metamodel)

**Relations** :
- Many-to-One avec `Metamodel`
- Many-to-Many avec `ConceptType` (allowedSourceTypes)
- Many-to-Many avec `ConceptType` (allowedTargetTypes)
- One-to-Many avec `Relationship`
- One-to-Many avec `StereotypeRelationType`

#### Stereotype (Stéréotypes)
Définit un stéréotype applicable aux éléments ou relations :
- `id` : UUID (clé primaire)
- `name` : String unique
- `description` : String optionnel
- `icon` : String optionnel (identifiant ou URL de l'icône)
- `color` : String optionnel (code couleur hexadécimal)
- `propertiesSchema` : JSONB optionnel (schéma JSON pour propriétés étendues)
- `createdAt` : DateTime
- `updatedAt` : DateTime

**Relations** :
- One-to-Many avec `StereotypeConceptType`
- One-to-Many avec `StereotypeRelationType`
- One-to-Many avec `ElementStereotype`
- One-to-Many avec `RelationshipStereotype`

#### ElementStereotype (Application de Stéréotype à un Élément)
Instance d'application d'un stéréotype à un élément :
- `id` : UUID (clé primaire)
- `elementId` : UUID (référence à Element)
- `stereotypeId` : UUID (référence à Stereotype)
- `extendedProperties` : JSONB optionnel (propriétés étendues selon propertiesSchema)
- `createdAt` : DateTime
- `updatedAt` : DateTime

**Contrainte Unique** : `(elementId, stereotypeId)`

#### RelationshipStereotype (Application de Stéréotype à une Relation)
Instance d'application d'un stéréotype à une relation :
- `id` : UUID (clé primaire)
- `relationshipId` : UUID (référence à Relationship)
- `stereotypeId` : UUID (référence à Stereotype)
- `extendedProperties` : JSONB optionnel
- `createdAt` : DateTime
- `updatedAt` : DateTime

**Contrainte Unique** : `(relationshipId, stereotypeId)`

#### ChangeRequest (Demandes de Changement)
Représente une demande de changement pour un package :
- `id` : UUID (clé primaire)
- `title` : String
- `description` : String optionnel
- `status` : WorkflowStatus (DRAFT, IN_REVIEW, APPROVED, PUBLISHED, ARCHIVED)
- `modelPackageId` : UUID (référence à ModelPackage)
- `requesterId` : UUID (référence à User)
- `reviewerId` : UUID optionnel (référence à User)
- `createdAt` : DateTime
- `updatedAt` : DateTime

**Relations** :
- Many-to-One avec `ModelPackage`
- Many-to-One avec `User` (requester)
- Many-to-One avec `User` (reviewer, optionnel)

#### Notification (Notifications)
Représente une notification pour un utilisateur :
- `id` : UUID (clé primaire)
- `type` : NotificationType (enum)
- `severity` : NotificationSeverity (INFO, WARNING, ERROR, SUCCESS)
- `title` : String
- `message` : String
- `read` : Boolean (défaut false)
- `userId` : UUID (référence à User)
- `metadata` : JSONB optionnel (métadonnées pour lier aux entités)
- `createdAt` : DateTime
- `readAt` : DateTime optionnel

**Relations** :
- Many-to-One avec `User`

**Index** : `(userId, read)`, `(userId, createdAt)`

#### ChatMessage (Messages de Chat)
Représente un message de chat entre deux utilisateurs :
- `id` : UUID (clé primaire)
- `fromId` : UUID (référence à User expéditeur)
- `toId` : UUID (référence à User destinataire)
- `message` : String
- `createdAt` : DateTime

**Relations** :
- Many-to-One avec `User` (from)
- Many-to-One avec `User` (to)

**Index** : `(fromId, toId, createdAt)`, `(toId, fromId, createdAt)`

#### CommentThread (Threads de Commentaires)
Représente un thread de discussion lié à un élément, relation ou vue :
- `id` : UUID (clé primaire)
- `targetType` : CommentTargetType (ELEMENT, RELATIONSHIP, VIEW)
- `targetId` : String (ID de la cible)
- `positionX` : Float optionnel (position X sur canvas)
- `positionY` : Float optionnel (position Y sur canvas)
- `resolved` : Boolean (défaut false)
- `resolvedAt` : DateTime optionnel
- `resolvedById` : UUID optionnel (référence à User)
- `createdAt` : DateTime
- `updatedAt` : DateTime

**Relations** :
- One-to-Many avec `Comment`
- Many-to-One avec `User` (resolvedBy, optionnel)

**Index** : `(targetType, targetId)`, `(resolved)`

#### Comment (Commentaires)
Représente un commentaire individuel dans un thread :
- `id` : UUID (clé primaire)
- `content` : String
- `threadId` : UUID (référence à CommentThread)
- `authorId` : UUID (référence à User)
- `parentId` : UUID optionnel (référence à Comment pour réponses)
- `createdAt` : DateTime
- `updatedAt` : DateTime
- `deletedAt` : DateTime optionnel (soft delete)

**Relations** :
- Many-to-One avec `CommentThread`
- Many-to-One avec `User` (author)
- Many-to-One avec `Comment` (parent, auto-référence)
- One-to-Many avec `Comment` (replies)
- One-to-Many avec `CommentMention`

**Index** : `(threadId, createdAt)`, `(authorId)`, `(parentId)`

#### CommentMention (Mentions dans Commentaires)
Représente une mention d'utilisateur dans un commentaire :
- `id` : UUID (clé primaire)
- `commentId` : UUID (référence à Comment)
- `mentionedUserId` : UUID (référence à User)
- `createdAt` : DateTime

**Relations** :
- Many-to-One avec `Comment`
- Many-to-One avec `User` (mentionedUser)

**Contrainte Unique** : `(commentId, mentionedUserId)`
**Index** : `(mentionedUserId)`

#### DataSource (Sources de Données)
Définit une source de données externe :
- `id` : UUID (clé primaire)
- `name` : String unique
- `type` : String (ex: 'ServiceNow', 'Excel', 'CSV')
- `config` : JSONB (configuration : URL, credentials, etc.)
- `mapping` : JSONB optionnel (configuration de mapping)
- `schedule` : String optionnel (expression cron)
- `lastSync` : DateTime optionnel
- `createdAt` : DateTime
- `updatedAt` : DateTime

**Relations** :
- One-to-Many avec `Element`

#### SystemSetting (Paramètres Système)
Stocke les paramètres système configurables :
- `key` : String (clé primaire)
- `value` : JSONB (valeur du paramètre)
- `description` : String optionnel
- `updatedAt` : DateTime

### Enums

#### WorkflowStatus
- `DRAFT` : Brouillon
- `IN_REVIEW` : En révision
- `APPROVED` : Approuvé
- `PUBLISHED` : Publié
- `ARCHIVED` : Archivé

#### NotificationType
- `CHANGE_REQUEST_CREATED` : Demande de changement créée
- `CHANGE_REQUEST_APPROVED` : Demande de changement approuvée
- `CHANGE_REQUEST_REJECTED` : Demande de changement rejetée
- `CHANGE_REQUEST_PUBLISHED` : Demande de changement publiée
- `ELEMENT_CREATED` : Élément créé
- `ELEMENT_UPDATED` : Élément modifié
- `RELATIONSHIP_CREATED` : Relation créée
- `VIEW_CREATED` : Vue créée
- `VIEW_UPDATED` : Vue modifiée
- `SYSTEM_ALERT` : Alerte système
- `COLLABORATION_INVITE` : Invitation à collaborer
- `CHAT_MESSAGE` : Message de chat reçu
- `COMMENT_CREATED` : Commentaire créé
- `COMMENT_REPLY` : Réponse à un commentaire
- `COMMENT_MENTION` : Mention dans un commentaire
- `COMMENT_RESOLVED` : Commentaire résolu

#### NotificationSeverity
- `INFO` : Information
- `WARNING` : Avertissement
- `ERROR` : Erreur
- `SUCCESS` : Succès

#### CommentTargetType
- `ELEMENT` : Commentaire sur un élément
- `RELATIONSHIP` : Commentaire sur une relation
- `VIEW` : Commentaire sur une vue

### Contraintes d'Intégrité

#### Isolation par Package
Tous les éléments, relations, dossiers et vues d'un `ModelPackage` sont isolés. Une relation ne peut pas lier des éléments de packages différents.

#### Validation des Relations
Une `Relationship` ne peut être créée que si le `RelationType` autorise la combinaison `(source.conceptType, target.conceptType)` selon les règles du métamodèle.

#### Versioning
Les éléments et relations avec `validTo = NULL` sont considérés comme la version actuelle. Les versions historiques ont `validTo` défini. `versionId` groupe toutes les versions d'un même élément logique.

#### Hiérarchie de Dossiers
Les dossiers forment une arborescence via `parentId`. Un dossier ne peut pas être son propre parent (contrainte à vérifier au niveau applicatif).

---

## Technologies Utilisées

### Frontend

#### Framework et Bibliothèques Principales

**Next.js 16.0.1**
- Framework React avec App Router
- Server-Side Rendering (SSR) et Static Site Generation (SSG)
- API Routes pour les endpoints backend
- Optimisation automatique des images et assets
- Support des middlewares pour authentification et i18n

**React 19.2.0**
- Bibliothèque UI déclarative
- Hooks personnalisés pour la logique métier
- Context API pour la gestion d'état globale
- Composants fonctionnels avec hooks

**TypeScript 5.9.2**
- Typage statique pour la sécurité du code
- Support des types avancés (generics, unions, intersections)
- Intégration avec les outils de développement

#### UI et Styling

**Tailwind CSS 4.1.17**
- Framework CSS utility-first
- Classes utilitaires pour styling rapide
- Support du thème sombre avec `next-themes`
- Configuration personnalisée via `tailwind.config.js`
- Support des animations avec `tailwindcss-animate`

**shadcn/ui (Radix UI)**
- Composants UI accessibles basés sur Radix UI
- Composants utilisés :
  - `@radix-ui/react-alert-dialog` : Dialogues d'alerte
  - `@radix-ui/react-avatar` : Avatars
  - `@radix-ui/react-context-menu` : Menus contextuels
  - `@radix-ui/react-dialog` : Dialogues modaux
  - `@radix-ui/react-dropdown-menu` : Menus déroulants
  - `@radix-ui/react-label` : Labels de formulaire
  - `@radix-ui/react-popover` : Popovers
  - `@radix-ui/react-radio-group` : Groupes de radio
  - `@radix-ui/react-scroll-area` : Zones de défilement
  - `@radix-ui/react-select` : Sélecteurs
  - `@radix-ui/react-separator` : Séparateurs
  - `@radix-ui/react-slot` : Slots pour composition
  - `@radix-ui/react-toast` : Notifications toast
  - `@radix-ui/react-tooltip` : Tooltips

**Lucide React 0.555.0**
- Bibliothèque d'icônes SVG
- Icônes optimisées et personnalisables
- Support du thème sombre

#### Diagramming

**@xyflow/react 12.9.3 (React Flow)**
- Bibliothèque de diagramming pour React
- Support des nœuds et arêtes personnalisés
- Interactions (drag, drop, zoom, pan)
- Layouts automatiques (circular, hierarchical, grid, force-directed)
- Événements personnalisés pour collaboration

#### State Management

**Zustand**
- Gestion d'état légère et performante
- Store global pour les onglets multiples
- Store pour la collaboration temps réel
- API simple et intuitive

#### Collaboration

**Socket.io Client 4.8.1**
- Client WebSocket pour communication temps réel
- Synchronisation des curseurs
- Synchronisation des modifications
- Chat en temps réel
- Notifications en temps réel

#### Internationalisation

**next-intl 4.5.6**
- Bibliothèque i18n pour Next.js
- Support des routes avec locale (`/en/*`, `/fr/*`)
- Traductions côté serveur et client
- Formatage des dates, nombres, etc.
- Fichiers de traduction JSON (en.json, fr.json)

#### Formulaires

**React Hook Form 7.67.0**
- Gestion de formulaires performante
- Validation avec Zod
- Intégration avec `@hookform/resolvers`

**Zod 4.1.13**
- Validation de schémas TypeScript-first
- Validation côté client et serveur
- Types générés automatiquement

#### Autres Bibliothèques Frontend

**html2canvas 1.4.1**
- Capture d'écran du canvas pour export (en développement)

**recharts 3.5.1**
- Bibliothèque de graphiques pour React
- Utilisée pour les dashboards

**class-variance-authority 0.7.1**
- Gestion des variantes de classes CSS
- Utilisé avec shadcn/ui

**clsx 2.1.1**
- Utilitaire pour combiner des classes CSS conditionnellement

**tailwind-merge 3.4.0**
- Fusion intelligente des classes Tailwind

**next-themes 0.4.6**
- Gestion du thème sombre/clair
- Persistance des préférences

### Backend

#### Framework et Runtime

**NestJS 11.0.1**
- Framework Node.js progressif
- Architecture modulaire avec modules, contrôleurs, services
- Injection de dépendances
- Décorateurs pour routes, guards, interceptors
- Support des WebSockets natif

**Node.js >=18**
- Runtime JavaScript
- Support des fonctionnalités ES2022+

**TypeScript 5.7.3**
- Typage statique côté serveur
- Compilation vers JavaScript

#### Base de Données

**PostgreSQL 15**
- Base de données relationnelle principale
- Support JSONB pour données flexibles
- Index pour performances
- Contraintes d'intégrité référentielle
- Transactions ACID

**Prisma 5.0.0**
- ORM moderne pour TypeScript
- Génération de types automatique
- Migrations de base de données
- Client type-safe
- Prisma Studio pour visualisation

#### Authentification et Sécurité

**Passport.js 0.7.0**
- Middleware d'authentification
- Stratégies multiples :
  - `passport-local 1.0.0` : Authentification email/password
  - `passport-jwt 4.0.1` : Authentification JWT
  - `passport-saml 3.2.4` : Authentification SAML 2.0 (partiellement implémenté)

**@nestjs/jwt 11.0.1**
- Intégration JWT avec NestJS
- Génération et validation de tokens

**bcrypt 6.0.0**
- Hachage de mots de passe
- Salt automatique
- Comparaison sécurisée

#### WebSocket

**Socket.io 4.8.1**
- Bibliothèque WebSocket pour communication temps réel
- Support des rooms pour isolation par vue
- Événements personnalisés
- Reconnexion automatique

**@nestjs/platform-socket.io 11.1.9**
- Intégration Socket.io avec NestJS
- Gateways pour gestion des connexions

**@nestjs/websockets 11.1.9**
- Support WebSocket natif NestJS

#### Intelligence Artificielle

**@ai-sdk/openai 2.0.74**
- SDK pour intégration OpenAI
- Support GPT-4-turbo

**ai 5.0.104**
- Bibliothèque Vercel AI SDK
- Génération de texte avec LLM
- Support streaming

#### Recherche

**@opensearch-project/opensearch 3.5.1**
- Client OpenSearch pour recherche full-text
- Indexation des éléments
- Requêtes de recherche avancées

#### Scripting

**vm2 3.10.0**
- Machine virtuelle JavaScript sandboxée
- Exécution sécurisée de scripts
- Timeout configurable
- Isolation du contexte

#### HTTP et API

**@nestjs/axios 4.0.1**
- Client HTTP pour requêtes externes
- Utilisé pour les connecteurs (ServiceNow, etc.)

**axios 1.13.2**
- Client HTTP basé sur Promises

**@nestjs/swagger 11.2.3**
- Documentation API automatique
- Génération de schémas OpenAPI
- Interface Swagger UI

**swagger-ui-express 5.0.1**
- Interface Swagger pour visualisation de l'API

#### Autres Bibliothèques Backend

**rxjs 7.8.1**
- Bibliothèque réactive pour programmation asynchrone
- Utilisée par NestJS pour observables

**reflect-metadata 0.2.2**
- Support des métadonnées pour décorateurs
- Requis par NestJS

**neo4j-driver 6.0.1**
- Driver Neo4j (utilisé pour migration, mais relations migrées vers PostgreSQL)

### Infrastructure et Outils

#### Monorepo

**Turborepo 2.6.1**
- Gestion de monorepo
- Builds parallèles et caching
- Gestion des dépendances entre packages
- Configuration via `turbo.json`

**npm Workspaces**
- Workspaces pour gestion des packages
- Dépendances partagées

#### Développement

**ESLint 9.39.1**
- Linter JavaScript/TypeScript
- Configuration partagée via `@repo/eslint-config`
- Règles personnalisées pour Next.js et NestJS

**Prettier 3.6.2**
- Formateur de code
- Configuration partagée

**ts-node 10.9.2**
- Exécution TypeScript directe
- Utilisé pour scripts et migrations

#### Tests

**Jest 30.0.0**
- Framework de tests
- Tests unitaires et E2E
- Configuration via `jest.config.js`

**ts-jest 29.2.5**
- Preset Jest pour TypeScript

**supertest 7.0.0**
- Tests HTTP pour API
- Utilisé pour tests E2E

#### Docker

**Docker Compose**
- Orchestration de conteneurs
- Services :
  - PostgreSQL 15
  - OpenSearch 2.11

### Packages Partagés

#### @repo/database
- Schéma Prisma
- Client Prisma généré
- Migrations
- Seed scripts

#### @repo/types
- Types TypeScript partagés
- DTOs
- Interfaces
- Enums

#### @repo/ui
- Composants UI réutilisables
- Basés sur shadcn/ui

#### @repo/eslint-config
- Configuration ESLint partagée
- Règles pour Next.js et NestJS

#### @repo/typescript-config
- Configuration TypeScript partagée
- Presets pour différents environnements

### Services Externes (Optionnels)

#### OpenAI
- GPT-4-turbo pour :
  - Description automatique de diagrammes
  - Chatbot coach ArchiMate
- Configuration via `OPENAI_API_KEY`

#### GitHub (Prévu)
- Versioning des modèles
- Historique des modifications
- Intégration via Octokit

### Déploiement

#### Reverse Proxy
- **Nginx** : Reverse proxy pour production
- Configuration WebSocket
- SSL/TLS avec Let's Encrypt (optionnel)

#### Process Management
- **systemd** : Gestion des services en production
- Services pour backend et frontend

#### Containerisation
- **Docker** : Conteneurs pour services (PostgreSQL, OpenSearch)
- Scripts de déploiement pour Proxmox LXC

---

## Architecture Technique

### Structure Monorepo

```
archimodeler/
├── apps/
│   ├── web/              # Frontend Next.js
│   │   ├── app/          # Pages (App Router)
│   │   ├── components/   # Composants React
│   │   ├── hooks/        # Hooks personnalisés
│   │   ├── contexts/     # Contextes React
│   │   ├── lib/          # Utilitaires
│   │   └── messages/     # Traductions i18n
│   ├── server/           # Backend NestJS
│   │   └── src/
│   │       ├── ai/       # Service IA
│   │       ├── auth/     # Authentification
│   │       ├── collaboration/ # WebSocket
│   │       ├── comments/ # Commentaires
│   │       ├── connectors/ # Connecteurs
│   │       ├── metamodel/ # Métamodèle
│   │       ├── model/    # Modèles
│   │       ├── notifications/ # Notifications
│   │       ├── search/   # Recherche
│   │       ├── scripting/ # Scripting
│   │       ├── settings/ # Paramètres
│   │       ├── stereotypes/ # Stéréotypes
│   │       ├── users/    # Utilisateurs
│   │       └── workflow/ # Workflow
│   └── docs/             # Documentation
├── packages/
│   ├── database/         # Prisma schema
│   ├── types/            # Types partagés
│   ├── ui/               # Composants UI
│   ├── eslint-config/    # Config ESLint
│   └── typescript-config/ # Config TypeScript
└── scripts/              # Scripts utilitaires
```

### Flux de Données

1. **Frontend → Backend** : Requêtes HTTP REST via API
2. **Frontend ↔ Backend** : WebSocket pour collaboration temps réel
3. **Backend → PostgreSQL** : Prisma ORM pour accès aux données
4. **Backend → OpenSearch** : Indexation et recherche
5. **Backend → OpenAI** : Services IA (optionnel)

### Sécurité

- **Authentification** : JWT avec expiration
- **Autorisation** : RBAC avec rôles et permissions
- **Validation** : DTOs avec class-validator
- **Sanitization** : Validation des entrées utilisateur
- **CORS** : Configuration pour origines autorisées
- **WebSocket Auth** : Authentification JWT dans handshakes

### Performance

- **Caching** : Turborepo cache pour builds
- **Lazy Loading** : Composants React chargés à la demande
- **Indexation** : Index PostgreSQL pour requêtes fréquentes
- **Pagination** : Pagination des résultats
- **Debouncing** : Debouncing pour recherche et synchronisation

---

*Documentation générée le : 2025-11-30*  
*Version : 1.0*




