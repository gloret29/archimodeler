# Guide de Déploiement - Migration Microservices Option 3

Guide complet pour déployer l'architecture microservices avec chaque service dans son propre LXC Proxmox.

## Table des Matières

1. [Prérequis](#prérequis)
2. [Préparation](#préparation)
3. [Déploiement de l'Infrastructure](#déploiement-de-linfrastructure)
4. [Déploiement des Services](#déploiement-des-services)
5. [Configuration du Réseau](#configuration-du-réseau)
6. [Migration des Données](#migration-des-données)
7. [Vérification](#vérification)
8. [Maintenance](#maintenance)

## Prérequis

### Serveur Proxmox

- Proxmox VE 7.x ou 8.x installé
- Accès root ou sudo sur Proxmox
- Template Ubuntu 22.04 disponible
- Au moins 64 GB RAM disponible
- Au moins 500 GB espace disque SSD
- Réseau configuré (bridge vmbr0)

### Ressources Requises

| Composant | RAM | CPU | Disque |
|-----------|-----|-----|--------|
| Infrastructure | 8 GB | 4 cores | 100 GB |
| API Gateway | 1 GB | 2 cores | 20 GB |
| Services (standard) | 2 GB | 2 cores | 50 GB |
| Modeling Service | 4 GB | 4 cores | 100 GB |
| Collaboration Service | 2 GB | 2 cores | 30 GB |
| Observabilité | 4 GB | 2 cores | 100 GB |
| **TOTAL** | **~50 GB** | **~30 cores** | **~500 GB** |

## Préparation

### 1. Cloner le Projet

```bash
# Sur le serveur Proxmox
cd /opt
git clone <repository-url> archimodeler-migration
cd archimodeler-migration/migration-microservices
```

### 2. Configurer les Variables d'Environnement

```bash
# Copier le template
cp config/env.template config/.env

# Éditer la configuration
nano config/.env
```

**Points importants à configurer** :
- `PROXMOX_NODE` : Nom de votre nœud Proxmox
- `PROXMOX_STORAGE` : Stockage à utiliser
- `NETWORK_BASE` : Réseau de base (ex: 10.0.0)
- `LXC_*_IP` : IPs de chaque LXC
- Tous les mots de passe (générer avec `openssl rand -base64 32`)

### 3. Générer les Secrets

```bash
# Générer JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET" >> config/.env

# Générer les mots de passe PostgreSQL
for service in IAM MODELING COMMENTS NOTIFICATIONS WORKFLOW STEREOTYPES CONNECTORS SETTINGS METAMODEL; do
    PASSWORD=$(openssl rand -base64 32)
    echo "POSTGRES_${service}_PASSWORD=$PASSWORD" >> config/.env
done

# Générer NATS et Redis passwords
echo "NATS_PASSWORD=$(openssl rand -base64 32)" >> config/.env
echo "REDIS_PASSWORD=$(openssl rand -base64 32)" >> config/.env
```

### 4. Rendre les Scripts Exécutables

```bash
chmod +x scripts/*.sh
chmod +x data-migration/*.sh
```

## Déploiement de l'Infrastructure

### Étape 1 : Créer le LXC Infrastructure

```bash
./scripts/create-lxc-service.sh infrastructure 100 10.0.0.10 8192 4 100
```

### Étape 2 : Déployer l'Infrastructure

```bash
# Copier les fichiers
pct push 100 services/infrastructure /opt/infrastructure
pct push 100 config/.env /opt/infrastructure/.env

# Déployer
pct exec 100 -- bash -c "
    cd /opt/infrastructure
    docker compose up -d
"
```

### Étape 3 : Vérifier l'Infrastructure

```bash
# Vérifier les containers
pct exec 100 -- docker compose ps

# Vérifier PostgreSQL
pct exec 100 -- docker exec postgres-iam pg_isready -U iam_user

# Vérifier NATS
curl http://10.0.0.10:8222/healthz

# Vérifier Redis
pct exec 100 -- docker exec redis redis-cli -a $REDIS_PASSWORD ping
```

## Déploiement des Services

### Déploiement Automatique

```bash
# Déployer tous les services
./scripts/deploy-all.sh
```

### Déploiement Manuel

Pour chaque service :

```bash
# 1. Créer le LXC
./scripts/create-lxc-service.sh <service-name> <lxc-id> <lxc-ip> <memory> <cores> <disk>

# 2. Copier les fichiers
pct push <lxc-id> services/<service-name> /opt/service
pct push <lxc-id> config/.env /opt/service/.env

# 3. Déployer
pct exec <lxc-id> -- bash -c "
    cd /opt/service
    docker compose pull
    docker compose up -d
"
```

### Ordre de Déploiement Recommandé

1. **Infrastructure** (LXC 100)
2. **API Gateway** (LXC 101)
3. **Metamodel** (LXC 114) - Pas de dépendances
4. **IAM** (LXC 102) - Base pour authentification
5. **Settings** (LXC 113) - Configuration
6. **Stereotypes** (LXC 108)
7. **Modeling** (LXC 103) - Service critique
8. **Comments** (LXC 105)
9. **Notifications** (LXC 106)
10. **Workflow** (LXC 107)
11. **Collaboration** (LXC 104) - WebSocket
12. **Search** (LXC 109)
13. **Connectors** (LXC 110)
14. **AI** (LXC 111)
15. **Scripting** (LXC 112)
16. **Observabilité** (LXC 115)

## Configuration du Réseau

### Vérifier la Connectivité

```bash
# Depuis chaque LXC, tester la connexion à l'infrastructure
pct exec <lxc-id> -- ping -c 3 10.0.0.10

# Tester les ports
pct exec <lxc-id> -- nc -zv 10.0.0.10 5433  # PostgreSQL IAM
pct exec <lxc-id> -- nc -zv 10.0.0.10 4222  # NATS
pct exec <lxc-id> -- nc -zv 10.0.0.10 6379  # Redis
```

### Configuration Firewall Proxmox

```bash
# Autoriser la communication entre LXC
iptables -I FORWARD -s 10.0.0.0/24 -d 10.0.0.0/24 -j ACCEPT
```

## Migration des Données

Voir [data-migration/README.md](./data-migration/README.md) pour les détails complets.

### Résumé

```bash
cd data-migration

# 1. Exporter depuis le monolithe
./export-monolith.sh

# 2. Migrer chaque service
./migrate-iam.sh
./migrate-metamodel.sh
./migrate-modeling.sh
# ... etc

# 3. Vérifier
./verify-migration.sh
```

## Vérification

### Vérifier les Services

```bash
# Liste des LXC
pct list

# Statut des containers dans chaque LXC
for id in 100 101 102 103 104 105 106 107 108 109 110 111 112 113 114 115; do
    echo "=== LXC $id ==="
    pct exec $id -- docker compose ps 2>/dev/null || echo "Non déployé"
done
```

### Tester les APIs

```bash
# Health check via API Gateway
curl http://10.0.0.11/health

# Test IAM
curl http://10.0.0.11/api/iam/health

# Test Modeling
curl http://10.0.0.11/api/modeling/health
```

### Vérifier les Logs

```bash
# Logs d'un service
pct exec <lxc-id> -- docker compose logs -f <service-name>
```

## Maintenance

### Mettre à Jour un Service

```bash
# Accéder au LXC
pct enter <lxc-id>

# Mettre à jour
cd /opt/service
git pull
docker compose pull
docker compose up -d --build
```

### Redémarrer un Service

```bash
pct exec <lxc-id> -- docker compose restart
```

### Sauvegarder

```bash
# Sauvegarder un LXC
vzdump <lxc-id> --storage local --compress gzip

# Sauvegarder les bases de données
pct exec 100 -- docker exec postgres-iam pg_dump -U iam_user iam > backup_iam.sql
```

### Monitoring

Accéder à Grafana :
- URL: http://10.0.0.25:3000
- User: admin
- Password: (configuré dans .env)

## Dépannage

### Service ne démarre pas

```bash
# Vérifier les logs
pct exec <lxc-id> -- docker compose logs

# Vérifier la configuration
pct exec <lxc-id> -- cat /opt/service/.env

# Vérifier la connectivité
pct exec <lxc-id> -- ping 10.0.0.10
```

### Problème de réseau

```bash
# Vérifier l'IP
pct exec <lxc-id> -- ip addr show

# Vérifier la route
pct exec <lxc-id> -- ip route show

# Vérifier le DNS
pct exec <lxc-id> -- nslookup 10.0.0.10
```

### Problème de base de données

```bash
# Vérifier que PostgreSQL est démarré
pct exec 100 -- docker ps | grep postgres

# Vérifier la connexion
pct exec 100 -- docker exec postgres-iam psql -U iam_user -d iam -c "SELECT 1;"
```

## Support

Pour plus d'informations :
- [README.md](./README.md) - Vue d'ensemble
- [ETUDE_MICROSERVICES.md](../ETUDE_MICROSERVICES.md) - Étude complète




