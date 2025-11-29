# Modèle de Données PostgreSQL - ArchiModeler

## Vue d'ensemble

ArchiModeler utilise PostgreSQL comme base de données principale pour stocker tous les modèles d'architecture d'entreprise, les métadonnées, les utilisateurs, et les configurations. Le modèle de données est conçu pour supporter :

- **Gestion multi-utilisateurs** avec rôles et permissions
- **Modélisation ArchiMate** avec métamodèle configurable
- **Versioning temporel** (Time Travel) pour les éléments et relations
- **Système de stéréotypes** extensible
- **Workflow de validation** pour les packages de modèles
- **Système de notifications** pour les utilisateurs
- **Intégration de sources de données externes**
- **Organisation hiérarchique** via dossiers

## Architecture du Modèle

Le modèle de données est organisé en plusieurs domaines fonctionnels :

1. **Authentification et Autorisation** : User, Role, Permission, Group, Notification
2. **Métamodèle** : Metamodel, ConceptType, RelationType
3. **Modèles d'Architecture** : ModelPackage, Element, Relationship, Folder, View
4. **Stéréotypes** : Stereotype, ElementStereotype, RelationshipStereotype
5. **Workflow** : ChangeRequest, WorkflowStatus
6. **Intégration** : DataSource
7. **Configuration** : SystemSetting

---

## Tables Principales

### 1. Authentification et Autorisation

#### `User`
Représente un utilisateur de l'application.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `email` | TEXT | UNIQUE, NOT NULL | Adresse email (identifiant de connexion) |
| `password` | TEXT | NOT NULL | Mot de passe hashé (bcrypt) |
| `name` | TEXT | NULLABLE | Nom complet de l'utilisateur |
| `createdAt` | TIMESTAMP | DEFAULT now() | Date de création |
| `updatedAt` | TIMESTAMP | DEFAULT now(), AUTO UPDATE | Date de dernière modification |

**Relations :**
- `roles` : Many-to-Many avec `Role` (via `_RoleToUser`)
- `groups` : Many-to-Many avec `Group` (via `_GroupToUser`)
- `requestedChanges` : One-to-Many avec `ChangeRequest` (requester)
- `reviewedChanges` : One-to-Many avec `ChangeRequest` (reviewer)
- `notifications` : One-to-Many avec `Notification`

**Index :**
- UNIQUE sur `email`

---

#### `Notification`
Représente une notification pour un utilisateur.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `type` | NotificationType | NOT NULL | Type de notification |
| `severity` | NotificationSeverity | DEFAULT 'INFO' | Niveau de sévérité |
| `title` | TEXT | NOT NULL | Titre de la notification |
| `message` | TEXT | NOT NULL | Message de la notification |
| `read` | BOOLEAN | DEFAULT false | Indique si la notification a été lue |
| `userId` | UUID | FOREIGN KEY → User.id, CASCADE DELETE | Utilisateur destinataire |
| `metadata` | JSONB | NULLABLE | Métadonnées optionnelles (ex: changeRequestId, elementId, viewId) |
| `createdAt` | TIMESTAMP | DEFAULT now() | Date de création |
| `readAt` | TIMESTAMP | NULLABLE | Date de lecture |

**Relations :**
- `user` : Many-to-One avec `User`

**Enum `NotificationType` :**
- `CHANGE_REQUEST_CREATED` : Demande de changement créée
- `CHANGE_REQUEST_SUBMITTED` : Demande de changement soumise
- `CHANGE_REQUEST_APPROVED` : Demande de changement approuvée
- `CHANGE_REQUEST_REJECTED` : Demande de changement rejetée
- `CHANGE_REQUEST_PUBLISHED` : Demande de changement publiée
- `CHAT_MESSAGE` : Message de chat reçu
- `SYSTEM` : Notification système

**Enum `NotificationSeverity` :**
- `INFO` : Information
- `WARNING` : Avertissement
- `ERROR` : Erreur
- `SUCCESS` : Succès

**Index :**
- Index sur `userId` pour les requêtes de récupération par utilisateur
- Index sur `read` pour filtrer les notifications non lues
- Index sur `createdAt` pour le tri chronologique

---

#### `Role`
Définit les rôles utilisateurs (Consumer, Contributor, Designer, Lead Designer, System Administrator).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `name` | TEXT | UNIQUE, NOT NULL | Nom du rôle |
| `description` | TEXT | NULLABLE | Description du rôle |

