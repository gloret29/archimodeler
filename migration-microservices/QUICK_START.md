# Quick Start - Migration Microservices

Guide rapide pour démarrer la migration vers les microservices.

## Prérequis

- Serveur Proxmox avec au moins 64 GB RAM et 500 GB disque
- Accès root
- Template Ubuntu 22.04

## Déploiement en 5 Étapes

### 1. Préparer l'Environnement

```bash
cd /opt
git clone <repo> archimodeler-migration
cd archimodeler-migration/migration-microservices

# Configurer
cp config/env.template config/.env
nano config/.env  # Éditer les valeurs

# Générer les secrets
./scripts/generate-secrets.sh  # À créer si nécessaire
```

### 2. Déployer l'Infrastructure

```bash
# Créer et déployer l'infrastructure (PostgreSQL, NATS, Redis, OpenSearch)
./scripts/create-lxc-service.sh infrastructure 100 10.0.0.10 8192 4 100
pct push 100 services/infrastructure /opt/infrastructure
pct push 100 config/.env /opt/infrastructure/.env
pct exec 100 -- bash -c "cd /opt/infrastructure && docker compose up -d"
```

### 3. Déployer l'API Gateway

```bash
# Créer et déployer Traefik
./scripts/create-lxc-service.sh gateway 101 10.0.0.11 1024 2 20
pct push 101 services/gateway /opt/gateway
pct push 101 config/.env /opt/gateway/.env
pct exec 101 -- bash -c "cd /opt/gateway && docker compose up -d"
```

### 4. Déployer Tous les Services

```bash
# Déploiement automatique de tous les services
./scripts/deploy-all.sh
```

### 5. Vérifier

```bash
# Vérifier la santé de tous les services
./scripts/health-check.sh

# Tester l'API Gateway
curl http://10.0.0.11/health
```

## Migration des Données

```bash
cd data-migration

# Exporter depuis le monolithe
./export-monolith.sh

# Migrer chaque service (dans l'ordre)
./migrate-iam.sh
./migrate-metamodel.sh
./migrate-modeling.sh
# ... etc
```

## Commandes Utiles

### Voir les Logs

```bash
# Logs d'un service
pct exec <lxc-id> -- docker compose logs -f
```

### Redémarrer un Service

```bash
pct exec <lxc-id> -- docker compose restart
```

### Mettre à Jour un Service

```bash
pct enter <lxc-id>
cd /opt/service
git pull
docker compose pull
docker compose up -d --build
```

### Sauvegarder

```bash
# Sauvegarder tous les services
./scripts/backup-all.sh
```

## Prochaines Étapes

1. Lire [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) pour les détails complets
2. Configurer le monitoring dans Grafana
3. Configurer les alertes
4. Tester les fonctionnalités
5. Migrer progressivement les utilisateurs

## Support

- [README.md](./README.md) - Vue d'ensemble
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Guide complet
- [SERVICES_CONFIG.md](./SERVICES_CONFIG.md) - Configuration des services




