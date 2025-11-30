#!/bin/bash

# Script d'installation ArchiModeler dans un container LXC existant
# Usage: pct push [container-id] scripts/install-in-container.sh /tmp/install.sh
#        pct exec [container-id] -- bash /tmp/install.sh

set -e

PROJECT_DIR="/opt/archimodeler"

echo "=== Installation d'ArchiModeler dans le container ==="

# Mise à jour du système
echo "Mise à jour du système..."
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y

# Installation des dépendances
echo "Installation des dépendances..."
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    ca-certificates \
    gnupg \
    lsb-release \
    postgresql-client \
    docker.io \
    docker-compose \
    nginx \
    certbot \
    python3-certbot-nginx

# Installation de Node.js 20.x
echo "Installation de Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Configuration de Docker
echo "Configuration de Docker..."
systemctl enable docker
systemctl start docker

# Créer le répertoire du projet
mkdir -p $PROJECT_DIR
cd /opt

# Si le projet n'existe pas encore, créer la structure
if [ ! -d "$PROJECT_DIR/.git" ]; then
    echo "Le projet doit être copié dans $PROJECT_DIR"
    echo "Utilisez: pct push [container-id] /chemin/vers/projet $PROJECT_DIR"
    exit 1
fi

cd $PROJECT_DIR

# Installer les dépendances
echo "Installation des dépendances npm..."
npm install

# Générer le client Prisma
echo "Génération du client Prisma..."
cd packages/database
npx prisma generate
cd ../..

# Démarrer les services Docker
echo "Démarrage des services Docker..."
docker-compose up -d

# Attendre que PostgreSQL soit prêt
echo "Attente du démarrage de PostgreSQL..."
sleep 10

# Exécuter les migrations
echo "Exécution des migrations..."
cd packages/database
npx prisma migrate deploy
cd ../..

# Compiler le projet
echo "Compilation du projet..."
npm run build

echo "=== Installation terminée ==="
echo ""
echo "N'oubliez pas de:"
echo "1. Configurer les fichiers .env dans apps/server, apps/web et packages/database"
echo "2. Configurer les services systemd (voir DEPLOY_PROXMOX.md)"
echo "3. Configurer Nginx (voir DEPLOY_PROXMOX.md)"