**Relations :**
- `users` : Many-to-Many avec `User` (via `_RoleToUser`)
- `permissions` : Many-to-Many avec `Permission` (via `_PermissionToRole`)

**Index :**
- UNIQUE sur `name`

---

#### `Permission`
Définit les permissions disponibles dans le système.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `name` | TEXT | UNIQUE, NOT NULL | Nom de la permission |
| `description` | TEXT | NULLABLE | Description de la permission |

**Relations :**
- `roles` : Many-to-Many avec `Role` (via `_PermissionToRole`)

**Index :**
- UNIQUE sur `name`

---

#### `Group`
Représente un groupe d'utilisateurs.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `name` | TEXT | UNIQUE, NOT NULL | Nom du groupe |

**Relations :**
- `users` : Many-to-Many avec `User` (via `_GroupToUser`)

**Index :**
- UNIQUE sur `name`

---

### 2. Métamodèle

#### `Metamodel`
Définit un métamodèle (ex: ArchiMate 3.1).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `name` | TEXT | UNIQUE, NOT NULL | Nom du métamodèle (ex: "ArchiMate 3.1") |
| `version` | TEXT | NOT NULL | Version du métamodèle |
| `description` | TEXT | NULLABLE | Description du métamodèle |

**Relations :**
- `conceptTypes` : One-to-Many avec `ConceptType`
- `relationTypes` : One-to-Many avec `RelationType`

**Index :**
- UNIQUE sur `name`

---

#### `ConceptType`
Définit un type de concept ArchiMate (ex: BusinessActor, ApplicationComponent).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `name` | TEXT | NOT NULL | Nom du type (ex: "BusinessActor") |
| `category` | TEXT | NULLABLE | Catégorie (ex: "Business Layer") |
| `metamodelId` | UUID | FOREIGN KEY → Metamodel.id | Référence au métamodèle |

**Relations :**
- `metamodel` : Many-to-One avec `Metamodel`
- `elements` : One-to-Many avec `Element`
- `sourceRules` : Many-to-Many avec `RelationType` (via `_SourceRules`)
- `targetRules` : Many-to-Many avec `RelationType` (via `_TargetRules`)
- `applicableStereotypes` : One-to-Many avec `StereotypeConceptType`

**Index :**
- UNIQUE sur `(name, metamodelId)`

---

#### `RelationType`
Définit un type de relation ArchiMate (ex: Assignment, Composition).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `name` | TEXT | NOT NULL | Nom du type (ex: "Assignment") |
| `metamodelId` | UUID | FOREIGN KEY → Metamodel.id | Référence au métamodèle |

**Relations :**
- `metamodel` : Many-to-One avec `Metamodel`
- `allowedSourceTypes` : Many-to-Many avec `ConceptType` (via `_SourceRules`)
- `allowedTargetTypes` : Many-to-Many avec `ConceptType` (via `_TargetRules`)
- `relationships` : One-to-Many avec `Relationship`
- `applicableStereotypes` : One-to-Many avec `StereotypeRelationType`

**Index :**
- UNIQUE sur `(name, metamodelId)`

---

### 3. Modèles d'Architecture

#### `ModelPackage`
Représente un package de modèle (conteneur principal pour éléments, relations, vues).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `name` | TEXT | NOT NULL | Nom du package |
| `description` | TEXT | NULLABLE | Description du package |
| `status` | WorkflowStatus | DEFAULT 'DRAFT' | Statut du workflow |
| `createdAt` | TIMESTAMP | DEFAULT now() | Date de création |
| `updatedAt` | TIMESTAMP | DEFAULT now(), AUTO UPDATE | Date de dernière modification |

**Relations :**
- `elements` : One-to-Many avec `Element`
- `relationships` : One-to-Many avec `Relationship`
- `folders` : One-to-Many avec `Folder`
- `views` : One-to-Many avec `View`
- `changeRequests` : One-to-Many avec `ChangeRequest`

**Enum `WorkflowStatus` :**
- `DRAFT` : Brouillon
- `IN_REVIEW` : En révision
- `APPROVED` : Approuvé
- `PUBLISHED` : Publié
- `ARCHIVED` : Archivé

---

