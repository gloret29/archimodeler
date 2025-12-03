# Migration des Données - Monolithe vers Microservices

Ce dossier contient les scripts et procédures pour migrer les données depuis le monolithe vers les microservices.

## Vue d'Ensemble

La migration des données consiste à :
1. Exporter les données depuis la base PostgreSQL monolithique
2. Séparer les données par service
3. Importer les données dans les nouvelles bases de données

## Structure des Scripts

```
data-migration/
├── README.md                    # Ce fichier
├── export-monolith.sh           # Export depuis le monolithe
├── split-database.sql           # Scripts SQL de séparation
├── migrate-iam.sh               # Migration IAM
├── migrate-modeling.sh          # Migration Modeling
├── migrate-comments.sh          # Migration Comments
├── migrate-notifications.sh     # Migration Notifications
├── migrate-workflow.sh          # Migration Workflow
└── verify-migration.sh          # Vérification de la migration
```

## Procédure de Migration

### Étape 1 : Backup de la Base Monolithique

```bash
# Sur le serveur Proxmox du monolithe
docker exec archimodeler-postgres-1 pg_dump -U user archimodeler > backup_monolith_$(date +%Y%m%d_%H%M%S).sql
```

### Étape 2 : Export des Données

```bash
cd data-migration
./export-monolith.sh
```

### Étape 3 : Migration par Service

Migrer les services dans l'ordre suivant :

1. **IAM** (Users, Roles, Permissions)
```bash
./migrate-iam.sh
```

2. **Metamodel** (Metamodel, ConceptType, RelationType)
```bash
./migrate-metamodel.sh
```

3. **Modeling** (Elements, Relationships, Views, Packages, Folders)
```bash
./migrate-modeling.sh
```

4. **Stereotypes** (Stereotype, ElementStereotype, RelationshipStereotype)
```bash
./migrate-stereotypes.sh
```

5. **Comments** (CommentThread, Comment, CommentMention)
```bash
./migrate-comments.sh
```

6. **Notifications** (Notification)
```bash
./migrate-notifications.sh
```

7. **Workflow** (ChangeRequest)
```bash
./migrate-workflow.sh
```

8. **Settings** (SystemSetting)
```bash
./migrate-settings.sh
```

9. **Connectors** (DataSource)
```bash
./migrate-connectors.sh
```

### Étape 4 : Vérification

```bash
./verify-migration.sh
```

## Scripts SQL de Séparation

Les scripts SQL dans `split-database.sql` contiennent les requêtes pour :
- Extraire les données par table
- Créer les schémas dans les nouvelles bases
- Insérer les données dans les nouvelles bases

## Notes Importantes

1. **Downtime** : La migration nécessite un downtime planifié
2. **Vérification** : Vérifier chaque service après migration
3. **Rollback** : Garder le backup monolithique pour rollback si nécessaire
4. **Relations** : Les relations entre services doivent être gérées via APIs ou événements

## Relations Inter-Services

Après la migration, les relations entre services sont gérées via :
- **APIs** : Appels HTTP entre services
- **Événements** : Communication asynchrone via NATS
- **IDs** : Les IDs UUID sont conservés pour référence




