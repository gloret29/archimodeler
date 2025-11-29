## Phase 1 : Fondations et Infrastructure

### 1.1 Intégration Neo4j pour les relations
**Statut**: 🟡 **En cours**  
**Priorité**: Haute  
**Description**: 
- La base PostgreSQL doit rester le référentiel des objets et des vues
- Les relations entre les objets et les vues doivent être stockées dans Neo4j
- Mettre en place le client Neo4j dans le backend NestJS
- Créer un service de gestion des relations graphiques
- Migrer les relations existantes vers Neo4j (si applicable)

**Tâches**:
- [x] Installer et configurer Neo4j (docker-compose)
- [x] Créer un module Neo4j dans le backend
- [x] Créer un service pour gérer les relations (CRUD)
- [ ] Adapter les endpoints existants pour utiliser Neo4j pour les relations
- [ ] Créer des migrations pour transférer les relations existantes
- [ ] Tests unitaires et d'intégration

---

### 1.2 Page d'administration - Base
**Statut**: 🔴 **À faire**  
**Priorité**: Haute  
**Description**: 
- Créer une page d'administration accessible uniquement aux utilisateurs avec le rôle admin
- Mettre en place la structure de base de la page
- Gérer les paramètres de l'application

**Tâches**:
- [ ] Créer la route `/admin` dans l'application web
- [ ] Créer un guard pour vérifier le rôle admin
- [ ] Créer le composant de page d'administration
- [ ] Créer la section pour les paramètres de l'application
- [ ] Créer l'API backend pour gérer les paramètres
- [ ] Tests d'accès et de sécurité

---

### 1.3 Gestion des utilisateurs et rôles
**Statut**: 🔴 **À faire**  
**Priorité**: Haute  
**Description**: 
- Dans la page d'administration, permettre de créer, modifier et supprimer des utilisateurs
- Permettre de créer, modifier et supprimer des rôles
- Gérer les associations utilisateurs-rôles

**Tâches**:
- [ ] Créer l'interface de gestion des utilisateurs (liste, formulaire)
- [ ] Créer l'interface de gestion des rôles (liste, formulaire)
- [ ] Créer les endpoints API pour CRUD utilisateurs
- [ ] Créer les endpoints API pour CRUD rôles
- [ ] Implémenter la validation et les règles métier
- [ ] Tests fonctionnels

---

## Phase 2 : Fonctionnalités Utilisateur de Base

### 2.1 Paramètres utilisateur
**Statut**: 🔴 **À faire**  
**Priorité**: Moyenne  
**Description**: 
- Chaque utilisateur doit pouvoir avoir des paramètres propres
- Stocker les préférences utilisateur dans la base de données

**Tâches**:
- [ ] Créer le modèle Prisma pour les paramètres utilisateur
- [ ] Créer la migration de base de données
- [ ] Créer l'API pour gérer les paramètres utilisateur
- [ ] Créer l'interface utilisateur pour modifier les paramètres
- [ ] Intégrer les paramètres dans l'application

---

### 2.2 Page d'accueil personnalisable
**Statut**: 🔴 **À faire**  
**Priorité**: Moyenne  
**Description**: 
- Chaque utilisateur doit pouvoir organiser sa page d'accueil avec les vues qu'il souhaite voir en raccourci
- Permettre de consulter rapidement les vues favorites

**Tâches**:
- [ ] Créer le modèle Prisma pour les raccourcis de vues
- [ ] Créer l'interface de personnalisation de la page d'accueil
- [ ] Créer l'API pour gérer les raccourcis
- [ ] Implémenter le drag-and-drop pour réorganiser les vues
- [ ] Afficher les vues en raccourci sur la page d'accueil

---

### 2.3 Zone d'information à droite
**Statut**: 🔴 **À faire**  
**Priorité**: Moyenne  
**Description**: 
- Dans une vue, quand on sélectionne un objet ou une relation, afficher les informations dans une zone dédiée à droite de la page, sous le repository

**Tâches**:
- [ ] Créer le composant de panneau d'information à droite
- [ ] Implémenter la sélection d'objets et de relations
- [ ] Afficher les détails de l'objet/relation sélectionné
- [ ] Permettre l'édition des propriétés depuis ce panneau
- [ ] Gérer le responsive design

---

## Phase 3 : Amélioration de l'Édition

### 3.1 Onglets multiples pour les vues
**Statut**: 🔴 **À faire**  
**Priorité**: Haute  
**Description**: 
- Permettre d'éditer plusieurs vues en même temps en ouvrant un onglet par vue

**Tâches**:
- [ ] Créer le système d'onglets dans l'interface
- [ ] Gérer l'état des vues ouvertes
- [ ] Permettre la navigation entre les onglets
- [ ] Gérer la fermeture des onglets
- [ ] Sauvegarder l'état des onglets ouverts

---

### 3.2 Édition collaborative en temps réel
**Statut**: 🔴 **À faire**  
**Priorité**: Haute  
**Description**: 
- Une vue peut être éditée en même temps par plusieurs utilisateurs sans bloquer
- Les modifications d'un utilisateur doivent être visibles instantanément par les autres utilisateurs