#### `Element`
Représente un élément ArchiMate dans un modèle.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `name` | TEXT | NOT NULL | Nom de l'élément |
| `documentation` | TEXT | NULLABLE | Documentation de l'élément |
| `properties` | JSONB | NULLABLE | Propriétés additionnelles (flexible) |
| `conceptTypeId` | UUID | FOREIGN KEY → ConceptType.id | Type de concept |
| `modelPackageId` | UUID | FOREIGN KEY → ModelPackage.id | Package parent |
| `folderId` | UUID | FOREIGN KEY → Folder.id, NULLABLE | Dossier parent (optionnel) |
| `validFrom` | TIMESTAMP | DEFAULT now() | Date de début de validité (versioning) |
| `validTo` | TIMESTAMP | NULLABLE | Date de fin de validité (NULL = version actuelle) |
| `versionId` | UUID | DEFAULT uuid() | Identifiant de version (groupe les versions) |
| `externalId` | TEXT | NULLABLE | ID externe (pour synchronisation) |
| `dataSourceId` | UUID | FOREIGN KEY → DataSource.id, NULLABLE | Source de données externe |

**Relations :**
- `conceptType` : Many-to-One avec `ConceptType`
- `modelPackage` : Many-to-One avec `ModelPackage`
- `folder` : Many-to-One avec `Folder` (optionnel)
- `dataSource` : Many-to-One avec `DataSource` (optionnel)
- `sourceRelationships` : One-to-Many avec `Relationship` (en tant que source)
- `targetRelationships` : One-to-Many avec `Relationship` (en tant que cible)
- `stereotypes` : One-to-Many avec `ElementStereotype`

**Versioning :**
- Le système de versioning permet de garder l'historique des modifications
- `validTo = NULL` indique la version actuelle
- `versionId` groupe toutes les versions d'un même élément logique

---

#### `Relationship`
Représente une relation ArchiMate entre deux éléments.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `name` | TEXT | NULLABLE | Nom de la relation |
| `documentation` | TEXT | NULLABLE | Documentation de la relation |
| `properties` | JSONB | NULLABLE | Propriétés additionnelles |
| `relationTypeId` | UUID | FOREIGN KEY → RelationType.id | Type de relation |
| `sourceId` | UUID | FOREIGN KEY → Element.id | Élément source |
| `targetId` | UUID | FOREIGN KEY → Element.id | Élément cible |
| `modelPackageId` | UUID | FOREIGN KEY → ModelPackage.id | Package parent |
| `validFrom` | TIMESTAMP | DEFAULT now() | Date de début de validité |
| `validTo` | TIMESTAMP | NULLABLE | Date de fin de validité |
| `versionId` | UUID | DEFAULT uuid() | Identifiant de version |

**Relations :**
- `relationType` : Many-to-One avec `RelationType`
- `source` : Many-to-One avec `Element` (source)
- `target` : Many-to-One avec `Element` (cible)
- `modelPackage` : Many-to-One avec `ModelPackage`
- `stereotypes` : One-to-Many avec `RelationshipStereotype`

**Contraintes :**
- `sourceId` et `targetId` doivent référencer des éléments du même `modelPackageId`
- Le type de relation doit être valide selon les règles du métamodèle

---

#### `Folder`
Représente un dossier pour organiser les éléments et vues.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `name` | TEXT | NOT NULL | Nom du dossier |
| `parentId` | UUID | FOREIGN KEY → Folder.id, NULLABLE | Dossier parent (NULL = racine) |
| `modelPackageId` | UUID | FOREIGN KEY → ModelPackage.id | Package parent |
| `createdAt` | TIMESTAMP | DEFAULT now() | Date de création |
| `updatedAt` | TIMESTAMP | DEFAULT now(), AUTO UPDATE | Date de modification |

**Relations :**
- `parent` : Many-to-One avec `Folder` (auto-référence)
- `children` : One-to-Many avec `Folder` (hiérarchie)
- `modelPackage` : Many-to-One avec `ModelPackage`
- `elements` : One-to-Many avec `Element`
- `views` : One-to-Many avec `View`

**Structure hiérarchique :**
- Les dossiers forment une arborescence via `parentId`
- Un dossier peut contenir des éléments et des vues
- Les dossiers sont isolés par `modelPackageId`

---

