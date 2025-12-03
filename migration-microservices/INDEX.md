# Index des Fichiers - Migration Microservices

Index complet de tous les fichiers créés pour la migration vers l'option 3 (Services dans LXC séparés).

## Structure Complète

```
migration-microservices/
├── README.md                          ✅ Vue d'ensemble
├── QUICK_START.md                     ✅ Guide de démarrage rapide
├── DEPLOYMENT_GUIDE.md                ✅ Guide de déploiement complet
├── SERVICES_CONFIG.md                 ✅ Configuration des services
├── CHECKLIST.md                       ✅ Checklist de migration
├── INDEX.md                           ✅ Ce fichier
├── .gitignore                         ✅ Fichiers à ignorer
│
├── config/
│   ├── env.template                   ✅ Template de configuration
│   └── secrets.example                ✅ Exemple de secrets
│
├── scripts/
│   ├── deploy-all.sh                  ✅ Déploiement automatique
│   ├── create-lxc-service.sh          ✅ Création LXC service
│   ├── health-check.sh                ✅ Vérification santé
│   ├── backup-all.sh                  ✅ Sauvegarde complète
│   └── generate-service-files.sh      ✅ Génération fichiers service
│
├── services/
│   ├── infrastructure/
│   │   └── docker-compose.yml         ✅ Infrastructure (PostgreSQL, NATS, Redis, OpenSearch)
│   │
│   ├── gateway/
│   │   ├── docker-compose.yml         ✅ API Gateway (Traefik)
│   │   └── traefik/
│   │       └── traefik.yml            ✅ Configuration Traefik
│   │
│   ├── iam/
│   │   ├── Dockerfile                 ✅ Dockerfile IAM
│   │   └── docker-compose.yml         ✅ Configuration IAM
│   │
│   ├── modeling/
│   │   ├── Dockerfile                 ✅ Dockerfile Modeling
│   │   └── docker-compose.yml         ✅ Configuration Modeling
│   │
│   ├── collaboration/
│   │   └── docker-compose.yml         ✅ Configuration Collaboration
│   │
│   └── TEMPLATE/
│       ├── Dockerfile                 ✅ Template Dockerfile
│       └── docker-compose.yml         ✅ Template docker-compose
│
└── data-migration/
    ├── README.md                      ✅ Guide migration données
    └── export-monolith.sh             ✅ Export depuis monolithe
```

## Fichiers à Créer (Services Restants)

Les fichiers suivants doivent être créés pour chaque service restant en utilisant le template ou le script `generate-service-files.sh` :

### Services avec Base de Données

- [ ] `services/comments/Dockerfile`
- [ ] `services/comments/docker-compose.yml`
- [ ] `services/notifications/Dockerfile`
- [ ] `services/notifications/docker-compose.yml`
- [ ] `services/workflow/Dockerfile`
- [ ] `services/workflow/docker-compose.yml`
- [ ] `services/stereotypes/Dockerfile`
- [ ] `services/stereotypes/docker-compose.yml`
- [ ] `services/connectors/Dockerfile`
- [ ] `services/connectors/docker-compose.yml`
- [ ] `services/settings/Dockerfile`
- [ ] `services/settings/docker-compose.yml`
- [ ] `services/metamodel/Dockerfile`
- [ ] `services/metamodel/docker-compose.yml`

### Services Stateless

- [ ] `services/search/Dockerfile`
- [ ] `services/search/docker-compose.yml`
- [ ] `services/ai/Dockerfile`
- [ ] `services/ai/docker-compose.yml`
- [ ] `services/scripting/Dockerfile`
- [ ] `services/scripting/docker-compose.yml`

### Observabilité

- [ ] `services/observability/docker-compose.yml`

## Scripts de Migration de Données à Créer

- [ ] `data-migration/migrate-iam.sh`
- [ ] `data-migration/migrate-metamodel.sh`
- [ ] `data-migration/migrate-modeling.sh`
- [ ] `data-migration/migrate-comments.sh`
- [ ] `data-migration/migrate-notifications.sh`
- [ ] `data-migration/migrate-workflow.sh`
- [ ] `data-migration/migrate-stereotypes.sh`
- [ ] `data-migration/migrate-settings.sh`
- [ ] `data-migration/migrate-connectors.sh`
- [ ] `data-migration/verify-migration.sh`
- [ ] `data-migration/split-database.sql`

## Utilisation du Script de Génération

Pour générer automatiquement les fichiers manquants :

```bash
# Service avec base de données
./scripts/generate-service-files.sh comments /api/comments true 5435

# Service stateless
./scripts/generate-service-files.sh search /api/search false

# Puis adapter les fichiers générés selon vos besoins
```

## Prochaines Étapes

1. **Générer les fichiers manquants** avec le script ou manuellement
2. **Adapter les Dockerfiles** selon les besoins spécifiques de chaque service
3. **Configurer les variables d'environnement** dans chaque docker-compose.yml
4. **Tester chaque service** individuellement
5. **Créer les scripts de migration** de données
6. **Documenter les spécificités** de chaque service

## Notes

- Les templates dans `services/TEMPLATE/` peuvent être copiés et adaptés
- Le script `generate-service-files.sh` facilite la création des fichiers de base
- Chaque service peut nécessiter des adaptations spécifiques
- Vérifier `SERVICES_CONFIG.md` pour les configurations spécifiques