**Tâches**:
- [ ] Choisir et intégrer une solution de synchronisation temps réel (WebSocket/Socket.io)
- [ ] Créer le service de synchronisation côté backend
- [ ] Implémenter la synchronisation des modifications de vues
- [ ] Gérer les conflits de modifications
- [ ] Afficher les curseurs/indicateurs des autres utilisateurs
- [ ] Tests de charge et de performance

---

### 3.3 Affichage des relations selon norme ArchiMate
**Statut**: 🔴 **À faire**  
**Priorité**: Moyenne  
**Description**: 
- L'affichage des relations entre les objets doit respecter la norme ArchiMate
- Implémenter les styles et conventions visuelles ArchiMate

**Tâches**:
- [ ] Documenter les règles d'affichage ArchiMate
- [ ] Créer les styles de relations selon le type
- [ ] Implémenter les flèches et symboles appropriés
- [ ] Adapter React Flow pour respecter les conventions
- [ ] Tests visuels et validation

---

### 3.4 Prévention des doublons de relations
**Statut**: 🔴 **À faire**  
**Priorité**: Moyenne  
**Description**: 
- Il ne faut pas de doublons de relations du même type entre les mêmes objets

**Tâches**:
- [ ] Implémenter la validation avant création de relation
- [ ] Vérifier l'unicité dans Neo4j
- [ ] Afficher un message d'erreur si doublon détecté
- [ ] Gérer les cas de relations multiples autorisées (si applicable)

---

## Phase 4 : Stéréotypes et Métadonnées

### 4.1 Système de stéréotypes pour objets
**Statut**: 🔴 **À faire**  
**Priorité**: Moyenne  
**Description**: 
- Chaque objet ArchiMate doit pouvoir être stéréotypé
- La liste des stéréotypes doit être stockée dans PostgreSQL
- Les stéréotypes doivent être modifiables dans la page d'administration

**Tâches**:
- [ ] Créer le modèle Prisma pour les stéréotypes
- [ ] Créer la migration de base de données
- [ ] Créer l'API pour gérer les stéréotypes
- [ ] Créer l'interface d'administration pour les stéréotypes
- [ ] Permettre l'assignation de stéréotypes aux objets
- [ ] Afficher les stéréotypes dans l'interface

---

### 4.2 Propriétés spécifiques selon stéréotype
**Statut**: 🔴 **À faire**  
**Priorité**: Moyenne  
**Description**: 
- En fonction des stéréotypes des objets, "augmenter" les objets avec des propriétés propres et spécifiques au stéréotype et au type d'objet ArchiMate

**Tâches**:
- [ ] Créer le modèle pour les propriétés personnalisées
- [ ] Créer l'interface pour définir les propriétés par stéréotype
- [ ] Implémenter la logique d'augmentation dynamique des objets
- [ ] Afficher les propriétés personnalisées dans l'interface
- [ ] Permettre l'édition des propriétés personnalisées

---

### 4.3 Stéréotypes pour relations
**Statut**: 🔴 **À faire**  
**Priorité**: Moyenne  
**Description**: 
- Comme les objets, les relations entre les objets doivent pouvoir être stéréotypées

**Tâches**:
- [ ] Étendre le système de stéréotypes aux relations
- [ ] Permettre l'assignation de stéréotypes aux relations
- [ ] Afficher les stéréotypes des relations
- [ ] Gérer les propriétés personnalisées pour les relations stéréotypées

---

## Phase 5 : Versioning

### 5.1 Versioning des objets
**Statut**: 🔴 **À faire**  
**Priorité**: Moyenne  
**Description**: 
- Mettre en place un système de versioning pour les objets
- Permettre de suivre l'historique des modifications

**Tâches**:
- [ ] Concevoir le modèle de versioning (historique)
- [ ] Créer le modèle Prisma pour les versions d'objets
- [ ] Implémenter la logique de création de versions
- [ ] Créer l'API pour consulter l'historique
- [ ] Créer l'interface pour visualiser l'historique

---

### 5.2 Versioning des vues
**Statut**: 🔴 **À faire**  
**Priorité**: Moyenne  
**Description**: 
- Mettre en place un système de versioning pour les vues
- Permettre de suivre l'historique des modifications

**Tâches**:
- [ ] Créer le modèle Prisma pour les versions de vues
- [ ] Implémenter la logique de création de versions
- [ ] Créer l'API pour consulter l'historique
- [ ] Créer l'interface pour visualiser l'historique

---

### 5.3 Intégration GitHub pour le versioning
**Statut**: 🔴 **À faire**  
**Priorité**: Basse  
**Description**: 
- Le système de versioning doit être basé sur GitHub
- Le dépôt GitHub doit être paramétrable dans la page d'administration
- Si le dépôt n'est pas paramétré, le système de versioning ne doit pas être actif