#### `View`
Représente une vue/diagramme ArchiMate.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `name` | TEXT | NOT NULL | Nom de la vue |
| `description` | TEXT | NULLABLE | Description de la vue |
| `content` | JSONB | NULLABLE | Données de layout (nodes, edges, positions) |
| `modelPackageId` | UUID | FOREIGN KEY → ModelPackage.id | Package parent |
| `folderId` | UUID | FOREIGN KEY → Folder.id, NULLABLE | Dossier parent |
| `createdAt` | TIMESTAMP | DEFAULT now() | Date de création |
| `updatedAt` | TIMESTAMP | DEFAULT now(), AUTO UPDATE | Date de modification |

**Relations :**
- `modelPackage` : Many-to-One avec `ModelPackage`
- `folder` : Many-to-One avec `Folder` (optionnel)

**Format `content` (JSONB) :**
```json
{
  "nodes": [
    {
      "id": "node-1",
      "elementId": "elem-123",
      "position": { "x": 100, "y": 200 },
      "data": { "label": "Element Name", "type": "BusinessActor" }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "relationshipId": "rel-456",
      "source": "node-1",
      "target": "node-2",
      "label": "Assignment"
    }
  ]
}
```

---

### 4. Stéréotypes

#### `Stereotype`
Définit un stéréotype applicable aux éléments ou relations.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `name` | TEXT | UNIQUE, NOT NULL | Nom du stéréotype |
| `description` | TEXT | NULLABLE | Description |
| `icon` | TEXT | NULLABLE | Identifiant ou URL de l'icône |
| `color` | TEXT | NULLABLE | Code couleur hexadécimal |
| `propertiesSchema` | JSONB | NULLABLE | Schéma JSON pour propriétés étendues |
| `createdAt` | TIMESTAMP | DEFAULT now() | Date de création |
| `updatedAt` | TIMESTAMP | DEFAULT now(), AUTO UPDATE | Date de modification |

**Relations :**
- `applicableConceptTypes` : One-to-Many avec `StereotypeConceptType`
- `applicableRelationTypes` : One-to-Many avec `StereotypeRelationType`
- `elementStereotypes` : One-to-Many avec `ElementStereotype`
- `relationshipStereotypes` : One-to-Many avec `RelationshipStereotype`

**Index :**
- UNIQUE sur `name`

**Format `propertiesSchema` (JSONB) :**
```json
{
  "type": "object",
  "properties": {
    "priority": { "type": "string", "enum": ["Low", "Medium", "High"] },
    "owner": { "type": "string" },
    "cost": { "type": "number" }
  },
  "required": ["priority"]
}
```

---

#### `StereotypeConceptType`
Table de liaison Many-to-Many entre `Stereotype` et `ConceptType`.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `stereotypeId` | UUID | FOREIGN KEY → Stereotype.id, ON DELETE CASCADE | Stéréotype |
| `conceptTypeId` | UUID | FOREIGN KEY → ConceptType.id, ON DELETE CASCADE | Type de concept |
| `createdAt` | TIMESTAMP | DEFAULT now() | Date de création |

**Relations :**
- `stereotype` : Many-to-One avec `Stereotype`
- `conceptType` : Many-to-One avec `ConceptType`

**Index :**
- UNIQUE sur `(stereotypeId, conceptTypeId)`

---

#### `StereotypeRelationType`
Table de liaison Many-to-Many entre `Stereotype` et `RelationType`.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `stereotypeId` | UUID | FOREIGN KEY → Stereotype.id, ON DELETE CASCADE | Stéréotype |
| `relationTypeId` | UUID | FOREIGN KEY → RelationType.id, ON DELETE CASCADE | Type de relation |
| `createdAt` | TIMESTAMP | DEFAULT now() | Date de création |

**Relations :**
- `stereotype` : Many-to-One avec `Stereotype`
- `relationType` : Many-to-One avec `RelationType`

**Index :**
- UNIQUE sur `(stereotypeId, relationTypeId)`

---

#### `ElementStereotype`
Instance d'application d'un stéréotype à un élément.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `elementId` | UUID | FOREIGN KEY → Element.id, ON DELETE CASCADE | Élément |
| `stereotypeId` | UUID | FOREIGN KEY → Stereotype.id, ON DELETE CASCADE | Stéréotype |
| `extendedProperties` | JSONB | NULLABLE | Propriétés étendues (selon propertiesSchema) |
| `createdAt` | TIMESTAMP | DEFAULT now() | Date de création |
| `updatedAt` | TIMESTAMP | DEFAULT now(), AUTO UPDATE | Date de modification |

