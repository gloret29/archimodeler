# Migration Microservices - Option 3 : Services dans LXC/VMs Séparés

Ce dossier contient tous les éléments nécessaires pour migrer ArchiModeler vers une architecture microservices avec chaque service dans son propre LXC Proxmox.

## Architecture

```
Proxmox
├── LXC 100 : Infrastructure (PostgreSQL, NATS, Redis, OpenSearch)
├── LXC 101 : API Gateway (Traefik)
├── LXC 102 : IAM Service
├── LXC 103 : Modeling Service
├── LXC 104 : Collaboration Service
├── LXC 105 : Comments Service
├── LXC 106 : Notifications Service
├── LXC 107 : Workflow Service
├── LXC 108 : Stereotypes Service
├── LXC 109 : Search Service
├── LXC 110 : Connectors Service
├── LXC 111 : AI Service
├── LXC 112 : Scripting Service
├── LXC 113 : Settings Service
├── LXC 114 : Metamodel Service
└── LXC 115 : Observabilité (Prometheus, Grafana)
```

## Structure des Dossiers

```
migration-microservices/
├── README.md                          # Ce fichier
├── DEPLOYMENT_GUIDE.md                # Guide de déploiement complet
├── scripts/
│   ├── deploy-all.sh                  # Script principal de déploiement
│   ├── create-lxc-infrastructure.sh   # Création LXC Infrastructure
│   ├── create-lxc-gateway.sh          # Création LXC API Gateway
│   ├── create-lxc-service.sh          # Template création LXC service
│   └── migrate-data.sh                # Script de migration des données
├── services/
│   ├── infrastructure/                # LXC Infrastructure
│   ├── gateway/                       # LXC API Gateway
│   ├── iam/                           # LXC IAM Service
│   ├── modeling/                      # LXC Modeling Service
│   ├── collaboration/                 # LXC Collaboration Service
│   ├── comments/                      # LXC Comments Service
│   ├── notifications/                 # LXC Notifications Service
│   ├── workflow/                      # LXC Workflow Service
│   ├── stereotypes/                   # LXC Stereotypes Service
│   ├── search/                        # LXC Search Service
│   ├── connectors/                    # LXC Connectors Service
│   ├── ai/                            # LXC AI Service
│   ├── scripting/                     # LXC Scripting Service
│   ├── settings/                      # LXC Settings Service
│   ├── metamodel/                     # LXC Metamodel Service
│   └── observability/                 # LXC Observabilité
├── config/
│   ├── network.yml                    # Configuration réseau
│   ├── env.template                   # Template variables d'environnement
│   └── secrets.example                # Exemple de secrets
└── data-migration/
    ├── split-database.sql             # Scripts de séparation des bases
    └── migrate-service.sh             # Scripts de migration par service
```

## Prérequis

- Serveur Proxmox VE installé
- Accès root sur Proxmox
- Template Ubuntu 22.04 disponible
- Au moins 64 GB RAM disponible
- Au moins 500 GB espace disque
- Réseau configuré (bridge vmbr0)

## Déploiement Rapide

### 1. Préparer l'environnement

```bash
# Cloner ou copier ce dossier sur le serveur Proxmox
cd /opt/archimodeler-migration

# Rendre les scripts exécutables
chmod +x scripts/*.sh
```

### 2. Configurer les variables

```bash
# Copier et éditer le template d'environnement
cp config/env.template config/.env
nano config/.env

# Configurer les secrets
cp config/secrets.example config/secrets
nano config/secrets
```

### 3. Déployer tous les services

```bash
# Déploiement automatique de tous les LXC et services
./scripts/deploy-all.sh
```

### 4. Vérifier le déploiement

```bash
# Vérifier que tous les LXC sont démarrés
pct list

# Vérifier la santé des services
curl http://<gateway-ip>/health
```

## Déploiement Manuel

Voir [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) pour le guide complet de déploiement étape par étape.

## Migration des Données

Voir [data-migration/README.md](./data-migration/README.md) pour les instructions de migration des données depuis le monolithe.

## Maintenance

### Mettre à jour un service

```bash
# Accéder au LXC du service
pct enter <lxc-id>

# Mettre à jour le service
cd /opt/service
git pull
docker compose pull
docker compose up -d
```

### Voir les logs

```bash
# Logs d'un service spécifique
pct enter <lxc-id>
docker compose logs -f
```

### Redémarrer un service

```bash
pct enter <lxc-id>
docker compose restart
```

## Support

Pour plus d'informations, consultez :
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Guide de déploiement détaillé
- [ETUDE_MICROSERVICES.md](../ETUDE_MICROSERVICES.md) - Étude complète des microservices




