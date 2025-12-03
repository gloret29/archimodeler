# Configuration des Services - Référence Rapide

Ce document liste la configuration spécifique de chaque service pour faciliter la création des fichiers docker-compose.yml.

## Services avec Base de Données PostgreSQL

### IAM Service
- **Port PostgreSQL**: 5433
- **Database**: iam
- **Tables**: User, Role, Permission, Group, _RoleToUser, _PermissionToRole, _GroupToUser
- **Variables**: DATABASE_URL, JWT_SECRET, NATS_URL

### Modeling Service
- **Port PostgreSQL**: 5434
- **Database**: modeling
- **Tables**: ModelPackage, Element, Relationship, View, Folder
- **Variables**: DATABASE_URL, NATS_URL, REDIS_URL, OPENSEARCH_URL

### Comments Service
- **Port PostgreSQL**: 5435
- **Database**: comments
- **Tables**: CommentThread, Comment, CommentMention
- **Variables**: DATABASE_URL, NATS_URL, REDIS_URL

### Notifications Service
- **Port PostgreSQL**: 5436
- **Database**: notifications
- **Tables**: Notification
- **Variables**: DATABASE_URL, NATS_URL, REDIS_URL

### Workflow Service
- **Port PostgreSQL**: 5437
- **Database**: workflow
- **Tables**: ChangeRequest
- **Variables**: DATABASE_URL, NATS_URL

### Stereotypes Service
- **Port PostgreSQL**: 5438
- **Database**: stereotypes
- **Tables**: Stereotype, ElementStereotype, RelationshipStereotype, StereotypeConceptType, StereotypeRelationType
- **Variables**: DATABASE_URL, NATS_URL

### Connectors Service
- **Port PostgreSQL**: 5439
- **Database**: connectors
- **Tables**: DataSource
- **Variables**: DATABASE_URL, NATS_URL

### Settings Service
- **Port PostgreSQL**: 5440
- **Database**: settings
- **Tables**: SystemSetting
- **Variables**: DATABASE_URL

### Metamodel Service
- **Port PostgreSQL**: 5441
- **Database**: metamodel
- **Tables**: Metamodel, ConceptType, RelationType, _SourceRules, _TargetRules
- **Variables**: DATABASE_URL, NATS_URL

## Services Stateless

### Collaboration Service
- **Pas de base de données** (utilise Redis pour sessions)
- **Variables**: REDIS_URL, NATS_URL, JWT_SECRET
- **WebSocket**: Support Socket.io sur /socket.io

### Search Service
- **Pas de base de données** (utilise OpenSearch)
- **Variables**: OPENSEARCH_URL, NATS_URL

### AI Service
- **Pas de base de données** (stateless)
- **Variables**: OPENAI_API_KEY, NATS_URL

### Scripting Service
- **Pas de base de données** (stateless)
- **Variables**: NATS_URL

## Exemple de Configuration par Service

### Service avec Base de Données

```yaml
environment:
  - DATABASE_URL=postgresql://${POSTGRES_SERVICE_USER}:${POSTGRES_SERVICE_PASSWORD}@${LXC_INFRASTRUCTURE_IP}:PORT/${POSTGRES_SERVICE_DB}
  - NATS_URL=${NATS_URL}
  - REDIS_URL=${REDIS_URL}
```

### Service Stateless

```yaml
environment:
  - NATS_URL=${NATS_URL}
  - REDIS_URL=${REDIS_URL}
  - JWT_SECRET=${JWT_SECRET}
```

### Service avec WebSocket

```yaml
labels:
  # ... autres labels ...
  - "traefik.http.routers.SERVICE_NAME-ws.rule=Host(\`${GATEWAY_DOMAIN}\`) && PathPrefix(\`/socket.io\`)"
  - "traefik.http.routers.SERVICE_NAME-ws.entrypoints=websecure"
  - "traefik.http.routers.SERVICE_NAME-ws.tls.certresolver=letsencrypt"
  - "traefik.http.services.SERVICE_NAME-ws.loadbalancer.server.port=3000"
```

## Ports PostgreSQL par Service

| Service | Port | Database |
|---------|------|----------|
| IAM | 5433 | iam |
| Modeling | 5434 | modeling |
| Comments | 5435 | comments |
| Notifications | 5436 | notifications |
| Workflow | 5437 | workflow |
| Stereotypes | 5438 | stereotypes |
| Connectors | 5439 | connectors |
| Settings | 5440 | settings |
| Metamodel | 5441 | metamodel |

## Chemins API

| Service | Path |
|---------|------|
| IAM | /api/iam |
| Modeling | /api/modeling |
| Collaboration | /api/collaboration |
| Comments | /api/comments |
| Notifications | /api/notifications |
| Workflow | /api/workflow |
| Stereotypes | /api/stereotypes |
| Search | /api/search |
| Connectors | /api/connectors |
| AI | /api/ai |
| Scripting | /api/scripting |
| Settings | /api/settings |
| Metamodel | /api/metamodel |