**Relations :**
- `element` : Many-to-One avec `Element`
- `stereotype` : Many-to-One avec `Stereotype`

**Index :**
- UNIQUE sur `(elementId, stereotypeId)`

---

#### `RelationshipStereotype`
Instance d'application d'un stéréotype à une relation.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `relationshipId` | UUID | FOREIGN KEY → Relationship.id, ON DELETE CASCADE | Relation |
| `stereotypeId` | UUID | FOREIGN KEY → Stereotype.id, ON DELETE CASCADE | Stéréotype |
| `extendedProperties` | JSONB | NULLABLE | Propriétés étendues |
| `createdAt` | TIMESTAMP | DEFAULT now() | Date de création |
| `updatedAt` | TIMESTAMP | DEFAULT now(), AUTO UPDATE | Date de modification |

**Relations :**
- `relationship` : Many-to-One avec `Relationship`
- `stereotype` : Many-to-One avec `Stereotype`

**Index :**
- UNIQUE sur `(relationshipId, stereotypeId)`

---

### 5. Workflow

#### `ChangeRequest`
Représente une demande de changement pour un package de modèle.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `title` | TEXT | NOT NULL | Titre de la demande |
| `description` | TEXT | NULLABLE | Description détaillée |
| `status` | WorkflowStatus | DEFAULT 'IN_REVIEW' | Statut de la demande |
| `modelPackageId` | UUID | FOREIGN KEY → ModelPackage.id | Package concerné |
| `requesterId` | UUID | FOREIGN KEY → User.id | Demandeur |
| `reviewerId` | UUID | FOREIGN KEY → User.id, NULLABLE | Examinateur |
| `createdAt` | TIMESTAMP | DEFAULT now() | Date de création |
| `updatedAt` | TIMESTAMP | DEFAULT now(), AUTO UPDATE | Date de modification |

**Relations :**
- `modelPackage` : Many-to-One avec `ModelPackage`
- `requester` : Many-to-One avec `User`
- `reviewer` : Many-to-One avec `User` (optionnel)

---

### 6. Intégration

#### `DataSource`
Définit une source de données externe pour synchronisation.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid() | Identifiant unique |
| `name` | TEXT | UNIQUE, NOT NULL | Nom de la source |
| `type` | TEXT | NOT NULL | Type (ex: 'ServiceNow', 'Excel', 'CSV') |
| `config` | JSONB | NOT NULL | Configuration (URL, credentials, etc.) |
| `mapping` | JSONB | NULLABLE | Configuration de mapping des colonnes |
| `schedule` | TEXT | NULLABLE | Expression cron pour synchronisation auto |
| `lastSync` | TIMESTAMP | NULLABLE | Date de dernière synchronisation |
| `createdAt` | TIMESTAMP | DEFAULT now() | Date de création |
| `updatedAt` | TIMESTAMP | DEFAULT now(), AUTO UPDATE | Date de modification |

**Relations :**
- `elements` : One-to-Many avec `Element`

**Index :**
- UNIQUE sur `name`

**Format `config` (JSONB) :**
```json
{
  "url": "https://api.example.com",
  "credentials": {
    "username": "user",
    "password": "encrypted"
  },
  "options": {}
}
```

---

### 7. Configuration

#### `SystemSetting`
Stocke les paramètres système configurables.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `key` | TEXT | PRIMARY KEY | Clé du paramètre |
| `value` | JSONB | NOT NULL | Valeur du paramètre |
| `description` | TEXT | NULLABLE | Description du paramètre |
| `updatedAt` | TIMESTAMP | DEFAULT now(), AUTO UPDATE | Date de modification |

**Exemples de clés :**
- `palette.enabledConcepts` : Liste des concepts ArchiMate activés dans la palette
- `collaboration.enabled` : Activation de la collaboration en temps réel
- `export.formats` : Formats d'export disponibles

---

## Tables de Liaison (Many-to-Many)

### `_RoleToUser`
Liaison entre `Role` et `User`.

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `A` | UUID | FOREIGN KEY → Role.id |
| `B` | UUID | FOREIGN KEY → User.id |

**Index :**
- UNIQUE sur `(A, B)`

---

### `_PermissionToRole`
Liaison entre `Permission` et `Role`.

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `A` | UUID | FOREIGN KEY → Permission.id |
| `B` | UUID | FOREIGN KEY → Role.id |