**Tâches**:
- [ ] Créer l'interface d'administration pour configurer le dépôt GitHub
- [ ] Intégrer l'API GitHub (Octokit)
- [ ] Implémenter la synchronisation avec GitHub
- [ ] Gérer l'authentification GitHub (tokens)
- [ ] Créer les commits automatiques
- [ ] Gérer le cas où GitHub n'est pas configuré

---

### 5.4 Interface de versioning (clic droit)
**Statut**: 🔴 **À faire**  
**Priorité**: Moyenne  
**Description**: 
- Un clic droit sur un objet ou une vue doit permettre de voir l'historique des modifications
- Permettre de faire un commit ou un rollback
- Informer avant validation les objets, vues et relations qui seront modifiés

**Tâches**:
- [ ] Créer le menu contextuel pour le versioning
- [ ] Créer l'interface d'historique
- [ ] Implémenter la fonctionnalité de commit
- [ ] Implémenter la fonctionnalité de rollback
- [ ] Créer le dialogue de confirmation avec la liste des modifications
- [ ] Intégrer avec GitHub si configuré

---

## Phase 6 : Export et Backup

### 6.1 Système d'export des vues et objets
**Statut**: 🔴 **À faire**  
**Priorité**: Moyenne  
**Description**: 
- Mettre en place un système d'export des vues et des objets
- Support de différents formats (JSON, XML, ArchiMate Exchange Format, etc.)

**Tâches**:
- [ ] Définir les formats d'export à supporter
- [ ] Créer les services d'export pour les objets
- [ ] Créer les services d'export pour les vues
- [ ] Créer l'API pour déclencher les exports
- [ ] Créer l'interface utilisateur pour l'export
- [ ] Implémenter l'export ArchiMate Exchange Format (si applicable)

---

### 6.2 Système de backup de la base de données
**Statut**: 🔴 **À faire**  
**Priorité**: Moyenne  
**Description**: 
- Mettre en place un système de backup de la base de données
- Permettre les backups manuels et automatiques

**Tâches**:
- [ ] Créer le service de backup PostgreSQL
- [ ] Créer le service de backup Neo4j
- [ ] Implémenter les backups automatiques (cron)
- [ ] Créer l'interface d'administration pour les backups
- [ ] Implémenter la restauration de backups
- [ ] Gérer le stockage des backups

---

## Phase 7 : Fonctionnalités Avancées

### 7.1 Page d'analyse des liens Neo4j
**Statut**: 🔴 **À faire**  
**Priorité**: Basse  
**Description**: 
- Mettre en place une page permettant d'analyser les liens entre les objets qui sont dans Neo4j sans connaître le langage Cypher
- Interface graphique pour explorer les relations

**Tâches**:
- [ ] Concevoir l'interface d'analyse graphique
- [ ] Créer les requêtes Cypher prédéfinies
- [ ] Créer l'interface utilisateur pour explorer les relations
- [ ] Implémenter la visualisation graphique des relations
- [ ] Permettre les filtres et recherches

---

### 7.2 Système de notifications
**Statut**: 🔴 **À faire**  
**Priorité**: Moyenne  
**Description**: 
- Mettre en place un système de notification pour les utilisateurs
- Afficher une alerte dans l'ensemble de l'application sur un bandeau en haut de la page

**Tâches**:
- [ ] Créer le modèle Prisma pour les notifications
- [ ] Créer le composant de bandeau de notification
- [ ] Créer l'API pour gérer les notifications
- [ ] Implémenter le système de notification en temps réel
- [ ] Permettre la fermeture/marquage comme lu
- [ ] Gérer les différents types de notifications

---

### 7.3 Suppression de vue sans supprimer objets/relations
**Statut**: 🔴 **À faire**  
**Priorité**: Basse  
**Description**: 
- La suppression d'une vue doit être possible sans supprimer les objets liés et les relations entre les objets
- Les objets et relations doivent rester dans le repository

**Tâches**:
- [ ] Vérifier que la logique actuelle respecte cette règle
- [ ] Implémenter la suppression en cascade uniquement pour les références de vue
- [ ] Tester que les objets et relations persistent
- [ ] Ajouter une confirmation avant suppression

---

## Notes d'implémentation

### Dépendances entre les phases
- **Phase 1** doit être complétée avant les autres phases (fondations)
- **Phase 3.2** (édition collaborative) nécessite **Phase 1.1** (Neo4j) pour la synchronisation
- **Phase 4** (stéréotypes) peut être développée en parallèle avec **Phase 3**
- **Phase 5** (versioning) peut être développée en parallèle mais nécessite **Phase 1.1** pour les relations
- **Phase 6** et **Phase 7** peuvent être développées en parallèle

### Technologies à évaluer
- **WebSocket/Socket.io** pour l'édition collaborative
- **Octokit** pour l'intégration GitHub
- **Neo4j Driver** pour Node.js
- **pg_dump** et outils Neo4j pour les backups

### Points d'attention
- Performance avec Neo4j pour les grandes quantités de relations
- Gestion des conflits en édition collaborative
- Sécurité des tokens GitHub
- Performance des exports pour de gros modèles