**Index :**
- UNIQUE sur `(A, B)`

---

### `_GroupToUser`
Liaison entre `Group` et `User`.

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `A` | UUID | FOREIGN KEY → Group.id |
| `B` | UUID | FOREIGN KEY → User.id |

**Index :**
- UNIQUE sur `(A, B)`

---

### `_SourceRules`
Liaison entre `ConceptType` (source) et `RelationType`.

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `A` | UUID | FOREIGN KEY → ConceptType.id |
| `B` | UUID | FOREIGN KEY → RelationType.id |

**Index :**
- UNIQUE sur `(A, B)`

---

### `_TargetRules`
Liaison entre `ConceptType` (cible) et `RelationType`.

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `A` | UUID | FOREIGN KEY → ConceptType.id |
| `B` | UUID | FOREIGN KEY → RelationType.id |

**Index :**
- UNIQUE sur `(A, B)`

---

## Contraintes d'Intégrité

### Clés Étrangères avec CASCADE

Les suppressions en cascade sont configurées pour :
- `StereotypeConceptType` : Suppression si `Stereotype` ou `ConceptType` est supprimé
- `StereotypeRelationType` : Suppression si `Stereotype` ou `RelationType` est supprimé
- `ElementStereotype` : Suppression si `Element` ou `Stereotype` est supprimé
- `RelationshipStereotype` : Suppression si `Relationship` ou `Stereotype` est supprimé

### Contraintes Métier

1. **Isolation par Package** : Tous les éléments, relations, dossiers et vues d'un `ModelPackage` sont isolés. Une relation ne peut pas lier des éléments de packages différents.

2. **Validation des Relations** : Une `Relationship` ne peut être créée que si le `RelationType` autorise la combinaison `(source.conceptType, target.conceptType)` selon les règles du métamodèle.

3. **Versioning** : Les éléments et relations avec `validTo = NULL` sont considérés comme la version actuelle. Les versions historiques ont `validTo` défini.

4. **Hiérarchie de Dossiers** : Les dossiers forment une arborescence. Un dossier ne peut pas être son propre parent (contrainte à vérifier au niveau applicatif).

---

## Index et Performances

### Index Uniques
- `User.email`
- `Role.name`
- `Permission.name`
- `Group.name`
- `Metamodel.name`
- `ConceptType(name, metamodelId)`
- `RelationType(name, metamodelId)`
- `Stereotype.name`
- `DataSource.name`
- `StereotypeConceptType(stereotypeId, conceptTypeId)`
- `StereotypeRelationType(stereotypeId, relationTypeId)`
- `ElementStereotype(elementId, stereotypeId)`
- `RelationshipStereotype(relationshipId, stereotypeId)`

### Index Recommandés (à ajouter si nécessaire)

Pour optimiser les requêtes fréquentes :

```sql
-- Recherche d'éléments par package et dossier
CREATE INDEX idx_element_package_folder ON "Element"("modelPackageId", "folderId");

-- Recherche d'éléments par type de concept
CREATE INDEX idx_element_concept_type ON "Element"("conceptTypeId");

-- Recherche de relations par package
CREATE INDEX idx_relationship_package ON "Relationship"("modelPackageId");

-- Recherche de relations par source/target
CREATE INDEX idx_relationship_source ON "Relationship"("sourceId");
CREATE INDEX idx_relationship_target ON "Relationship"("targetId");

-- Versioning : recherche des versions actuelles
CREATE INDEX idx_element_current_version ON "Element"("versionId", "validTo") WHERE "validTo" IS NULL;
CREATE INDEX idx_relationship_current_version ON "Relationship"("versionId", "validTo") WHERE "validTo" IS NULL;

-- Recherche de vues par package
CREATE INDEX idx_view_package ON "View"("modelPackageId");

-- Notifications : récupération par utilisateur et statut de lecture
CREATE INDEX idx_notification_user ON "Notification"("userId");
CREATE INDEX idx_notification_read ON "Notification"("read");
CREATE INDEX idx_notification_user_read ON "Notification"("userId", "read");
CREATE INDEX idx_notification_created ON "Notification"("createdAt" DESC);
```

---

## Types de Données Spéciaux

### JSONB

Les colonnes `JSONB` sont utilisées pour stocker des données flexibles :

- **`Element.properties`** : Propriétés additionnelles d'un élément
- **`Relationship.properties`** : Propriétés additionnelles d'une relation
- **`View.content`** : Données de layout (nodes, edges, positions)
- **`Stereotype.propertiesSchema`** : Schéma JSON pour validation
- **`ElementStereotype.extendedProperties`** : Propriétés étendues selon le schéma
- **`RelationshipStereotype.extendedProperties`** : Propriétés étendues selon le schéma
- **`DataSource.config`** : Configuration de la source de données
- **`DataSource.mapping`** : Mapping des colonnes
- **`SystemSetting.value`** : Valeur du paramètre système
- **`Notification.metadata`** : Métadonnées optionnelles (ex: changeRequestId, elementId, viewId)

**Avantages du JSONB :**
- Indexation et recherche efficaces
- Validation de structure JSON
- Requêtes SQL sur les propriétés JSON

### Enums

- **`WorkflowStatus`** : Statut du workflow (`DRAFT`, `IN_REVIEW`, `APPROVED`, `PUBLISHED`, `ARCHIVED`)

---

## Diagramme de Relations (Vue d'ensemble)

```
User ──┬── Role (Many-to-Many)
       ├── Group (Many-to-Many)
       ├── ChangeRequest (requester)
       ├── ChangeRequest (reviewer)
       └── Notification

Role ── Permission (Many-to-Many)

ModelPackage ──┬── Element
               ├── Relationship
               ├── Folder
               ├── View
               └── ChangeRequest

Metamodel ──┬── ConceptType
            └── RelationType

ConceptType ──┬── Element
              ├── RelationType (source rules, Many-to-Many)
              └── Stereotype (Many-to-Many via StereotypeConceptType)

RelationType ──┬── Relationship
               ├── ConceptType (source/target rules, Many-to-Many)
               └── Stereotype (Many-to-Many via StereotypeRelationType)

Element ──┬── Relationship (source)
          ├── Relationship (target)
          ├── Folder
          ├── DataSource
          └── Stereotype (Many-to-Many via ElementStereotype)

Relationship ── Stereotype (Many-to-Many via RelationshipStereotype)

Folder ──┬── Folder (parent/children, self-reference)
         ├── Element
         └── View

Stereotype ──┬── ConceptType (Many-to-Many)
             ├── RelationType (Many-to-Many)
             ├── Element (Many-to-Many via ElementStereotype)
             └── Relationship (Many-to-Many via RelationshipStereotype)
```

---

## Notes d'Implémentation

### Versioning (Time Travel)

Le système de versioning permet de :
- Conserver l'historique complet des modifications
- Restaurer des versions antérieures
- Analyser l'évolution des modèles dans le temps

**Stratégie :**
- Lors d'une modification, créer une nouvelle version avec `validTo = NULL`
- Mettre à jour l'ancienne version avec `validTo = now()`
- `versionId` reste constant pour toutes les versions d'un même élément logique

### Isolation par Package

Tous les objets (éléments, relations, dossiers, vues) sont strictement isolés par `modelPackageId`. Cela permet :
- Séparation des modèles d'architecture
- Gestion de permissions par package
- Export/import indépendants

### Stéréotypes

Le système de stéréotypes permet :
- Étendre les propriétés des éléments/relations
- Appliquer des règles métier spécifiques
- Personnaliser l'affichage et le comportement

**Workflow :**
1. Définir un `Stereotype` avec `propertiesSchema`
2. Lier le stéréotype aux types applicables (`StereotypeConceptType` / `StereotypeRelationType`)
3. Appliquer le stéréotype à une instance (`ElementStereotype` / `RelationshipStereotype`)
4. Renseigner les `extendedProperties` selon le schéma

---

## Migration et Maintenance

### Scripts de Migration

Les migrations Prisma sont stockées dans `packages/database/prisma/migrations/`.

### Seed Data

Le script de seed (`packages/database/prisma/seed.ts`) initialise :
- Rôles par défaut
- Utilisateur administrateur
- Métamodèle ArchiMate de base

### Backup Recommandé

- Sauvegarde quotidienne de la base PostgreSQL
- Conservation des backups pendant 30 jours minimum
- Test de restauration mensuel

---

## Références

- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Spécification ArchiMate](https://www.opengroup.org/archimate-forum/archimate-overview)

---

*Document généré le : 2025-11-29*
*Version du schéma : 1.0*

